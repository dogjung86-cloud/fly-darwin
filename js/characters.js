// ========================================
// CHARACTER DEFINITIONS
// Characters: Einstein + TimeArrow, Darwin + Finch, Newton + AppleCraft
// ========================================

// -------- EINSTEIN PILOT --------
var EinsteinPilot = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "einsteinPilot";
  this.angleHairs = 0;

  // Body (olive/brown jacket - larger)
  var bodyGeom = new THREE.BoxGeometry(22,20,20);
  var bodyMat = new THREE.MeshPhongMaterial({color:0x556B2F, shading:THREE.FlatShading});
  var body = new THREE.Mesh(bodyGeom, bodyMat);
  body.position.set(0,-14,0);
  this.mesh.add(body);

  // Brown pants
  var pantsGeom = new THREE.BoxGeometry(20,10,18);
  var pantsMat = new THREE.MeshPhongMaterial({color:0x5C3317, shading:THREE.FlatShading});
  var pants = new THREE.Mesh(pantsGeom, pantsMat);
  pants.position.set(0,-28,0);
  this.mesh.add(pants);

  // Arms
  var armGeom = new THREE.BoxGeometry(14,6,6);
  var armR = new THREE.Mesh(armGeom, bodyMat);
  armR.position.set(4,-10,14);
  armR.rotation.z = -0.3;
  this.mesh.add(armR);
  var armL = new THREE.Mesh(armGeom, bodyMat);
  armL.position.set(0,-10,-14);
  armL.rotation.z = 0.3;
  this.mesh.add(armL);

  // Face (larger)
  var faceGeom = new THREE.BoxGeometry(14,14,14);
  var faceMat = new THREE.MeshLambertMaterial({color:Colors.pink});
  var face = new THREE.Mesh(faceGeom, faceMat);
  this.mesh.add(face);

  // Wild curly gray hair (HUGE volume - Einstein's signature)
  var hairGeom = new THREE.BoxGeometry(5,5,5);
  var hairMat = new THREE.MeshLambertMaterial({color:0xBBBBBB});
  var hair = new THREE.Mesh(hairGeom, hairMat);
  hair.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0,2,0));
  var hairs = new THREE.Object3D();

  this.hairsTop = new THREE.Object3D();

  // 30 hair blocks for very wild hair
  for (var i=0; i<30; i++){
    var h = hair.clone();
    var col = i%5;
    var row = Math.floor(i/5);
    var startPosZ = -10;
    var startPosX = -8;
    h.position.set(startPosX + row*4, Math.random()*5, startPosZ + col*4);
    this.hairsTop.add(h);
  }
  hairs.add(this.hairsTop);

  // Side hair (very wild, big)
  var hairSideGeom = new THREE.BoxGeometry(16,8,5);
  hairSideGeom.applyMatrix(new THREE.Matrix4().makeTranslation(-8,0,0));
  var hairSideR = new THREE.Mesh(hairSideGeom, hairMat);
  var hairSideL = hairSideR.clone();
  hairSideR.position.set(10,-2,9);
  hairSideL.position.set(10,-2,-9);
  hairs.add(hairSideR);
  hairs.add(hairSideL);

  var hairBackGeom = new THREE.BoxGeometry(5,14,18);
  var hairBack = new THREE.Mesh(hairBackGeom, hairMat);
  hairBack.position.set(-4,-4,0);
  hairs.add(hairBack);
  hairs.position.set(-5,5,0);

  this.mesh.add(hairs);

  // Mustache (bigger, bushier)
  var mustacheGeom = new THREE.BoxGeometry(10,3,14);
  var mustacheMat = new THREE.MeshLambertMaterial({color:0x999999});
  var mustache = new THREE.Mesh(mustacheGeom, mustacheMat);
  mustache.position.set(6,-4,0);
  this.mesh.add(mustache);

  // Eyes
  var eyeGeom = new THREE.BoxGeometry(2,3,3);
  var eyeMat = new THREE.MeshLambertMaterial({color:0x333333});
  var eyeR = new THREE.Mesh(eyeGeom, eyeMat);
  eyeR.position.set(7,2,4);
  var eyeL = eyeR.clone();
  eyeL.position.z = -4;
  this.mesh.add(eyeR);
  this.mesh.add(eyeL);

  // Ears
  var earGeom = new THREE.BoxGeometry(3,4,3);
  var earL = new THREE.Mesh(earGeom, faceMat);
  earL.position.set(0,0,-8);
  var earR = earL.clone();
  earR.position.set(0,0,8);
  this.mesh.add(earL);
  this.mesh.add(earR);
}

