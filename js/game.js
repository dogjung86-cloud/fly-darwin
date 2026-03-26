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

    // ?곸듅?섎뒗 ?뚭퀎 (?뚯썙???먮굦)
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

    // ?꾪뙥????
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

    // ?щ옒???몄씠利?
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
  // 誘몄궗??遺?ㅽ꽣 ?뚭눼? ?숈씪???④낵???ъ슜
  if (typeof playShatterSound === 'function') {
    playShatterSound();
  }
}

function playCoinSound() {
  try {
    var ctx = getAudioCtx();
    var now = ctx.currentTime;

    // 吏㏃? "??" ?숈쟾 ?ъ슫??
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

          // ?뱀닔 ?μ븷臾??ㅽ룿 異붿쟻
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

// 紐⑤컮??媛먯?
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
    // ?쇱떆?뺤? 踰꾪듉/?ㅻ쾭?덉씠 ?곗튂 ?쒖뿉??preventDefault ?섏? ?딆쓬
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
var mouseHoldInterval = null;
var mouseIsDown = false;

function handleMouseDown(event) {
  if (event.button !== 0) return;
  mouseIsDown = true;

  if (game.status !== 'playing') return;

  // 蹂댁뒪?? 蹂댁뒪媛 ?쒖꽦?대㈃ 諛붾줈 誘몄궗??諛쒖궗
  if (typeof bossState !== 'undefined' && bossState.active) {
    fireBossMissile();
    clearInterval(mouseHoldInterval);
    mouseHoldInterval = setInterval(function() {
      if (!mouseIsDown || game.status !== 'playing' || !bossState.active) {
        clearInterval(mouseHoldInterval);
        mouseHoldInterval = null;
        return;
      }
      fireBossMissile();
    }, 150);
    return;
  }

  // ?쇰컲 ?λ젰 諛쒕룞
  if (!abilityState || !abilityState.type) return;

  // 利됱떆 1??諛쒖궗
  activateAbility();

  // ?곗궗 媛?ν븳 ?λ젰(誘몄궗?? ?덉씠?)? ?????諛섎났 諛쒖궗
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
  // 紐⑤컮?쇱? ?섎떒 ?λ젰 踰꾪듉?쇰줈留?諛쒕룞 (?곗튂 ?대룞怨?異⑸룎 諛⑹?)
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

// ?뚰뻾???μ븷臾?(?덈꺼 3+)
Asteroid = function(){
  this.mesh = new THREE.Object3D();

  // 遺덇퇋移숉븳 諛붿쐞 ?⑹뼱由?
  var rockMat = new THREE.MeshPhongMaterial({
    color: 0x8B7355,
    shininess: 10,
    specular: 0x444444,
    shading: THREE.FlatShading
  });

  // ??以묒븰 諛붿쐞
  var mainGeom = new THREE.BoxGeometry(18, 16, 18, 1, 1, 1);
  // 瑗?쭞?먯쓣 ?쒕뜡?섍쾶 蹂?뺥븯??遺덇퇋移숉븳 ?뺥깭 ?앹꽦
  for (var i = 0; i < mainGeom.vertices.length; i++) {
    mainGeom.vertices[i].x += (Math.random() - 0.5) * 4;
    mainGeom.vertices[i].y += (Math.random() - 0.5) * 4;
    mainGeom.vertices[i].z += (Math.random() - 0.5) * 4;
  }
  var mainRock = new THREE.Mesh(mainGeom, rockMat);
  this.mesh.add(mainRock);

  // ?묒? 諛붿쐞 ?뚭린??
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

  // 遺됱? 鍮쏅굹??洹좎뿴 ?④낵
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

// 踰덇컻援щ쫫 ?μ븷臾?(?덈꺼 2+) - 蹂듭? ?ㅽ???
ThunderCloud = function(){
  this.mesh = new THREE.Object3D();

  // 癒밴뎄由?蹂몄껜 - ?щ윭 寃뱀쑝濡??먰뀅寃?
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

  // ?꾨옒痢?(?볦? ?대몢??諛붾떏)
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

  // 踰덇컻 諛쒓킅 以묒떖遺 (援щ쫫 ?꾨옒履쎌뿉 ?몃? 鍮?
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

  // 踰덇컻 蹂쇳듃 (?щ윭 媛덈옒 吏洹몄옱洹?
  var boltMat = new THREE.MeshPhongMaterial({
    color: 0xFFFF00,
    emissive: 0xFFCC00,
    emissiveIntensity: 0.8,
    shading: THREE.FlatShading,
    transparent: true,
    opacity: 0.9
  });

  this.bolts = [];

  // 3媛덈옒 踰덇컻
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

  // ?⑥뼱吏???묒? ?뚰렪 釉붾줉
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

// ?좎븘?ㅻ뒗 ?뚰뻾??(?덈꺼 3+) ???ㅻⅨ履쎌뿉???쇱そ?쇰줈 鍮좊Ⅴ寃??좎븘??
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

  // ?쒕㈃ ?뚭린 (?묒? 援ъ껜??
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

  // 鍮쏅굹??瑗щ━ (?붿뿼 ?④낵)
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
  // 鍮꾪뻾 愿???띿꽦
  this.speed = 4 + Math.random() * 2; // ?섑룊 ?대룞?띾룄
  this.alive = true;
}

// 臾쇨린??(?덈꺼 4+) ???먭린??遺꾩닔, ?곷떒 踰꾩꽢???쇱쭚
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

  // 硫붿씤 ?먭린??(援듭? 以묒떖 + 二쇰? ?뉗? 湲곕뫁??
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

  // ?곷떒 踰꾩꽢???쇱쭚 (?볦? ?먮컲 + ?꾨옒濡??섎윭?대━??釉붾줉)
  var capMat = new THREE.MeshPhongMaterial({
    color: 0x90E8C8, transparent: true, opacity: 0.5, shading: THREE.FlatShading
  });
  var capGeom = new THREE.CylinderGeometry(6, 18, 8, 8);
  var cap = new THREE.Mesh(capGeom, capMat);
  cap.position.y = pillarHeight + 2;
  cap.castShadow = true;
  this.mesh.add(cap);

  // 踰꾩꽢 紐⑥옄 ?꾨옒 ?섎윭?대━??臾쇱쨪湲?
  for (var j = 0; j < 10; j++) {
    var ja = (j / 10) * Math.PI * 2;
    var jDist = 12 + Math.random() * 8;
    var jh = pillarHeight * 0.3 + Math.random() * pillarHeight * 0.5;
    var jGeom = new THREE.CylinderGeometry(0.8, 0.3, jh, 4);
    var jet = new THREE.Mesh(jGeom, waterDarkMat);
    jet.position.set(Math.cos(ja) * jDist, jh / 2, Math.sin(ja) * jDist);
    this.mesh.add(jet);
  }

  // 諛붾떏 ?ㅽ뵆?섏떆
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

// ?붿뿼踰?(?덈꺼 5+) ???묒? 釉붾줉 踰?+ 媛?대뜲 ?듦낵 援щ찉 (硫붿떆 ?먯젏 湲곗?)
FireWall = function(){
  this.mesh = new THREE.Object3D();

  var colors = [
    new THREE.MeshPhongMaterial({ color: 0xCC3300, emissive: 0x881100, emissiveIntensity: 0.3, shading: THREE.FlatShading }),
    new THREE.MeshPhongMaterial({ color: 0xFF4500, emissive: 0xCC2200, emissiveIntensity: 0.4, shading: THREE.FlatShading }),
    new THREE.MeshPhongMaterial({ color: 0xFF6600, emissive: 0xDD4400, emissiveIntensity: 0.3, shading: THREE.FlatShading }),
    new THREE.MeshPhongMaterial({ color: 0xFF8C00, emissive: 0xCC6600, emissiveIntensity: 0.3, shading: THREE.FlatShading }),
    new THREE.MeshPhongMaterial({ color: 0xFFAA33, emissive: 0xDD8800, emissiveIntensity: 0.2, shading: THREE.FlatShading })
  ];

  // 援щ찉 以묒떖 (硫붿떆 ?먯젏 湲곗?, -15 ~ +15 踰붿쐞)
  var gapCenter = (Math.random() - 0.5) * 30;
  var gapSize = 50;
  this.gapCenter = gapCenter;
  this.gapSize = gapSize;

  // ?꾩そ 踰?(援щ찉 ?? - 鍮쎈뭣??釉붾줉
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

  // ?꾨옒履?踰?(援щ찉 ?꾨옒) - 鍮쎈뭣??釉붾줉
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

  // 援щ찉 寃쎄퀎 ?몃? 諛쒓킅 釉붾줉
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

// 釉붾옓? (?덈꺼 6+) ???뚯슜?뚯씠 + ?깆옣 ??30% 媛먯냽
BlackHole = function(){
  this.mesh = new THREE.Object3D();

  // 以묒떖 肄붿뼱 (寃? 援ъ껜)
  var coreMat = new THREE.MeshPhongMaterial({
    color: 0x000000,
    shininess: 100,
    specular: 0x111111,
    shading: THREE.FlatShading
  });
  var coreGeom = new THREE.BoxGeometry(10, 10, 10, 1, 1, 1);
  var core = new THREE.Mesh(coreGeom, coreMat);
  this.mesh.add(core);

  // 媛뺤갑?먮컲 (?ㅻ젋吏+?몃? ?뚯쟾 留?
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

  // 二쇰????⑸궇由щ뒗 ?뚰렪
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

    // ?덈꺼蹂??μ븷臾?醫낅쪟 寃곗젙 (媛以묒튂 湲곕컲)
    var roll = Math.random();
    var chosenType = 'mace';

    if (game.level >= 6 && roll < 0.03) {
      chosenType = 'blackHole'; // 3% ?뺣쪧
    } else {
      var availableTypes = [];
      if (game.level >= 5) {
        // Lv5+: 泥좏눜 30%, 湲고? 70%
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
        // ?붿뿼踰?理쒖냼 媛꾧꺽 泥댄겕
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

    // 臾쇨린?μ? 吏硫?諛붾떎 ?쒕㈃)??怨좎젙
    if (ennemy.type === 'waterPillar') {
      ennemy.distance = game.seaRadius + 5;
    }
    ennemy.mesh.position.y = -game.seaRadius + Math.sin(ennemy.angle)*ennemy.distance;
    ennemy.mesh.position.x = Math.cos(ennemy.angle)*ennemy.distance;
    // ?붿뿼踰?臾쇨린?μ? ?뚯쟾?섏? ?딄퀬 怨좎젙 ?먯꽭 ?좎?
    if (ennemy.type !== 'fireWall' && ennemy.type !== 'waterPillar') {
      ennemy.mesh.rotation.z += Math.random()*.1;
      ennemy.mesh.rotation.y += Math.random()*.1;
    }

    // 踰덇컻援щ쫫 源쒕묀??+ ?곹븯 ?대룞 ?④낵
    if (ennemy.type === 'thunder') {
      ennemy.flashTimer = (ennemy.flashTimer || 0) + deltaTime;
      // ?곹븯 ?대룞
      ennemy.distance = (game.seaRadius + game.planeDefaultHeight) + Math.sin(ennemy.flashTimer * 0.004) * 30;
      if (ennemy.bolts) {
        var flash = Math.sin(ennemy.flashTimer * 0.01) > 0.3;
        for (var b = 0; b < ennemy.bolts.length; b++) {
          ennemy.bolts[b].visible = flash;
        }
      }
    }

    // 釉붾옓? 媛뺤갑?먮컲 ?뚯쟾 + 洹쇱젒 ?щ줈??紐⑥뀡
    if (ennemy.type === 'blackHole') {
      ennemy.rotTimer = (ennemy.rotTimer || 0) + deltaTime;
      if (ennemy.rings) {
        for (var r = 0; r < ennemy.rings.length; r++) {
          ennemy.rings[r].rotation.z += 0.002 * deltaTime * (1 + r * 0.3);
        }
      }
      // 鍮꾪뻾湲곗? 釉붾옓? ?ъ씠??嫄곕━ 怨꾩궛
      var bhWorldPos = ennemy.mesh.position.clone();
      ennemiesHolder.mesh.updateMatrixWorld();
      bhWorldPos.applyMatrix4(ennemiesHolder.mesh.matrixWorld);
      var distToPlane = airplane.mesh.position.distanceTo(bhWorldPos);

      var slowRadius = 200; // ?щ줈???④낵 踰붿쐞
      var maxSlow = 0.12;   // 理쒕? ?щ줈??(媛??媛源뚯슱 ?? ?먮옒??12% ?띾룄)

      if (distToPlane < slowRadius) {
        // 嫄곕━??鍮꾨?: 媛源뚯슱?섎줉 ???먮젮吏?(1.0 ??maxSlow)
        var ratio = distToPlane / slowRadius; // 0(留ㅼ슦媛源뚯?) ~ 1(寃쎄퀎)
        game.blackHoleSlowFactor = maxSlow + (1.0 - maxSlow) * ratio;
        game.blackHoleActive = true;
        ennemy.hasAppliedSlow = true;
      } else if (ennemy.hasAppliedSlow) {
        // 踰붿쐞瑜?踰쀬뼱?섎㈃ 利됱떆 ?댁젣
        game.blackHoleSlowFactor = 1.0;
        game.blackHoleActive = false;
      }
    }

    // 臾쇨린??湲곕뫁 ?믪씠 ?좊땲硫붿씠??
    if (ennemy.type === 'waterPillar' && ennemy.pillars) {
      ennemy.animTimer = (ennemy.animTimer || 0) + deltaTime;
      for (var p = 0; p < ennemy.pillars.length; p++) {
        var scaleY = 0.8 + Math.sin(ennemy.animTimer * 0.003 + p * 0.5) * 0.3;
        ennemy.pillars[p].scale.y = scaleY;
      }
    }

    // ?붿뿼踰?釉붾줉 ?섎윭?대┝ ?좊땲硫붿씠??
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

    // 臾쇨린?μ? ?섑룊 嫄곕━ + ?믪씠 踰붿쐞 泥댄겕 (臾쇨린???꾨? ?섏뼱媛硫??듦낵)
    if (ennemy.type === 'waterPillar') {
      var planeRelY = airplane.mesh.position.y - ennemy.mesh.position.y;
      if (planeRelY > 90) {
        d = 9999; // 臾쇨린???꾨? 吏?섍컧 - 異⑸룎 ?놁쓬
      } else {
        d = Math.sqrt(diffPos.x * diffPos.x + diffPos.z * diffPos.z);
      }
    }

    // ?붿뿼踰쎌? ?섑룊 嫄곕━濡?異⑸룎 ?먯젙 (?꾩븘?섎줈 ?볤쾶 ?쇱퀜吏?踰?
    if (ennemy.type === 'fireWall') {
      d = Math.sqrt(diffPos.x * diffPos.x + diffPos.z * diffPos.z);
    }

    var collisionDist = game.ennemyDistanceTolerance;
    if (ennemy.type === 'fireWall') collisionDist = 15;
    if (ennemy.type === 'thunder') collisionDist = 18;
    if (ennemy.type === 'waterPillar') collisionDist = 20;
    if (ennemy.type === 'blackHole') collisionDist = 15;

    if (d < collisionDist){
      // 釉붾옓?? 異⑸룎 ?놁씠 ?듦낵 (?щ줈??紐⑥뀡留??곸슜)
      if (ennemy.type === 'blackHole') {
        continue;
      }
      // ?붿뿼踰? 援щ찉 ?덉씠嫄곕굹 踰??꾩そ ?꾨? ?섏쑝硫??듦낵
      if (ennemy.type === 'fireWall') {
        var planeLocalY = airplane.mesh.position.y - ennemy.mesh.position.y;
        // 援щ찉 ?덉쓣 ?듦낵
        if (Math.abs(planeLocalY - ennemy.gapCenter) < ennemy.gapSize / 2) {
          continue;
        }
        // 踰??꾩そ ?꾨? ?섏뼱媛?(?꾩そ 釉붾줉 理쒖긽?⑤낫???믪쑝硫??듦낵)
        var wallTopEnd = ennemy.gapCenter + ennemy.gapSize / 2 + 80;
        if (planeLocalY > wallTopEnd) {
          continue;
        }
      }

      if (game.invincible) {
        var colors = { thunder: 0xFFFF00, asteroid: 0xFF4500, waterPillar: 0x6B9DAD, fireWall: 0xFF4500, blackHole: 0xFF8C00 };
        var pColor = colors[ennemy.type] || 0xFFD700;
        particlesHolder.spawnParticles(ennemy.mesh.position.clone(), 20, pColor, 2);
        // 釉붾옓? ?뚭눼 ???щ줈???댁젣
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
        // 釉붾옓? ?뚭눼 ???щ줈???댁젣
        if (ennemy.type === 'blackHole') {
          game.blackHoleSlowFactor = 1.0;
          game.blackHoleActive = false;
        }
        this.ennemiesInUse.splice(i,1);
        this.mesh.remove(ennemy.mesh);
        // 臾쇨린???붿뿼踰쎌? ?됰갚???쏀븯寃?(?섑룊 嫄곕━ 泥댄겕??Y李⑥씠媛 ??
        if (ennemy.type === 'waterPillar' || ennemy.type === 'fireWall') {
          game.planeCollisionSpeedX = 30 * diffPos.x / d;
          game.planeCollisionSpeedY = 20;
        } else {
          game.planeCollisionSpeedX = 100 * diffPos.x / d;
          game.planeCollisionSpeedY = 100 * diffPos.y / d;
        }
        ambientLight.intensity = 2;

        // 踰덇컻援щ쫫/?붿뿼踰쎌? ?먮꼫吏 2諛?媛먯냼
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
      // 釉붾옓????щ씪吏硫??щ줈???댁젣
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

// ===== ?좎븘?ㅻ뒗 ?뚰뻾???꾩슜 愿由?(吏곸꽑 ?대룞) =====
var flyingAsteroids = [];

function spawnFlyingAsteroid() {
  var asteroid = new FlyingAsteroid();
  // ?붾㈃ ?ㅻⅨ履?諛뽰뿉???쒖옉
  asteroid.mesh.position.x = 250;
  // 鍮꾪뻾泥??믪씠 洹쇱쿂 ?쒕뜡 y
  asteroid.mesh.position.y = game.planeDefaultHeight + (Math.random() - 0.5) * game.planeAmpHeight;
  asteroid.mesh.position.z = -50 + Math.random() * 100;
  scene.add(asteroid.mesh);
  flyingAsteroids.push(asteroid);
}

function updateFlyingAsteroids() {
  for (var i = flyingAsteroids.length - 1; i >= 0; i--) {
    var a = flyingAsteroids[i];
    // ?ㅻⅨ履쎌뿉???쇱そ?쇰줈 鍮좊Ⅴ寃??대룞
    a.mesh.position.x -= a.speed * deltaTime * 0.1;
    a.mesh.rotation.z += 0.02 * deltaTime * 0.1;
    a.mesh.rotation.y += 0.015 * deltaTime * 0.1;

    // 鍮꾪뻾泥댁? 異⑸룎 泥댄겕
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

    // ?붾㈃ 諛뽰쑝濡??섍?硫??쒓굅
    if (a.mesh.position.x < -300) {
      scene.remove(a.mesh);
      flyingAsteroids.splice(i, 1);
    }
  }
}

// ===== ?덈꺼???띿뒪???쒖떆 =====
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

  // 蹂?紐⑥뼇 肄붿뼱 (湲덈튆 援ъ껜)
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

  // ?ㅽ뙆?댄겕 (蹂?鍮쏆궡)
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
    // 毓곗”?섍쾶
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

  // ?μ븷臾쇨낵 寃뱀튂吏 ?딅뒗 ?꾩튂 李얘린
  var safeDistance = 0;
  var attempts = 0;
  var minSeparation = 40; // ?μ븷臾쇨낵 理쒖냼 ?닿꺽 嫄곕━
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
    // 鍮숆?鍮숆? ?뚯쟾 + ?좊떎?덈뒗 ?④낵
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
  heart.rotation.z = Math.PI; // ?ㅼ쭛?댁꽌 ?섑듃 紐⑥뼇
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
  // ?섑듃媛 ?대? 理쒕?硫??ㅽ룿?섏? ?딆쓬
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

  // 鍮꾪뻾泥댁뿉 湲덈튆 湲濡쒖슦 異붽?
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

  // 湲濡쒖슦 源쒕묀??(留덉?留?1珥?
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

// 硫붿떆???붾뱶(濡쒖뺄 湲곗?) ?꾩튂瑜?遺紐?湲곗??쇰줈 媛?몄삤湲?
function getLocalTransform(mesh, rootParent) {
  var pos = new THREE.Vector3();
  var scale = new THREE.Vector3();
  var quat = new THREE.Quaternion();
  
  // ?꾩떆濡??붾뱶 留ㅽ듃由?뒪瑜??낅뜲?댄듃?댁꽌 猷⑦듃 湲곗? 醫뚰몴瑜?援ы븿
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
  div.textContent = '??Evolution ??;
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
  // ?대? 蹂??以묒씠硫?臾댁떆
  if (game.transforming) return;
  game.transforming = true;
  
  // 鍮꾪뻾泥?吏꾪솕 ?띿뒪???쒖떆
  showEvolutionText();
  
  var oldAirplane = airplane;
  var oldPos = airplane.mesh.position.clone();
  var oldRot = airplane.mesh.rotation.clone();
  var oldScale = airplane.mesh.scale.clone();
  
  // 湲곗〈 鍮꾪뻾泥댁쓽 紐⑤뱺 硫붿떆 釉붾줉 ?섏쭛
  var oldMeshes = collectMeshes(oldAirplane.mesh);
  var oldTransforms = [];
  for (var i = 0; i < oldMeshes.length; i++) {
    oldTransforms.push(getLocalTransform(oldMeshes[i], oldAirplane.mesh));
  }
  
  // ??鍮꾪뻾泥??앹꽦 (?꾩쭅 ?ъ뿉 異붽? ????
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
  
  // 釉붾줉 ?섍? ?ㅻ? ??泥섎━
  var maxBlocks = Math.max(oldTransforms.length, newTransforms.length);
  
  // ???뺥깭??釉붾줉????留롮쑝硫? 異붽? 釉붾줉??以묒븰?먯꽌 ?앹꽦
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
  
  // ?좊땲硫붿씠???쒓컙
  var morphDuration = 1.2;
  var completedCount = 0;
  
  for (var i = 0; i < maxBlocks; i++) {
    var block = morphBlocks[i];
    var delay = Math.random() * 0.3;
    
    if (i < newTransforms.length) {
      // 紐⑺몴媛 ?덈뒗 釉붾줉: ???꾩튂/?ш린/?됱쑝濡??대룞
      var target = newTransforms[i];
      
      // ?꾩튂 ?좊땲硫붿씠??
      TweenMax.to(block.position, morphDuration, {
        x: target.x, y: target.y, z: target.z,
        delay: delay,
        ease: Power2.easeInOut
      });
      
      // ?뚯쟾 ?좊땲硫붿씠??
      TweenMax.to(block.rotation, morphDuration, {
        x: target.rx, y: target.ry, z: target.rz,
        delay: delay,
        ease: Power2.easeInOut
      });
      
      // ?ㅼ????좊땲硫붿씠??
      TweenMax.to(block.scale, morphDuration, {
        x: target.sx, y: target.sy, z: target.sz,
        delay: delay,
        ease: Power2.easeInOut
      });
      
      // ?됱긽 ?좊땲硫붿씠??
      var targetColor = new THREE.Color(target.color);
      TweenMax.to(block.material.color, morphDuration, {
        r: targetColor.r, g: targetColor.g, b: targetColor.b,
        delay: delay,
        ease: Power2.easeInOut,
        onUpdate: function() { this.target.material && (this.target.material.needsUpdate = true); }.bind({target: block})
      });
      
    } else {
      // ?⑤뒗 釉붾줉: 異뺤냼?섎ŉ ?щ씪吏?
      TweenMax.to(block.scale, morphDuration * 0.6, {
        x: 0.01, y: 0.01, z: 0.01,
        delay: delay,
        ease: Power2.easeIn
      });
    }
    
    // 留덉?留?釉붾줉???꾨즺 肄쒕갚?쇰줈 ?꾪솚 留덈Т由?
    if (i === maxBlocks - 1) {
      TweenMax.to({}, morphDuration + 0.35, {
        onComplete: function() {
          // morphContainer ?쒓굅
          scene.remove(morphContainer);
          
          // ?ㅼ젣 ??鍮꾪뻾泥대줈 援먯껜
          airplane = newAirplane;
          airplane.mesh.position.copy(morphContainer.position);
          airplane.mesh.rotation.copy(morphContainer.rotation);
          airplane.mesh.scale.copy(morphContainer.scale);
          scene.add(airplane.mesh);
          
          game.currentForm = newFormString;
          game.transforming = false;
          
          // ?뚰떚???댄럺??(蹂???꾨즺 媛뺤“)
          particlesHolder.spawnParticles(airplane.mesh.position.clone(), 15, 0xFFFFFF, 1.2);
          
          // 臾댁쟻 ?곹깭媛 ?쒖꽦?붾릺???덉쑝硫?湲濡쒖슦瑜???鍮꾪뻾泥댁뿉 ?ㅼ떆 遺숈뿬以?
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

  // 釉붾옓? ?щ줈??紐⑥뀡: deltaTime ?먯껜???곸슜?섏뿬 ?꾩껜 寃뚯엫 ?щ줈??
  if (game.blackHoleActive) {
    deltaTime *= game.blackHoleSlowFactor;
  }

  if (game.status=="waiting"){
    // ?쒖옉 ?붾㈃ ?湲? ?щ쭔 ?뚮뜑留곹븯怨? 援щ쫫/?뚮룄 ?좊땲硫붿씠?섎쭔 ?좎?
    sky.moveClouds();
    sea.moveWaves();
    sea.mesh.rotation.z += 0.0001 * deltaTime;
    // 鍮꾪뻾泥??곹븯 遺???좊땲硫붿씠??
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

    // ?좎븘?ㅻ뒗 ?뚰뻾???ㅽ룿 (Lv3+)
    if (game.level >= 3 && Math.floor(game.distance) - game.flyingAsteroidLastSpawn >= game.distanceForFlyingAsteroidSpawn){
      game.flyingAsteroidLastSpawn = Math.floor(game.distance);
      spawnFlyingAsteroid();
    }

    // ?좎븘?ㅻ뒗 ?뚰뻾???낅뜲?댄듃
    updateFlyingAsteroids();

    var expectedLevel = Math.floor(game.distance / game.distanceForLevelUpdate) + 1;
    if (expectedLevel > game.level){
      game.level = expectedLevel;
      fieldLevel.innerHTML = Math.floor(game.level);
      showLevelUpText(game.level);

      game.targetBaseSpeed = game.initSpeed + game.incrementSpeedByLevel*game.level
    }

    // Checking for Transformation (?곸젏 鍮꾪뻾泥??좏깮 ??吏꾪솕 ?놁쓬)
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
    // 蹂댁뒪???쒖뒪??
    try {
      if (typeof checkBossTrigger === 'function') checkBossTrigger();
      if (typeof updateBoss === 'function') updateBoss(deltaTime);
    } catch(bossErr) { console.warn('Boss error:', bossErr); }
    updatePlane();
    updateDistance();
    updateHearts();
    game.baseSpeed += (game.targetBaseSpeed - game.baseSpeed) * deltaTime * 0.02;
    if (game.baseSpeed > game.maxSpeed) game.baseSpeed = game.maxSpeed;
    // 釉붾옓? ?щ줈?곕え???곸슜 + ?λ젰 ?띾룄 硫?고뵆?쇱씠??
    var abilityMult = (typeof getAbilitySpeedMultiplier === 'function') ? getAbilitySpeedMultiplier() : 1.0;
    game.speed = game.baseSpeed * game.planeSpeed * abilityMult;

    // ?λ젰 ?쒖뒪???낅뜲?댄듃
    if (typeof updateAbilities === 'function') updateAbilities(deltaTime);
    if (typeof updateDestroyParticles === 'function') updateDestroyParticles(deltaTime);

  }else if(game.status=="gameover"){
    game.speed *= .99;
    airplane.mesh.rotation.z += (-Math.PI/2 - airplane.mesh.rotation.z)*.0002*deltaTime;
    airplane.mesh.rotation.x += 0.0003*deltaTime;
    game.planeFallSpeed *= 1.05;
    airplane.mesh.position.y -= game.planeFallSpeed*deltaTime;

    // 諛붾떎 ?쒕㈃???우쓣 ???④낵??(1?뚮쭔)
    if (airplane.mesh.position.y < 10 && !game.splashPlayed) {
      game.splashPlayed = true;
      playWaterSplashSound();
    }

    if (airplane.mesh.position.y <-200){
      // 而⑦떚??媛?ν븯硫?而⑦떚???좏깮 ?붾㈃, ?꾨땲硫?諛붾줈 寃뚯엫?ㅻ쾭
      showContinuePrompt();
      game.status = "continuePrompt";
      if (typeof hideAbilityUI === 'function') hideAbilityUI();
      if (typeof cleanupProjectiles === 'function') cleanupProjectiles();
    }
  }else if(game.status=="continuePrompt"){
    // 而⑦떚???좏깮 ?湲?以? 鍮꾪뻾湲?遺??+ ???뚮뜑留??좎?
    sky.moveClouds();
    sea.moveWaves();
    sea.mesh.rotation.z += 0.0001 * deltaTime;

  }else if (game.status=="waitingReplay"){

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
  // ?섑듃 UI ?숈쟻 ?낅뜲?댄듃
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
      el.textContent = '?ㅿ툘';
      el.className = 'heart active';
    } else {
      el.textContent = '?뼡';
      el.className = 'heart lost';
    }
  }

  if (game.hearts <= 0){
    game.status = "gameover";
  }
}

function addCoin(){
  var coinMultiplier = 1;
  // ?ш컼湲? 肄붿씤 X3
  if (shopState && shopState.selectedVehicle === 'Jetliner') {
    coinMultiplier = 3;
  }
  // 肄붿씤 遺?ㅽ꽣 ?낃렇?덉씠?? X2
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
      el.textContent = '?ㅿ툘';
      el.className = 'heart active gain';
    }
    // ?붾㈃ 以묒븰???섑듃 ?쒖떆 ?④낵
    showHeartPickup();
  }
}

function showHeartPickup() {
  var existing = document.getElementById('heartPickupDisplay');
  if (existing) existing.remove();
  
  var div = document.createElement('div');
  div.id = 'heartPickupDisplay';
  div.textContent = '?ㅿ툘';
  div.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(0.3);font-size:120px;pointer-events:none;z-index:1500;opacity:0;transition:none;';
  document.body.appendChild(div);
  
  // ?좊땲硫붿씠?? ?ш쾶 ?섑??щ떎 ?щ씪吏?
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



// ===== TURBULENCE (?쒓린瑜? SYSTEM =====

var turbulenceTriggerDistances = [3000, 5500, 9000, 13000, 17000, 21000];

function getTurbulenceTriggerDistances() {
  // 21000m ?댄썑?먮뒗 4000m 媛꾧꺽?쇰줈 怨꾩냽 異붽?
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
  // ?쒓린瑜??쒖꽦 以묒씠硫???대㉧ ?낅뜲?댄듃
  if (game.turbulenceActive) {
    game.turbulenceTimer += deltaTime;
    if (game.turbulenceTimer >= game.turbulenceDuration) {
      // ?쒓린瑜?醫낅즺
      game.turbulenceActive = false;
      game.turbulenceLevel = 0;
      game.turbulenceTimer = 0;
    }
    return;
  }

  // ?몃━嫄?嫄곕━ ?뺤씤
  var triggers = getTurbulenceTriggerDistances();
  var dist = Math.floor(game.distance);
  for (var i = 0; i < triggers.length; i++) {
    var td = triggers[i];
    // 嫄곕━瑜?吏?ш퀬, ?꾩쭅 ?몃━嫄????먯쑝硫?諛쒕룞
    if (dist >= td && game.turbulenceTriggered.indexOf(td) === -1) {
      game.turbulenceTriggered.push(td);
      // ?덈꺼 1~3 ?쒕뜡
      game.turbulenceLevel = 1 + Math.floor(Math.random() * 3);
      game.turbulenceActive = true;
      game.turbulenceTimer = 0;
      showTurbulenceWarning(game.turbulenceLevel);
      // ?쒓린瑜??ъ슫??
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
  div.innerHTML = '?좑툘 TURBULENCE Lv.' + level + '<br><span style="font-size:0.5em;letter-spacing:0.2em;">' + labels[level] + '</span>';
  div.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(0.5);' +
    'font-family:Playfair Display,serif;font-size:48px;font-weight:700;color:' + colors[level] + ';' +
    'text-align:center;pointer-events:none;z-index:1500;opacity:0;' +
    'text-shadow:0 0 30px rgba(0,0,0,0.8),0 4px 15px rgba(0,0,0,0.5);transition:none;';
  document.body.appendChild(div);

  // ?좊땲硫붿씠?? ?섑??????좎? ???щ씪吏?
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
    // ?二쇳뙆 ?쇰툝
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

  // ?쒓린瑜???留덉슦???낅젰???몄씠利?異붽?
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

  // ?쒓린瑜?移대찓???붾뱾由?
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

var RANKING_KEY = 'flyDarwinRankings'; // localStorage ?대갚??
var MAX_RANKINGS = 100;
var currentPlayerRankIndex = -1;

// Supabase ?대씪?댁뼵??珥덇린??
var SUPABASE_URL = 'https://tehpoogyhjrkvcaeioge.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaHBvb2d5aGpya3ZjYWVpb2dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzQxOTQsImV4cCI6MjA4OTU1MDE5NH0.saInJOZuegHGaEW-D0sikBAU-XwoHZkjMYvUWw4t4sE';
var supabaseClient = null;

function getSupabase() {
  if (!supabaseClient && window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
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
    console.warn('Supabase 議고쉶 ?ㅽ뙣, localStorage ?대갚:', e.message);
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
    
    // 2) ?꾩껜 ??궧 ?ㅼ떆 議고쉶
    var rankings = await getRankingsFromDB();
    
    // 3) 諛⑷툑 ?깅줉???뚮젅?댁뼱???쒖쐞 李얘린
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
    tr.innerHTML = '<td colspan="5" style="color:rgba(255,255,255,0.3); padding:20px;">湲곕줉???놁뒿?덈떎</td>';
    tbody.appendChild(tr);
    return;
  }
  
  var medals = ['?쪍', '?쪎', '?쪏'];
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
    // 而⑦떚???잛닔 ?뚯쭊 ??諛붾줈 寃뚯엫 ?ㅻ쾭 ?붾㈃
    showGameOver();
    game.status = "waitingReplay";
    return;
  }

  var cost = game.continueCosts[game.continueCount];
  costEl.textContent = cost;
  balanceEl.textContent = game.coins;
  remainingEl.textContent = '?⑥? 湲고쉶: ' + remaining + '??;

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

  // 而⑦떚???잛닔 利앷?
  game.continueCount++;

  // ?섑듃 3媛쒕줈 蹂듭썝
  game.hearts = 3;
  updateHearts();

  // ?붾㈃???μ븷臾??대━??
  for (var i = ennemiesHolder.ennemiesInUse.length - 1; i >= 0; i--) {
    var e = ennemiesHolder.ennemiesInUse[i];
    ennemiesHolder.mesh.remove(e.mesh);
  }
  ennemiesHolder.ennemiesInUse = [];

  // ?좎븘?ㅻ뒗 ?뚰뻾???대━??
  for (var j = flyingAsteroids.length - 1; j >= 0; j--) {
    scene.remove(flyingAsteroids[j].mesh);
  }
  flyingAsteroids = [];

  // 釉붾옓? ?щ줈???댁젣
  game.blackHoleSlowFactor = 1.0;
  game.blackHoleActive = false;

  // 鍮꾪뻾湲곕? ?꾩옱 ?쇱쑝濡??ъ깮??(異붾씫 ?꾩씠誘濡??붾㈃ 諛뽰뿉 ?덉쓬)
  var oldForm = game.currentForm;
  var oldPos = airplane.mesh.position.clone();
  scene.remove(airplane.mesh);

  // ?꾩옱 ?쇱뿉 留욌뒗 鍮꾪뻾泥??ъ깮??(?뱀닔 鍮꾪뻾泥??좎?)
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

  // ?숉븯 ?띾룄 由ъ뀑
  game.planeFallSpeed = 0.001;

  // ?ㅻ쾭?덉씠 ?リ린
  hideContinuePrompt();

  // 3珥?臾댁쟻 ?쒖꽦??
  activateInvincible();

  // 寃뚯엫 ?ш컻
  game.status = "playing";
  oldTime = new Date().getTime();
}

function stopAndShowGameOver() {
  hideContinuePrompt();
  // 諛붾줈 寃뚯엫?ㅻ쾭 ?붾㈃?쇰줈
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
  
  // 肄붿씤 移댁슫?몄뾽 ?좊땲硫붿씠??(?대쾲 ?쇱슫???띾뱷遺?
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
    nameInput.placeholder = '?됰꽕?꾩쓣 ?낅젰?댁＜?몄슂!';
    nameInput.focus();
    return;
  }
  
  // 濡쒕뵫 ?곹깭 (以묐났 ?대┃ 諛⑹?)
  submitBtn.disabled = true;
  submitBtn.textContent = '?깅줉 以?..';
  
  try {
    var rankings = await saveRankingToDB(name, game.distance, game.level, game.currentForm);
    
    // Switch to ranking board
    document.getElementById('gameOverScore').style.display = 'none';
    document.getElementById('rankingBoard').style.display = 'block';
    
    document.querySelector('#rankingBoard .gameover-title').textContent = '?룇 ??궧';
    renderRankingBoard(rankings);
  } catch(e) {
    console.error('?먯닔 ?깅줉 ?ㅻ쪟:', e);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '?깅줉';
  }
}

function startReplay() {
  hideGameOver();
  resetGame();
  game.status = "waiting";

  // ?μ븷臾??대━??
  if (ennemiesHolder && ennemiesHolder.ennemiesInUse) {
    for (var i = ennemiesHolder.ennemiesInUse.length - 1; i >= 0; i--) {
      ennemiesHolder.mesh.remove(ennemiesHolder.ennemiesInUse[i].mesh);
    }
    ennemiesHolder.ennemiesInUse = [];
  }

  // ?좎븘?ㅻ뒗 ?뚰뻾???대━??
  if (typeof flyingAsteroids !== 'undefined') {
    for (var j = flyingAsteroids.length - 1; j >= 0; j--) {
      scene.remove(flyingAsteroids[j].mesh);
    }
    flyingAsteroids = [];
  }

  // 肄붿씤 ?대━??
  if (coinsHolder && coinsHolder.coinsInUse) {
    for (var k = coinsHolder.coinsInUse.length - 1; k >= 0; k--) {
      coinsHolder.mesh.remove(coinsHolder.coinsInUse[k].mesh);
      coinsHolder.coinsPool.push(coinsHolder.coinsInUse[k]);
    }
    coinsHolder.coinsInUse = [];
  }

  // 臾댁쟻 ?댁젣
  if (game.invincible) deactivateInvincible();

  // ?뚰떚???꾨줈?앺????대━??
  if (typeof cleanupProjectiles === 'function') cleanupProjectiles();
  if (typeof cleanupDestroyParticles === 'function') cleanupDestroyParticles();

  // 蹂댁뒪 ?뺣━
  if (typeof cleanupBoss === 'function') cleanupBoss();
  if (typeof bossState !== 'undefined') bossState.triggered = [];

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

  // ?쒖옉 ?붾㈃?쇰줈 ?뚯븘媛湲?
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
  loop();
}

window.addEventListener('load', init, false);

function initStartScreen() {
  var overlay = document.getElementById('startOverlay');
  var playBtn = document.getElementById('playBtn');
  if (!playBtn || !overlay) return;

  function startGame() {
    if (game.status !== 'waiting') return;
    // ?곸젏?먯꽌 ?좏깮??鍮꾪뻾泥??낃렇?덉씠??諛섏쁺
    shopState = loadShopData();
    resetGame();
    setupAbilityForVehicle();
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

  // 紐⑤컮???곗튂? ?곗뒪?ы넲 ?대┃ 紐⑤몢 吏??
  pauseBtn.addEventListener('touchend', handlePauseBtnPress);
  pauseBtn.addEventListener('click', handlePauseBtnPress);
  pauseOverlay.addEventListener('touchend', handleOverlayPress);
  pauseOverlay.addEventListener('click', handleOverlayPress);
}

// ===== SHOP SYSTEM =====

var shopVehicleData = [
  { id: "Newton's Apple", name: "?댄꽩???ш낵", price: 1500, ability: "理쒕? ?섑듃 7媛쒕????쒖옉", unlockForm: "Anomalocaris" },
  { id: "Einstein", name: "?꾩씤?덊???, price: 2500, ability: "?щ줈??紐⑥뀡 3踰??ъ슜 媛??(留덉슦???쇱そ 踰꾪듉)", unlockForm: "Dunkleosteus" },
  { id: "Wright Flyer", name: "?쇱씠???뺤젣", price: 3000, ability: "臾댁쟻 ?④낵 2踰??ъ슜 媛??(留덉슦???쇱そ 踰꾪듉)", unlockForm: "Tiktaalik" },
  { id: "Jetliner", name: "?ш컼湲?, price: 5000, ability: "肄붿씤 X3 ?띾뱷", unlockForm: "Plesiosaur" },
  { id: "Rocket", name: "濡쒖폆", price: 6000, ability: "誘몄궗??100諛?(泥좏눜, ?뚰뻾?? 踰덇컻援щ쫫 ?뚭눼) (留덉슦???쇱そ 踰꾪듉)", unlockForm: "Quetzalcoatlus" },
  { id: "SpaceShuttle", name: "?ㅽ럹?댁뒪 ?뷀?", price: 8000, ability: "500m 遺?ㅽ꽣 2??(紐⑤뱺 ?μ븷臾??뚭눼)", unlockForm: "Darwin's Finch" },
  { id: "UFO", name: "UFO", price: 12000, ability: "1000m 遺?ㅽ꽣 2??+ ?덉씠? 200諛?(紐⑤뱺 ?μ븷臾??뚭눼)", unlockForm: "Darwin's Finch" }
];

var shopUpgradeData = [
  { id: "extraHeart1", name: "?섑듃 +1", icon: "?ㅿ툘", desc: "?쒖옉 ?섑듃 3??媛?, price: 300 },
  { id: "extraHeart2", name: "?섑듃 +2", icon: "?뮇", desc: "?쒖옉 ?섑듃 4??媛?, price: 800, requires: "extraHeart1" },
  { id: "continueDiscount", name: "而⑦떚???좎씤", icon: "?뮥", desc: "而⑦떚??鍮꾩슜 30% 媛먯냼", price: 500 },
  { id: "coinBooster", name: "肄붿씤 遺?ㅽ꽣", icon: "??, desc: "肄붿씤 ?띾뱷??2諛?, price: 1000 }
];

var evoVehicleData = [
  { id: "Amoeba", name: "?꾨찓諛?, levelReq: 1 },
  { id: "Anomalocaris", name: "?꾨끂留먮줈移대━??, levelReq: 2 },
  { id: "Dunkleosteus", name: "?뷀겢?덉삤?ㅽ뀒?곗뒪", levelReq: 3 },
  { id: "Tiktaalik", name: "?깊??뚮┃", levelReq: 4 },
  { id: "Plesiosaur", name: "?뚮젅?쒖삤?ъ슦猷⑥뒪", levelReq: 5 },
  { id: "Quetzalcoatlus", name: "耳李곗퐫?꾪?猷⑥뒪", levelReq: 6 },
  { id: "Darwin's Finch", name: "?ㅼ쐢???移?, levelReq: 7 }
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
    var isUnlocked = v.unlockForm ? (shopState.unlockedEvoForms.indexOf(v.unlockForm) !== -1) : shopState.darwinFinchReached;
    var isPurchased = shopState.unlockedVehicles.indexOf(v.id) !== -1;
    var isSelected = shopState.selectedVehicle === v.id;

    var card = document.createElement('div');
    card.className = 'vehicle-card' + (isSelected ? ' selected' : '') + (!isUnlocked ? ' locked' : '');

    var previewId = 'vehiclePreview_' + i;
    var previewHTML = '<div class="vehicle-preview" id="' + previewId + '">';
    if (!isUnlocked) {
      previewHTML += '<div class="vehicle-lock-overlay">?뵏</div>';
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
      btn.textContent = '?뵏 ' + (v.unlockForm || '?ㅼ쐢???移?) + '源뚯? 吏꾪솕 ???닿툑';
      btn.disabled = true;
    } else if (isPurchased && isSelected) {
      btn.className += ' vehicle-btn--selected';
      btn.textContent = '???좏깮??;
    } else if (isPurchased) {
      btn.className += ' vehicle-btn--select';
      btn.textContent = '?좏깮?섍린';
      (function(vid) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          selectVehicle(vid);
        });
      })(v.id);
    } else {
      btn.className += ' vehicle-btn--buy';
      btn.textContent = v.price + ' ?첌 援щℓ';
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
      btn.textContent = '??蹂댁쑀';
    } else {
      btn.className += ' upgrade-btn--buy';
      btn.textContent = u.price + ' ?첌';
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
      previewHTML += '<div class="vehicle-lock-overlay">?뵏</div>';
    }
    previewHTML += '</div>';

    card.innerHTML = previewHTML +
      '<p class="vehicle-name">' + v.name + '</p>' +
      '<p class="vehicle-ability">吏꾪솕 ?덈꺼 ' + v.levelReq + ' ?꾨떖 ???닿툑</p>';

    var btn = document.createElement('button');
    btn.className = 'vehicle-btn';
    if (!isUnlocked) {
      btn.className += ' vehicle-btn--locked';
      btn.textContent = '?뵏 誘명빐湲?;
      btn.disabled = true;
    } else if (isSelected || isDefault) {
      btn.className += ' vehicle-btn--selected';
      btn.textContent = '???좏깮??;
    } else {
      btn.className += ' vehicle-btn--select';
      btn.textContent = '?좏깮?섍린';
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

  // ?좏깮??鍮꾪뻾泥닿? 蹂寃쎈릺?덉쑝硫??ъ쓽 鍮꾪뻾湲?援먯껜
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
  // ?댄꽩???ш낵: 7媛쒕줈 ?쒖옉
  if (shopState.selectedVehicle === "Newton's Apple") hearts = 7;
  return hearts;
}

// Get max hearts based on vehicle
function getStartingMaxHearts() {
  // ?댄꽩???ш낵: 理쒕? 7媛?
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
  'Einstein': { type: 'slowmo', icon: '?깍툘', uses: 3, cooldownMs: 1000 },
  'Wright Flyer': { type: 'invincible', icon: '?썳截?, uses: 2, cooldownMs: 1000 },
  'Rocket': { type: 'missile', icon: '??', uses: 100, cooldownMs: 100 },
  'SpaceShuttle': { type: 'booster', icon: '?뵦', uses: 2, cooldownMs: 2000 },
  'UFO': { type: 'ufo', icon: '?뫝', uses: 2, cooldownMs: 100 }
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
      activateAbility(); // ?덉씠? 諛쒖궗
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

  // 蹂댁뒪??諛쒖궗 踰꾪듉
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
    // ?쇰컲 鍮꾪뻾泥? ?⑥씪 踰꾪듉 UI
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
  // 湲곗〈 臾댁쟻 ?쒖뒪???ъ슜 (湲덈튆 湲濡쒖슦 ?댄럺???ы븿)
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
      updateAbilityUI(); // 遺?ㅽ꽣 踰꾪듉 ?ы솢?깊솕
    } else {
      // 遺?ㅽ꽣 以??μ븷臾??먮룞 ?뚭눼
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

      // ?곸쓽 ?붾뱶 醫뚰몴 怨꾩궛
      var enemyWorldPos = new THREE.Vector3();
      ennemy.mesh.getWorldPosition(enemyWorldPos);

      var dx = proj.mesh.position.x - enemyWorldPos.x;
      var dy = proj.mesh.position.y - enemyWorldPos.y;
      var dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 30) {
        // ?뚭눼 + ?뚰떚??+ ?④낵??
        var destroyPos = enemyWorldPos.clone();
        ennemiesHolder.mesh.remove(ennemy.mesh);
        ennemiesHolder.ennemiesInUse.splice(i, 1);
        proj.life = 0;
        spawnDestroyParticles(destroyPos, 0x666666);
        playShatterSound();
        return;
      }
    }
  }

  // ?좎븘?ㅻ뒗 ?뚰뻾??
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
        spawnDestroyParticles(destroyPos2, 0x996633);
        playShatterSound();
        return;
      }
    }
  }
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

// 遺?ㅽ꽣 以?洹쇱쿂 ?μ븷臾??먮룞 ?뚭눼
function destroyNearbyEnemies() {
  if (!airplane || !airplane.mesh) return;
  var planePos = airplane.mesh.position;
  var destroyRange = 60;

  // ?쇰컲 ?μ븷臾?
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
        ennemiesHolder.mesh.remove(ennemy.mesh);
        ennemiesHolder.ennemiesInUse.splice(i, 1);
        spawnDestroyParticles(dpos, 0x666666);
        playShatterSound();
      }
    }
  }

  // ?좎븘?ㅻ뒗 ?뚰뻾??
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
        spawnDestroyParticles(dpos2, 0x996633);
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
  tentacleAttackTimer: 0,
  tentacleAttacking: false,
  tentaclePhase: 0
};

var bossConfigs = [
  { name: '嫄곕? ?붾え?섏씠??, hp: 15, reward: 150, color: 0xDDAA22, distance: 2000 },
  { name: '硫붽컝濡쒕룉', hp: 20, reward: 200, color: 0x4466AA, distance: 4000 },
  { name: '?곕씪?몄궗?곕Ⅴ??, hp: 30, reward: 300, color: 0x664422, distance: 7000 },
  { name: '?멸퀎 紐⑥꽑', hp: 40, reward: 400, color: 0x44AA66, distance: 11000 }
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

function checkBossTrigger() {
  if (bossState.active) return;
  // 蹂댁뒪 荑⑤떎??以묒씠硫?媛먯냼?쒗궎怨??ㅽ룿 ????
  if (bossState.cooldown > 0) {
    bossState.cooldown -= 16; // ~60fps
    return;
  }
  var d = Math.floor(game.distance);
  // 2000m 媛꾧꺽?쇰줈 蹂댁뒪 ?쒗솚
  var interval = 2000;
  var triggerDist = Math.floor(d / interval) * interval;
  if (triggerDist < interval) return;
  if (bossState.triggered.indexOf(triggerDist) !== -1) return;

  bossState.triggered.push(triggerDist);
  var cycleIndex = (Math.floor(triggerDist / interval) - 1) % bossConfigs.length;
  var config = bossConfigs[cycleIndex];
  spawnBoss(config, cycleIndex);
}

function createBossMesh(config, cycleIndex) {
  var group = new THREE.Object3D();
  var type = cycleIndex % 4;

  if (type === 0) {
    // ?붾え?섏씠?????뚮룎 留먮┛ ?섏꽑 猿띾뜲湲??ㅻⅨ履? + ?쇱そ 珥됱닔
    // ?섏꽑 猿띾뜲湲? 濡쒓렇 ?섏꽑 寃쎈줈??援ъ껜 諛곗튂 (湲덉깋+寃??以꾨Т??
    var shellGroup = new THREE.Object3D();
    var spiralSteps = 36;
    var sa = 3, sb = 0.17;
    for (var si = 0; si < spiralSteps; si++) {
      var theta = si * 0.45;
      var sr = sa * Math.exp(sb * theta);
      var sz = 1.2 + sr * 0.3;
      var sphereGeom = new THREE.SphereGeometry(sz, 6, 5);
      var isStripe = (si % 3 === 0);
      var sphereMat = new THREE.MeshPhongMaterial({
        color: isStripe ? 0x332200 : 0xDDAA22,
        flatShading: true
      });
      var sphere = new THREE.Mesh(sphereGeom, sphereMat);
      sphere.position.set(
        Math.cos(theta) * sr + 8,
        Math.sin(theta) * sr + 2,
        0
      );
      shellGroup.add(sphere);
    }
    // ?섏꽑 以묒떖
    var ctrGeom = new THREE.SphereGeometry(3.5, 6, 6);
    var ctrMat = new THREE.MeshPhongMaterial({ color: 0xCCAA33, flatShading: true });
    var ctr = new THREE.Mesh(ctrGeom, ctrMat);
    ctr.position.set(8, 2, 0);
    shellGroup.add(ctr);
    group.add(shellGroup);

    // 遺꾪솉 紐몄껜 (猿띾뜲湲??꾨옒?먯꽌 ?쇱そ?쇰줈)
    var bdGeom = new THREE.CylinderGeometry(7, 5, 22, 8);
    var bdMat = new THREE.MeshPhongMaterial({ color: 0xEE8877, flatShading: true });
    var bd = new THREE.Mesh(bdGeom, bdMat);
    bd.rotation.z = Math.PI / 2;
    bd.position.set(-15, -6, 0);
    group.add(bd);

    // ??(紐몄껜 痢〓㈃)
    var eGeom = new THREE.SphereGeometry(3, 8, 8);
    var eMat = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
    var eMesh = new THREE.Mesh(eGeom, eMat);
    eMesh.position.set(-8, -3, 7);
    group.add(eMesh);
    var pGeom = new THREE.SphereGeometry(1.5, 6, 6);
    var pMat = new THREE.MeshPhongMaterial({ color: 0x111111 });
    var pMesh = new THREE.Mesh(pGeom, pMat);
    pMesh.position.set(-8, -3, 9.5);
    group.add(pMesh);

    // 珥됱닔 10媛????쇱そ(-X)?쇰줈 六쀬뼱?섍컧
    group.tentacles = [];
    for (var t = 0; t < 10; t++) {
      var tGrp = new THREE.Object3D();
      var nSeg = 4 + Math.floor(Math.random() * 2);
      var cx = 0;
      for (var sg = 0; sg < nSeg; sg++) {
        var sLen = 5 + Math.random() * 3;
        var tk = 1.8 - sg * 0.25;
        if (tk < 0.4) tk = 0.4;
        var sgGeom = new THREE.CylinderGeometry(tk, tk * 0.8, sLen, 5);
        var sgMat = new THREE.MeshPhongMaterial({
          color: sg < 2 ? 0xEE8877 : 0xDD6644,
          flatShading: true
        });
        var sgMesh = new THREE.Mesh(sgGeom, sgMat);
        sgMesh.rotation.z = Math.PI / 2;
        sgMesh.position.set(cx - sLen / 2, 0, 0);
        tGrp.add(sgMesh);
        cx -= sLen;
      }
      var sprd = (t / 9 - 0.5) * 2;
      tGrp.position.set(-25, -6 + sprd * 4, sprd * 4);
      tGrp.rotation.z = sprd * 0.12;
      tGrp.rotation.y = sprd * 0.08;
      group.add(tGrp);
      group.tentacles.push(tGrp);
    }
  } else if (type === 1) {
    // 硫붽컝濡쒕룉 ??嫄곕? ?곸뼱 痢〓㈃
    // 紐명넻
    var bodyG = new THREE.SphereGeometry(12, 8, 6);
    var bodyM = new THREE.MeshPhongMaterial({ color: 0x8899AA, flatShading: true });
    var bodyMesh = new THREE.Mesh(bodyG, bodyM);
    bodyMesh.scale.set(2.1, 1, 0.85);
    group.add(bodyMesh);
    // 諛?(?섏???
    var bellyG = new THREE.SphereGeometry(10, 8, 6);
    var bellyM = new THREE.MeshPhongMaterial({ color: 0xDDDDCC, flatShading: true });
    var belly = new THREE.Mesh(bellyG, bellyM);
    belly.scale.set(2.2, 0.8, 0.9);
    belly.position.set(2, -5, 0);
    group.add(belly);
    // 癒몃━ (?욎そ)
    var headG = new THREE.SphereGeometry(11, 8, 6);
    var headM = new THREE.MeshPhongMaterial({ color: 0x8899AA, flatShading: true });
    var headMesh = new THREE.Mesh(headG, headM);
    headMesh.position.set(-22, 2, 0);
    group.add(headMesh);
    // ??(踰뚯뼱吏???
    var upperJawG = new THREE.BoxGeometry(14, 4, 16);
    var jawM = new THREE.MeshPhongMaterial({ color: 0x993333, flatShading: true });
    var upperJaw = new THREE.Mesh(upperJawG, jawM);
    upperJaw.position.set(-30, 2, 0);
    group.add(upperJaw);
    var lowerJawG = new THREE.BoxGeometry(12, 3, 14);
    var lowerJaw = new THREE.Mesh(lowerJawG, jawM);
    lowerJaw.position.set(-29, -4, 0);
    lowerJaw.rotation.z = 0.2;
    group.add(lowerJaw);
    // ?대묠 (?꾩븘??
    for (var ti = 0; ti < 8; ti++) {
      var tG = new THREE.CylinderGeometry(0, 0.8, 3.5, 4);
      var tM = new THREE.MeshPhongMaterial({ color: 0xFFFFEE });
      var tUp = new THREE.Mesh(tG, tM);
      tUp.position.set(-26 - ti * 1.2, -1, -5 + ti * 1.3);
      tUp.rotation.x = Math.PI;
      group.add(tUp);
      var tDn = new THREE.Mesh(tG.clone(), tM.clone());
      tDn.position.set(-25 - ti * 1.2, -3, -5 + ti * 1.3);
      group.add(tDn);
    }
    // ?깆??먮윭誘?
    var dorG = new THREE.CylinderGeometry(0, 4, 18, 4);
    var dorM = new THREE.MeshPhongMaterial({ color: 0x667788, flatShading: true });
    var dorsal = new THREE.Mesh(dorG, dorM);
    dorsal.position.set(0, 16, 0);
    dorsal.rotation.z = 0.15;
    group.add(dorsal);
    // 瑗щ━ 吏?먮윭誘?
    var tailG = new THREE.CylinderGeometry(0, 6, 15, 4);
    var tail = new THREE.Mesh(tailG, dorM.clone());
    tail.position.set(28, 6, 0);
    tail.rotation.z = -0.8;
    group.add(tail);
    var tailLow = new THREE.Mesh(tailG.clone(), dorM.clone());
    tailLow.position.set(28, -4, 0);
    tailLow.rotation.z = 0.6;
    group.add(tailLow);
    // ??
    var sharkEyeG = new THREE.SphereGeometry(2.5, 6, 6);
    var sharkEyeM = new THREE.MeshPhongMaterial({ color: 0x111111 });
    var sharkEye = new THREE.Mesh(sharkEyeG, sharkEyeM);
    sharkEye.position.set(-18, 6, 9);
    group.add(sharkEye);
  } else if (type === 2) {
    // ?곕씪?몄궗?곕Ⅴ?????꾩껜 痢〓㈃
    var dkBrown = 0x665533;
    var ltBrown = 0x887755;
    // 紐명넻
    var torsoG = new THREE.SphereGeometry(14, 8, 6);
    var torsoM = new THREE.MeshPhongMaterial({ color: dkBrown, flatShading: true });
    var torso = new THREE.Mesh(torsoG, torsoM);
    torso.scale.set(1.3, 1, 0.7);
    group.add(torso);
    // 癒몃━
    var rHeadG = new THREE.BoxGeometry(22, 16, 16);
    var rHeadM = new THREE.MeshPhongMaterial({ color: ltBrown, flatShading: true });
    var rHead = new THREE.Mesh(rHeadG, rHeadM);
    rHead.position.set(-25, 12, 0);
    group.add(rHead);
    // 二쇰뫁??
    var snoutG = new THREE.BoxGeometry(14, 8, 14);
    var snout = new THREE.Mesh(snoutG, rHeadM.clone());
    snout.position.set(-36, 8, 0);
    group.add(snout);
    // ?꾨옒??
    var rJawG = new THREE.BoxGeometry(16, 5, 13);
    var rJawM = new THREE.MeshPhongMaterial({ color: 0x884433, flatShading: true });
    var rJaw = new THREE.Mesh(rJawG, rJawM);
    rJaw.position.set(-32, 0, 0);
    rJaw.rotation.z = 0.15;
    group.add(rJaw);
    // ?대묠
    for (var ri = 0; ri < 7; ri++) {
      var rtG = new THREE.CylinderGeometry(0, 1, 4, 4);
      var rtM = new THREE.MeshPhongMaterial({ color: 0xFFFFDD });
      var rtMesh = new THREE.Mesh(rtG, rtM);
      rtMesh.position.set(-28 - ri * 2, 3, 7);
      rtMesh.rotation.x = Math.PI;
      group.add(rtMesh);
    }
    // 紐?
    var neckG = new THREE.CylinderGeometry(8, 10, 12, 6);
    var neckM = new THREE.MeshPhongMaterial({ color: dkBrown, flatShading: true });
    var neck = new THREE.Mesh(neckG, neckM);
    neck.position.set(-12, 8, 0);
    neck.rotation.z = 0.4;
    group.add(neck);
    // 瑗щ━
    var tailRG = new THREE.CylinderGeometry(0, 7, 35, 6);
    var tailRM = new THREE.MeshPhongMaterial({ color: dkBrown, flatShading: true });
    var tailR = new THREE.Mesh(tailRG, tailRM);
    tailR.position.set(28, 2, 0);
    tailR.rotation.z = Math.PI / 2 + 0.2;
    group.add(tailR);
    // ?ㅻ━
    var legFG = new THREE.CylinderGeometry(3.5, 3, 18, 5);
    var legFM = new THREE.MeshPhongMaterial({ color: ltBrown, flatShading: true });
    var legF = new THREE.Mesh(legFG, legFM);
    legF.position.set(-5, -16, 6);
    group.add(legF);
    var legBG = new THREE.CylinderGeometry(4, 3.5, 20, 5);
    var legB = new THREE.Mesh(legBG, legFM.clone());
    legB.position.set(12, -17, 6);
    group.add(legB);
    // ?묒? ??
    var armG = new THREE.CylinderGeometry(1.5, 1, 7, 4);
    var armM = new THREE.MeshPhongMaterial({ color: ltBrown, flatShading: true });
    var arm = new THREE.Mesh(armG, armM);
    arm.position.set(-15, -2, 9);
    arm.rotation.z = 0.5;
    group.add(arm);
    // ??
    var rexEyeG = new THREE.SphereGeometry(2.5, 6, 6);
    var rexEyeM = new THREE.MeshPhongMaterial({ color: 0xFFDD00, emissive: 0xAA8800 });
    var rexEye = new THREE.Mesh(rexEyeG, rexEyeM);
    rexEye.position.set(-28, 16, 8);
    group.add(rexEye);
  } else {
    // ?멸퀎 紐⑥꽑 ??UFO (?섑룊 諛곗튂)
    var lowerDiscG = new THREE.CylinderGeometry(32, 38, 6, 16);
    var lowerDiscM = new THREE.MeshPhongMaterial({ color: 0x888899, flatShading: true });
    var lowerDisc = new THREE.Mesh(lowerDiscG, lowerDiscM);
    group.add(lowerDisc);
    var upperDiscG = new THREE.CylinderGeometry(28, 32, 5, 16);
    var upperDiscM = new THREE.MeshPhongMaterial({ color: 0x99AABB, flatShading: true });
    var upperDisc = new THREE.Mesh(upperDiscG, upperDiscM);
    upperDisc.position.set(0, 4, 0);
    group.add(upperDisc);
    // 援щ━????
    var bandG = new THREE.TorusGeometry(33, 1.5, 6, 16);
    var bandM = new THREE.MeshPhongMaterial({ color: 0xCC8844, flatShading: true });
    var band = new THREE.Mesh(bandG, bandM);
    band.rotation.x = Math.PI / 2;
    group.add(band);
    // ?좊━ ??
    var udomeG = new THREE.SphereGeometry(14, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    var udomeM = new THREE.MeshPhongMaterial({ color: 0xAADDFF, transparent: true, opacity: 0.5, emissive: 0x446688 });
    var udome = new THREE.Mesh(udomeG, udomeM);
    udome.position.set(0, 7, 0);
    group.add(udome);
    // ?섎? ?붿쭊 ?щ뱶 5媛?
    for (var ep = 0; ep < 5; ep++) {
      var podG = new THREE.CylinderGeometry(3, 4, 6, 6);
      var podM = new THREE.MeshPhongMaterial({ color: 0x556677, flatShading: true });
      var pod = new THREE.Mesh(podG, podM);
      var pAngle = (ep / 5) * Math.PI * 2;
      pod.position.set(Math.cos(pAngle) * 22, -6, Math.sin(pAngle) * 22);
      group.add(pod);
      var glowG = new THREE.SphereGeometry(2.5, 4, 4);
      var glowM = new THREE.MeshPhongMaterial({ color: 0x00CCFF, emissive: 0x0088FF });
      var glow = new THREE.Mesh(glowG, glowM);
      glow.position.set(Math.cos(pAngle) * 22, -9, Math.sin(pAngle) * 22);
      group.add(glow);
    }
    // 諛쒓킅 留?
    var ringG = new THREE.TorusGeometry(26, 0.8, 4, 20);
    var ringM = new THREE.MeshPhongMaterial({ color: 0xFFAA00, emissive: 0xFF8800 });
    var ring = new THREE.Mesh(ringG, ringM);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, -3, 0);
    group.add(ring);
  }

  return group;
}

function spawnBoss(config, typeIndex) {
  bossState.active = true;
  bossState.hp = config.hp;
  bossState.maxHp = config.hp;
  bossState.timer = bossState.maxTimer;
  bossState.reward = config.reward;
  bossState.name = config.name;
  bossState.entering = true;
  bossState.oscillateTime = 0;
  bossState.missiles = [];

  var cycleIndex = (typeIndex !== undefined) ? typeIndex : 0;
  bossState.bossType = cycleIndex % 4;
  bossState.mesh = createBossMesh(config, cycleIndex);
  bossState.mesh.position.set(250, game.planeDefaultHeight + 30, 0);
  bossState.mesh.scale.set(1.5, 1.5, 1.5);
  scene.add(bossState.mesh);

  // UI
  var ui = document.getElementById('bossUI');
  if (ui) ui.style.display = 'block';
  var nameEl = document.getElementById('bossName');
  if (nameEl) nameEl.textContent = '??' + config.name;
  // 紐⑤컮??諛쒖궗 踰꾪듉 ?쒖떆
  var fireUI = document.getElementById('bossFireUI');
  if (fireUI) fireUI.style.display = 'flex';
  updateBossUI();

  // 蹂댁뒪 ?깆옣 誘몄궗??媛?대뱶
  showBossGuide();
}

function updateBossUI() {
  var hpBar = document.getElementById('bossHpBar');
  if (hpBar) hpBar.style.width = Math.max(0, (bossState.hp / bossState.maxHp) * 100) + '%';
  var timerEl = document.getElementById('bossTimer');
  if (timerEl) timerEl.textContent = Math.ceil(bossState.timer / 1000) + 's';
}

function updateBoss(dt) {
  if (!bossState.active || !bossState.mesh) return;

  // 吏꾩엯 ?좊땲硫붿씠??
  if (bossState.entering) {
    bossState.mesh.position.x += (bossState.targetX - bossState.mesh.position.x) * 0.03;
    if (Math.abs(bossState.mesh.position.x - bossState.targetX) < 2) {
      bossState.entering = false;
    }
  }

  // ?꾩븘???ㅼ떎?덉씠??
  bossState.oscillateTime += dt * 0.002;
  bossState.mesh.position.y = game.planeDefaultHeight + 30 + Math.sin(bossState.oscillateTime) * 40;
  // ?붾え?섏씠?몃뒗 ?뚯쟾 ?놁씠 痢〓㈃留?
  if (bossState.bossType !== 0) {
    bossState.mesh.rotation.y += 0.01;
  }

  // ?붾え?섏씠??珥됱닔 ?붾뱾由??좊땲硫붿씠??(怨듦꺽 ?놁쓬)
  if (bossState.bossType === 0 && bossState.mesh && bossState.mesh.tentacles) {
    var time = bossState.oscillateTime;
    for (var ti = 0; ti < bossState.mesh.tentacles.length; ti++) {
      var tent = bossState.mesh.tentacles[ti];
      tent.rotation.x = Math.sin(time * 2 + ti) * 0.3;
      tent.rotation.z = Math.sin(time * 1.5 + ti * 0.7) * 0.2;
    }
  }

  // ??대㉧ 媛먯냼
  bossState.timer -= dt;
  updateBossUI();

  // 誘몄궗???낅뜲?댄듃
  for (var i = bossState.missiles.length - 1; i >= 0; i--) {
    var m = bossState.missiles[i];
    m.mesh.position.x += m.speed;
    m.life -= dt;

    if (m.life <= 0) {
      scene.remove(m.mesh);
      bossState.missiles.splice(i, 1);
      continue;
    }

    // 蹂댁뒪? 異⑸룎 泥댄겕
    if (bossState.mesh) {
      var dx = m.mesh.position.x - bossState.mesh.position.x;
      var dy = m.mesh.position.y - bossState.mesh.position.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 45) {
        bossState.hp--;
        scene.remove(m.mesh);
        bossState.missiles.splice(i, 1);
        // ?뚰떚??
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

  // ??꾩븘????蹂댁뒪 ?닿컖
  if (bossState.timer <= 0) {
    retreatBoss();
  }
}

function fireBossMissile() {
  if (!bossState.active || !airplane || !airplane.mesh) return;

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
  var dx = px - bx;
  var dy = py - by;
  var dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 1) dist = 1;
  var speed = 3;
  var vx = (dx / dist) * speed;
  var vy = (dy / dist) * speed;

  var projMesh;
  var isLaser = false;

  if (bossState.bossType === 1 || bossState.bossType === 2) {
    // ?대묠 諛쒖궗
    var toothG = new THREE.CylinderGeometry(0, 2, 6, 4);
    var toothM = new THREE.MeshPhongMaterial({ color: 0xFFFFDD, flatShading: true });
    projMesh = new THREE.Mesh(toothG, toothM);
    projMesh.rotation.z = Math.atan2(dy, dx) - Math.PI / 2;
  } else {
    // UFO ?덉씠?鍮?
    var laserG = new THREE.CylinderGeometry(1, 1, 15, 6);
    var laserM = new THREE.MeshPhongMaterial({ color: 0x00FFCC, emissive: 0x00AA88, transparent: true, opacity: 0.8 });
    projMesh = new THREE.Mesh(laserG, laserM);
    projMesh.rotation.z = Math.atan2(dy, dx) + Math.PI / 2;
    isLaser = true;
    speed = 4;
    vx = (dx / dist) * speed;
    vy = (dy / dist) * speed;
  }

  projMesh.position.set(bx - 20, by, 0);
  scene.add(projMesh);

  bossState.bossProjectiles.push({
    mesh: projMesh,
    vx: vx,
    vy: vy,
    life: 4000,
    isLaser: isLaser
  });
}

function defeatBoss() {
  if (!bossState.mesh) return;

  // ???컻 ?뚰떚??
  for (var p = 0; p < 5; p++) {
    var offset = new THREE.Vector3(
      bossState.mesh.position.x + (Math.random() - 0.5) * 30,
      bossState.mesh.position.y + (Math.random() - 0.5) * 30,
      bossState.mesh.position.z + (Math.random() - 0.5) * 20
    );
    spawnDestroyParticles(offset, 0xFF6600);
  }
  playShatterSound();

  // 肄붿씤 蹂댁긽
  var reward = bossState.reward;
  game.coins += reward;
  game.coinsEarnedThisRound += reward;
  var totalCoins = parseInt(localStorage.getItem('totalCoins') || '0');
  localStorage.setItem('totalCoins', (totalCoins + reward).toString());
  var coinsEl = document.getElementById('coinsValue');
  if (coinsEl) coinsEl.textContent = game.coins;

  // 蹂댁긽 ?쒖떆
  showBossReward(reward);

  cleanupBoss();
}

function retreatBoss() {
  // 蹂댁뒪 ?닿컖 (蹂댁긽 ?놁씠)
  cleanupBoss();
}

function cleanupBoss() {
  if (bossState.mesh) {
    scene.remove(bossState.mesh);
    bossState.mesh = null;
  }
  // 誘몄궗???뺣━
  for (var i = 0; i < bossState.missiles.length; i++) {
    scene.remove(bossState.missiles[i].mesh);
  }
  bossState.missiles = [];
  // 蹂댁뒪 諛쒖궗泥??뺣━
  if (bossState.bossProjectiles) {
    for (var j = 0; j < bossState.bossProjectiles.length; j++) {
      scene.remove(bossState.bossProjectiles[j].mesh);
    }
    bossState.bossProjectiles = [];
  }
  bossState.bossAttackTimer = 0;
  bossState.active = false;
  bossState.cooldown = 500; // 0.5珥?荑⑤떎??(?뚯뒪?몄슜)
  // 留덉슦??????명꽣踰??뺣━ (蹂댁뒪???곗궗 以묒?)
  mouseIsDown = false;
  if (mouseHoldInterval) {
    clearInterval(mouseHoldInterval);
    mouseHoldInterval = null;
  }
  // UI ?④린湲?
  var ui = document.getElementById('bossUI');
  if (ui) ui.style.display = 'none';
  var fireUI = document.getElementById('bossFireUI');
  if (fireUI) fireUI.style.display = 'none';
}

function showBossReward(amount) {
  var el = document.getElementById('levelUpText');
  if (el) {
    el.innerHTML = '<p class="level-label">?뮗 Coin Bomb!</p><p class="level-number">+' + amount + '</p>';
    el.classList.add('show');
    setTimeout(function() {
      el.classList.remove('show');
    }, 2000);
  }
}

function showBossGuide() {
  // 湲곗〈 媛?대뱶 ?쒓굅
  var old = document.getElementById('bossGuide');
  if (old) old.remove();

  var guide = document.createElement('div');
  guide.id = 'bossGuide';
  guide.style.cssText = 'position:fixed;left:50%;top:60%;transform:translate(-50%,-50%);z-index:2000;display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none;animation:fadeInOut 3s ease forwards;';
  guide.innerHTML = '<div style="font-size:60px;line-height:1;">?뼮截?/div>' +
    '<div style="color:white;font-size:20px;font-weight:bold;text-shadow:0 2px 8px rgba(0,0,0,0.8);background:rgba(0,0,0,0.5);padding:8px 20px;border-radius:10px;white-space:nowrap;">留덉슦???쇱そ ?대┃ ??誘몄궗??諛쒖궗!</div>';
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
