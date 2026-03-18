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
          distanceForSpeedUpdate:100,
          speedLastUpdate:0,

          distance:0,
          ratioSpeedDistance:50,
          energy:100,
          ratioSpeedEnergy:3,

          level:1,
          levelLastUpdate:0,
          distanceForLevelUpdate:1000,

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
          coinValue:3,
          coinsSpeed:.5,
          coinLastSpawn:0,
          distanceForCoinsSpawn:100,

          ennemyDistanceTolerance:10,
          ennemyValue:10,
          ennemiesSpeed:.6,
          ennemyLastSpawn:0,
          distanceForEnnemiesSpawn:50,

          status : "playing",
          
          // Transformation parameters
          transformDistance1 : 1000,
          transformDistance2 : 2000,
          transformDistance3 : 3000,
          transformDistance4 : 4000,
          transformDistance5 : 5000,
          transformDistance6 : 6000,
          transformDistance7 : 7000,
          transformDistance8 : 8000,
          transformDistance9 : 9000,
          transformDistance10 : 10000,
          transformDistance11 : 11000,
          transformDistance12 : 12000,
          transformDistance13 : 13000,
          currentForm : "Amoeba", // Stage 1
          transforming : false,

          // Invincibility
          invincible : false,
          invincibleTime : 0,
          invincibleDuration : 5000, // 5초
          invincibleFruitDistanceTolerance : 18,
          invincibleFruitSpeed : 0.4,
          invincibleFruitLastSpawn : 0,
          distanceForInvincibleSpawn : 800, // 코인(100)의 8배 간격
         };
  fieldLevel.innerHTML = Math.floor(game.level);
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
}

EnnemiesHolder = function (){
  this.mesh = new THREE.Object3D();
  this.ennemiesInUse = [];
}

