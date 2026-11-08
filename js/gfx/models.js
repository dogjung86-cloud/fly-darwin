// ===== 장애물, 아이템, 투사체 =====
// 지오메트리와 재질은 종류별로 한 번만 만들어 모든 인스턴스가 공유한다.
// (기존에는 스폰할 때마다 수십 개의 지오메트리를 새로 만들어 GPU 메모리가 계속 늘어났다)
(function () {
  'use strict';

  var GFX = window.GFX;
  var M = GFX.models = {};
  var mix = GFX.mixHex;

  function lazy(fn) { var v; return function () { if (v === undefined) v = fn(); return v; }; }
  function res(base) { return base / GFX.q.voxel; }
  function hdr(r, g, b) { return new THREE.Color(r, g, b); }
  function basic(r, g, b) { return new THREE.MeshBasicMaterial({ color: hdr(r, g, b) }); }
  var time = function () { return GFX.world.sharedTime.value; };
  M.time = time;

  function premultMaterial(opts) {
    var o = {
      transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
      defines: GFX.defines()
    };
    Object.keys(opts).forEach(function (k) { o[k] = opts[k]; });
    return new THREE.ShaderMaterial(o);
  }

  var NOISE_GLSL = [
    'float hash( vec2 p ) { return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453 ); }',
    'float noise( vec2 p ) { vec2 i = floor( p ); vec2 f = fract( p ); f = f * f * ( 3.0 - 2.0 * f );',
    '  return mix( mix( hash( i ), hash( i + vec2( 1.0, 0.0 ) ), f.x ), mix( hash( i + vec2( 0.0, 1.0 ) ), hash( i + vec2( 1.0, 1.0 ) ), f.x ), f.y ); }',
    'float fbm( vec2 p ) { return noise( p ) * 0.55 + noise( p * 2.1 + 7.3 ) * 0.3 + noise( p * 4.3 + 3.1 ) * 0.15; }'
  ].join('\n');

  // 항상 카메라를 향하는 빛무리
  var haloGeo = lazy(function () { return new THREE.PlaneBufferGeometry(2, 2); });
  var HALO_VS = [
    'uniform float uSize; varying vec2 vUv;',
    'void main() {',
    '  vUv = uv * 2.0 - 1.0;',
    '  vec4 mv = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );',
    '  mv.xy += position.xy * uSize;',
    '  gl_Position = projectionMatrix * mv;',
    '}'
  ].join('\n');
  var HALO_FS = [
    'uniform vec3 uColor; uniform float uTime; varying vec2 vUv;',
    GFX.outputChunk,
    'void main() {',
    '  float d = length( vUv );',
    '  float a = pow( max( 1.0 - d, 0.0 ), 2.2 );',
    '  float rays = 0.72 + 0.28 * sin( atan( vUv.y, vUv.x ) * 8.0 + uTime * 1.5 );',
    '  gl_FragColor = vec4( gfxOut( uColor * a * rays ), 0.0 );',
    '}'
  ].join('\n');
  function makeHalo(r, g, b, size) {
    var mat = premultMaterial({
      uniforms: { uColor: { type: 'c', value: hdr(r, g, b) }, uSize: { type: 'f', value: size }, uTime: GFX.world.sharedTime },
      vertexShader: HALO_VS, fragmentShader: HALO_FS
    });
    var m = new THREE.Mesh(haloGeo(), mat);
    m.frustumCulled = false;
    return m;
  }
  M.makeHalo = makeHalo;

  // ----- 철퇴 -----
  var SPIKE_DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
    [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0], [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1], [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]]
    .map(function (d) { var l = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]); return [d[0] / l, d[1] / l, d[2] / l]; });

  var maceAssets = lazy(function () {
    var R = res(1.25);
    var body = new GFX.Voxels(-17, 17, -17, 17, -17, 17, R);
    body.sphere(0, 0, 0, 9, function (x, y, z) {
      var n = GFX.noise3(x * 0.55 + 3, y * 0.55, z * 0.55);
      return mix(0x26222b, 0x4c4552, n);
    });
    SPIKE_DIRS.forEach(function (d) {
      body.capsule(d[0] * 6.5, d[1] * 6.5, d[2] * 6.5, 3, d[0] * 13, d[1] * 13, d[2] * 13, 0.9, function (x, y, z) {
        var r = Math.sqrt(x * x + y * y + z * z);
        return mix(0x6d0f12, 0xd8261c, Math.min(1, (r - 8) / 6));
      });
    });
    var tips = new GFX.Voxels(-17, 17, -17, 17, -17, 17, R);
    SPIKE_DIRS.forEach(function (d) {
      tips.capsule(d[0] * 12.4, d[1] * 12.4, d[2] * 12.4, 1, d[0] * 15.4, d[1] * 15.4, d[2] * 15.4, 0.35, 0xffffff);
    });
    return {
      body: body.toGeometry({ jitter: 0.09 }), tips: tips.toGeometry({ jitter: 0, wideAO: false }), scale: 1 / R,
      bodyMat: GFX.voxelMaterial({ specular: 0x666666, shininess: 90 }), tipMat: basic(9, 1.6, 0.8)
    };
  });

  window.Ennemy = function () {
    var a = maceAssets();
    this.mesh = new THREE.Object3D();
    var core = new THREE.Mesh(a.body, a.bodyMat);
    var tips = new THREE.Mesh(a.tips, a.tipMat);
    core.scale.setScalar ? core.scale.setScalar(a.scale) : core.scale.set(a.scale, a.scale, a.scale);
    tips.scale.set(a.scale, a.scale, a.scale);
    core.castShadow = true;
    this.mesh.add(core);
    this.mesh.add(tips);
    this.mesh.rotation.set(Math.random() * 6, Math.random() * 6, 0);
    this.spinA = 0.0009 + Math.random() * 0.0012;
    this.spinB = 0.0012 + Math.random() * 0.0012;
    this.angle = 0;
    this.dist = 0;
    this.type = 'mace';
  };
  Ennemy.prototype.update = function (dt) {
    this.mesh.rotation.y += this.spinA * dt;
    this.mesh.rotation.z += this.spinB * dt;
  };

  // ----- 번개구름 -----
  var thunderAssets = lazy(function () {
    var uniforms = {
      tPuff: { type: 't', value: GFX.getPuffTexture() }, uTime: GFX.world.sharedTime,
      uLit: { type: 'c', value: GFX.linear(0x7c8096) }, uShade: { type: 'c', value: GFX.linear(0x1d1f33) }
    };
    var mat = new THREE.ShaderMaterial({
      uniforms: uniforms, defines: GFX.defines(), transparent: true, depthWrite: false, fog: false,
      vertexShader: [
        'attribute float aPhase; uniform float uTime; varying float vFlash;',
        GFX.PUFF_VS.replace('void main() {', 'void main() {\n  vFlash = pow( max( sin( uTime * 7.0 + aPhase ) * sin( uTime * 3.1 + aPhase * 1.7 ), 0.0 ), 3.0 );')
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D tPuff; uniform vec3 uLit, uShade;',
        'varying vec2 vUv; varying float vLit; varying float vH; varying float vDepth; varying float vFlash;',
        GFX.outputChunk,
        'void main() {',
        '  float a = texture2D( tPuff, vUv ).a;',
        '  if ( a < 0.01 ) discard;',
        '  vec3 col = mix( uShade, uLit, smoothstep( 0.15, 0.95, vLit + vH * 0.3 ) );',
        '  col += vec3( 0.75, 0.8, 1.4 ) * vFlash * ( 1.0 - vLit * 0.6 );',
        '  gl_FragColor = vec4( gfxOut( col ), min( 1.0, a * 1.5 ) );',
        '}'
      ].join('\n')
    });

    var variants = [];
    for (var v = 0; v < 4; v++) {
      var puffs = [];
      for (var i = 0; i < 26; i++) {
        var a = (i / 26) * 6.283 + Math.random() * 0.6;
        var rr = Math.pow(Math.random(), 0.6);
        var x = Math.cos(a) * rr * 19, y = Math.sin(a) * rr * 8 + 2;
        puffs.push({ x: x, y: y, z: (Math.random() - 0.5) * 12, size: 8 + (1 - rr) * 8 + Math.random() * 3, rot: Math.random() * 6.28, lit: 0.15 + (y + 8) / 22 * 0.75 });
      }
      puffs.sort(function (p, q) { return p.z - q.z; });
      var g = GFX.makePuffGeometry(puffs);
      var phase = v * 1.7 + 0.4;
      var ph = new Float32Array(g.attributes.position.count);
      for (var j = 0; j < ph.length; j++) ph[j] = phase;
      g.addAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
      variants.push({ geo: g, phase: phase });
    }

    var boltGeos = [];
    for (var b = 0; b < 4; b++) {
      var pts = [], px = (b - 1.5) * 7 + (Math.random() - 0.5) * 3, py = -4;
      for (var s = 0; s < 6; s++) {
        pts.push([px, py]);
        px += (Math.random() - 0.5) * 7;
        py -= 2.6 + Math.random() * 1.6;
      }
      var verts = [];
      for (var e = 0; e < pts.length - 1; e++) {
        var ax = pts[e][0], ay = pts[e][1], bx = pts[e + 1][0], by = pts[e + 1][1];
        var w0 = 0.95 - e * 0.13, w1 = 0.95 - (e + 1) * 0.13;
        verts.push(ax - w0, ay, 0, ax + w0, ay, 0, bx + w1, by, 0, ax - w0, ay, 0, bx + w1, by, 0, bx - w1, by, 0);
      }
      var bg = new THREE.BufferGeometry();
      bg.addAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
      boltGeos.push(bg);
    }
    var boltMat = new THREE.MeshBasicMaterial({ color: hdr(14, 14, 26), side: THREE.DoubleSide, fog: false });
    return { mat: mat, variants: variants, boltGeos: boltGeos, boltMat: boltMat };
  });

  window.ThunderCloud = function () {
    var a = thunderAssets();
    var variant = a.variants[Math.floor(Math.random() * a.variants.length)];
    this.mesh = new THREE.Object3D();
    var cloud = new THREE.Mesh(variant.geo, a.mat);
    cloud.frustumCulled = false;
    this.mesh.add(cloud);
    this.phase = variant.phase;
    this.bolts = [];
    for (var i = 0; i < 3; i++) {
      var bolt = new THREE.Mesh(a.boltGeos[(i + Math.floor(Math.random() * 4)) % 4], a.boltMat);
      bolt.frustumCulled = false;
      bolt.visible = false;
      this.mesh.add(bolt);
      this.bolts.push(bolt);
    }
    this.angle = 0;
    this.dist = 0;
    this.type = 'thunder';
    this.oscAmp = 12;
    this.flashTimer = Math.random() * 3000;
  };
  ThunderCloud.prototype.update = function (dt) {
    this.flashTimer += dt;
    this.mesh.position.y += Math.sin(this.flashTimer * 0.004) * this.oscAmp;
    var t = time();
    var flash = Math.pow(Math.max(Math.sin(t * 7 + this.phase) * Math.sin(t * 3.1 + this.phase * 1.7), 0), 3);
    var on = flash > 0.12;
    for (var b = 0; b < this.bolts.length; b++) this.bolts[b].visible = on;
  };

  // ----- 비행 운석 -----
  var meteorAssets = lazy(function () {
    var R = res(1.15);
    var out = [];
    for (var v = 0; v < 3; v++) {
      var rock = new GFX.Voxels(-13, 13, -13, 13, -13, 13, R);
      var lava = new GFX.Voxels(-13, 13, -13, 13, -13, 13, R);
      (function (seed) {
        var N = 90;
        for (var i = 0; i < N; i++) {
          var u = Math.random() * 2 - 1, a = Math.random() * 6.283, s = Math.sqrt(1 - u * u);
          var d = Math.random() * 5;
          rock.sphere(Math.cos(a) * s * d, u * d, Math.sin(a) * s * d, 3.4 + Math.random() * 2.4, function (x, y, z) {
            var c = GFX.noise3(x * 0.35 + seed, y * 0.35, z * 0.35);
            return mix(0x2f2520, 0x7d6346, c);
          });
        }
        for (var k = 0; k < 140; k++) {
          var u2 = Math.random() * 2 - 1, a2 = Math.random() * 6.283, s2 = Math.sqrt(1 - u2 * u2);
          var rr = 7.2 + Math.random() * 2;
          var px = Math.cos(a2) * s2 * rr, py = u2 * rr, pz = Math.sin(a2) * s2 * rr;
          if (GFX.noise3(px * 0.32 + seed, py * 0.32 + 9, pz * 0.32) < 0.62) continue;
          lava.sphere(px, py, pz, 0.8 + Math.random() * 0.5, 0xffffff);
        }
      })(v * 11.3);
      out.push({ rock: rock.toGeometry({ jitter: 0.08 }), lava: lava.toGeometry({ jitter: 0, wideAO: false }) });
    }
    return { variants: out, scale: 1 / R, rockMat: GFX.voxelMaterial({ specular: 0x332a22, shininess: 24 }), lavaMat: basic(7, 1.8, 0.25) };
  });

  window.FlyingAsteroid = function () {
    var a = meteorAssets(), v = a.variants[Math.floor(Math.random() * a.variants.length)];
    this.mesh = new THREE.Object3D();
    var rock = new THREE.Mesh(v.rock, a.rockMat), lava = new THREE.Mesh(v.lava, a.lavaMat);
    rock.scale.set(a.scale, a.scale, a.scale); lava.scale.set(a.scale, a.scale, a.scale);
    rock.castShadow = true;
    this.mesh.add(rock); this.mesh.add(lava);
    this.type = 'flyingAsteroid';
    this.speed = 4 + Math.random() * 2;
    this.alive = true;
    this.emit = 0;
  };
  FlyingAsteroid.prototype.update = function (dt) {
    this.mesh.rotation.z += 0.002 * dt;
    this.mesh.rotation.y += 0.0015 * dt;
    this.emit += dt;
    var p = this.mesh.position;
    while (this.emit > 16) {
      this.emit -= 16;
      GFX.fx.trail(p.x + 7, p.y, p.z, 5.5, 1.5, 0.25, 15, 0.42, 60, 0);
      if (Math.random() < 0.3) GFX.fx.smoke(p.x + 12, p.y, p.z, 12, 0.7, 0.16);
    }
  };

  // ----- 물기둥 -----
  var pillarAssets = lazy(function () {
    var nr = 18, nh = 22, pos = [], nor = [], idx = [];
    for (var j = 0; j <= nh; j++) {
      for (var i = 0; i <= nr; i++) {
        var a = (i / nr) * 6.283;
        pos.push(Math.cos(a), j / nh, Math.sin(a));
        nor.push(Math.cos(a), 0, Math.sin(a));
      }
    }
    for (var j2 = 0; j2 < nh; j2++) {
      for (var i2 = 0; i2 < nr; i2++) {
        var p0 = j2 * (nr + 1) + i2, p1 = p0 + 1, p2 = p0 + nr + 1, p3 = p2 + 1;
        idx.push(p0, p2, p1, p1, p2, p3);
      }
    }
    var g = new THREE.BufferGeometry();
    g.addAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
    g.addAttribute('normal', new THREE.BufferAttribute(new Float32Array(nor), 3));
    g.setIndex(new THREE.BufferAttribute(new Uint16Array(idx), 1));

    var env = GFX.world.env;
    var mat = premultMaterial({
      side: THREE.FrontSide,
      uniforms: {
        uTime: GFX.world.sharedTime, uDeep: { type: 'c', value: env.seaDeep }, uMid: { type: 'c', value: env.seaMid },
        uCrest: { type: 'c', value: env.seaCrest }, uFoam: { type: 'c', value: env.foam }, uSky: { type: 'c', value: env.upper }
      },
      vertexShader: [
        'uniform float uTime; varying vec3 vN, vW; varying float vY; varying float vAng;',
        'void main() {',
        '  float y = position.y;',
        '  float flare = mix( 15.0, 9.5, smoothstep( 0.0, 0.32, y ) );',
        '  float wob = 1.0 + 0.09 * sin( y * 8.0 + uTime * 4.6 + position.x * 2.0 ) + 0.05 * sin( y * 19.0 - uTime * 7.0 + position.z * 3.0 );',
        '  float cap = sqrt( max( 1.0 - pow( max( y - 0.86, 0.0 ) / 0.14, 2.0 ), 0.0 ) );',
        '  float r = flare * wob * cap;',
        '  vec3 p = vec3( position.x * r, y, position.z * r );',
        '  vec4 w = modelMatrix * vec4( p, 1.0 );',
        '  vW = w.xyz; vY = y; vAng = atan( position.z, position.x );',
        '  vN = normalize( ( modelMatrix * vec4( position.x, 0.25 * ( 1.0 - cap ), position.z, 0.0 ) ).xyz );',
        '  gl_Position = projectionMatrix * viewMatrix * w;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform float uTime; uniform vec3 uDeep, uMid, uCrest, uFoam, uSky;',
        'varying vec3 vN, vW; varying float vY; varying float vAng;',
        GFX.outputChunk, NOISE_GLSL,
        'void main() {',
        '  vec3 N = normalize( vN ); vec3 V = normalize( cameraPosition - vW );',
        '  float f = pow( 1.0 - max( dot( N, V ), 0.0 ), 2.2 );',
        '  float s = fbm( vec2( vAng * 2.4, vW.y * 0.085 - uTime * 2.1 ) );',
        '  float s2 = fbm( vec2( vAng * 6.1, vW.y * 0.2 - uTime * 3.4 ) );',
        '  vec3 body = mix( uDeep, uMid, s * 1.2 );',
        '  body += uCrest * smoothstep( 0.45, 0.78, s ) * 0.75;',
        '  vec3 col = mix( body, uSky * 1.25, f * 0.72 );',
        '  float foam = smoothstep( 0.58, 0.8, s2 * 0.55 + s * 0.5 );',
        '  foam = max( foam, smoothstep( 0.8, 1.0, vY ) );',
        '  foam = max( foam, smoothstep( 0.14, 0.0, vY ) * 0.9 );',
        '  col = mix( col, uFoam * 1.25, foam );',
        '  float a = mix( 0.78, 1.0, max( f, foam ) );',
        '  gl_FragColor = vec4( gfxOut( col ) * a, a );',
        '}'
      ].join('\n')
    });
    return { geo: g, mat: mat };
  });

  window.WaterPillar = function (height) {
    var a = pillarAssets();
    this.mesh = new THREE.Object3D();
    this.pillarHeight = height || 60;
    var col = new THREE.Mesh(a.geo, a.mat);
    col.scale.y = this.pillarHeight + 3;
    col.frustumCulled = false;
    this.mesh.add(col);
    this.angle = 0;
    this.dist = 0;
    this.type = 'waterPillar';
    this.emit = 0;
  };
  WaterPillar.prototype.update = function (dt) {
    this.mesh.rotation.z = this.angle - Math.PI / 2;
    this.emit += dt;
    var p = this.mesh.position, c = Math.cos(this.angle), s = Math.sin(this.angle), H = this.pillarHeight;
    var f = GFX.world.env.foam;
    var sx = p.x + c * H, sy = p.y + s * H;
    while (this.emit > 30) {
      this.emit -= 30;
      var a = Math.random() * 6.283, sp = 16 + Math.random() * 26;
      GFX.fx.spawn(sx + Math.cos(a) * 5, sy, Math.sin(a) * 6, Math.cos(a) * sp, 26 + Math.random() * 30, Math.sin(a) * sp * 0.6,
        0.6 + Math.random() * 0.4, 5 + Math.random() * 4, 1.5, f.r * 1.3, f.g * 1.3, f.b * 1.3, 0.1, 1, 150, 0.4);
    }
  };

  // ----- 불기둥 (틈이 있는 화염 벽) -----
  var fireAssets = lazy(function () {
    var pos = [], uvs = [], seed = [], idx = [];
    var layers = GFX.tier === 'low' ? 1 : 3;
    for (var l = 0; l < layers; l++) {
      var z = (l - (layers - 1) / 2) * 7, base = pos.length / 3;
      pos.push(-1, 0, z, 1, 0, z, 1, 1, z, -1, 1, z);
      uvs.push(-1, 0, 1, 0, 1, 1, -1, 1);
      seed.push(l, l, l, l);
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
    var g = new THREE.BufferGeometry();
    g.addAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
    g.addAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
    g.addAttribute('aSeed', new THREE.BufferAttribute(new Float32Array(seed), 1));
    g.setIndex(new THREE.BufferAttribute(new Uint16Array(idx), 1));
    var mat = premultMaterial({
      uniforms: { uTime: GFX.world.sharedTime },
      vertexShader: [
        'attribute float aSeed; varying vec2 vP; varying float vWY; varying float vSeed;',
        'void main() {',
        '  vP = uv; vSeed = aSeed;',
        '  vec4 w = modelMatrix * vec4( position, 1.0 );',
        '  vWY = w.y;',
        '  gl_Position = projectionMatrix * viewMatrix * w;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform float uTime; varying vec2 vP; varying float vWY; varying float vSeed;',
        GFX.outputChunk, NOISE_GLSL,
        'void main() {',
        '  float x = vP.x;',
        '  float edge = vP.y * 340.0;',
        '  vec2 q = vec2( x * 2.6 + vSeed * 7.3, vWY * 0.03 - uTime * 1.45 );',
        '  float n = fbm( q );',
        '  float n2 = fbm( q * 2.2 + vec2( n * 1.4, -uTime * 0.7 ) );',
        '  float profile = 1.0 - pow( abs( x ) * 1.55, 1.7 );',
        '  float body = profile + ( n - 0.5 ) * 1.3 + ( n2 - 0.5 ) * 0.5;',
        '  float heat = smoothstep( 0.02, 1.05, body );',
        '  heat *= smoothstep( 0.0, 15.0, edge + ( n - 0.55 ) * 20.0 );',
        '  if ( heat < 0.012 ) discard;',
        '  vec3 col = mix( vec3( 1.25, 0.07, 0.01 ), vec3( 2.3, 0.42, 0.03 ), smoothstep( 0.08, 0.5, heat ) );',
        '  col = mix( col, vec3( 3.4, 1.7, 0.34 ), smoothstep( 0.55, 1.0, heat ) );',
        '  float a = smoothstep( 0.0, 0.34, heat );',
        '  gl_FragColor = vec4( gfxOut( col ) * a, a * 0.9 );',
        '}'
      ].join('\n')
    });
    return { geo: g, mat: mat, bar: new THREE.BoxGeometry(24, 1, 2.4), barMat: basic(3.6, 2.1, 0.6) };
  });

  window.FireWall = function (gapSize) {
    var a = fireAssets();
    this.mesh = new THREE.Object3D();
    this.gapCenter = 0;
    this.gapSize = gapSize || 70;
    this.fullHeight = true;
    var half = this.gapSize / 2;

    var up = new THREE.Mesh(a.geo, a.mat), down = new THREE.Mesh(a.geo, a.mat);
    up.scale.set(22, 340, 1); up.position.y = half; up.frustumCulled = false;
    down.scale.set(22, 340, 1); down.position.y = -half; down.rotation.z = Math.PI; down.frustumCulled = false;
    this.mesh.add(up); this.mesh.add(down);

    var barA = new THREE.Mesh(a.bar, a.barMat), barB = new THREE.Mesh(a.bar, a.barMat);
    barA.position.y = half; barB.position.y = -half;
    this.mesh.add(barA); this.mesh.add(barB);

    this.angle = 0;
    this.dist = 0;
    this.type = 'fireWall';
    this.emit = 0;
  };
  FireWall.prototype.update = function (dt) {
    this.mesh.rotation.z = this.angle - Math.PI / 2;
    this.emit += dt;
    var p = this.mesh.position, c = Math.cos(this.angle), s = Math.sin(this.angle);
    while (this.emit > 40) {
      this.emit -= 40;
      var dir = Math.random() < 0.5 ? 1 : -1;
      var along = dir * (this.gapSize / 2 + Math.random() * 90);
      var side = (Math.random() - 0.5) * 18;
      GFX.fx.spawn(p.x + c * along + s * side, p.y + s * along - c * side, (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 24, 34 + Math.random() * 34, (Math.random() - 0.5) * 18,
        0.5 + Math.random() * 0.5, 4 + Math.random() * 4, 0.8, 8, 2.8, 0.4, 1, 1, -24, 0.4);
    }
  };

  // ----- 블랙홀 (시간이 느려지는 구역) -----
  var holeAssets = lazy(function () {
    var ringG = new THREE.RingGeometry(15, 46, 72, 5);
    var ring = new THREE.BufferGeometry().fromGeometry(ringG);
    var lobeG = new THREE.RingGeometry(14.6, 22.5, 72, 1);
    var lobe = new THREE.BufferGeometry().fromGeometry(lobeG);

    var diskMat = premultMaterial({
      uniforms: { uTime: GFX.world.sharedTime },
      vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }',
      fragmentShader: [
        'uniform float uTime; varying vec2 vP;',
        GFX.outputChunk, NOISE_GLSL,
        'void main() {',
        '  float r = length( vP ); float a = atan( vP.y, vP.x );',
        '  float swirl = a * 3.0 + 26.0 / ( r + 3.0 ) + uTime * 2.4;',
        '  float n = fbm( vec2( cos( swirl ) * 2.0 + r * 0.12, sin( swirl ) * 2.0 - uTime * 0.4 ) );',
        '  float t = clamp( ( r - 15.0 ) / 31.0, 0.0, 1.0 );',
        '  float band = smoothstep( 0.0, 0.06, t ) * pow( 1.0 - t, 1.5 );',
        '  float beam = 1.0 + 0.85 * sin( a );',
        '  vec3 hot = mix( vec3( 3.4, 2.3, 1.2 ), vec3( 1.7, 0.42, 0.06 ), smoothstep( 0.0, 0.55, t ) );',
        '  float i = band * ( n * 1.5 + 0.2 ) * beam;',
        '  gl_FragColor = vec4( gfxOut( hot * i ), min( 1.0, i ) * 0.8 );',
        '}'
      ].join('\n')
    });

    var lobeMat = premultMaterial({
      uniforms: {},
      vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }',
      fragmentShader: [
        'varying vec2 vP;',
        GFX.outputChunk,
        'void main() {',
        '  float r = length( vP );',
        '  float t = clamp( ( r - 14.6 ) / 7.9, 0.0, 1.0 );',
        '  float i = pow( 1.0 - t, 2.5 );',
        '  gl_FragColor = vec4( gfxOut( vec3( 3.2, 2.0, 1.0 ) * i ), min( 1.0, i ) * 0.6 );',
        '}'
      ].join('\n')
    });

    return {
      core: new THREE.SphereBufferGeometry(14, 28, 20),
      coreMat: new THREE.MeshBasicMaterial({ color: 0x000000, fog: false }),
      ring: ring, diskMat: diskMat, lobe: lobe, lobeMat: lobeMat
    };
  });

  var lensProbe = new THREE.Vector3();

  window.BlackHole = function () {
    var a = holeAssets();
    this.mesh = new THREE.Object3D();
    this.mesh.position.z = -70;
    this.mesh.add(new THREE.Mesh(a.core, a.coreMat));
    this.disk = new THREE.Mesh(a.ring, a.diskMat);
    this.disk.rotation.x = -1.28;
    this.disk.rotation.y = 0.16;
    this.mesh.add(this.disk);
    this.lobe = new THREE.Mesh(a.lobe, a.lobeMat);
    this.mesh.add(this.lobe);
    this.halo = makeHalo(0.55, 0.3, 0.14, 62);
    this.mesh.add(this.halo);
    this.angle = 0;
    this.dist = 0;
    this.type = 'blackHole';
  };
  BlackHole.prototype.update = function () {
    this.mesh.position.z = -70;
    lensProbe.copy(this.mesh.position).project(GFX.camera);
    if (lensProbe.z < 1 && Math.abs(lensProbe.x) < 1.4 && Math.abs(lensProbe.y) < 1.4) {
      GFX.fxState.lensX = lensProbe.x * 0.5 + 0.5;
      GFX.fxState.lensY = lensProbe.y * 0.5 + 0.5;
      GFX.fxState.lens = (14 / GFX.camera.position.distanceTo(this.mesh.position)) / (2 * Math.tan(GFX.camera.fov * Math.PI / 360));
    }
  };

  // ----- 코인 -----
  var coinAssets = lazy(function () {
    var profile = [[0, 0.42], [2.6, 0.42], [2.85, 0.68], [3.62, 0.68], [4.05, 0.34], [4.05, -0.34], [3.62, -0.68], [2.85, -0.68], [2.6, -0.42], [0, -0.42]]
      .reverse().map(function (p) { return new THREE.Vector3(p[0], p[1], 0); });
    var g = new THREE.LatheGeometry(profile, GFX.tier === 'low' ? 14 : 26);
    g.applyMatrix(new THREE.Matrix4().makeRotationX(Math.PI / 2));
    g.computeFaceNormals();
    g.computeVertexNormals();
    return {
      geo: new THREE.BufferGeometry().fromGeometry(g),
      mat: new THREE.MeshPhongMaterial({ color: 0xffc23a, specular: 0xfff0c0, shininess: 150, emissive: 0x4a2c00, shading: THREE.SmoothShading })
    };
  });

  window.Coin = function () {
    var a = coinAssets();
    this.mesh = new THREE.Mesh(a.geo, a.mat);
    this.mesh.rotation.y = Math.random() * 6.28;
    this.mesh.castShadow = true;
    this.angle = 0;
    this.dist = 0;
  };

  // ----- 무적 열매 -----
  var fruitAssets = lazy(function () {
    var R = res(1.3);
    var v = new GFX.Voxels(-14, 14, -14, 14, -14, 14, R);
    v.sphere(0, 0, 0, 6.4, function (x, y, z) { return mix(0xffd23a, 0xff9d14, (y + 6) / 12); });
    [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].forEach(function (d) {
      v.capsule(d[0] * 5, d[1] * 5, d[2] * 5, 2.5, d[0] * 12, d[1] * 12, d[2] * 12, 0.5, function (x, y, z) {
        var r = Math.sqrt(x * x + y * y + z * z);
        return mix(0xffe066, 0xfff6c8, Math.min(1, (r - 5) / 7));
      });
    });
    return { geo: v.toGeometry({ jitter: 0.03 }), scale: 1 / R, mat: GFX.voxelMaterial({ specular: 0xffe9a0, shininess: 120, emissive: 0x7a4a00 }) };
  });

  window.InvincibleFruit = function () {
    var a = fruitAssets();
    this.mesh = new THREE.Object3D();
    var body = new THREE.Mesh(a.geo, a.mat);
    body.scale.set(a.scale, a.scale, a.scale);
    this.mesh.add(body);
    this.mesh.add(makeHalo(1.15, 0.72, 0.16, 21));
    this.angle = 0;
    this.dist = 0;
  };

  // ----- 하트 -----
  var heartAssets = lazy(function () {
    var s = new THREE.Shape();
    s.moveTo(0, 0);
    s.bezierCurveTo(0, -3, -5, -8, -10, -8);
    s.bezierCurveTo(-18, -8, -18, 2, -18, 2);
    s.bezierCurveTo(-18, 8, -10, 14, 0, 18);
    s.bezierCurveTo(10, 14, 18, 8, 18, 2);
    s.bezierCurveTo(18, 2, 18, -8, 10, -8);
    s.bezierCurveTo(5, -8, 0, -3, 0, 0);
    var g = new THREE.ExtrudeGeometry(s, { amount: 4, bevelEnabled: true, bevelSegments: 4, steps: 1, bevelSize: 2, bevelThickness: 2.4, curveSegments: 18 });
    g.computeFaceNormals();
    g.mergeVertices();
    g.computeVertexNormals();
    return {
      geo: new THREE.BufferGeometry().fromGeometry(g),
      mat: new THREE.MeshPhongMaterial({ color: 0xf0163f, specular: 0xffffff, shininess: 170, emissive: 0x5a0416, shading: THREE.SmoothShading })
    };
  });

  window.HeartItem = function () {
    var a = heartAssets();
    this.mesh = new THREE.Object3D();
    var heart = new THREE.Mesh(a.geo, a.mat);
    heart.scale.set(0.5, 0.5, 0.5);
    heart.rotation.z = Math.PI;
    heart.position.set(0, 5, -2);
    this.mesh.add(heart);
    this.mesh.add(makeHalo(1.05, 0.14, 0.24, 20));
    this.angle = 0;
    this.dist = 0;
  };

  // ----- 무적 보호막 -----
  M.createShield = function () {
    var mat = premultMaterial({
      side: THREE.FrontSide,
      uniforms: { uStrength: { type: 'f', value: 1 }, uTime: GFX.world.sharedTime },
      vertexShader: 'varying vec3 vN, vV, vO; void main(){ vO = position; vN = normalize( normalMatrix * normal ); vec4 mv = modelViewMatrix * vec4( position, 1.0 ); vV = normalize( -mv.xyz ); gl_Position = projectionMatrix * mv; }',
      fragmentShader: [
        'uniform float uStrength, uTime; varying vec3 vN, vV, vO;',
        GFX.outputChunk,
        'void main() {',
        '  float f = pow( 1.0 - max( dot( normalize( vN ), normalize( vV ) ), 0.0 ), 2.4 );',
        '  float bands = 0.5 + 0.5 * sin( vO.y * 0.09 + uTime * 3.2 );',
        '  float i = ( f * 1.1 + pow( bands, 8.0 ) * 0.12 ) * uStrength;',
        '  vec3 c = mix( vec3( 7.0, 3.6, 0.7 ), vec3( 9.0, 8.0, 5.0 ), f );',
        '  gl_FragColor = vec4( gfxOut( c * i ), min( 1.0, i ) * 0.12 );',
        '}'
      ].join('\n')
    });
    return new THREE.Mesh(new THREE.SphereBufferGeometry(120, 32, 22), mat);
  };

  // ----- 투사체 -----
  var bulletGeo = lazy(function () {
    var g = new THREE.SphereBufferGeometry(1, 10, 8);
    return g;
  });
  var shotMats = lazy(function () {
    return {
      missile: basic(14, 5.4, 1.6), laser: basic(1.2, 15, 7),
      ink: new THREE.MeshPhongMaterial({ color: 0x23153a, emissive: 0x2d1458, specular: 0xb080ff, shininess: 120, shading: THREE.SmoothShading }),
      tooth: new THREE.MeshPhongMaterial({ color: 0xf2eedd, specular: 0xffffff, shininess: 90, shading: THREE.FlatShading }),
      fire: basic(13, 3.4, 0.45), beam: basic(1.5, 14, 11)
    };
  });

  M.playerMissile = function () {
    var m = new THREE.Mesh(bulletGeo(), shotMats().missile);
    m.scale.set(8, 1.9, 1.9);
    return m;
  };
  M.playerLaser = function () {
    var m = new THREE.Mesh(bulletGeo(), shotMats().laser);
    m.scale.set(15, 1.25, 1.25);
    return m;
  };
  M.bossShot = function (kind, size) {
    var mats = shotMats();
    var m;
    if (kind === 'ink') { m = new THREE.Mesh(bulletGeo(), mats.ink); m.scale.set(size, size, size); }
    else if (kind === 'tooth') {
      m = new THREE.Mesh(toothGeo(), mats.tooth);
      m.scale.set(size * 0.5, size * 0.9, size * 0.5);
    }
    else if (kind === 'fire') { m = new THREE.Mesh(bulletGeo(), mats.fire); m.scale.set(size, size, size); }
    else { m = new THREE.Mesh(bulletGeo(), mats.beam); m.scale.set(size * 2.6, size * 0.5, size * 0.5); }
    m.shotKind = kind;
    return m;
  };
  var toothGeo = lazy(function () { return new THREE.CylinderGeometry(0.1, 1, 2, 5); });

  var SHOT_TRAILS = {
    missile: [6, 2.2, 0.6, 4.5, 0.13], laser: [0.7, 8, 4, 4, 0.12],
    ink: [1.1, 0.3, 2.6, 13, 0.5], fire: [8, 2.2, 0.3, 16, 0.42], beam: [0.8, 8, 6.4, 8, 0.2]
  };

  // 투사체가 지나간 자리에 빛 궤적을 남긴다 (프레임 빈도와 무관하게 일정 간격으로)
  M.emitShotTrail = function (kind, x, y, z, dt) {
    var t = SHOT_TRAILS[kind];
    if (!t) return;
    M._trailAccum = (M._trailAccum || 0) + dt;
    GFX.fx.trail(x, y, z, t[0], t[1], t[2], t[3], t[4]);
  };

})();