EinsteinPilot.prototype.updateHairs = function(){
  var hairs = this.hairsTop.children;
  var l = hairs.length;
  for (var i=0; i<l; i++){
    var h = hairs[i];
    h.scale.y = .75 + Math.cos(this.angleHairs+i/3)*.25;
  }
  this.angleHairs += (typeof game !== 'undefined' && game.speed) ? game.speed*deltaTime*40 : 0.16;
}


// -------- TIME ARROW (Einstein's vehicle) --------
var TimeArrow = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "timeArrow";

  // Arrow body (main shaft) - white with red outline feel
  var bodyGeom = new THREE.BoxGeometry(100,32,44,1,1,1);
  var bodyMat = new THREE.MeshPhongMaterial({color:0xF5F5F0, shading:THREE.FlatShading});

  // Slight taper toward front
  bodyGeom.vertices[4].y -= 4;
  bodyGeom.vertices[4].z += 8;
  bodyGeom.vertices[5].y -= 4;
  bodyGeom.vertices[5].z -= 8;
  bodyGeom.vertices[6].y += 4;
  bodyGeom.vertices[6].z += 8;
  bodyGeom.vertices[7].y += 4;
  bodyGeom.vertices[7].z -= 8;

  var body = new THREE.Mesh(bodyGeom, bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  this.mesh.add(body);

  // Red trim top
  var trimTopGeom = new THREE.BoxGeometry(102,5,46,1,1,1);
  var trimMat = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FlatShading});
  var trimTop = new THREE.Mesh(trimTopGeom, trimMat);
  trimTop.position.set(0,18,0);
  trimTop.castShadow = true;
  this.mesh.add(trimTop);

  // Red trim bottom
  var trimBottom = trimTop.clone();
  trimBottom.position.set(0,-18,0);
  this.mesh.add(trimBottom);

  // Red trim sides
  var trimSideGeom = new THREE.BoxGeometry(102,32,4);
  var trimSideR = new THREE.Mesh(trimSideGeom, trimMat);
  trimSideR.position.set(0,0,22);
  this.mesh.add(trimSideR);
  var trimSideL = trimSideR.clone();
  trimSideL.position.z = -22;
  this.mesh.add(trimSideL);

  // Arrowhead (front triangle - pointing forward)
  var arrowGeom = new THREE.BoxGeometry(45,38,68,1,1,1);
  var arrowMat = new THREE.MeshPhongMaterial({color:0xF5F5F0, shading:THREE.FlatShading});
  // Taper to point
  arrowGeom.vertices[4].y -= 12;
  arrowGeom.vertices[4].z = 0;
  arrowGeom.vertices[5].y -= 12;
  arrowGeom.vertices[5].z = 0;
  arrowGeom.vertices[6].y += 12;
  arrowGeom.vertices[6].z = 0;
  arrowGeom.vertices[7].y += 12;
  arrowGeom.vertices[7].z = 0;

  var arrowHead = new THREE.Mesh(arrowGeom, arrowMat);
  arrowHead.position.set(60,0,0);
  arrowHead.castShadow = true;
  this.mesh.add(arrowHead);

  // Red trim on arrowhead top
  var arrowTrimGeom = new THREE.BoxGeometry(47,5,70,1,1,1);
  arrowTrimGeom.vertices[4].z = 0;
  arrowTrimGeom.vertices[5].z = 0;
  arrowTrimGeom.vertices[6].z = 0;
  arrowTrimGeom.vertices[7].z = 0;
  var arrowTrimTop = new THREE.Mesh(arrowTrimGeom, trimMat);
  arrowTrimTop.position.set(60,18,0);
  this.mesh.add(arrowTrimTop);

  var arrowTrimBottom = arrowTrimTop.clone();
  arrowTrimBottom.position.set(60,-18,0);
  this.mesh.add(arrowTrimBottom);

  // Tail fins (back of arrow - red)
  var tailTopGeom = new THREE.BoxGeometry(22,28,10,1,1,1);
  var tailTop = new THREE.Mesh(tailTopGeom, trimMat);
  tailTop.position.set(-55,20,0);
  tailTop.castShadow = true;
  this.mesh.add(tailTop);

  var tailBottomGeom = new THREE.BoxGeometry(22,18,10,1,1,1);
  var tailBottom = new THREE.Mesh(tailBottomGeom, trimMat);
  tailBottom.position.set(-55,-18,0);
  tailBottom.castShadow = true;
  this.mesh.add(tailBottom);

  // Propeller at the BACK (dark, 4-blade)
  var geomPropeller = new THREE.BoxGeometry(16,10,10,1,1,1);
  var matPropeller = new THREE.MeshPhongMaterial({color:0x23190f, shading:THREE.FlatShading});
  this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
  this.propeller.castShadow = true;

  var geomBlade = new THREE.BoxGeometry(2,80,12,1,1,1);
  var matBlade = new THREE.MeshPhongMaterial({color:0x23190f, shading:THREE.FlatShading});
  var blade1 = new THREE.Mesh(geomBlade, matBlade);
  blade1.position.set(-6,0,0);
  blade1.castShadow = true;

  var blade2 = blade1.clone();
  blade2.rotation.x = Math.PI/2;
  blade2.castShadow = true;

  this.propeller.add(blade1);
  this.propeller.add(blade2);
  this.propeller.position.set(-68,0,0);
  this.mesh.add(this.propeller);

  // Clock decorations on sides (larger, more visible)
  var clockGeom = new THREE.BoxGeometry(2,16,16);
  var clockMat = new THREE.MeshPhongMaterial({color:0xDDDDCC, shading:THREE.FlatShading});
  var clock1 = new THREE.Mesh(clockGeom, clockMat);
  clock1.position.set(25,0,23);
  this.mesh.add(clock1);
  var clock1b = clock1.clone();
  clock1b.position.z = -23;
  this.mesh.add(clock1b);

  // Clock frame (red ring)
  var clockFrameGeom = new THREE.BoxGeometry(2,18,18);
  var clockFrame1 = new THREE.Mesh(clockFrameGeom, trimMat);
  clockFrame1.position.set(25,0,23);
  this.mesh.add(clockFrame1);
  var clockFrame1b = clockFrame1.clone();
  clockFrame1b.position.z = -23;
  this.mesh.add(clockFrame1b);

  var clock2 = clock1.clone();
  clock2.position.set(-25,0,23);
  this.mesh.add(clock2);
  var clock2b = clock2.clone();
  clock2b.position.z = -23;
  this.mesh.add(clock2b);

  // Pilot (Einstein sits on top, bigger and higher)
  this.pilot = new EinsteinPilot();
  this.pilot.mesh.position.set(-5,32,0);
  this.mesh.add(this.pilot.mesh);

  this.mesh.castShadow = true;
  this.mesh.receiveShadow = true;
};


