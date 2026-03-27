//COLORS
var Colors = {
    red:0xf25346,
    white:0xd8d0d1,
    brown:0x59332e,
    brownDark:0x23190f,
    pink:0xF5986E,
    yellow:0xf4ce93,
    blue:0x1A8A7D,

};

var environmentThemes = [
  { distance: 0, clearColor: 0x87CEEB },
  { distance: 3000, clearColor: 0xE7BC8A },
  { distance: 7000, clearColor: 0x29455B },
  { distance: 11000, clearColor: 0x0B1026 }
];

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function lerpNumber(a, b, t) {
  return a + (b - a) * t;
}

function lerpHexColor(a, b, t) {
  var color = new THREE.Color(a);
  color.lerp(new THREE.Color(b), t);
  return color;
}

function getEnvironmentThemeState(distance) {
  var d = Math.max(0, distance || 0);
  var from = environmentThemes[0];
  var to = environmentThemes[environmentThemes.length - 1];

  for (var i = 0; i < environmentThemes.length - 1; i++) {
    if (d >= environmentThemes[i].distance && d < environmentThemes[i + 1].distance) {
      from = environmentThemes[i];
      to = environmentThemes[i + 1];
      break;
    }
  }

  var range = Math.max(1, to.distance - from.distance);
  var t = clamp01((d - from.distance) / range);

  var state = {
    clearColor: lerpHexColor(from.clearColor, to.clearColor, t)
  };

  if (typeof bossState !== 'undefined' && bossState.active) {
    state.clearColor.lerp(new THREE.Color(0x120b18), 0.45);
  }

  return state;
}

function applyEnvironmentTheme() {
  if (typeof THREE === 'undefined') return;

  var state = getEnvironmentThemeState(game ? game.distance : 0);

  if (scene) {
    scene.background = state.clearColor.clone();
  }

  if (renderer) {
    renderer.setClearColor(state.clearColor, 1);
  }
}

///////////////

// SOUND EFFECTS (Web Audio API - no external files needed)
var audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // 釉뚮씪?곗? ?먮룞?ъ깮 ?뺤콉 ??? suspended ?곹깭?대㈃ resume
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playPowerupSound() {
  try {
    var ctx = getAudioCtx();
    var now = ctx.currentTime;

    //
    var frequencies = [523, 659, 784, 1047]; // C5, E5, G5, C6
    for (var i = 0; i < frequencies.length; i++) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = frequencies[i];
      gain.gain.setValueAtTime(0.15, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.25);
    }
  } catch(e) {}
}

function playDestroySound() {
  try {
    var ctx = getAudioCtx();
    var now = ctx.currentTime;

    //
    var osc = ctx.createOscillator();
    var oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
    oscGain.gain.setValueAtTime(0.16, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);

    //
    var bufferSize = ctx.sampleRate * 0.25;
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    var noise = ctx.createBufferSource();
    noise.buffer = buffer;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.13, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    var filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 3000;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.3);
  } catch(e) {}
}

function playInvincibleSmashSound() {
  //
  if (typeof playShatterSound === 'function') {
    playShatterSound();
  }
}

function playCoinSound() {
  try {
    var ctx = getAudioCtx();
    var now = ctx.currentTime;

    //
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(1800, now + 0.05);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  } catch(e) {}
}

// GAME VARIABLES
var game;
var paused = false;
var deltaTime = 0;
var newTime = new Date().getTime();
var oldTime = new Date().getTime();
var ennemiesPool = [];
var particlesPool = [];
var particlesInUse = [];
var thunderHeightBag = [];

function refillThunderHeightBag() {
  thunderHeightBag = [0, 1, 2, 3, 4];
  for (var i = thunderHeightBag.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = thunderHeightBag[i];
    thunderHeightBag[i] = thunderHeightBag[j];
    thunderHeightBag[j] = temp;
  }
}

function getThunderSpawnDistance() {
  var laneCount = 5;
  var minOffset = -(game.planeAmpHeight - 20);
  var maxOffset = game.planeAmpHeight - 20;
  var laneSpan = (maxOffset - minOffset) / laneCount;

  if (!thunderHeightBag.length) refillThunderHeightBag();

  var lane = thunderHeightBag.pop();
  var laneMin = minOffset + lane * laneSpan;
  var offset = laneMin + Math.random() * laneSpan;
  offset = Math.max(minOffset + 4, Math.min(maxOffset - 4, offset));

  return game.seaRadius + game.planeDefaultHeight + offset;
}

function getEnemyDestroyColor(type) {
  var colors = {
    mace: 0xC62828,
    thunder: 0xFFFF00,
    asteroid: 0x8B7355,
    waterPillar: 0x6B9DAD,
    fireWall: 0xFF4500,
    blackHole: 0xFF8C00
  };
  return colors[type] || 0x666666;
}

function resetGame(){
  game = {speed:0,
          initSpeed:.00035,
          baseSpeed:.00035,
          targetBaseSpeed:.00035,
          incrementSpeedByTime:.0000025,
          incrementSpeedByLevel:.000005,
          maxSpeed:.00085,
          distanceForSpeedUpdate:100,
          speedLastUpdate:0,

          distance:0,
          ratioSpeedDistance:50,
          hearts: (typeof getStartingHearts === 'function') ? getStartingHearts() : 3,
          maxHearts: (typeof getStartingMaxHearts === 'function') ? getStartingMaxHearts() : 5,
          coins: parseInt(localStorage.getItem('totalCoins') || '0'),
          coinsEarnedThisRound: 0,

          // Continue system
          continueCount: 0,
          continueCosts: (typeof getContinueCosts === 'function') ? getContinueCosts() : [50, 200, 300],
          maxContinues: 3,

          level:1,
          levelLastUpdate:0,
          distanceForLevelUpdate:1500,

          planeDefaultHeight:100,
          planeAmpHeight:80,
          planeAmpWidth:75,
          planeMoveSensivity:0.005,
          planeRotXSensivity:0.0008,
          planeRotZSensivity:0.0004,
          planeFallSpeed:.001,
          planeMinSpeed:1.2,
          planeMaxSpeed:1.6,
          planeSpeed:0,
          planeCollisionDisplacementX:0,
          planeCollisionSpeedX:0,

          planeCollisionDisplacementY:0,
          planeCollisionSpeedY:0,

          seaRadius:600,
          seaLength:800,
          //seaRotationSpeed:0.006,
          wavesMinAmp : 5,
          wavesMaxAmp : 20,
          wavesMinSpeed : 0.001,
          wavesMaxSpeed : 0.003,

          cameraFarPos:500,
          cameraNearPos:150,
          cameraSensivity:0.002,

          coinDistanceTolerance:15,
          coinValue:1,
          coinsSpeed:.5,
          coinLastSpawn:0,
          distanceForCoinsSpawn:100,

          ennemyDistanceTolerance:10,
          ennemyValue:10,
          ennemiesSpeed:.6,
          ennemyLastSpawn:0,
          distanceForEnnemiesSpawn:50,

          //
          fireWallLastSpawn:0,
          distanceForFireWallSpawn:200,
          blackHoleActive:false,
          blackHoleSlowFactor:1.0,
          flyingAsteroidLastSpawn:0,
          distanceForFlyingAsteroidSpawn:120,
          waterPillarLastSpawn:0,
          distanceForWaterPillarSpawn:150,

          // Turbulence (?쒓린瑜?
          turbulenceActive: false,
          turbulenceLevel: 0,       // 0: ?놁쓬, 1~3: 媛뺣룄
          turbulenceTimer: 0,
          turbulenceDuration: 4000,  // 4珥덇컙 吏??
          turbulenceTriggered: [],   // ?대? ?몃━嫄곕맂 嫄곕━ 紐⑸줉
          turbulenceCamShake: {x:0, y:0},


          status : "waiting",
          
          // Transformation parameters
          transformDistance1 : 1500,
          transformDistance2 : 3000,
          transformDistance3 : 4500,
          transformDistance4 : 6000,
          transformDistance5 : 7500,
          transformDistance6 : 9000,
          transformDistance7 : 10500,
          transformDistance8 : 12000,
          transformDistance9 : 13500,
          transformDistance10 : 15000,
          transformDistance11 : 16500,
          transformDistance12 : 18000,
          transformDistance13 : 19500,
          currentForm : "Amoeba", // Stage 1
          transforming : false,

          // Invincibility
          invincible : false,
          invincibleTime : 0,
          invincibleDuration : 5000, // 5珥?
          invincibleFruitDistanceTolerance : 18,
          invincibleFruitSpeed : 0.4,
          invincibleFruitLastSpawn : 0,
          distanceForInvincibleSpawn : 900,

          heartItemLastSpawn : 0,
          distanceForHeartItemSpawn : 800,

          splashPlayed : false,
         };
  refillThunderHeightBag();
  fieldLevel.innerHTML = Math.floor(game.level);
  var coinsEl = document.getElementById('coinsValue');
  if (coinsEl) coinsEl.textContent = game.coins;
}

//THREEJS RELATED VARIABLES

var scene,
    camera, fieldOfView, aspectRatio, nearPlane, farPlane,
    renderer,
    container,
    controls;

//SCREEN & MOUSE VARIABLES

var HEIGHT, WIDTH,
    mousePos = { x: 0, y: 0 };

//
var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 768);

//INIT THREE JS, SCREEN AND MOUSE EVENTS

function createScene() {

  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;

  scene = new THREE.Scene();
  aspectRatio = WIDTH / HEIGHT;
  fieldOfView = 50;
  nearPlane = .1;
  farPlane = 10000;
  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
    );
  scene.fog = new THREE.Fog(0x87CEEB, 100,950);
  camera.position.x = 0;
  camera.position.z = isMobile ? 180 : 200;
  camera.position.y = game.planeDefaultHeight;
  //camera.lookAt(new THREE.Vector3(0, 400, 0));

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(WIDTH, HEIGHT);
  renderer.setClearColor(0x87CEEB, 1);

  renderer.shadowMap.enabled = true;

  container = document.getElementById('world');
  container.appendChild(renderer.domElement);

  window.addEventListener('resize', handleWindowResize, false);

  /*
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.minPolarAngle = -Math.PI / 2;
  controls.maxPolarAngle = Math.PI ;

  //controls.noZoom = true;
  //controls.noPan = true;
  //*/
}

// MOUSE AND SCREEN EVENTS

function handleWindowResize() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  renderer.setSize(WIDTH, HEIGHT);
  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix();
}

function handleMouseMove(event) {
  var tx = -1 + (event.clientX / WIDTH)*2;
  var ty = 1 - (event.clientY / HEIGHT)*2;
  mousePos = {x:tx, y:ty};
}

function handleTouchStart(event) {
    var target = event.target;
    // UI 버튼 터치는 그대로 통과
    if (target.id === 'mobilePauseBtn' || target.id === 'pauseOverlay' || target.closest('#pauseOverlay')) return;
    if (target.id === 'bossFireBtn' || target.closest('#bossFireUI')) return;
    if (target.id === 'abilityBtn' || target.closest('#abilityUI')) return;
    if (target.id === 'ufoLaserBtn' || target.id === 'ufoBoosterBtn' || target.closest('#ufoDualUI')) return;
    event.preventDefault();
    // 멀티터치: UI 버튼이 아닌 첫 번째 터치로 조작
    for (var i = 0; i < event.touches.length; i++) {
      var t = event.touches[i];
      var el = document.elementFromPoint(t.pageX, t.pageY);
      if (el && (el.closest('#bossFireUI') || el.closest('#abilityUI') || el.closest('#ufoDualUI'))) continue;
      var tx = -1 + (t.pageX / WIDTH) * 2;
      var ty = 1 - (t.pageY / HEIGHT) * 2;
      mousePos = {x:tx, y:ty};
      break;
    }
}

function handleTouchMove(event) {
    event.preventDefault();
    for (var i = 0; i < event.touches.length; i++) {
      var t = event.touches[i];
      var el = document.elementFromPoint(t.pageX, t.pageY);
      if (el && (el.closest('#bossFireUI') || el.closest('#abilityUI') || el.closest('#ufoDualUI'))) continue;
      var tx = -1 + (t.pageX / WIDTH) * 2;
      var ty = 1 - (t.pageY / HEIGHT) * 2;
      mousePos = {x:tx, y:ty};
      break;
    }
}
var mouseHoldInterval = null;
var mouseIsDown = false;

function handleMouseDown(event) {
  if (event.button !== 0) return;
  mouseIsDown = true;

  if (game.status !== 'playing') return;

  //
  if (typeof bossState !== 'undefined' && bossState.active) {
    var isUfoBoss = (shopState && shopState.selectedVehicle === 'UFO' && abilityState.ufoLaserUses > 0);
    if (isUfoBoss) { fireLaser(); abilityState.ufoLaserUses--; updateAbilityUI(); }
    else fireBossMissile();
    clearInterval(mouseHoldInterval);
    mouseHoldInterval = setInterval(function() {
      if (!mouseIsDown || game.status !== 'playing' || !bossState.active) {
        clearInterval(mouseHoldInterval);
        mouseHoldInterval = null;
        return;
      }
      var stillUfo = (shopState && shopState.selectedVehicle === 'UFO' && abilityState.ufoLaserUses > 0);
      if (stillUfo) { fireLaser(); abilityState.ufoLaserUses--; updateAbilityUI(); }
      else fireBossMissile();
    }, 100);
    return;
  }

  //
  if (!abilityState || !abilityState.type) return;

  //
  activateAbility();

  //
  var isRapidFire = (abilityState.type === 'missile' || abilityState.type === 'ufo');
  if (isRapidFire) {
    clearInterval(mouseHoldInterval);
    mouseHoldInterval = setInterval(function() {
      if (!mouseIsDown || game.status !== 'playing') {
        clearInterval(mouseHoldInterval);
        mouseHoldInterval = null;
        return;
      }
      activateAbility();
    }, 120);
  }
}

function handleMouseUp(event){
  if (event.button !== 0) return;
  mouseIsDown = false;
  if (mouseHoldInterval) {
    clearInterval(mouseHoldInterval);
    mouseHoldInterval = null;
  }
}


function handleTouchEnd(event){
  mouseIsDown = false;
  if (mouseHoldInterval) {
    clearInterval(mouseHoldInterval);
    mouseHoldInterval = null;
  }
}

// LIGHTS

var ambientLight, hemisphereLight, shadowLight;

function createLights() {

  hemisphereLight = new THREE.HemisphereLight(0xaaaaaa,0x000000, .9)

  ambientLight = new THREE.AmbientLight(0xdc8874, .5);

  shadowLight = new THREE.DirectionalLight(0xffffff, .9);
  shadowLight.position.set(150, 350, 350);
  shadowLight.castShadow = true;
  shadowLight.shadow.camera.left = -400;
  shadowLight.shadow.camera.right = 400;
  shadowLight.shadow.camera.top = 400;
  shadowLight.shadow.camera.bottom = -400;
  shadowLight.shadow.camera.near = 1;
  shadowLight.shadow.camera.far = 1000;
  shadowLight.shadow.mapSize.width = 4096;
  shadowLight.shadow.mapSize.height = 4096;

  var ch = new THREE.CameraHelper(shadowLight.shadow.camera);

  //scene.add(ch);
  scene.add(hemisphereLight);
  scene.add(shadowLight);
  scene.add(ambientLight);
  applyEnvironmentTheme();

}


var Pilot = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "pilot";
  this.angleHairs=0;

  var bodyGeom = new THREE.BoxGeometry(15,15,15);
  var bodyMat = new THREE.MeshPhongMaterial({color:Colors.brown, shading:THREE.FlatShading});
  var body = new THREE.Mesh(bodyGeom, bodyMat);
  body.position.set(2,-12,0);

  this.mesh.add(body);

  var faceGeom = new THREE.BoxGeometry(10,10,10);
  var faceMat = new THREE.MeshLambertMaterial({color:Colors.pink});
  var face = new THREE.Mesh(faceGeom, faceMat);
  this.mesh.add(face);

  var hairGeom = new THREE.BoxGeometry(4,4,4);
  var hairMat = new THREE.MeshLambertMaterial({color:Colors.brown});
  var hair = new THREE.Mesh(hairGeom, hairMat);
  hair.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0,2,0));
  var hairs = new THREE.Object3D();

  this.hairsTop = new THREE.Object3D();

  for (var i=0; i<12; i++){
    var h = hair.clone();
    var col = i%3;
    var row = Math.floor(i/3);
    var startPosZ = -4;
    var startPosX = -4;
    h.position.set(startPosX + row*4, 0, startPosZ + col*4);
    h.geometry.applyMatrix(new THREE.Matrix4().makeScale(1,1,1));
    this.hairsTop.add(h);
  }
  hairs.add(this.hairsTop);

  var hairSideGeom = new THREE.BoxGeometry(12,4,2);
  hairSideGeom.applyMatrix(new THREE.Matrix4().makeTranslation(-6,0,0));
  var hairSideR = new THREE.Mesh(hairSideGeom, hairMat);
  var hairSideL = hairSideR.clone();
  hairSideR.position.set(8,-2,6);
  hairSideL.position.set(8,-2,-6);
  hairs.add(hairSideR);
  hairs.add(hairSideL);

  var hairBackGeom = new THREE.BoxGeometry(2,8,10);
  var hairBack = new THREE.Mesh(hairBackGeom, hairMat);
  hairBack.position.set(-1,-4,0)
  hairs.add(hairBack);
  hairs.position.set(-5,5,0);

  this.mesh.add(hairs);

  var glassGeom = new THREE.BoxGeometry(5,5,5);
  var glassMat = new THREE.MeshLambertMaterial({color:Colors.brown});
  var glassR = new THREE.Mesh(glassGeom,glassMat);
  glassR.position.set(6,0,3);
  var glassL = glassR.clone();
  glassL.position.z = -glassR.position.z

  var glassAGeom = new THREE.BoxGeometry(11,1,11);
  var glassA = new THREE.Mesh(glassAGeom, glassMat);
  this.mesh.add(glassR);
  this.mesh.add(glassL);
  this.mesh.add(glassA);

  var earGeom = new THREE.BoxGeometry(2,3,2);
  var earL = new THREE.Mesh(earGeom,faceMat);
  earL.position.set(0,0,-6);
  var earR = earL.clone();
  earR.position.set(0,0,6);
  this.mesh.add(earL);
  this.mesh.add(earR);
}

Pilot.prototype.updateHairs = function(){
  //*
   var hairs = this.hairsTop.children;

   var l = hairs.length;
   for (var i=0; i<l; i++){
      var h = hairs[i];
      h.scale.y = .75 + Math.cos(this.angleHairs+i/3)*.25;
   }
  this.angleHairs += game.speed*deltaTime*40;
  //*/
}

var AirPlane = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "airPlane";

  // Cabin

  var geomCabin = new THREE.BoxGeometry(80,50,50,1,1,1);
  var matCabin = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FlatShading});

  geomCabin.vertices[4].y-=10;
  geomCabin.vertices[4].z+=20;
  geomCabin.vertices[5].y-=10;
  geomCabin.vertices[5].z-=20;
  geomCabin.vertices[6].y+=30;
  geomCabin.vertices[6].z+=20;
  geomCabin.vertices[7].y+=30;
  geomCabin.vertices[7].z-=20;

  var cabin = new THREE.Mesh(geomCabin, matCabin);
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  this.mesh.add(cabin);

  // Engine

  var geomEngine = new THREE.BoxGeometry(20,50,50,1,1,1);
  var matEngine = new THREE.MeshPhongMaterial({color:Colors.white, shading:THREE.FlatShading});
  var engine = new THREE.Mesh(geomEngine, matEngine);
  engine.position.x = 50;
  engine.castShadow = true;
  engine.receiveShadow = true;
  this.mesh.add(engine);

  // Tail Plane

  var geomTailPlane = new THREE.BoxGeometry(15,20,5,1,1,1);
  var matTailPlane = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FlatShading});
  var tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
  tailPlane.position.set(-40,20,0);
  tailPlane.castShadow = true;
  tailPlane.receiveShadow = true;
  this.mesh.add(tailPlane);

  // Wings

  var geomSideWing = new THREE.BoxGeometry(30,5,120,1,1,1);
  var matSideWing = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FlatShading});
  var sideWing = new THREE.Mesh(geomSideWing, matSideWing);
  sideWing.position.set(0,15,0);
  sideWing.castShadow = true;
  sideWing.receiveShadow = true;
  this.mesh.add(sideWing);

  var geomWindshield = new THREE.BoxGeometry(3,15,20,1,1,1);
  var matWindshield = new THREE.MeshPhongMaterial({color:Colors.white,transparent:true, opacity:.3, shading:THREE.FlatShading});;
  var windshield = new THREE.Mesh(geomWindshield, matWindshield);
  windshield.position.set(5,27,0);

  windshield.castShadow = true;
  windshield.receiveShadow = true;

  this.mesh.add(windshield);

  var geomPropeller = new THREE.BoxGeometry(20,10,10,1,1,1);
  geomPropeller.vertices[4].y-=5;
  geomPropeller.vertices[4].z+=5;
  geomPropeller.vertices[5].y-=5;
  geomPropeller.vertices[5].z-=5;
  geomPropeller.vertices[6].y+=5;
  geomPropeller.vertices[6].z+=5;
  geomPropeller.vertices[7].y+=5;
  geomPropeller.vertices[7].z-=5;
  var matPropeller = new THREE.MeshPhongMaterial({color:Colors.brown, shading:THREE.FlatShading});
  this.propeller = new THREE.Mesh(geomPropeller, matPropeller);

  this.propeller.castShadow = true;
  this.propeller.receiveShadow = true;

  var geomBlade = new THREE.BoxGeometry(1,80,10,1,1,1);
  var matBlade = new THREE.MeshPhongMaterial({color:Colors.brownDark, shading:THREE.FlatShading});
  var blade1 = new THREE.Mesh(geomBlade, matBlade);
  blade1.position.set(8,0,0);

  blade1.castShadow = true;
  blade1.receiveShadow = true;

  var blade2 = blade1.clone();
  blade2.rotation.x = Math.PI/2;

  blade2.castShadow = true;
  blade2.receiveShadow = true;

  this.propeller.add(blade1);
  this.propeller.add(blade2);
  this.propeller.position.set(60,0,0);
  this.mesh.add(this.propeller);

  var wheelProtecGeom = new THREE.BoxGeometry(30,15,10,1,1,1);
  var wheelProtecMat = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FlatShading});
  var wheelProtecR = new THREE.Mesh(wheelProtecGeom,wheelProtecMat);
  wheelProtecR.position.set(25,-20,25);
  this.mesh.add(wheelProtecR);

  var wheelTireGeom = new THREE.BoxGeometry(24,24,4);
  var wheelTireMat = new THREE.MeshPhongMaterial({color:Colors.brownDark, shading:THREE.FlatShading});
  var wheelTireR = new THREE.Mesh(wheelTireGeom,wheelTireMat);
  wheelTireR.position.set(25,-28,25);

  var wheelAxisGeom = new THREE.BoxGeometry(10,10,6);
  var wheelAxisMat = new THREE.MeshPhongMaterial({color:Colors.brown, shading:THREE.FlatShading});
  var wheelAxis = new THREE.Mesh(wheelAxisGeom,wheelAxisMat);
  wheelTireR.add(wheelAxis);

  this.mesh.add(wheelTireR);

  var wheelProtecL = wheelProtecR.clone();
  wheelProtecL.position.z = -wheelProtecR.position.z ;
  this.mesh.add(wheelProtecL);

  var wheelTireL = wheelTireR.clone();
  wheelTireL.position.z = -wheelTireR.position.z;
  this.mesh.add(wheelTireL);

  var wheelTireB = wheelTireR.clone();
  wheelTireB.scale.set(.5,.5,.5);
  wheelTireB.position.set(-35,-5,0);
  this.mesh.add(wheelTireB);

  var suspensionGeom = new THREE.BoxGeometry(4,20,4);
  suspensionGeom.applyMatrix(new THREE.Matrix4().makeTranslation(0,10,0))
  var suspensionMat = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FlatShading});
  var suspension = new THREE.Mesh(suspensionGeom,suspensionMat);
  suspension.position.set(-35,-5,0);
  suspension.rotation.z = -.3;
  this.mesh.add(suspension);

  this.pilot = new Pilot();
  this.pilot.mesh.position.set(-10,27,0);
  this.mesh.add(this.pilot.mesh);


  this.mesh.castShadow = true;
  this.mesh.receiveShadow = true;

};

Sky = function(){
  this.mesh = new THREE.Object3D();
  this.nClouds = 20;
  this.clouds = [];
  var stepAngle = Math.PI*2 / this.nClouds;
  for(var i=0; i<this.nClouds; i++){
    var c = new Cloud();
    this.clouds.push(c);
    var a = stepAngle*i;
    var h = game.seaRadius + 150 + Math.random()*200;
    c.mesh.position.y = Math.sin(a)*h;
    c.mesh.position.x = Math.cos(a)*h;
    c.mesh.position.z = -300-Math.random()*500;
    c.mesh.rotation.z = a + Math.PI/2;
    var s = 1+Math.random()*2;
    c.mesh.scale.set(s,s,s);
    this.mesh.add(c.mesh);
  }
}

Sky.prototype.moveClouds = function(){
  for(var i=0; i<this.nClouds; i++){
    var c = this.clouds[i];
    c.rotate();
  }
  this.mesh.rotation.z += game.speed*deltaTime;

}

Sea = function(){
  var geom = new THREE.CylinderGeometry(game.seaRadius,game.seaRadius,game.seaLength,40,10);
  geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI/2));
  geom.mergeVertices();
  var l = geom.vertices.length;

  this.waves = [];

  for (var i=0;i<l;i++){
    var v = geom.vertices[i];
    //v.y = Math.random()*30;
    this.waves.push({y:v.y,
                     x:v.x,
                     z:v.z,
                     ang:Math.random()*Math.PI*2,
                     amp:game.wavesMinAmp + Math.random()*(game.wavesMaxAmp-game.wavesMinAmp),
                     speed:game.wavesMinSpeed + Math.random()*(game.wavesMaxSpeed - game.wavesMinSpeed)
                    });
  };
  var mat = new THREE.MeshPhongMaterial({
    color:Colors.blue,
    transparent:true,
    opacity:.8,
    shading:THREE.FlatShading,

  });

  this.mesh = new THREE.Mesh(geom, mat);
  this.mesh.name = "waves";
  this.mesh.receiveShadow = true;

}

Sea.prototype.moveWaves = function (){
  var verts = this.mesh.geometry.vertices;
  var l = verts.length;
  for (var i=0; i<l; i++){
    var v = verts[i];
    var vprops = this.waves[i];
    v.x =  vprops.x + Math.cos(vprops.ang)*vprops.amp;
    v.y = vprops.y + Math.sin(vprops.ang)*vprops.amp;
    vprops.ang += vprops.speed*deltaTime;
    this.mesh.geometry.verticesNeedUpdate=true;
  }
}

