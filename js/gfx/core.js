// ===== Fly Darwin 그래픽 코어 =====
// Three.js r75 위에 올린 HDR 렌더링 파이프라인.
// 1) 기기 성능별 품질 단계  2) 재질 셰이더 교체(선형 조명, GGX, 하늘 반사, 림 라이트)
// 3) 블룸, 톤매핑, 안티앨리어싱, 화면 효과  4) 프레임 저하 시 해상도 자동 조절
(function (root) {
  'use strict';

  var GFX = root.GFX = {};

  // ----- 품질 단계 -----
  var PRESETS = {
    high:   { hdr: true,  bloomLevels: 5, fxaa: true,  shadows: 2048, maxDpr: 2,   seaX: 300, seaZ: 56, clouds: 30, puffs: 12, voxel: 1,   dust: 240, particles: 6000, aberration: true  },
    medium: { hdr: true,  bloomLevels: 4, fxaa: true,  shadows: 0,    maxDpr: 1.5, seaX: 170, seaZ: 30, clouds: 18, puffs: 9,  voxel: 1.5, dust: 110, particles: 3000, aberration: false },
    low:    { hdr: false, bloomLevels: 0, fxaa: false, shadows: 0,    maxDpr: 1,   seaX: 96,  seaZ: 16, clouds: 10, puffs: 6,  voxel: 2.2, dust: 40,  particles: 1200, aberration: false }
  };

  var STORAGE_KEY = 'gfxQuality';
  var mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

  function readPreference() {
    try { return localStorage.getItem(STORAGE_KEY) || 'auto'; } catch (e) { return 'auto'; }
  }

  // URL의 ?gfx=high|medium|low 로도 강제할 수 있다 (테스트용)
  function resolveTier(pref) {
    var m = /[?&]gfx=(high|medium|low)/.exec(location.search);
    if (m) return m[1];
    if (pref !== 'auto' && PRESETS[pref]) return pref;
    return mobile ? 'medium' : 'high';
  }

  GFX.preference = readPreference();
  GFX.tier = resolveTier(GFX.preference);
  GFX.q = PRESETS[GFX.tier];
  GFX.mobile = mobile;

  GFX.setPreference = function (pref) {
    try { localStorage.setItem(STORAGE_KEY, pref); } catch (e) {}
    GFX.preference = pref;
  };

  // ----- 색 유틸 (모든 환경값은 선형 공간에서 계산) -----
  GFX.linear = function (hex) {
    var c = new THREE.Color(hex);
    c.r = Math.pow(c.r, 2.2); c.g = Math.pow(c.g, 2.2); c.b = Math.pow(c.b, 2.2);
    return c;
  };

  // ----- 재질 셰이더 교체 -----
  // 게임의 모든 MeshPhongMaterial이 코드 변경 없이 이 셰이더로 그려진다.
  var C = THREE.ShaderChunk;

  C.tonemapping_pars_fragment = C.tonemapping_pars_fragment.replace(
    /vec3 OptimizedCineonToneMapping\( vec3 color \) \{[\s\S]*?\n\}/,
    'vec3 OptimizedCineonToneMapping( vec3 color ) {\n' +
    '  color *= toneMappingExposure;\n' +
    '  return saturate( ( color * ( 2.51 * color + 0.03 ) ) / ( color * ( 2.43 * color + 0.59 ) + 0.14 ) );\n' +
    '}'
  );

  C.lights_phong_pars_fragment = C.lights_phong_pars_fragment.replace(
    /void RE_Direct_BlinnPhong[\s\S]*?\n\}/,
    [
      'float gfxRoughness( const in float s ) {',
      '  return clamp( mix( 0.72, 0.16, smoothstep( 8.0, 140.0, s ) ), 0.08, 1.0 );',
      '}',
      'void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in GeometricContext geometry, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {',
      '  float NdotL = dot( geometry.normal, directLight.direction );',
      '  float wrapped = saturate( ( NdotL + 0.22 ) / 1.22 );',
      '  wrapped *= wrapped * ( 3.0 - 2.0 * wrapped ) * 0.35 + 0.65;',
      '  vec3 irradiance = wrapped * directLight.color * PI;',
      '  reflectedLight.directDiffuse += irradiance * BRDF_Diffuse_Lambert( material.diffuseColor );',
      '  if ( NdotL > 0.0 ) {',
      '    vec3 specIrr = NdotL * directLight.color * PI;',
      '    reflectedLight.directSpecular += specIrr * BRDF_Specular_GGX( directLight, geometry, material.specularColor, gfxRoughness( material.specularShininess ) ) * material.specularStrength;',
      '  }',
      '}'
    ].join('\n')
  );

  C.lights_phong_fragment = [
    'BlinnPhongMaterial material;',
    'material.diffuseColor = diffuseColor.rgb;',
    'material.specularColor = max( pow( specular, vec3( 2.2 ) ), vec3( 0.04 ) );',
    'material.specularShininess = shininess;',
    'material.specularStrength = specularStrength;'
  ].join('\n');

  var PHONG_VS_HEAD = [
    '#ifdef GFX_VOXEL',
    'varying vec3 vVoxPos;',
    '#endif'
  ].join('\n');

  THREE.ShaderLib.phong.vertexShader = THREE.ShaderLib.phong.vertexShader
    .replace('#define PHONG', '#define PHONG\n' + PHONG_VS_HEAD)
    .replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef GFX_VOXEL\nvVoxPos = position;\n#endif');

  THREE.ShaderLib.phong.fragmentShader = [
    '#define PHONG',
    '#ifdef GFX_VOXEL',
    'varying vec3 vVoxPos;',
    '#endif',
    'uniform vec3 diffuse;',
    'uniform vec3 emissive;',
    'uniform vec3 specular;',
    'uniform float shininess;',
    'uniform float opacity;',
    '#include <common>',
    '#include <color_pars_fragment>',
    '#include <uv_pars_fragment>',
    '#include <uv2_pars_fragment>',
    '#include <map_pars_fragment>',
    '#include <alphamap_pars_fragment>',
    '#include <aomap_pars_fragment>',
    '#include <lightmap_pars_fragment>',
    '#include <emissivemap_pars_fragment>',
    '#include <envmap_pars_fragment>',
    '#include <fog_pars_fragment>',
    '#include <bsdfs>',
    '#include <lights_pars>',
    '#include <lights_phong_pars_fragment>',
    '#include <shadowmap_pars_fragment>',
    '#include <bumpmap_pars_fragment>',
    '#include <normalmap_pars_fragment>',
    '#include <specularmap_pars_fragment>',
    '#include <logdepthbuf_pars_fragment>',
    'void main() {',
    '  vec4 diffuseColor = vec4( pow( diffuse, vec3( 2.2 ) ), opacity );',
    '  ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );',
    '  vec3 totalEmissiveRadiance = pow( max( emissive, vec3( 0.0 ) ), vec3( 2.2 ) );',
    '  #include <logdepthbuf_fragment>',
    '  #include <map_fragment>',
    '  #include <color_fragment>',
    '  #ifdef GFX_VOXEL',
    '    vec3 voxF = abs( fract( vVoxPos + 0.5 ) - 0.5 );',
    '    float voxEdge = max( min( voxF.x, voxF.y ), min( max( voxF.x, voxF.y ), voxF.z ) );',
    '    float voxPix = max( fwidth( vVoxPos.x ) + fwidth( vVoxPos.y ) + fwidth( vVoxPos.z ), 0.0001 );',
    '    float voxFade = 1.0 - smoothstep( 0.18, 0.55, voxPix );',
    '    diffuseColor.rgb *= mix( 1.0, mix( 0.62, 1.04, smoothstep( 0.0, 0.14 + voxPix * 0.5, voxEdge ) ), voxFade );',
    '  #endif',
    '  #include <alphamap_fragment>',
    '  #include <alphatest_fragment>',
    '  #include <specularmap_fragment>',
    '  #include <normal_fragment>',
    '  #include <emissivemap_fragment>',
    '  #include <lights_phong_fragment>',
    '  #include <lights_template>',
    '  #include <aomap_fragment>',
    '  vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;',
    '  #if NUM_HEMI_LIGHTS > 0',
    '    float gfxNdotV = saturate( dot( geometry.normal, geometry.viewDir ) );',
    '    vec3 gfxR = reflect( -geometry.viewDir, geometry.normal );',
    '    float gfxUp = dot( gfxR, hemisphereLights[ 0 ].direction );',
    '    vec3 gfxEnv = mix( hemisphereLights[ 0 ].groundColor, hemisphereLights[ 0 ].skyColor, smoothstep( -0.35, 0.65, gfxUp ) );',
    '    float gfxRough = gfxRoughness( shininess );',
    '    float gfxFres = material.specularColor.g + ( 1.0 - material.specularColor.g ) * pow( 1.0 - gfxNdotV, 5.0 );',
    '    outgoingLight += gfxEnv * gfxFres * ( 1.0 - gfxRough * 0.72 ) * 1.1;',
    '    outgoingLight += gfxEnv * pow( 1.0 - gfxNdotV, 3.5 ) * 0.34 * ( diffuseColor.rgb + 0.25 );',
    '  #endif',
    '  gl_FragColor = vec4( outgoingLight, diffuseColor.a );',
    '  #include <premultiplied_alpha_fragment>',
    '  #include <tonemapping_fragment>',
    '  #include <encodings_fragment>',
    '  #include <fog_fragment>',
    '}'
  ].join('\n');

  // ----- 공통 셰이더 조각 -----
  // HDR 파이프라인이 없을 때(저사양)는 각 셰이더가 직접 톤매핑과 감마를 처리한다.
  GFX.outputChunk = [
    'vec3 gfxAces( vec3 x ) {',
    '  return clamp( ( x * ( 2.51 * x + 0.03 ) ) / ( x * ( 2.43 * x + 0.59 ) + 0.14 ), 0.0, 1.0 );',
    '}',
    'vec3 gfxOut( vec3 c ) {',
    '#ifdef GFX_DIRECT',
    '  return pow( gfxAces( c ), vec3( 1.0 / 2.2 ) );',
    '#else',
    '  return c;',
    '#endif',
    '}'
  ].join('\n');

  GFX.defines = function (extra) {
    var d = extra || {};
    if (!GFX.pipelineActive()) d.GFX_DIRECT = 1;
    return d;
  };

  // ----- 파이프라인 -----
  var renderer = null, scene = null, camera = null;
  var pipelineOn = false;
  var headless = false;
  var rtScene = null, rtLdr = null, bloomMips = [];
  var fsScene, fsCam, fsQuad;
  var matPrefilter, matDown, matUp, matComposite, matFxaa;
  var resScale = 1;
  var bufferW = 0, bufferH = 0;

  // 화면 효과 상태 (게임 코드에서 호출)
  var fxState = {
    hit: 0,               // 피격 붉은 번쩍임
    flash: 0,             // 진화/보스 처치 흰 번쩍임
    slow: 0,              // 블랙홀 시간 지연 강도
    shield: 0,            // 무적 금빛
    lensX: 0.5, lensY: 0.5, lens: 0  // 블랙홀 중력 렌즈
  };
  GFX.fxState = fxState;

  GFX.pipelineActive = function () { return pipelineOn; };
  GFX.setHeadless = function (v) { headless = v; };

  // 부동소수 렌더 타깃을 실제로 쓸 수 있는지 확인
  function probeHalfFloat(gl) {
    var hf = gl.getExtension('OES_texture_half_float');
    var linear = gl.getExtension('OES_texture_half_float_linear');
    gl.getExtension('EXT_color_buffer_half_float');
    if (!hf || !linear) return false;
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 4, 4, 0, gl.RGBA, hf.HALF_FLOAT_OES, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    var fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    var ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.deleteFramebuffer(fb);
    gl.deleteTexture(tex);
    return ok;
  }

  var FS_VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4( position.xy, 0.0, 1.0 ); }';

  function fsMaterial(frag, uniforms, blending) {
    return new THREE.ShaderMaterial({
      uniforms: uniforms, vertexShader: FS_VERT, fragmentShader: frag,
      depthTest: false, depthWrite: false, fog: false, lights: false,
      blending: blending || THREE.NoBlending, transparent: !!blending
    });
  }

  function makeTarget(w, h, floatType, depth) {
    return new THREE.WebGLRenderTarget(Math.max(1, Math.floor(w)), Math.max(1, Math.floor(h)), {
      minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping,
      format: THREE.RGBAFormat, type: floatType ? THREE.HalfFloatType : THREE.UnsignedByteType,
      depthBuffer: !!depth, stencilBuffer: false, generateMipmaps: false
    });
  }

  function buildPostMaterials() {
    matPrefilter = fsMaterial([
      'varying vec2 vUv; uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uThreshold;',
      'vec3 fetch( vec2 uv ) { return min( texture2D( tSrc, uv ).rgb, vec3( 40.0 ) ); }',
      'void main() {',
      '  vec3 a = fetch( vUv + uTexel * vec2( -1.0, -1.0 ) );',
      '  vec3 b = fetch( vUv + uTexel * vec2(  1.0, -1.0 ) );',
      '  vec3 c = fetch( vUv + uTexel * vec2( -1.0,  1.0 ) );',
      '  vec3 d = fetch( vUv + uTexel * vec2(  1.0,  1.0 ) );',
      '  float wa = 1.0 / ( 1.0 + max( a.r, max( a.g, a.b ) ) );',
      '  float wb = 1.0 / ( 1.0 + max( b.r, max( b.g, b.b ) ) );',
      '  float wc = 1.0 / ( 1.0 + max( c.r, max( c.g, c.b ) ) );',
      '  float wd = 1.0 / ( 1.0 + max( d.r, max( d.g, d.b ) ) );',
      '  vec3 col = ( a * wa + b * wb + c * wc + d * wd ) / ( wa + wb + wc + wd );',
      '  float br = max( col.r, max( col.g, col.b ) );',
      '  float knee = uThreshold * 0.5;',
      '  float soft = clamp( br - uThreshold + knee, 0.0, 2.0 * knee );',
      '  soft = soft * soft / ( 4.0 * knee + 1e-4 );',
      '  float contrib = max( soft, br - uThreshold ) / max( br, 1e-4 );',
      '  gl_FragColor = vec4( col * contrib, 1.0 );',
      '}'
    ].join('\n'), {
      tSrc: { type: 't', value: null }, uTexel: { type: 'v2', value: new THREE.Vector2() }, uThreshold: { type: 'f', value: 1.05 }
    });

    matDown = fsMaterial([
      'varying vec2 vUv; uniform sampler2D tSrc; uniform vec2 uTexel;',
      'void main() {',
      '  vec3 s = texture2D( tSrc, vUv ).rgb * 4.0;',
      '  s += texture2D( tSrc, vUv + uTexel * vec2( -1.0, -1.0 ) ).rgb;',
      '  s += texture2D( tSrc, vUv + uTexel * vec2(  1.0, -1.0 ) ).rgb;',
      '  s += texture2D( tSrc, vUv + uTexel * vec2( -1.0,  1.0 ) ).rgb;',
      '  s += texture2D( tSrc, vUv + uTexel * vec2(  1.0,  1.0 ) ).rgb;',
      '  gl_FragColor = vec4( s / 8.0, 1.0 );',
      '}'
    ].join('\n'), { tSrc: { type: 't', value: null }, uTexel: { type: 'v2', value: new THREE.Vector2() } });

    matUp = fsMaterial([
      'varying vec2 vUv; uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uWeight;',
      'void main() {',
      '  vec3 s = texture2D( tSrc, vUv + uTexel * vec2( -2.0, 0.0 ) ).rgb;',
      '  s += texture2D( tSrc, vUv + uTexel * vec2( -1.0, 1.0 ) ).rgb * 2.0;',
      '  s += texture2D( tSrc, vUv + uTexel * vec2( 0.0, 2.0 ) ).rgb;',
      '  s += texture2D( tSrc, vUv + uTexel * vec2( 1.0, 1.0 ) ).rgb * 2.0;',
      '  s += texture2D( tSrc, vUv + uTexel * vec2( 2.0, 0.0 ) ).rgb;',
      '  s += texture2D( tSrc, vUv + uTexel * vec2( 1.0, -1.0 ) ).rgb * 2.0;',
      '  s += texture2D( tSrc, vUv + uTexel * vec2( 0.0, -2.0 ) ).rgb;',
      '  s += texture2D( tSrc, vUv + uTexel * vec2( -1.0, -1.0 ) ).rgb * 2.0;',
      '  gl_FragColor = vec4( s / 12.0 * uWeight, 1.0 );',
      '}'
    ].join('\n'), {
      tSrc: { type: 't', value: null }, uTexel: { type: 'v2', value: new THREE.Vector2() }, uWeight: { type: 'f', value: 1 }
    }, THREE.AdditiveBlending);

    matComposite = fsMaterial([
      'varying vec2 vUv;',
      'uniform sampler2D tScene; uniform sampler2D tBloom;',
      'uniform float uBloom, uExposure, uTime, uSat, uAberration;',
      'uniform float uHit, uFlash, uSlow, uShield;',
      'uniform vec3 uLens; uniform float uAspect;',
      GFX.outputChunk.replace('#ifdef GFX_DIRECT', '#if 0'),
      'float grain( vec2 p ) { return fract( sin( dot( p, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 ); }',
      'void main() {',
      '  vec2 uv = vUv;',
      '  vec2 fromCenter = uv - 0.5;',
      // 블랙홀 중력 렌즈: 화면상의 블랙홀 주변 픽셀을 바깥쪽에서 끌어온다
      '  if ( uLens.z > 0.002 ) {',
      '    vec2 d = uv - uLens.xy; d.x *= uAspect;',
      '    float r = length( d ) + 1e-4;',
      '    float rh = uLens.z;',
      '    if ( r > rh ) {',
      '      float bend = rh * rh * 2.2 / r * smoothstep( rh * 8.0, rh * 2.0, r );',
      '      vec2 off = d / r * bend; off.x /= uAspect;',
      '      uv -= off;',
      '    }',
      '  }',
      '  vec3 col;',
      '  if ( uAberration > 0.0 ) {',
      '    vec2 ca = fromCenter * dot( fromCenter, fromCenter ) * uAberration;',
      '    col = vec3( texture2D( tScene, uv + ca ).r, texture2D( tScene, uv ).g, texture2D( tScene, uv - ca ).b );',
      '  } else {',
      '    col = texture2D( tScene, uv ).rgb;',
      '  }',
      '  col += texture2D( tBloom, uv ).rgb * uBloom;',
      '  col *= uExposure;',
      '  vec3 mapped = pow( gfxAces( col ), vec3( 1.0 / 2.2 ) );',
      '  float luma = dot( mapped, vec3( 0.2126, 0.7152, 0.0722 ) );',
      '  mapped = mix( vec3( luma ), mapped, uSat * ( 1.0 - uSlow * 0.55 ) );',
      '  mapped = mix( mapped, mapped * vec3( 0.86, 0.92, 1.12 ), uSlow );',
      // 렌즈 비네트
      '  float vig = smoothstep( 0.28, 0.98, length( fromCenter * vec2( 1.0, 0.82 ) ) * 1.18 );',
      '  mapped *= 1.0 - vig * 0.34;',
      '  float edge = smoothstep( 0.3, 0.95, length( fromCenter ) * 1.3 );',
      '  mapped = mix( mapped, vec3( 1.0, 0.1, 0.06 ), uHit * edge * 0.72 );',
      '  mapped += vec3( 1.0, 0.78, 0.32 ) * uShield * edge * 0.2;',
      '  mapped += vec3( uFlash );',
      '  mapped += ( grain( gl_FragCoord.xy + uTime ) - 0.5 ) * 1.6 / 255.0;',
      '  gl_FragColor = vec4( mapped, 1.0 );',
      '}'
    ].join('\n'), {
      tScene: { type: 't', value: null }, tBloom: { type: 't', value: null },
      uBloom: { type: 'f', value: 0.6 }, uExposure: { type: 'f', value: 1 }, uTime: { type: 'f', value: 0 },
      uSat: { type: 'f', value: 1.08 }, uAberration: { type: 'f', value: 0 },
      uHit: { type: 'f', value: 0 }, uFlash: { type: 'f', value: 0 }, uSlow: { type: 'f', value: 0 }, uShield: { type: 'f', value: 0 },
      uLens: { type: 'v3', value: new THREE.Vector3() }, uAspect: { type: 'f', value: 1 }
    });

    matFxaa = fsMaterial([
      'varying vec2 vUv; uniform sampler2D tSrc; uniform vec2 uTexel;',
      'float L( vec3 c ) { return dot( c, vec3( 0.299, 0.587, 0.114 ) ); }',
      'void main() {',
      '  vec3 rgbM = texture2D( tSrc, vUv ).rgb;',
      '  float lM = L( rgbM );',
      '  float lNW = L( texture2D( tSrc, vUv + uTexel * vec2( -1.0, -1.0 ) ).rgb );',
      '  float lNE = L( texture2D( tSrc, vUv + uTexel * vec2(  1.0, -1.0 ) ).rgb );',
      '  float lSW = L( texture2D( tSrc, vUv + uTexel * vec2( -1.0,  1.0 ) ).rgb );',
      '  float lSE = L( texture2D( tSrc, vUv + uTexel * vec2(  1.0,  1.0 ) ).rgb );',
      '  float lMin = min( lM, min( min( lNW, lNE ), min( lSW, lSE ) ) );',
      '  float lMax = max( lM, max( max( lNW, lNE ), max( lSW, lSE ) ) );',
      '  if ( lMax - lMin < max( 0.04, lMax * 0.12 ) ) { gl_FragColor = vec4( rgbM, 1.0 ); return; }',
      '  vec2 dir = vec2( -( ( lNW + lNE ) - ( lSW + lSE ) ), ( lNW + lSW ) - ( lNE + lSE ) );',
      '  float reduce = max( ( lNW + lNE + lSW + lSE ) * 0.03125, 0.0078125 );',
      '  float rcp = 1.0 / ( min( abs( dir.x ), abs( dir.y ) ) + reduce );',
      '  dir = clamp( dir * rcp, vec2( -8.0 ), vec2( 8.0 ) ) * uTexel;',
      '  vec3 a = 0.5 * ( texture2D( tSrc, vUv + dir * ( 1.0 / 3.0 - 0.5 ) ).rgb + texture2D( tSrc, vUv + dir * ( 2.0 / 3.0 - 0.5 ) ).rgb );',
      '  vec3 b = a * 0.5 + 0.25 * ( texture2D( tSrc, vUv + dir * -0.5 ).rgb + texture2D( tSrc, vUv + dir * 0.5 ).rgb );',
      '  float lB = L( b );',
      '  gl_FragColor = vec4( ( lB < lMin || lB > lMax ) ? a : b, 1.0 );',
      '}'
    ].join('\n'), { tSrc: { type: 't', value: null }, uTexel: { type: 'v2', value: new THREE.Vector2() } });
  }

  function allocateTargets() {
    var size = renderer.getSize();
    var dpr = renderer.getPixelRatio();
    var w = Math.max(2, Math.floor(size.width * dpr * resScale));
    var h = Math.max(2, Math.floor(size.height * dpr * resScale));
    if (w === bufferW && h === bufferH && rtScene) return;
    bufferW = w; bufferH = h;

    function release(t) { if (t) t.dispose(); }
    release(rtScene); release(rtLdr);
    bloomMips.forEach(release);
    bloomMips = [];

    rtScene = makeTarget(w, h, true, true);
    rtLdr = GFX.q.fxaa ? makeTarget(w, h, false, false) : null;
    var mw = w, mh = h;
    for (var i = 0; i < GFX.q.bloomLevels; i++) {
      mw = Math.max(2, Math.floor(mw / 2));
      mh = Math.max(2, Math.floor(mh / 2));
      bloomMips.push(makeTarget(mw, mh, true, false));
    }
  }

  function fullscreen(mat, target) {
    fsQuad.material = mat;
    if (target) renderer.render(fsScene, fsCam, target, false);
    else renderer.render(fsScene, fsCam);
  }

  // ----- 해상도 자동 조절 -----
  var frameAvg = 16.7, frameWarm = 0, lastAdjust = 0, lastFrameTs = 0;

  function trackFrameTime() {
    var now = performance.now();
    var dt = now - lastFrameTs;
    lastFrameTs = now;
    if (dt <= 0 || dt > 120 || document.hidden) return;      // 탭 전환 등은 측정에서 제외
    frameAvg += (dt - frameAvg) * 0.04;
    frameWarm++;
    if (frameWarm < 120 || now - lastAdjust < 1800) return;

    if (frameAvg > 21 && resScale > 0.55) {
      setResolutionScale(Math.max(0.55, resScale - 0.12));
      lastAdjust = now;
    } else if (frameAvg < 15.2 && resScale < 1) {
      setResolutionScale(Math.min(1, resScale + 0.06));
      lastAdjust = now + 2500;
    }
  }

  function setResolutionScale(s) {
    resScale = s;
    if (pipelineOn) allocateTargets();
  }
  GFX.getResolutionScale = function () { return resScale; };

  // ----- 초기화 -----
  GFX.createRenderer = function () {
    var useHdrPath = GFX.q.hdr;
    return new THREE.WebGLRenderer({ alpha: true, antialias: !useHdrPath });
  };

  GFX.init = function (r, s, c) {
    renderer = r; scene = s; camera = c;
    GFX.renderer = r; GFX.scene = s; GFX.camera = c;
    var gl = renderer.getContext();

    renderer.extensions.get('OES_standard_derivatives');
    if (GFX.q.hdr && !probeHalfFloat(gl)) {
      // HDR 불가 기기는 저사양 경로로 내린다
      GFX.tier = 'low';
      GFX.q = PRESETS.low;
    }
    pipelineOn = GFX.q.hdr;

    if (pipelineOn) {
      renderer.autoClear = true;
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.gammaOutput = false;
      fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      fsScene = new THREE.Scene();
      fsQuad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), new THREE.MeshBasicMaterial());
      fsQuad.frustumCulled = false;
      fsScene.add(fsQuad);
      buildPostMaterials();
      allocateTargets();
    } else {
      GFX.useDirectOutput(renderer);
    }

    if (GFX.q.shadows) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    } else {
      renderer.shadowMap.enabled = false;
    }
  };

  // 캔버스에 바로 그리는 렌더러(상점 미리보기, 저사양)의 출력 설정
  GFX.useDirectOutput = function (r, exposure) {
    r.toneMapping = THREE.CineonToneMapping;
    r.toneMappingExposure = exposure || 1;
    r.gammaOutput = true;
    r.gammaFactor = 2.2;
  };

  GFX.onResize = function () {
    if (pipelineOn) allocateTargets();
  };

  var clock = 0;
  var lastTs = 0;

  GFX.time = function () { return clock; };

  GFX.render = function () {
    if (headless) return;
    var now = performance.now();
    var dt = lastTs ? Math.min(100, now - lastTs) : 16;
    lastTs = now;
    clock += dt / 1000;
    trackFrameTime();

    fxState.hit *= Math.pow(0.0035, dt / 1000);
    fxState.flash *= Math.pow(0.012, dt / 1000);
    fxState.lens *= Math.pow(0.002, dt / 1000);

    if (GFX.world && GFX.world.update) GFX.world.update(dt / 1000);
    if (GFX.fx && GFX.fx.update) GFX.fx.update(dt / 1000);

    if (!pipelineOn) {
      renderer.render(scene, camera);
      return;
    }

    renderer.render(scene, camera, rtScene, true);

    // 블룸
    var src = rtScene, i;
    var u = matPrefilter.uniforms;
    u.tSrc.value = rtScene;
    u.uTexel.value.set(1 / rtScene.width, 1 / rtScene.height);
    u.uThreshold.value = GFX.world ? GFX.world.bloomThreshold : 1.05;
    fullscreen(matPrefilter, bloomMips[0]);

    for (i = 1; i < bloomMips.length; i++) {
      src = bloomMips[i - 1];
      matDown.uniforms.tSrc.value = src;
      matDown.uniforms.uTexel.value.set(1 / src.width, 1 / src.height);
      fullscreen(matDown, bloomMips[i]);
    }

    renderer.autoClear = false;
    for (i = bloomMips.length - 2; i >= 0; i--) {
      src = bloomMips[i + 1];
      matUp.uniforms.tSrc.value = src;
      matUp.uniforms.uTexel.value.set(1 / src.width, 1 / src.height);
      matUp.uniforms.uWeight.value = 0.82;
      fullscreen(matUp, bloomMips[i]);
    }
    renderer.autoClear = true;

    var cu = matComposite.uniforms;
    cu.tScene.value = rtScene;
    cu.tBloom.value = bloomMips[0];
    cu.uBloom.value = GFX.world ? GFX.world.bloomAmount : 0.5;
    cu.uExposure.value = GFX.world ? GFX.world.exposure : 1;
    cu.uTime.value = clock % 10;
    cu.uAberration.value = GFX.q.aberration ? 0.0065 : 0;
    cu.uHit.value = fxState.hit;
    cu.uFlash.value = fxState.flash;
    cu.uSlow.value = fxState.slow;
    cu.uShield.value = fxState.shield;
    cu.uAspect.value = rtScene.width / rtScene.height;
    cu.uLens.value.set(fxState.lensX, fxState.lensY, fxState.lens);

    if (rtLdr) {
      fullscreen(matComposite, rtLdr);
      matFxaa.uniforms.tSrc.value = rtLdr;
      matFxaa.uniforms.uTexel.value.set(1 / rtLdr.width, 1 / rtLdr.height);
      fullscreen(matFxaa, null);
    } else {
      fullscreen(matComposite, null);
    }
  };

  // ----- 화면 효과 호출 -----
  GFX.hitFlash = function () { fxState.hit = 1; };
  GFX.whiteFlash = function (v) { fxState.flash = Math.max(fxState.flash, v || 0.7); };

})(window);