// -------- DARWIN PILOT --------
var DarwinPilot = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "darwinPilot";
  this.angleHairs = 0;

  // Body (olive/brown jacket - larger)
  var bodyGeom = new THREE.BoxGeometry(22,22,20);
  var bodyMat = new THREE.MeshPhongMaterial({color:0x4A5A2B, shading:THREE.FlatShading});
  var body = new THREE.Mesh(bodyGeom, bodyMat);
  body.position.set(0,-16,0);
  this.mesh.add(body);

  // Arms (olive jacket)
  var armGeom = new THREE.BoxGeometry(14,6,6);
  var armR = new THREE.Mesh(armGeom, bodyMat);
  armR.position.set(6,-10,14);
  armR.rotation.z = -0.4;
  this.mesh.add(armR);
  var armL = new THREE.Mesh(armGeom, bodyMat);
  armL.position.set(0,-10,-14);
  armL.rotation.z = 0.3;
  this.mesh.add(armL);

  // Face (bald head - bigger)
  var faceGeom = new THREE.BoxGeometry(14,14,14);
  var faceMat = new THREE.MeshLambertMaterial({color:Colors.pink});
  var face = new THREE.Mesh(faceGeom, faceMat);
  this.mesh.add(face);

  // Bald top (skin colored, smooth)
  var baldGeom = new THREE.BoxGeometry(15,5,15);
  var baldTop = new THREE.Mesh(baldGeom, faceMat);
  baldTop.position.set(0,8,0);
  this.mesh.add(baldTop);

  // White/gray bushy beard (big, characteristic)
  this.hairsTop = new THREE.Object3D();
  var beardMat = new THREE.MeshLambertMaterial({color:0xDDDDDD});

  for (var i=0; i<20; i++){
    var bGeom = new THREE.BoxGeometry(4,5,4);
    var b = new THREE.Mesh(bGeom, beardMat);
    var col = i%4;
    var row = Math.floor(i/4);
    b.position.set(5 + row*2, -6 - col*4, -6 + (i%5)*3);
    this.hairsTop.add(b);
  }
  this.mesh.add(this.hairsTop);

  // Side whiskers
  var whiskerGeom = new THREE.BoxGeometry(6,10,6);
  var whiskerR = new THREE.Mesh(whiskerGeom, beardMat);
  whiskerR.position.set(4,-4,9);
  this.mesh.add(whiskerR);
  var whiskerL = whiskerR.clone();
  whiskerL.position.z = -9;
  this.mesh.add(whiskerL);

  // Eyebrow ridge
  var browGeom = new THREE.BoxGeometry(3,3,16);
  var browMat = new THREE.MeshLambertMaterial({color:0xCCCCCC});
  var brow = new THREE.Mesh(browGeom, browMat);
  brow.position.set(6,5,0);
  this.mesh.add(brow);

  // Eyes
  var eyeGeom = new THREE.BoxGeometry(2,3,3);
  var eyeMat = new THREE.MeshLambertMaterial({color:0x333333});
  var eyeR = new THREE.Mesh(eyeGeom, eyeMat);
  eyeR.position.set(7,2,4);
  var eyeL = eyeR.clone();
  eyeL.position.z = -4;
  this.mesh.add(eyeR);
  this.mesh.add(eyeL);

  // Ears
  var earGeom = new THREE.BoxGeometry(3,4,3);
  var earL = new THREE.Mesh(earGeom, faceMat);
  earL.position.set(0,0,-8);
  var earR = earL.clone();
  earR.position.set(0,0,8);
  this.mesh.add(earL);
  this.mesh.add(earR);
}