Cloud = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "cloud";
  var geom = new THREE.CubeGeometry(20,20,20);
  var mat = new THREE.MeshPhongMaterial({
    color:Colors.white,

  });

  //*
  var nBlocs = 3+Math.floor(Math.random()*3);
  for (var i=0; i<nBlocs; i++ ){
    var m = new THREE.Mesh(geom.clone(), mat);
    m.position.x = i*15;
    m.position.y = Math.random()*10;
    m.position.z = Math.random()*10;
    m.rotation.z = Math.random()*Math.PI*2;
    m.rotation.y = Math.random()*Math.PI*2;
    var s = .1 + Math.random()*.9;
    m.scale.set(s,s,s);
    this.mesh.add(m);
    m.castShadow = true;
    m.receiveShadow = true;

  }
  //*/
}

Cloud.prototype.rotate = function(){
  var l = this.mesh.children.length;
  for(var i=0; i<l; i++){
    var m = this.mesh.children[i];
    m.rotation.z+= Math.random()*.005*(i+1);
    m.rotation.y+= Math.random()*.002*(i+1);
  }
}

Ennemy = function(){
  this.mesh = new THREE.Object3D();

  // Mace ball (round iron core)
  var ballGeom = new THREE.SphereGeometry(9, 8, 7);
  var ballMat = new THREE.MeshPhongMaterial({
    color:0x2A1A1A,
    emissive:0x220000,
    shininess:35,
    specular:0x885555,
    shading:THREE.FlatShading
  });
  var ball = new THREE.Mesh(ballGeom, ballMat);
  ball.castShadow = true;
  this.mesh.add(ball);

  // Spikes wrapped around the ball
  var spikeMat = new THREE.MeshPhongMaterial({
    color:0xC62828,
    emissive:0x5A0A0A,
    emissiveIntensity:0.45,
    shininess:55,
    specular:0xFF9A9A,
    shading:THREE.FlatShading
  });
  var spikePositions = [
    [11,0,0], [-11,0,0], [0,11,0], [0,-11,0], [0,0,11], [0,0,-11],
    [8,8,0], [-8,8,0], [8,-8,0], [-8,-8,0],
    [8,0,8], [-8,0,8], [8,0,-8], [-8,0,-8],
    [0,8,8], [0,-8,8], [0,8,-8], [0,-8,-8]
  ];
  for (var i=0; i<spikePositions.length; i++){
    var spikeGeom = new THREE.CylinderGeometry(0, 2.8, 10, 4);
    var spike = new THREE.Mesh(spikeGeom, spikeMat);
    spike.position.set(spikePositions[i][0], spikePositions[i][1], spikePositions[i][2]);
    spike.lookAt(new THREE.Vector3(spikePositions[i][0]*2, spikePositions[i][1]*2, spikePositions[i][2]*2));
    spike.rotateX(Math.PI / 2);
    spike.castShadow = true;
    this.mesh.add(spike);
  }

  this.mesh.castShadow = true;
  this.angle = 0;
  this.dist = 0;
  this.type = 'mace';
}

//
Asteroid = function(){
  this.mesh = new THREE.Object3D();

  //
  var rockMat = new THREE.MeshPhongMaterial({
    color: 0x8B7355,
    shininess: 10,
    specular: 0x444444,
    shading: THREE.FlatShading
  });

  //
  var mainGeom = new THREE.BoxGeometry(18, 16, 18, 1, 1, 1);
  //
  for (var i = 0; i < mainGeom.vertices.length; i++) {
    mainGeom.vertices[i].x += (Math.random() - 0.5) * 4;
    mainGeom.vertices[i].y += (Math.random() - 0.5) * 4;
    mainGeom.vertices[i].z += (Math.random() - 0.5) * 4;
  }
  var mainRock = new THREE.Mesh(mainGeom, rockMat);
  this.mesh.add(mainRock);

  //
  var smallRockMat = new THREE.MeshPhongMaterial({
    color: 0x9B8765,
    shininess: 5,
    shading: THREE.FlatShading
  });
  for (var j = 0; j < 5; j++) {
    var sGeom = new THREE.BoxGeometry(6 + Math.random()*4, 5 + Math.random()*4, 6 + Math.random()*4);
    var sRock = new THREE.Mesh(sGeom, smallRockMat);
    sRock.position.set(
      (Math.random() - 0.5) * 16,
      (Math.random() - 0.5) * 14,
      (Math.random() - 0.5) * 16
    );
    sRock.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
    sRock.castShadow = true;
    this.mesh.add(sRock);
  }

  //
  var crackMat = new THREE.MeshPhongMaterial({
    color: 0xFF4500,
    emissive: 0xFF2000,
    emissiveIntensity: 0.3,
    shading: THREE.FlatShading
  });
  var crackGeom = new THREE.BoxGeometry(2, 12, 2);
  var crack = new THREE.Mesh(crackGeom, crackMat);
  crack.rotation.z = Math.random() * Math.PI;
  this.mesh.add(crack);

  this.mesh.castShadow = true;
  this.angle = 0;
  this.dist = 0;
  this.type = 'asteroid';
}

//
ThunderCloud = function(){
  this.mesh = new THREE.Object3D();

  //
  var darkMat = new THREE.MeshPhongMaterial({
    color: 0x3D3D3D,
    shininess: 5,
    shading: THREE.FlatShading
  });
  var midMat = new THREE.MeshPhongMaterial({
    color: 0x555555,
    shininess: 5,
    shading: THREE.FlatShading
  });
  var lightMat = new THREE.MeshPhongMaterial({
    color: 0x6B6B6B,
    shininess: 5,
    shading: THREE.FlatShading
  });

  //
  var mats = [darkMat, midMat, lightMat];
  var layers = [
    { y: 0, count: 8, sizeRange: [7, 12], spread: 25, mat: darkMat },
    { y: 5, count: 9, sizeRange: [6, 11], spread: 23, mat: darkMat },
    { y: 10, count: 7, sizeRange: [7, 10], spread: 18, mat: midMat },
    { y: 15, count: 5, sizeRange: [5, 8], spread: 13, mat: lightMat },
    { y: 18, count: 3, sizeRange: [4, 6], spread: 8, mat: lightMat }
  ];

  for (var l = 0; l < layers.length; l++) {
    var layer = layers[l];
    for (var i = 0; i < layer.count; i++) {
      var s = layer.sizeRange[0] + Math.random() * (layer.sizeRange[1] - layer.sizeRange[0]);
      var bGeom = new THREE.BoxGeometry(s, s * 0.6, s);
      var block = new THREE.Mesh(bGeom, layer.mat);
      block.position.set(
        (Math.random() - 0.5) * layer.spread,
        layer.y + Math.random() * 3,
        (Math.random() - 0.5) * layer.spread * 0.6
      );
      block.rotation.set(Math.random()*0.2, Math.random()*0.2, Math.random()*0.2);
      block.castShadow = true;
      this.mesh.add(block);
    }
  }

  //
  var glowMat = new THREE.MeshPhongMaterial({
    color: 0xFFFF88,
    emissive: 0xFFDD44,
    emissiveIntensity: 0.8,
    transparent: true,
    opacity: 0.7,
    shading: THREE.FlatShading
  });
  var glowGeom = new THREE.BoxGeometry(6, 2.5, 6);
  var glow = new THREE.Mesh(glowGeom, glowMat);
  glow.position.set(0, -1.5, 0);
  this.mesh.add(glow);

  //
  var boltMat = new THREE.MeshPhongMaterial({
    color: 0xFFFF00,
    emissive: 0xFFCC00,
    emissiveIntensity: 0.8,
    shading: THREE.FlatShading,
    transparent: true,
    opacity: 0.9
  });

  this.bolts = [];

  //
  for (var b = 0; b < 3; b++) {
    var boltGroup = new THREE.Object3D();
    var offsetX = (b - 1) * 6 + (Math.random() - 0.5) * 2.5;
    var segments = 3 + Math.floor(Math.random() * 2);
    var curY = -4;
    for (var s = 0; s < segments; s++) {
      var len = 6 + Math.random() * 5;
      var w = 3 - s * 0.4;
      if (w < 1) w = 1;
      var segGeom = new THREE.BoxGeometry(w, len, w);
      var seg = new THREE.Mesh(segGeom, boltMat);
      seg.position.set(
        offsetX + (Math.random() - 0.5) * 2,
        curY - len/2,
        (Math.random() - 0.5) * 1.5
      );
      seg.rotation.z = (Math.random() - 0.5) * 0.18;
      boltGroup.add(seg);
      curY -= len * 0.82;
    }
    this.mesh.add(boltGroup);
    this.bolts.push(boltGroup);
  }

  //
  var debrisMat = new THREE.MeshPhongMaterial({ color: 0x4D4D4D, shading: THREE.FlatShading });
  for (var d = 0; d < 4; d++) {
    var dGeom = new THREE.BoxGeometry(2 + Math.random()*2, 2 + Math.random()*2, 2 + Math.random()*2);
    var debris = new THREE.Mesh(dGeom, debrisMat);
    debris.position.set(
      (Math.random() - 0.5) * 35,
      Math.random() * 10 - 8,
      (Math.random() - 0.5) * 15
    );
    debris.castShadow = true;
    this.mesh.add(debris);
  }

  this.mesh.castShadow = true;
  this.mesh.scale.set(0.88, 0.88, 0.88);
  this.angle = 0;
  this.dist = 0;
  this.type = 'thunder';
  this.flashTimer = 0;
}

//
FlyingAsteroid = function(){
  this.mesh = new THREE.Object3D();

  // ?κ렐 ?붿꽍 諛붾뵒 (SphereGeometry + vertex 蹂??
  var rockMat = new THREE.MeshPhongMaterial({
    color: 0xA08050,
    shininess: 8,
    specular: 0x554433,
    shading: THREE.FlatShading
  });

  var mainGeom = new THREE.SphereGeometry(8, 6, 5);
  for (var i = 0; i < mainGeom.vertices.length; i++) {
    mainGeom.vertices[i].x += (Math.random() - 0.5) * 3;
    mainGeom.vertices[i].y += (Math.random() - 0.5) * 3;
    mainGeom.vertices[i].z += (Math.random() - 0.5) * 3;
  }
  mainGeom.computeFaceNormals();
  var mainRock = new THREE.Mesh(mainGeom, rockMat);
  mainRock.castShadow = true;
  this.mesh.add(mainRock);

  //
  var bumpMat = new THREE.MeshPhongMaterial({
    color: 0x8B6F47,
    shininess: 5,
    shading: THREE.FlatShading
  });
  for (var j = 0; j < 5; j++) {
    var bGeom = new THREE.SphereGeometry(2 + Math.random()*2, 4, 3);
    var bump = new THREE.Mesh(bGeom, bumpMat);
    bump.position.set(
      (Math.random() - 0.5) * 12,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 12
    );
    bump.castShadow = true;
    this.mesh.add(bump);
  }

  //
  var tailMat = new THREE.MeshPhongMaterial({
    color: 0xFF6600,
    emissive: 0xFF4400,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.6,
    shading: THREE.FlatShading
  });
  for (var t = 0; t < 3; t++) {
    var tGeom = new THREE.BoxGeometry(3 - t*0.5, 2, 2);
    var tail = new THREE.Mesh(tGeom, tailMat);
    tail.position.set(-10 - t*4, (Math.random()-0.5)*3, (Math.random()-0.5)*3);
    this.mesh.add(tail);
  }

  this.mesh.castShadow = true;
  this.type = 'flyingAsteroid';
  //
  this.speed = 4 + Math.random() * 2; // ?섑룊 ?대룞?띾룄
  this.alive = true;
}

//
WaterPillar = function(){
  this.mesh = new THREE.Object3D();

  var pillarHeight = 50 + Math.random() * 40;

  var waterMat = new THREE.MeshPhongMaterial({
    color: 0x68C8A8, transparent: true, opacity: 0.7,
    shininess: 80, specular: 0x88DDBB, shading: THREE.FlatShading
  });
  var waterDarkMat = new THREE.MeshPhongMaterial({
    color: 0x4DB08A, transparent: true, opacity: 0.6, shading: THREE.FlatShading
  });

  //
  this.pillars = [];
  var centerGeom = new THREE.CylinderGeometry(4, 5, pillarHeight, 6);
  var center = new THREE.Mesh(centerGeom, waterMat);
  center.position.y = pillarHeight / 2;
  center.castShadow = true;
  this.mesh.add(center);
  this.pillars.push(center);

  for (var i = 0; i < 6; i++) {
    var a = (i / 6) * Math.PI * 2;
    var h = pillarHeight * (0.5 + Math.random() * 0.4);
    var r = 1.5 + Math.random() * 1.5;
    var cGeom = new THREE.CylinderGeometry(r, r + 0.5, h, 5);
    var mat = Math.random() > 0.5 ? waterMat : waterDarkMat;
    var col = new THREE.Mesh(cGeom, mat);
    col.position.set(Math.cos(a) * 5, h / 2, Math.sin(a) * 5);
    col.castShadow = true;
    this.mesh.add(col);
    this.pillars.push(col);
  }

  //
  var capMat = new THREE.MeshPhongMaterial({
    color: 0x90E8C8, transparent: true, opacity: 0.5, shading: THREE.FlatShading
  });
  var capGeom = new THREE.CylinderGeometry(6, 18, 8, 8);
  var cap = new THREE.Mesh(capGeom, capMat);
  cap.position.y = pillarHeight + 2;
  cap.castShadow = true;
  this.mesh.add(cap);

  //
  for (var j = 0; j < 10; j++) {
    var ja = (j / 10) * Math.PI * 2;
    var jDist = 12 + Math.random() * 8;
    var jh = pillarHeight * 0.3 + Math.random() * pillarHeight * 0.5;
    var jGeom = new THREE.CylinderGeometry(0.8, 0.3, jh, 4);
    var jet = new THREE.Mesh(jGeom, waterDarkMat);
    jet.position.set(Math.cos(ja) * jDist, jh / 2, Math.sin(ja) * jDist);
    this.mesh.add(jet);
  }

  //
  var splashMat = new THREE.MeshPhongMaterial({
    color: 0xB0F0D8, transparent: true, opacity: 0.4, shading: THREE.FlatShading
  });
  for (var s = 0; s < 8; s++) {
    var sa = (s / 8) * Math.PI * 2;
    var sGeom = new THREE.CylinderGeometry(4, 5, 2, 5);
    var splash = new THREE.Mesh(sGeom, splashMat);
    splash.position.set(Math.cos(sa) * (10 + Math.random()*5), 1, Math.sin(sa) * (10 + Math.random()*5));
    this.mesh.add(splash);
  }

  this.mesh.castShadow = true;
  this.angle = 0;
  this.dist = 0;
  this.type = 'waterPillar';
  this.animTimer = 0;
}

//
FireWall = function(){
  this.mesh = new THREE.Object3D();

  var colors = [
    new THREE.MeshPhongMaterial({ color: 0xCC3300, emissive: 0x881100, emissiveIntensity: 0.3, shading: THREE.FlatShading }),
    new THREE.MeshPhongMaterial({ color: 0xFF4500, emissive: 0xCC2200, emissiveIntensity: 0.4, shading: THREE.FlatShading }),
    new THREE.MeshPhongMaterial({ color: 0xFF6600, emissive: 0xDD4400, emissiveIntensity: 0.3, shading: THREE.FlatShading }),
    new THREE.MeshPhongMaterial({ color: 0xFF8C00, emissive: 0xCC6600, emissiveIntensity: 0.3, shading: THREE.FlatShading }),
    new THREE.MeshPhongMaterial({ color: 0xFFAA33, emissive: 0xDD8800, emissiveIntensity: 0.2, shading: THREE.FlatShading })
  ];

  //
  var gapCenter = (Math.random() - 0.5) * 30;
  var gapSize = 50;
  this.gapCenter = gapCenter;
  this.gapSize = gapSize;

  //
  var topStart = gapCenter + gapSize / 2;
  for (var i = 0; i < 80; i++) {
    var s = 1 + Math.random() * 2.5;
    var bGeom = new THREE.BoxGeometry(s, s, s);
    var mat = colors[Math.floor(Math.random() * 5)];
    var block = new THREE.Mesh(bGeom, mat);
    block.position.set(
      (Math.random() - 0.5) * 12,
      topStart + Math.random() * 80,
      (Math.random() - 0.5) * 12
    );
    block.rotation.set(Math.random() * 0.5, Math.random() * 0.5, Math.random() * 0.5);
    block.castShadow = true;
    this.mesh.add(block);
  }

  //
  var botStart = gapCenter - gapSize / 2;
  for (var j = 0; j < 80; j++) {
    var s2 = 1 + Math.random() * 2.5;
    var bGeom2 = new THREE.BoxGeometry(s2, s2, s2);
    var mat2 = colors[Math.floor(Math.random() * 5)];
    var block2 = new THREE.Mesh(bGeom2, mat2);
    block2.position.set(
      (Math.random() - 0.5) * 12,
      botStart - Math.random() * 80,
      (Math.random() - 0.5) * 12
    );
    block2.rotation.set(Math.random() * 0.5, Math.random() * 0.5, Math.random() * 0.5);
    block2.castShadow = true;
    this.mesh.add(block2);
  }

  //
  var edgeMat = new THREE.MeshPhongMaterial({
    color: 0xFFFF44, emissive: 0xFFCC00, emissiveIntensity: 0.7, shading: THREE.FlatShading
  });
  for (var k = 0; k < 20; k++) {
    var s3 = 1 + Math.random() * 1.5;
    var bGeom3 = new THREE.BoxGeometry(s3, s3, s3);
    var debris = new THREE.Mesh(bGeom3, edgeMat);
    var isTop = k < 10;
    var edgeY = isTop ? (topStart + Math.random()*3) : (botStart - Math.random()*3);
    debris.position.set(
      (Math.random() - 0.5) * 14,
      edgeY,
      (Math.random() - 0.5) * 14
    );
    debris.rotation.set(Math.random(), Math.random(), Math.random());
    this.mesh.add(debris);
  }

  this.mesh.castShadow = true;
  this.angle = 0;
  this.dist = 0;
  this.type = 'fireWall';
}

//
BlackHole = function(){
  this.mesh = new THREE.Object3D();

  //
  var coreMat = new THREE.MeshPhongMaterial({
    color: 0x000000,
    shininess: 100,
    specular: 0x111111,
    shading: THREE.FlatShading
  });
  var coreGeom = new THREE.BoxGeometry(10, 10, 10, 1, 1, 1);
  var core = new THREE.Mesh(coreGeom, coreMat);
  this.mesh.add(core);

  //
  var ringColors = [0xFF8C00, 0xFFA500, 0xFFCC44, 0xFF6600];
  this.rings = [];
  for (var r = 0; r < 4; r++) {
    var ringMat = new THREE.MeshPhongMaterial({
      color: ringColors[r],
      emissive: ringColors[r],
      emissiveIntensity: 0.4 - r * 0.08,
      transparent: true,
      opacity: 0.7 - r * 0.1,
      shading: THREE.FlatShading
    });
    var radius = 14 + r * 6;
    var ringGroup = new THREE.Object3D();
    var segments = 12 + r * 4;
    for (var s = 0; s < segments; s++) {
      var angle = (s / segments) * Math.PI * 2;
      var bw = 3 + Math.random() * 2;
      var bh = 1.5 + Math.random();
      var bd = 3 + Math.random() * 2;
      var segGeom = new THREE.BoxGeometry(bw, bh, bd);
      var seg = new THREE.Mesh(segGeom, ringMat);
      seg.position.set(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 2,
        Math.sin(angle) * radius
      );
      seg.lookAt(new THREE.Vector3(0, 0, 0));
      ringGroup.add(seg);
    }
    ringGroup.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.3;
    this.mesh.add(ringGroup);
    this.rings.push(ringGroup);
  }

  //
  var debrisMat = new THREE.MeshPhongMaterial({
    color: 0xCC7700,
    emissive: 0x884400,
    emissiveIntensity: 0.2,
    shading: THREE.FlatShading
  });
  for (var d = 0; d < 8; d++) {
    var da = Math.random() * Math.PI * 2;
    var dr = 30 + Math.random() * 15;
    var dGeom = new THREE.BoxGeometry(2 + Math.random()*2, 2 + Math.random()*2, 2 + Math.random()*2);
    var debr = new THREE.Mesh(dGeom, debrisMat);
    debr.position.set(
      Math.cos(da) * dr,
      (Math.random() - 0.5) * 5,
      Math.sin(da) * dr
    );
    this.mesh.add(debr);
  }

  this.mesh.castShadow = true;
  this.angle = 0;
  this.dist = 0;
  this.type = 'blackHole';
  this.rotTimer = 0;
  this.hasAppliedSlow = false;
}

EnnemiesHolder = function (){
  this.mesh = new THREE.Object3D();
  this.ennemiesInUse = [];
}

EnnemiesHolder.prototype.spawnEnnemies = function(){
  var nEnnemies = 3; // 媛쒖닔??怨좎젙, 醫낅쪟媛 ?덈꺼蹂꾨줈 利앷?

  for (var i=0; i<nEnnemies; i++){
    var ennemy;

    //
    var roll = Math.random();
    var chosenType = 'mace';

    if (game.level >= 6 && roll < 0.03) {
      chosenType = 'blackHole'; // 3% ?뺣쪧
    } else {
      var availableTypes = [];
      if (game.level >= 5) {
        //
        if (Math.random() < 0.3) availableTypes.push('mace');
        availableTypes.push('thunder');
        availableTypes.push('waterPillar');
        availableTypes.push('fireWall');
      } else if (game.level >= 4) {
        availableTypes = ['mace', 'thunder', 'waterPillar'];
      } else if (game.level >= 2) {
        availableTypes = ['mace', 'thunder'];
      } else {
        availableTypes = ['mace'];
      }
      chosenType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    }

    switch(chosenType) {
      case 'thunder':
        ennemy = new ThunderCloud();
        break;
      case 'waterPillar':
        ennemy = new WaterPillar();
        break;
      case 'fireWall':
        //
        if (Math.floor(game.distance) - game.fireWallLastSpawn < game.distanceForFireWallSpawn) {
          ennemy = new Ennemy(); // 媛꾧꺽 遺議깊븯硫?泥좏눜
          ennemy.type = 'mace';
        } else {
          ennemy = new FireWall();
          game.fireWallLastSpawn = Math.floor(game.distance);
        }
        break;
      case 'blackHole':
        ennemy = new BlackHole();
        break;
      default:
        if (ennemiesPool.length) {
          ennemy = ennemiesPool.pop();
        } else {
          ennemy = new Ennemy();
        }
        break;
    }

    ennemy.angle = - (i*0.1);
    if (ennemy.type === 'thunder') {
      ennemy.distance = getThunderSpawnDistance();
    } else {
      ennemy.distance = game.seaRadius + game.planeDefaultHeight + (-1 + Math.random() * 2) * (game.planeAmpHeight-20);
    }
    ennemy.mesh.position.y = -game.seaRadius + Math.sin(ennemy.angle)*ennemy.distance;
    ennemy.mesh.position.x = Math.cos(ennemy.angle)*ennemy.distance;

    this.mesh.add(ennemy.mesh);
    this.ennemiesInUse.push(ennemy);
  }
}

