// ===== 세계 렌더링: 하늘, 바다, 구름, 대기 =====
// 비행 거리에 따라 아침 → 황금빛 오후 → 노을 → 달밤 → 오로라로 시간이 흐른다.
(function () {
  'use strict';

  var GFX = window.GFX;
  var world = GFX.world = { bloomThreshold: 1.05, bloomAmount: 0.55, exposure: 1 };

  // ----- 시간대 키프레임 (색은 sRGB 기준으로 적고 내부에서 선형으로 변환) -----
  var RAW_KEYS = [
    { d: 0, seaRef: 1,
      zenith: 0x1766c9, upper: 0x4b9fe6, horizon: 0xa8d8ef, haze: 0xeef3e6,
      sun: 0xfff0d2, sunI: 22, sunAz: 0.5, sunEl: 0.56,
      seaDeep: 0x06486a, seaMid: 0x0a8ea3, seaCrest: 0x63e0c8, foam: 0xf4fbff,
      cloudLit: 0xffffff, cloudShade: 0x93b0d4,
      key: 0xfff1dc, keyI: 1.05, back: 0xffd9a8, backI: 0.55,
      hemiSky: 0xbcdffb, hemiGround: 0x3b8a96, hemiI: 0.62,
      fog: 0xb6dcef, exposure: 1.0, stars: 0, aurora: 0, moon: 0, bloom: 0.5 },
    { d: 3000, seaRef: 0.62,
      zenith: 0x2a63b5, upper: 0x7fa9d8, horizon: 0xf4d6ac, haze: 0xffd39a,
      sun: 0xffd9a0, sunI: 26, sunAz: 0.3, sunEl: 0.2,
      seaDeep: 0x0a3f62, seaMid: 0x1a7f92, seaCrest: 0xf0c890, foam: 0xfff0dc,
      cloudLit: 0xfff0d6, cloudShade: 0xa38fa8,
      key: 0xffe2bc, keyI: 1.0, back: 0xffb066, backI: 0.85,
      hemiSky: 0xcfd9ee, hemiGround: 0x5a6a78, hemiI: 0.55,
      fog: 0xe8d4b8, exposure: 1.0, stars: 0, aurora: 0, moon: 0, bloom: 0.6 },
    { d: 5200, seaRef: 0.3,
      zenith: 0x2b3f86, upper: 0x8a6a94, horizon: 0xff9a5a, haze: 0xffb066,
      sun: 0xffa45e, sunI: 30, sunAz: 0.12, sunEl: 0.045,
      seaDeep: 0x10304f, seaMid: 0x3a5a78, seaCrest: 0xff9a60, foam: 0xffd9b8,
      cloudLit: 0xffc08a, cloudShade: 0x6e4f7c,
      key: 0xffc896, keyI: 0.82, back: 0xff8240, backI: 1.15,
      hemiSky: 0xb79ac0, hemiGround: 0x53405c, hemiI: 0.46,
      fog: 0xe0a07c, exposure: 1.02, stars: 0.04, aurora: 0, moon: 0, bloom: 0.75 },
    { d: 7000, seaRef: 0.32,
      zenith: 0x131f52, upper: 0x3a3f7c, horizon: 0x8a5a78, haze: 0xa56a70,
      sun: 0xff8a5c, sunI: 8, sunAz: 0.05, sunEl: -0.06,
      seaDeep: 0x0a1a38, seaMid: 0x1c3a5e, seaCrest: 0x7f7aa8, foam: 0xb8c0dc,
      cloudLit: 0x9d84a8, cloudShade: 0x35305a,
      key: 0xb9b6e0, keyI: 0.62, back: 0xc0709a, backI: 0.75,
      hemiSky: 0x6f78b4, hemiGround: 0x2c3158, hemiI: 0.5,
      fog: 0x5a4a70, exposure: 1.1, stars: 0.45, aurora: 0, moon: 0.45, bloom: 0.62 },
    { d: 9500, seaRef: 0.38,
      zenith: 0x060c2a, upper: 0x10204e, horizon: 0x24406c, haze: 0x2c5078,
      sun: 0xbcd6ff, sunI: 0, sunAz: -0.5, sunEl: 0.7,
      seaDeep: 0x040f26, seaMid: 0x0f2c50, seaCrest: 0x6f9cc8, foam: 0xbcd4ec,
      cloudLit: 0x5a76a8, cloudShade: 0x16204a,
      key: 0xa9c4f4, keyI: 0.72, back: 0x6f9cf0, backI: 0.8,
      hemiSky: 0x4f6eb0, hemiGround: 0x18305c, hemiI: 0.62,
      fog: 0x1f3762, exposure: 1.18, stars: 1, aurora: 0.25, moon: 1, bloom: 0.62 },
    { d: 13000, seaRef: 0.38,
      zenith: 0x030616, upper: 0x0a1534, horizon: 0x142b4c, haze: 0x1a3a58,
      sun: 0xbcd6ff, sunI: 0, sunAz: -0.5, sunEl: 0.7,
      seaDeep: 0x020a1c, seaMid: 0x08203c, seaCrest: 0x2f6f7c, foam: 0x7fb0bc,
      cloudLit: 0x3f5e90, cloudShade: 0x0c1636,
      key: 0x9fc6e8, keyI: 0.72, back: 0x6fe0c0, backI: 0.9,
      hemiSky: 0x3f6aa4, hemiGround: 0x123c52, hemiI: 0.62,
      fog: 0x12304a, exposure: 1.22, stars: 1, aurora: 1, moon: 1, bloom: 0.62 }
  ];

  var COLOR_FIELDS = ['zenith', 'upper', 'horizon', 'haze', 'sun', 'seaDeep', 'seaMid', 'seaCrest', 'foam', 'cloudLit', 'cloudShade', 'key', 'back', 'hemiSky', 'hemiGround', 'fog'];
  var NUM_FIELDS = ['seaRef', 'sunI', 'sunAz', 'sunEl', 'keyI', 'backI', 'hemiI', 'exposure', 'stars', 'aurora', 'moon', 'bloom'];

  var KEYS = RAW_KEYS.map(function (k) {
    var out = { d: k.d };
    COLOR_FIELDS.forEach(function (f) { out[f] = GFX.linear(k[f]); });
    NUM_FIELDS.forEach(function (f) { out[f] = k[f]; });
    return out;
  });

  // 현재 환경값 (매 프레임 키프레임 사이를 보간)
  var env = { d: 0 };
  COLOR_FIELDS.forEach(function (f) { env[f] = KEYS[0][f].clone(); });
  NUM_FIELDS.forEach(function (f) { env[f] = KEYS[0][f]; });
  world.env = env;

  var sunDir = new THREE.Vector3(), moonDir = new THREE.Vector3(-0.42, 0.62, -0.66).normalize();
  var bossTint = 0, bossTintTarget = 0;
  var BOSS_DARK = GFX.linear(0x241020);

  var lights = {};
  var sky, seaMesh, seaUniforms, cloudsMesh, cloudUniforms, dustMesh, dustUniforms;
  var shared = { time: { type: 'f', value: 0 } };
  world.sharedTime = shared.time;

  function sampleEnv(distance) {
    var i = 0;
    while (i < KEYS.length - 2 && distance >= KEYS[i + 1].d) i++;
    var a = KEYS[i], b = KEYS[i + 1];
    var t = Math.max(0, Math.min(1, (distance - a.d) / (b.d - a.d)));
    t = t * t * (3 - 2 * t);
    COLOR_FIELDS.forEach(function (f) {
      env[f].r = a[f].r + (b[f].r - a[f].r) * t;
      env[f].g = a[f].g + (b[f].g - a[f].g) * t;
      env[f].b = a[f].b + (b[f].b - a[f].b) * t;
    });
    NUM_FIELDS.forEach(function (f) { env[f] = a[f] + (b[f] - a[f]) * t; });
  }

  function applyEnv() {
    var az = env.sunAz, el = env.sunEl;
    sunDir.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).normalize();

    if (bossTint > 0.001) {
      ['zenith', 'upper', 'horizon', 'haze', 'fog', 'cloudLit', 'cloudShade'].forEach(function (f) {
        env[f].lerp(BOSS_DARK, bossTint * 0.5);
      });
    }

    var s = scene();
    if (s && s.fog) {
      if (GFX.pipelineActive()) {
        s.fog.color.copy(env.fog);
      } else {
        s.fog.color.setRGB(displayEncode(env.fog.r), displayEncode(env.fog.g), displayEncode(env.fog.b));
      }
    }

    world.exposure = env.exposure;
    world.bloomAmount = env.bloom;

    if (lights.key) {
      lights.key.color.copy(env.key).multiplyScalar(env.keyI);
      lights.back.color.copy(env.back).multiplyScalar(env.backI);
      lights.back.position.copy(sunDir).multiplyScalar(500);
      if (env.sunEl < -0.02 || env.sunI <= 0.5) lights.back.position.set(-300, 200, -420);
      lights.hemi.color.copy(env.hemiSky).multiplyScalar(env.hemiI);
      lights.hemi.groundColor.copy(env.hemiGround).multiplyScalar(env.hemiI);
    }
  }

  function displayEncode(v) {
    var x = v * (2.51 * v + 0.03) / (v * (2.43 * v + 0.59) + 0.14);
    return Math.pow(Math.max(0, Math.min(1, x)), 1 / 2.2);
  }

  function scene() { return GFX.scene; }

  // ----- 조명 -----
  world.createLights = function (s) {
    lights.hemi = new THREE.HemisphereLight(0xffffff, 0x000000, 1);
    lights.key = new THREE.DirectionalLight(0xffffff, 1);
    lights.key.position.set(160, 340, 300);
    lights.back = new THREE.DirectionalLight(0xffffff, 1);

    if (GFX.q.shadows) {
      var sc = lights.key.shadow;
      lights.key.castShadow = true;
      sc.camera.left = -300; sc.camera.right = 300;
      sc.camera.top = 260; sc.camera.bottom = -260;
      sc.camera.near = 40; sc.camera.far = 900;
      sc.mapSize.width = GFX.q.shadows; sc.mapSize.height = GFX.q.shadows;
      sc.bias = -0.0012;
      sc.radius = 2.2;
    }

    s.add(lights.hemi);
    s.add(lights.key);
    s.add(lights.back);
    world.lights = lights;
    applyEnv();
    return lights;
  };

  // ----- 하늘 -----
  function createSky(s) {
    var uniforms = {
      uZenith: { type: 'c', value: env.zenith }, uUpper: { type: 'c', value: env.upper },
      uHorizon: { type: 'c', value: env.horizon }, uHaze: { type: 'c', value: env.haze },
      uSun: { type: 'c', value: env.sun }, uSunDir: { type: 'v3', value: sunDir }, uMoonDir: { type: 'v3', value: moonDir },
      uSunI: { type: 'f', value: 20 }, uStars: { type: 'f', value: 0 }, uAurora: { type: 'f', value: 0 }, uMoon: { type: 'f', value: 0 },
      uTime: shared.time
    };
    var mat = new THREE.ShaderMaterial({
      uniforms: uniforms, side: THREE.BackSide, depthWrite: false, fog: false, defines: GFX.defines(),
      vertexShader: [
        'varying vec3 vDir;',
        'void main() {',
        '  vDir = position;',
        '  vec4 p = projectionMatrix * vec4( ( viewMatrix * vec4( position, 0.0 ) ).xyz, 1.0 );',
        '  gl_Position = p.xyww;',
        '  gl_Position.z *= 0.99999;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying vec3 vDir;',
        'uniform vec3 uZenith, uUpper, uHorizon, uHaze, uSun, uSunDir, uMoonDir;',
        'uniform float uSunI, uStars, uAurora, uMoon, uTime;',
        GFX.outputChunk,
        'float hash3( vec3 p ) { return fract( sin( dot( p, vec3( 127.1, 311.7, 74.7 ) ) ) * 43758.5453 ); }',
        'float stars( vec3 d ) {',
        '  vec3 g = d * 170.0; vec3 id = floor( g ); vec3 f = fract( g ) - 0.5;',
        '  float h = hash3( id ); if ( h < 0.9965 ) return 0.0;',
        '  float size = fract( h * 91.7 ) * 0.34 + 0.12;',
        '  float tw = 0.65 + 0.35 * sin( uTime * ( 1.5 + fract( h * 13.1 ) * 3.0 ) + h * 40.0 );',
        '  return smoothstep( size, 0.0, length( f ) ) * tw * ( 0.6 + fract( h * 7.3 ) * 2.4 );',
        '}',
        'float auroraBand( vec2 p ) {',
        '  float w = sin( p.x * 2.4 + uTime * 0.14 ) + sin( p.x * 5.3 - uTime * 0.21 ) * 0.5 + sin( p.x * 11.0 + uTime * 0.33 ) * 0.22;',
        '  float y = p.y - 0.62 - w * 0.06;',
        '  float curtain = smoothstep( -0.16, 0.03, y ) * exp( -max( y, 0.0 ) * 7.0 );',
        '  float rays = 0.8 + 0.2 * sin( p.x * 54.0 + w * 9.0 + uTime * 0.4 ) * sin( p.x * 23.0 - uTime * 0.2 );',
        '  return curtain * rays;',
        '}',
        'void main() {',
        '  vec3 d = normalize( vDir );',
        '  float h = d.y;',
        '  vec3 c = mix( uHorizon, uUpper, smoothstep( 0.0, 0.32, h ) );',
        '  c = mix( c, uZenith, smoothstep( 0.2, 0.9, h ) );',
        '  c = mix( c, uHaze, exp( -abs( h ) * 26.0 ) * 0.7 );',
        '  c = mix( c, uUpper * 0.92, smoothstep( -0.03, -0.32, h ) );',
        '  float sd = max( dot( d, uSunDir ), 0.0 );',
        '  c += uSun * ( pow( sd, 12.0 ) * 0.07 + pow( sd, 70.0 ) * 0.26 + pow( sd, 520.0 ) * 1.1 ) * min( uSunI * 0.08, 1.6 );',
        '  c += uSun * smoothstep( 0.99965, 0.99985, sd ) * uSunI;',
        '  if ( uMoon > 0.001 ) {',
        '    float md = dot( d, uMoonDir );',
        '    float disk = smoothstep( 0.99905, 0.99935, md );',
        '    float craters = 0.82 + 0.18 * sin( d.x * 190.0 ) * sin( d.y * 170.0 + d.z * 90.0 );',
        '    c += vec3( 0.95, 0.97, 1.0 ) * disk * craters * uMoon * 3.4;',
        '    c += vec3( 0.42, 0.52, 0.8 ) * ( pow( max( md, 0.0 ), 180.0 ) * 0.5 + pow( max( md, 0.0 ), 24.0 ) * 0.1 ) * uMoon;',
        '  }',
        '  if ( uStars > 0.001 && h > -0.02 ) c += vec3( 0.86, 0.92, 1.0 ) * stars( d ) * uStars * smoothstep( 0.0, 0.16, h );',
        '  if ( uAurora > 0.001 && h > 0.05 ) {',
        '    vec2 ap = vec2( atan( d.x, -d.z ), h );',
        '    float a = auroraBand( ap );',
        '    vec3 ac = mix( vec3( 0.08, 0.9, 0.5 ), vec3( 0.45, 0.2, 0.9 ), smoothstep( 0.46, 0.8, h ) );',
        '    c += ac * a * uAurora * 0.2;',
        '  }',
        '  gl_FragColor = vec4( gfxOut( c ), 1.0 );',
        '}'
      ].join('\n')
    });
    sky = new THREE.Mesh(new THREE.SphereBufferGeometry(100, 32, 18), mat);
    sky.frustumCulled = false;
    sky.renderOrder = -100;
    s.add(sky);
    sky.material.uniforms.uStarsRef = null;
  }

  // ----- 바다 -----
  // 카메라에서 보이는 행성 윗면 호(弧)만 촘촘히 만들고, 회전은 셰이더 위상으로 표현한다.
  var SEA_ARC = 0.86;

  // 파도 함수. q.x는 라디안(정수 파수만 써서 한 바퀴 돌아도 이음매가 없음), q.y는 z 좌표.
  // 반환값: xy = 기울기, z = 높이
  var SEA_FIELD = [
    'void peak( vec2 p, float k, float l, float w, float ph, float amp, float t, inout vec3 r ) {',
    '  float x = p.x * k + p.y * l + t * w + ph;',
    '  float e = exp( sin( x ) - 1.0 ) * 2.0;',
    '  float c = amp * e * cos( x );',
    '  r.x += c * k; r.y += c * l; r.z += amp * ( e - 0.92 );',
    '}',
    'vec3 seaSwell( vec2 q, float t ) {',
    '  vec2 p = q;',
    '  p.x += sin( q.x * 13.0 + q.y * 0.0071 + t * 0.11 ) * 0.05 + sin( q.x * 29.0 - q.y * 0.0131 - t * 0.17 ) * 0.022;',
    '  p.y += sin( q.x * 17.0 + q.y * 0.0093 + t * 0.13 ) * 34.0;',
    '  vec3 r = vec3( 0.0 );',
    '  peak( p, 23.0, 0.016, 0.62, 0.0, 5.2, t, r );',
    '  peak( p, 31.0, -0.036, -0.78, 1.7, 2.9, t, r );',
    '  peak( p, 13.0, 0.044, 0.55, 4.0, 2.4, t, r );',
    '  peak( p, 67.0, 0.066, 1.24, 2.6, 1.1, t, r );',
    '  peak( p, 97.0, -0.118, -1.6, 5.3, 0.55, t, r );',
    '  return r;',
    '}'
  ].join('\n');

  function buildSeaGeometry(radius) {
    var nx = GFX.q.seaX, nz = GFX.q.seaZ;
    var zNear = 340, zFar = -1500;
    var verts = (nx + 1) * (nz + 1);
    var pos = new Float32Array(verts * 3);
    var idx = verts > 65000 ? new Uint32Array(nx * nz * 6) : new Uint16Array(nx * nz * 6);
    var p = 0, q = 0, i, j;
    for (j = 0; j <= nz; j++) {
      var v = j / nz;
      var z = zNear + (zFar - zNear) * Math.pow(v, 1.75);
      for (i = 0; i <= nx; i++) {
        var a = Math.PI / 2 + SEA_ARC * (i / nx - 0.5) * 2;
        pos[p++] = Math.cos(a) * radius;
        pos[p++] = Math.sin(a) * radius;
        pos[p++] = z;
      }
    }
    for (j = 0; j < nz; j++) {
      for (i = 0; i < nx; i++) {
        var a0 = j * (nx + 1) + i, b0 = a0 + 1, c0 = a0 + nx + 1, d0 = c0 + 1;
        idx[q++] = a0; idx[q++] = c0; idx[q++] = b0;
        idx[q++] = b0; idx[q++] = c0; idx[q++] = d0;
      }
    }
    var g = new THREE.BufferGeometry();
    g.addAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, radius, 0), 4000);
    return g;
  }

  function createSea(s, radius) {
    seaUniforms = {
      uTime: shared.time, uRot: { type: 'f', value: 0 }, uRadius: { type: 'f', value: radius },
      uDeep: { type: 'c', value: env.seaDeep }, uMid: { type: 'c', value: env.seaMid }, uCrest: { type: 'c', value: env.seaCrest }, uFoam: { type: 'c', value: env.foam },
      uZenith: { type: 'c', value: env.upper }, uHorizon: { type: 'c', value: env.horizon }, uSun: { type: 'c', value: env.sun },
      uSunDir: { type: 'v3', value: sunDir }, uMoonDir: { type: 'v3', value: moonDir }, uSunI: { type: 'f', value: 20 }, uMoon: { type: 'f', value: 0 },
      uFog: { type: 'c', value: env.fog }, uCam: { type: 'v3', value: new THREE.Vector3() }, uRef: { type: 'f', value: 1 },
      uShadow: { type: 'v4', value: new THREE.Vector4(0, 100, 0, 0) }
    };
    var mat = new THREE.ShaderMaterial({
      uniforms: uniforms_(seaUniforms), defines: GFX.defines(), fog: false,
      extensions: { derivatives: true },
      vertexShader: [
        'uniform float uTime, uRot, uRadius;',
        'varying vec3 vWorld; varying vec2 vSea;',
        SEA_FIELD,
        'void main() {',
        '  float a = atan( position.y, position.x );',
        '  vec2 q = vec2( a - uRot, position.z );',
        '  float h = seaSwell( q, uTime ).z;',
        '  vec3 n = vec3( cos( a ), sin( a ), 0.0 );',
        '  vec3 p = position + n * h;',
        '  vec4 w = modelMatrix * vec4( p, 1.0 );',
        '  vWorld = w.xyz;',
        '  vSea = q;',
        '  gl_Position = projectionMatrix * viewMatrix * w;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform float uTime, uRot, uRadius, uSunI, uMoon, uRef;',
        'uniform vec3 uDeep, uMid, uCrest, uFoam, uZenith, uHorizon, uSun, uSunDir, uMoonDir, uFog, uCam;',
        'uniform vec4 uShadow;',
        'varying vec3 vWorld; varying vec2 vSea;',
        GFX.outputChunk,
        SEA_FIELD,
        'float hash( vec2 p ) { return fract( sin( dot( p, vec2( 41.3, 289.1 ) ) ) * 43758.5453 ); }',
        'float noise( vec2 p ) { vec2 i = floor( p ); vec2 f = fract( p ); f = f * f * ( 3.0 - 2.0 * f );',
        '  return mix( mix( hash( i ), hash( i + vec2( 1.0, 0.0 ) ), f.x ), mix( hash( i + vec2( 0.0, 1.0 ) ), hash( i + vec2( 1.0, 1.0 ) ), f.x ), f.y ); }',
        'void ripple( vec2 q, float k, float l, float w, float ph, float amp, inout vec3 r ) {',
        '  float x = q.x * k + q.y * l + uTime * w + ph;',
        '  float c = amp * cos( x );',
        '  r.x += c * k; r.y += c * l;',
        '}',
        'void main() {',
        '  vec2 q = vSea;',
        '  float dist = length( uCam - vWorld );',
        '  vec3 r = seaSwell( q, uTime );',
        '  float crest = r.z;',
        '  float near = 1.0 - smoothstep( 260.0, 1000.0, dist );',
        '  float wx = noise( vec2( q.x * uRadius * 0.018, q.y * 0.018 ) + uTime * 0.05 ) * 7.0;',
        '  float wy = noise( vec2( q.x * uRadius * 0.018 + 31.0, q.y * 0.018 ) - uTime * 0.04 ) * 7.0;',
        '  vec2 rq = vec2( q.x + wx * 0.0028, q.y + wy * 1.7 );',
        '  ripple( rq, 151.0, 0.241, 2.3, 0.7, 0.13 * near, r );',
        '  ripple( rq, 263.0, -0.397, -3.1, 2.9, 0.07 * near, r );',
        '  ripple( rq, 419.0, 0.613, 4.2, 5.1, 0.035 * near, r );',
        '  float ang = atan( vWorld.y + uRadius, vWorld.x );',
        '  vec3 er = vec3( cos( ang ), sin( ang ), 0.0 );',
        '  vec3 et = vec3( -sin( ang ), cos( ang ), 0.0 );',
        '  vec3 N = normalize( er - et * ( r.x / uRadius ) - vec3( 0.0, 0.0, r.y ) );',
        '  vec3 V = normalize( uCam - vWorld );',
        '  float NdV = max( dot( N, V ), 0.0 );',
        '  float fres = 0.02 + 0.98 * pow( 1.0 - NdV, 5.0 );',
        '  vec3 R = reflect( -V, N );',
        '  float up = clamp( reflect( -V, normalize( N + er * 5.0 ) ).y, 0.0, 1.0 );',
        '  vec3 reflected = mix( uHorizon * 0.8, mix( uHorizon, uZenith, 0.72 ), smoothstep( 0.0, 0.75, up ) );',
        '  float ridge = smoothstep( -4.0, 8.0, crest );',
        '  vec3 water = mix( uDeep, uMid, ridge * ridge * 0.9 + 0.08 );',
        '  float dayGlow = uSunI > 0.5 ? 1.0 : 0.12;',
        '  float sss = pow( max( dot( V, normalize( -uSunDir + N * 0.42 ) ), 0.0 ), 4.0 ) * ridge;',
        '  float sunHigh = 0.2 + 0.8 * clamp( uSunDir.y * 2.2, 0.0, 1.0 );',
        '  water += uCrest * ( sss * 0.9 * sunHigh + pow( ridge, 4.0 ) * 0.2 ) * dayGlow;',
        '  vec3 col = mix( water, reflected * uRef, fres * 0.92 );',
        '  vec3 S = uSunI > 0.5 ? uSunDir : uMoonDir;',
        '  vec3 glintC = uSunI > 0.5 ? uSun : vec3( 0.75, 0.84, 1.0 );',
        '  float glintI = uSunI > 0.5 ? uSunI : uMoon * 2.4;',
        '  float sparkle = mix( 1.0, smoothstep( 0.5, 0.78, noise( vec2( q.x * uRadius * 0.55, q.y * 0.55 ) + uTime * 0.6 ) ), near );',
        '  float RdS = max( dot( R, S ), 0.0 );',
        '  col += glintC * ( pow( RdS, 900.0 ) * glintI * 0.3 * sparkle + pow( RdS, 140.0 ) * glintI * 0.006 + pow( RdS, 18.0 ) * 0.018 * min( glintI, 3.0 ) );',
        // 물마루에만 생기는 얇은 거품
        '  vec2 fq = vec2( q.x * uRadius * 0.07, q.y * 0.07 );',
        '  float n1 = noise( fq + vec2( uTime * 0.14, uTime * 0.05 ) );',
        '  float n2 = noise( fq * 2.7 - vec2( uTime * 0.21, 0.0 ) );',
        '  float n3 = noise( fq * 7.9 + vec2( 0.0, uTime * 0.33 ) );',
        '  float web = n1 * 0.5 + n2 * 0.33 + n3 * 0.17;',
        '  float crestMask = smoothstep( 4.2, 10.5, crest );',
        '  float lace = 1.0 - smoothstep( 0.0, 0.05, abs( web - 0.53 ) );',
        '  float cap = smoothstep( 0.6, 0.74, web ) * smoothstep( 7.5, 11.0, crest );',
        '  float foam = ( crestMask * lace * 0.7 + cap ) * near;',
        '  col = mix( col, uFoam, clamp( foam, 0.0, 1.0 ) * 0.78 );',
        // 비행기 그림자 (바다 위 부드러운 얼룩)
        '  vec2 toShadow = vec2( vWorld.x - uShadow.x, vWorld.z - uShadow.z );',
        '  float sh = exp( -dot( toShadow, toShadow ) / max( uShadow.y, 1.0 ) );',
        '  col *= 1.0 - sh * uShadow.w;',
        // 수평선 안개
        '  float fog = smoothstep( 420.0, 1700.0, dist );',
        '  col = mix( col, uFog, fog * fog );',
        '  gl_FragColor = vec4( gfxOut( col ), 1.0 );',
        '}'
      ].join('\n')
    });
    seaMesh = new THREE.Mesh(buildSeaGeometry(radius), mat);
    seaMesh.position.y = -radius;
    seaMesh.frustumCulled = false;
    seaMesh.renderOrder = -50;
    s.add(seaMesh);
    world.seaMesh = seaMesh;
    return seaMesh;
  }

  // ShaderMaterial은 uniforms 객체를 그대로 참조해야 공유 값(env)이 실시간 반영된다
  function uniforms_(u) { return u; }

  // ----- 구름 (한 번의 드로우콜로 그리는 부드러운 입자 뭉치) -----
  var puffTexture = null;

  function getPuffTexture() {
    if (puffTexture) return puffTexture;
    var S = 256, cv = document.createElement('canvas');
    cv.width = cv.height = S;
    var ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, S, S);
    function blob(x, y, r, a) {
      var g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(255,255,255,' + a + ')');
      g.addColorStop(0.55, 'rgba(255,255,255,' + (a * 0.55) + ')');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    blob(S / 2, S / 2, S * 0.42, 0.62);
    for (var i = 0; i < 26; i++) {
      var a = Math.random() * Math.PI * 2, d = Math.pow(Math.random(), 0.7) * S * 0.25;
      blob(S / 2 + Math.cos(a) * d, S / 2 + Math.sin(a) * d * 0.8, S * (0.07 + Math.random() * 0.15), 0.28);
    }
    var tex = new THREE.Texture(cv);
    tex.needsUpdate = true;
    tex.minFilter = THREE.LinearMipMapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    puffTexture = tex;
    return tex;
  }
  GFX.getPuffTexture = getPuffTexture;

  function makePuffGeometry(puffs) {
    // puffs: [{x,y,z,size,lit,rot}] (뒤쪽부터 그려지도록 정렬되어 있어야 한다)
    var n = puffs.length;
    var pos = new Float32Array(n * 4 * 3), corner = new Float32Array(n * 4 * 2), param = new Float32Array(n * 4 * 3);
    var idx = new Uint16Array(n * 6);
    var CORNERS = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    for (var i = 0; i < n; i++) {
      var pf = puffs[i];
      for (var c = 0; c < 4; c++) {
        var v = i * 4 + c;
        pos[v * 3] = pf.x; pos[v * 3 + 1] = pf.y; pos[v * 3 + 2] = pf.z;
        corner[v * 2] = CORNERS[c][0]; corner[v * 2 + 1] = CORNERS[c][1];
        param[v * 3] = pf.size; param[v * 3 + 1] = pf.rot; param[v * 3 + 2] = pf.lit;
      }
      idx[i * 6] = i * 4; idx[i * 6 + 1] = i * 4 + 1; idx[i * 6 + 2] = i * 4 + 2;
      idx[i * 6 + 3] = i * 4; idx[i * 6 + 4] = i * 4 + 2; idx[i * 6 + 5] = i * 4 + 3;
    }
    var g = new THREE.BufferGeometry();
    g.addAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.addAttribute('aCorner', new THREE.BufferAttribute(corner, 2));
    g.addAttribute('aParam', new THREE.BufferAttribute(param, 3));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    return g;
  }
  GFX.makePuffGeometry = makePuffGeometry;

  GFX.PUFF_VS = [
    'attribute vec2 aCorner; attribute vec3 aParam;',
    'varying vec2 vUv; varying float vLit; varying float vH; varying float vDepth;',
    'void main() {',
    '  vec4 mv = modelViewMatrix * vec4( position, 1.0 );',
    '  float c = cos( aParam.y ), s = sin( aParam.y );',
    '  vec2 q = vec2( c * aCorner.x - s * aCorner.y, s * aCorner.x + c * aCorner.y ) * aParam.x;',
    '  mv.xy += q;',
    '  vUv = aCorner * 0.5 + 0.5;',
    '  vLit = aParam.z;',
    '  vH = aCorner.y;',
    '  vDepth = -mv.z;',
    '  gl_Position = projectionMatrix * mv;',
    '}'
  ].join('\n');

  function createClouds(parent, radius) {
    var puffs = [];
    var nClouds = Math.round(GFX.q.clouds * 1.4), nPuffs = GFX.q.puffs + 3;

    function addCloud(angle, h, z, scale, flat) {
      var cx = Math.cos(angle) * (radius + h), cy = Math.sin(angle) * (radius + h);
      var tx = -Math.sin(angle), ty = Math.cos(angle);   // 공전 방향
      var rx = Math.cos(angle), ry = Math.sin(angle);    // 위쪽(행성 바깥) 방향
      var count = nPuffs + Math.floor(Math.random() * 5);
      var width = 44 * scale;
      for (var p = 0; p < count; p++) {
        var t = (p + Math.random()) / count - 0.5;
        var bulge = 1 - Math.pow(Math.abs(t) * 2, 2);
        var ox = t * width * 2 + (Math.random() - 0.5) * 10 * scale;
        var oy = (Math.random() * 0.9 - 0.12) * 20 * scale * bulge * flat;
        var size = (13 + bulge * 17 + Math.random() * 8) * scale;
        puffs.push({
          x: cx + tx * ox + rx * oy, y: cy + ty * ox + ry * oy,
          z: z + (Math.random() - 0.5) * 30 * scale,
          size: size, rot: Math.random() * 6.28, lit: 0.42 + oy / (30 * scale) * 0.75 + Math.random() * 0.1
        });
      }
    }

    var i;
    for (i = 0; i < nClouds; i++) {
      var a = (i / nClouds) * Math.PI * 2 + Math.random() * 0.14;
      addCloud(a, 150 + Math.random() * 260, -300 - Math.random() * 700, 0.9 + Math.random() * 1.3, 1);
    }
    for (i = 0; i < Math.floor(nClouds * 0.8); i++) {
      addCloud(Math.random() * Math.PI * 2, 24 + Math.random() * 70, -1000 - Math.random() * 450, 1.8 + Math.random() * 1.5, 0.5);
    }
    puffs.sort(function (a2, b2) { return a2.z - b2.z; });

    cloudUniforms = {
      tPuff: { type: 't', value: getPuffTexture() },
      uLit: { type: 'c', value: env.cloudLit }, uShade: { type: 'c', value: env.cloudShade },
      uFog: { type: 'c', value: env.fog }, uSun: { type: 'c', value: env.sun }, uSunGlow: { type: 'f', value: 0 }
    };
    var mat = new THREE.ShaderMaterial({
      uniforms: cloudUniforms, defines: GFX.defines(), transparent: true, depthWrite: false, fog: false,
      vertexShader: GFX.PUFF_VS,
      fragmentShader: [
        'uniform sampler2D tPuff; uniform vec3 uLit, uShade, uFog, uSun; uniform float uSunGlow;',
        'varying vec2 vUv; varying float vLit; varying float vH; varying float vDepth;',
        GFX.outputChunk,
        'void main() {',
        '  float a = texture2D( tPuff, vUv ).a;',
        '  if ( a < 0.004 ) discard;',
        '  float light = clamp( vLit + vH * 0.42, 0.0, 1.0 );',
        '  vec3 col = mix( uShade, uLit, smoothstep( 0.12, 0.9, light ) );',
        '  col += uSun * uSunGlow * pow( 1.0 - a, 3.0 ) * 0.5;',
        '  float fog = smoothstep( 500.0, 1900.0, vDepth );',
        '  col = mix( col, uFog, fog * 0.86 );',
        '  gl_FragColor = vec4( gfxOut( col ), a * 0.92 );',
        '}'
      ].join('\n')
    });
    cloudsMesh = new THREE.Mesh(makePuffGeometry(puffs), mat);
    cloudsMesh.frustumCulled = false;
    cloudsMesh.renderOrder = -10;
    parent.add(cloudsMesh);
  }

  // ----- 떠다니는 미세 입자 (속도감과 공기층 표현) -----
  function createDust(s) {
    var n = GFX.q.dust;
    var pos = new Float32Array(n * 3), seed = new Float32Array(n * 2);
    for (var i = 0; i < n; i++) {
      pos[i * 3] = Math.random() * 1000;
      pos[i * 3 + 1] = Math.random() * 380 - 30;
      pos[i * 3 + 2] = -260 + Math.random() * 400;
      seed[i * 2] = 0.5 + Math.random();
      seed[i * 2 + 1] = Math.random();
    }
    var g = new THREE.BufferGeometry();
    g.addAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.addAttribute('aSeed', new THREE.BufferAttribute(seed, 2));
    dustUniforms = {
      uTravel: { type: 'f', value: 0 }, uTime: shared.time, uPixel: { type: 'f', value: 1 },
      uColor: { type: 'c', value: new THREE.Color(1, 1, 1) }, uStreak: { type: 'f', value: 0 }
    };
    var mat = new THREE.ShaderMaterial({
      uniforms: dustUniforms, defines: GFX.defines(), transparent: true, depthWrite: false, fog: false,
      blending: THREE.AdditiveBlending,
      vertexShader: [
        'attribute vec2 aSeed; uniform float uTravel, uTime, uPixel;',
        'varying float vA;',
        'void main() {',
        '  vec3 p = position;',
        '  p.x = mod( position.x - uTravel * aSeed.x, 1000.0 ) - 500.0;',
        '  p.y += sin( uTime * 0.4 + aSeed.y * 40.0 ) * 6.0;',
        '  vec4 mv = modelViewMatrix * vec4( p, 1.0 );',
        '  gl_PointSize = clamp( uPixel * ( 1.2 + aSeed.y * 2.0 ) * 320.0 / -mv.z, 1.0, 9.0 );',
        '  float edge = smoothstep( 500.0, 330.0, abs( p.x ) );',
        '  vA = edge * ( 0.25 + 0.75 * aSeed.y );',
        '  gl_Position = projectionMatrix * mv;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform vec3 uColor; varying float vA;',
        GFX.outputChunk,
        'void main() {',
        '  float d = length( gl_PointCoord - 0.5 ) * 2.0;',
        '  float a = pow( max( 1.0 - d, 0.0 ), 2.0 ) * vA;',
        '  gl_FragColor = vec4( gfxOut( uColor * a * 0.5 ), 1.0 );',
        '}'
      ].join('\n')
    });
    dustMesh = new THREE.Points(g, mat);
    dustMesh.frustumCulled = false;
    dustMesh.renderOrder = 5;
    s.add(dustMesh);
  }

  // ----- 생성 / 갱신 -----
  world.createEnvironment = function (s, radius) {
    createSky(s);
    createDust(s);
    createSea(s, radius);
    applyEnv();
  };

  world.createCloudLayer = function (parent, radius) {
    createClouds(parent, radius);
  };

  var travel = 0;

  world.setState = function (distance, bossActive) {
    env.d = distance;
    sampleEnv(distance);
    bossTintTarget = bossActive ? 1 : 0;
  };

  world.addTravel = function (amount) { travel += amount; };

  world.update = function (dt) {
    shared.time.value += dt;
    bossTint += (bossTintTarget - bossTint) * Math.min(1, dt * 2.2);
    applyEnv();

    var cam = GFX.camera;
    if (seaUniforms) {
      seaUniforms.uCam.value.copy(cam.position);
      seaUniforms.uSunI.value = env.sunEl > -0.04 ? env.sunI : 0;
      seaUniforms.uMoon.value = env.moon;
      seaUniforms.uRef.value = env.seaRef;
      if (typeof sea !== 'undefined' && sea && sea.mesh) seaUniforms.uRot.value = sea.mesh.rotation.z;
      if (typeof airplane !== 'undefined' && airplane && airplane.mesh) {
        var ap = airplane.mesh.position;
        var h = Math.max(4, ap.y);
        seaUniforms.uShadow.value.set(ap.x, 260 + h * 16, ap.z, Math.max(0.1, 0.42 - h / 620));
      }
    }
    if (sky) {
      var su = sky.material.uniforms;
      su.uSunI.value = env.sunI;
      su.uStars.value = env.stars;
      su.uAurora.value = env.aurora;
      su.uMoon.value = env.moon;
    }
    if (cloudUniforms) {
      cloudUniforms.uSunGlow.value = Math.min(1.4, env.sunI * 0.03);
    }
    if (dustUniforms) {
      dustUniforms.uTravel.value = travel;
      dustUniforms.uPixel.value = GFX.renderer ? GFX.renderer.getPixelRatio() : 1;
      var bright = 0.3 + env.exposure * 0.4;
      dustUniforms.uColor.value.setRGB(bright, bright * 0.98, bright * 0.9);
    }
  };

})();