DarwinPilot.prototype.updateHairs = function(){
  var hairs = this.hairsTop.children;
  var l = hairs.length;
  for (var i=0; i<l; i++){
    var h = hairs[i];
    h.scale.y = .85 + Math.cos(this.angleHairs+i/3)*.15;
  }
  this.angleHairs += (typeof game !== 'undefined' && game.speed) ? game.speed*deltaTime*40 : 0.16;
}


// -------- FINCH (Darwin's vehicle) --------
var Finch = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "finch";

  // Bird body (large, round - brown/gray)
  var bodyGeom = new THREE.CylinderGeometry(35,30,90,10,1);
  bodyGeom.applyMatrix(new THREE.Matrix4().makeRotationZ(-Math.PI/2));
  var bodyMat = new THREE.MeshPhongMaterial({color:0x7B6348, shading:THREE.FlatShading});
  var body = new THREE.Mesh(bodyGeom, bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  this.mesh.add(body);

  // Gray upper back
  var backGeom = new THREE.BoxGeometry(60,20,50);
  var backMat = new THREE.MeshPhongMaterial({color:0x8B8070, shading:THREE.FlatShading});
  var back = new THREE.Mesh(backGeom, backMat);
  back.position.set(-5,18,0);
  this.mesh.add(back);

  // Belly (lighter tan/cream)
  var bellyGeom = new THREE.BoxGeometry(55,18,48);
  var bellyMat = new THREE.MeshPhongMaterial({color:0xC4A882, shading:THREE.FlatShading});
  var belly = new THREE.Mesh(bellyGeom, bellyMat);
  belly.position.set(5,-20,0);
  this.mesh.add(belly);

  // Breast feathers (layered brown)
  var breastGeom = new THREE.BoxGeometry(30,12,40);
  var breastMat = new THREE.MeshPhongMaterial({color:0x9B7B5A, shading:THREE.FlatShading});
  var breast = new THREE.Mesh(breastGeom, breastMat);
  breast.position.set(25,-8,0);
  this.mesh.add(breast);

  // Bird head (dark/black - large)
  var headGeom = new THREE.BoxGeometry(35,35,38);
  var headMat = new THREE.MeshPhongMaterial({color:0x1A1A1A, shading:THREE.FlatShading});
  var head = new THREE.Mesh(headGeom, headMat);
  head.position.set(50,22,0);
  head.castShadow = true;
  this.mesh.add(head);

  // Cheek patch (brown)
  var cheekGeom = new THREE.BoxGeometry(5,14,10);
  var cheekMat = new THREE.MeshPhongMaterial({color:0x6B4226, shading:THREE.FlatShading});
  var cheekR = new THREE.Mesh(cheekGeom, cheekMat);
  cheekR.position.set(55,16,18);
  this.mesh.add(cheekR);
  var cheekL = cheekR.clone();
  cheekL.position.z = -18;
  this.mesh.add(cheekL);

  // Beak (dark, thick finch beak)
  var beakGeom = new THREE.BoxGeometry(30,16,18,1,1,1);
  var beakMat = new THREE.MeshPhongMaterial({color:0x1A1A1A, shading:THREE.FlatShading});
  beakGeom.vertices[4].y -= 5;
  beakGeom.vertices[4].z += 2;
  beakGeom.vertices[5].y -= 5;
  beakGeom.vertices[5].z -= 2;
  beakGeom.vertices[6].y += 5;
  beakGeom.vertices[6].z = 0;
  beakGeom.vertices[7].y += 5;
  beakGeom.vertices[7].z = 0;
  var beak = new THREE.Mesh(beakGeom, beakMat);
  beak.position.set(72,15,0);
  beak.castShadow = true;
  this.mesh.add(beak);

  // Eye (brown/gold - large)
  var eyeGeom = new THREE.BoxGeometry(4,10,10);
  var eyeMat = new THREE.MeshLambertMaterial({color:0x8B6914});
  var eyeR = new THREE.Mesh(eyeGeom, eyeMat);
  eyeR.position.set(60,28,16);
  this.mesh.add(eyeR);
  var eyeL = eyeR.clone();
  eyeL.position.z = -16;
  this.mesh.add(eyeL);

  // Eye pupil
  var pupilGeom = new THREE.BoxGeometry(5,5,5);
  var pupilMat = new THREE.MeshLambertMaterial({color:0x111111});
  var pupilR = new THREE.Mesh(pupilGeom, pupilMat);
  pupilR.position.set(61,28,18);
  this.mesh.add(pupilR);
  var pupilL = pupilR.clone();
  pupilL.position.z = -18;
  this.mesh.add(pupilL);

  // Wings (brown with black tips - will animate)
  var wingGeom = new THREE.BoxGeometry(50,6,40,1,1,1);
  var wingMat = new THREE.MeshPhongMaterial({color:0x6B4226, shading:THREE.FlatShading});

  this.wingR = new THREE.Mesh(wingGeom, wingMat);
  this.wingR.position.set(-10,12,35);
  this.wingR.castShadow = true;
  this.mesh.add(this.wingR);

  var tipGeom = new THREE.BoxGeometry(25,5,18);
  var tipMat = new THREE.MeshPhongMaterial({color:0x111111, shading:THREE.FlatShading});
  var tipR = new THREE.Mesh(tipGeom, tipMat);
  tipR.position.set(-15,0,12);
  this.wingR.add(tipR);

  this.wingL = new THREE.Mesh(wingGeom, wingMat);
  this.wingL.position.set(-10,12,-35);
  this.wingL.castShadow = true;
  this.mesh.add(this.wingL);

  var tipL = new THREE.Mesh(tipGeom, tipMat);
  tipL.position.set(-15,0,-12);
  this.wingL.add(tipL);

  // Tail feathers (multiple black feathers fanning out)
  var tailMat = new THREE.MeshPhongMaterial({color:0x111111, shading:THREE.FlatShading});
  for (var t=0; t<5; t++){
    var tailGeom = new THREE.BoxGeometry(35,3,12);
    var tail = new THREE.Mesh(tailGeom, tailMat);
    tail.position.set(-55 - t*3, 5 + t*4, -10 + t*5);
    tail.rotation.z = 0.2 + t*0.06;
    tail.rotation.y = -0.15 + t*0.08;
    tail.castShadow = true;
    this.mesh.add(tail);
  }

  // Feet/legs (brown)
  var legGeom = new THREE.BoxGeometry(5,22,5);
  var legMat = new THREE.MeshPhongMaterial({color:0x8B6914, shading:THREE.FlatShading});
  var legR = new THREE.Mesh(legGeom, legMat);
  legR.position.set(10,-32,14);
  this.mesh.add(legR);
  var legL = legR.clone();
  legL.position.z = -14;
  this.mesh.add(legL);

  // Toes
  var toeGeom = new THREE.BoxGeometry(14,3,6);
  var toeR = new THREE.Mesh(toeGeom, legMat);
  toeR.position.set(14,-42,14);
  this.mesh.add(toeR);
  var toeL = toeR.clone();
  toeL.position.z = -14;
  this.mesh.add(toeL);

  // Fake propeller (wings act as propeller)
  this.propeller = new THREE.Object3D();
  this.propeller.position.set(0,10,0);
  this.mesh.add(this.propeller);
  this.wingAngle = 0;

  // Pilot (Darwin on back)
  this.pilot = new DarwinPilot();
  this.pilot.mesh.position.set(-15,40,0);
  this.mesh.add(this.pilot.mesh);

  this.mesh.castShadow = true;
  this.mesh.receiveShadow = true;
};