EnnemiesHolder.prototype.rotateEnnemies = function(){
  for (var i=0; i<this.ennemiesInUse.length; i++){
    var ennemy = this.ennemiesInUse[i];
    ennemy.angle += game.speed*deltaTime*game.ennemiesSpeed;

    if (ennemy.angle > Math.PI*2) ennemy.angle -= Math.PI*2;

    //
    if (ennemy.type === 'waterPillar') {
      ennemy.distance = game.seaRadius + 5;
    }
    ennemy.mesh.position.y = -game.seaRadius + Math.sin(ennemy.angle)*ennemy.distance;
    ennemy.mesh.position.x = Math.cos(ennemy.angle)*ennemy.distance;
    //
    if (ennemy.type !== 'fireWall' && ennemy.type !== 'waterPillar' && ennemy.type !== 'thunder') {
      ennemy.mesh.rotation.z += Math.random()*.1;
      ennemy.mesh.rotation.y += Math.random()*.1;
    }

    //
    if (ennemy.type === 'thunder') {
      ennemy.flashTimer = (ennemy.flashTimer || 0) + deltaTime;
      ennemy.mesh.rotation.set(0, 0, 0);
      ennemy.mesh.position.y += Math.sin(ennemy.flashTimer * 0.004) * 24;
      if (ennemy.bolts) {
        var flash = Math.sin(ennemy.flashTimer * 0.01) > 0.3;
        for (var b = 0; b < ennemy.bolts.length; b++) {
          ennemy.bolts[b].visible = flash;
        }
      }
    }

    //
    if (ennemy.type === 'blackHole') {
      ennemy.rotTimer = (ennemy.rotTimer || 0) + deltaTime;
      if (ennemy.rings) {
        for (var r = 0; r < ennemy.rings.length; r++) {
          ennemy.rings[r].rotation.z += 0.002 * deltaTime * (1 + r * 0.3);
        }
      }
      //
      var bhWorldPos = ennemy.mesh.position.clone();
      ennemiesHolder.mesh.updateMatrixWorld();
      bhWorldPos.applyMatrix4(ennemiesHolder.mesh.matrixWorld);
      var distToPlane = airplane.mesh.position.distanceTo(bhWorldPos);

  var slowRadius = 200; // 슬로우 효과 범위
  var maxSlow = 0.12;   // 최대 슬로우(가장 가까울 때 원래의 12% 속도)

      if (distToPlane < slowRadius) {
        // 嫄곕━??鍮꾨?: 媛源뚯슱?섎줉 ???먮젮吏?(1.0 ??maxSlow)
        var ratio = distToPlane / slowRadius;
        game.blackHoleSlowFactor = maxSlow + (1.0 - maxSlow) * ratio;
        game.blackHoleActive = true;
        ennemy.hasAppliedSlow = true;
      } else if (ennemy.hasAppliedSlow) {
        //
        game.blackHoleSlowFactor = 1.0;
        game.blackHoleActive = false;
      }
    }

    //
    if (ennemy.type === 'waterPillar' && ennemy.pillars) {
      ennemy.animTimer = (ennemy.animTimer || 0) + deltaTime;
      for (var p = 0; p < ennemy.pillars.length; p++) {
        var scaleY = 0.8 + Math.sin(ennemy.animTimer * 0.003 + p * 0.5) * 0.3;
        ennemy.pillars[p].scale.y = scaleY;
      }
    }

    //
    if (ennemy.type === 'fireWall') {
      ennemy.fireTimer = (ennemy.fireTimer || 0) + deltaTime;
      var children = ennemy.mesh.children;
      for (var f = 0; f < children.length; f++) {
        children[f].position.y += Math.sin(ennemy.fireTimer * 0.005 + f * 0.7) * 0.15;
        children[f].position.x += Math.sin(ennemy.fireTimer * 0.003 + f * 1.2) * 0.05;
      }
    }

    // 異⑸룎 泥댄겕
    var diffPos = airplane.mesh.position.clone().sub(ennemy.mesh.position.clone());
    var d = diffPos.length();

    //
    if (ennemy.type === 'waterPillar') {
      var planeRelY = airplane.mesh.position.y - ennemy.mesh.position.y;
      if (planeRelY > 90) {
        d = 9999; // 臾쇨린???꾨? 吏?섍컧 - 異⑸룎 ?놁쓬
      } else {
        d = Math.sqrt(diffPos.x * diffPos.x + diffPos.z * diffPos.z);
      }
    }

    //
    if (ennemy.type === 'fireWall') {
      d = Math.sqrt(diffPos.x * diffPos.x + diffPos.z * diffPos.z);
    }

    var collisionDist = game.ennemyDistanceTolerance;
    if (ennemy.type === 'fireWall') collisionDist = 15;
    if (ennemy.type === 'thunder') collisionDist = 18;
    if (ennemy.type === 'waterPillar') collisionDist = 20;
    if (ennemy.type === 'blackHole') collisionDist = 15;

    if (d < collisionDist){
      //
      if (ennemy.type === 'blackHole') {
        continue;
      }
      //
      if (ennemy.type === 'fireWall') {
        var planeLocalY = airplane.mesh.position.y - ennemy.mesh.position.y;
        //
        if (Math.abs(planeLocalY - ennemy.gapCenter) < ennemy.gapSize / 2) {
          continue;
        }
        //
        var wallTopEnd = ennemy.gapCenter + ennemy.gapSize / 2 + 80;
        if (planeLocalY > wallTopEnd) {
          continue;
        }
      }

      if (game.invincible) {
        var pColor = getEnemyDestroyColor(ennemy.type);
        particlesHolder.spawnParticles(ennemy.mesh.position.clone(), 20, pColor, 2);
        //
        if (ennemy.type === 'blackHole') {
          game.blackHoleSlowFactor = 1.0;
          game.blackHoleActive = false;
        }
        this.ennemiesInUse.splice(i,1);
        this.mesh.remove(ennemy.mesh);
        playInvincibleSmashSound();
        i--;
      } else {
        var hColor = getEnemyDestroyColor(ennemy.type);
        particlesHolder.spawnParticles(ennemy.mesh.position.clone(), 15, hColor, 3);
        //
        if (ennemy.type === 'blackHole') {
          game.blackHoleSlowFactor = 1.0;
          game.blackHoleActive = false;
        }
        this.ennemiesInUse.splice(i,1);
        this.mesh.remove(ennemy.mesh);
        //
        if (ennemy.type === 'waterPillar' || ennemy.type === 'fireWall') {
          game.planeCollisionSpeedX = 30 * diffPos.x / d;
          game.planeCollisionSpeedY = 20;
        } else {
          game.planeCollisionSpeedX = 100 * diffPos.x / d;
          game.planeCollisionSpeedY = 100 * diffPos.y / d;
        }
        ambientLight.intensity = 2;
        setTimeout(function(){ ambientLight.intensity = .5; }, 150);

        //
        if (ennemy.type === 'thunder' || ennemy.type === 'fireWall') {
          playDestroySound();
          removeEnergy();
          removeEnergy();
        } else {
          playDestroySound();
          removeEnergy();
        }
        i--;
      }
    }else if (ennemy.angle > Math.PI){
      //
      if (ennemy.type === 'blackHole' && ennemy.hasAppliedSlow) {
        game.blackHoleSlowFactor = 1.0;
        game.blackHoleActive = false;
      }
      this.ennemiesInUse.splice(i,1);
      this.mesh.remove(ennemy.mesh);
      i--;
    }
  }
}

//
var flyingAsteroids = [];

function spawnFlyingAsteroid() {
  var asteroid = new FlyingAsteroid();
  //
  asteroid.mesh.position.x = 250;
  //
  asteroid.mesh.position.y = game.planeDefaultHeight + (Math.random() - 0.5) * game.planeAmpHeight;
  asteroid.mesh.position.z = -50 + Math.random() * 100;
  scene.add(asteroid.mesh);
  flyingAsteroids.push(asteroid);
}

function updateFlyingAsteroids() {
  for (var i = flyingAsteroids.length - 1; i >= 0; i--) {
    var a = flyingAsteroids[i];
    //
    a.mesh.position.x -= a.speed * deltaTime * 0.1;
    a.mesh.rotation.z += 0.02 * deltaTime * 0.1;
    a.mesh.rotation.y += 0.015 * deltaTime * 0.1;

    //
    var diffPos = airplane.mesh.position.clone().sub(a.mesh.position.clone());
    var d = diffPos.length();

    if (d < 15) {
      if (game.invincible) {
        particlesHolder.spawnParticles(a.mesh.position.clone(), 20, 0xD4A843, 2);
        playInvincibleSmashSound();
      } else {
        particlesHolder.spawnParticles(a.mesh.position.clone(), 15, 0xD4A843, 3);
        game.planeCollisionSpeedX = 100 * diffPos.x / d;
        game.planeCollisionSpeedY = 100 * diffPos.y / d;
        ambientLight.intensity = 2;
        setTimeout(function(){ ambientLight.intensity = .5; }, 150);
        playDestroySound();
        removeEnergy();
      }
      scene.remove(a.mesh);
      flyingAsteroids.splice(i, 1);
      continue;
    }

    //
    if (a.mesh.position.x < -300) {
      scene.remove(a.mesh);
      flyingAsteroids.splice(i, 1);
    }
  }
}

//
function showLevelUpText(level) {
  var el = document.getElementById('levelUpText');
  if (!el) return;
  el.innerHTML = '<p class="level-label">Level</p><p class="level-number">' + level + '</p>';
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
  setTimeout(function() {
    el.classList.remove('show');
  }, 1600);
}

Particle = function(){
  var geom = new THREE.TetrahedronGeometry(3,0);
  var mat = new THREE.MeshPhongMaterial({
    color:0xC4883A,
    shininess:0,
    specular:0xffffff,
    shading:THREE.FlatShading
  });
  this.mesh = new THREE.Mesh(geom,mat);
}

Particle.prototype.explode = function(pos, color, scale){
  var _this = this;
  var _p = this.mesh.parent;
  this.mesh.material.color = new THREE.Color( color);
  this.mesh.material.needsUpdate = true;
  this.mesh.scale.set(scale, scale, scale);
  var targetX = pos.x + (-1 + Math.random()*2)*50;
  var targetY = pos.y + (-1 + Math.random()*2)*50;
  var speed = .6+Math.random()*.2;
  TweenMax.to(this.mesh.rotation, speed, {x:Math.random()*12, y:Math.random()*12});
  TweenMax.to(this.mesh.scale, speed, {x:.1, y:.1, z:.1});
  TweenMax.to(this.mesh.position, speed, {x:targetX, y:targetY, delay:Math.random() *.1, ease:Power2.easeOut, onComplete:function(){
      if(_p) _p.remove(_this.mesh);
      _this.mesh.scale.set(1,1,1);
      particlesPool.unshift(_this);
    }});
}

ParticlesHolder = function (){
  this.mesh = new THREE.Object3D();
  this.particlesInUse = [];
}

ParticlesHolder.prototype.spawnParticles = function(pos, density, color, scale){

  var nPArticles = density;
  for (var i=0; i<nPArticles; i++){
    var particle;
    if (particlesPool.length) {
      particle = particlesPool.pop();
    }else{
      particle = new Particle();
    }
    this.mesh.add(particle.mesh);
    particle.mesh.visible = true;
    var _this = this;
    particle.mesh.position.y = pos.y;
    particle.mesh.position.x = pos.x;
    particle.explode(pos,color, scale);
  }
}

Coin = function(){
  // TheAviator2 ?ㅽ????숈쟾 (湲덉깋 ?먰넻)
  var geom = new THREE.CylinderGeometry(4, 4, 1, 10);
  var mat = new THREE.MeshPhongMaterial({
    color: 0xFFD700,
    shininess: 80,
    specular: 0xFFFFFF,
    shading: THREE.FlatShading
  });
  this.mesh = new THREE.Mesh(geom, mat);
  this.mesh.castShadow = true;
  this.angle = 0;
  this.dist = 0;
}

CoinsHolder = function (nCoins){
  this.mesh = new THREE.Object3D();
  this.coinsInUse = [];
  this.coinsPool = [];
  for (var i=0; i<nCoins; i++){
    var coin = new Coin();
    this.coinsPool.push(coin);
  }
}

CoinsHolder.prototype.spawnCoins = function(){

  var nCoins = 5 + Math.floor(Math.random()*15);
  var d = game.seaRadius + game.planeDefaultHeight + (-1 + Math.random() * 2) * (game.planeAmpHeight-20);
  var amplitude = 10 + Math.round(Math.random()*10);
  for (var i=0; i<nCoins; i++){
    var coin;
    if (this.coinsPool.length) {
      coin = this.coinsPool.pop();
    }else{
      coin = new Coin();
    }
    this.mesh.add(coin.mesh);
    this.coinsInUse.push(coin);
    coin.angle = - (i*0.02);
    coin.distance = d + Math.cos(i*.5)*amplitude;
    coin.mesh.position.y = -game.seaRadius + Math.sin(coin.angle)*coin.distance;
    coin.mesh.position.x = Math.cos(coin.angle)*coin.distance;
  }
}

CoinsHolder.prototype.rotateCoins = function(){
  for (var i=0; i<this.coinsInUse.length; i++){
    var coin = this.coinsInUse[i];
    if (coin.exploding) continue;
    coin.angle += game.speed*deltaTime*game.coinsSpeed;
    if (coin.angle>Math.PI*2) coin.angle -= Math.PI*2;
    coin.mesh.position.y = -game.seaRadius + Math.sin(coin.angle)*coin.distance;
    coin.mesh.position.x = Math.cos(coin.angle)*coin.distance;
    coin.mesh.rotation.z += Math.random()*.1;
    coin.mesh.rotation.y += Math.random()*.1;

    //var globalCoinPosition =  coin.mesh.localToWorld(new THREE.Vector3());
    var diffPos = airplane.mesh.position.clone().sub(coin.mesh.position.clone());
    var d = diffPos.length();
    if (d<game.coinDistanceTolerance){
      this.coinsPool.unshift(this.coinsInUse.splice(i,1)[0]);
      this.mesh.remove(coin.mesh);
      particlesHolder.spawnParticles(coin.mesh.position.clone(), 5, 0xC4883A, .8);
      addCoin();
      i--;
    }else if (coin.angle > Math.PI){
      this.coinsPool.unshift(this.coinsInUse.splice(i,1)[0]);
      this.mesh.remove(coin.mesh);
      i--;
    }
  }
}

// ===== INVINCIBLE FRUIT =====

InvincibleFruit = function(){
  this.mesh = new THREE.Object3D();

  //
  var coreGeom = new THREE.SphereGeometry(6, 6, 4);
  var coreMat = new THREE.MeshPhongMaterial({
    color: 0xFFD700,
    emissive: 0xFF8C00,
    emissiveIntensity: 0.6,
    shininess: 80,
    specular: 0xFFFFFF,
    shading: THREE.FlatShading
  });
  var core = new THREE.Mesh(coreGeom, coreMat);
  this.mesh.add(core);

  //
  var spikeMat = new THREE.MeshPhongMaterial({
    color: 0xFFEE44,
    emissive: 0xFFAA00,
    emissiveIntensity: 0.4,
    shininess: 60,
    shading: THREE.FlatShading
  });
  var spikePositions = [
    [9,0,0], [-9,0,0], [0,9,0], [0,-9,0], [0,0,9], [0,0,-9]
  ];
  for (var i = 0; i < spikePositions.length; i++){
    var spikeGeom = new THREE.BoxGeometry(3, 7, 3, 1, 1, 1);
    //
    spikeGeom.vertices[4].x = 0; spikeGeom.vertices[4].z = 0;
    spikeGeom.vertices[5].x = 0; spikeGeom.vertices[5].z = 0;
    spikeGeom.vertices[6].x = 0; spikeGeom.vertices[6].z = 0;
    spikeGeom.vertices[7].x = 0; spikeGeom.vertices[7].z = 0;
    var spike = new THREE.Mesh(spikeGeom, spikeMat);
    spike.position.set(spikePositions[i][0], spikePositions[i][1], spikePositions[i][2]);
    spike.lookAt(new THREE.Vector3(spikePositions[i][0]*2, spikePositions[i][1]*2, spikePositions[i][2]*2));
    this.mesh.add(spike);
  }

  this.mesh.castShadow = true;
  this.angle = 0;
  this.dist = 0;
}

InvincibleFruitHolder = function(n){
  this.mesh = new THREE.Object3D();
  this.fruitsInUse = [];
  this.fruitsPool = [];
  for (var i = 0; i < n; i++){
    var fruit = new InvincibleFruit();
    this.fruitsPool.push(fruit);
  }
}

InvincibleFruitHolder.prototype.spawnFruit = function(){
  var fruit;
  if (this.fruitsPool.length){
    fruit = this.fruitsPool.pop();
  } else {
    fruit = new InvincibleFruit();
  }
  this.mesh.add(fruit.mesh);
  this.fruitsInUse.push(fruit);
  fruit.angle = 0;

  //
  var safeDistance = 0;
  var attempts = 0;
  var minSeparation = 40;
  do {
    safeDistance = game.seaRadius + game.planeDefaultHeight + (-1 + Math.random() * 2) * (game.planeAmpHeight - 20);
    var tooClose = false;
    for (var e = 0; e < ennemiesHolder.ennemiesInUse.length; e++) {
      var eDist = ennemiesHolder.ennemiesInUse[e].distance;
      if (Math.abs(safeDistance - eDist) < minSeparation) {
        tooClose = true;
        break;
      }
    }
    attempts++;
  } while (tooClose && attempts < 10);

  fruit.distance = safeDistance;
  fruit.mesh.position.y = -game.seaRadius + Math.sin(fruit.angle) * fruit.distance;
  fruit.mesh.position.x = Math.cos(fruit.angle) * fruit.distance;
}

InvincibleFruitHolder.prototype.rotateFruits = function(){
  for (var i = 0; i < this.fruitsInUse.length; i++){
    var fruit = this.fruitsInUse[i];
    fruit.angle += game.speed * deltaTime * game.invincibleFruitSpeed;
    if (fruit.angle > Math.PI * 2) fruit.angle -= Math.PI * 2;
    fruit.mesh.position.y = -game.seaRadius + Math.sin(fruit.angle) * fruit.distance;
    fruit.mesh.position.x = Math.cos(fruit.angle) * fruit.distance;
    //
    fruit.mesh.rotation.y += 0.05;
    fruit.mesh.rotation.z += 0.03;

    var diffPos = airplane.mesh.position.clone().sub(fruit.mesh.position.clone());
    var d = diffPos.length();
    if (d < game.invincibleFruitDistanceTolerance){
      this.fruitsPool.unshift(this.fruitsInUse.splice(i, 1)[0]);
      this.mesh.remove(fruit.mesh);
      particlesHolder.spawnParticles(fruit.mesh.position.clone(), 10, 0xFFD700, 1.2);
      activateInvincible();
      playPowerupSound();
      i--;
    } else if (fruit.angle > Math.PI){
      this.fruitsPool.unshift(this.fruitsInUse.splice(i, 1)[0]);
      this.mesh.remove(fruit.mesh);
      i--;
    }
  }
}

// ===== HEART ITEM =====

HeartItem = function(){
  this.mesh = new THREE.Object3D();

  // THREE.Shape?쇰줈 ?ㅼ젣 ?섑듃 怨≪꽑 ?앹꽦
  var heartShape = new THREE.Shape();
  heartShape.moveTo(0, 0);
  heartShape.bezierCurveTo(0, -3, -5, -8, -10, -8);
  heartShape.bezierCurveTo(-18, -8, -18, 2, -18, 2);
  heartShape.bezierCurveTo(-18, 8, -10, 14, 0, 18);
  heartShape.bezierCurveTo(10, 14, 18, 8, 18, 2);
  heartShape.bezierCurveTo(18, 2, 18, -8, 10, -8);
  heartShape.bezierCurveTo(5, -8, 0, -3, 0, 0);

  var extrudeSettings = {
    amount: 4,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 1,
    bevelThickness: 1
  };

  var heartGeom = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
  var heartMat = new THREE.MeshPhongMaterial({
    color: 0xFF2255,
    emissive: 0xFF0033,
    emissiveIntensity: 0.3,
    shininess: 60,
    shading: THREE.FlatShading
  });
  var heart = new THREE.Mesh(heartGeom, heartMat);
  heart.scale.set(0.5, 0.5, 0.5);
  heart.rotation.z = Math.PI;
  heart.position.set(0, 5, -1);
  this.mesh.add(heart);

  this.mesh.castShadow = true;
  this.angle = 0;
  this.dist = 0;
}

HeartItemHolder = function(n){
  this.mesh = new THREE.Object3D();
  this.itemsInUse = [];
  this.itemsPool = [];
  for (var i = 0; i < n; i++){
    this.itemsPool.push(new HeartItem());
  }
}

HeartItemHolder.prototype.spawnItem = function(){
  //
  if (game.hearts >= game.maxHearts) return;

  var item;
  if (this.itemsPool.length){
    item = this.itemsPool.pop();
  } else {
    item = new HeartItem();
  }
  this.mesh.add(item.mesh);
  this.itemsInUse.push(item);
  item.angle = 0;
  item.distance = game.seaRadius + game.planeDefaultHeight + (-1 + Math.random() * 2) * (game.planeAmpHeight - 20);
  item.mesh.position.y = -game.seaRadius + Math.sin(item.angle) * item.distance;
  item.mesh.position.x = Math.cos(item.angle) * item.distance;
}

HeartItemHolder.prototype.rotateItems = function(){
  for (var i = 0; i < this.itemsInUse.length; i++){
    var item = this.itemsInUse[i];
    item.angle += game.speed * deltaTime * game.invincibleFruitSpeed;
    if (item.angle > Math.PI * 2) item.angle -= Math.PI * 2;
    item.mesh.position.y = -game.seaRadius + Math.sin(item.angle) * item.distance;
    item.mesh.position.x = Math.cos(item.angle) * item.distance;
    item.mesh.rotation.y += 0.06;
    item.mesh.rotation.z = Math.sin(Date.now() * 0.003) * 0.2;

    var diffPos = airplane.mesh.position.clone().sub(item.mesh.position.clone());
    var d = diffPos.length();
    if (d < 18){
      this.itemsPool.unshift(this.itemsInUse.splice(i, 1)[0]);
      this.mesh.remove(item.mesh);
      particlesHolder.spawnParticles(item.mesh.position.clone(), 10, 0xFF4466, 1.2);
      addHeart();
      playPowerupSound();
      i--;
    } else if (item.angle > Math.PI){
      this.itemsPool.unshift(this.itemsInUse.splice(i, 1)[0]);
      this.mesh.remove(item.mesh);
      i--;
    }
  }
}

var invincibleGlow = null;

function activateInvincible(){
  game.invincible = true;
  // 다윈의 핀치 패시브: 무적 지속시간 2배
  var dur = game.invincibleDuration;
  if (game.currentForm === "Darwin's Finch") dur *= 2;
  game.invincibleTime = dur;

  //
  if (!invincibleGlow){
    var glowGeom = new THREE.SphereGeometry(120, 8, 6);
    var glowMat = new THREE.MeshPhongMaterial({
      color: 0xFFD700,
      transparent: true,
      opacity: 0.15,
      emissive: 0xFFAA00,
      emissiveIntensity: 0.3,
      side: THREE.DoubleSide
    });
    invincibleGlow = new THREE.Mesh(glowGeom, glowMat);
  }
  invincibleGlow.visible = true;
  if (!airplane.mesh.getObjectById(invincibleGlow.id)){
    airplane.mesh.add(invincibleGlow);
  }
}

function deactivateInvincible(){
  game.invincible = false;
  game.invincibleTime = 0;
  if (invincibleGlow){
    invincibleGlow.visible = false;
    if (invincibleGlow.parent){
      invincibleGlow.parent.remove(invincibleGlow);
    }
  }
}

function updateInvincible(){
  if (!game.invincible) return;
  game.invincibleTime -= deltaTime;

  //
  if (invincibleGlow){
    if (game.invincibleTime < 1000){
      invincibleGlow.material.opacity = 0.15 * (0.5 + 0.5 * Math.sin(game.invincibleTime * 0.02));
    } else {
      invincibleGlow.material.opacity = 0.12 + 0.06 * Math.sin(Date.now() * 0.005);
    }
    invincibleGlow.rotation.y += 0.02;
  }

  if (game.invincibleTime <= 0){
    deactivateInvincible();
  }
}


// 3D Models
var sea;
var airplane;

function createPlane(){
  shopState = loadShopData();
  if (shopState.selectedVehicle) {
    airplane = createNewCharacter(shopState.selectedVehicle);
    game.currentForm = shopState.selectedVehicle;
  } else {
    airplane = new Amoeba();
  }
  airplane.mesh.scale.set(.25,.25,.25);
  airplane.mesh.position.y = game.planeDefaultHeight;
  scene.add(airplane.mesh);
}

function createNewCharacter(formString) {
  switch(formString) {
    case "Anomalocaris": return new Anomalocaris();
    case "Opabinia": return new Opabinia();
    case "Dunkleosteus": return new Dunkleosteus();
    case "Tiktaalik": return new Tiktaalik();
    case "Quetzalcoatlus": return new Quetzalcoatlus();
    case "Plesiosaur": return new Plesiosaur();
    case "Bat": return new Bat();
    case "Wright Flyer": return new WrightFlyer();
    case "Jetliner": return new Jetliner();
    case "Rocket": return new Rocket();
    case "SpaceShuttle": return new SpaceShuttle();
    case "UFO": return new UFO();
    case "Newton's Apple": return new NewtonApple();
    case "Einstein": return new TimeArrow();
    case "AppleCraft": return new AppleCraft();
    case "Darwin's Finch": return new Finch();
    case "Amoeba":
    default: return new Amoeba();
  }
}

// ?ш??곸쑝濡?紐⑤뱺 Mesh ?먯떇???섏쭛
function collectMeshes(obj, list) {
  if (!list) list = [];
  if (obj instanceof THREE.Mesh) {
    list.push(obj);
  }
  for (var i = 0; i < obj.children.length; i++) {
    collectMeshes(obj.children[i], list);
  }
  return list;
}

//
function getLocalTransform(mesh, rootParent) {
  var pos = new THREE.Vector3();
  var scale = new THREE.Vector3();
  var quat = new THREE.Quaternion();
  
  //
  rootParent.updateMatrixWorld(true);
  
  var worldMatrix = mesh.matrixWorld.clone();
  var rootInverse = new THREE.Matrix4().getInverse(rootParent.matrixWorld);
  worldMatrix.multiplyMatrices(rootInverse, worldMatrix);
  worldMatrix.decompose(pos, quat, scale);
  
  var euler = new THREE.Euler().setFromQuaternion(quat);
  
  return {
    x: pos.x, y: pos.y, z: pos.z,
    rx: euler.x, ry: euler.y, rz: euler.z,
    sx: scale.x, sy: scale.y, sz: scale.z,
    color: mesh.material ? mesh.material.color.getHex() : 0xffffff
  };
}

function showEvolutionText() {
  var existing = document.getElementById('evolutionText');
  if (existing) existing.remove();
  
  var div = document.createElement('div');
  div.id = 'evolutionText';
  div.textContent = '✨Evolution ✨';
  div.style.cssText = 'position:fixed;top:40%;left:50%;transform:translate(-50%,-50%) scale(0.5);font-family:Playfair Display,serif;font-size:28px;font-weight:700;color:#FFD700;text-shadow:0 0 20px rgba(255,215,0,0.8),0 0 40px rgba(255,215,0,0.4);pointer-events:none;z-index:1500;opacity:0;letter-spacing:3px;';
  document.body.appendChild(div);
  
  requestAnimationFrame(function() {
    div.style.transition = 'all 0.5s ease-out';
    div.style.opacity = '1';
    div.style.transform = 'translate(-50%,-50%) scale(1)';
    
    setTimeout(function() {
      div.style.transition = 'all 0.6s ease-in';
      div.style.opacity = '0';
      div.style.transform = 'translate(-50%,-70%) scale(1.3)';
      setTimeout(function() {
        if (div.parentNode) div.parentNode.removeChild(div);
      }, 700);
    }, 1200);
  });
}

