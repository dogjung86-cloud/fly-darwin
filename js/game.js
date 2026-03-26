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

///////////////

// SOUND EFFECTS (Web Audio API - no external files needed)
var audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // 브라우저 자동재생 정책 대응: suspended 상태이면 resume
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playPowerupSound() {
  try {
    var ctx = getAudioCtx();
    var now = ctx.currentTime;

    // 상승하는 음계 (파워업 느낌)
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

    // 임팩트 톤
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

    // 크래시 노이즈
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
  try {
    var ctx = getAudioCtx();
    var now = ctx.currentTime;

    // 1) 강력한 저음 펀치
    var osc1 = ctx.createOscillator();
    var gain1 = ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(180, now);
    osc1.frequency.exponentialRampToValueAtTime(50, now + 0.2);
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // 2) 상승하는 밝은 톤 (시원한 파괴)
    var osc2 = ctx.createOscillator();
    var gain2 = ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(500, now + 0.03);
    osc2.frequency.exponentialRampToValueAtTime(1500, now + 0.15);
    gain2.gain.setValueAtTime(0.1, now + 0.03);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.03);
    osc2.stop(now + 0.3);

    // 3) 금속성 노이즈 크래시
    var bufferSize = ctx.sampleRate * 0.2;
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.5);
    }
    var noise = ctx.createBufferSource();
    noise.buffer = buffer;
    var gainN = ctx.createGain();
    gainN.gain.setValueAtTime(0.13, now);
    gainN.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    var filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2500;
    noise.connect(filter);
    filter.connect(gainN);
    gainN.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.25);
  } catch(e) {}
}

function playCoinSound() {
  try {
    var ctx = getAudioCtx();
    var now = ctx.currentTime;

    // 짧은 "딩!" 동전 사운드
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

          // 특수 장애물 스폰 추적
          fireWallLastSpawn:0,
          distanceForFireWallSpawn:200,
          blackHoleActive:false,
          blackHoleSlowFactor:1.0,
          flyingAsteroidLastSpawn:0,
          distanceForFlyingAsteroidSpawn:120,
          waterPillarLastSpawn:0,
          distanceForWaterPillarSpawn:150,

          // Turbulence (난기류)
          turbulenceActive: false,
          turbulenceLevel: 0,       // 0: 없음, 1~3: 강도
          turbulenceTimer: 0,
          turbulenceDuration: 4000,  // 4초간 지속
          turbulenceTriggered: [],   // 이미 트리거된 거리 목록
          turbulenceCamShake: {x:0, y:0},

          // Bird Strike (버드스트라이크)
          birdStrikeActive: false,
          birdStrikePhase: '', // 'warning', 'dodging', 'result'
          birdStrikeTimer: 0,
          birdStrikeTriggered: [],
          birdStrikeHit: false,
          birdStrikeSavedSpeed: 0,

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
          invincibleDuration : 5000, // 5초
          invincibleFruitDistanceTolerance : 18,
          invincibleFruitSpeed : 0.4,
          invincibleFruitLastSpawn : 0,
          distanceForInvincibleSpawn : 900,

          heartItemLastSpawn : 0,
          distanceForHeartItemSpawn : 800,
         };
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

// 모바일 감지
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
    // 일시정지 버튼/오버레이 터치 시에는 preventDefault 하지 않음
    if (target.id === 'mobilePauseBtn' || target.id === 'pauseOverlay' || target.closest('#pauseOverlay')) {
      return;
    }
    event.preventDefault();
    var tx = -1 + (event.touches[0].pageX / WIDTH)*2;
    var ty = 1 - (event.touches[0].pageY / HEIGHT)*2;
    mousePos = {x:tx, y:ty};
}

function handleTouchMove(event) {
    event.preventDefault();
    var tx = -1 + (event.touches[0].pageX / WIDTH)*2;
    var ty = 1 - (event.touches[0].pageY / HEIGHT)*2;
    mousePos = {x:tx, y:ty};
}

function handleMouseUp(event){
  // Replay is handled by overlay buttons now
}


function handleTouchEnd(event){
  // Replay is handled by overlay buttons now
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

  // Mace ball (dark iron sphere)
  var ballGeom = new THREE.BoxGeometry(14,14,14,1,1,1);
  var ballMat = new THREE.MeshPhongMaterial({
    color:0x333333,
    shininess:30,
    specular:0x666666,
    shading:THREE.FlatShading
  });
  var ball = new THREE.Mesh(ballGeom, ballMat);
  this.mesh.add(ball);

  // Spikes (sharp cones around the ball)
  var spikeMat = new THREE.MeshPhongMaterial({
    color:0x555555,
    shininess:40,
    specular:0x999999,
    shading:THREE.FlatShading
  });
  var spikePositions = [
    [10,0,0], [-10,0,0], [0,10,0], [0,-10,0], [0,0,10], [0,0,-10],
    [7,7,0], [-7,7,0], [7,-7,0], [-7,-7,0], [0,7,7], [0,-7,-7]
  ];
  for (var i=0; i<spikePositions.length; i++){
    var spikeGeom = new THREE.BoxGeometry(3,8,3,1,1,1);
    spikeGeom.vertices[4].x = 0; spikeGeom.vertices[4].z = 0;
    spikeGeom.vertices[5].x = 0; spikeGeom.vertices[5].z = 0;
    spikeGeom.vertices[6].x = 0; spikeGeom.vertices[6].z = 0;
    spikeGeom.vertices[7].x = 0; spikeGeom.vertices[7].z = 0;
    var spike = new THREE.Mesh(spikeGeom, spikeMat);
    spike.position.set(spikePositions[i][0], spikePositions[i][1], spikePositions[i][2]);
    spike.lookAt(new THREE.Vector3(spikePositions[i][0]*2, spikePositions[i][1]*2, spikePositions[i][2]*2));
    spike.castShadow = true;
    this.mesh.add(spike);
  }

  this.mesh.castShadow = true;
  this.angle = 0;
  this.dist = 0;
  this.type = 'mace';
}