// Override propeller rotation to flap wings instead (speed-linked)
Finch.prototype.updateWings = function(){
  // Wing flap speed linked to game speed (gentle, natural)
  var speedFactor = (typeof game !== 'undefined' && game.speed) ? game.speed * deltaTime * 30 : 0.04;
  speedFactor = Math.max(0.02, Math.min(speedFactor, 0.12)); // clamp to gentle range
  this.wingAngle += speedFactor;
  var flapAmount = Math.sin(this.wingAngle * 2.5) * 0.35;
  this.wingR.rotation.x = flapAmount;
  this.wingL.rotation.x = -flapAmount;
};


// -------- NEWTON PILOT --------
var NewtonPilot = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "newtonPilot";
  this.angleHairs = 0;

  // Body (dark blue coat - large and visible)
  var bodyGeom = new THREE.BoxGeometry(24,24,22);
  var bodyMat = new THREE.MeshPhongMaterial({color:0x1B3A6B, shading:THREE.FlatShading});
  var body = new THREE.Mesh(bodyGeom, bodyMat);
  body.position.set(0,-18,0);
  this.mesh.add(body);

  // Coat bottom extension
  var coatBottomGeom = new THREE.BoxGeometry(26,8,24);
  var coatBottom = new THREE.Mesh(coatBottomGeom, bodyMat);
  coatBottom.position.set(0,-32,0);
  this.mesh.add(coatBottom);

  // White collar - prominent
  var collarGeom = new THREE.BoxGeometry(16,5,24);
  var collarMat = new THREE.MeshLambertMaterial({color:0xFFFFFF});
  var collar = new THREE.Mesh(collarGeom, collarMat);
  collar.position.set(5,-7,0);
  this.mesh.add(collar);

  // White cravat/tie hanging down
  var cravatGeom = new THREE.BoxGeometry(6,12,4);
  var cravat = new THREE.Mesh(cravatGeom, collarMat);
  cravat.position.set(6,-14,0);
  this.mesh.add(cravat);

  // Face (larger)
  var faceGeom = new THREE.BoxGeometry(14,14,14);
  var faceMat = new THREE.MeshLambertMaterial({color:Colors.pink});
  var face = new THREE.Mesh(faceGeom, faceMat);
  this.mesh.add(face);

  // 18th century wig - large gray rolls
  var wigMat = new THREE.MeshLambertMaterial({color:0xBBBBBB});
  var wigMatDark = new THREE.MeshLambertMaterial({color:0x999999});
  this.hairsTop = new THREE.Object3D();

  // Top curls (fuller, more volume)
  for (var i=0; i<16; i++){
    var curlGeom = new THREE.BoxGeometry(5,5,5);
    var curl = new THREE.Mesh(curlGeom, wigMat);
    var col = i%4;
    var row = Math.floor(i/4);
    curl.position.set(-4 + row*4, 8 + Math.random()*2, -6 + col*4);
    this.hairsTop.add(curl);
  }
  this.mesh.add(this.hairsTop);

  // Side rolls (large cylinders - characteristic of 18th century wig)
  // Right side roll (3 stacked boxes to simulate roll)
  var rollGeom = new THREE.BoxGeometry(6,8,8);
  for (var r=0; r<3; r++){
    var rollR = new THREE.Mesh(rollGeom, wigMat);
    rollR.position.set(-1 + r*1, -4 - r*7, 12);
    this.mesh.add(rollR);
    var rollL = rollR.clone();
    rollL.position.z = -12;
    this.mesh.add(rollL);
  }

  // Back of wig (thick)
  var wigBackGeom = new THREE.BoxGeometry(6,22,18);
  var wigBack = new THREE.Mesh(wigBackGeom, wigMat);
  wigBack.position.set(-7,-4,0);
  this.mesh.add(wigBack);

  // Wig tail (ponytail with ribbon)
  var tailGeom = new THREE.BoxGeometry(4,14,5);
  var wigTail = new THREE.Mesh(tailGeom, wigMat);
  wigTail.position.set(-8,-18,0);
  this.mesh.add(wigTail);

  // Ribbon on tail
  var ribbonGeom = new THREE.BoxGeometry(5,3,6);
  var ribbonMat = new THREE.MeshLambertMaterial({color:0x1B3A6B});
  var ribbon = new THREE.Mesh(ribbonGeom, ribbonMat);
  ribbon.position.set(-8,-12,0);
  this.mesh.add(ribbon);

  // Eyes
  var eyeGeom = new THREE.BoxGeometry(2,4,4);
  var eyeMat = new THREE.MeshLambertMaterial({color:0x222222});
  var eyeR = new THREE.Mesh(eyeGeom, eyeMat);
  eyeR.position.set(7,2,4);
  var eyeL = eyeR.clone();
  eyeL.position.z = -4;
  this.mesh.add(eyeR);
  this.mesh.add(eyeL);

  // Ears
  var earGeom = new THREE.BoxGeometry(3,4,3);
  var earL = new THREE.Mesh(earGeom, faceMat);
  earL.position.set(0,0,-8);
  var earR = earL.clone();
  earR.position.set(0,0,8);
  this.mesh.add(earL);
  this.mesh.add(earR);

  // Right arm holding small apple
  var armGeom = new THREE.BoxGeometry(16,5,5);
  var armMat = new THREE.MeshPhongMaterial({color:0x1B3A6B, shading:THREE.FlatShading});
  var armR = new THREE.Mesh(armGeom, armMat);
  armR.position.set(12,-12,12);
  armR.rotation.z = -0.5;
  this.mesh.add(armR);

  // Hand
  var handGeom = new THREE.BoxGeometry(4,4,4);
  var handMat = new THREE.MeshLambertMaterial({color:Colors.pink});
  var hand = new THREE.Mesh(handGeom, handMat);
  hand.position.set(20,-15,12);
  this.mesh.add(hand);

  // Small apple in hand
  var smallAppleGeom = new THREE.BoxGeometry(6,6,6);
  var smallAppleMat = new THREE.MeshPhongMaterial({color:0xDD2222, shading:THREE.FlatShading});
  var smallApple = new THREE.Mesh(smallAppleGeom, smallAppleMat);
  smallApple.position.set(20,-10,12);
  this.mesh.add(smallApple);

  // Small stem on hand apple
  var sStemGeom = new THREE.BoxGeometry(1,3,1);
  var sStemMat = new THREE.MeshPhongMaterial({color:0x5C3317, shading:THREE.FlatShading});
  var sStem = new THREE.Mesh(sStemGeom, sStemMat);
  sStem.position.set(20,-6,12);
  this.mesh.add(sStem);

  // Left arm resting
  var armL = new THREE.Mesh(armGeom, armMat);
  armL.position.set(4,-12,-12);
  armL.rotation.z = 0.3;
  this.mesh.add(armL);
}