function transformPlane(newFormString) {
  //
  if (game.transforming) return;
  game.transforming = true;
  
  //
  showEvolutionText();
  
  var oldAirplane = airplane;
  var oldPos = airplane.mesh.position.clone();
  var oldRot = airplane.mesh.rotation.clone();
  var oldScale = airplane.mesh.scale.clone();
  
  //
  var oldMeshes = collectMeshes(oldAirplane.mesh);
  var oldTransforms = [];
  for (var i = 0; i < oldMeshes.length; i++) {
    oldTransforms.push(getLocalTransform(oldMeshes[i], oldAirplane.mesh));
  }
  
  //
  var newAirplane = createNewCharacter(newFormString);
  newAirplane.mesh.scale.copy(oldScale);
  newAirplane.mesh.position.copy(oldPos);
  newAirplane.mesh.rotation.copy(oldRot);
  
  var newMeshes = collectMeshes(newAirplane.mesh);
  var newTransforms = [];
  for (var i = 0; i < newMeshes.length; i++) {
    newTransforms.push(getLocalTransform(newMeshes[i], newAirplane.mesh));
  }
  
  // 蹂??而⑦뀒?대꼫: 湲곗〈 鍮꾪뻾泥대? ?쒓굅?섍퀬, flat??釉붾줉?ㅻ줈 援ъ꽦
  scene.remove(oldAirplane.mesh);
  
  var morphContainer = new THREE.Object3D();
  morphContainer.position.copy(oldPos);
  morphContainer.rotation.copy(oldRot);
  morphContainer.scale.copy(oldScale);
  scene.add(morphContainer);
  
  // 湲곗〈 釉붾줉?ㅼ쓣 morphContainer??吏곸냽 ?먯떇?쇰줈 ?щ같移?
  var morphBlocks = [];
  for (var i = 0; i < oldMeshes.length; i++) {
    var block = oldMeshes[i];
    var t = oldTransforms[i];
    
    // ??硫붿떆瑜?留뚮뱾?댁꽌 媛숈? geometry? material clone ?ъ슜
    var newMat = block.material.clone();
    var morphBlock = new THREE.Mesh(block.geometry.clone(), newMat);
    morphBlock.position.set(t.x, t.y, t.z);
    morphBlock.rotation.set(t.rx, t.ry, t.rz);
    morphBlock.scale.set(t.sx, t.sy, t.sz);
    morphBlock.castShadow = true;
    
    morphContainer.add(morphBlock);
    morphBlocks.push(morphBlock);
  }
  
  //
  var maxBlocks = Math.max(oldTransforms.length, newTransforms.length);
  
  //
  while (morphBlocks.length < maxBlocks) {
    var srcIdx = morphBlocks.length % oldTransforms.length;
    var srcBlock = morphBlocks[srcIdx];
    var extraBlock = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 2),
      srcBlock.material.clone()
    );
    extraBlock.position.set(0, 0, 0);
    extraBlock.scale.set(0.01, 0.01, 0.01);
    extraBlock.castShadow = true;
    morphContainer.add(extraBlock);
    morphBlocks.push(extraBlock);
  }
  
  //
  var morphDuration = 1.2;
  var completedCount = 0;
  
  for (var i = 0; i < maxBlocks; i++) {
    var block = morphBlocks[i];
    var delay = Math.random() * 0.3;
    
    if (i < newTransforms.length) {
      //
      var target = newTransforms[i];
      
      //
      TweenMax.to(block.position, morphDuration, {
        x: target.x, y: target.y, z: target.z,
        delay: delay,
        ease: Power2.easeInOut
      });
      
      //
      TweenMax.to(block.rotation, morphDuration, {
        x: target.rx, y: target.ry, z: target.rz,
        delay: delay,
        ease: Power2.easeInOut
      });
      
      //
      TweenMax.to(block.scale, morphDuration, {
        x: target.sx, y: target.sy, z: target.sz,
        delay: delay,
        ease: Power2.easeInOut
      });
      
      //
      var targetColor = new THREE.Color(target.color);
      TweenMax.to(block.material.color, morphDuration, {
        r: targetColor.r, g: targetColor.g, b: targetColor.b,
        delay: delay,
        ease: Power2.easeInOut,
        onUpdate: function() { this.target.material && (this.target.material.needsUpdate = true); }.bind({target: block})
      });
      
    } else {
      //
      TweenMax.to(block.scale, morphDuration * 0.6, {
        x: 0.01, y: 0.01, z: 0.01,
        delay: delay,
        ease: Power2.easeIn
      });
    }
    
    //
    if (i === maxBlocks - 1) {
      TweenMax.to({}, morphDuration + 0.35, {
        onComplete: function() {
          // morphContainer ?쒓굅
          scene.remove(morphContainer);
          
          //
          airplane = newAirplane;
          airplane.mesh.position.copy(morphContainer.position);
          airplane.mesh.rotation.copy(morphContainer.rotation);
          airplane.mesh.scale.copy(morphContainer.scale);
          scene.add(airplane.mesh);
          
          game.currentForm = newFormString;
          game.transforming = false;
          
          //
          particlesHolder.spawnParticles(airplane.mesh.position.clone(), 15, 0xFFFFFF, 1.2);
          
          //
          if (game.invincible && invincibleGlow) {
            invincibleGlow.visible = true;
            if (invincibleGlow.parent) {
              invincibleGlow.parent.remove(invincibleGlow);
            }
            airplane.mesh.add(invincibleGlow);
          }
        }
      });
    }
  }
  
  // morphContainer媛 airplane怨??숈씪?섍쾶 ?吏곸씠?꾨줉 ?꾩떆 airplane ?ㅼ젙
  // propeller? pilot???꾩슂?섎?濡??붾? ?ㅼ젙
  airplane = {
    mesh: morphContainer,
    propeller: { rotation: { x: 0 } },
    pilot: { updateHairs: function(){} },
    updateWings: null
  };
  game.currentForm = newFormString;
}

function createSea(){
  sea = new Sea();
  sea.mesh.position.y = -game.seaRadius;
  scene.add(sea.mesh);
  applyEnvironmentTheme();
}

function createSky(){
  sky = new Sky();
  sky.mesh.position.y = -game.seaRadius;
  scene.add(sky.mesh);
}

function createCoins(){

  coinsHolder = new CoinsHolder(20);
  scene.add(coinsHolder.mesh)
}

function createEnnemies(){
  for (var i=0; i<10; i++){
    var ennemy = new Ennemy();
    ennemiesPool.push(ennemy);
  }
  ennemiesHolder = new EnnemiesHolder();
  //ennemiesHolder.mesh.position.y = -game.seaRadius;
  scene.add(ennemiesHolder.mesh)
}

function createParticles(){
  for (var i=0; i<10; i++){
    var particle = new Particle();
    particlesPool.push(particle);
  }
  particlesHolder = new ParticlesHolder();
  //ennemiesHolder.mesh.position.y = -game.seaRadius;
  scene.add(particlesHolder.mesh)
}

var invincibleFruitHolder;

function createInvincibleFruits(){
  invincibleFruitHolder = new InvincibleFruitHolder(5);
  scene.add(invincibleFruitHolder.mesh);
}

var heartItemHolder;

function createHeartItems(){
  heartItemHolder = new HeartItemHolder(3);
  scene.add(heartItemHolder.mesh);
}

function loop(){

  if (paused) {
    requestAnimationFrame(loop);
    return;
  }

  newTime = new Date().getTime();
  deltaTime = newTime-oldTime;
  oldTime = newTime;
  applyEnvironmentTheme();

  // 釉붾옓? ?щ줈??紐⑥뀡: deltaTime ?먯껜???곸슜?섏뿬 ?꾩껜 寃뚯엫 ?щ줈??
  if (game.blackHoleActive) {
    deltaTime *= game.blackHoleSlowFactor;
  }

  if (game.status=="waiting"){
    //
    sky.moveClouds();
    sea.moveWaves();
    sea.mesh.rotation.z += 0.0001 * deltaTime;
    //
    airplane.mesh.position.y = game.planeDefaultHeight + Math.sin(Date.now() * 0.0015) * 3;
    airplane.propeller.rotation.x += 0.05;
    if (airplane.updateWings) airplane.updateWings();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
    return;
  }

  if (game.status=="playing"){

    // === 보스전: 완전 정지, 전투만 ===
    var bossActive = (typeof bossState !== 'undefined' && bossState.active);

    if (bossActive) {
      // 보스전 중: 스폰 없음, 거리 증가 없음, 속도 0
      game.speed = 0;
      game.baseSpeed = 0;
      try {
        if (typeof updateBoss === 'function') updateBoss(deltaTime);
      } catch(bossErr) { console.warn('Boss error:', bossErr); }
      updatePlane();
      updateHearts();
      if (typeof updateAbilities === 'function') updateAbilities(deltaTime);
      if (typeof updateDestroyParticles === 'function') updateDestroyParticles(deltaTime);

    } else {
      // === 일반 비행 ===

      // Add energy coins every 100m;
      if (Math.floor(game.distance)%game.distanceForCoinsSpawn == 0 && Math.floor(game.distance) > game.coinLastSpawn){
        game.coinLastSpawn = Math.floor(game.distance);
        coinsHolder.spawnCoins();
      }

      // Spawn invincible fruit
      if (Math.floor(game.distance)%game.distanceForInvincibleSpawn == 0 && Math.floor(game.distance) > game.invincibleFruitLastSpawn){
        game.invincibleFruitLastSpawn = Math.floor(game.distance);
        invincibleFruitHolder.spawnFruit();
      }

      // Spawn heart item (틱타알릭 패시브: 출현빈도 1.5배 → 간격 2/3)
      var heartSpawnDist = game.distanceForHeartItemSpawn;
      if (game.currentForm === 'Tiktaalik') heartSpawnDist = Math.round(heartSpawnDist / 1.5);
      if (Math.floor(game.distance) % heartSpawnDist == 0 && Math.floor(game.distance) > game.heartItemLastSpawn){
        game.heartItemLastSpawn = Math.floor(game.distance);
        heartItemHolder.spawnItem();
      }

      if (Math.floor(game.distance)%game.distanceForSpeedUpdate == 0 && Math.floor(game.distance) > game.speedLastUpdate){
        game.speedLastUpdate = Math.floor(game.distance);
        game.targetBaseSpeed += game.incrementSpeedByTime*deltaTime;
      }


      // 장애물 스폰 (플레시오사우르스 패시브: 간격 +30%)
      var ennemySpawnDist = game.distanceForEnnemiesSpawn;
      if (game.currentForm === 'Plesiosaur') ennemySpawnDist = Math.round(ennemySpawnDist * 1.3);
      if (Math.floor(game.distance) % ennemySpawnDist == 0 && Math.floor(game.distance) > game.ennemyLastSpawn){
        game.ennemyLastSpawn = Math.floor(game.distance);
        ennemiesHolder.spawnEnnemies();
      }

      //
      if (game.level >= 3 && Math.floor(game.distance) - game.flyingAsteroidLastSpawn >= game.distanceForFlyingAsteroidSpawn){
        game.flyingAsteroidLastSpawn = Math.floor(game.distance);
        spawnFlyingAsteroid();
      }

      //
      updateFlyingAsteroids();

      var expectedLevel = Math.floor(game.distance / game.distanceForLevelUpdate) + 1;
      if (expectedLevel > game.level){
        game.level = expectedLevel;
        fieldLevel.innerHTML = Math.floor(game.level);
        showLevelUpText(game.level);

        game.targetBaseSpeed = game.initSpeed + game.incrementSpeedByLevel*game.level
      }

      // Checking for Transformation
      var canEvolve = !shopState.selectedVehicle || (isEvoVehicle(shopState.selectedVehicle) && shopState.autoEvolve);
      if (canEvolve) {
        if (game.distance > game.transformDistance1 && game.currentForm === "Amoeba") {
          transformPlane("Anomalocaris");
          unlockEvoForm("Anomalocaris", 2);
        } else if (game.distance > game.transformDistance2 && game.currentForm === "Anomalocaris") {
          transformPlane("Dunkleosteus");
          unlockEvoForm("Dunkleosteus", 3);
        } else if (game.distance > game.transformDistance3 && game.currentForm === "Dunkleosteus") {
          transformPlane("Tiktaalik");
          unlockEvoForm("Tiktaalik", 4);
        } else if (game.distance > game.transformDistance4 && game.currentForm === "Tiktaalik") {
          transformPlane("Plesiosaur");
          unlockEvoForm("Plesiosaur", 5);
        } else if (game.distance > game.transformDistance5 && game.currentForm === "Plesiosaur") {
          transformPlane("Quetzalcoatlus");
          unlockEvoForm("Quetzalcoatlus", 6);
        } else if (game.distance > game.transformDistance6 && game.currentForm === "Quetzalcoatlus") {
          transformPlane("Darwin's Finch");
          unlockEvoForm("Darwin's Finch", 7);
          markDarwinFinchReached();
        }
      }

      updateTurbulence();
      //
      try {
        if (typeof checkBossTrigger === 'function') checkBossTrigger();
      } catch(bossErr) { console.warn('Boss error:', bossErr); }
      updatePlane();
      updateDistance();
      updateHearts();
      game.baseSpeed += (game.targetBaseSpeed - game.baseSpeed) * deltaTime * 0.02;
      if (game.baseSpeed > game.maxSpeed) game.baseSpeed = game.maxSpeed;
      //
      var abilityMult = (typeof getAbilitySpeedMultiplier === 'function') ? getAbilitySpeedMultiplier() : 1.0;
      game.speed = game.baseSpeed * game.planeSpeed * abilityMult;

      //
      if (typeof updateAbilities === 'function') updateAbilities(deltaTime);
      if (typeof updateDestroyParticles === 'function') updateDestroyParticles(deltaTime);
      if (typeof updateDarwinPassive === 'function') updateDarwinPassive(deltaTime);
    }

  }else if(game.status=="gameover"){
    game.speed *= .99;
    airplane.mesh.rotation.z += (-Math.PI/2 - airplane.mesh.rotation.z)*.0002*deltaTime;
    airplane.mesh.rotation.x += 0.0003*deltaTime;
    game.planeFallSpeed *= 1.05;
    airplane.mesh.position.y -= game.planeFallSpeed*deltaTime;

    //
    if (airplane.mesh.position.y < 10 && !game.splashPlayed) {
      game.splashPlayed = true;
      playWaterSplashSound();
    }

    if (airplane.mesh.position.y <-200){
      //
      showContinuePrompt();
      game.status = "continuePrompt";
      if (typeof hideAbilityUI === 'function') hideAbilityUI();
      if (typeof cleanupProjectiles === 'function') cleanupProjectiles();
    }
  }else if(game.status=="continuePrompt"){
    //
    sky.moveClouds();
    sea.moveWaves();
    sea.mesh.rotation.z += 0.0001 * deltaTime;

  }else if (game.status=="waitingReplay"){

  }




  airplane.propeller.rotation.x +=.2 + game.planeSpeed * deltaTime*.005;
  if (airplane.updateWings) airplane.updateWings();
  sea.mesh.rotation.z += game.speed*deltaTime;

  if ( sea.mesh.rotation.z > 2*Math.PI)  sea.mesh.rotation.z -= 2*Math.PI;

  coinsHolder.rotateCoins();
  ennemiesHolder.rotateEnnemies();
  invincibleFruitHolder.rotateFruits();
  heartItemHolder.rotateItems();
  updateInvincible();

  sky.moveClouds();
  sea.moveWaves();

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

function updateDistance(){
  game.distance += game.speed*deltaTime*game.ratioSpeedDistance;
  fieldDistance.innerHTML = Math.floor(game.distance);
  var d = 502*(1-(game.distance%game.distanceForLevelUpdate)/game.distanceForLevelUpdate);
  levelCircle.setAttribute("stroke-dashoffset", d);

}

function updateHearts(){
  //
  var container = document.querySelector('.score__value--hearts');
  if (!container) return;

  // maxHearts媛 蹂寃쎈릺?덉쑝硫??섑듃 ?붿냼 ?ъ깮??
  var currentCount = container.children.length;
  if (currentCount !== game.maxHearts) {
    container.innerHTML = '';
    for (var j = 0; j < game.maxHearts; j++) {
      var span = document.createElement('span');
      span.className = 'heart';
      span.id = 'heart' + (j + 1);
      container.appendChild(span);
    }
  }

  for (var i = 1; i <= game.maxHearts; i++) {
    var el = document.getElementById('heart' + i);
    if (!el) continue;
    if (i <= game.hearts) {
      el.textContent = '❤️';
      el.className = 'heart active';
    } else {
      el.textContent = '🖤';
      el.className = 'heart lost';
    }
  }

  if (game.hearts <= 0){
    game.status = "gameover";
  }
}

function addCoin(){
  var coinMultiplier = 1;
  //
  if (shopState && shopState.selectedVehicle === 'Jetliner') {
    coinMultiplier = 3;
  }
  //
  // 케찰코아틀루스 패시브: 코인 +50%
  if (game.currentForm === 'Quetzalcoatlus') {
    coinMultiplier *= 1.5;
  }
  var earned = game.coinValue * coinMultiplier;
  game.coins += earned;
  game.coinsEarnedThisRound += earned;
  localStorage.setItem('totalCoins', game.coins);
  document.getElementById('coinsValue').textContent = game.coins;
  playCoinSound();
}

function addHeart(){
  if (game.hearts < game.maxHearts) {
    game.hearts++;
    var el = document.getElementById('heart' + game.hearts);
    if (el) {
      el.textContent = '❤️';
      el.className = 'heart active gain';
    }
    //
    showHeartPickup();
  }
}

function showHeartPickup() {
  var existing = document.getElementById('heartPickupDisplay');
  if (existing) existing.remove();
  
  var div = document.createElement('div');
  div.id = 'heartPickupDisplay';
  div.textContent = '❤️';
  div.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(0.3);font-size:120px;pointer-events:none;z-index:1500;opacity:0;transition:none;';
  document.body.appendChild(div);
  
  //
  requestAnimationFrame(function() {
    div.style.transition = 'all 0.4s ease-out';
    div.style.opacity = '1';
    div.style.transform = 'translate(-50%,-50%) scale(1.2)';
    
    setTimeout(function() {
      div.style.transition = 'all 0.3s ease-in';
      div.style.opacity = '0';
      div.style.transform = 'translate(-50%,-70%) scale(0.5)';
      
      setTimeout(function() {
        if (div.parentNode) div.parentNode.removeChild(div);
      }, 350);
    }, 500);
  });
}

function removeEnergy(){
  if (game.invincible) return;
  // 아노말로카리스 패시브: 30% 확률 데미지 무시
  if (game.currentForm === 'Anomalocaris' && Math.random() < 0.3) {
    showEvoPassiveText('갑각 방어!');
    return;
  }
  // 아인슈타인 패시브: 50% 확률로 코인 10개 소실로 대체
  if (shopState && shopState.selectedVehicle === 'Einstein' && Math.random() < 0.5 && game.coins >= 10) {
    game.coins -= 10;
    game.coinsEarnedThisRound -= 10;
    var totalC = parseInt(localStorage.getItem('totalCoins') || '0');
    localStorage.setItem('totalCoins', Math.max(0, totalC - 10).toString());
    var coinsEl = document.getElementById('coinsValue');
    if (coinsEl) coinsEl.textContent = game.coins;
    showEvoPassiveText('코인 방어! -10🪙');
    return;
  }
  game.hearts--;
  game.hearts = Math.max(0, game.hearts);
  updateHearts();
  // 피격 후 무적 (기본 0.5초, 라이트 형제 3.5초)
  if (game.hearts > 0) {
    game.invincible = true;
    var hitInvDur = (shopState && shopState.selectedVehicle === 'Wright Flyer') ? 3500 : 500;
    game.invincibleTime = hitInvDur;
  }
}

// 진화체 패시브 알림
function showEvoPassiveText(msg) {
  var el = document.getElementById('levelUpText');
  if (el) {
    el.innerHTML = '<p class="level-label">🛡️ ' + msg + '</p>';
    el.classList.add('show');
    setTimeout(function() { el.classList.remove('show'); }, 1000);
  }
}

// 다윈의 핀치 패시브: 30초마다 하트 회복
var darwinHealTimer = 0;
function updateDarwinPassive(dt) {
  if (game.currentForm !== "Darwin's Finch") { darwinHealTimer = 0; return; }
  darwinHealTimer += dt;
  if (darwinHealTimer >= 20000) {
    darwinHealTimer = 0;
    if (game.hearts < game.maxHearts) {
      addHeart();
      // 큰 알림
      var el = document.getElementById('levelUpText');
      if (el) {
        el.innerHTML = '<p class="level-label" style="color:#FF6B6B;">✨ 다윈의 핀치 ✨</p><p class="level-number" style="font-size:1.5em;">❤️ 하트 회복!</p>';
        el.classList.add('show');
        setTimeout(function() { el.classList.remove('show'); }, 1500);
      }
    }
  }
}



// ===== TURBULENCE (?쒓린瑜? SYSTEM =====

var turbulenceTriggerDistances = [3000, 5500, 9000, 13000, 17000, 21000];

function getTurbulenceTriggerDistances() {
  //
  var maxDist = Math.floor(game.distance) + 5000;
  var distances = turbulenceTriggerDistances.slice();
  var last = distances[distances.length - 1];
  while (last + 4000 <= maxDist) {
    last += 4000;
    distances.push(last);
  }
  return distances;
}

function updateTurbulence() {
  //
  if (game.turbulenceActive) {
    game.turbulenceTimer += deltaTime;
    if (game.turbulenceTimer >= game.turbulenceDuration) {
      //
      game.turbulenceActive = false;
      game.turbulenceLevel = 0;
      game.turbulenceTimer = 0;
    }
    return;
  }

  //
  var triggers = getTurbulenceTriggerDistances();
  var dist = Math.floor(game.distance);
  for (var i = 0; i < triggers.length; i++) {
    var td = triggers[i];
    //
    if (dist >= td && game.turbulenceTriggered.indexOf(td) === -1) {
      game.turbulenceTriggered.push(td);
      //
      game.turbulenceLevel = 1 + Math.floor(Math.random() * 3);
      game.turbulenceActive = true;
      game.turbulenceTimer = 0;
      showTurbulenceWarning(game.turbulenceLevel);
      //
      playTurbulenceSound();
      break;
    }
  }
}

function showTurbulenceWarning(level) {
  var existing = document.getElementById('turbulenceWarning');
  if (existing) existing.remove();

  var labels = ['', 'MILD', 'MODERATE', 'SEVERE'];
  var colors = ['', '#FFD700', '#FF8C00', '#FF3333'];

  var div = document.createElement('div');
  div.id = 'turbulenceWarning';
  div.innerHTML = '⚠ TURBULENCE Lv.' + level + '<br><span style="font-size:0.5em;letter-spacing:0.2em;">' + labels[level] + '</span>';
  div.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(0.5);' +
    'font-family:Playfair Display,serif;font-size:48px;font-weight:700;color:' + colors[level] + ';' +
    'text-align:center;pointer-events:none;z-index:1500;opacity:0;' +
    'text-shadow:0 0 30px rgba(0,0,0,0.8),0 4px 15px rgba(0,0,0,0.5);transition:none;';
  document.body.appendChild(div);

  //
  requestAnimationFrame(function() {
    div.style.transition = 'all 0.4s ease-out';
    div.style.opacity = '1';
    div.style.transform = 'translate(-50%,-50%) scale(1)';
    setTimeout(function() {
      div.style.transition = 'all 0.6s ease-in';
      div.style.opacity = '0';
      div.style.transform = 'translate(-50%,-50%) scale(1.5)';
      setTimeout(function() {
        if (div.parentNode) div.parentNode.removeChild(div);
      }, 700);
    }, 1500);
  });
}

function playTurbulenceSound() {
  try {
    var ctx = getAudioCtx();
    var now = ctx.currentTime;
    //
    var bufferSize = ctx.sampleRate * 0.5;
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) * 0.5;
    }
    var noise = ctx.createBufferSource();
    noise.buffer = buffer;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    var filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.5);
  } catch(e) {}
}

function updatePlane(){

  // === 보스전: 자유 2D 이동 + 줌아웃 ===
  if (typeof bossState !== 'undefined' && bossState.active) {
    var bossTargetX = mousePos.x < 0 ? mousePos.x * 350 : mousePos.x * 80;
    var bossTargetY = game.planeDefaultHeight + mousePos.y * 150;

    airplane.mesh.position.x += (bossTargetX - airplane.mesh.position.x) * 0.12;
    airplane.mesh.position.y += (bossTargetY - airplane.mesh.position.y) * 0.12;

    airplane.mesh.rotation.z = (bossTargetY - airplane.mesh.position.y) * 0.015;
    airplane.mesh.rotation.x = (airplane.mesh.position.y - bossTargetY) * 0.008;

    // 넓은 시야
    var bossFov = isMobile ? 65 : 80;
    camera.fov += (bossFov - camera.fov) * 0.05;
    camera.updateProjectionMatrix();
    camera.position.y += (game.planeDefaultHeight - camera.position.y) * 0.03;
    camera.position.x += (0 - camera.position.x) * 0.03;

    game.planeSpeed = game.planeMinSpeed;
    airplane.pilot.updateHairs();
    if (airplane.updateWings) airplane.updateWings();
    return;
  }

  // === 일반 비행 ===
  var effMouseX = mousePos.x;
  var effMouseY = mousePos.y;
  if (game.turbulenceActive && game.turbulenceLevel > 0) {
    var noiseAmp = game.turbulenceLevel * 0.08;
    var t = game.turbulenceTimer * 0.006;
    effMouseX += Math.sin(t * 3.7) * noiseAmp + Math.sin(t * 7.1) * noiseAmp * 0.5;
    effMouseY += Math.cos(t * 4.3) * noiseAmp + Math.cos(t * 8.9) * noiseAmp * 0.3;
  }

  game.planeSpeed = normalize(effMouseX,-.5,.5,game.planeMinSpeed, game.planeMaxSpeed);
  var targetY = normalize(effMouseY,-.75,.75,game.planeDefaultHeight-game.planeAmpHeight, game.planeDefaultHeight+game.planeAmpHeight);
  var targetX = normalize(effMouseX,-1,1,-game.planeAmpWidth*.7, -game.planeAmpWidth);

  game.planeCollisionDisplacementX += game.planeCollisionSpeedX;
  targetX += game.planeCollisionDisplacementX;


  game.planeCollisionDisplacementY += game.planeCollisionSpeedY;
  targetY += game.planeCollisionDisplacementY;

  // 케찰코아틀루스 패시브: 조작 민감도 +30%
  var moveSens = game.planeMoveSensivity;
  if (game.currentForm === 'Dunkleosteus') moveSens *= 1.3;
  airplane.mesh.position.y += (targetY-airplane.mesh.position.y)*deltaTime*moveSens;
  airplane.mesh.position.x += (targetX-airplane.mesh.position.x)*deltaTime*moveSens;

  airplane.mesh.rotation.z = (targetY-airplane.mesh.position.y)*deltaTime*game.planeRotXSensivity;
  airplane.mesh.rotation.x = (airplane.mesh.position.y-targetY)*deltaTime*game.planeRotZSensivity;
  var targetCameraZ = normalize(game.planeSpeed, game.planeMinSpeed, game.planeMaxSpeed, game.cameraNearPos, game.cameraFarPos);
  if (isMobile) {
    camera.fov = normalize(mousePos.x,-1,1,28, 55);
  } else {
    camera.fov = normalize(mousePos.x,-1,1,40, 80);
  }
  camera.updateProjectionMatrix ()
  camera.position.y += (airplane.mesh.position.y - camera.position.y)*deltaTime*game.cameraSensivity;

  //
  if (game.turbulenceActive && game.turbulenceLevel > 0) {
    var shakeAmp = game.turbulenceLevel * 1.5;
    game.turbulenceCamShake.x = (Math.random() - 0.5) * shakeAmp;
    game.turbulenceCamShake.y = (Math.random() - 0.5) * shakeAmp;
    camera.position.x += game.turbulenceCamShake.x;
    camera.position.y += game.turbulenceCamShake.y;
  }

  game.planeCollisionSpeedX += (0-game.planeCollisionSpeedX)*deltaTime * 0.03;
  game.planeCollisionDisplacementX += (0-game.planeCollisionDisplacementX)*deltaTime *0.01;
  game.planeCollisionSpeedY += (0-game.planeCollisionSpeedY)*deltaTime * 0.03;
  game.planeCollisionDisplacementY += (0-game.planeCollisionDisplacementY)*deltaTime *0.01;

  airplane.pilot.updateHairs();
  if (airplane.updateWings) airplane.updateWings();
}

