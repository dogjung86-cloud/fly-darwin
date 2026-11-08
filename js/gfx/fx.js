// ===== 파티클 =====
// 불꽃, 파편, 연기, 궤적을 드로우콜 하나로 처리한다.
// 입자의 움직임은 정점 셰이더가 계산하므로 CPU는 생성 순간에만 일한다.
(function () {
  'use strict';

  var GFX = window.GFX;
  var fx = GFX.fx = {};

  var cap = 0, head = 0, points = null, attrs = {}, uniforms = null;
  var dirtyFrom = -1, dirtyTo = -1, wrapped = false;
  var simTime = 0;

  var VS = [
    'attribute vec3 aVel;',
    'attribute vec2 aLife;',    // 태어난 시각, 수명
    'attribute vec3 aSize;',    // 시작 크기, 끝 크기, 형태(0 부드러운 빛, 1 회전 사각 파편)
    'attribute vec4 aColor;',   // rgb, 가산 비율
    'attribute vec2 aPhys;',    // 중력, 공기저항
    'uniform float uTime, uPixel;',
    'varying vec4 vColor; varying float vShape; varying float vAlpha; varying float vSpin;',
    'void main() {',
    '  float age = uTime - aLife.x;',
    '  float k = age / aLife.y;',
    '  if ( k < 0.0 || k > 1.0 ) { gl_Position = vec4( 3.0, 3.0, 3.0, 1.0 ); gl_PointSize = 0.0; return; }',
    '  float drag = aPhys.y;',
    '  float travel = drag > 0.001 ? ( 1.0 - exp( -drag * age ) ) / drag : age;',
    '  vec3 p = position + aVel * travel;',
    '  p.y -= 0.5 * aPhys.x * age * age;',
    '  vec4 mv = viewMatrix * vec4( p, 1.0 );',
    '  float size = mix( aSize.x, aSize.y, k );',
    '  gl_PointSize = clamp( size * uPixel / -mv.z, 1.0, 256.0 );',
    '  vColor = aColor;',
    '  vShape = aSize.z;',
    '  vAlpha = 1.0 - k * k;',
    '  vSpin = age * ( 2.0 + aLife.y * 3.0 ) * ( fract( aLife.x * 7.13 ) - 0.5 ) * 8.0;',
    '  gl_Position = projectionMatrix * mv;',
    '}'
  ].join('\n');

  var FS = [
    'varying vec4 vColor; varying float vShape; varying float vAlpha; varying float vSpin;',
    GFX.outputChunk,
    'void main() {',
    '  vec2 c = gl_PointCoord - 0.5;',
    '  float a; vec3 col = vColor.rgb;',
    '  if ( vShape > 0.5 ) {',
    '    float cs = cos( vSpin ), sn = sin( vSpin );',
    '    vec2 r = vec2( cs * c.x - sn * c.y, sn * c.x + cs * c.y );',
    '    float d = max( abs( r.x ), abs( r.y ) );',
    '    a = 1.0 - smoothstep( 0.32, 0.4, d );',
    '    if ( a < 0.01 ) discard;',
    '    col *= 0.72 + 0.5 * step( 0.0, r.y + r.x * 0.4 );',
    '  } else {',
    '    float d = length( c ) * 2.0;',
    '    a = pow( max( 1.0 - d, 0.0 ), 1.8 );',
    '    if ( a < 0.004 ) discard;',
    '  }',
    '  a *= vAlpha;',
    '  gl_FragColor = vec4( gfxOut( col ) * a, a * ( 1.0 - vColor.a ) );',
    '}'
  ].join('\n');

  fx.init = function (scene) {
    cap = GFX.q.particles;
    function arr(n) { return new THREE.BufferAttribute(new Float32Array(cap * n), n); }
    attrs.position = arr(3); attrs.aVel = arr(3); attrs.aLife = arr(2); attrs.aSize = arr(3); attrs.aColor = arr(4); attrs.aPhys = arr(2);
    var g = new THREE.BufferGeometry();
    Object.keys(attrs).forEach(function (k) { g.addAttribute(k, attrs[k]); });
    for (var i = 0; i < cap; i++) attrs.aLife.array[i * 2] = -1000, attrs.aLife.array[i * 2 + 1] = 0.001;

    uniforms = { uTime: { type: 'f', value: 0 }, uPixel: { type: 'f', value: 500 } };
    var mat = new THREE.ShaderMaterial({
      uniforms: uniforms, vertexShader: VS, fragmentShader: FS, defines: GFX.defines(),
      transparent: true, depthWrite: false, fog: false,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor
    });
    points = new THREE.Points(g, mat);
    points.frustumCulled = false;
    points.renderOrder = 20;
    scene.add(points);
  };

  fx.advance = function (gameDtMs) { simTime += gameDtMs / 1000; };

  fx.update = function () {
    if (!points) return;
    uniforms.uTime.value = simTime;
    var h = GFX.renderer.getSize().height * GFX.renderer.getPixelRatio();
    uniforms.uPixel.value = h / (2 * Math.tan(GFX.camera.fov * Math.PI / 360));
    if (dirtyFrom < 0) return;
    Object.keys(attrs).forEach(function (k) {
      var a = attrs[k];
      if (wrapped) {
        a.updateRange.offset = 0; a.updateRange.count = -1;
      } else {
        a.updateRange.offset = dirtyFrom * a.itemSize;
        a.updateRange.count = (dirtyTo - dirtyFrom + 1) * a.itemSize;
      }
      a.needsUpdate = true;
    });
    dirtyFrom = -1; dirtyTo = -1; wrapped = false;
  };

  // 입자 1개 생성. color는 선형 HDR(r,g,b), additive 1이면 순수 가산
  fx.spawn = function (x, y, z, vx, vy, vz, life, s0, s1, r, g, b, additive, shape, gravity, drag) {
    if (!points) return;
    var i = head;
    head = (head + 1) % cap;
    if (head === 0) wrapped = true;
    if (dirtyFrom < 0) { dirtyFrom = i; dirtyTo = i; } else if (i < dirtyFrom) { wrapped = true; } else { dirtyTo = i; }

    attrs.position.array[i * 3] = x; attrs.position.array[i * 3 + 1] = y; attrs.position.array[i * 3 + 2] = z;
    attrs.aVel.array[i * 3] = vx; attrs.aVel.array[i * 3 + 1] = vy; attrs.aVel.array[i * 3 + 2] = vz;
    attrs.aLife.array[i * 2] = simTime; attrs.aLife.array[i * 2 + 1] = life;
    attrs.aSize.array[i * 3] = s0; attrs.aSize.array[i * 3 + 1] = s1; attrs.aSize.array[i * 3 + 2] = shape || 0;
    attrs.aColor.array[i * 4] = r; attrs.aColor.array[i * 4 + 1] = g; attrs.aColor.array[i * 4 + 2] = b; attrs.aColor.array[i * 4 + 3] = additive;
    attrs.aPhys.array[i * 2] = gravity || 0; attrs.aPhys.array[i * 2 + 1] = drag || 0;
  };

  var tmpColor = new THREE.Color();
  function lin(hex) {
    var c = GFX.linear(hex);
    tmpColor.copy(c);
    return tmpColor;
  }

  function rnd(a, b) { return a + Math.random() * (b - a); }

  // 충돌/획득 시 터지는 효과
  fx.burst = function (pos, hex, count, scale) {
    var c = lin(hex), s = scale || 1, n = Math.min(count, 28), i;
    var r = c.r, g = c.g, b = c.b;
    // 중심 섬광
    fx.spawn(pos.x, pos.y, pos.z, 0, 0, 0, 0.26, 26 * s, 70 * s, r * 5 + 1, g * 5 + 1, b * 5 + 1, 1, 0, 0, 0);
    for (i = 0; i < n; i++) {
      var a = Math.random() * 6.283, sp = rnd(50, 200) * s, up = rnd(-0.4, 1);
      fx.spawn(pos.x, pos.y, pos.z, Math.cos(a) * sp, Math.sin(a) * sp * 0.8 + up * 40, rnd(-50, 50),
        rnd(0.35, 0.7), rnd(5, 10) * s, 1, r * 6, g * 6, b * 6, 1, 0, 110, 2.6);
    }
  };

  // 파괴 효과: 복셀 파편 + 불똥 + 연기
  fx.shatter = function (pos, hex, scale) {
    var c = lin(hex), s = scale || 1, i;
    var r = c.r, g = c.g, b = c.b;
    fx.spawn(pos.x, pos.y, pos.z, 0, 0, 0, 0.3, 34 * s, 110 * s, r * 6 + 1.5, g * 6 + 1.5, b * 6 + 1.5, 1, 0, 0, 0);
    for (i = 0; i < 16; i++) {
      var a = Math.random() * 6.283, sp = rnd(60, 230) * s;
      fx.spawn(pos.x, pos.y, pos.z, Math.cos(a) * sp, Math.sin(a) * sp, rnd(-90, 90),
        rnd(0.5, 1.05), rnd(7, 14) * s, rnd(3, 6) * s, r * 1.2 + 0.06, g * 1.2 + 0.06, b * 1.2 + 0.06, 0, 1, 260, 1.4);
    }
    for (i = 0; i < 14; i++) {
      var a2 = Math.random() * 6.283, sp2 = rnd(90, 300) * s;
      fx.spawn(pos.x, pos.y, pos.z, Math.cos(a2) * sp2, Math.sin(a2) * sp2, rnd(-60, 60),
        rnd(0.3, 0.6), rnd(5, 9) * s, 1, r * 7 + 2, g * 7 + 1.2, b * 7 + 0.4, 1, 0, 120, 3);
    }
    for (i = 0; i < 6; i++) {
      fx.spawn(pos.x + rnd(-6, 6), pos.y + rnd(-6, 6), pos.z, rnd(-24, 24), rnd(10, 40), rnd(-10, 10),
        rnd(0.7, 1.2), 20 * s, 66 * s, 0.14 + r * 0.14, 0.14 + g * 0.14, 0.15 + b * 0.14, 0, 0, -30, 1.2);
    }
  };

  // 진화/보스 처치 같은 큰 연출
  fx.nova = function (pos, hex, scale) {
    var c = lin(hex), s = scale || 1;
    fx.spawn(pos.x, pos.y, pos.z, 0, 0, 0, 0.55, 40 * s, 260 * s, c.r * 7 + 2, c.g * 7 + 2, c.b * 7 + 2, 1, 0, 0, 0);
    for (var i = 0; i < 60; i++) {
      var a = Math.random() * 6.283, sp = rnd(120, 420) * s;
      fx.spawn(pos.x, pos.y, pos.z, Math.cos(a) * sp, Math.sin(a) * sp, rnd(-120, 120),
        rnd(0.6, 1.3), rnd(7, 15) * s, 1, c.r * 8 + 1, c.g * 8 + 1, c.b * 8 + 1, 1, 0, 60, 2.2);
    }
  };

  // 지속 궤적 한 점
  fx.trail = function (x, y, z, r, g, b, size, life, vx, vy) {
    fx.spawn(x + rnd(-1, 1), y + rnd(-1, 1), z + rnd(-1, 1), vx || 0, vy || 0, 0, life || 0.4, size, size * 0.2, r, g, b, 1, 0, 0, 0.8);
  };

  fx.smoke = function (x, y, z, size, life, shade) {
    var v = shade === undefined ? 0.24 : shade;
    fx.spawn(x, y, z, rnd(-8, 8), rnd(6, 22), rnd(-6, 6), life || 0.9, size * 0.5, size * 1.8, v, v, v * 1.05, 0, 0, -8, 1.2);
  };

  fx.reset = function () { simTime += 10; };

})();