// 소행성 장애물 (레벨 3+)
Asteroid = function(){
  this.mesh = new THREE.Object3D();

  // 불규칙한 바위 덩어리
  var rockMat = new THREE.MeshPhongMaterial({
    color: 0x8B7355,
    shininess: 10,
    specular: 0x444444,
    shading: THREE.FlatShading
  });

  // 큰 중앙 바위
  var mainGeom = new THREE.BoxGeometry(18, 16, 18, 1, 1, 1);
  // 꼭짓점을 랜덤하게 변형하여 불규칙한 형태 생성
  for (var i = 0; i < mainGeom.vertices.length; i++) {
    mainGeom.vertices[i].x += (Math.random() - 0.5) * 4;
    mainGeom.vertices[i].y += (Math.random() - 0.5) * 4;
    mainGeom.vertices[i].z += (Math.random() - 0.5) * 4;
  }
  var mainRock = new THREE.Mesh(mainGeom, rockMat);
  this.mesh.add(mainRock);

  // 작은 바위 돌기들
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

  // 붉은 빛나는 균열 효과
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

// 번개구름 장애물 (레벨 2+) - 복셀 스타일
ThunderCloud = function(){
  this.mesh = new THREE.Object3D();

  // 먹구름 본체 - 여러 겹으로 두텁게
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

  // 아래층 (넓은 어두운 바닥)
  var mats = [darkMat, midMat, lightMat];
  var layers = [
    { y: 0, count: 8, sizeRange: [8, 14], spread: 30, mat: darkMat },
    { y: 6, count: 10, sizeRange: [7, 13], spread: 28, mat: darkMat },
    { y: 12, count: 8, sizeRange: [8, 12], spread: 22, mat: midMat },
    { y: 18, count: 6, sizeRange: [6, 10], spread: 16, mat: lightMat },
    { y: 22, count: 3, sizeRange: [5, 8], spread: 10, mat: lightMat }
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

  // 번개 발광 중심부 (구름 아래쪽에 노란 빛)
  var glowMat = new THREE.MeshPhongMaterial({
    color: 0xFFFF88,
    emissive: 0xFFDD44,
    emissiveIntensity: 0.8,
    transparent: true,
    opacity: 0.7,
    shading: THREE.FlatShading
  });
  var glowGeom = new THREE.BoxGeometry(8, 3, 8);
  var glow = new THREE.Mesh(glowGeom, glowMat);
  glow.position.set(0, -2, 0);
  this.mesh.add(glow);

  // 번개 볼트 (여러 갈래 지그재그)
  var boltMat = new THREE.MeshPhongMaterial({
    color: 0xFFFF00,
    emissive: 0xFFCC00,
    emissiveIntensity: 0.8,
    shading: THREE.FlatShading,
    transparent: true,
    opacity: 0.9
  });

  this.bolts = [];

  // 3갈래 번개
  for (var b = 0; b < 3; b++) {
    var boltGroup = new THREE.Object3D();
    var offsetX = (b - 1) * 8 + (Math.random() - 0.5) * 4;
    var segments = 3 + Math.floor(Math.random() * 2);
    var curY = -5;
    for (var s = 0; s < segments; s++) {
      var len = 6 + Math.random() * 5;
      var w = 3 - s * 0.4;
      if (w < 1) w = 1;
      var segGeom = new THREE.BoxGeometry(w, len, w);
      var seg = new THREE.Mesh(segGeom, boltMat);
      seg.position.set(
        offsetX + (Math.random() - 0.5) * 6,
        curY - len/2,
        (Math.random() - 0.5) * 3
      );
      seg.rotation.z = (Math.random() - 0.5) * 0.6;
      boltGroup.add(seg);
      curY -= len * 0.75;
    }
    this.mesh.add(boltGroup);
    this.bolts.push(boltGroup);
  }

  // 떨어지는 작은 파편 블록
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
  this.angle = 0;
  this.dist = 0;
  this.type = 'thunder';
  this.flashTimer = 0;
}

// 날아오는 소행성 (레벨 3+) — 오른쪽에서 왼쪽으로 빠르게 날아옴
FlyingAsteroid = function(){
  this.mesh = new THREE.Object3D();

  // 둥근 암석 바디 (SphereGeometry + vertex 변형)
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

  // 표면 돌기 (작은 구체들)
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

  // 빛나는 꼬리 (화염 효과)
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
  // 비행 관련 속성
  this.speed = 4 + Math.random() * 2; // 수평 이동속도
  this.alive = true;
}

// 물기둥 (레벨 4+) — 원기둥 분수, 상단 버섯형 퍼짐
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

  // 메인 원기둥 (굵은 중심 + 주변 얇은 기둥들)
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

  // 상단 버섯형 퍼짐 (넓은 원반 + 아래로 흘러내리는 블록)
  var capMat = new THREE.MeshPhongMaterial({
    color: 0x90E8C8, transparent: true, opacity: 0.5, shading: THREE.FlatShading
  });
  var capGeom = new THREE.CylinderGeometry(6, 18, 8, 8);
  var cap = new THREE.Mesh(capGeom, capMat);
  cap.position.y = pillarHeight + 2;
  cap.castShadow = true;
  this.mesh.add(cap);

  // 버섯 모자 아래 흘러내리는 물줄기
  for (var j = 0; j < 10; j++) {
    var ja = (j / 10) * Math.PI * 2;
    var jDist = 12 + Math.random() * 8;
    var jh = pillarHeight * 0.3 + Math.random() * pillarHeight * 0.5;
    var jGeom = new THREE.CylinderGeometry(0.8, 0.3, jh, 4);
    var jet = new THREE.Mesh(jGeom, waterDarkMat);
    jet.position.set(Math.cos(ja) * jDist, jh / 2, Math.sin(ja) * jDist);
    this.mesh.add(jet);
  }

  // 바닥 스플래시
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

// 화염벽 (레벨 5+) — 작은 블록 벽 + 가운데 통과 구멍 (메시 원점 기준)
FireWall = function(){
  this.mesh = new THREE.Object3D();

  var colors = [
    new THREE.MeshPhongMaterial({ color: 0xCC3300, emissive: 0x881100, emissiveIntensity: 0.3, shading: THREE.FlatShading }),
    new THREE.MeshPhongMaterial({ color: 0xFF4500, emissive: 0xCC2200, emissiveIntensity: 0.4, shading: THREE.FlatShading }),
    new THREE.MeshPhongMaterial({ color: 0xFF6600, emissive: 0xDD4400, emissiveIntensity: 0.3, shading: THREE.FlatShading }),
    new THREE.MeshPhongMaterial({ color: 0xFF8C00, emissive: 0xCC6600, emissiveIntensity: 0.3, shading: THREE.FlatShading }),
    new THREE.MeshPhongMaterial({ color: 0xFFAA33, emissive: 0xDD8800, emissiveIntensity: 0.2, shading: THREE.FlatShading })
  ];

  // 구멍 중심 (메시 원점 기준, -15 ~ +15 범위)
  var gapCenter = (Math.random() - 0.5) * 30;
  var gapSize = 50;
  this.gapCenter = gapCenter;
  this.gapSize = gapSize;

  // 위쪽 벽 (구멍 위) - 빽빽한 블록
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

  // 아래쪽 벽 (구멍 아래) - 빽빽한 블록
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

  // 구멍 경계 노란 발광 블록
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

// 블랙홀 (레벨 6+) — 소용돌이 + 등장 시 30% 감속
BlackHole = function(){
  this.mesh = new THREE.Object3D();

  // 중심 코어 (검은 구체)
  var coreMat = new THREE.MeshPhongMaterial({
    color: 0x000000,
    shininess: 100,
    specular: 0x111111,
    shading: THREE.FlatShading
  });
  var coreGeom = new THREE.BoxGeometry(10, 10, 10, 1, 1, 1);
  var core = new THREE.Mesh(coreGeom, coreMat);
  this.mesh.add(core);

  // 강착원반 (오렌지+노란 회전 링)
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

  // 주변에 흩날리는 파편
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
  var nEnnemies = 3; // 개수는 고정, 종류가 레벨별로 증가

  for (var i=0; i<nEnnemies; i++){
    var ennemy;

    // 레벨별 장애물 종류 결정 (가중치 기반)
    var roll = Math.random();
    var chosenType = 'mace';

    if (game.level >= 6 && roll < 0.03) {
      chosenType = 'blackHole'; // 3% 확률
    } else {
      var availableTypes = [];
      if (game.level >= 5) {
        // Lv5+: 철퇴 30%, 기타 70%
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
        // 화염벽 최소 간격 체크
        if (Math.floor(game.distance) - game.fireWallLastSpawn < game.distanceForFireWallSpawn) {
          ennemy = new Ennemy(); // 간격 부족하면 철퇴
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
    ennemy.distance = game.seaRadius + game.planeDefaultHeight + (-1 + Math.random() * 2) * (game.planeAmpHeight-20);
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

    // 물기둥은 지면(바다 표면)에 고정
    if (ennemy.type === 'waterPillar') {
      ennemy.distance = game.seaRadius + 5;
    }
    ennemy.mesh.position.y = -game.seaRadius + Math.sin(ennemy.angle)*ennemy.distance;
    ennemy.mesh.position.x = Math.cos(ennemy.angle)*ennemy.distance;
    // 화염벽/물기둥은 회전하지 않고 고정 자세 유지
    if (ennemy.type !== 'fireWall' && ennemy.type !== 'waterPillar') {
      ennemy.mesh.rotation.z += Math.random()*.1;
      ennemy.mesh.rotation.y += Math.random()*.1;
    }

    // 번개구름 깜빡임 + 상하 이동 효과
    if (ennemy.type === 'thunder') {
      ennemy.flashTimer = (ennemy.flashTimer || 0) + deltaTime;
      // 상하 이동
      ennemy.distance = (game.seaRadius + game.planeDefaultHeight) + Math.sin(ennemy.flashTimer * 0.004) * 30;
      if (ennemy.bolts) {
        var flash = Math.sin(ennemy.flashTimer * 0.01) > 0.3;
        for (var b = 0; b < ennemy.bolts.length; b++) {
          ennemy.bolts[b].visible = flash;
        }
      }
    }

    // 블랙홀 강착원반 회전 + 근접 슬로우 모션
    if (ennemy.type === 'blackHole') {
      ennemy.rotTimer = (ennemy.rotTimer || 0) + deltaTime;
      if (ennemy.rings) {
        for (var r = 0; r < ennemy.rings.length; r++) {
          ennemy.rings[r].rotation.z += 0.002 * deltaTime * (1 + r * 0.3);
        }
      }
      // 비행기와 블랙홀 사이의 거리 계산
      var bhWorldPos = ennemy.mesh.position.clone();
      ennemiesHolder.mesh.updateMatrixWorld();
      bhWorldPos.applyMatrix4(ennemiesHolder.mesh.matrixWorld);
      var distToPlane = airplane.mesh.position.distanceTo(bhWorldPos);

      var slowRadius = 200; // 슬로우 효과 범위
      var maxSlow = 0.12;   // 최대 슬로우 (가장 가까울 때, 원래의 12% 속도)

      if (distToPlane < slowRadius) {
        // 거리에 비례: 가까울수록 더 느려짐 (1.0 → maxSlow)
        var ratio = distToPlane / slowRadius; // 0(매우가까움) ~ 1(경계)
        game.blackHoleSlowFactor = maxSlow + (1.0 - maxSlow) * ratio;
        game.blackHoleActive = true;
        ennemy.hasAppliedSlow = true;
      } else if (ennemy.hasAppliedSlow) {
        // 범위를 벗어나면 즉시 해제
        game.blackHoleSlowFactor = 1.0;
        game.blackHoleActive = false;
      }
    }

    // 물기둥 기둥 높이 애니메이션
    if (ennemy.type === 'waterPillar' && ennemy.pillars) {
      ennemy.animTimer = (ennemy.animTimer || 0) + deltaTime;
      for (var p = 0; p < ennemy.pillars.length; p++) {
        var scaleY = 0.8 + Math.sin(ennemy.animTimer * 0.003 + p * 0.5) * 0.3;
        ennemy.pillars[p].scale.y = scaleY;
      }
    }

    // 화염벽 블록 흘러내림 애니메이션
    if (ennemy.type === 'fireWall') {
      ennemy.fireTimer = (ennemy.fireTimer || 0) + deltaTime;
      var children = ennemy.mesh.children;
      for (var f = 0; f < children.length; f++) {
        children[f].position.y += Math.sin(ennemy.fireTimer * 0.005 + f * 0.7) * 0.15;
        children[f].position.x += Math.sin(ennemy.fireTimer * 0.003 + f * 1.2) * 0.05;
      }
    }

    // 충돌 체크
    var diffPos = airplane.mesh.position.clone().sub(ennemy.mesh.position.clone());
    var d = diffPos.length();

    // 물기둥은 수평 거리 + 높이 범위 체크 (물기둥 위를 넘어가면 통과)
    if (ennemy.type === 'waterPillar') {
      var planeRelY = airplane.mesh.position.y - ennemy.mesh.position.y;
      if (planeRelY > 90) {
        d = 9999; // 물기둥 위를 지나감 - 충돌 없음
      } else {
        d = Math.sqrt(diffPos.x * diffPos.x + diffPos.z * diffPos.z);
      }
    }

    // 화염벽은 수평 거리로 충돌 판정 (위아래로 넓게 펼쳐진 벽)
    if (ennemy.type === 'fireWall') {
      d = Math.sqrt(diffPos.x * diffPos.x + diffPos.z * diffPos.z);
    }

    var collisionDist = game.ennemyDistanceTolerance;
    if (ennemy.type === 'fireWall') collisionDist = 15;
    if (ennemy.type === 'thunder') collisionDist = 18;
    if (ennemy.type === 'waterPillar') collisionDist = 20;
    if (ennemy.type === 'blackHole') collisionDist = 15;

    if (d < collisionDist){
      // 블랙홀은 충돌 없이 통과 (슬로우 모션만 적용)
      if (ennemy.type === 'blackHole') {
        continue;
      }
      // 화염벽: 구멍 안이거나 벽 위쪽 위를 넘으면 통과
      if (ennemy.type === 'fireWall') {
        var planeLocalY = airplane.mesh.position.y - ennemy.mesh.position.y;
        // 구멍 안을 통과
        if (Math.abs(planeLocalY - ennemy.gapCenter) < ennemy.gapSize / 2) {
          continue;
        }
        // 벽 위쪽 위를 넘어감 (위쪽 블록 최상단보다 높으면 통과)
        var wallTopEnd = ennemy.gapCenter + ennemy.gapSize / 2 + 80;
        if (planeLocalY > wallTopEnd) {
          continue;
        }
      }

      if (game.invincible) {
        var colors = { thunder: 0xFFFF00, asteroid: 0xFF4500, waterPillar: 0x6B9DAD, fireWall: 0xFF4500, blackHole: 0xFF8C00 };
        var pColor = colors[ennemy.type] || 0xFFD700;
        particlesHolder.spawnParticles(ennemy.mesh.position.clone(), 20, pColor, 2);
        // 블랙홀 파괴 시 슬로우 해제
        if (ennemy.type === 'blackHole') {
          game.blackHoleSlowFactor = 1.0;
          game.blackHoleActive = false;
        }
        this.ennemiesInUse.splice(i,1);
        this.mesh.remove(ennemy.mesh);
        playInvincibleSmashSound();
        i--;
      } else {
        var hitColors = { thunder: 0xFFFF00, asteroid: 0x8B7355, waterPillar: 0x6B9DAD, fireWall: 0xFF4500, blackHole: 0xFF8C00 };
        var hColor = hitColors[ennemy.type] || 0x333333;
        particlesHolder.spawnParticles(ennemy.mesh.position.clone(), 15, hColor, 3);
        // 블랙홀 파괴 시 슬로우 해제
        if (ennemy.type === 'blackHole') {
          game.blackHoleSlowFactor = 1.0;
          game.blackHoleActive = false;
        }
        this.ennemiesInUse.splice(i,1);
        this.mesh.remove(ennemy.mesh);
        // 물기둥/화염벽은 넉백을 약하게 (수평 거리 체크라 Y차이가 큼)
        if (ennemy.type === 'waterPillar' || ennemy.type === 'fireWall') {
          game.planeCollisionSpeedX = 30 * diffPos.x / d;
          game.planeCollisionSpeedY = 20;
        } else {
          game.planeCollisionSpeedX = 100 * diffPos.x / d;
          game.planeCollisionSpeedY = 100 * diffPos.y / d;
        }
        ambientLight.intensity = 2;

        // 번개구름/화염벽은 에너지 2배 감소
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
      // 블랙홀이 사라지면 슬로우 해제
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

// ===== 날아오는 소행성 전용 관리 (직선 이동) =====
var flyingAsteroids = [];

function spawnFlyingAsteroid() {
  var asteroid = new FlyingAsteroid();
  // 화면 오른쪽 밖에서 시작
  asteroid.mesh.position.x = 250;
  // 비행체 높이 근처 랜덤 y
  asteroid.mesh.position.y = game.planeDefaultHeight + (Math.random() - 0.5) * game.planeAmpHeight;
  asteroid.mesh.position.z = -50 + Math.random() * 100;
  scene.add(asteroid.mesh);
  flyingAsteroids.push(asteroid);
}

function updateFlyingAsteroids() {
  for (var i = flyingAsteroids.length - 1; i >= 0; i--) {
    var a = flyingAsteroids[i];
    // 오른쪽에서 왼쪽으로 빠르게 이동
    a.mesh.position.x -= a.speed * deltaTime * 0.1;
    a.mesh.rotation.z += 0.02 * deltaTime * 0.1;
    a.mesh.rotation.y += 0.015 * deltaTime * 0.1;

    // 비행체와 충돌 체크
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
        playDestroySound();
        removeEnergy();
      }
      scene.remove(a.mesh);
      flyingAsteroids.splice(i, 1);
      continue;
    }

    // 화면 밖으로 나가면 제거
    if (a.mesh.position.x < -300) {
      scene.remove(a.mesh);
      flyingAsteroids.splice(i, 1);
    }
  }
}

// ===== 레벨업 텍스트 표시 =====
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
  // TheAviator2 스타일 동전 (금색 원통)
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

  var nCoins = 1 + Math.floor(Math.random()*10);
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

  // 별 모양 코어 (금빛 구체)
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

  // 스파이크 (별 빛살)
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
    // 뾰족하게
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

  // 장애물과 겹치지 않는 위치 찾기
  var safeDistance = 0;
  var attempts = 0;
  var minSeparation = 40; // 장애물과 최소 이격 거리
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
    // 빙글빙글 회전 + 떠다니는 효과
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

  // THREE.Shape으로 실제 하트 곡선 생성
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
  heart.rotation.z = Math.PI; // 뒤집어서 하트 모양
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
  // 하트가 이미 최대면 스폰하지 않음
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
  game.invincibleTime = game.invincibleDuration;

  // 비행체에 금빛 글로우 추가
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

  // 글로우 깜빡임 (마지막 1초)
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

// 재귀적으로 모든 Mesh 자식을 수집
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

// 메시의 월드(로컬 기준) 위치를 부모 기준으로 가져오기
function getLocalTransform(mesh, rootParent) {
  var pos = new THREE.Vector3();
  var scale = new THREE.Vector3();
  var quat = new THREE.Quaternion();
  
  // 임시로 월드 매트릭스를 업데이트해서 루트 기준 좌표를 구함
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
  div.textContent = '✦ Evolution ✦';
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
  // 이미 변신 중이면 무시
  if (game.transforming) return;
  game.transforming = true;
  
  // 비행체 진화 텍스트 표시
  showEvolutionText();
  
  var oldAirplane = airplane;
  var oldPos = airplane.mesh.position.clone();
  var oldRot = airplane.mesh.rotation.clone();
  var oldScale = airplane.mesh.scale.clone();
  
  // 기존 비행체의 모든 메시 블록 수집
  var oldMeshes = collectMeshes(oldAirplane.mesh);
  var oldTransforms = [];
  for (var i = 0; i < oldMeshes.length; i++) {
    oldTransforms.push(getLocalTransform(oldMeshes[i], oldAirplane.mesh));
  }
  
  // 새 비행체 생성 (아직 씬에 추가 안 함)
  var newAirplane = createNewCharacter(newFormString);
  newAirplane.mesh.scale.copy(oldScale);
  newAirplane.mesh.position.copy(oldPos);
  newAirplane.mesh.rotation.copy(oldRot);
  
  var newMeshes = collectMeshes(newAirplane.mesh);
  var newTransforms = [];
  for (var i = 0; i < newMeshes.length; i++) {
    newTransforms.push(getLocalTransform(newMeshes[i], newAirplane.mesh));
  }
  
  // 변신 컨테이너: 기존 비행체를 제거하고, flat한 블록들로 구성
  scene.remove(oldAirplane.mesh);
  
  var morphContainer = new THREE.Object3D();
  morphContainer.position.copy(oldPos);
  morphContainer.rotation.copy(oldRot);
  morphContainer.scale.copy(oldScale);
  scene.add(morphContainer);
  
  // 기존 블록들을 morphContainer의 직속 자식으로 재배치
  var morphBlocks = [];
  for (var i = 0; i < oldMeshes.length; i++) {
    var block = oldMeshes[i];
    var t = oldTransforms[i];
    
    // 새 메시를 만들어서 같은 geometry와 material clone 사용
    var newMat = block.material.clone();
    var morphBlock = new THREE.Mesh(block.geometry.clone(), newMat);
    morphBlock.position.set(t.x, t.y, t.z);
    morphBlock.rotation.set(t.rx, t.ry, t.rz);
    morphBlock.scale.set(t.sx, t.sy, t.sz);
    morphBlock.castShadow = true;
    
    morphContainer.add(morphBlock);
    morphBlocks.push(morphBlock);
  }
  
  // 블록 수가 다를 때 처리
  var maxBlocks = Math.max(oldTransforms.length, newTransforms.length);
  
  // 새 형태의 블록이 더 많으면: 추가 블록을 중앙에서 생성
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
  
  // 애니메이션 시간
  var morphDuration = 1.2;
  var completedCount = 0;
  
  for (var i = 0; i < maxBlocks; i++) {
    var block = morphBlocks[i];
    var delay = Math.random() * 0.3;
    
    if (i < newTransforms.length) {
      // 목표가 있는 블록: 새 위치/크기/색으로 이동
      var target = newTransforms[i];
      
      // 위치 애니메이션
      TweenMax.to(block.position, morphDuration, {
        x: target.x, y: target.y, z: target.z,
        delay: delay,
        ease: Power2.easeInOut
      });
      
      // 회전 애니메이션
      TweenMax.to(block.rotation, morphDuration, {
        x: target.rx, y: target.ry, z: target.rz,
        delay: delay,
        ease: Power2.easeInOut
      });
      
      // 스케일 애니메이션
      TweenMax.to(block.scale, morphDuration, {
        x: target.sx, y: target.sy, z: target.sz,
        delay: delay,
        ease: Power2.easeInOut
      });
      
      // 색상 애니메이션
      var targetColor = new THREE.Color(target.color);
      TweenMax.to(block.material.color, morphDuration, {
        r: targetColor.r, g: targetColor.g, b: targetColor.b,
        delay: delay,
        ease: Power2.easeInOut,
        onUpdate: function() { this.target.material && (this.target.material.needsUpdate = true); }.bind({target: block})
      });
      
    } else {
      // 남는 블록: 축소되며 사라짐
      TweenMax.to(block.scale, morphDuration * 0.6, {
        x: 0.01, y: 0.01, z: 0.01,
        delay: delay,
        ease: Power2.easeIn
      });
    }
    
    // 마지막 블록의 완료 콜백으로 전환 마무리
    if (i === maxBlocks - 1) {
      TweenMax.to({}, morphDuration + 0.35, {
        onComplete: function() {
          // morphContainer 제거
          scene.remove(morphContainer);
          
          // 실제 새 비행체로 교체
          airplane = newAirplane;
          airplane.mesh.position.copy(morphContainer.position);
          airplane.mesh.rotation.copy(morphContainer.rotation);
          airplane.mesh.scale.copy(morphContainer.scale);
          scene.add(airplane.mesh);
          
          game.currentForm = newFormString;
          game.transforming = false;
          
          // 파티클 이펙트 (변신 완료 강조)
          particlesHolder.spawnParticles(airplane.mesh.position.clone(), 15, 0xFFFFFF, 1.2);
          
          // 무적 상태가 활성화되어 있으면 글로우를 새 비행체에 다시 붙여줌
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
  
  // morphContainer가 airplane과 동일하게 움직이도록 임시 airplane 설정
  // propeller와 pilot이 필요하므로 더미 설정
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

  // 블랙홀 슬로우 모션: deltaTime 자체에 적용하여 전체 게임 슬로우
  if (game.blackHoleActive) {
    deltaTime *= game.blackHoleSlowFactor;
  }

  if (game.status=="waiting"){
    // 시작 화면 대기: 씬만 렌더링하고, 구름/파도 애니메이션만 유지
    sky.moveClouds();
    sea.moveWaves();
    sea.mesh.rotation.z += 0.0001 * deltaTime;
    // 비행체 상하 부유 애니메이션
    airplane.mesh.position.y = game.planeDefaultHeight + Math.sin(Date.now() * 0.0015) * 3;
    airplane.propeller.rotation.x += 0.05;
    if (airplane.updateWings) airplane.updateWings();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
    return;
  }

  if (game.status=="playing"){

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

    // Spawn heart item
    if (Math.floor(game.distance)%game.distanceForHeartItemSpawn == 0 && Math.floor(game.distance) > game.heartItemLastSpawn){
      game.heartItemLastSpawn = Math.floor(game.distance);
      heartItemHolder.spawnItem();
    }

    if (Math.floor(game.distance)%game.distanceForSpeedUpdate == 0 && Math.floor(game.distance) > game.speedLastUpdate){
      game.speedLastUpdate = Math.floor(game.distance);
      game.targetBaseSpeed += game.incrementSpeedByTime*deltaTime;
    }


    if (Math.floor(game.distance)%game.distanceForEnnemiesSpawn == 0 && Math.floor(game.distance) > game.ennemyLastSpawn){
      game.ennemyLastSpawn = Math.floor(game.distance);
      ennemiesHolder.spawnEnnemies();
    }

    // 날아오는 소행성 스폰 (Lv3+)
    if (game.level >= 3 && Math.floor(game.distance) - game.flyingAsteroidLastSpawn >= game.distanceForFlyingAsteroidSpawn){
      game.flyingAsteroidLastSpawn = Math.floor(game.distance);
      spawnFlyingAsteroid();
    }

    // 날아오는 소행성 업데이트
    updateFlyingAsteroids();

    var expectedLevel = Math.floor(game.distance / game.distanceForLevelUpdate) + 1;
    if (expectedLevel > game.level){
      game.level = expectedLevel;
      fieldLevel.innerHTML = Math.floor(game.level);
      showLevelUpText(game.level);

      game.targetBaseSpeed = game.initSpeed + game.incrementSpeedByLevel*game.level
    }

    // Checking for Transformation (상점 비행체 선택 시 진화 없음)
    if (!shopState.selectedVehicle) {
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
    checkBirdStrikeTrigger();
    updateBirdStrike();
    updatePlane();
    updateDistance();
    updateHearts();
    game.baseSpeed += (game.targetBaseSpeed - game.baseSpeed) * deltaTime * 0.02;
    if (game.baseSpeed > game.maxSpeed) game.baseSpeed = game.maxSpeed;
    // 블랙홀 슬로우모션 적용
    game.speed = game.baseSpeed * game.planeSpeed;

  }else if(game.status=="gameover"){
    game.speed *= .99;
    airplane.mesh.rotation.z += (-Math.PI/2 - airplane.mesh.rotation.z)*.0002*deltaTime;
    airplane.mesh.rotation.x += 0.0003*deltaTime;
    game.planeFallSpeed *= 1.05;
    airplane.mesh.position.y -= game.planeFallSpeed*deltaTime;

    if (airplane.mesh.position.y <-200){
      // 컨티뉴 가능하면 컨티뉴 선택 화면, 아니면 바로 게임오버
      showContinuePrompt();
      game.status = "continuePrompt";
    }
  }else if(game.status=="continuePrompt"){
    // 컨티뉴 선택 대기 중: 비행기 부유 + 씬 렌더링 유지
    sky.moveClouds();
    sea.moveWaves();
    sea.mesh.rotation.z += 0.0001 * deltaTime;

  }else if (game.status=="waitingReplay"){

  }

  // 버드스트라이크 중에는 배경 요소 정지, 새떼+비행기만 업데이트
  if (game.birdStrikeActive && game.birdStrikePhase !== 'warning') {
    // 비행기 상하 조작만 유지 (새떼 회피용)
    var bsMouseY = mousePos.y;
    var bsTargetY = normalize(bsMouseY, -.75, .75, game.planeDefaultHeight - game.planeAmpHeight, game.planeDefaultHeight + game.planeAmpHeight);
    airplane.mesh.position.y += (bsTargetY - airplane.mesh.position.y) * deltaTime * game.planeMoveSensivity;
    airplane.mesh.rotation.z = (bsTargetY - airplane.mesh.position.y) * deltaTime * game.planeRotXSensivity;
    camera.position.y += (airplane.mesh.position.y - camera.position.y) * deltaTime * game.cameraSensivity;
    airplane.propeller.rotation.x += .1;
    if (airplane.updateWings) airplane.updateWings();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
    return;
  }

  airplane.propeller.rotation.x +=.2 + game.planeSpeed * deltaTime*.005;
  if (airplane.updateWings) airplane.updateWings();
  sea.mesh.rotation.z += game.speed*deltaTime;

  if ( sea.mesh.rotation.z > 2*Math.PI)  sea.mesh.rotation.z -= 2*Math.PI;

  ambientLight.intensity += (.5 - ambientLight.intensity)*deltaTime*0.005;

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
  // 하트 UI 동적 업데이트
  var container = document.querySelector('.score__value--hearts');
  if (!container) return;

  // maxHearts가 변경되었으면 하트 요소 재생성
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
  // 여객기: 코인 X3
  if (shopState && shopState.selectedVehicle === 'Jetliner') {
    coinMultiplier = 3;
  }
  // 코인 부스터 업그레이드: X2
  if (shopState && shopState.purchasedUpgrades && shopState.purchasedUpgrades.indexOf('coinBooster') !== -1) {
    coinMultiplier *= 2;
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
    // 화면 중앙에 하트 표시 효과
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
  
  // 애니메이션: 크게 나타났다 사라짐
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
  game.hearts--;
  game.hearts = Math.max(0, game.hearts);
  updateHearts();
}



// ===== TURBULENCE (난기류) SYSTEM =====

var turbulenceTriggerDistances = [3000, 5500, 9000, 13000, 17000, 21000];

function getTurbulenceTriggerDistances() {
  // 21000m 이후에는 4000m 간격으로 계속 추가
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
  // 난기류 활성 중이면 타이머 업데이트
  if (game.turbulenceActive) {
    game.turbulenceTimer += deltaTime;
    if (game.turbulenceTimer >= game.turbulenceDuration) {
      // 난기류 종료
      game.turbulenceActive = false;
      game.turbulenceLevel = 0;
      game.turbulenceTimer = 0;
    }
    return;
  }

  // 트리거 거리 확인
  var triggers = getTurbulenceTriggerDistances();
  var dist = Math.floor(game.distance);
  for (var i = 0; i < triggers.length; i++) {
    var td = triggers[i];
    // 거리를 지났고, 아직 트리거 안 됐으면 발동
    if (dist >= td && game.turbulenceTriggered.indexOf(td) === -1) {
      game.turbulenceTriggered.push(td);
      // 레벨 1~3 랜덤
      game.turbulenceLevel = 1 + Math.floor(Math.random() * 3);
      game.turbulenceActive = true;
      game.turbulenceTimer = 0;
      showTurbulenceWarning(game.turbulenceLevel);
      // 난기류 사운드
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
  div.innerHTML = '⚠️ TURBULENCE Lv.' + level + '<br><span style="font-size:0.5em;letter-spacing:0.2em;">' + labels[level] + '</span>';
  div.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(0.5);' +
    'font-family:Playfair Display,serif;font-size:48px;font-weight:700;color:' + colors[level] + ';' +
    'text-align:center;pointer-events:none;z-index:1500;opacity:0;' +
    'text-shadow:0 0 30px rgba(0,0,0,0.8),0 4px 15px rgba(0,0,0,0.5);transition:none;';
  document.body.appendChild(div);

  // 애니메이션: 나타남 → 유지 → 사라짐
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
    // 저주파 럼블
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

// ===== BIRD STRIKE (버드스트라이크) EVENT =====

var birdStrikeTriggerDistances = [2200, 8200, 11200, 15800, 20200];
var birdStrikeFlockMesh = null;
var birdStrikeBirds = [];

function getBirdStrikeTriggerDistances() {
  var maxDist = Math.floor(game.distance) + 5000;
  var distances = birdStrikeTriggerDistances.slice();
  var last = distances[distances.length - 1];
  while (last + 5000 <= maxDist) {
    last += 5000;
    distances.push(last);
  }
  return distances;
}

// 복셀 새 한 마리 생성
function createBirdMesh() {
  var bird = new THREE.Object3D();
  var bodyMat = new THREE.MeshLambertMaterial({color: 0x2C2C2C});
  var wingMat = new THREE.MeshLambertMaterial({color: 0x444444});
  var beakMat = new THREE.MeshLambertMaterial({color: 0xFF8C00});

  // 몸통
  var body = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 3), bodyMat);
  bird.add(body);

  // 부리
  var beak = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 1), beakMat);
  beak.position.set(-3.5, 0.5, 0);
  bird.add(beak);

  // 왼쪽 날개
  var wingL = new THREE.Mesh(new THREE.BoxGeometry(3, 0.5, 8), wingMat);
  wingL.position.set(-0.5, 1, 4);
  bird.add(wingL);

  // 오른쪽 날개
  var wingR = new THREE.Mesh(new THREE.BoxGeometry(3, 0.5, 8), wingMat);
  wingR.position.set(-0.5, 1, -4);
  bird.add(wingR);

  bird._wingL = wingL;
  bird._wingR = wingR;
  bird._flapTimer = Math.random() * Math.PI * 2;

  return bird;
}

function checkBirdStrikeTrigger() {
  if (game.birdStrikeActive) return;
  var triggers = getBirdStrikeTriggerDistances();
  var dist = Math.floor(game.distance);
  for (var i = 0; i < triggers.length; i++) {
    var td = triggers[i];
    if (dist >= td && game.birdStrikeTriggered.indexOf(td) === -1) {
      game.birdStrikeTriggered.push(td);
      startBirdStrike();
      break;
    }
  }
}

function startBirdStrike() {
  game.birdStrikeActive = true;
  game.birdStrikePhase = 'warning';
  game.birdStrikeTimer = 0;
  game.birdStrikeHit = false;
  game.birdStrikeSavedSpeed = game.speed;

  // 경고 문구 표시
  showBirdStrikeWarning();

  // 어두운 오버레이 추가
  var overlay = document.createElement('div');
  overlay.id = 'birdStrikeDarkOverlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0);z-index:500;pointer-events:none;transition:background 1s ease;';
  document.body.appendChild(overlay);
  requestAnimationFrame(function() {
    overlay.style.background = 'rgba(0,0,0,0.35)';
  });

  // 경고 사운드
  playBirdStrikeWarningSound();
}

function showBirdStrikeWarning() {
  var existing = document.getElementById('birdStrikeWarning');
  if (existing) existing.remove();

  var div = document.createElement('div');
  div.id = 'birdStrikeWarning';
  div.innerHTML = '🐦 버드스트라이크 발생! 🐦<br><span style="font-size:0.45em;letter-spacing:0.15em;">위아래로 피하세요!</span>';
  div.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(0.5);' +
    'font-family:Playfair Display,serif;font-size:42px;font-weight:700;color:#FF4444;' +
    'text-align:center;pointer-events:none;z-index:1500;opacity:0;' +
    'text-shadow:0 0 30px rgba(255,0,0,0.5),0 4px 15px rgba(0,0,0,0.6);transition:none;';
  document.body.appendChild(div);

  requestAnimationFrame(function() {
    div.style.transition = 'all 0.5s ease-out';
    div.style.opacity = '1';
    div.style.transform = 'translate(-50%,-50%) scale(1)';
  });
}

function hideBirdStrikeWarning() {
  var div = document.getElementById('birdStrikeWarning');
  if (div) {
    div.style.transition = 'all 0.4s ease-in';
    div.style.opacity = '0';
    div.style.transform = 'translate(-50%,-50%) scale(1.5)';
    setTimeout(function() { if (div.parentNode) div.remove(); }, 500);
  }
}

function spawnBirdFlock() {
  // 이전 새떼 제거
  cleanupBirdFlock();

  birdStrikeFlockMesh = new THREE.Object3D();
  birdStrikeBirds = [];

  var baseY = airplane.mesh.position.y;

  // 1그룹 일렬 S자: 큰 진폭으로 비행 범위 전체 커버, Z=0 고정
  var numBirds = 100;
  var spacing = 16;
  var sAmplitude = 75;
  var sFrequency = 0.025;

  for (var i = 0; i < numBirds; i++) {
    var bird = createBirdMesh();
    var xPos = 200 + i * spacing;
    var yPos = baseY + Math.sin(i * sFrequency * Math.PI * 2) * sAmplitude;
    bird.position.set(xPos, yPos, 0);
    bird._speed = 0.10;
    bird._index = i;

    birdStrikeFlockMesh.add(bird);
    birdStrikeBirds.push(bird);
  }

  scene.add(birdStrikeFlockMesh);
}

function updateBirdStrike() {
  if (!game.birdStrikeActive) return;

  game.birdStrikeTimer += deltaTime;

  // Phase 1: 경고 (1.5초)
  if (game.birdStrikePhase === 'warning') {
    // 비행체 서서히 감속
    game.speed *= 0.95;
    if (game.birdStrikeTimer >= 1500) {
      game.birdStrikePhase = 'dodging';
      game.birdStrikeTimer = 0;
      game.speed = 0;
      hideBirdStrikeWarning();
      spawnBirdFlock();
    }
    return;
  }

  // Phase 2: 회피
  if (game.birdStrikePhase === 'dodging') {
    game.speed = 0; // 비행체 정지

    var allPassed = true;

    for (var i = 0; i < birdStrikeBirds.length; i++) {
      var bird = birdStrikeBirds[i];
      if (!bird.visible) continue;

      // 오른쪽에서 왼쪽으로 이동 (소행성처럼)
      bird.position.x -= bird._speed * deltaTime;

      // 날개 퍼덕임
      bird._flapTimer += deltaTime * 0.015;
      if (bird._wingL) {
        bird._wingL.rotation.x = Math.sin(bird._flapTimer) * 0.6;
        bird._wingR.rotation.x = -Math.sin(bird._flapTimer) * 0.6;
      }

      // 아직 화면에 있는 새가 있는지
      if (bird.position.x > -250) {
        allPassed = false;
      }

      // 충돌 체크 (비행기와의 거리)
      if (!game.birdStrikeHit) {
        var dx = airplane.mesh.position.x - bird.position.x;
        var dy = airplane.mesh.position.y - bird.position.y;
        var dz = airplane.mesh.position.z - bird.position.z;
        var birdDist = Math.sqrt(dx*dx + dy*dy + dz*dz);

        if (birdDist < 18) {
          game.birdStrikeHit = true;
          // 충돌 파티클
          particlesHolder.spawnParticles(bird.position.clone(), 15, 0x2C2C2C, 3);
          playDestroySound();
          // 카메라 흔들림
          game.planeCollisionSpeedY = 40;
          game.planeCollisionSpeedX = 20;
          removeEnergy();
        }
      }
    }

    // 모든 새가 지나갔거나 6초 경과
    if (allPassed || game.birdStrikeTimer >= 6000) {
      game.birdStrikePhase = 'result';
      game.birdStrikeTimer = 0;
    }
    return;
  }

  // Phase 3: 결과 (1.5초)
  if (game.birdStrikePhase === 'result') {
    if (game.birdStrikeTimer < 100) {
      // 결과 표시 (1회만)
      cleanupBirdFlock();
      if (!game.birdStrikeHit) {
        // 성공! 하트 2개 보상
        showBirdStrikeResult(true);
        addHeart();
        addHeart();
        playPowerupSound();
      } else {
        showBirdStrikeResult(false);
      }
    }

    // 속도 복원
    game.speed += (game.birdStrikeSavedSpeed - game.speed) * 0.05;

    if (game.birdStrikeTimer >= 1500) {
      // 이벤트 완전 종료
      game.birdStrikeActive = false;
      game.birdStrikePhase = '';
      game.speed = game.birdStrikeSavedSpeed;
      // 어두운 오버레이 제거
      var darkOv = document.getElementById('birdStrikeDarkOverlay');
      if (darkOv) {
        darkOv.style.transition = 'background 0.8s ease';
        darkOv.style.background = 'rgba(0,0,0,0)';
        setTimeout(function() { if (darkOv.parentNode) darkOv.remove(); }, 900);
      }
    }
  }
}

function showBirdStrikeResult(success) {
  var existing = document.getElementById('birdStrikeResult');
  if (existing) existing.remove();

  var div = document.createElement('div');
  div.id = 'birdStrikeResult';
  if (success) {
    div.innerHTML = '✅ CLEAR!<br><span style="font-size:0.5em;">❤️ +2</span>';
    div.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(0.5);' +
      'font-family:Playfair Display,serif;font-size:52px;font-weight:700;color:#44FF44;' +
      'text-align:center;pointer-events:none;z-index:1500;opacity:0;' +
      'text-shadow:0 0 30px rgba(0,255,0,0.5),0 4px 15px rgba(0,0,0,0.5);transition:none;';
  } else {
    div.innerHTML = '💥 HIT!';
    div.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(0.5);' +
      'font-family:Playfair Display,serif;font-size:52px;font-weight:700;color:#FF4444;' +
      'text-align:center;pointer-events:none;z-index:1500;opacity:0;' +
      'text-shadow:0 0 30px rgba(255,0,0,0.5),0 4px 15px rgba(0,0,0,0.5);transition:none;';
  }
  document.body.appendChild(div);

  requestAnimationFrame(function() {
    div.style.transition = 'all 0.4s ease-out';
    div.style.opacity = '1';
    div.style.transform = 'translate(-50%,-50%) scale(1)';
    setTimeout(function() {
      div.style.transition = 'all 0.5s ease-in';
      div.style.opacity = '0';
      setTimeout(function() { if (div.parentNode) div.remove(); }, 600);
    }, 1200);
  });
}

function cleanupBirdFlock() {
  if (birdStrikeFlockMesh) {
    scene.remove(birdStrikeFlockMesh);
    birdStrikeFlockMesh = null;
  }
  birdStrikeBirds = [];
}

function playBirdStrikeWarningSound() {
  try {
    var ctx = getAudioCtx();
    var now = ctx.currentTime;
    // 짧은 경고음 2번
    for (var i = 0; i < 2; i++) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = 800;
      gain.gain.setValueAtTime(0.1, now + i * 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.25 + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.25);
      osc.stop(now + i * 0.25 + 0.2);
    }
  } catch(e) {}
}

function updatePlane(){

  // 난기류 시 마우스 입력에 노이즈 추가
  var effMouseX = mousePos.x;
  var effMouseY = mousePos.y;
  if (game.turbulenceActive && game.turbulenceLevel > 0) {
    var noiseAmp = game.turbulenceLevel * 0.08; // Lv1:0.08, Lv2:0.16, Lv3:0.24
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

  airplane.mesh.position.y += (targetY-airplane.mesh.position.y)*deltaTime*game.planeMoveSensivity;
  airplane.mesh.position.x += (targetX-airplane.mesh.position.x)*deltaTime*game.planeMoveSensivity;

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

  // 난기류 카메라 흔들림
  if (game.turbulenceActive && game.turbulenceLevel > 0) {
    var shakeAmp = game.turbulenceLevel * 1.5; // Lv1:1.5, Lv2:3, Lv3:4.5
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

var RANKING_KEY = 'flyDarwinRankings'; // localStorage 폴백용
var MAX_RANKINGS = 100;
var currentPlayerRankIndex = -1;

// Supabase 클라이언트 초기화
var SUPABASE_URL = 'https://tehpoogyhjrkvcaeioge.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaHBvb2d5aGpya3ZjYWVpb2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzQxOTQsImV4cCI6MjA4OTU1MDE5NH0.saInJOZuegHGaEW-D0sikBAU-XwoHZkjMYvUWw4t4sE';
var supabaseClient = null;

function getSupabase() {
  if (!supabaseClient && window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

// localStorage 폴백 함수들
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

// Supabase 랭킹 함수들 (비동기)
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
    console.warn('Supabase 조회 실패, localStorage 폴백:', e.message);
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
    // Supabase 사용 불가 → localStorage 폴백
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
    // 1) Supabase에 새 기록 삽입
    var { error: insertError } = await sb
      .from('rankings')
      .insert(entry);
    
    if (insertError) throw insertError;
    
    // 2) 전체 랭킹 다시 조회
    var rankings = await getRankingsFromDB();
    
    // 3) 방금 등록한 플레이어의 순위 찾기
    currentPlayerRankIndex = -1;
    for (var i = 0; i < rankings.length; i++) {
      if (rankings[i].name === name && rankings[i].distance === entry.distance) {
        currentPlayerRankIndex = i;
        break;
      }
    }
    
    return rankings;
  } catch(e) {
    console.warn('Supabase 저장 실패, localStorage 폴백:', e.message);
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
    // ease-out 효과
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
      // Supabase 실패 시 로컬 랭킹
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
    // 컨티뉴 횟수 소진 — 바로 게임 오버 화면
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

  // 코인 차감
  game.coins -= cost;
  localStorage.setItem('totalCoins', game.coins);
  document.getElementById('coinsValue').textContent = game.coins;

  // 컨티뉴 횟수 증가
  game.continueCount++;

  // 하트 3개로 복원
  game.hearts = 3;
  updateHearts();

  // 화면의 장애물 클리어
  for (var i = ennemiesHolder.ennemiesInUse.length - 1; i >= 0; i--) {
    var e = ennemiesHolder.ennemiesInUse[i];
    ennemiesHolder.mesh.remove(e.mesh);
  }
  ennemiesHolder.ennemiesInUse = [];

  // 날아오는 소행성 클리어
  for (var j = flyingAsteroids.length - 1; j >= 0; j--) {
    scene.remove(flyingAsteroids[j].mesh);
  }
  flyingAsteroids = [];

  // 블랙홀 슬로우 해제
  game.blackHoleSlowFactor = 1.0;
  game.blackHoleActive = false;

  // 비행기를 현재 폼으로 재생성 (추락 후이므로 화면 밖에 있음)
  var oldForm = game.currentForm;
  var oldPos = airplane.mesh.position.clone();
  scene.remove(airplane.mesh);

  // 현재 폼에 맞는 비행체 재생성
  airplane = createNewCharacter(oldForm);
  airplane.mesh.scale.set(.25,.25,.25);
  airplane.mesh.position.y = game.planeDefaultHeight;
  airplane.mesh.rotation.z = 0;
  airplane.mesh.rotation.x = 0;
  scene.add(airplane.mesh);

  game.planeCollisionSpeedX = 0;
  game.planeCollisionSpeedY = 0;
  game.planeCollisionDisplacementX = 0;
  game.planeCollisionDisplacementY = 0;

  // 낙하 속도 리셋
  game.planeFallSpeed = 0.001;

  // 오버레이 닫기
  hideContinuePrompt();

  // 3초 무적 활성화
  activateInvincible();

  // 게임 재개
  game.status = "playing";
  oldTime = new Date().getTime();
}

function stopAndShowGameOver() {
  hideContinuePrompt();
  // 바로 게임오버 화면으로
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
  
  // 코인 카운트업 애니메이션 (이번 라운드 획득분)
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
  
  // 로딩 상태 (중복 클릭 방지)
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

  // 시작 화면으로 돌아가기
  var overlay = document.getElementById('startOverlay');
  overlay.style.display = '';
  overlay.classList.remove('hidden');
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
  bgm = new Audio('music/Townsong.mp3');
  bgm.loop = true;
  bgm.volume = isMobile ? 0.02 : 0.05;
  // 모바일 Safari 대응: 미리 load 호출
  bgm.load();
  // 브라우저 자동재생 정책 대응: 첫 인터랙션 후 재생
  var removeBGMListeners = function() {
    document.removeEventListener('click', startBGM);
    document.removeEventListener('touchstart', startBGM);
    document.removeEventListener('touchend', startBGM);
    document.removeEventListener('pointerdown', startBGM);
  };
  var startBGM = function() {
    if (bgmStarted) return;
    if (bgm && bgm.paused) {
      var playPromise = bgm.play();
      if (playPromise !== undefined) {
        playPromise.then(function() {
          bgmStarted = true;
          removeBGMListeners();
        }).catch(function() {
          // 재생 실패 시 리스너 유지 → 다음 인터랙션에서 재시도
        });
      } else {
        // play()가 promise를 반환하지 않는 구형 브라우저
        bgmStarted = true;
        removeBGMListeners();
      }
    }
    // AudioContext를 사용자 제스처 내에서 미리 생성 + resume (Safari 효과음 해결)
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  };
  document.addEventListener('click', startBGM);
  document.addEventListener('touchstart', startBGM);
  document.addEventListener('touchend', startBGM);
  document.addEventListener('pointerdown', startBGM);
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
  document.addEventListener('touchstart', handleTouchStart, { passive: false });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('mouseup', handleMouseUp, false);
  document.addEventListener('touchend', handleTouchEnd, false);
  document.addEventListener('keydown', handleKeyDown, false);

  initRankingUI();
  initBGM();
  initPauseUI();
  initShopUI();
  initStartScreen();
  loop();
}

window.addEventListener('load', init, false);

function initStartScreen() {
  var overlay = document.getElementById('startOverlay');
  var playBtn = document.getElementById('playBtn');
  if (!playBtn || !overlay) return;

  function startGame() {
    if (game.status !== 'waiting') return;
    // 상점에서 선택한 비행체/업그레이드 반영
    shopState = loadShopData();
    resetGame();
    game.status = 'playing';
    overlay.classList.add('hidden');
    oldTime = new Date().getTime();
    // BGM 시작 (사용자 제스처 내)
    if (typeof initBGM === 'function') {
      if (bgm && bgm.paused) bgm.play().catch(function(){});
    }
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
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

  // 모바일 터치와 데스크톱 클릭 모두 지원
  pauseBtn.addEventListener('touchend', handlePauseBtnPress);
  pauseBtn.addEventListener('click', handlePauseBtnPress);
  pauseOverlay.addEventListener('touchend', handleOverlayPress);
  pauseOverlay.addEventListener('click', handleOverlayPress);
}

// ===== SHOP SYSTEM =====

var shopVehicleData = [
  { id: "Newton's Apple", name: "뉴턴의 사과", price: 2000, ability: "최대 하트 7개부터 시작" },
  { id: "Einstein", name: "아인슈타인", price: 2500, ability: "슬로우 모션 3번 사용 가능 (마우스 왼쪽 버튼)" },
  { id: "Wright Flyer", name: "라이트 형제", price: 3000, ability: "무적 효과 2번 사용 가능 (마우스 왼쪽 버튼)" },
  { id: "Jetliner", name: "여객기", price: 4000, ability: "코인 X3 획득" },
  { id: "Rocket", name: "로켓", price: 6000, ability: "미사일 20발 (철퇴, 소행성, 번개구름 파괴) (마우스 왼쪽 버튼)" },
  { id: "SpaceShuttle", name: "스페이스 셔틀", price: 7000, ability: "500m 부스터 2회 (모든 장애물 회피)" },
  { id: "UFO", name: "UFO", price: 8000, ability: "500m 부스터 2회 + 레이저 20발 (모든 장애물 파괴)" }
];

var shopUpgradeData = [
  { id: "extraHeart1", name: "하트 +1", icon: "❤️", desc: "시작 하트 3→4개", price: 300 },
  { id: "extraHeart2", name: "하트 +2", icon: "💖", desc: "시작 하트 4→5개", price: 800, requires: "extraHeart1" },
  { id: "continueDiscount", name: "컨티뉴 할인", icon: "💰", desc: "컨티뉴 비용 30% 감소", price: 500 },
  { id: "coinBooster", name: "코인 부스터", icon: "✨", desc: "코인 획득량 2배", price: 1000 }
];

var evoVehicleData = [
  { id: "Amoeba", name: "아메바", levelReq: 1 },
  { id: "Anomalocaris", name: "아노말로카리스", levelReq: 2 },
  { id: "Dunkleosteus", name: "둔클레오스테우스", levelReq: 3 },
  { id: "Tiktaalik", name: "틱타알릭", levelReq: 4 },
  { id: "Plesiosaur", name: "플레시오사우루스", levelReq: 5 },
  { id: "Quetzalcoatlus", name: "케찰코아틀루스", levelReq: 6 },
  { id: "Darwin's Finch", name: "다윈의 핀치", levelReq: 7 }
];

// Shop save/load
function loadShopData() {
  var defaults = {
    unlockedVehicles: [],
    selectedVehicle: null,
    purchasedUpgrades: [],
    darwinFinchReached: false,
    unlockedEvoForms: ["Amoeba"],
    maxEvoLevel: 1
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
        maxEvoLevel: parsed.maxEvoLevel || defaults.maxEvoLevel
      };
    } catch(e) {
      return defaults;
    }
  }
  return defaults;
}

function saveShopData(data) {
  localStorage.setItem('flyDarwinShop', JSON.stringify(data));
}

var shopState = loadShopData();

// Shop 3D preview system
var shopPreviews = [];
var shopAnimationId = null;

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
    var isUnlocked = shopState.darwinFinchReached;
    var isPurchased = shopState.unlockedVehicles.indexOf(v.id) !== -1;
    var isSelected = shopState.selectedVehicle === v.id;

    var card = document.createElement('div');
    card.className = 'vehicle-card' + (isSelected ? ' selected' : '') + (!isUnlocked ? ' locked' : '');

    var previewId = 'vehiclePreview_' + i;
    var previewHTML = '<div class="vehicle-preview" id="' + previewId + '">';
    if (!isUnlocked) {
      previewHTML += '<div class="vehicle-lock-overlay">🔒</div>';
    }
    previewHTML += '</div>';

    card.innerHTML = previewHTML +
      '<p class="vehicle-name">' + v.name + '</p>' +
      '<p class="vehicle-ability">' + v.ability + '</p>';

    // Button
    var btn = document.createElement('button');
    btn.className = 'vehicle-btn';
    if (!isUnlocked) {
      btn.className += ' vehicle-btn--locked';
      btn.textContent = '🔒 다윈의 핀치 도달 시 해금';
      btn.disabled = true;
    } else if (isPurchased && isSelected) {
      btn.className += ' vehicle-btn--selected';
      btn.textContent = '✓ 선택됨';
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
      btn.textContent = v.price + ' 🪙 구매';
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
      if (preview) shopPreviews.push(preview);
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
      btn.textContent = '✓ 보유';
    } else {
      btn.className += ' upgrade-btn--buy';
      btn.textContent = u.price + ' 🪙';
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
      previewHTML += '<div class="vehicle-lock-overlay">🔒</div>';
    }
    previewHTML += '</div>';

    card.innerHTML = previewHTML +
      '<p class="vehicle-name">' + v.name + '</p>' +
      '<p class="vehicle-ability">진화 레벨 ' + v.levelReq + ' 도달 시 해금</p>';

    var btn = document.createElement('button');
    btn.className = 'vehicle-btn';
    if (!isUnlocked) {
      btn.className += ' vehicle-btn--locked';
      btn.textContent = '🔒 미해금';
      btn.disabled = true;
    } else if (isSelected || isDefault) {
      btn.className += ' vehicle-btn--selected';
      btn.textContent = '✓ 선택됨';
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
      if (preview) shopPreviews.push(preview);
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

function openShop() {
  shopState = loadShopData();
  var overlay = document.getElementById('shopOverlay');
  overlay.style.display = 'flex';
  refreshShop();
}

function closeShop() {
  document.getElementById('shopOverlay').style.display = 'none';
  cleanupShopPreviews();

  // 선택된 비행체가 변경되었으면 씬의 비행기 교체
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
  // 뉴턴의 사과: 7개로 시작
  if (shopState.selectedVehicle === "Newton's Apple") hearts = 7;
  return hearts;
}

// Get max hearts based on vehicle
function getStartingMaxHearts() {
  // 뉴턴의 사과: 최대 7개
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