function showReplay(){
  // Legacy - no longer used
}

function hideReplay(){
  // Legacy - no longer used
}

// ===== RANKING SYSTEM (Supabase) =====

var RANKING_KEY = 'flyDarwinRankings';
var MAX_RANKINGS = 100;
var currentPlayerRankIndex = -1;

// Supabase ?대씪?댁뼵??珥덇린??
var SUPABASE_URL = 'https://yayfjpjuzpwhhxzwqyom.supabase.co';
var SUPABASE_ANON_KEY = 'sb_publishable_p68ycUm3ZVTSw62a6wb_kA_8icbgCNF';
var supabaseClient = null;
var currentUser = null; // Finch 로그인 유저

function getSupabase() {
  if (!supabaseClient && window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

// Finch 로그인 상태 확인 (URL 토큰 또는 기존 세션)
async function initAuth() {
  var sb = getSupabase();
  if (!sb) return;
  try {
    // URL 파라미터에서 토큰 확인 (finch.co.kr iframe에서 전달)
    var params = new URLSearchParams(window.location.search);
    var accessToken = params.get('access_token');
    var refreshToken = params.get('refresh_token');
    if (accessToken && refreshToken) {
      await sb.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      // URL에서 토큰 제거 (보안)
      if (window.history.replaceState) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    }

    var { data } = await sb.auth.getUser();
    currentUser = data.user || null;
    sb.auth.onAuthStateChange(function(event, session) {
      currentUser = session ? session.user : null;
      updateLoginUI();
      if (currentUser) loadCloudSave();
    });
    updateLoginUI();
    if (currentUser) loadCloudSave();
  } catch(e) { console.warn('Auth init failed:', e); }
}

function updateLoginUI() {
  var btns = [document.getElementById('cloudSaveBtn'), document.getElementById('gameOverCloudSaveBtn')];
  for (var i = 0; i < btns.length; i++) {
    var btn = btns[i];
    if (!btn) continue;
    if (currentUser) {
      btn.innerHTML = '☁️ 저장됨 ✓';
      btn.style.color = '#4CAF50';
      btn.style.borderColor = 'rgba(76,175,80,0.3)';
      btn.onclick = null;
      btn.style.cursor = 'default';
    } else {
      btn.innerHTML = '🔒 로그인하면 상점과 아이템 기록이 안전해요';
      btn.style.color = 'rgba(255,255,255,0.7)';
      btn.style.borderColor = 'rgba(255,255,255,0.2)';
      btn.style.cursor = 'pointer';
      btn.onclick = function() { window.open('https://www.finch.co.kr?login=true', '_top'); };
    }
  }
}

// 클라우드 저장 (로그인 시)
async function saveCloudData() {
  if (!currentUser) return;
  var sb = getSupabase();
  if (!sb) return;
  try {
    var shopData = loadShopData();
    var coins = parseInt(localStorage.getItem('totalCoins') || '0');
    await sb.from('fly_darwin_saves').upsert({
      user_id: currentUser.id,
      shop_data: shopData,
      total_coins: coins,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
  } catch(e) { console.warn('Cloud save failed:', e); }
}

// 클라우드 불러오기 (로그인 시)
async function loadCloudSave() {
  if (!currentUser) return;
  var sb = getSupabase();
  if (!sb) return;
  try {
    var { data, error } = await sb
      .from('fly_darwin_saves')
      .select('shop_data, total_coins')
      .eq('user_id', currentUser.id)
      .single();
    if (error || !data) return;
    // 클라우드 데이터가 있으면 로컬에 병합 (더 진행된 쪽 우선)
    var localShop = loadShopData();
    var cloudShop = data.shop_data;
    var localCoins = parseInt(localStorage.getItem('totalCoins') || '0');
    var cloudCoins = data.total_coins || 0;
    // 코인은 큰 쪽
    if (cloudCoins > localCoins) {
      localStorage.setItem('totalCoins', cloudCoins.toString());
    }
    // 해금 데이터는 합치기 (양쪽 합집합)
    if (cloudShop) {
      var merged = {
        unlockedVehicles: mergeArrays(localShop.unlockedVehicles, cloudShop.unlockedVehicles || []),
        selectedVehicle: localShop.selectedVehicle || cloudShop.selectedVehicle,
        purchasedUpgrades: mergeArrays(localShop.purchasedUpgrades, cloudShop.purchasedUpgrades || []),
        darwinFinchReached: localShop.darwinFinchReached || cloudShop.darwinFinchReached || false,
        unlockedEvoForms: mergeArrays(localShop.unlockedEvoForms, cloudShop.unlockedEvoForms || []),
        maxEvoLevel: Math.max(localShop.maxEvoLevel || 1, cloudShop.maxEvoLevel || 1),
        autoEvolve: localShop.autoEvolve !== undefined ? localShop.autoEvolve : true
      };
      saveShopData(merged);
      shopState = merged;
    }
  } catch(e) { console.warn('Cloud load failed:', e); }
}

function mergeArrays(a, b) {
  var result = a.slice();
  for (var i = 0; i < b.length; i++) {
    if (result.indexOf(b[i]) === -1) result.push(b[i]);
  }
  return result;
}

// localStorage ?대갚 ?⑥닔??
function getLocalRankings() {
  try {
    var data = localStorage.getItem(RANKING_KEY);
    return data ? JSON.parse(data) : [];
  } catch(e) {
    return [];
  }
}

function saveLocalRanking(name, distance, level, form) {
  var rankings = getLocalRankings();
  var entry = {
    name: name,
    distance: Math.floor(distance),
    level: Math.floor(level),
    form: form,
    created_at: new Date().toISOString()
  };
  rankings.push(entry);
  rankings.sort(function(a, b) { return b.distance - a.distance; });
  if (rankings.length > MAX_RANKINGS) rankings = rankings.slice(0, MAX_RANKINGS);
  localStorage.setItem(RANKING_KEY, JSON.stringify(rankings));
  return rankings;
}

// Supabase ??궧 ?⑥닔??(鍮꾨룞湲?
async function getRankingsFromDB() {
  var sb = getSupabase();
  if (!sb) return getLocalRankings();
  
  try {
    var { data, error } = await sb
      .from('rankings')
      .select('name, distance, level, form, created_at')
      .order('distance', { ascending: false })
      .limit(MAX_RANKINGS);
    
    if (error) throw error;
    return data || [];
  } catch(e) {
    console.warn('Supabase 조회 실패, localStorage 대체:', e.message);
    return getLocalRankings();
  }
}

async function saveRankingToDB(name, distance, level, form) {
  var entry = {
    name: name,
    distance: Math.floor(distance),
    level: Math.floor(level),
    form: form
  };
  
  var sb = getSupabase();
  if (!sb) {
    // Supabase ?ъ슜 遺덇? ??localStorage ?대갚
    var rankings = saveLocalRanking(name, entry.distance, entry.level, form);
    currentPlayerRankIndex = -1;
    for (var i = 0; i < rankings.length; i++) {
      if (rankings[i].name === name && rankings[i].distance === entry.distance) {
        currentPlayerRankIndex = i;
        break;
      }
    }
    return rankings;
  }
  
  try {
    // 1) Supabase????湲곕줉 ?쎌엯
    var { error: insertError } = await sb
      .from('rankings')
      .insert(entry);
    
    if (insertError) throw insertError;
    
    //
    var rankings = await getRankingsFromDB();
    
    //
    currentPlayerRankIndex = -1;
    for (var i = 0; i < rankings.length; i++) {
      if (rankings[i].name === name && rankings[i].distance === entry.distance) {
        currentPlayerRankIndex = i;
        break;
      }
    }
    
    return rankings;
  } catch(e) {
    console.warn('Supabase ????ㅽ뙣, localStorage ?대갚:', e.message);
    var localRankings = saveLocalRanking(name, entry.distance, entry.level, form);
    currentPlayerRankIndex = -1;
    for (var i = 0; i < localRankings.length; i++) {
      if (localRankings[i].name === name && localRankings[i].distance === entry.distance) {
        currentPlayerRankIndex = i;
        break;
      }
    }
    return localRankings;
  }
}

function renderRankingBoard(rankings) {
  var tbody = document.getElementById('rankingBody');
  tbody.innerHTML = '';
  
  if (!rankings || rankings.length === 0) {
    var tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="5" style="color:rgba(255,255,255,0.3); padding:20px;">기록이 없습니다</td>';
    tbody.appendChild(tr);
    return;
  }
  
  var medals = ['🥇', '🥈', '🥉'];
  for (var i = 0; i < rankings.length; i++) {
    var r = rankings[i];
    var tr = document.createElement('tr');
    if (i === currentPlayerRankIndex) tr.className = 'rank-highlight';
    
    var rankDisplay = i < 3 ? '<span class="rank-medal">' + medals[i] + '</span>' : (i + 1);
    tr.innerHTML = '<td>' + rankDisplay + '</td>' +
                   '<td>' + escapeHtml(r.name) + '</td>' +
                   '<td>' + r.distance.toLocaleString() + '</td>' +
                   '<td>' + r.level + '</td>' +
                   '<td>' + r.form + '</td>';
    tbody.appendChild(tr);
  }
}

function escapeHtml(text) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

function animateCoinCount(el, from, to, duration) {
  var startTime = null;
  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    var progress = Math.min((timestamp - startTime) / duration, 1);
    // ease-out ?④낵
    var eased = 1 - Math.pow(1 - progress, 3);
    var current = Math.floor(from + (to - from) * eased);
    el.textContent = current;
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = to;
    }
  }
  el.textContent = from;
  requestAnimationFrame(step);
}

async function showRankingFromGameOver() {
  var scoreSection = document.getElementById('gameOverScore');
  var rankSection = document.getElementById('rankingBoard');
  if (scoreSection) scoreSection.style.display = 'none';
  if (rankSection) {
    rankSection.style.display = 'block';
    try {
      var rankings = await getRankingsFromDB();
      renderRankingBoard(rankings);
    } catch(e) {
      // Supabase ?ㅽ뙣 ??濡쒖뺄 ??궧
      var local = JSON.parse(localStorage.getItem('flyDarwinRankings') || '[]');
      renderRankingBoard(local);
    }
  }
}

// ===== CONTINUE SYSTEM =====

function showContinuePrompt() {
  var overlay = document.getElementById('continueOverlay');
  var costEl = document.getElementById('continueCost');
  var balanceEl = document.getElementById('continueBalance');
  var remainingEl = document.getElementById('continueRemaining');
  var noCoinsEl = document.getElementById('continueNoCoins');
  var continueBtn = document.getElementById('continueBtn');

  var remaining = game.maxContinues - game.continueCount;

  if (remaining <= 0) {
    //
    showGameOver();
    game.status = "waitingReplay";
    return;
  }

  var cost = game.continueCosts[game.continueCount];
  costEl.textContent = cost;
  balanceEl.textContent = game.coins;
  remainingEl.textContent = '남은 기회: ' + remaining + '회';

  if (game.coins < cost) {
    continueBtn.disabled = true;
    noCoinsEl.style.display = 'block';
  } else {
    continueBtn.disabled = false;
    noCoinsEl.style.display = 'none';
  }

  overlay.style.display = 'flex';
}

function hideContinuePrompt() {
  document.getElementById('continueOverlay').style.display = 'none';
}

function continueGame() {
  var cost = game.continueCosts[game.continueCount];
  if (game.coins < cost) return;

  // 肄붿씤 李④컧
  game.coins -= cost;
  localStorage.setItem('totalCoins', game.coins);
  document.getElementById('coinsValue').textContent = game.coins;

  //
  game.continueCount++;

  //
  game.hearts = 3;
  updateHearts();

  //
  for (var i = ennemiesHolder.ennemiesInUse.length - 1; i >= 0; i--) {
    var e = ennemiesHolder.ennemiesInUse[i];
    ennemiesHolder.mesh.remove(e.mesh);
  }
  ennemiesHolder.ennemiesInUse = [];

  //
  for (var j = flyingAsteroids.length - 1; j >= 0; j--) {
    scene.remove(flyingAsteroids[j].mesh);
  }
  flyingAsteroids = [];

  //
  game.blackHoleSlowFactor = 1.0;
  game.blackHoleActive = false;

  //
  var oldForm = game.currentForm;
  var oldPos = airplane.mesh.position.clone();
  scene.remove(airplane.mesh);

  //
  if (shopState && shopState.selectedVehicle) {
    airplane = createNewCharacter(shopState.selectedVehicle);
  } else {
    airplane = createNewCharacter(oldForm);
  }
  airplane.mesh.scale.set(.25,.25,.25);
  airplane.mesh.position.y = game.planeDefaultHeight;
  airplane.mesh.rotation.z = 0;
  airplane.mesh.rotation.x = 0;
  scene.add(airplane.mesh);

  game.planeCollisionSpeedX = 0;
  game.planeCollisionSpeedY = 0;
  game.planeCollisionDisplacementX = 0;
  game.planeCollisionDisplacementY = 0;

  //
  game.planeFallSpeed = 0.001;

  //
  hideContinuePrompt();

  //
  activateInvincible();

  //
  game.status = "playing";
  oldTime = new Date().getTime();
}

function stopAndShowGameOver() {
  hideContinuePrompt();
  //
  showGameOver();
  game.status = "waitingReplay";
}

function showGameOver() {
  var overlay = document.getElementById('gameOverOverlay');
  var scoreSection = document.getElementById('gameOverScore');
  var rankSection = document.getElementById('rankingBoard');
  
  // Fill final stats
  document.getElementById('finalDistance').textContent = Math.floor(game.distance).toLocaleString() + 'm';
  document.getElementById('finalLevel').textContent = Math.floor(game.level);
  document.getElementById('finalForm').textContent = game.currentForm;
  
  //
  var finalCoinsEl = document.getElementById('finalCoins');
  if (finalCoinsEl) {
    var startCoins = game.coins - game.coinsEarnedThisRound;
    animateCoinCount(finalCoinsEl, startCoins, game.coins, 1200);
  }
  
  // Reset UI state
  document.getElementById('playerNameInput').value = '';
  scoreSection.style.display = 'block';
  rankSection.style.display = 'none';
  
  // Show overlay
  overlay.style.display = 'flex';
  
  // Focus the input
  setTimeout(function() {
    document.getElementById('playerNameInput').focus();
  }, 600);
}

function hideGameOver() {
  document.getElementById('gameOverOverlay').style.display = 'none';
}

async function submitScore() {
  var nameInput = document.getElementById('playerNameInput');
  var submitBtn = document.getElementById('submitScoreBtn');
  var name = nameInput.value.trim();
  if (!name) {
    nameInput.style.borderColor = '#f25346';
    nameInput.style.boxShadow = '0 0 16px rgba(242, 83, 70, 0.3)';
    nameInput.placeholder = '닉네임을 입력해주세요!';
    nameInput.focus();
    return;
  }
  
  //
  submitBtn.disabled = true;
  submitBtn.textContent = '등록 중...';
  
  try {
    var rankings = await saveRankingToDB(name, game.distance, game.level, game.currentForm);
    
    // Switch to ranking board
    document.getElementById('gameOverScore').style.display = 'none';
    document.getElementById('rankingBoard').style.display = 'block';
    
    document.querySelector('#rankingBoard .gameover-title').textContent = '🏆 랭킹';
    renderRankingBoard(rankings);
  } catch(e) {
    console.error('점수 등록 오류:', e);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '등록';
  }
}

function startReplay() {
  hideGameOver();
  resetGame();
  game.status = "waiting";

  //
  if (ennemiesHolder && ennemiesHolder.ennemiesInUse) {
    for (var i = ennemiesHolder.ennemiesInUse.length - 1; i >= 0; i--) {
      ennemiesHolder.mesh.remove(ennemiesHolder.ennemiesInUse[i].mesh);
    }
    ennemiesHolder.ennemiesInUse = [];
  }

  //
  if (typeof flyingAsteroids !== 'undefined') {
    for (var j = flyingAsteroids.length - 1; j >= 0; j--) {
      scene.remove(flyingAsteroids[j].mesh);
    }
    flyingAsteroids = [];
  }

  //
  if (coinsHolder && coinsHolder.coinsInUse) {
    for (var k = coinsHolder.coinsInUse.length - 1; k >= 0; k--) {
      coinsHolder.mesh.remove(coinsHolder.coinsInUse[k].mesh);
      coinsHolder.coinsPool.push(coinsHolder.coinsInUse[k]);
    }
    coinsHolder.coinsInUse = [];
  }

  //
  if (game.invincible) deactivateInvincible();

  //
  if (typeof cleanupProjectiles === 'function') cleanupProjectiles();
  if (typeof cleanupDestroyParticles === 'function') cleanupDestroyParticles();

  //
  if (typeof cleanupBoss === 'function') cleanupBoss();
  if (typeof bossState !== 'undefined') { bossState.triggered = []; bossState.pendingBoss = null; }

  // Reset plane to initial form
  scene.remove(airplane.mesh);
  shopState = loadShopData();
  if (shopState.selectedVehicle) {
    airplane = createNewCharacter(shopState.selectedVehicle);
    game.currentForm = shopState.selectedVehicle;
  } else {
    airplane = new Amoeba();
    game.currentForm = "Amoeba";
  }
  airplane.mesh.scale.set(.25,.25,.25);
  airplane.mesh.position.y = game.planeDefaultHeight;
  scene.add(airplane.mesh);

  //
  var overlay = document.getElementById('startOverlay');
  overlay.style.display = '';
  overlay.classList.remove('hidden');
  // BGM ?뺤?
  stopBGM();
}

function initRankingUI() {
  // Submit score button
  document.getElementById('submitScoreBtn').addEventListener('click', function(e) {
    e.stopPropagation();
    submitScore();
  });
  
  // Enter key to submit
  document.getElementById('playerNameInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitScore();
    }
    // Reset error styling on type
    this.style.borderColor = '';
    this.style.boxShadow = '';
  });
  
  // Skip ranking button
  document.getElementById('skipRankBtn').addEventListener('click', function(e) {
    e.stopPropagation();
    startReplay();
  });
  
  // Replay from ranking button
  document.getElementById('replayFromRankBtn').addEventListener('click', function(e) {
    e.stopPropagation();
    startReplay();
  });
  
  // Prevent clicks on overlay from propagating
  document.getElementById('gameOverOverlay').addEventListener('mouseup', function(e) {
    e.stopPropagation();
  });
  document.getElementById('gameOverOverlay').addEventListener('touchend', function(e) {
    e.stopPropagation();
  });

  // Continue button
  document.getElementById('continueBtn').addEventListener('click', function(e) {
    e.stopPropagation();
    continueGame();
  });

  // Stop button (go to game over)
  document.getElementById('continueStopBtn').addEventListener('click', function(e) {
    e.stopPropagation();
    stopAndShowGameOver();
  });

  // Prevent clicks on continue overlay from propagating
  document.getElementById('continueOverlay').addEventListener('mouseup', function(e) {
    e.stopPropagation();
  });
  document.getElementById('continueOverlay').addEventListener('touchend', function(e) {
    e.stopPropagation();
  });
}

function normalize(v,vmin,vmax,tmin, tmax){
  var nv = Math.max(Math.min(v,vmax), vmin);
  var dv = vmax-vmin;
  var pc = (nv-vmin)/dv;
  var dt = tmax-tmin;
  var tv = tmin + (pc*dt);
  return tv;
}

var fieldDistance, replayMessage, fieldLevel, levelCircle;

// BGM
var bgm = null;
var bgmStarted = false;
function initBGM() {
  bgm = new Audio('music/Suvaco do Cristo.mp3');
  bgm.loop = true;
  bgm.volume = isMobile ? 0.01 : 0.025;
  bgm.load();
  // BGM? startGame()?먯꽌留??ъ깮?????곸젏?먯꽌???ъ깮?섏? ?딆쓬
}

function startBGMPlayback() {
  if (!bgm) return;
  if (bgm.paused) {
    bgm.play().catch(function(){});
  }
  // AudioContext 珥덇린??(Safari ?④낵?????
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function stopBGM() {
  if (bgm && !bgm.paused) {
    bgm.pause();
    bgm.currentTime = 0;
  }
}

function init(event){

  // UI

  fieldDistance = document.getElementById("distValue");
  replayMessage = document.getElementById("replayMessage");
  fieldLevel = document.getElementById("levelValue");
  levelCircle = document.getElementById("levelCircleStroke");

  resetGame();
  createScene();

  createLights();
  createPlane();
  createSea();
  createSky();
  createCoins();
  createEnnemies();
  createParticles();
  createInvincibleFruits();
  createHeartItems();

  document.addEventListener('mousemove', handleMouseMove, false);
  document.addEventListener('mousedown', handleMouseDown, false);
  document.addEventListener('touchstart', handleTouchStart, { passive: false });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('mouseup', handleMouseUp, false);
  document.addEventListener('touchend', handleTouchEnd, false);
  document.addEventListener('keydown', handleKeyDown, false);

  initRankingUI();
  initBGM();
  initPauseUI();
  initShopUI();
  initAbilitySystem();
  initAbilitySounds();
  initStartScreen();
  initAuth();
  loop();
}

window.addEventListener('load', init, false);

function initStartScreen() {
  var overlay = document.getElementById('startOverlay');
  var playBtn = document.getElementById('playBtn');
  if (!playBtn || !overlay) return;

  function startGame() {
    if (game.status !== 'waiting') return;
    //
    shopState = loadShopData();
    resetGame();
    // resetGame이 currentForm을 Amoeba로 리셋하므로 선택 비행체로 복원
    if (shopState.selectedVehicle) {
      game.currentForm = shopState.selectedVehicle;
    }
    setupAbilityForVehicle();
    // 스페이스셔틀/UFO: 시작 거리 설정
    var startDist = 0;
    if (shopState.selectedVehicle === 'SpaceShuttle') startDist = 3000;
    if (shopState.selectedVehicle === 'UFO') startDist = 5000;
    if (startDist > 0) {
      game.distance = startDist;
      // 모든 스폰 타이머를 시작 거리로 맞춤 (과거 이벤트 스킵)
      game.coinLastSpawn = startDist;
      game.ennemyLastSpawn = startDist;
      game.invincibleFruitLastSpawn = startDist;
      game.heartItemLastSpawn = startDist;
      game.speedLastUpdate = startDist;
      game.flyingAsteroidLastSpawn = startDist;
      game.level = Math.floor(startDist / game.distanceForLevelUpdate) + 1;
      game.targetBaseSpeed = game.initSpeed + game.incrementSpeedByLevel * game.level;
      game.baseSpeed = game.targetBaseSpeed;
      // 보스/난기류 트리거 스킵
      if (typeof bossState !== 'undefined' && typeof bossConfigs !== 'undefined') {
        for (var bi = 0; bi < bossConfigs.length; bi++) {
          if (bossConfigs[bi].distance <= startDist) bossState.triggered.push(bossConfigs[bi].distance);
        }
      }
      game.turbulenceTriggered = [];
      var turbDists = typeof getTurbulenceTriggerDistances === 'function' ? getTurbulenceTriggerDistances() : [3000,5500,9000,13000,17000,21000];
      for (var td = 0; td < turbDists.length; td++) {
        if (turbDists[td] <= startDist) game.turbulenceTriggered.push(turbDists[td]);
      }
      fieldLevel.innerHTML = Math.floor(game.level);
      fieldDistance.innerHTML = Math.floor(game.distance);
    }
    game.status = 'playing';
    overlay.classList.add('hidden');
    oldTime = new Date().getTime();
    // BGM ?쒖옉 (PLAY 踰꾪듉?먯꽌留?
    startBGMPlayback();
    setTimeout(function() {
      if (overlay.parentNode) overlay.style.display = 'none';
    }, 700);
  }

  playBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    startGame();
  });
  playBtn.addEventListener('touchend', function(e) {
    e.preventDefault();
    e.stopPropagation();
    startGame();
  });
}

function handleKeyDown(event) {
  if (event.key === 'Escape' || event.key === 'p' || event.key === 'P') {
    if (game.status === "playing") {
      togglePause();
    }
  }
}

function togglePause() {
  paused = !paused;
  var overlay = document.getElementById('pauseOverlay');
  if (paused) {
    overlay.style.display = 'flex';
    if (bgm && !bgm.paused) bgm.pause();
  } else {
    overlay.style.display = 'none';
    oldTime = new Date().getTime();
    if (bgm) bgm.play().catch(function(){});
  }
}

function initPauseUI() {
  var pauseBtn = document.getElementById('mobilePauseBtn');
  var pauseOverlay = document.getElementById('pauseOverlay');

  function handlePauseBtnPress(e) {
    e.preventDefault();
    e.stopPropagation();
    if (typeof togglePause === 'function' && game && game.status === 'playing') {
      togglePause();
    }
  }

  function handleOverlayPress(e) {
    e.preventDefault();
    e.stopPropagation();
    if (typeof togglePause === 'function') {
      togglePause();
    }
  }

  //
  pauseBtn.addEventListener('touchend', handlePauseBtnPress);
  pauseBtn.addEventListener('click', handlePauseBtnPress);
  pauseOverlay.addEventListener('touchend', handleOverlayPress);
  pauseOverlay.addEventListener('click', handleOverlayPress);
}

// ===== SHOP SYSTEM =====

var shopVehicleData = [
  { id: "Newton's Apple", name: "뉴턴의 사과", price: 1500, ability: "최대 하트 7개로 시작", unlockForm: "Anomalocaris" },
  { id: "Einstein", name: "아인슈타인", price: 2500, ability: "⚡ 슬로우 모션 3회 | 🛡️ 피격 시 50% 확률로 코인 10개 소실로 대체", unlockForm: "Dunkleosteus" },
  { id: "Wright Flyer", name: "라이트 형제", price: 3000, ability: "⚡ 무적 2회 | 🛡️ 피격 후 무적시간 7배", unlockForm: "Tiktaalik" },
  { id: "Jetliner", name: "여객기", price: 4000, ability: "코인 X3 획득", unlockForm: "Plesiosaur" },
  { id: "Rocket", name: "로켓", price: 5000, ability: "⚡ 미사일 100발 | 🛡️ 장애물 파괴 시 코인 10개 드롭", unlockForm: "Quetzalcoatlus" },
  { id: "SpaceShuttle", name: "스페이스 셔틀", price: 8000, ability: "⚡ 3000m에서 시작 + 500m 무적부스터 2회", unlockForm: "Darwin's Finch" },
  { id: "UFO", name: "UFO", price: 10000, ability: "⚡ 5000m에서 시작 + 1000m 무적부스터 2회 + 레이저 200발", unlockForm: "Darwin's Finch" }
];