NewtonPilot.prototype.updateHairs = function(){
  var hairs = this.hairsTop.children;
  var l = hairs.length;
  for (var i=0; i<l; i++){
    var h = hairs[i];
    h.scale.y = .85 + Math.cos(this.angleHairs+i/3)*.15;
  }
  this.angleHairs += (typeof game !== 'undefined' && game.speed) ? game.speed*deltaTime*40 : 0.16;
}


// -------- APPLE CRAFT (Newton's vehicle) --------
var AppleCraft = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "appleCraft";

  // Apple body (larger, rounder - using cylinder with more segments)
  var appleGeom = new THREE.CylinderGeometry(38,35,90,10,1);
  appleGeom.applyMatrix(new THREE.Matrix4().makeRotationZ(-Math.PI/2));
  var appleMat = new THREE.MeshPhongMaterial({color:0xCC2222, shading:THREE.FlatShading});
  var apple = new THREE.Mesh(appleGeom, appleMat);
  apple.castShadow = true;
  apple.receiveShadow = true;
  this.mesh.add(apple);

  // Darker red stripe/band around middle
  var bandGeom = new THREE.CylinderGeometry(39,36,20,10,1);
  bandGeom.applyMatrix(new THREE.Matrix4().makeRotationZ(-Math.PI/2));
  var bandMat = new THREE.MeshPhongMaterial({color:0xAA1111, shading:THREE.FlatShading});
  var band = new THREE.Mesh(bandGeom, bandMat);
  band.position.set(0,0,0);
  this.mesh.add(band);

  // Apple top indent
  var indentGeom = new THREE.BoxGeometry(15,5,15);
  var indentMat = new THREE.MeshPhongMaterial({color:0x992222, shading:THREE.FlatShading});
  var indent = new THREE.Mesh(indentGeom, indentMat);
  indent.position.set(5,36,0);
  this.mesh.add(indent);

  // Stem (thick brown tree trunk growing from top)
  var stemGeom = new THREE.BoxGeometry(10,40,10);
  var stemMat = new THREE.MeshPhongMaterial({color:0x5C3317, shading:THREE.FlatShading});
  var stem = new THREE.Mesh(stemGeom, stemMat);
  stem.position.set(5,52,0);
  stem.castShadow = true;
  this.mesh.add(stem);

  // Branch from stem
  var branchGeom = new THREE.BoxGeometry(20,6,6);
  var branch = new THREE.Mesh(branchGeom, stemMat);
  branch.position.set(15,60,0);
  branch.rotation.z = -0.3;
  this.mesh.add(branch);

  // Large leaves (multiple, bigger)
  var leafMat = new THREE.MeshPhongMaterial({color:0x2E8B2E, shading:THREE.FlatShading});

  // Leaf 1 - big, going right
  var leaf1Geom = new THREE.BoxGeometry(28,4,16,1,1,1);
  leaf1Geom.vertices[4].z = 0;
  leaf1Geom.vertices[5].z = 0;
  leaf1Geom.vertices[6].z = 0;
  leaf1Geom.vertices[7].z = 0;
  var leaf1 = new THREE.Mesh(leaf1Geom, leafMat);
  leaf1.position.set(22,62,8);
  leaf1.rotation.z = -0.4;
  leaf1.rotation.y = 0.2;
  this.mesh.add(leaf1);

  // Leaf 2 - big, going left-back
  var leaf2Geom = new THREE.BoxGeometry(24,4,14,1,1,1);
  leaf2Geom.vertices[4].z = 0;
  leaf2Geom.vertices[5].z = 0;
  leaf2Geom.vertices[6].z = 0;
  leaf2Geom.vertices[7].z = 0;
  var leaf2 = new THREE.Mesh(leaf2Geom, leafMat);
  leaf2.position.set(-8,65,-6);
  leaf2.rotation.z = 0.5;
  leaf2.rotation.y = Math.PI*0.7;
  this.mesh.add(leaf2);

  // Leaf 3 - small accent leaf
  var leaf3Geom = new THREE.BoxGeometry(18,3,10,1,1,1);
  leaf3Geom.vertices[4].z = 0;
  leaf3Geom.vertices[5].z = 0;
  leaf3Geom.vertices[6].z = 0;
  leaf3Geom.vertices[7].z = 0;
  var leaf3 = new THREE.Mesh(leaf3Geom, leafMat);
  leaf3.position.set(10,68,0);
  leaf3.rotation.z = -0.2;
  this.mesh.add(leaf3);

  // Front propeller (large, wooden, 6-blade style from reference)
  var geomPropHub = new THREE.BoxGeometry(18,14,14,1,1,1);
  var matPropeller = new THREE.MeshPhongMaterial({color:0x5C3317, shading:THREE.FlatShading});
  this.propeller = new THREE.Mesh(geomPropHub, matPropeller);
  this.propeller.castShadow = true;

  // 6 blades (3 pairs at 60 degree intervals)
  var geomBlade = new THREE.BoxGeometry(2,80,14,1,1,1);
  var matBlade = new THREE.MeshPhongMaterial({color:0x4A2808, shading:THREE.FlatShading});

  var blade1 = new THREE.Mesh(geomBlade, matBlade);
  blade1.position.set(6,0,0);
  blade1.castShadow = true;

  var blade2 = blade1.clone();
  blade2.rotation.x = Math.PI/3;
  blade2.castShadow = true;

  var blade3 = blade1.clone();
  blade3.rotation.x = -Math.PI/3;
  blade3.castShadow = true;

  this.propeller.add(blade1);
  this.propeller.add(blade2);
  this.propeller.add(blade3);
  this.propeller.position.set(55,0,0);
  this.mesh.add(this.propeller);

  // Landing supports (wooden, larger)
  var supportGeom = new THREE.BoxGeometry(12,18,8);
  var supportMat = new THREE.MeshPhongMaterial({color:0x5C3317, shading:THREE.FlatShading});
  var supportR = new THREE.Mesh(supportGeom, supportMat);
  supportR.position.set(5,-35,18);
  supportR.rotation.z = 0.1;
  this.mesh.add(supportR);
  var supportL = supportR.clone();
  supportL.position.z = -18;
  supportL.rotation.z = -0.1;
  this.mesh.add(supportL);

  // Pilot (positioned higher and more visible)
  this.pilot = new NewtonPilot();
  this.pilot.mesh.position.set(-10,42,0);
  this.mesh.add(this.pilot.mesh);

  this.mesh.castShadow = true;
  this.mesh.receiveShadow = true;
};