EnnemiesHolder.prototype.spawnEnnemies = function(){
  var nEnnemies = game.level;

  for (var i=0; i<nEnnemies; i++){
    var ennemy;
    if (ennemiesPool.length) {
      ennemy = ennemiesPool.pop();
    }else{
      ennemy = new Ennemy();
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

    ennemy.mesh.position.y = -game.seaRadius + Math.sin(ennemy.angle)*ennemy.distance;
    ennemy.mesh.position.x = Math.cos(ennemy.angle)*ennemy.distance;
    ennemy.mesh.rotation.z += Math.random()*.1;
    ennemy.mesh.rotation.y += Math.random()*.1;

    //var globalEnnemyPosition =  ennemy.mesh.localToWorld(new THREE.Vector3());
    var diffPos = airplane.mesh.position.clone().sub(ennemy.mesh.position.clone());
    var d = diffPos.length();
    if (d<game.ennemyDistanceTolerance){
      if (game.invincible) {
        // 무적 상태: 장애물 파괴하고 그대로 전진
        particlesHolder.spawnParticles(ennemy.mesh.position.clone(), 20, 0xFFD700, 2);
        ennemiesPool.unshift(this.ennemiesInUse.splice(i,1)[0]);
        this.mesh.remove(ennemy.mesh);
        playInvincibleSmashSound();
        i--;
      } else {
        // 일반 상태: 기존 동작 (튕겨남 + 에너지 감소)
        particlesHolder.spawnParticles(ennemy.mesh.position.clone(), 15, 0x333333, 3);
        ennemiesPool.unshift(this.ennemiesInUse.splice(i,1)[0]);
        this.mesh.remove(ennemy.mesh);
        game.planeCollisionSpeedX = 100 * diffPos.x / d;
        game.planeCollisionSpeedY = 100 * diffPos.y / d;
        ambientLight.intensity = 2;
        playDestroySound();
        removeEnergy();
        i--;
      }
    }else if (ennemy.angle > Math.PI){
      ennemiesPool.unshift(this.ennemiesInUse.splice(i,1)[0]);
      this.mesh.remove(ennemy.mesh);
      i--;
    }
  }
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
  this.mesh = new THREE.Object3D();

  // Almond shape using sphere stretched into oval
  var almondGeom = new THREE.SphereGeometry(5, 6, 4);
  // Stretch into almond shape (tall and slightly wide)
  almondGeom.applyMatrix(new THREE.Matrix4().makeScale(0.6, 1.2, 0.5));
  var almondMat = new THREE.MeshPhongMaterial({
    color:0xC4883A,
    shininess:15,
    specular:0xFFDDAA,
    shading:THREE.FlatShading
  });
  var almond = new THREE.Mesh(almondGeom, almondMat);
  this.mesh.add(almond);

  // Light line on almond side
  var lineGeom = new THREE.BoxGeometry(0.5,9,1.5);
  var lineMat = new THREE.MeshPhongMaterial({
    color:0xDDA855,
    shininess:5,
    specular:0xFFEECC,
    shading:THREE.FlatShading
  });
  var line = new THREE.Mesh(lineGeom, lineMat);
  line.position.set(2.8,0,0);
  this.mesh.add(line);

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
      addEnergy();
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
  airplane = new Amoeba();
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

function transformPlane(newFormString) {
  // 이미 변신 중이면 무시
  if (game.transforming) return;
  game.transforming = true;
  
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

function loop(){

  if (paused) {
    requestAnimationFrame(loop);
    return;
  }

  newTime = new Date().getTime();
  deltaTime = newTime-oldTime;
  oldTime = newTime;

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

    if (Math.floor(game.distance)%game.distanceForSpeedUpdate == 0 && Math.floor(game.distance) > game.speedLastUpdate){
      game.speedLastUpdate = Math.floor(game.distance);
      game.targetBaseSpeed += game.incrementSpeedByTime*deltaTime;
    }


    if (Math.floor(game.distance)%game.distanceForEnnemiesSpawn == 0 && Math.floor(game.distance) > game.ennemyLastSpawn){
      game.ennemyLastSpawn = Math.floor(game.distance);
      ennemiesHolder.spawnEnnemies();
    }

    if (Math.floor(game.distance)%game.distanceForLevelUpdate == 0 && Math.floor(game.distance) > game.levelLastUpdate){
      game.levelLastUpdate = Math.floor(game.distance);
      game.level++;
      fieldLevel.innerHTML = Math.floor(game.level);

      game.targetBaseSpeed = game.initSpeed + game.incrementSpeedByLevel*game.level
    }

    // Checking for Transformation
    if (game.distance > game.transformDistance1 && game.currentForm === "Amoeba") {
      transformPlane("Anomalocaris");
    } else if (game.distance > game.transformDistance2 && game.currentForm === "Anomalocaris") {
      transformPlane("Dunkleosteus");
    } else if (game.distance > game.transformDistance3 && game.currentForm === "Dunkleosteus") {
      transformPlane("Tiktaalik");
    } else if (game.distance > game.transformDistance4 && game.currentForm === "Tiktaalik") {
      transformPlane("Plesiosaur");
    } else if (game.distance > game.transformDistance5 && game.currentForm === "Plesiosaur") {
      transformPlane("Quetzalcoatlus");
    } else if (game.distance > game.transformDistance6 && game.currentForm === "Quetzalcoatlus") {
      transformPlane("Darwin's Finch");
    } else if (game.distance > game.transformDistance7 && game.currentForm === "Darwin's Finch") {
      transformPlane("Newton's Apple");
    } else if (game.distance > game.transformDistance8 && game.currentForm === "Newton's Apple") {
      transformPlane("Einstein");
    } else if (game.distance > game.transformDistance9 && game.currentForm === "Einstein") {
      transformPlane("Wright Flyer");
    } else if (game.distance > game.transformDistance10 && game.currentForm === "Wright Flyer") {
      transformPlane("Jetliner");
    } else if (game.distance > game.transformDistance11 && game.currentForm === "Jetliner") {
      transformPlane("Rocket");
    } else if (game.distance > game.transformDistance12 && game.currentForm === "Rocket") {
      transformPlane("SpaceShuttle");
    } else if (game.distance > game.transformDistance13 && game.currentForm === "SpaceShuttle") {
      transformPlane("UFO");
    }

    updatePlane();
    updateDistance();
    updateEnergy();
    game.baseSpeed += (game.targetBaseSpeed - game.baseSpeed) * deltaTime * 0.02;
    game.speed = game.baseSpeed * game.planeSpeed;

  }else if(game.status=="gameover"){
    game.speed *= .99;
    airplane.mesh.rotation.z += (-Math.PI/2 - airplane.mesh.rotation.z)*.0002*deltaTime;
    airplane.mesh.rotation.x += 0.0003*deltaTime;
    game.planeFallSpeed *= 1.05;
    airplane.mesh.position.y -= game.planeFallSpeed*deltaTime;

    if (airplane.mesh.position.y <-200){
      showGameOver();
      game.status = "waitingReplay";

    }
  }else if (game.status=="waitingReplay"){

  }


  airplane.propeller.rotation.x +=.2 + game.planeSpeed * deltaTime*.005;
  if (airplane.updateWings) airplane.updateWings();
  sea.mesh.rotation.z += game.speed*deltaTime;//*game.seaRotationSpeed;

  if ( sea.mesh.rotation.z > 2*Math.PI)  sea.mesh.rotation.z -= 2*Math.PI;

  ambientLight.intensity += (.5 - ambientLight.intensity)*deltaTime*0.005;

  coinsHolder.rotateCoins();
  ennemiesHolder.rotateEnnemies();
  invincibleFruitHolder.rotateFruits();
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

var blinkEnergy=false;

function updateEnergy(){
  game.energy -= game.speed*deltaTime*game.ratioSpeedEnergy;
  game.energy = Math.max(0, game.energy);
  energyBar.style.right = (100-game.energy)+"%";
  energyBar.style.backgroundColor = (game.energy<50)? "#D4762C" : "#2E8B57";

  if (game.energy<30){
    energyBar.style.animationName = "blinking";
  }else{
    energyBar.style.animationName = "none";
  }

  if (game.energy <1){
    game.status = "gameover";
  }
}

function addEnergy(){
  game.energy += game.coinValue;
  game.energy = Math.min(game.energy, 100);
  playCoinSound();
}

function removeEnergy(){
  if (game.invincible) return; // 무적 상태에서는 에너지 감소 안 함
  game.energy -= game.ennemyValue;
  game.energy = Math.max(0, game.energy);
}



function updatePlane(){

  game.planeSpeed = normalize(mousePos.x,-.5,.5,game.planeMinSpeed, game.planeMaxSpeed);
  var targetY = normalize(mousePos.y,-.75,.75,game.planeDefaultHeight-game.planeAmpHeight, game.planeDefaultHeight+game.planeAmpHeight);
  var targetX = normalize(mousePos.x,-1,1,-game.planeAmpWidth*.7, -game.planeAmpWidth);

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

// ===== RANKING SYSTEM =====

var RANKING_KEY = 'flyDarwinRankings';
var MAX_RANKINGS = 100;
var currentPlayerRankIndex = -1;

function getRankings() {
  try {
    var data = localStorage.getItem(RANKING_KEY);
    return data ? JSON.parse(data) : [];
  } catch(e) {
    return [];
  }
}

function saveRanking(name, distance, level, form) {
  var rankings = getRankings();
  var entry = {
    name: name,
    distance: Math.floor(distance),
    level: Math.floor(level),
    form: form,
    date: new Date().toISOString().slice(0, 10)
  };
  rankings.push(entry);
  rankings.sort(function(a, b) { return b.distance - a.distance; });
  if (rankings.length > MAX_RANKINGS) rankings = rankings.slice(0, MAX_RANKINGS);
  
  // Find current player's rank index
  currentPlayerRankIndex = -1;
  for (var i = 0; i < rankings.length; i++) {
    if (rankings[i] === entry) {
      currentPlayerRankIndex = i;
      break;
    }
  }
  // Fallback: find by matching all fields
  if (currentPlayerRankIndex === -1) {
    for (var i = 0; i < rankings.length; i++) {
      if (rankings[i].name === entry.name && 
          rankings[i].distance === entry.distance && 
          rankings[i].date === entry.date) {
        currentPlayerRankIndex = i;
        break;
      }
    }
  }
  
  localStorage.setItem(RANKING_KEY, JSON.stringify(rankings));
  return currentPlayerRankIndex;
}

function renderRankingBoard() {
  var rankings = getRankings();
  var tbody = document.getElementById('rankingBody');
  tbody.innerHTML = '';
  
  if (rankings.length === 0) {
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

function showGameOver() {
  var overlay = document.getElementById('gameOverOverlay');
  var scoreSection = document.getElementById('gameOverScore');
  var rankSection = document.getElementById('rankingBoard');
  
  // Fill final stats
  document.getElementById('finalDistance').textContent = Math.floor(game.distance).toLocaleString();
  document.getElementById('finalLevel').textContent = Math.floor(game.level);
  document.getElementById('finalForm').textContent = game.currentForm;
  
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

function submitScore() {
  var nameInput = document.getElementById('playerNameInput');
  var name = nameInput.value.trim();
  if (!name) {
    nameInput.style.borderColor = '#f25346';
    nameInput.style.boxShadow = '0 0 16px rgba(242, 83, 70, 0.3)';
    nameInput.placeholder = '닉네임을 입력해주세요!';
    nameInput.focus();
    return;
  }
  
  var rankIndex = saveRanking(name, game.distance, game.level, game.currentForm);
  
  // Switch to ranking board
  document.getElementById('gameOverScore').style.display = 'none';
  document.getElementById('rankingBoard').style.display = 'block';
  
  if (rankIndex === -1) {
    // 랭킹 진입 실패
    document.querySelector('#rankingBoard .gameover-title').textContent = '😢 아쉽지만, 랭킹 진입 실패!';
  } else {
    document.querySelector('#rankingBoard .gameover-title').textContent = '🏆 랭킹';
  }
  renderRankingBoard();
}

function startReplay() {
  hideGameOver();
  resetGame();
  // Reset plane to initial form
  var oldPos = airplane.mesh.position.clone();
  scene.remove(airplane.mesh);
  airplane = new Amoeba();
  airplane.mesh.scale.set(.25,.25,.25);
  airplane.mesh.position.y = game.planeDefaultHeight;
  scene.add(airplane.mesh);
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
}

function normalize(v,vmin,vmax,tmin, tmax){
  var nv = Math.max(Math.min(v,vmax), vmin);
  var dv = vmax-vmin;
  var pc = (nv-vmin)/dv;
  var dt = tmax-tmin;
  var tv = tmin + (pc*dt);
  return tv;
}

var fieldDistance, energyBar, replayMessage, fieldLevel, levelCircle;

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
  energyBar = document.getElementById("energyBar");
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

  document.addEventListener('mousemove', handleMouseMove, false);
  document.addEventListener('touchstart', handleTouchStart, { passive: false });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('mouseup', handleMouseUp, false);
  document.addEventListener('touchend', handleTouchEnd, false);
  document.addEventListener('keydown', handleKeyDown, false);

  initRankingUI();
  initBGM();
  loop();
}

window.addEventListener('load', init, false);

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