var shopUpgradeData = [
  { id: "extraHeart1", name: "하트 +1", icon: "❤️", desc: "시작 하트 3에서 4로", price: 300 },
  { id: "extraHeart2", name: "하트 +2", icon: "💞", desc: "시작 하트 4에서 5로", price: 800, requires: "extraHeart1" }
];

var evoVehicleData = [
  { id: "Amoeba", name: "아메바", levelReq: 1, passive: "" },
  { id: "Anomalocaris", name: "아노말로카리스", levelReq: 2, passive: "🛡️ 피격 시 30% 확률 데미지 무시" },
  { id: "Dunkleosteus", name: "둔클레오스테우스", levelReq: 3, passive: "🦅 조작 민감도 +30%" },
  { id: "Tiktaalik", name: "틱타알릭", levelReq: 4, passive: "❤️ 하트 아이템 출현빈도 1.5배" },
  { id: "Plesiosaur", name: "플레시오사우루스", levelReq: 5, passive: "🌊 장애물 스폰 간격 +30%" },
  { id: "Quetzalcoatlus", name: "케찰코아틀루스", levelReq: 6, passive: "🪙 코인 획득량 +50%" },
  { id: "Darwin's Finch", name: "다윈의 핀치", levelReq: 7, passive: "✨ 20초마다 하트 회복 + 무적 2배" }
];

// Shop save/load
function loadShopData() {
  var defaults = {
    unlockedVehicles: [],
    selectedVehicle: null,
    purchasedUpgrades: [],
    darwinFinchReached: false,
    unlockedEvoForms: ["Amoeba"],
    maxEvoLevel: 1,
    autoEvolve: true
  };
  var saved = localStorage.getItem('flyDarwinShop');
  if (saved) {
    try {
      var parsed = JSON.parse(saved);
      return {
        unlockedVehicles: parsed.unlockedVehicles || defaults.unlockedVehicles,
        selectedVehicle: parsed.selectedVehicle !== undefined ? parsed.selectedVehicle : defaults.selectedVehicle,
        purchasedUpgrades: parsed.purchasedUpgrades || defaults.purchasedUpgrades,
        darwinFinchReached: parsed.darwinFinchReached || defaults.darwinFinchReached,
        unlockedEvoForms: parsed.unlockedEvoForms || defaults.unlockedEvoForms,
        maxEvoLevel: parsed.maxEvoLevel || defaults.maxEvoLevel,
        autoEvolve: parsed.autoEvolve !== undefined ? parsed.autoEvolve : defaults.autoEvolve
      };
    } catch(e) {
      return defaults;
    }
  }
  return defaults;
}

function saveShopData(data) {
  localStorage.setItem('flyDarwinShop', JSON.stringify(data));
  // 로그인 상태면 클라우드에도 저장
  if (currentUser) saveCloudData();
}

var shopState = loadShopData();

// Shop 3D preview system
var shopPreviews = [];
var shopAnimationId = null;

function makePreviewSilhouette(preview) {
  if (!preview || !preview.model || !preview.model.mesh) return;
  var whiteMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
  preview.model.mesh.traverse(function(child) {
    if (child.isMesh || (child instanceof THREE.Mesh)) {
      child.material = whiteMat;
    }
  });
}

function createShopPreview(containerId, formName) {
  var container = document.getElementById(containerId);
  if (!container) return null;

  var w = container.clientWidth || 300;
  var h = container.clientHeight || 120;

  var previewRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  previewRenderer.setSize(w, h);
  previewRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(previewRenderer.domElement);

  var previewScene = new THREE.Scene();
  var previewCamera = new THREE.PerspectiveCamera(50, w / h, 1, 1000);
  previewCamera.position.set(0, 10, 100);
  previewCamera.lookAt(new THREE.Vector3(0, 0, 0));

  // Lights
  var ambLight = new THREE.AmbientLight(0xB0D0E8, 0.8);
  previewScene.add(ambLight);
  var dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
  dirLight.position.set(50, 80, 50);
  previewScene.add(dirLight);
  var hemiLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.5);
  previewScene.add(hemiLight);

  // Create model
  var model = createNewCharacter(formName);
  model.mesh.scale.set(0.55, 0.55, 0.55);
  model.mesh.position.set(0, 0, 0);
  model.mesh.rotation.set(0, 0, 0);
  previewScene.add(model.mesh);

  return {
    renderer: previewRenderer,
    scene: previewScene,
    camera: previewCamera,
    model: model,
    container: container
  };
}

function animateShopPreviews() {
  shopAnimationId = requestAnimationFrame(animateShopPreviews);
  for (var i = 0; i < shopPreviews.length; i++) {
    var p = shopPreviews[i];
    if (p && p.model && p.model.mesh) {
      p.model.mesh.rotation.y += 0.015;
      if (p.model.propeller) p.model.propeller.rotation.x += 0.1;
      if (p.model.updateWings) p.model.updateWings();
      p.renderer.render(p.scene, p.camera);
    }
  }
}

function cleanupShopPreviews() {
  if (shopAnimationId) {
    cancelAnimationFrame(shopAnimationId);
    shopAnimationId = null;
  }
  for (var i = 0; i < shopPreviews.length; i++) {
    if (shopPreviews[i]) {
      shopPreviews[i].renderer.dispose();
      if (shopPreviews[i].container) {
        shopPreviews[i].container.innerHTML = '';
      }
    }
  }
  shopPreviews = [];
}

// Render shop tabs
function renderShopVehicles() {
  var list = document.getElementById('vehiclesList');
  list.innerHTML = '';
  var coins = parseInt(localStorage.getItem('totalCoins') || '0');

  for (var i = 0; i < shopVehicleData.length; i++) {
    var v = shopVehicleData[i];
    var isUnlocked = v.unlockForm ? (shopState.unlockedEvoForms.indexOf(v.unlockForm) !== -1) : shopState.darwinFinchReached;
    var isPurchased = shopState.unlockedVehicles.indexOf(v.id) !== -1;
    var isSelected = shopState.selectedVehicle === v.id;

    var card = document.createElement('div');
    card.className = 'vehicle-card' + (isSelected ? ' selected' : '') + (!isUnlocked ? ' locked' : '');

    var previewId = 'vehiclePreview_' + i;
    var previewHTML = '<div class="vehicle-preview" id="' + previewId + '">';
    if (!isUnlocked) {
      previewHTML += '<div class="vehicle-lock-overlay"><span style="font-size:56px;display:inline-block;animation:spinQuestion 3s linear infinite;">❓</span></div>';
    }
    previewHTML += '</div>';

    card.innerHTML = previewHTML +
      '<p class="vehicle-name">' + (isUnlocked ? v.name : '???') + '</p>' +
      '<p class="vehicle-ability">' + (isUnlocked ? v.ability : '해금 후 확인 가능') + '</p>';

    // Button
    var btn = document.createElement('button');
    btn.className = 'vehicle-btn';
    if (!isUnlocked) {
      btn.className += ' vehicle-btn--locked';
      btn.textContent = '🔒 ' + (v.unlockForm || '다윈의 핀치') + '까지 진화 후 해금';
      btn.disabled = true;
    } else if (isPurchased && isSelected) {
      btn.className += ' vehicle-btn--selected';
      btn.textContent = '✅ 선택됨';
    } else if (isPurchased) {
      btn.className += ' vehicle-btn--select';
      btn.textContent = '선택하기';
      (function(vid) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          selectVehicle(vid);
        });
      })(v.id);
    } else {
      btn.className += ' vehicle-btn--buy';
      btn.textContent = v.price + ' 코인 구매';
      if (coins < v.price) btn.disabled = true;
      (function(vid, vprice) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          purchaseVehicle(vid, vprice);
        });
      })(v.id, v.price);
    }

    card.appendChild(btn);
    list.appendChild(card);
  }

  // Create 3D previews after DOM is ready
  setTimeout(function() {
    for (var i = 0; i < shopVehicleData.length; i++) {
      var preview = createShopPreview('vehiclePreview_' + i, shopVehicleData[i].id);
      if (preview) {
        var sv = shopVehicleData[i];
        var unlocked = sv.unlockForm ? (shopState.unlockedEvoForms.indexOf(sv.unlockForm) !== -1) : shopState.darwinFinchReached;
        if (!unlocked) makePreviewSilhouette(preview);
        shopPreviews.push(preview);
      }
    }
    if (shopPreviews.length > 0 && !shopAnimationId) {
      animateShopPreviews();
    }
  }, 50);
}

function renderShopUpgrades() {
  var list = document.getElementById('upgradesList');
  list.innerHTML = '';
  var coins = parseInt(localStorage.getItem('totalCoins') || '0');

  for (var i = 0; i < shopUpgradeData.length; i++) {
    var u = shopUpgradeData[i];
    var isPurchased = shopState.purchasedUpgrades.indexOf(u.id) !== -1;
    var requiresMet = !u.requires || shopState.purchasedUpgrades.indexOf(u.requires) !== -1;

    var card = document.createElement('div');
    card.className = 'upgrade-card' + (isPurchased ? ' purchased' : '');

    var iconDiv = '<div class="upgrade-icon">' + u.icon + '</div>';
    var infoDiv = '<div class="upgrade-info"><p class="upgrade-name">' + u.name + '</p><p class="upgrade-desc">' + u.desc + '</p></div>';

    card.innerHTML = iconDiv + infoDiv;

    var btn = document.createElement('button');
    btn.className = 'upgrade-btn';
    if (isPurchased) {
      btn.className += ' upgrade-btn--done';
      btn.textContent = '이미 보유';
    } else {
      btn.className += ' upgrade-btn--buy';
      btn.textContent = u.price + ' 코인';
      if (coins < u.price || !requiresMet) btn.disabled = true;
      (function(uid, uprice) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          purchaseUpgrade(uid, uprice);
        });
      })(u.id, u.price);
    }

    card.appendChild(btn);
    list.appendChild(card);
  }
}

// Evolution vehicles rendering
function renderEvoVehicles() {
  var list = document.getElementById('evoVehiclesList');
  list.innerHTML = '';

  for (var i = 0; i < evoVehicleData.length; i++) {
    var v = evoVehicleData[i];
    var isUnlocked = shopState.unlockedEvoForms.indexOf(v.id) !== -1;
    var isSelected = shopState.selectedVehicle === v.id;
    var isDefault = !shopState.selectedVehicle && v.id === 'Amoeba';

    var card = document.createElement('div');
    card.className = 'vehicle-card' + ((isSelected || isDefault) ? ' selected' : '') + (!isUnlocked ? ' locked' : '');

    var previewId = 'evoPreview_' + i;
    var previewHTML = '<div class="vehicle-preview" id="' + previewId + '">';
    if (!isUnlocked) {
      previewHTML += '<div class="vehicle-lock-overlay"><span style="font-size:56px;display:inline-block;animation:spinQuestion 3s linear infinite;">❓</span></div>';
    }
    previewHTML += '</div>';

    var passiveText = (isUnlocked && v.passive) ? '<p class="vehicle-ability" style="color:#FFD700;margin-top:4px;">' + v.passive + '</p>' : '';
    card.innerHTML = previewHTML +
      '<p class="vehicle-name">' + (isUnlocked ? v.name : '???') + '</p>' +
      '<p class="vehicle-ability">' + (isUnlocked ? '진화 레벨 ' + v.levelReq + ' 도달 시 해금' : '해금 후 확인 가능') + '</p>' +
      passiveText;

    var btn = document.createElement('button');
    btn.className = 'vehicle-btn';
    if (!isUnlocked) {
      btn.className += ' vehicle-btn--locked';
      btn.textContent = '🔒 미해금';
      btn.disabled = true;
    } else if (isSelected || isDefault) {
      btn.className += ' vehicle-btn--selected';
      btn.textContent = '✅ 선택됨';
    } else {
      btn.className += ' vehicle-btn--select';
      btn.textContent = '선택하기';
      (function(vid) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          selectVehicle(vid);
        });
      })(v.id);
    }

    card.appendChild(btn);
    list.appendChild(card);
  }

  // 3D previews
  setTimeout(function() {
    for (var i = 0; i < evoVehicleData.length; i++) {
      var preview = createShopPreview('evoPreview_' + i, evoVehicleData[i].id);
      if (preview) {
        if (shopState.unlockedEvoForms.indexOf(evoVehicleData[i].id) === -1) makePreviewSilhouette(preview);
        shopPreviews.push(preview);
      }
    }
    if (shopPreviews.length > 0 && !shopAnimationId) {
      animateShopPreviews();
    }
  }, 50);
}

function purchaseVehicle(vehicleId, price) {
  var coins = parseInt(localStorage.getItem('totalCoins') || '0');
  if (coins < price) return;

  coins -= price;
  localStorage.setItem('totalCoins', coins);

  shopState.unlockedVehicles.push(vehicleId);
  shopState.selectedVehicle = vehicleId;
  saveShopData(shopState);

  refreshShop();
}

function selectVehicle(vehicleId) {
  shopState.selectedVehicle = vehicleId;
  saveShopData(shopState);
  refreshShop();
}

function purchaseUpgrade(upgradeId, price) {
  var coins = parseInt(localStorage.getItem('totalCoins') || '0');
  if (coins < price) return;

  coins -= price;
  localStorage.setItem('totalCoins', coins);

  shopState.purchasedUpgrades.push(upgradeId);
  saveShopData(shopState);

  refreshShop();
}

function refreshShop() {
  var coins = parseInt(localStorage.getItem('totalCoins') || '0');
  document.getElementById('shopCoinsDisplay').textContent = coins;
  cleanupShopPreviews();
  renderShopUpgrades();

  // Only render the currently active vehicle tab
  var evoTab = document.getElementById('shopEvoVehicles');
  var specialTab = document.getElementById('shopSpecialVehicles');
  if (evoTab && evoTab.classList.contains('active')) {
    renderEvoVehicles();
  } else if (specialTab && specialTab.classList.contains('active')) {
    renderShopVehicles();
  }
}

function isEvoVehicle(vehicleId) {
  for (var i = 0; i < evoVehicleData.length; i++) {
    if (evoVehicleData[i].id === vehicleId) return true;
  }
  return false;
}

function openShop() {
  shopState = loadShopData();
  var overlay = document.getElementById('shopOverlay');
  overlay.style.display = 'flex';
  renderAutoEvolveToggle();
  refreshShop();
}

function renderAutoEvolveToggle() {
  var existing = document.getElementById('autoEvolveToggle');
  if (existing) existing.remove();

  var container = document.getElementById('shopEvoVehicles');
  if (!container) return;

  var toggleContainer = document.createElement('div');
  toggleContainer.id = 'autoEvolveToggle';
  toggleContainer.style.cssText = 'display:flex;flex-direction:column;align-items:center;margin:8px auto 16px auto;background:rgba(0,0,0,0.3);padding:12px;border-radius:12px;width:90%;max-width:400px;box-shadow:inset 0 2px 4px rgba(0,0,0,0.5);';

  var toggle = document.createElement('div');
  toggle.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:10px;padding:8px 16px;cursor:pointer;user-select:none;background:rgba(255,255,255,0.1);border-radius:20px;width:fit-content;transition:background 0.3s;';
  
  var isOn = shopState.autoEvolve;
  toggle.innerHTML = '<span style="font-size:16px;">🔄</span>' +
    '<span style="color:white;font-size:14px;font-weight:bold;">자동 진화</span>' +
    '<div style="width:44px;height:24px;border-radius:12px;background:' + (isOn ? '#4CAF50' : '#666') + ';position:relative;transition:background 0.3s;">' +
    '<div style="width:20px;height:20px;border-radius:50%;background:white;position:absolute;top:2px;' + (isOn ? 'right:2px' : 'left:2px') + ';transition:all 0.3s;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div></div>';

  toggle.addEventListener('click', function(e) {
    e.stopPropagation();
    shopState.autoEvolve = !shopState.autoEvolve;
    saveShopData(shopState);
    renderAutoEvolveToggle();
  });

  var desc = document.createElement('div');
  desc.style.cssText = 'font-size:13px;color:#bbb;margin-top:10px;text-align:center;line-height:1.4;word-break:keep-all;';
  desc.textContent = '자동 진화를 끄면, 선택한 비행체로만 플레이가 가능합니다';

  toggleContainer.appendChild(toggle);
  toggleContainer.appendChild(desc);

  container.insertBefore(toggleContainer, container.firstChild);
}

function closeShop() {
  document.getElementById('shopOverlay').style.display = 'none';
  cleanupShopPreviews();

  //
  shopState = loadShopData();
  var desiredForm = shopState.selectedVehicle || "Amoeba";
  if (game.currentForm !== desiredForm) {
    if (airplane && airplane.mesh) {
      scene.remove(airplane.mesh);
    }
    airplane = createNewCharacter(desiredForm);
    airplane.mesh.scale.set(.25, .25, .25);
    airplane.mesh.position.y = game.planeDefaultHeight;
    game.currentForm = desiredForm;
    scene.add(airplane.mesh);
  }
}

function initShopUI() {
  // Shop button
  var shopBtn = document.getElementById('shopBtn');
  shopBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    openShop();
  });

  // Close button
  document.getElementById('shopCloseBtn').addEventListener('click', function(e) {
    e.stopPropagation();
    closeShop();
  });

  // Tab switching
  var tabs = document.querySelectorAll('.shop-tab');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', function(e) {
      e.stopPropagation();
      var tabName = this.getAttribute('data-tab');

      // Update active tab
      var allTabs = document.querySelectorAll('.shop-tab');
      for (var j = 0; j < allTabs.length; j++) {
        allTabs[j].classList.remove('active');
      }
      this.classList.add('active');

      // Show content
      var allContent = document.querySelectorAll('.shop-tab-content');
      for (var k = 0; k < allContent.length; k++) {
        allContent[k].classList.remove('active');
      }

      var contentId = 'shopUpgrades';
      if (tabName === 'evoVehicles') contentId = 'shopEvoVehicles';
      else if (tabName === 'specialVehicles') contentId = 'shopSpecialVehicles';
      document.getElementById(contentId).classList.add('active');
      renderAutoEvolveToggle();

      // Rebuild 3D previews when switching to vehicle tabs
      if (tabName === 'evoVehicles') {
        cleanupShopPreviews();
        renderEvoVehicles();
      } else if (tabName === 'specialVehicles') {
        cleanupShopPreviews();
        renderShopVehicles();
      }
    });
  }

  // Prevent overlay clicks
  document.getElementById('shopOverlay').addEventListener('mouseup', function(e) {
    if (e.target === this) closeShop();
  });
}

// Mark Darwin's Finch as reached when player transforms to it
function markDarwinFinchReached() {
  shopState.darwinFinchReached = true;
  // Unlock all evolution forms
  for (var i = 0; i < evoVehicleData.length; i++) {
    if (shopState.unlockedEvoForms.indexOf(evoVehicleData[i].id) === -1) {
      shopState.unlockedEvoForms.push(evoVehicleData[i].id);
    }
  }
  shopState.maxEvoLevel = 7;
  saveShopData(shopState);
}

// Unlock a specific evolution form
function unlockEvoForm(formId, level) {
  if (shopState.unlockedEvoForms.indexOf(formId) === -1) {
    shopState.unlockedEvoForms.push(formId);
  }
  if (level > shopState.maxEvoLevel) {
    shopState.maxEvoLevel = level;
  }
  saveShopData(shopState);
}

// Get starting hearts based on upgrades + vehicle
function getStartingHearts() {
  var hearts = 3;
  if (shopState.purchasedUpgrades.indexOf('extraHeart1') !== -1) hearts++;
  if (shopState.purchasedUpgrades.indexOf('extraHeart2') !== -1) hearts++;
  //
  if (shopState.selectedVehicle === "Newton's Apple") hearts = 7;
  return hearts;
}

// Get max hearts based on vehicle
function getStartingMaxHearts() {
  //
  if (shopState && shopState.selectedVehicle === "Newton's Apple") return 7;
  return 5;
}

// Get continue costs (with discount if purchased)
function getContinueCosts() {
  var costs = [50, 200, 300];
  if (shopState.purchasedUpgrades.indexOf('continueDiscount') !== -1) {
    costs = [35, 140, 210];
  }
  return costs;
}

// ===== ACTIVE ABILITY SYSTEM =====

var abilityState = {
  type: null,       // 'slowmo', 'invincible', 'missile', 'booster', 'ufo'
  uses: 0,
  maxUses: 0,
  active: false,
  cooldown: false,
  cooldownTimer: 0,
  // Slow motion
  slowmoActive: false,
  slowmoTimer: 0,
  slowmoDuration: 5000,
  // Booster
  boosterActive: false,
  boosterDistStart: 0,
  boosterDistTarget: 0,
  // Missiles/Lasers
  projectiles: [],
  // UFO secondary (laser)
  ufoLaserUses: 0
};

var abilityConfigs = {
  'Einstein': { type: 'slowmo', icon: '⏳', uses: 3, cooldownMs: 1000 },
  'Wright Flyer': { type: 'invincible', icon: '🛡️', uses: 2, cooldownMs: 1000 },
  'Rocket': { type: 'missile', icon: '🚀', uses: 100, cooldownMs: 100 },
  'SpaceShuttle': { type: 'booster', icon: '🔥', uses: 2, cooldownMs: 2000 },
  'UFO': { type: 'ufo', icon: '🛸', uses: 2, cooldownMs: 100 }
};

function initAbilitySystem() {
  var btn = document.getElementById('abilityBtn');
  if (!btn) return;

  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    e.preventDefault();
    activateAbility();
  });
  btn.addEventListener('touchend', function(e) {
    e.stopPropagation();
    e.preventDefault();
    activateAbility();
  });

  // UFO ???踰꾪듉 ?대깽??
  var laserBtn = document.getElementById('ufoLaserBtn');
  var boosterBtn = document.getElementById('ufoBoosterBtn');
  if (laserBtn) {
    laserBtn.addEventListener('click', function(e) {
      e.stopPropagation(); e.preventDefault();
      activateAbility();
    });
    laserBtn.addEventListener('touchend', function(e) {
      e.stopPropagation(); e.preventDefault();
      activateAbility();
    });
  }
  if (boosterBtn) {
    boosterBtn.addEventListener('click', function(e) {
      e.stopPropagation(); e.preventDefault();
      activateUfoBooster();
    });
    boosterBtn.addEventListener('touchend', function(e) {
      e.stopPropagation(); e.preventDefault();
      activateUfoBooster();
    });
  }

  //
  var bossFireBtn = document.getElementById('bossFireBtn');
  if (bossFireBtn) {
    var bossFireInterval = null;
    bossFireBtn.addEventListener('touchstart', function(e) {
      e.stopPropagation(); e.preventDefault();
      if (typeof bossState !== 'undefined' && bossState.active) {
        fireBossMissile();
        clearInterval(bossFireInterval);
        bossFireInterval = setInterval(function() {
          if (!bossState.active) { clearInterval(bossFireInterval); return; }
          fireBossMissile();
        }, 150);
      }
    });
    bossFireBtn.addEventListener('touchend', function(e) {
      e.stopPropagation(); e.preventDefault();
      clearInterval(bossFireInterval);
    });
    bossFireBtn.addEventListener('click', function(e) {
      e.stopPropagation(); e.preventDefault();
      if (typeof bossState !== 'undefined' && bossState.active) {
        fireBossMissile();
      }
    });
  }
}

function setupAbilityForVehicle() {
  var vehicle = shopState ? shopState.selectedVehicle : null;
  var config = vehicle ? abilityConfigs[vehicle] : null;
  var ui = document.getElementById('abilityUI');
  var ufoDualUI = document.getElementById('ufoDualUI');

  if (!config) {
    if (ui) ui.style.display = 'none';
    if (ufoDualUI) ufoDualUI.style.display = 'none';
    abilityState.type = null;
    abilityState.uses = 0;
    return;
  }

  abilityState.type = config.type;
  abilityState.uses = config.uses;
  abilityState.maxUses = config.uses;
  abilityState.active = false;
  abilityState.cooldown = false;
  abilityState.cooldownTimer = 0;
  abilityState.slowmoActive = false;
  abilityState.boosterActive = false;
  abilityState.projectiles = [];
  abilityState.ufoLaserUses = (config.type === 'ufo') ? 200 : 0;

  if (config.type === 'ufo') {
    // UFO: ???踰꾪듉 UI
    if (ui) ui.style.display = 'none';
    if (ufoDualUI) {
      ufoDualUI.style.display = 'flex';
      document.getElementById('ufoLaserCount').textContent = abilityState.ufoLaserUses;
      document.getElementById('ufoBoosterCount').textContent = abilityState.uses;
      document.getElementById('ufoLaserBtn').disabled = false;
      document.getElementById('ufoBoosterBtn').disabled = false;
    }
  } else {
    //
    if (ufoDualUI) ufoDualUI.style.display = 'none';
    document.getElementById('abilityIcon').textContent = config.icon;
    document.getElementById('abilityCount').textContent = abilityState.uses;
    if (ui) ui.style.display = 'flex';
    var btn = document.getElementById('abilityBtn');
    btn.disabled = false;
  }
}

function activateAbility() {
  if (game.status !== 'playing' || abilityState.cooldown || paused) return;
  if (!abilityState.type) return;

  var config = null;
  var vehicle = shopState ? shopState.selectedVehicle : null;
  if (vehicle) config = abilityConfigs[vehicle];
  if (!config) return;

  // UFO: 留덉슦???대┃ = ?덉씠?留? 遺?ㅽ꽣??UI 踰꾪듉 ?꾩슜
  if (abilityState.type === 'ufo') {
    // activateAbility??留덉슦???대┃?먯꽌 ?몄텧??-> ?덉씠?留?
    if (abilityState.ufoLaserUses > 0) {
      fireLaser();
      abilityState.ufoLaserUses--;
    } else {
      return;
    }
    updateAbilityUI();
    startAbilityCooldown(config.cooldownMs);
    return;
  }

  if (abilityState.uses <= 0) return;
  abilityState.uses--;

  switch (abilityState.type) {
    case 'slowmo':
      activateSlowmo();
      break;
    case 'invincible':
      activateInvincibility();
      break;
    case 'missile':
      fireMissile();
      break;
    case 'booster':
      activateBooster();
      break;
  }

  updateAbilityUI();
  startAbilityCooldown(config.cooldownMs);
}

function updateAbilityUI() {
  if (abilityState.type === 'ufo') {
    // UFO ???UI ?낅뜲?댄듃
    var laserCount = document.getElementById('ufoLaserCount');
    var boosterCount = document.getElementById('ufoBoosterCount');
    var laserBtn = document.getElementById('ufoLaserBtn');
    var boosterBtn = document.getElementById('ufoBoosterBtn');
    if (laserCount) laserCount.textContent = abilityState.ufoLaserUses;
    if (boosterCount) boosterCount.textContent = abilityState.uses;
    if (laserBtn) laserBtn.disabled = (abilityState.ufoLaserUses <= 0);
    if (boosterBtn) boosterBtn.disabled = (abilityState.uses <= 0 || abilityState.boosterActive);
  } else {
    var countEl = document.getElementById('abilityCount');
    var btn = document.getElementById('abilityBtn');
    if (!countEl || !btn) return;
    countEl.textContent = abilityState.uses;
    btn.disabled = (abilityState.uses <= 0);

    // Flash effect
    btn.classList.remove('ability-flash');
    void btn.offsetWidth;
    btn.classList.add('ability-flash');
  }
}

function startAbilityCooldown(ms) {
  abilityState.cooldown = true;
  abilityState.cooldownTimer = ms;
}

// === Slow Motion ===
function activateSlowmo() {
  abilityState.slowmoActive = true;
  abilityState.slowmoTimer = abilityState.slowmoDuration;
}

// === Invincibility ===
function activateInvincibility() {
  game.invincibleDuration = 5000;
  activateInvincible();
}

// === UFO Booster (UI 踰꾪듉 ?꾩슜) ===
function activateUfoBooster() {
  if (game.status !== 'playing' || abilityState.boosterActive) return;
  if (abilityState.uses <= 0) return;

  abilityState.uses--;
  activateBooster();
  updateAbilityUI();
}

// === Booster ===
function activateBooster() {
  abilityState.boosterActive = true;
  abilityState.boosterDistStart = game.distance;
  abilityState.boosterDistTarget = game.distance + (shopState && shopState.selectedVehicle === 'UFO' ? 1000 : 500);
  //
  var isUfo = (shopState && shopState.selectedVehicle === 'UFO');
  game.invincibleDuration = isUfo ? 30000 : 15000;
  activateInvincible();
}

// === Missile ===
function fireMissile() {
  if (!airplane || !airplane.mesh) return;
  var pos = airplane.mesh.position.clone();
  var geom = new THREE.BoxGeometry(3, 3, 12);
  var mat = new THREE.MeshPhongMaterial({ color: 0xFF4444, flatShading: true });
  var mesh = new THREE.Mesh(geom, mat);
  mesh.position.set(pos.x + 15, pos.y, pos.z);
  scene.add(mesh);
  playShotSound();

  abilityState.projectiles.push({
    mesh: mesh,
    type: 'missile',
    speed: 6,
    life: 3000
  });
}

// === Laser ===
function fireLaser() {
  if (!airplane || !airplane.mesh) return;
  var pos = airplane.mesh.position.clone();
  var geom = new THREE.CylinderGeometry(1, 1, 30, 6);
  var mat = new THREE.MeshPhongMaterial({ color: 0x00FF88, emissive: 0x00AA44, flatShading: true });
  var mesh = new THREE.Mesh(geom, mat);
  mesh.rotation.z = Math.PI / 2;
  mesh.position.set(pos.x + 20, pos.y, pos.z);
  scene.add(mesh);
  playLaserSound();

  abilityState.projectiles.push({
    mesh: mesh,
    type: 'laser',
    speed: 8,
    life: 2000
  });
}

// Called every frame from game loop
function updateAbilities(dt) {
  if (!abilityState.type) return;

  // Cooldown timer
  if (abilityState.cooldown) {
    abilityState.cooldownTimer -= dt;
    if (abilityState.cooldownTimer <= 0) {
      abilityState.cooldown = false;
    }
  }

  // Slow motion effect
  if (abilityState.slowmoActive) {
    abilityState.slowmoTimer -= dt;
    if (abilityState.slowmoTimer <= 0) {
      abilityState.slowmoActive = false;
    }
  }

  // Booster effect - ?μ븷臾??뚭눼?섎㈃???꾩쭊
  if (abilityState.boosterActive) {
    if (game.distance >= abilityState.boosterDistTarget) {
      abilityState.boosterActive = false;
      game.invincibleDuration = 5000; // 湲곕낯媛?蹂듭썝
      deactivateInvincible();
      updateAbilityUI();
    } else {
      //
      destroyNearbyEnemies();
    }
  }

  // Update projectiles
  for (var i = abilityState.projectiles.length - 1; i >= 0; i--) {
    var p = abilityState.projectiles[i];
    p.mesh.position.x += p.speed;
    p.life -= dt;

    // Check collision with enemies
    checkProjectileCollision(p);

    if (p.life <= 0 || p.mesh.position.x > 400) {
      scene.remove(p.mesh);
      abilityState.projectiles.splice(i, 1);
    }
  }
}

function checkProjectileCollision(proj) {
  // ?쇰컲 ?μ븷臾?(ennemiesHolder ?대?)
  if (ennemiesHolder && ennemiesHolder.ennemiesInUse) {
    for (var i = ennemiesHolder.ennemiesInUse.length - 1; i >= 0; i--) {
      var ennemy = ennemiesHolder.ennemiesInUse[i];
      if (!ennemy || !ennemy.mesh) continue;

      //
      var enemyWorldPos = new THREE.Vector3();
      ennemy.mesh.getWorldPosition(enemyWorldPos);

      var dx = proj.mesh.position.x - enemyWorldPos.x;
      var dy = proj.mesh.position.y - enemyWorldPos.y;
      var dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 30) {
        var destroyPos = enemyWorldPos.clone();
        var destroyColor = getEnemyDestroyColor(ennemy.type);
        ennemiesHolder.mesh.remove(ennemy.mesh);
        ennemiesHolder.ennemiesInUse.splice(i, 1);
        proj.life = 0;
        spawnDestroyParticles(destroyPos, destroyColor);
        playShatterSound();
        // 로켓 패시브: 미사일 파괴 시 코인 드롭
        if (shopState && shopState.selectedVehicle === 'Rocket') { for(var rc=0;rc<10;rc++) addCoin(); }
        return true;
      }
    }
  }

  //
  if (typeof flyingAsteroids !== 'undefined') {
    for (var j = flyingAsteroids.length - 1; j >= 0; j--) {
      var asteroid = flyingAsteroids[j];
      if (!asteroid || !asteroid.mesh) continue;

      var dx2 = proj.mesh.position.x - asteroid.mesh.position.x;
      var dy2 = proj.mesh.position.y - asteroid.mesh.position.y;
      var dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

      if (dist2 < 30) {
        var destroyPos2 = asteroid.mesh.position.clone();
        scene.remove(asteroid.mesh);
        flyingAsteroids.splice(j, 1);
        proj.life = 0;
        spawnDestroyParticles(destroyPos2, getEnemyDestroyColor('asteroid'));
        playShatterSound();
        if (shopState && shopState.selectedVehicle === 'Rocket') { for(var rc=0;rc<10;rc++) addCoin(); }
        return true;
      }
    }
  }

  return false;
}

// Get the speed multiplier for slow motion
function getAbilitySpeedMultiplier() {
  if (abilityState.slowmoActive) return 0.3;
  if (abilityState.boosterActive) return 3.0;
  return 1.0;
}

// ===== DESTROY PARTICLES =====
var destroyParticles = [];

var shotSound = null;
var shatterSounds = [];
var waterSplashSound = null;

function initAbilitySounds() {
  try {
    shotSound = new Audio('audio/shot-hard.mp3');
    shotSound.volume = 0.06;
    shatterSounds.push(new Audio('audio/rock-shatter-1.mp3'));
    shatterSounds.push(new Audio('audio/rock-shatter-2.mp3'));
    shatterSounds.push(new Audio('audio/bullet-impact-rock.mp3'));
    for (var i = 0; i < shatterSounds.length; i++) {
      shatterSounds[i].volume = 0.2;
    }
    waterSplashSound = new Audio('audio/water-splash.mp3');
    waterSplashSound.volume = 0.35;
  } catch(e) {}
}

function playShotSound() {
  try {
    if (shotSound) {
      var s = shotSound.cloneNode();
      s.volume = 0.06;
      s.play().catch(function(){});
    }
  } catch(e) {}
}

var _laserAudioCtx = null;
function playLaserSound() {
  try {
    if (!_laserAudioCtx) _laserAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    var ctx = _laserAudioCtx;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch(e) {}
}

function playShatterSound() {
  try {
    if (shatterSounds.length > 0) {
      var idx = Math.floor(Math.random() * shatterSounds.length);
      var s = shatterSounds[idx].cloneNode();
      s.volume = 0.2;
      s.play().catch(function(){});
    }
  } catch(e) {}
}

function playWaterSplashSound() {
  try {
    if (waterSplashSound) {
      var s = waterSplashSound.cloneNode();
      s.volume = 0.35;
      s.play().catch(function(){});
    }
  } catch(e) {}
}

function spawnDestroyParticles(worldPos, color) {
  var particleCount = 12;
  var col = color || 0x888888;

  for (var i = 0; i < particleCount; i++) {
    var size = 2 + Math.random() * 4;
    var geom = new THREE.BoxGeometry(size, size, size);
    var mat = new THREE.MeshPhongMaterial({
      color: col,
      flatShading: true,
      transparent: true,
      opacity: 1
    });
    var mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(worldPos.x, worldPos.y, worldPos.z);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    scene.add(mesh);

    destroyParticles.push({
      mesh: mesh,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      vz: (Math.random() - 0.5) * 2,
      rotSpeed: (Math.random() - 0.5) * 0.3,
      life: 800 + Math.random() * 400,
      maxLife: 800 + Math.random() * 400
    });
  }
}

function updateDestroyParticles(dt) {
  for (var i = destroyParticles.length - 1; i >= 0; i--) {
    var p = destroyParticles[i];
    p.mesh.position.x += p.vx;
    p.mesh.position.y += p.vy;
    p.mesh.position.z += p.vz;
    p.vy -= 0.08; // gravity
    p.mesh.rotation.x += p.rotSpeed;
    p.mesh.rotation.y += p.rotSpeed;
    p.life -= dt;

    // Fade out + shrink
    var ratio = Math.max(0, p.life / p.maxLife);
    p.mesh.scale.set(ratio, ratio, ratio);
    if (p.mesh.material) p.mesh.material.opacity = ratio;

    if (p.life <= 0) {
      scene.remove(p.mesh);
      destroyParticles.splice(i, 1);
    }
  }
}

function cleanupDestroyParticles() {
  for (var i = 0; i < destroyParticles.length; i++) {
    scene.remove(destroyParticles[i].mesh);
  }
  destroyParticles = [];
}

function hideAbilityUI() {
  var ui = document.getElementById('abilityUI');
  if (ui) ui.style.display = 'none';
  var ufoDualUI = document.getElementById('ufoDualUI');
  if (ufoDualUI) ufoDualUI.style.display = 'none';
  mouseIsDown = false;
  if (mouseHoldInterval) { clearInterval(mouseHoldInterval); mouseHoldInterval = null; }
}

function cleanupProjectiles() {
  for (var i = 0; i < abilityState.projectiles.length; i++) {
    scene.remove(abilityState.projectiles[i].mesh);
  }
  abilityState.projectiles = [];
}

//
function destroyNearbyEnemies() {
  if (!airplane || !airplane.mesh) return;
  var planePos = airplane.mesh.position;
  var destroyRange = 60;

  //
  if (ennemiesHolder && ennemiesHolder.ennemiesInUse) {
    for (var i = ennemiesHolder.ennemiesInUse.length - 1; i >= 0; i--) {
      var ennemy = ennemiesHolder.ennemiesInUse[i];
      if (!ennemy || !ennemy.mesh) continue;

      var wp = new THREE.Vector3();
      ennemy.mesh.getWorldPosition(wp);
      var dx = planePos.x - wp.x;
      var dy = planePos.y - wp.y;
      var dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < destroyRange) {
        var dpos = wp.clone();
        var destroyColor = getEnemyDestroyColor(ennemy.type);
        ennemiesHolder.mesh.remove(ennemy.mesh);
        ennemiesHolder.ennemiesInUse.splice(i, 1);
        spawnDestroyParticles(dpos, destroyColor);
        playShatterSound();
      }
    }
  }

  //
  if (typeof flyingAsteroids !== 'undefined') {
    for (var j = flyingAsteroids.length - 1; j >= 0; j--) {
      var ast = flyingAsteroids[j];
      if (!ast || !ast.mesh) continue;
      var dx2 = planePos.x - ast.mesh.position.x;
      var dy2 = planePos.y - ast.mesh.position.y;
      var dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      if (dist2 < destroyRange) {
        var dpos2 = ast.mesh.position.clone();
        scene.remove(ast.mesh);
        flyingAsteroids.splice(j, 1);
        spawnDestroyParticles(dpos2, getEnemyDestroyColor('asteroid'));
        playShatterSound();
      }
    }
  }
}

// ===== BOSS FIGHT SYSTEM =====

var bossState = {
  active: false,
  mesh: null,
  hp: 0,
  maxHp: 0,
  timer: 0,
  maxTimer: 25000, // 25 seconds
  reward: 0,
  name: '',
  triggered: [],
  missiles: [],
  entering: true,
  targetX: 80,
  oscillateTime: 0,
  bossType: 0,
  cooldown: 0,
  pendingBoss: null,
  tentacleAttackTimer: 0,
  tentacleAttacking: false,
  tentaclePhase: 0
};

var bossConfigs = [
  { name: '거대 암모나이트', hp: 50, reward: 150, heartReward: 1, color: 0xDDAA22, distance: 2000 },
  { name: '메갈로돈', hp: 70, reward: 300, heartReward: 1, color: 0x4466AA, distance: 6000 },
  { name: '티라노사우루스', hp: 100, reward: 1000, heartReward: 2, color: 0x664422, distance: 9500 },
  { name: 'UFO', hp: 130, reward: 1500, heartReward: 2, color: 0x44AA66, distance: 13000 }
];

function getBossForDistance(dist) {
  var d = Math.floor(dist);
  for (var i = bossConfigs.length - 1; i >= 0; i--) {
    if (d >= bossConfigs[i].distance) {
      // Repeating bosses: cycle through them
      var cycleIndex = Math.floor((d - 5000) / 5000) % bossConfigs.length;
      return bossConfigs[cycleIndex];
    }
  }
  return null;
}

function isSpecialAbilityActive() {
  if (game.invincible) return true;
  if (typeof abilityState !== 'undefined' && abilityState) {
    if (abilityState.boosterActive) return true;
    if (abilityState.slowmoActive) return true;
  }
  return false;
}

function checkBossTrigger() {
  if (bossState.active) return;
  //
  if (bossState.cooldown > 0) {
    bossState.cooldown -= 16; // ~60fps
    return;
  }

  // 대기 중인 보스가 있으면 능력 해제 후 스폰
  if (bossState.pendingBoss) {
    if (!isSpecialAbilityActive()) {
      var pending = bossState.pendingBoss;
      bossState.pendingBoss = null;
      spawnBoss(pending.config, pending.index);
    }
    return;
  }

  var d = Math.floor(game.distance);
  //
  for (var i = 0; i < bossConfigs.length; i++) {
    var config = bossConfigs[i];
    if (d >= config.distance && bossState.triggered.indexOf(config.distance) === -1) {
      bossState.triggered.push(config.distance);
      // 특수 능력 사용 중이면 대기
      if (isSpecialAbilityActive()) {
        bossState.pendingBoss = { config: config, index: i };
      } else {
        spawnBoss(config, i);
      }
      return;
    }
  }
}

function createBossMesh(config, cycleIndex) {
  var group = new THREE.Object3D();
  var type = cycleIndex % 4;
  var S = 2;
  var gapBox = new THREE.BoxGeometry(S * 0.93, S * 0.93, S * 0.93);
  var mats = {};
  var grid;

  function gm(c) {
    if (!mats[c]) mats[c] = new THREE.MeshPhongMaterial({ color: c, flatShading: true });
    return mats[c];
  }
  function sv(x, y, z, c) {
    grid[Math.round(x) + ',' + Math.round(y) + ',' + Math.round(z)] = c;
  }
  function fillBox(x1, y1, z1, x2, y2, z2, c) {
    for (var x = x1; x <= x2; x++)
      for (var y = y1; y <= y2; y++)
        for (var z = z1; z <= z2; z++) sv(x, y, z, c);
  }
  function fillEllipsoid(cx, cy, cz, rx, ry, rz, c, splitY, c2) {
    for (var x = Math.ceil(cx - rx); x <= Math.floor(cx + rx); x++)
      for (var y = Math.ceil(cy - ry); y <= Math.floor(cy + ry); y++)
        for (var z = Math.ceil(cz - rz); z <= Math.floor(cz + rz); z++) {
          var dx = (x - cx) / rx, dy = (y - cy) / ry, dz = (z - cz) / rz;
          if (dx * dx + dy * dy + dz * dz <= 1)
            sv(x, y, z, (splitY !== undefined && y < splitY) ? c2 : c);
        }
  }
  function buildGrid(parent) {
    var byColor = {};
    for (var key in grid) {
      var c = grid[key];
      if (!byColor[c]) byColor[c] = [];
      var p = key.split(',');
      byColor[c].push([parseInt(p[0]), parseInt(p[1]), parseInt(p[2])]);
    }
    for (var color in byColor) {
      var arr = byColor[color];
      var done = false;
      try {
        var geo = new THREE.Geometry();
        for (var i = 0; i < arr.length; i++) {
          var b = gapBox.clone();
          b.translate(arr[i][0] * S, arr[i][1] * S, arr[i][2] * S);
          geo.merge(b);
        }
        parent.add(new THREE.Mesh(geo, gm(parseInt(color))));
        done = true;
      } catch (e) {}
      if (!done) {
        for (var j = 0; j < arr.length; j++) {
          var m = new THREE.Mesh(gapBox, gm(parseInt(color)));
          m.position.set(arr[j][0] * S, arr[j][1] * S, arr[j][2] * S);
          parent.add(m);
        }
      }
    }
  }

  if (type === 0) {
    // ========== 거대 암모나이트 (복셀) ==========
    grid = {};
    var GOLD = 0xDDAA22, DARK = 0x443311, SAL = 0xEE8877, COR = 0xDD6644;
    // 나선형 껍질
    for (var t = 0.8; t < 16; t += 0.3) {
      var r = 1.5 * Math.exp(0.12 * t);
      if (r > 11) break;
      var cx = Math.cos(t) * r + 6;
      var cy = Math.sin(t) * r + 2;
      var col = (Math.floor(t * 1.5) % 2 === 0) ? GOLD : DARK;
      var th = Math.min(2, Math.floor(r * 0.14) + 1);
      for (var ddx = -th; ddx <= th; ddx++)
        for (var ddy = -th; ddy <= th; ddy++)
          if (ddx * ddx + ddy * ddy <= th * th + 0.5) {
            sv(cx + ddx, cy + ddy, 0, col);
            sv(cx + ddx, cy + ddy, 1, col);
            sv(cx + ddx, cy + ddy, -1, col);
          }
    }
    fillEllipsoid(6, 2, 0, 2, 2, 1, 0xBB9922);
    fillEllipsoid(-2, -3, 0, 5, 3, 2, SAL);
    sv(-5, -1, 2, 0xFFFFFF); sv(-5, 0, 2, 0xFFFFFF); sv(-5, -1, 3, 0x222222);
    buildGrid(group);
    // 촉수 (애니메이션용 별도 그룹)
    group.tentacles = [];
    for (var ti = 0; ti < 10; ti++) {
      var tgrp = new THREE.Object3D();
      grid = {};
      var spread = (ti / 9 - 0.5) * 2;
      var len = 6 + Math.floor(Math.random() * 4);
      for (var seg = 0; seg < len; seg++) {
        var ty = Math.round(Math.sin(seg * 0.5 + ti * 0.4) * 0.5);
        sv(-seg, ty, 0, seg < 2 ? SAL : COR);
      }
      buildGrid(tgrp);
      tgrp.position.set(-8 * S, (-4 + spread * 3) * S, spread * 3 * S);
      group.add(tgrp);
      group.tentacles.push(tgrp);
    }

  } else if (type === 1) {
    // ========== 메갈로돈 (복셀) ==========
    grid = {};
    var GR = 0x8899AA, BEL = 0xCCCCBB, JW = 0x883333, THC = 0xEEEEDD, FN = 0x667788;
    fillEllipsoid(0, 0, 0, 11, 5, 3, GR, -1, BEL);
    for (var hx = -11; hx >= -17; hx--) {
      var hf = (-hx - 11) / 6;
      var hry = Math.max(2, Math.round(5 * (1 - hf * 0.4)));
      for (var hy = -hry; hy <= hry; hy++)
        for (var hz = -2; hz <= 2; hz++)
          if (hy * hy / (hry * hry + 0.1) + hz * hz / 5 <= 1)
            sv(hx, hy, hz, hy < -1 ? BEL : GR);
    }
    fillBox(-23, 1, -3, -17, 3, 3, GR);
    fillBox(-23, -2, -2, -17, 0, 2, JW);
    for (var tx = -23; tx <= -17; tx++) {
      sv(tx, 0, -3, THC); sv(tx, 0, -1, THC); sv(tx, 0, 1, THC); sv(tx, 0, 3, THC);
    }
    for (var fx = -3; fx <= 5; fx++) {
      var fh = Math.max(0, Math.round(6 - Math.abs(fx - 1) * 1.2));
      for (var fy = 5; fy < 5 + fh; fy++) sv(fx, fy, 0, FN);
    }
    for (var pf = 0; pf < 5; pf++) {
      sv(-3 - pf, -4 - pf, 3, FN); sv(-3 - pf, -4 - pf, -3, FN);
      if (pf < 3) { sv(-3 - pf, -4 - pf, 4, FN); sv(-3 - pf, -4 - pf, -4, FN); }
    }
    for (var ttx = 11; ttx <= 18; ttx++) {
      var ttf = (ttx - 11) / 7;
      for (var tty = -Math.round(ttf * 4); tty <= Math.round(ttf * 6); tty++) sv(ttx, tty, 0, FN);
      if (ttf > 0.3) for (var tty2 = -Math.round(ttf * 2); tty2 <= Math.round(ttf * 3); tty2++) sv(ttx, tty2, 1, FN);
    }
    sv(-13, 3, 3, 0xFFFFFF); sv(-13, 3, 4, 0x111111);
    buildGrid(group);
    // 아래턱 (별도 그룹 - 애니메이션용)
    var sharkJaw = new THREE.Object3D();
    sharkJaw.position.set(-17 * S, -1 * S, 0);
    grid = {};
    fillBox(-5, -3, -2, 0, -1, 2, GR);
    for (var jtx = -5; jtx <= 0; jtx += 2) {
      sv(jtx, 0, -2, THC); sv(jtx, 0, 0, THC); sv(jtx, 0, 2, THC);
    }
    buildGrid(sharkJaw);
    group.add(sharkJaw);
    group.lowerJaw = sharkJaw;

  } else if (type === 2) {
    // ========== 티라노사우루스 (복셀) ==========
    grid = {};
    var DK = 0x5C4A32, LT = 0x8B7355, JC = 0x773322, TC2 = 0xEEEECC, CL = 0x444444;
    fillEllipsoid(2, 0, 0, 7, 5, 3, DK);
    fillEllipsoid(2, -2, 0, 5, 2, 2, LT);
    for (var nx = -3; nx <= 1; nx++) {
      var nny = 5 + Math.round((1 - nx) * 1.2);
      fillEllipsoid(nx, nny, 0, 1.5, 2.5, 2, DK);
    }
    fillBox(-14, 10, -3, -4, 16, 3, LT);
    fillBox(-14, 16, -2, -6, 17, 2, DK);
    fillBox(-21, 11, -2, -14, 15, 2, LT);
    fillBox(-19, 9, -2, -14, 11, 2, 0x331111);
    for (var utx = -21; utx <= -14; utx += 2) {
      sv(utx, 10, -2, TC2); sv(utx, 10, 0, TC2); sv(utx, 10, 2, TC2);
    }
    sv(-10, 15, 3, 0xFFCC00); sv(-10, 15, 4, 0x222222); sv(-10, 14, 3, 0xFFCC00);
    sv(-4, 3, 3, LT); sv(-5, 2, 3, LT); sv(-5, 1, 3, LT); sv(-6, 0, 3, CL);
    sv(-4, 3, -3, LT); sv(-5, 2, -3, LT); sv(-5, 1, -3, LT); sv(-6, 0, -3, CL);
    fillBox(-1, -12, 2, 2, -1, 4, LT);
    fillBox(-2, -14, 1, 3, -12, 5, DK);
    sv(-2, -14, 3, CL); sv(3, -14, 3, CL); sv(0, -14, 3, CL);
    fillBox(-1, -12, -4, 2, -1, -2, LT);
    fillBox(-2, -14, -5, 3, -12, -1, DK);
    sv(-2, -14, -3, CL); sv(3, -14, -3, CL); sv(0, -14, -3, CL);
    for (var rtx = 9; rtx <= 25; rtx++) {
      var rtf = (rtx - 9) / 16;
      var rtw = Math.max(1, Math.round(2.5 * (1 - rtf)));
      var rth = Math.max(1, Math.round(3 * (1 - rtf)));
      for (var rty = -rth; rty <= rth; rty++)
        for (var rtz = -rtw; rtz <= rtw; rtz++)
          sv(rtx, rty + 1, rtz, DK);
    }
    buildGrid(group);
    // 아래턱 (별도 그룹 - 애니메이션용)
    var rexJaw = new THREE.Object3D();
    rexJaw.position.set(-14 * S, 9 * S, 0);
    grid = {};
    fillBox(-5, -3, -2, 0, 0, 2, JC);
    for (var jltx = -5; jltx <= 0; jltx += 2) {
      sv(jltx, 1, -1, TC2); sv(jltx, 1, 1, TC2);
    }
    buildGrid(rexJaw);
    group.add(rexJaw);
    group.lowerJaw = rexJaw;

  } else {
    // ========== UFO (복셀) ==========
    grid = {};
    var DSC = 0x777788, UPR = 0x99AABB, BND = 0xCC8844, DME = 0x88CCEE;
    var GLW = 0x00CCFF, POD = 0x556677, RNG = 0xFFAA00;
    for (var ux = -14; ux <= 14; ux++) {
      var uxf = Math.abs(ux) / 14;
      var uzw = Math.max(1, Math.round(4 * (1 - uxf * uxf)));
      for (var uz = -uzw; uz <= uzw; uz++) {
        sv(ux, 0, uz, DSC); sv(ux, -1, uz, DSC);
        if (uxf < 0.8) sv(ux, -2, uz, DSC);
      }
    }
    for (var ux2 = -11; ux2 <= 11; ux2++) {
      var uxf2 = Math.abs(ux2) / 11;
      var uzw2 = Math.max(1, Math.round(3 * (1 - uxf2 * uxf2)));
      for (var uz2 = -uzw2; uz2 <= uzw2; uz2++) {
        sv(ux2, 1, uz2, UPR);
        if (uxf2 < 0.7) sv(ux2, 2, uz2, UPR);
      }
    }
    for (var bx = -14; bx <= 14; bx++) {
      var bxf = Math.abs(bx) / 14;
      var zEdge = Math.max(1, Math.round(4 * (1 - bxf * bxf)));
      sv(bx, 0, zEdge, BND); sv(bx, 0, -zEdge, BND);
    }
    for (var ddx2 = -5; ddx2 <= 5; ddx2++)
      for (var ddy2 = 3; ddy2 <= 7; ddy2++)
        for (var ddz2 = -5; ddz2 <= 5; ddz2++) {
          var dd = ddx2*ddx2/25 + (ddy2-3)*(ddy2-3)/16 + ddz2*ddz2/25;
          if (dd <= 1) sv(ddx2, ddy2, ddz2, DME);
        }
    var podXs = [-10, -5, 0, 5, 10];
    for (var pi = 0; pi < podXs.length; pi++) {
      fillBox(podXs[pi]-1, -4, -1, podXs[pi]+1, -3, 1, POD);
      sv(podXs[pi], -5, 0, GLW);
    }
    for (var rrx = -12; rrx <= 12; rrx += 2) sv(rrx, -2, 0, RNG);
    sv(-2, 5, 3, 0x44FF44); sv(2, 5, 3, 0x44FF44);
    sv(-2, 6, 3, 0x222222); sv(2, 6, 3, 0x222222);
    buildGrid(group);
    // 발광 파트 (애니메이션용)
    group.glowParts = [];
    var glowMat = new THREE.MeshPhongMaterial({ color: 0x00CCFF, emissive: 0x0088FF, flatShading: true });
    for (var gpi = 0; gpi < podXs.length; gpi++) {
      var gm2 = new THREE.Mesh(new THREE.BoxGeometry(S*1.5, S*1.5, S*1.5), glowMat);
      gm2.position.set(podXs[gpi] * S, -5 * S, 0);
      group.add(gm2);
      group.glowParts.push(gm2);
    }
  }

  return group;
}

function clearAllObstacles() {
  // 장애물 제거
  if (ennemiesHolder && ennemiesHolder.ennemiesInUse) {
    for (var i = ennemiesHolder.ennemiesInUse.length - 1; i >= 0; i--) {
      ennemiesHolder.mesh.remove(ennemiesHolder.ennemiesInUse[i].mesh);
    }
    ennemiesHolder.ennemiesInUse = [];
  }
  // 비행 소행성 제거
  if (typeof flyingAsteroids !== 'undefined') {
    for (var j = flyingAsteroids.length - 1; j >= 0; j--) {
      scene.remove(flyingAsteroids[j].mesh);
    }
    flyingAsteroids = [];
  }
  // 코인 제거
  if (coinsHolder && coinsHolder.coinsInUse) {
    for (var k = coinsHolder.coinsInUse.length - 1; k >= 0; k--) {
      coinsHolder.mesh.remove(coinsHolder.coinsInUse[k].mesh);
      coinsHolder.coinsPool.push(coinsHolder.coinsInUse[k]);
    }
    coinsHolder.coinsInUse = [];
  }
  // 무적 아이템 제거
  if (invincibleFruitHolder && invincibleFruitHolder.fruitsInUse) {
    for (var f = invincibleFruitHolder.fruitsInUse.length - 1; f >= 0; f--) {
      invincibleFruitHolder.mesh.remove(invincibleFruitHolder.fruitsInUse[f].mesh);
      invincibleFruitHolder.fruitsPool.push(invincibleFruitHolder.fruitsInUse[f]);
    }
    invincibleFruitHolder.fruitsInUse = [];
  }
  // 하트 아이템 제거
  if (heartItemHolder && heartItemHolder.itemsInUse) {
    for (var h = heartItemHolder.itemsInUse.length - 1; h >= 0; h--) {
      heartItemHolder.mesh.remove(heartItemHolder.itemsInUse[h].mesh);
      heartItemHolder.itemsPool.push(heartItemHolder.itemsInUse[h]);
    }
    heartItemHolder.itemsInUse = [];
  }
}

function playBossWarningSound() {
  try {
    var ctx = getAudioCtx();
    var now = ctx.currentTime;
    // 경고 사이렌
    for (var i = 0; i < 3; i++) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(400, now + i * 0.4);
      osc.frequency.linearRampToValueAtTime(800, now + i * 0.4 + 0.2);
      gain.gain.setValueAtTime(0.12, now + i * 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.4 + 0.35);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now + i * 0.4); osc.stop(now + i * 0.4 + 0.4);
    }
  } catch(e) {}
}

function showBossWarning(name, callback) {
  playBossWarningSound();

  var warn = document.createElement('div');
  warn.id = 'bossWarning';
  warn.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:2500;display:flex;flex-direction:column;justify-content:center;align-items:center;pointer-events:none;background:rgba(255,0,0,0.08);';
  warn.innerHTML =
    '<div style="font-size:64px;color:#FF3333;font-family:Playfair Display,serif;font-weight:700;text-shadow:0 0 40px rgba(255,0,0,0.8);opacity:0;animation:bossWarnIn 0.5s ease forwards;">⚠ WARNING ⚠</div>' +
    '<div style="font-size:36px;color:#FFD700;font-family:Playfair Display,serif;font-weight:700;margin-top:12px;text-shadow:0 0 20px rgba(255,215,0,0.6);opacity:0;animation:bossWarnIn 0.5s ease 0.4s forwards;">BOSS: ' + name + '</div>';
  document.body.appendChild(warn);

  if (!document.getElementById('bossWarnStyle')) {
    var style = document.createElement('style');
    style.id = 'bossWarnStyle';
    style.textContent = '@keyframes bossWarnIn{0%{opacity:0;transform:scale(0.5)}50%{opacity:1;transform:scale(1.1)}100%{opacity:1;transform:scale(1)}}@keyframes bossWarnFlash{0%,100%{background:rgba(255,0,0,0.05)}50%{background:rgba(255,0,0,0.15)}}';
    document.head.appendChild(style);
  }
  warn.style.animation = 'bossWarnFlash 0.3s ease 3';

  setTimeout(function() {
    if (warn.parentNode) warn.remove();
    if (callback) callback();
  }, 1800);
}

function spawnBoss(config, typeIndex) {
  // 장애물 먼저 제거 & 비행 정지
  clearAllObstacles();
  bossState.savedSpeed = game.speed;
  bossState.savedBaseSpeed = game.baseSpeed;
  game.baseSpeed = 0;
  game.speed = 0;
  // 경고 표시 중이므로 active 설정 (스폰/비행 차단용)
  bossState.active = true;
  bossState.entering = true;
  bossState.hp = config.hp;
  bossState.maxHp = config.hp;

  var cycleIndex = (typeIndex !== undefined) ? typeIndex : 0;

  // 경고 연출 후 실제 보스 등장
  showBossWarning(config.name, function() {
    if (!bossState.active) return;
    bossState.timer = bossState.maxTimer;
    bossState.reward = config.reward;
    bossState.heartReward = config.heartReward || 0;
    bossState.name = config.name;
    bossState.oscillateTime = 0;
    bossState.missiles = [];

    bossState.bossType = cycleIndex % 4;
    bossState.mesh = createBossMesh(config, cycleIndex);
    bossState.mesh.position.set(350, game.planeDefaultHeight + 30, 0);
    bossState.mesh.scale.set(1.5, 1.5, 1.5);
    scene.add(bossState.mesh);

    // UI
    var ui = document.getElementById('bossUI');
    if (ui) ui.style.display = 'block';
    var nameEl = document.getElementById('bossName');
    if (nameEl) nameEl.textContent = 'BOSS ' + config.name;
    var fireUI = document.getElementById('bossFireUI');
    if (fireUI) fireUI.style.display = 'flex';
    updateBossUI();
    showBossGuide();
  });
}

function updateBossUI() {
  var hpBar = document.getElementById('bossHpBar');
  if (hpBar) hpBar.style.width = Math.max(0, (bossState.hp / bossState.maxHp) * 100) + '%';
  var timerEl = document.getElementById('bossTimer');
  if (timerEl) timerEl.textContent = Math.ceil(bossState.timer / 1000) + 's';
}

function updateBoss(dt) {
  if (!bossState.active || !bossState.mesh) return;

  // 입장 애니메이션
  if (bossState.entering) {
    bossState.mesh.position.x += (bossState.targetX - bossState.mesh.position.x) * 0.03;
    if (Math.abs(bossState.mesh.position.x - bossState.targetX) < 2) {
      bossState.entering = false;
    }
  }

  // 상하 움직임
  bossState.oscillateTime += dt * 0.002;
  bossState.mesh.position.y = game.planeDefaultHeight + 30 + Math.sin(bossState.oscillateTime) * 40;

  // === 보스별 애니메이션 ===
  var time = bossState.oscillateTime;

  // 암모나이트: 촉수 흔들기
  if (bossState.bossType === 0 && bossState.mesh.tentacles) {
    for (var ti = 0; ti < bossState.mesh.tentacles.length; ti++) {
      var tent = bossState.mesh.tentacles[ti];
      tent.rotation.x = Math.sin(time * 2 + ti) * 0.4;
      tent.rotation.z = Math.sin(time * 1.5 + ti * 0.7) * 0.3;
    }
  }
  // 메갈로돈 & 티라노: 입 벌렸다 닫기
  if ((bossState.bossType === 1 || bossState.bossType === 2) && bossState.mesh.lowerJaw) {
    var jawOpen = Math.max(0, Math.sin(time * 1.8)) * 0.4;
    bossState.mesh.lowerJaw.rotation.z = jawOpen;
  }
  // UFO: 하부 발광 펄스
  if (bossState.bossType === 3 && bossState.mesh.glowParts) {
    for (var gi = 0; gi < bossState.mesh.glowParts.length; gi++) {
      var pulse = 0.6 + Math.sin(time * 4 + gi * 1.3) * 0.6;
      bossState.mesh.glowParts[gi].scale.set(pulse, pulse, pulse);
    }
  }

  // === 보스 공격 시스템 ===
  if (!bossState.entering) {
    bossState.bossAttackTimer = (bossState.bossAttackTimer || 0) + dt;
    var atkInterval = bossState.furyMode ? 400 : [2500, 2000, 1800, 1500][bossState.bossType];
    if (bossState.bossAttackTimer >= atkInterval) {
      bossState.bossAttackTimer = 0;
      // 단계별 미사일 개수: 1, 2, 3, 4발
      var shotCount = bossState.bossType + 1;
      for (var si = 0; si < shotCount; si++) {
        (function(idx) {
          setTimeout(function() {
            if (bossState.active && bossState.mesh) fireBossProjectile();
          }, idx * 150);
        })(si);
      }
    }

    // 메갈로돈 이상: 돌진 공격
    if (bossState.bossType >= 1) {
      bossState.chargeTimer = (bossState.chargeTimer || 0) + dt;
      var chargeInterval = [0, 6000, 5000, 4000][bossState.bossType];
      if (!bossState.charging && bossState.chargeTimer >= chargeInterval) {
        bossState.chargeTimer = 0;
        bossState.charging = true;
        bossState.chargePhase = 'rush'; // rush → return
        bossState.chargeOrigX = bossState.mesh.position.x;
        bossState.chargeTargetX = airplane ? airplane.mesh.position.x + 30 : 0;
      }
      if (bossState.charging) {
        if (bossState.chargePhase === 'rush') {
          bossState.mesh.position.x += (bossState.chargeTargetX - bossState.mesh.position.x) * 0.08;
          if (Math.abs(bossState.mesh.position.x - bossState.chargeTargetX) < 5) {
            bossState.chargePhase = 'return';
          }
        } else {
          bossState.mesh.position.x += (bossState.chargeOrigX - bossState.mesh.position.x) * 0.04;
          if (Math.abs(bossState.mesh.position.x - bossState.chargeOrigX) < 3) {
            bossState.mesh.position.x = bossState.chargeOrigX;
            bossState.charging = false;
          }
        }
      }
    }
  }

  // 필살기: HP 25% 이하 진입
  if (!bossState.furyMode && bossState.hp > 0 && bossState.hp <= Math.ceil(bossState.maxHp * 0.25)) {
    bossState.furyMode = true;
    fireFuryAttack();
  }

  // 보스 몸체 충돌 → 하트 감소
  if (airplane && airplane.mesh && (!bossState.hitCooldown || bossState.hitCooldown <= 0)) {
    var bcx = bossState.mesh.position.x - airplane.mesh.position.x;
    var bcy = bossState.mesh.position.y - airplane.mesh.position.y;
    if (Math.sqrt(bcx * bcx + bcy * bcy) < 40) {
      removeEnergy();
      ambientLight.intensity = 2;
      setTimeout(function(){ ambientLight.intensity = .5; }, 150);
      playDestroySound();
      bossState.hitCooldown = 1500;
      // 충돌 반동
      game.planeCollisionSpeedX = -3;
      game.planeCollisionSpeedY = (airplane.mesh.position.y > bossState.mesh.position.y) ? 2 : -2;
    }
  }

  // 피격 쿨다운
  if (bossState.hitCooldown > 0) bossState.hitCooldown -= dt;

  // 타이머
  bossState.timer -= dt;
  updateBossUI();

  // === 보스 투사체 → 플레이어 ===
  if (!bossState.bossProjectiles) bossState.bossProjectiles = [];
  for (var pi = bossState.bossProjectiles.length - 1; pi >= 0; pi--) {
    var proj = bossState.bossProjectiles[pi];
    proj.mesh.position.x += proj.vx;
    proj.mesh.position.y += proj.vy;
    proj.mesh.rotation.z += 0.1;
    proj.life -= dt;

    // 유도 (암모나이트 먹물)
    if (proj.homing && airplane && airplane.mesh) {
      var hdx = airplane.mesh.position.x - proj.mesh.position.x;
      var hdy = airplane.mesh.position.y - proj.mesh.position.y;
      var hd = Math.sqrt(hdx * hdx + hdy * hdy);
      if (hd > 1) { proj.vx += (hdx / hd) * 0.03; proj.vy += (hdy / hd) * 0.03; }
    }

    // 플레이어 피격 판정
    if (airplane && airplane.mesh && (!bossState.hitCooldown || bossState.hitCooldown <= 0)) {
      var cdx = proj.mesh.position.x - airplane.mesh.position.x;
      var cdy = proj.mesh.position.y - airplane.mesh.position.y;
      if (Math.sqrt(cdx * cdx + cdy * cdy) < 15) {
        removeEnergy();
        ambientLight.intensity = 2;
        setTimeout(function(){ ambientLight.intensity = .5; }, 150);
        playDestroySound();
        scene.remove(proj.mesh);
        bossState.bossProjectiles.splice(pi, 1);
        bossState.hitCooldown = 1500;
        continue;
      }
    }

    // 범위 밖/수명 종료
    if (proj.life <= 0 || proj.mesh.position.x < -300 || Math.abs(proj.mesh.position.y) > 500) {
      scene.remove(proj.mesh);
      bossState.bossProjectiles.splice(pi, 1);
    }
  }

  // === 플레이어 미사일 → 보스 ===
  for (var i = bossState.missiles.length - 1; i >= 0; i--) {
    var m = bossState.missiles[i];
    m.mesh.position.x += m.speed;
    m.life -= dt;

    if (checkProjectileCollision(m)) {
      scene.remove(m.mesh);
      bossState.missiles.splice(i, 1);
      continue;
    }

    if (m.life <= 0) {
      scene.remove(m.mesh);
      bossState.missiles.splice(i, 1);
      continue;
    }

    if (bossState.mesh) {
      var dx = m.mesh.position.x - bossState.mesh.position.x;
      var dy = m.mesh.position.y - bossState.mesh.position.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 45) {
        bossState.hp--;
        scene.remove(m.mesh);
        bossState.missiles.splice(i, 1);
        spawnDestroyParticles(bossState.mesh.position.clone(), 0xFF4444);
        playShatterSound();
        updateBossUI();

        if (bossState.hp <= 0) {
          defeatBoss();
          return;
        }
      }
    }
  }

  // === 레이저/미사일(abilityState) → 보스 ===
  if (bossState.mesh && abilityState.projectiles) {
    for (var ai = abilityState.projectiles.length - 1; ai >= 0; ai--) {
      var ap = abilityState.projectiles[ai];
      if (!ap || !ap.mesh) continue;
      var adx = ap.mesh.position.x - bossState.mesh.position.x;
      var ady = ap.mesh.position.y - bossState.mesh.position.y;
      if (Math.sqrt(adx * adx + ady * ady) < 45) {
        bossState.hp--;
        scene.remove(ap.mesh);
        abilityState.projectiles.splice(ai, 1);
        spawnDestroyParticles(bossState.mesh.position.clone(), 0x00FF88);
        playShatterSound();
        updateBossUI();
        if (bossState.hp <= 0) { defeatBoss(); return; }
      }
    }
  }

  if (bossState.timer <= 0) {
    retreatBoss();
  }
}

function fireBossMissile() {
  if (!bossState.active || !bossState.mesh || !airplane || !airplane.mesh) return;

  var pos = airplane.mesh.position.clone();
  var geom = new THREE.BoxGeometry(3, 3, 12);
  var mat = new THREE.MeshPhongMaterial({ color: 0xFF4444, flatShading: true });
  var mesh = new THREE.Mesh(geom, mat);
  mesh.position.set(pos.x + 15, pos.y, pos.z);
  scene.add(mesh);
  playShotSound();

  bossState.missiles.push({
    mesh: mesh,
    speed: 5,
    life: 3000
  });
}


function fireBossProjectile() {
  if (!bossState.active || !bossState.mesh || !airplane || !airplane.mesh) return;
  if (!bossState.bossProjectiles) bossState.bossProjectiles = [];

  var bx = bossState.mesh.position.x;
  var by = bossState.mesh.position.y;
  var px = airplane.mesh.position.x;
  var py = airplane.mesh.position.y;
  var ddx = px - bx, ddy = py - by;
  var dist = Math.sqrt(ddx * ddx + ddy * ddy);
  if (dist < 1) dist = 1;

  var projMesh, speed, vx, vy, homing = false;
  var tier = bossState.bossType; // 0~3, 상위일수록 강력
  var sizeScale = 1 + tier * 0.5; // 1.0, 1.5, 2.0, 2.5
  var speedScale = 1 + tier * 0.4; // 1.0, 1.4, 1.8, 2.2

  if (tier === 0) {
    // 암모나이트: 먹물탄 (느리고 약간 유도)
    var sz = 5 * sizeScale;
    var inkG = new THREE.BoxGeometry(sz, sz, sz);
    var inkM = new THREE.MeshPhongMaterial({ color: 0x332244, emissive: 0x110022, flatShading: true });
    projMesh = new THREE.Mesh(inkG, inkM);
    speed = 1.8 * speedScale;
    homing = true;
  } else if (tier === 1) {
    // 메갈로돈: 이빨 투사체 (빠른 직선)
    var tsz = 4 * sizeScale;
    var tG = new THREE.BoxGeometry(tsz * 0.7, tsz * 1.5, tsz * 0.7);
    var tM = new THREE.MeshPhongMaterial({ color: 0xEEEEDD, flatShading: true });
    projMesh = new THREE.Mesh(tG, tM);
    projMesh.rotation.z = Math.atan2(ddy, ddx);
    speed = 3.5 * speedScale;
  } else if (tier === 2) {
    // 티라노: 화염구 (중간 속도, 산탄)
    var fsz = 6 * sizeScale;
    var fG = new THREE.BoxGeometry(fsz, fsz, fsz);
    var fM = new THREE.MeshPhongMaterial({ color: 0xFF4400, emissive: 0xCC2200, flatShading: true });
    projMesh = new THREE.Mesh(fG, fM);
    speed = 2.5 * speedScale;
    ddx += (Math.random() - 0.5) * dist * 0.3;
    ddy += (Math.random() - 0.5) * dist * 0.3;
    dist = Math.sqrt(ddx * ddx + ddy * ddy);
    if (dist < 1) dist = 1;
  } else {
    // UFO: 레이저 (빠르고 정확, 가장 크고 빠름)
    var lsz = sizeScale;
    var lG = new THREE.BoxGeometry(14 * lsz, 3 * lsz, 3 * lsz);
    var lM = new THREE.MeshPhongMaterial({ color: 0x00FFCC, emissive: 0x00AA88, flatShading: true });
    projMesh = new THREE.Mesh(lG, lM);
    projMesh.rotation.z = Math.atan2(ddy, ddx);
    speed = 5 * speedScale;
    if (typeof playUfoLaserSound === 'function') playUfoLaserSound();
  }

  vx = (ddx / dist) * speed;
  vy = (ddy / dist) * speed;
  projMesh.position.set(bx - 20, by, 0);
  scene.add(projMesh);

  bossState.bossProjectiles.push({
    mesh: projMesh, vx: vx, vy: vy, life: 5000, homing: homing
  });
}

// 필살기: HP 25% 이하 시 투사체 와장창
function fireFuryAttack() {
  if (!bossState.active || !bossState.mesh || !airplane || !airplane.mesh) return;
  var bx = bossState.mesh.position.x;
  var by = bossState.mesh.position.y;
  var px = airplane.mesh.position.x;
  var py = airplane.mesh.position.y;
  var baseAngle = Math.atan2(py - by, px - bx);
  var count = 12 + bossState.bossType * 3;

  for (var fi = 0; fi < count; fi++) {
    (function(idx, total) {
      setTimeout(function() {
        if (!bossState.active || !bossState.mesh) return;
        if (!bossState.bossProjectiles) bossState.bossProjectiles = [];
        var spread = (idx / (total - 1) - 0.5) * 1.6;
        var angle = baseAngle + spread;
        var spd = 2 + Math.random() * 2;
        var colors = [0x332244, 0xEEEEDD, 0xFF4400, 0x00FFCC];
        var emissives = [0x110022, 0x000000, 0xCC2200, 0x00AA88];
        var sz = bossState.bossType === 3 ? 3 : 4;
        var pG = new THREE.BoxGeometry(sz, sz, sz);
        var pM = new THREE.MeshPhongMaterial({
          color: colors[bossState.bossType], emissive: emissives[bossState.bossType], flatShading: true
        });
        var pm = new THREE.Mesh(pG, pM);
        pm.position.set(bx - 15, by, 0);
        scene.add(pm);
        bossState.bossProjectiles.push({
          mesh: pm, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, life: 5000, homing: false
        });
      }, idx * 120);
    })(fi, count);
  }
}

function defeatBoss() {
  if (!bossState.mesh) return;

  //
  for (var p = 0; p < 5; p++) {
    var offset = new THREE.Vector3(
      bossState.mesh.position.x + (Math.random() - 0.5) * 30,
      bossState.mesh.position.y + (Math.random() - 0.5) * 30,
      bossState.mesh.position.z + (Math.random() - 0.5) * 20
    );
    spawnDestroyParticles(offset, 0xFF6600);
  }
  playShatterSound();

  //
  var reward = bossState.reward;
  game.coins += reward;
  game.coinsEarnedThisRound += reward;
  var totalCoins = parseInt(localStorage.getItem('totalCoins') || '0');
  localStorage.setItem('totalCoins', (totalCoins + reward).toString());
  var coinsEl = document.getElementById('coinsValue');
  if (coinsEl) coinsEl.textContent = game.coins;

  // 하트 보상
  var hearts = bossState.heartReward || 0;
  for (var h = 0; h < hearts; h++) {
    addHeart();
  }

  //
  showBossReward(reward);

  cleanupBoss();
}

function retreatBoss() {
  //
  cleanupBoss();
}

function cleanupBoss() {
  if (bossState.mesh) {
    scene.remove(bossState.mesh);
    bossState.mesh = null;
  }
  //
  for (var i = 0; i < bossState.missiles.length; i++) {
    scene.remove(bossState.missiles[i].mesh);
  }
  bossState.missiles = [];
  //
  if (bossState.bossProjectiles) {
    for (var j = 0; j < bossState.bossProjectiles.length; j++) {
      scene.remove(bossState.bossProjectiles[j].mesh);
    }
    bossState.bossProjectiles = [];
  }
  bossState.bossAttackTimer = 0;
  bossState.furyMode = false;
  bossState.hitCooldown = 0;
  bossState.charging = false;
  bossState.chargeTimer = 0;
  bossState.active = false;
  bossState.cooldown = 500;

  // 보스전 종료 후 비행 속도 복원
  if (bossState.savedBaseSpeed !== undefined) {
    game.baseSpeed = bossState.savedBaseSpeed;
    game.speed = bossState.savedSpeed;
    bossState.savedBaseSpeed = undefined;
    bossState.savedSpeed = undefined;
  }
  //
  mouseIsDown = false;
  if (mouseHoldInterval) {
    clearInterval(mouseHoldInterval);
    mouseHoldInterval = null;
  }
  //
  var ui = document.getElementById('bossUI');
  if (ui) ui.style.display = 'none';
  var fireUI = document.getElementById('bossFireUI');
  if (fireUI) fireUI.style.display = 'none';
}

function showBossReward(amount) {
  var el = document.getElementById('levelUpText');
  if (el) {
    el.innerHTML = '<p class="level-label">💰 Coin Bomb!</p><p class="level-number">+' + amount + '</p>';
    el.classList.add('show');
    setTimeout(function() {
      el.classList.remove('show');
    }, 2000);
  }
}

function showBossGuide() {
  //
  var old = document.getElementById('bossGuide');
  if (old) old.remove();

  var guide = document.createElement('div');
  guide.id = 'bossGuide';
  guide.style.cssText = 'position:fixed;left:50%;top:60%;transform:translate(-50%,-50%);z-index:2000;display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none;animation:fadeInOut 3s ease forwards;';
  guide.innerHTML = '<div style="font-size:60px;line-height:1;">⚠️</div>' +
    '<div style="color:white;font-size:20px;font-weight:bold;text-shadow:0 2px 8px rgba(0,0,0,0.8);background:rgba(0,0,0,0.5);padding:8px 20px;border-radius:10px;white-space:nowrap;">마우스 왼쪽 클릭하여 미사일 발사!</div>';
  document.body.appendChild(guide);

  // fadeInOut ?ㅽ봽?덉엫 ?숈쟻 異붽?
  if (!document.getElementById('bossGuideStyle')) {
    var style = document.createElement('style');
    style.id = 'bossGuideStyle';
    style.textContent = '@keyframes fadeInOut{0%{opacity:0;transform:translate(-50%,-50%) scale(0.8)}15%{opacity:1;transform:translate(-50%,-50%) scale(1)}75%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) scale(1.1)}}';
    document.head.appendChild(style);
  }

  setTimeout(function() {
    if (guide.parentNode) guide.remove();
  }, 3200);
}
