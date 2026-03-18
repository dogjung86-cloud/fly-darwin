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

// -------- STAGE 1: AMOEBA --------
var Amoeba = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "amoeba";

  // Medium/Cobalt Ocean Blue - slightly lighter than navy
  var bodyMat = new THREE.MeshPhongMaterial({color:0x3352A5, shading:THREE.FlatShading});
  var bodyMatLight = new THREE.MeshPhongMaterial({color:0x466BC2, shading:THREE.FlatShading});
  var bodyMatDark = new THREE.MeshPhongMaterial({color:0x223880, shading:THREE.FlatShading});

  // Voxel body construction
  var coreGeom = new THREE.BoxGeometry(40,30,30);
  var core = new THREE.Mesh(coreGeom, bodyMat);
  core.castShadow = true;
  core.receiveShadow = true;
  this.mesh.add(core);

  var topBlock = new THREE.Mesh(new THREE.BoxGeometry(30,34,20), bodyMatLight);
  this.mesh.add(topBlock);

  var bottomBlock = new THREE.Mesh(new THREE.BoxGeometry(30,34,20), bodyMatDark);
  bottomBlock.position.y = -2;
  this.mesh.add(bottomBlock);

  var frontBlock = new THREE.Mesh(new THREE.BoxGeometry(44,20,20), bodyMat);
  frontBlock.position.x = 2;
  this.mesh.add(frontBlock);

  var sideBlock1 = new THREE.Mesh(new THREE.BoxGeometry(30,20,34), bodyMat);
  this.mesh.add(sideBlock1);

  // Small black eyes
  var eyeMat = new THREE.MeshLambertMaterial({color:0x111111});
  var eyeGeom = new THREE.BoxGeometry(3,3,3);
  
  var eyeR = new THREE.Mesh(eyeGeom, eyeMat);
  eyeR.position.set(15, -2, 16);
  this.mesh.add(eyeR);

  // Tentacles (pink and orange)
  var tentacleMatPink = new THREE.MeshPhongMaterial({color:0xFF9999, shading:THREE.FlatShading});
  var tentacleMatOrange = new THREE.MeshPhongMaterial({color:0xFFB266, shading:THREE.FlatShading});
  
  this.tentacles = new THREE.Object3D();
  
  // Create a few voxel tentacles
  function createTentacle(mat, x, y, z, rotZ, rotY) {
    var t = new THREE.Object3D();
    var base = new THREE.Mesh(new THREE.BoxGeometry(10,2,2), mat);
    base.position.set(-5, 0, 0);
    var mid = new THREE.Mesh(new THREE.BoxGeometry(8,2,2), mat);
    mid.position.set(-10, 2, 0);
    mid.rotation.z = -0.4;
    var tip = new THREE.Mesh(new THREE.BoxGeometry(6,2,2), mat);
    tip.position.set(-14, 4, 0);
    tip.rotation.z = -0.8;
    
    t.add(base);
    t.add(mid);
    t.add(tip);
    
    t.position.set(x,y,z);
    t.rotation.z = rotZ;
    t.rotation.y = rotY;
    // store initial rotation for animation
    t.userData = { initRotZ: rotZ, initRotY: rotY };
    return t;
  }

  // Back tentacles
  this.tentacles.add(createTentacle(tentacleMatPink, -20, 5, 5, 0, 0));
  this.tentacles.add(createTentacle(tentacleMatOrange, -20, -5, -5, 0.2, 0));
  this.tentacles.add(createTentacle(tentacleMatPink, -18, 10, -8, -0.2, 0.2));
  this.tentacles.add(createTentacle(tentacleMatOrange, -18, -10, 8, 0.4, -0.2));

  // Top/Side tentacles
  this.tentacles.add(createTentacle(tentacleMatPink, -5, 15, 12, -1.0, 0.5));
  this.tentacles.add(createTentacle(tentacleMatOrange, 5, -15, 15, 1.0, -0.5));
  this.tentacles.add(createTentacle(tentacleMatPink, 0, 12, -15, -1.2, -0.3));

  this.mesh.add(this.tentacles);

  // Dummy propeller for code compatibility
  this.propeller = new THREE.Object3D();
  this.mesh.add(this.propeller);
  
  // Dummy pilot for code compatibility
  this.pilot = {
    mesh: new THREE.Object3D(),
    updateHairs: function(){}
  };
  this.mesh.add(this.pilot.mesh);
  
  this.wiggleAngle = 0;
};

// Amoeba swimming animation (wiggling)
Amoeba.prototype.updateWings = function(){
  // Speed factor slowed down for a smoother swimming feel
  var speedFactor = (typeof game !== 'undefined' && game.speed) ? game.speed * deltaTime * 12 : 0.02;
  this.wiggleAngle += speedFactor;
  
  var wiggleAmount = Math.sin(this.wiggleAngle) * 0.04;
  var wiggleAmountY = Math.cos(this.wiggleAngle * 0.6) * 0.04;
  
  // Animate tentacles much slower and smoother
  for (var i=0; i<this.tentacles.children.length; i++) {
     var t = this.tentacles.children[i];
     t.rotation.y = t.userData.initRotY + Math.sin(this.wiggleAngle + i*1.2) * 0.15;
     t.rotation.z = t.userData.initRotZ + Math.cos(this.wiggleAngle * 0.8 + i*0.8) * 0.08;
  }
  
  // Slight body rotation for swimming feel
  this.mesh.rotation.z = wiggleAmount;
  this.mesh.rotation.y = wiggleAmountY;
};

// -------- STAGE 2: DUNKLEOSTEUS (Armored Fish) --------
var Dunkleosteus = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "dunkleosteus";

  // Colors based on the reference image
  var armorMat = new THREE.MeshPhongMaterial({color:0x5C7A99, shading:THREE.FlatShading});
  var bodyMat = new THREE.MeshPhongMaterial({color:0x8FAFD1, shading:THREE.FlatShading});
  var finMat = new THREE.MeshPhongMaterial({color:0xC4B8E0, shading:THREE.FlatShading});
  var finDetailMat = new THREE.MeshPhongMaterial({color:0xE0CD8A, shading:THREE.FlatShading});
  var teethMat = new THREE.MeshPhongMaterial({color:0xE6E0C5, shading:THREE.FlatShading});
  var eyeMat = new THREE.MeshLambertMaterial({color:0x111111});

  // === HEAD (front, +X direction) ===
  var topArmor = new THREE.Mesh(new THREE.BoxGeometry(25, 20, 26), armorMat);
  topArmor.position.set(15, 6, 0);
  this.mesh.add(topArmor);

  var snoutArmor = new THREE.Mesh(new THREE.BoxGeometry(15, 12, 24), armorMat);
  snoutArmor.position.set(32, 2, 0);
  this.mesh.add(snoutArmor);

  var cheekArmorR = new THREE.Mesh(new THREE.BoxGeometry(20, 16, 6), armorMat);
  cheekArmorR.position.set(18, -2, 11);
  this.mesh.add(cheekArmorR);
  var cheekArmorL = cheekArmorR.clone();
  cheekArmorL.position.z = -11;
  this.mesh.add(cheekArmorL);

  // Eyes
  var eyeR = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 2), eyeMat);
  eyeR.position.set(25, 5, 14);
  this.mesh.add(eyeR);
  var eyeL = eyeR.clone();
  eyeL.position.z = -14;
  this.mesh.add(eyeL);

  // Upper Teeth
  var toothU1 = new THREE.Mesh(new THREE.BoxGeometry(4, 10, 4), teethMat);
  toothU1.position.set(38, -6, 8);
  this.mesh.add(toothU1);
  var toothU2 = toothU1.clone();
  toothU2.position.z = -8;
  this.mesh.add(toothU2);

  // === LOWER JAW (animates) ===
  this.jaw = new THREE.Object3D();
  var jawBone = new THREE.Mesh(new THREE.BoxGeometry(22, 10, 20), armorMat);
  jawBone.position.set(12, -4, 0);
  this.jaw.add(jawBone);
  var toothL1 = new THREE.Mesh(new THREE.BoxGeometry(4, 8, 4), teethMat);
  toothL1.position.set(22, 2, 6);
  this.jaw.add(toothL1);
  var toothL2 = toothL1.clone();
  toothL2.position.z = -6;
  this.jaw.add(toothL2);
  this.jaw.position.set(10, -10, 0);
  this.mesh.add(this.jaw);

  // === BODY (tapering toward -X) ===
  var midBody = new THREE.Mesh(new THREE.BoxGeometry(30, 26, 22), bodyMat);
  midBody.position.set(-12, 0, 0);
  this.mesh.add(midBody);

  var backBody = new THREE.Mesh(new THREE.BoxGeometry(25, 18, 14), bodyMat);
  backBody.position.set(-35, 0, 0);
  this.mesh.add(backBody);

  var tailBase = new THREE.Mesh(new THREE.BoxGeometry(15, 10, 6), bodyMat);
  tailBase.position.set(-52, 0, 0);
  this.mesh.add(tailBase);

  // === FIN HELPER ===
  function createFin(w, h, d) {
    var f = new THREE.Object3D();
    var base = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), finMat);
    f.add(base);
    // Yellow stripes
    for(var i=0; i<3; i++) {
      var stripe = new THREE.Mesh(new THREE.BoxGeometry(w*0.8, h*0.15, d+1), finDetailMat);
      stripe.position.y = -h/2 + h*0.25*(i+1);
      f.add(stripe);
    }
    return f;
  }

  // === DORSAL FIN (top, leaning backward) ===
  var dorsalFin = createFin(6, 25, 4);
  dorsalFin.position.set(-15, 22, 0);
  dorsalFin.rotation.z = 0.5; // Lean BACKWARD (toward -X)
  this.mesh.add(dorsalFin);

  // === PECTORAL FINS (side fins, close to body, pointing backward/left) ===
  this.finR = createFin(5, 20, 3);
  this.finR.position.set(-10, -12, 12);
  this.finR.rotation.z = 1.0; // Point strongly backward (left)
  this.finR.rotation.x = 0.4; // Spread outward
  this.mesh.add(this.finR);

  this.finL = createFin(5, 20, 3);
  this.finL.position.set(-10, -12, -12);
  this.finL.rotation.z = 1.0;
  this.finL.rotation.x = -0.4;
  this.mesh.add(this.finL);

  // === PELVIC FINS (smaller, further back, pointing backward/left) ===
  this.pelvicR = createFin(4, 14, 2);
  this.pelvicR.position.set(-38, -8, 7);
  this.pelvicR.rotation.z = 1.1; // Point strongly backward
  this.pelvicR.rotation.x = 0.3;
  this.mesh.add(this.pelvicR);
  this.pelvicL = createFin(4, 14, 2);
  this.pelvicL.position.set(-38, -8, -7);
  this.pelvicL.rotation.z = 1.1;
  this.pelvicL.rotation.x = -0.3;
  this.mesh.add(this.pelvicL);

  // === TAIL FIN (lower part BIGGER than upper) ===
  this.tail = new THREE.Object3D();
  // Upper tail (smaller)
  var tailUpper = createFin(4, 18, 3);
  tailUpper.position.set(0, 10, 0);
  tailUpper.rotation.z = 0.4; // Lean backward
  this.tail.add(tailUpper);
  // Lower tail (bigger/longer - reversed heterocercal)
  var tailLower = createFin(5, 28, 3);
  tailLower.position.set(0, -14, 0);
  tailLower.rotation.z = -0.5; // Lean backward-down
  this.tail.add(tailLower);
  this.tail.position.set(-60, 0, 0);
  this.mesh.add(this.tail);

  // Shadows
  this.mesh.traverse(function(child) {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Dummy propeller for code compatibility
  this.propeller = new THREE.Object3D();
  this.mesh.add(this.propeller);

  // Dummy pilot
  this.pilot = {
    mesh: new THREE.Object3D(),
    updateHairs: function(){}
  };
  this.mesh.add(this.pilot.mesh);

  this.swimAngle = 0;
};

Dunkleosteus.prototype.updateWings = function(){
  var speedFactor = (typeof game !== 'undefined' && game.speed) ? game.speed * deltaTime * 12 : 0.02;
  this.swimAngle += speedFactor;

  var swimMotion = Math.sin(this.swimAngle);

  // Tail sweeps gently
  this.tail.rotation.z = swimMotion * 0.15;

  // Pectoral fins flap like bird wings (X-axis rotation = up/down flap)
  var flapAmount = Math.sin(this.swimAngle * 2.0) * 0.35;
  this.finR.rotation.x = 0.4 + flapAmount;   // Right fin flaps outward
  this.finL.rotation.x = -0.4 - flapAmount;  // Left fin mirrors

  // Pelvic fins also flap gently, slightly delayed
  var pelvicFlap = Math.sin(this.swimAngle * 2.0 + 0.8) * 0.25;
  this.pelvicR.rotation.x = 0.3 + pelvicFlap;
  this.pelvicL.rotation.x = -0.3 - pelvicFlap;

  // Jaw slowly opens and closes
  this.jaw.rotation.z = Math.sin(this.swimAngle * 1.2) * 0.12;
};

// -------- STAGE 3: TIKTAALIK (Transitional Fish-Tetrapod) --------
var Tiktaalik = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "tiktaalik";

  // Brown color palette
  var headMat = new THREE.MeshPhongMaterial({color:0x6B5B4A, shading:THREE.FlatShading}); // Dark brown head
  var bodyMat = new THREE.MeshPhongMaterial({color:0x8B7B6A, shading:THREE.FlatShading}); // Medium brown body
  var bellyMat = new THREE.MeshPhongMaterial({color:0xA89880, shading:THREE.FlatShading}); // Light tan belly
  var finMat = new THREE.MeshPhongMaterial({color:0xB8A8D0, shading:THREE.FlatShading}); // Purple fins
  var finStripeMat = new THREE.MeshPhongMaterial({color:0xD4B856, shading:THREE.FlatShading}); // Gold stripes
  var legMat = new THREE.MeshPhongMaterial({color:0x9B8B5A, shading:THREE.FlatShading}); // Olive-brown legs
  var eyeMat = new THREE.MeshLambertMaterial({color:0x111111});

  // === FLAT HEAD (wide, crocodile-like) ===
  var headTop = new THREE.Mesh(new THREE.BoxGeometry(30, 8, 30), headMat);
  headTop.position.set(30, 4, 0);
  this.mesh.add(headTop);

  var snout = new THREE.Mesh(new THREE.BoxGeometry(18, 6, 26), headMat);
  snout.position.set(48, 2, 0);
  this.mesh.add(snout);

  // Head ridges (texture detail)
  var ridge1 = new THREE.Mesh(new THREE.BoxGeometry(20, 3, 8), new THREE.MeshPhongMaterial({color:0x5A4A3A, shading:THREE.FlatShading}));
  ridge1.position.set(32, 9, 0);
  this.mesh.add(ridge1);

  var ridge2 = new THREE.Mesh(new THREE.BoxGeometry(14, 2, 6), new THREE.MeshPhongMaterial({color:0x5A4A3A, shading:THREE.FlatShading}));
  ridge2.position.set(42, 7, 0);
  this.mesh.add(ridge2);

  // Lower jaw
  var jawBottom = new THREE.Mesh(new THREE.BoxGeometry(28, 5, 24), bellyMat);
  jawBottom.position.set(32, -4, 0);
  this.mesh.add(jawBottom);

  // Mouth line
  var mouthLine = new THREE.Mesh(new THREE.BoxGeometry(30, 1, 26), new THREE.MeshPhongMaterial({color:0x3A2A1A, shading:THREE.FlatShading}));
  mouthLine.position.set(33, 0, 0);
  this.mesh.add(mouthLine);

  // Eyes (on top of flat head, like a crocodile)
  var eyeR = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), eyeMat);
  eyeR.position.set(38, 9, 12);
  this.mesh.add(eyeR);
  var eyeL = eyeR.clone();
  eyeL.position.z = -12;
  this.mesh.add(eyeL);

  // Eye bumps (raised eye sockets)
  var eyeBumpMat = new THREE.MeshPhongMaterial({color:0x7A6A5A, shading:THREE.FlatShading});
  var eyeBumpR = new THREE.Mesh(new THREE.BoxGeometry(6, 5, 6), eyeBumpMat);
  eyeBumpR.position.set(38, 8, 12);
  this.mesh.add(eyeBumpR);
  var eyeBumpL = eyeBumpR.clone();
  eyeBumpL.position.z = -12;
  this.mesh.add(eyeBumpL);

  // === BODY (elongated, tapering) ===
  var frontBody = new THREE.Mesh(new THREE.BoxGeometry(28, 18, 26), bodyMat);
  frontBody.position.set(8, 0, 0);
  this.mesh.add(frontBody);

  var midBody = new THREE.Mesh(new THREE.BoxGeometry(25, 16, 22), bodyMat);
  midBody.position.set(-15, 0, 0);
  this.mesh.add(midBody);

  var backBody = new THREE.Mesh(new THREE.BoxGeometry(20, 12, 16), bodyMat);
  backBody.position.set(-35, 0, 0);
  this.mesh.add(backBody);

  var tailBody = new THREE.Mesh(new THREE.BoxGeometry(15, 8, 10), bodyMat);
  tailBody.position.set(-52, 0, 0);
  this.mesh.add(tailBody);

  // Belly (lighter underside)
  var belly = new THREE.Mesh(new THREE.BoxGeometry(50, 6, 20), bellyMat);
  belly.position.set(0, -8, 0);
  this.mesh.add(belly);

  // === FRONT LEGS (the key feature - fin-legs) ===
  function createLeg(length, width, isRight) {
    var leg = new THREE.Object3D();
    // Upper segment (attached to body)
    var upper = new THREE.Mesh(new THREE.BoxGeometry(width, length*0.6, width), legMat);
    upper.position.set(0, -length*0.3, 0);
    leg.add(upper);
    // Lower segment (proto-foot)
    var lower = new THREE.Mesh(new THREE.BoxGeometry(width*1.3, length*0.5, width*1.2), legMat);
    lower.position.set(2, -length*0.65, 0);
    lower.rotation.z = isRight ? -0.3 : 0.3;
    leg.add(lower);
    // Small fin web on the leg
    var finWeb = new THREE.Mesh(new THREE.BoxGeometry(width*0.8, length*0.3, width*1.5), finMat);
    finWeb.position.set(3, -length*0.5, 0);
    leg.add(finWeb);
    return leg;
  }

  // Front right leg
  this.legFR = createLeg(14, 5, true);
  this.legFR.position.set(5, -8, 14);
  this.mesh.add(this.legFR);
  // Front left leg
  this.legFL = createLeg(14, 5, false);
  this.legFL.position.set(5, -8, -14);
  this.mesh.add(this.legFL);

  // Back right leg (slightly smaller)
  this.legBR = createLeg(12, 4, true);
  this.legBR.position.set(-25, -6, 12);
  this.mesh.add(this.legBR);
  // Back left leg
  this.legBL = createLeg(12, 4, false);
  this.legBL.position.set(-25, -6, -12);
  this.mesh.add(this.legBL);

  // === TAIL FIN (with stripes, like reference) ===
  this.tail = new THREE.Object3D();

  function createStripedFin(w, h, d) {
    var f = new THREE.Object3D();
    var base = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), finMat);
    f.add(base);
    for(var i=0; i<3; i++) {
      var stripe = new THREE.Mesh(new THREE.BoxGeometry(w*0.8, h*0.15, d+1), finStripeMat);
      stripe.position.y = -h/2 + h*0.25*(i+1);
      f.add(stripe);
    }
    return f;
  }

  var tailFinUpper = createStripedFin(5, 20, 3);
  tailFinUpper.position.set(0, 10, 0);
  tailFinUpper.rotation.z = 0.4;
  this.tail.add(tailFinUpper);

  var tailFinLower = createStripedFin(5, 22, 3);
  tailFinLower.position.set(0, -11, 0);
  tailFinLower.rotation.z = -0.4;
  this.tail.add(tailFinLower);

  this.tail.position.set(-60, 0, 0);
  this.mesh.add(this.tail);

  // Shadows
  this.mesh.traverse(function(child) {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Dummy propeller
  this.propeller = new THREE.Object3D();
  this.mesh.add(this.propeller);

  // Dummy pilot
  this.pilot = {
    mesh: new THREE.Object3D(),
    updateHairs: function(){}
  };
  this.mesh.add(this.pilot.mesh);

  this.walkAngle = 0;
};

Tiktaalik.prototype.updateWings = function(){
  var speedFactor = (typeof game !== 'undefined' && game.speed) ? game.speed * deltaTime * 14 : 0.03;
  this.walkAngle += speedFactor;

  // Front legs walk/paddle like a crawling creature
  var frontStride = Math.sin(this.walkAngle * 2.0) * 0.4;
  this.legFR.rotation.z = frontStride;       // Right forward
  this.legFL.rotation.z = -frontStride;      // Left opposite

  // Back legs move opposite to front (like walking)
  var backStride = Math.sin(this.walkAngle * 2.0 + Math.PI) * 0.35;
  this.legBR.rotation.z = backStride;
  this.legBL.rotation.z = -backStride;

  // Tail sweeps side to side gently
  this.tail.rotation.y = Math.sin(this.walkAngle) * 0.15;

  // Slight body undulation
  this.mesh.rotation.y = Math.sin(this.walkAngle * 0.8) * 0.03;
};

// -------- STAGE 4: QUETZALCOATLUS (Giant Pterosaur) --------
var Quetzalcoatlus = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "quetzalcoatlus";

  // Vibrant color palette (light blue body, purple accents, gold patterns)
  var bodyMat = new THREE.MeshPhongMaterial({color:0x8EBED6, shading:THREE.FlatShading}); // Light teal-blue
  var bodyDarkMat = new THREE.MeshPhongMaterial({color:0x6A9AB8, shading:THREE.FlatShading}); // Darker blue
  var wingMat = new THREE.MeshPhongMaterial({color:0x7EAEC6, shading:THREE.FlatShading}); // Wing membrane blue
  var wingEdgeMat = new THREE.MeshPhongMaterial({color:0xC4B0E0, shading:THREE.FlatShading}); // Purple wing edge
  var goldMat = new THREE.MeshPhongMaterial({color:0xD4B856, shading:THREE.FlatShading}); // Gold accents
  var crestMat = new THREE.MeshPhongMaterial({color:0xC4B0E0, shading:THREE.FlatShading}); // Purple crest
  var beakMat = new THREE.MeshPhongMaterial({color:0xB0A090, shading:THREE.FlatShading}); // Tan beak
  var feetMat = new THREE.MeshPhongMaterial({color:0xC4A0D0, shading:THREE.FlatShading}); // Purple feet
  var eyeMat = new THREE.MeshLambertMaterial({color:0x111111});

  // === HEAD with CREST ===
  // Beak (long and pointed)
  var beak = new THREE.Mesh(new THREE.BoxGeometry(25, 6, 8), beakMat);
  beak.position.set(55, 38, 0);
  this.mesh.add(beak);

  // Head
  var head = new THREE.Mesh(new THREE.BoxGeometry(14, 12, 12), bodyMat);
  head.position.set(40, 40, 0);
  this.mesh.add(head);

  // Head crest (large, iconic, pointing backward)
  var crest = new THREE.Mesh(new THREE.BoxGeometry(28, 18, 4), crestMat);
  crest.position.set(30, 50, 0);
  crest.rotation.z = 0.5;
  this.mesh.add(crest);

  // Gold pattern on crest
  var crestGold1 = new THREE.Mesh(new THREE.BoxGeometry(20, 3, 5), goldMat);
  crestGold1.position.set(32, 48, 0);
  crestGold1.rotation.z = 0.5;
  this.mesh.add(crestGold1);
  var crestGold2 = new THREE.Mesh(new THREE.BoxGeometry(14, 3, 5), goldMat);
  crestGold2.position.set(28, 53, 0);
  crestGold2.rotation.z = 0.5;
  this.mesh.add(crestGold2);

  // Eyes
  var eyeR = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 3), eyeMat);
  eyeR.position.set(44, 42, 7);
  this.mesh.add(eyeR);
  var eyeL = eyeR.clone();
  eyeL.position.z = -7;
  this.mesh.add(eyeL);

  // === LONG NECK (curved, several segments) ===
  var neck1 = new THREE.Mesh(new THREE.BoxGeometry(8, 16, 10), bodyMat);
  neck1.position.set(35, 28, 0);
  neck1.rotation.z = 0.3;
  this.mesh.add(neck1);

  var neck2 = new THREE.Mesh(new THREE.BoxGeometry(8, 14, 10), bodyMat);
  neck2.position.set(30, 16, 0);
  neck2.rotation.z = 0.1;
  this.mesh.add(neck2);

  var neck3 = new THREE.Mesh(new THREE.BoxGeometry(10, 12, 12), bodyDarkMat);
  neck3.position.set(25, 6, 0);
  this.mesh.add(neck3);

  // === BODY (compact, small relative to wings) ===
  var body = new THREE.Mesh(new THREE.BoxGeometry(30, 16, 18), bodyMat);
  body.position.set(5, 0, 0);
  body.castShadow = true;
  this.mesh.add(body);

  var bodyBack = new THREE.Mesh(new THREE.BoxGeometry(18, 12, 14), bodyDarkMat);
  bodyBack.position.set(-12, 0, 0);
  this.mesh.add(bodyBack);

  // Gold shoulder markings
  var shoulderGoldR = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 3), goldMat);
  shoulderGoldR.position.set(10, 6, 10);
  this.mesh.add(shoulderGoldR);
  var shoulderGoldL = shoulderGoldR.clone();
  shoulderGoldL.position.z = -10;
  this.mesh.add(shoulderGoldL);

  // === WINGS (huge membrane wings, will animate) ===
  function createWing(side) {
    var wing = new THREE.Object3D();

    // Inner wing
    var inner = new THREE.Mesh(new THREE.BoxGeometry(30, 3, 35), wingMat);
    inner.position.set(-5, 0, side * 20);
    wing.add(inner);

    // Outer wing (longer, thinner)
    var outer = new THREE.Mesh(new THREE.BoxGeometry(25, 2, 30), wingMat);
    outer.position.set(-10, 0, side * 48);
    wing.add(outer);

    // Wing tip
    var tip = new THREE.Mesh(new THREE.BoxGeometry(15, 2, 15), wingMat);
    tip.position.set(-12, 0, side * 68);
    wing.add(tip);

    // Purple edge trim
    var edgeInner = new THREE.Mesh(new THREE.BoxGeometry(32, 2, 4), wingEdgeMat);
    edgeInner.position.set(-5, 1, side * 36);
    wing.add(edgeInner);

    var edgeOuter = new THREE.Mesh(new THREE.BoxGeometry(27, 2, 4), wingEdgeMat);
    edgeOuter.position.set(-10, 1, side * 62);
    wing.add(edgeOuter);

    // Gold vein patterns on wings
    var vein1 = new THREE.Mesh(new THREE.BoxGeometry(20, 1, 3), goldMat);
    vein1.position.set(-3, 2, side * 25);
    vein1.rotation.y = side * 0.3;
    wing.add(vein1);

    var vein2 = new THREE.Mesh(new THREE.BoxGeometry(16, 1, 3), goldMat);
    vein2.position.set(-8, 2, side * 42);
    vein2.rotation.y = side * 0.2;
    wing.add(vein2);

    // Wing finger bone
    var bone = new THREE.Mesh(new THREE.BoxGeometry(35, 3, 3), bodyDarkMat);
    bone.position.set(-5, 2, side * 15);
    wing.add(bone);

    return wing;
  }

  this.wingR = createWing(1);
  this.mesh.add(this.wingR);
  this.wingL = createWing(-1);
  this.mesh.add(this.wingL);

  // === TAIL (short) ===
  var tail = new THREE.Mesh(new THREE.BoxGeometry(16, 6, 8), bodyDarkMat);
  tail.position.set(-24, 0, 0);
  this.mesh.add(tail);

  // === FEET (purple, tucked under) ===
  var footR = new THREE.Mesh(new THREE.BoxGeometry(5, 12, 5), feetMat);
  footR.position.set(0, -12, 8);
  this.mesh.add(footR);
  var footL = footR.clone();
  footL.position.z = -8;
  this.mesh.add(footL);

  // Small claws
  var clawR = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 6), feetMat);
  clawR.position.set(2, -18, 8);
  this.mesh.add(clawR);
  var clawL = clawR.clone();
  clawL.position.z = -8;
  this.mesh.add(clawL);

  // Shadows
  this.mesh.traverse(function(child) {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Dummy propeller
  this.propeller = new THREE.Object3D();
  this.mesh.add(this.propeller);

  // Dummy pilot
  this.pilot = {
    mesh: new THREE.Object3D(),
    updateHairs: function(){}
  };
  this.mesh.add(this.pilot.mesh);

  this.flapAngle = 0;
};

Quetzalcoatlus.prototype.updateWings = function(){
  var speedFactor = (typeof game !== 'undefined' && game.speed) ? game.speed * deltaTime * 15 : 0.03;
  this.flapAngle += speedFactor;

  // Majestic wing flapping (slow, powerful strokes)
  var flapAmount = Math.sin(this.flapAngle * 1.8) * 0.3;
  this.wingR.rotation.x = flapAmount;
  this.wingL.rotation.x = -flapAmount;

  // Slight wing fold at the tips during upstroke
  var tipFold = Math.sin(this.flapAngle * 1.8 + 0.5) * 0.1;
  this.wingR.rotation.z = tipFold;
  this.wingL.rotation.z = -tipFold;

  // Gentle body bob with wing flaps
  this.mesh.rotation.z = Math.cos(this.flapAngle * 1.8) * 0.03;
};

// -------- STAGE 5: BAT (Mammal) --------
var Bat = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "bat";

  // Color palette from reference
  var furMat = new THREE.MeshPhongMaterial({color:0x6B4226, shading:THREE.FlatShading}); // Dark brown fur
  var furLightMat = new THREE.MeshPhongMaterial({color:0x8B5E3C, shading:THREE.FlatShading}); // Lighter brown
  var earMat = new THREE.MeshPhongMaterial({color:0xC89080, shading:THREE.FlatShading}); // Pink ear inner
  var earOuterMat = new THREE.MeshPhongMaterial({color:0x9B6050, shading:THREE.FlatShading}); // Dark pink ear
  var noseMat = new THREE.MeshPhongMaterial({color:0xD4A090, shading:THREE.FlatShading}); // Pink nose
  var wingMembraneMat = new THREE.MeshPhongMaterial({color:0xD4944A, shading:THREE.FlatShading, side:THREE.DoubleSide}); // Amber/orange wing
  var wingBoneMat = new THREE.MeshPhongMaterial({color:0x5A3018, shading:THREE.FlatShading}); // Dark brown bones
  var goggleMat = new THREE.MeshPhongMaterial({color:0x8B8B40, shading:THREE.FlatShading}); // Olive goggle frame
  var goggleLensMat = new THREE.MeshPhongMaterial({color:0xAACC88, shading:THREE.FlatShading}); // Green-tint lens
  var eyeMat = new THREE.MeshLambertMaterial({color:0x111111});

  // === HEAD ===
  var head = new THREE.Mesh(new THREE.BoxGeometry(16, 16, 16), furMat);
  head.position.set(12, 10, 0);
  this.mesh.add(head);

  // Snout
  var snout = new THREE.Mesh(new THREE.BoxGeometry(8, 8, 10), furLightMat);
  snout.position.set(20, 6, 0);
  this.mesh.add(snout);

  // Pink nose
  var nose = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 6), noseMat);
  nose.position.set(24, 7, 0);
  this.mesh.add(nose);

  // Nostrils
  var nostrilR = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), eyeMat);
  nostrilR.position.set(26, 8, 2);
  this.mesh.add(nostrilR);
  var nostrilL = nostrilR.clone();
  nostrilL.position.z = -2;
  this.mesh.add(nostrilL);

  // Mouth line
  var mouth = new THREE.Mesh(new THREE.BoxGeometry(6, 1, 8), new THREE.MeshPhongMaterial({color:0x3A1A0A, shading:THREE.FlatShading}));
  mouth.position.set(20, 2, 0);
  this.mesh.add(mouth);

  // Small fangs
  var fangR = new THREE.Mesh(new THREE.BoxGeometry(1, 3, 1), new THREE.MeshPhongMaterial({color:0xEEEEEE, shading:THREE.FlatShading}));
  fangR.position.set(22, 0, 3);
  this.mesh.add(fangR);
  var fangL = fangR.clone();
  fangL.position.z = -3;
  this.mesh.add(fangL);

  // Eyes
  var eyeR = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 3), eyeMat);
  eyeR.position.set(16, 12, 8);
  this.mesh.add(eyeR);
  var eyeL = eyeR.clone();
  eyeL.position.z = -8;
  this.mesh.add(eyeL);

  // === GOGGLES ===
  // Goggle frame
  var goggleFrameR = new THREE.Mesh(new THREE.BoxGeometry(5, 6, 4), goggleMat);
  goggleFrameR.position.set(16, 14, 9);
  this.mesh.add(goggleFrameR);
  var goggleFrameL = goggleFrameR.clone();
  goggleFrameL.position.z = -9;
  this.mesh.add(goggleFrameL);

  // Goggle lenses
  var goggleLensR = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 2), goggleLensMat);
  goggleLensR.position.set(18, 14, 10);
  this.mesh.add(goggleLensR);
  var goggleLensL = goggleLensR.clone();
  goggleLensL.position.z = -10;
  this.mesh.add(goggleLensL);

  // Goggle strap
  var goggleStrap = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 20), goggleMat);
  goggleStrap.position.set(10, 16, 0);
  this.mesh.add(goggleStrap);

  // === EARS (big, pointed, bat-like) ===
  // Right ear
  var earOuterR = new THREE.Mesh(new THREE.BoxGeometry(5, 18, 8), earOuterMat);
  earOuterR.position.set(10, 26, 7);
  earOuterR.rotation.z = 0.15;
  earOuterR.rotation.x = 0.1;
  this.mesh.add(earOuterR);

  var earInnerR = new THREE.Mesh(new THREE.BoxGeometry(3, 14, 5), earMat);
  earInnerR.position.set(11, 25, 7);
  earInnerR.rotation.z = 0.15;
  earInnerR.rotation.x = 0.1;
  this.mesh.add(earInnerR);

  // Left ear
  var earOuterL = new THREE.Mesh(new THREE.BoxGeometry(5, 18, 8), earOuterMat);
  earOuterL.position.set(10, 26, -7);
  earOuterL.rotation.z = 0.15;
  earOuterL.rotation.x = -0.1;
  this.mesh.add(earOuterL);

  var earInnerL = new THREE.Mesh(new THREE.BoxGeometry(3, 14, 5), earMat);
  earInnerL.position.set(11, 25, -7);
  earInnerL.rotation.z = 0.15;
  earInnerL.rotation.x = -0.1;
  this.mesh.add(earInnerL);

  // Ear tips (pointed)
  var earTipR = new THREE.Mesh(new THREE.BoxGeometry(3, 6, 5), earOuterMat);
  earTipR.position.set(10, 36, 7);
  earTipR.rotation.z = 0.2;
  this.mesh.add(earTipR);
  var earTipL = new THREE.Mesh(new THREE.BoxGeometry(3, 6, 5), earOuterMat);
  earTipL.position.set(10, 36, -7);
  earTipL.rotation.z = 0.2;
  this.mesh.add(earTipL);

  // === BODY ===
  var body = new THREE.Mesh(new THREE.BoxGeometry(22, 20, 18), furMat);
  body.position.set(0, 0, 0);
  this.mesh.add(body);

  var belly = new THREE.Mesh(new THREE.BoxGeometry(18, 14, 14), furLightMat);
  belly.position.set(0, -2, 0);
  this.mesh.add(belly);

  var bodyBack = new THREE.Mesh(new THREE.BoxGeometry(14, 14, 14), furMat);
  bodyBack.position.set(-14, 0, 0);
  this.mesh.add(bodyBack);

  // === WINGS (large membrane with bone structure) ===
  function createBatWing(side) {
    var wing = new THREE.Object3D();

    // Upper arm bone
    var upperArm = new THREE.Mesh(new THREE.BoxGeometry(18, 3, 3), wingBoneMat);
    upperArm.position.set(-2, 4, side * 12);
    upperArm.rotation.z = side > 0 ? -0.2 : 0.2;
    wing.add(upperArm);

    // Forearm bone
    var forearm = new THREE.Mesh(new THREE.BoxGeometry(22, 2, 2), wingBoneMat);
    forearm.position.set(-8, 2, side * 28);
    wing.add(forearm);

    // Finger bones (spread out)
    var finger1 = new THREE.Mesh(new THREE.BoxGeometry(18, 2, 2), wingBoneMat);
    finger1.position.set(-2, 3, side * 42);
    finger1.rotation.y = side * 0.3;
    wing.add(finger1);

    var finger2 = new THREE.Mesh(new THREE.BoxGeometry(20, 2, 2), wingBoneMat);
    finger2.position.set(-10, 0, side * 45);
    finger2.rotation.y = side * 0.1;
    wing.add(finger2);

    var finger3 = new THREE.Mesh(new THREE.BoxGeometry(16, 2, 2), wingBoneMat);
    finger3.position.set(-18, -2, side * 40);
    finger3.rotation.y = -side * 0.2;
    wing.add(finger3);

    // Wing membrane panels (between bones)
    var membrane1 = new THREE.Mesh(new THREE.BoxGeometry(25, 2, 25), wingMembraneMat);
    membrane1.position.set(-5, 1, side * 22);
    wing.add(membrane1);

    var membrane2 = new THREE.Mesh(new THREE.BoxGeometry(22, 2, 22), wingMembraneMat);
    membrane2.position.set(-12, -1, side * 38);
    wing.add(membrane2);

    var membrane3 = new THREE.Mesh(new THREE.BoxGeometry(14, 2, 14), wingMembraneMat);
    membrane3.position.set(-18, -2, side * 50);
    wing.add(membrane3);

    return wing;
  }

  this.wingR = createBatWing(1);
  this.mesh.add(this.wingR);
  this.wingL = createBatWing(-1);
  this.mesh.add(this.wingL);

  // === LEGS (hanging down) ===
  var legR = new THREE.Mesh(new THREE.BoxGeometry(3, 14, 3), furMat);
  legR.position.set(-4, -14, 6);
  this.mesh.add(legR);
  var legL = legR.clone();
  legL.position.z = -6;
  this.mesh.add(legL);

  // Tiny feet
  var footR = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 4), wingBoneMat);
  footR.position.set(-4, -22, 6);
  this.mesh.add(footR);
  var footL = footR.clone();
  footL.position.z = -6;
  this.mesh.add(footL);

  // Shadows
  this.mesh.traverse(function(child) {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Dummy propeller
  this.propeller = new THREE.Object3D();
  this.mesh.add(this.propeller);

  // Dummy pilot
  this.pilot = {
    mesh: new THREE.Object3D(),
    updateHairs: function(){}
  };
  this.mesh.add(this.pilot.mesh);

  this.flapAngle = 0;
};

Bat.prototype.updateWings = function(){
  var speedFactor = (typeof game !== 'undefined' && game.speed) ? game.speed * deltaTime * 18 : 0.04;
  this.flapAngle += speedFactor;

  // Fast, fluttery wing flapping (faster than pterosaur)
  var flapAmount = Math.sin(this.flapAngle * 3.0) * 0.45;
  this.wingR.rotation.x = flapAmount;
  this.wingL.rotation.x = -flapAmount;

  // Wing fold/sweep during flaps
  var sweepAmount = Math.sin(this.flapAngle * 3.0 + 0.8) * 0.15;
  this.wingR.rotation.z = sweepAmount;
  this.wingL.rotation.z = -sweepAmount;

  // Body bobs more noticeably (bats are more agile)
  this.mesh.rotation.z = Math.cos(this.flapAngle * 3.0) * 0.06;
  this.mesh.rotation.x = Math.sin(this.flapAngle * 1.5) * 0.03;
};

// -------- STAGE 6: WRIGHT FLYER (Wright Brothers Biplane) --------
var WrightFlyer = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "wrightflyer";

  // Color palette
  var canvasMat = new THREE.MeshPhongMaterial({color:0xF5E8D0, shading:THREE.FlatShading}); // Cream/off-white canvas
  var woodMat = new THREE.MeshPhongMaterial({color:0x7A4A2A, shading:THREE.FlatShading}); // Dark brown wood
  var woodLightMat = new THREE.MeshPhongMaterial({color:0x9B6A3A, shading:THREE.FlatShading}); // Lighter wood
  var metalMat = new THREE.MeshPhongMaterial({color:0x555555, shading:THREE.FlatShading}); // Metal/dark gray
  var skinMat = new THREE.MeshPhongMaterial({color:0xD4A880, shading:THREE.FlatShading}); // Pilot skin
  var clothMat = new THREE.MeshPhongMaterial({color:0x5A4030, shading:THREE.FlatShading}); // Pilot brown clothes

  // === UPPER WING ===
  var upperWing = new THREE.Mesh(new THREE.BoxGeometry(40, 2, 100), canvasMat);
  upperWing.position.set(0, 16, 0);
  this.mesh.add(upperWing);

  // === LOWER WING ===
  var lowerWing = new THREE.Mesh(new THREE.BoxGeometry(40, 2, 100), canvasMat);
  lowerWing.position.set(0, 0, 0);
  this.mesh.add(lowerWing);

  // === VERTICAL STRUTS (connecting upper and lower wings) ===
  for (var s = -2; s <= 2; s++) {
    // Right side struts
    var strutR = new THREE.Mesh(new THREE.BoxGeometry(2, 14, 2), woodMat);
    strutR.position.set(s * 9, 8, 35);
    this.mesh.add(strutR);

    // Left side struts
    var strutL = new THREE.Mesh(new THREE.BoxGeometry(2, 14, 2), woodMat);
    strutL.position.set(s * 9, 8, -35);
    this.mesh.add(strutL);
  }

  // Cross-wire struts (X-bracing between wings)
  for (var x = -1; x <= 1; x += 2) {
    var crossR = new THREE.Mesh(new THREE.BoxGeometry(1, 18, 1), woodLightMat);
    crossR.position.set(x * 8, 8, 35);
    crossR.rotation.z = 0.4 * x;
    this.mesh.add(crossR);

    var crossL = new THREE.Mesh(new THREE.BoxGeometry(1, 18, 1), woodLightMat);
    crossL.position.set(x * 8, 8, -35);
    crossL.rotation.z = 0.4 * x;
    this.mesh.add(crossL);
  }

  // Center struts
  var centerStrutR = new THREE.Mesh(new THREE.BoxGeometry(2, 14, 2), woodMat);
  centerStrutR.position.set(0, 8, 15);
  this.mesh.add(centerStrutR);
  var centerStrutL = new THREE.Mesh(new THREE.BoxGeometry(2, 14, 2), woodMat);
  centerStrutL.position.set(0, 8, -15);
  this.mesh.add(centerStrutL);

  // === FRONT ELEVATOR (Canard) ===
  var canardUpper = new THREE.Mesh(new THREE.BoxGeometry(12, 1.5, 35), canvasMat);
  canardUpper.position.set(40, 10, 0);
  this.mesh.add(canardUpper);
  var canardLower = new THREE.Mesh(new THREE.BoxGeometry(12, 1.5, 35), canvasMat);
  canardLower.position.set(40, 4, 0);
  this.mesh.add(canardLower);

  // Canard struts
  var canardStrutR = new THREE.Mesh(new THREE.BoxGeometry(1.5, 6, 1.5), woodMat);
  canardStrutR.position.set(40, 7, 12);
  this.mesh.add(canardStrutR);
  var canardStrutL = canardStrutR.clone();
  canardStrutL.position.z = -12;
  this.mesh.add(canardStrutL);

  // Canard connecting beams
  var canardBeamR = new THREE.Mesh(new THREE.BoxGeometry(40, 1.5, 1.5), woodMat);
  canardBeamR.position.set(20, 1, 10);
  this.mesh.add(canardBeamR);
  var canardBeamL = canardBeamR.clone();
  canardBeamL.position.z = -10;
  this.mesh.add(canardBeamL);

  // === REAR RUDDER ===
  var rudder = new THREE.Mesh(new THREE.BoxGeometry(8, 12, 1.5), canvasMat);
  rudder.position.set(-35, 8, 0);
  this.mesh.add(rudder);

  // Rear connecting beams
  var rearBeamR = new THREE.Mesh(new THREE.BoxGeometry(30, 1.5, 1.5), woodMat);
  rearBeamR.position.set(-22, 2, 8);
  this.mesh.add(rearBeamR);
  var rearBeamL = rearBeamR.clone();
  rearBeamL.position.z = -8;
  this.mesh.add(rearBeamL);

  // === PROPELLER (two blades) ===
  this.propeller = new THREE.Object3D();
  var blade1 = new THREE.Mesh(new THREE.BoxGeometry(2, 18, 4), metalMat);
  this.propeller.add(blade1);
  var blade2 = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 18), metalMat);
  this.propeller.add(blade2);
  this.propeller.position.set(-10, 8, 0);
  this.mesh.add(this.propeller);

  // === LANDING SKIDS ===
  var skidR = new THREE.Mesh(new THREE.BoxGeometry(50, 2, 2), woodMat);
  skidR.position.set(5, -3, 12);
  this.mesh.add(skidR);
  var skidL = skidR.clone();
  skidL.position.z = -12;
  this.mesh.add(skidL);

  // Skid front curves (slight upturn)
  var skidFrontR = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 2), woodMat);
  skidFrontR.position.set(30, -1, 12);
  skidFrontR.rotation.z = 0.4;
  this.mesh.add(skidFrontR);
  var skidFrontL = skidFrontR.clone();
  skidFrontL.position.z = -12;
  this.mesh.add(skidFrontL);

  // === PILOT (lying prone on lower wing) ===
  // Pilot body
  var pilotBody = new THREE.Mesh(new THREE.BoxGeometry(16, 6, 8), clothMat);
  pilotBody.position.set(5, 5, 0);
  this.mesh.add(pilotBody);

  // Pilot head
  var pilotHead = new THREE.Mesh(new THREE.BoxGeometry(6, 6, 7), skinMat);
  pilotHead.position.set(14, 7, 0);
  this.mesh.add(pilotHead);

  // Pilot hat/cap
  var pilotCap = new THREE.Mesh(new THREE.BoxGeometry(7, 3, 8), clothMat);
  pilotCap.position.set(14, 10, 0);
  this.mesh.add(pilotCap);

  // Pilot arms (reaching forward)
  var armR = new THREE.Mesh(new THREE.BoxGeometry(10, 3, 3), clothMat);
  armR.position.set(12, 3, 5);
  this.mesh.add(armR);
  var armL = armR.clone();
  armL.position.z = -5;
  this.mesh.add(armL);

  // Pilot hands
  var handR = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), skinMat);
  handR.position.set(17, 3, 5);
  this.mesh.add(handR);
  var handL = handR.clone();
  handL.position.z = -5;
  this.mesh.add(handL);

  // === ENGINE BLOCK ===
  var engine = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 8), metalMat);
  engine.position.set(-5, 5, 0);
  this.mesh.add(engine);

  // Shadows
  this.mesh.traverse(function(child) {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Dummy pilot object
  this.pilot = {
    mesh: new THREE.Object3D(),
    updateHairs: function(){}
  };
  this.mesh.add(this.pilot.mesh);
};

WrightFlyer.prototype.updateWings = function(){
  // Propeller spins
  this.propeller.rotation.x += 0.3;
};

// -------- STAGE 7: NEWTON'S APPLE AIRCRAFT --------
var NewtonApple = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "newtonapple";

  // Color palette
  var appleMat = new THREE.MeshPhongMaterial({color:0xCC2222, shading:THREE.FlatShading}); // Bright red apple
  var appleDarkMat = new THREE.MeshPhongMaterial({color:0xAA1818, shading:THREE.FlatShading}); // Darker red
  var appleHighMat = new THREE.MeshPhongMaterial({color:0xDD4040, shading:THREE.FlatShading}); // Highlight red
  var stemMat = new THREE.MeshPhongMaterial({color:0x6B4226, shading:THREE.FlatShading}); // Brown stem
  var leafMat = new THREE.MeshPhongMaterial({color:0x3D8B37, shading:THREE.FlatShading}); // Green leaf
  var woodMat = new THREE.MeshPhongMaterial({color:0x7A4A2A, shading:THREE.FlatShading}); // Propeller wood
  var skinMat = new THREE.MeshPhongMaterial({color:0xD4A880, shading:THREE.FlatShading}); // Newton skin
  var wigMat = new THREE.MeshPhongMaterial({color:0xBBBBBB, shading:THREE.FlatShading}); // Gray wig
  var wigDarkMat = new THREE.MeshPhongMaterial({color:0x999999, shading:THREE.FlatShading}); // Darker wig
  var coatMat = new THREE.MeshPhongMaterial({color:0x1A2A6B, shading:THREE.FlatShading}); // Navy blue coat
  var shirtMat = new THREE.MeshPhongMaterial({color:0xEEEEDD, shading:THREE.FlatShading}); // White shirt

  // === APPLE BODY (rounder, more spherical shape) ===
  var appleCore = new THREE.Mesh(new THREE.BoxGeometry(42, 40, 42), appleMat);
  appleCore.position.set(0, 0, 0);
  this.mesh.add(appleCore);

  // Fill to make it rounder
  var appleMidX = new THREE.Mesh(new THREE.BoxGeometry(48, 34, 36), appleMat);
  appleMidX.position.set(0, 0, 0);
  this.mesh.add(appleMidX);

  var appleMidZ = new THREE.Mesh(new THREE.BoxGeometry(36, 34, 48), appleMat);
  appleMidZ.position.set(0, 0, 0);
  this.mesh.add(appleMidZ);

  // Front rounding
  var appleFront = new THREE.Mesh(new THREE.BoxGeometry(10, 30, 34), appleHighMat);
  appleFront.position.set(26, 0, 0);
  this.mesh.add(appleFront);

  // Back rounding
  var appleBack = new THREE.Mesh(new THREE.BoxGeometry(10, 30, 34), appleDarkMat);
  appleBack.position.set(-26, 0, 0);
  this.mesh.add(appleBack);

  // Top rounding
  var appleTopFill = new THREE.Mesh(new THREE.BoxGeometry(34, 6, 34), appleHighMat);
  appleTopFill.position.set(0, 20, 0);
  this.mesh.add(appleTopFill);

  // Bottom rounding
  var appleBottomFill = new THREE.Mesh(new THREE.BoxGeometry(34, 6, 34), appleDarkMat);
  appleBottomFill.position.set(0, -20, 0);
  this.mesh.add(appleBottomFill);

  // Apple dimple (top indent)
  var dimple = new THREE.Mesh(new THREE.BoxGeometry(10, 4, 10), appleDarkMat);
  dimple.position.set(2, 20, 0);
  this.mesh.add(dimple);

  // === STEM ===
  var stem = new THREE.Mesh(new THREE.BoxGeometry(4, 14, 4), stemMat);
  stem.position.set(2, 28, 0);
  this.mesh.add(stem);

  // === LEAF ===
  var leaf = new THREE.Mesh(new THREE.BoxGeometry(12, 3, 8), leafMat);
  leaf.position.set(8, 28, 0);
  leaf.rotation.z = -0.4;
  this.mesh.add(leaf);

  // === NEWTON (sitting in cockpit) ===
  // Cockpit opening (slightly recessed)
  var cockpit = new THREE.Mesh(new THREE.BoxGeometry(18, 8, 20), appleDarkMat);
  cockpit.position.set(5, 20, 0);
  this.mesh.add(cockpit);

  // Newton's body (blue coat)
  var newtonBody = new THREE.Mesh(new THREE.BoxGeometry(14, 14, 12), coatMat);
  newtonBody.position.set(5, 26, 0);
  this.mesh.add(newtonBody);

  // White shirt collar/cravat
  var shirt = new THREE.Mesh(new THREE.BoxGeometry(6, 5, 10), shirtMat);
  shirt.position.set(10, 30, 0);
  this.mesh.add(shirt);

  // Newton's head
  var newtonHead = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), skinMat);
  newtonHead.position.set(8, 38, 0);
  this.mesh.add(newtonHead);

  // Newton's eyes
  var nEyeR = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshLambertMaterial({color:0x222222}));
  nEyeR.position.set(13, 39, 4);
  this.mesh.add(nEyeR);
  var nEyeL = nEyeR.clone();
  nEyeL.position.z = -4;
  this.mesh.add(nEyeL);

  // Newton's wig (gray, curly, iconic)
  // Main wig top
  var wigTop = new THREE.Mesh(new THREE.BoxGeometry(12, 6, 12), wigMat);
  wigTop.position.set(7, 44, 0);
  this.mesh.add(wigTop);

  // Wig sides (curly rolls)
  var wigRollR = new THREE.Mesh(new THREE.BoxGeometry(6, 14, 6), wigMat);
  wigRollR.position.set(5, 38, 8);
  this.mesh.add(wigRollR);
  var wigRollL = wigRollR.clone();
  wigRollL.position.z = -8;
  this.mesh.add(wigRollL);

  // Wig curl details
  var wigCurlR1 = new THREE.Mesh(new THREE.BoxGeometry(4, 5, 5), wigDarkMat);
  wigCurlR1.position.set(5, 34, 10);
  this.mesh.add(wigCurlR1);
  var wigCurlL1 = wigCurlR1.clone();
  wigCurlL1.position.z = -10;
  this.mesh.add(wigCurlL1);

  var wigCurlR2 = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 5), wigDarkMat);
  wigCurlR2.position.set(5, 40, 10);
  this.mesh.add(wigCurlR2);
  var wigCurlL2 = wigCurlR2.clone();
  wigCurlL2.position.z = -10;
  this.mesh.add(wigCurlL2);

  // Wig back
  var wigBack = new THREE.Mesh(new THREE.BoxGeometry(6, 12, 10), wigMat);
  wigBack.position.set(2, 38, 0);
  this.mesh.add(wigBack);

  // Newton's arms (holding steering bar)
  var armR = new THREE.Mesh(new THREE.BoxGeometry(10, 4, 4), coatMat);
  armR.position.set(12, 26, 8);
  this.mesh.add(armR);
  var armL = armR.clone();
  armL.position.z = -8;
  this.mesh.add(armL);

  // Newton's hands
  var handR = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), skinMat);
  handR.position.set(17, 26, 8);
  this.mesh.add(handR);
  var handL = handR.clone();
  handL.position.z = -8;
  this.mesh.add(handL);

  // === GREEN PROPELLER (front of apple, 4 blades) ===
  var propMat = new THREE.MeshPhongMaterial({color:0x3D8B37, shading:THREE.FlatShading}); // Green
  var propHubMat = new THREE.MeshPhongMaterial({color:0x2D6B27, shading:THREE.FlatShading}); // Dark green hub

  this.propeller = new THREE.Object3D();

  // Hub
  var hub = new THREE.Mesh(new THREE.BoxGeometry(4, 6, 6), propHubMat);
  this.propeller.add(hub);

  // 4 blades
  for (var b = 0; b < 4; b++) {
    var blade = new THREE.Mesh(new THREE.BoxGeometry(3, 20, 5), propMat);
    blade.position.y = 10;
    var bladeWrapper = new THREE.Object3D();
    bladeWrapper.add(blade);
    bladeWrapper.rotation.x = (Math.PI / 2) * b;
    this.propeller.add(bladeWrapper);
  }

  this.propeller.position.set(32, 0, 0); // FRONT of apple
  this.mesh.add(this.propeller);

  // === LANDING GEAR (small brown legs) ===
  var gearR = new THREE.Mesh(new THREE.BoxGeometry(5, 12, 5), stemMat);
  gearR.position.set(5, -22, 10);
  this.mesh.add(gearR);
  var gearL = gearR.clone();
  gearL.position.z = -10;
  this.mesh.add(gearL);

  // Shadows
  this.mesh.traverse(function(child) {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Dummy pilot
  this.pilot = {
    mesh: new THREE.Object3D(),
    updateHairs: function(){}
  };
  this.mesh.add(this.pilot.mesh);
};

NewtonApple.prototype.updateWings = function(){
  // Propeller spins (slow enough to see individual blades)
  this.propeller.rotation.x += 0.08;
};

// -------- STAGE 8: TIME ARROW (Einstein's Arrow of Time) --------
var TimeArrow = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "timearrow";

  // Color palette
  var arrowWhite = new THREE.MeshPhongMaterial({color:0xF5F0E8, shading:THREE.FlatShading}); // Off-white arrow body
  var arrowRed = new THREE.MeshPhongMaterial({color:0xE84030, shading:THREE.FlatShading}); // Red trim/outline
  var arrowRedDark = new THREE.MeshPhongMaterial({color:0xC03020, shading:THREE.FlatShading}); // Darker red
  var clockMat = new THREE.MeshPhongMaterial({color:0x8B4030, shading:THREE.FlatShading}); // Dark brown clock markings
  var propMat = new THREE.MeshPhongMaterial({color:0x2A2020, shading:THREE.FlatShading}); // Dark propeller
  var skinMat = new THREE.MeshPhongMaterial({color:0xD4A880, shading:THREE.FlatShading}); // Einstein skin
  var hairMat = new THREE.MeshPhongMaterial({color:0xCCCCCC, shading:THREE.FlatShading}); // Wild gray hair
  var hairDarkMat = new THREE.MeshPhongMaterial({color:0xAAAAAA, shading:THREE.FlatShading}); // Darker gray
  var jacketMat = new THREE.MeshPhongMaterial({color:0x6B6040, shading:THREE.FlatShading}); // Olive jacket
  var pantsMat = new THREE.MeshPhongMaterial({color:0x5A4030, shading:THREE.FlatShading}); // Brown pants

  // === ARROW BODY (pointing RIGHT, +X direction) ===

  // Main shaft (white)
  var shaft = new THREE.Mesh(new THREE.BoxGeometry(70, 14, 20), arrowWhite);
  shaft.position.set(-5, 0, 0);
  this.mesh.add(shaft);

  // Red top trim
  var trimTop = new THREE.Mesh(new THREE.BoxGeometry(72, 3, 22), arrowRed);
  trimTop.position.set(-5, 8, 0);
  this.mesh.add(trimTop);

  // Red bottom trim
  var trimBottom = new THREE.Mesh(new THREE.BoxGeometry(72, 3, 22), arrowRed);
  trimBottom.position.set(-5, -8, 0);
  this.mesh.add(trimBottom);

  // Red side trims
  var trimSideR = new THREE.Mesh(new THREE.BoxGeometry(72, 16, 3), arrowRed);
  trimSideR.position.set(-5, 0, 11);
  this.mesh.add(trimSideR);
  var trimSideL = trimSideR.clone();
  trimSideL.position.z = -11;
  this.mesh.add(trimSideL);

  // === ARROWHEAD (sharper, more pointed) ===
  // Upper chevron (longer, steeper angle)
  var arrowheadUp = new THREE.Mesh(new THREE.BoxGeometry(28, 8, 22), arrowRed);
  arrowheadUp.position.set(44, 10, 0);
  arrowheadUp.rotation.z = -0.45;
  this.mesh.add(arrowheadUp);

  // Lower chevron
  var arrowheadDown = new THREE.Mesh(new THREE.BoxGeometry(28, 8, 22), arrowRed);
  arrowheadDown.position.set(44, -10, 0);
  arrowheadDown.rotation.z = 0.45;
  this.mesh.add(arrowheadDown);

  // White fill inside
  var arrowheadFillUp = new THREE.Mesh(new THREE.BoxGeometry(24, 5, 18), arrowWhite);
  arrowheadFillUp.position.set(43, 10, 0);
  arrowheadFillUp.rotation.z = -0.45;
  this.mesh.add(arrowheadFillUp);
  var arrowheadFillDown = new THREE.Mesh(new THREE.BoxGeometry(24, 5, 18), arrowWhite);
  arrowheadFillDown.position.set(43, -10, 0);
  arrowheadFillDown.rotation.z = 0.45;
  this.mesh.add(arrowheadFillDown);

  // Sharp tip point
  var tip1 = new THREE.Mesh(new THREE.BoxGeometry(8, 5, 16), arrowRed);
  tip1.position.set(58, 0, 0);
  this.mesh.add(tip1);
  var tip2 = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 10), arrowRed);
  tip2.position.set(63, 0, 0);
  this.mesh.add(tip2);
  var tip3 = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 5), arrowRed);
  tip3.position.set(67, 0, 0);
  this.mesh.add(tip3);

  // === TAIL NOTCH (V-cut at back) ===
  var tailUp = new THREE.Mesh(new THREE.BoxGeometry(12, 10, 22), arrowRed);
  tailUp.position.set(-42, 10, 0);
  tailUp.rotation.z = 0.4;
  this.mesh.add(tailUp);

  var tailDown = new THREE.Mesh(new THREE.BoxGeometry(12, 10, 22), arrowRed);
  tailDown.position.set(-42, -10, 0);
  tailDown.rotation.z = -0.4;
  this.mesh.add(tailDown);

  var tailFillUp = new THREE.Mesh(new THREE.BoxGeometry(10, 7, 18), arrowWhite);
  tailFillUp.position.set(-41, 10, 0);
  tailFillUp.rotation.z = 0.4;
  this.mesh.add(tailFillUp);

  var tailFillDown = new THREE.Mesh(new THREE.BoxGeometry(10, 7, 18), arrowWhite);
  tailFillDown.position.set(-41, -10, 0);
  tailFillDown.rotation.z = -0.4;
  this.mesh.add(tailFillDown);

  // === CLOCK SYMBOLS on arrow body ===
  // Clock circle (front)
  var clockFace1 = new THREE.Mesh(new THREE.BoxGeometry(2, 10, 10), clockMat);
  clockFace1.position.set(18, 0, 11);
  this.mesh.add(clockFace1);
  // Clock hands
  var clockHand1a = new THREE.Mesh(new THREE.BoxGeometry(2, 6, 1), clockMat);
  clockHand1a.position.set(18, 2, 11);
  this.mesh.add(clockHand1a);
  var clockHand1b = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 4), clockMat);
  clockHand1b.position.set(18, 0, 13);
  this.mesh.add(clockHand1b);

  // Clock symbol (back)
  var clockFace2 = new THREE.Mesh(new THREE.BoxGeometry(2, 10, 10), clockMat);
  clockFace2.position.set(-25, 0, 11);
  this.mesh.add(clockFace2);
  var clockHand2a = new THREE.Mesh(new THREE.BoxGeometry(2, 5, 1), clockMat);
  clockHand2a.position.set(-25, 2, 11);
  this.mesh.add(clockHand2a);

  // === CLOCK on top of arrow body ===
  // Clock face (white circle on top)
  var clockBgMat = new THREE.MeshPhongMaterial({color:0xFFFFF0, shading:THREE.FlatShading});
  var clockRimMat = new THREE.MeshPhongMaterial({color:0x8B4030, shading:THREE.FlatShading});
  var clockHandMat = new THREE.MeshPhongMaterial({color:0x222222, shading:THREE.FlatShading});

  // Clock rim (ring)
  var clockRim = new THREE.Mesh(new THREE.BoxGeometry(14, 2, 14), clockRimMat);
  clockRim.position.set(20, 8, 0);
  this.mesh.add(clockRim);
  // Clock face
  var clockFace = new THREE.Mesh(new THREE.BoxGeometry(11, 2.5, 11), clockBgMat);
  clockFace.position.set(20, 8, 0);
  this.mesh.add(clockFace);
  // Hour hand
  var hourHand = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 1.5), clockHandMat);
  hourHand.position.set(22, 8.5, 0);
  hourHand.rotation.y = 0.3;
  this.mesh.add(hourHand);
  // Minute hand
  var minHand = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3, 5), clockHandMat);
  minHand.position.set(20, 8.5, -1);
  this.mesh.add(minHand);
  // Clock center dot
  var clockCenter = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 2), clockHandMat);
  clockCenter.position.set(20, 8.5, 0);
  this.mesh.add(clockCenter);
  // Hour markers (12, 3, 6, 9)
  var marker12 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3, 1.5), clockRimMat);
  marker12.position.set(20, 8.5, -5);
  this.mesh.add(marker12);
  var marker6 = marker12.clone(); marker6.position.z = 5; this.mesh.add(marker6);
  var marker3 = marker12.clone(); marker3.position.set(25, 8.5, 0); this.mesh.add(marker3);
  var marker9 = marker12.clone(); marker9.position.set(15, 8.5, 0); this.mesh.add(marker9);

  // === EINSTEIN (sitting on top of arrow) ===
  // Body (olive jacket)
  var einsteinBody = new THREE.Mesh(new THREE.BoxGeometry(14, 16, 12), jacketMat);
  einsteinBody.position.set(5, 16, 0);
  this.mesh.add(einsteinBody);

  // Jacket lapels (open collar detail)
  var lapelR = new THREE.Mesh(new THREE.BoxGeometry(4, 6, 3), jacketMat);
  lapelR.position.set(10, 22, 4);
  lapelR.rotation.z = -0.3;
  this.mesh.add(lapelR);
  var lapelL = lapelR.clone();
  lapelL.position.z = -4;
  lapelL.rotation.z = -0.3;
  this.mesh.add(lapelL);

  // Pants/legs
  var legR = new THREE.Mesh(new THREE.BoxGeometry(5, 10, 5), pantsMat);
  legR.position.set(5, 5, 5);
  this.mesh.add(legR);
  var legL = legR.clone();
  legL.position.z = -5;
  this.mesh.add(legL);

  // Shoes
  var shoeR = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 5), new THREE.MeshPhongMaterial({color:0x2A2020, shading:THREE.FlatShading}));
  shoeR.position.set(7, 0, 5);
  this.mesh.add(shoeR);
  var shoeL = shoeR.clone();
  shoeL.position.z = -5;
  this.mesh.add(shoeL);

  // Head (slightly larger)
  var einsteinHead = new THREE.Mesh(new THREE.BoxGeometry(11, 11, 11), skinMat);
  einsteinHead.position.set(7, 30, 0);
  this.mesh.add(einsteinHead);

  // Wrinkle lines on forehead
  var wrinkle = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 8), hairDarkMat);
  wrinkle.position.set(12, 34, 0);
  this.mesh.add(wrinkle);

  // Eyes (deeper set)
  var eEyeR = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshLambertMaterial({color:0x222222}));
  eEyeR.position.set(12, 31, 4);
  this.mesh.add(eEyeR);
  var eEyeL = eEyeR.clone();
  eEyeL.position.z = -4;
  this.mesh.add(eEyeL);

  // Thick eyebrows
  var browMat = new THREE.MeshPhongMaterial({color:0x888888, shading:THREE.FlatShading});
  var browR = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 4), browMat);
  browR.position.set(12, 33, 4);
  this.mesh.add(browR);
  var browL = browR.clone();
  browL.position.z = -4;
  this.mesh.add(browL);

  // Big nose
  var nose = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 4), skinMat);
  nose.position.set(13, 29, 0);
  this.mesh.add(nose);

  // Thick mustache (Einstein's iconic big mustache)
  var mustache = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 10), hairDarkMat);
  mustache.position.set(12, 26, 0);
  this.mesh.add(mustache);
  // Mustache sides drooping
  var mustacheR = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 3), hairDarkMat);
  mustacheR.position.set(12, 25, 5);
  this.mesh.add(mustacheR);
  var mustacheL = mustacheR.clone();
  mustacheL.position.z = -5;
  this.mesh.add(mustacheL);

  // Curly poofy Einstein hair (many small cubes = 뽀글뽀글)
  var curlPositions = [
    // Top layer
    [4,40,0],[7,40,0],[10,40,0],
    [3,40,4],[6,40,4],[9,40,4],
    [3,40,-4],[6,40,-4],[9,40,-4],
    [5,40,7],[8,40,7],
    [5,40,-7],[8,40,-7],
    // Upper layer
    [3,43,0],[6,43,0],[9,43,0],
    [4,43,4],[7,43,4],
    [4,43,-4],[7,43,-4],
    [5,43,7],[5,43,-7],
    // Peak
    [5,46,0],[7,46,0],
    [5,46,3],[5,46,-3],
    [7,46,3],[7,46,-3],
    // Side right
    [2,37,10],[4,37,10],[2,34,10],[4,34,10],
    [1,37,13],[3,37,13],[1,34,13],
    [3,40,10],[1,40,10],
    [0,31,11],[2,31,11],[4,31,11],
    [0,34,13],
    // Side left
    [2,37,-10],[4,37,-10],[2,34,-10],[4,34,-10],
    [1,37,-13],[3,37,-13],[1,34,-13],
    [3,40,-10],[1,40,-10],
    [0,31,-11],[2,31,-11],[4,31,-11],
    [0,34,-13],
    // Back
    [-1,37,0],[-1,37,4],[-1,37,-4],
    [-1,34,0],[-1,34,4],[-1,34,-4],[-1,34,7],[-1,34,-7],
    [-1,31,0],[-1,31,4],[-1,31,-4],
    [0,40,0],[0,40,4],[0,40,-4],
    // Front wisps
    [11,37,4],[11,37,-4],[11,37,0],
    [11,34,6],[11,34,-6],
  ];

  for (var c = 0; c < curlPositions.length; c++) {
    var cp = curlPositions[c];
    var curlMaterial = (c % 3 === 0) ? hairDarkMat : hairMat;
    var curl = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), curlMaterial);
    curl.position.set(cp[0], cp[1], cp[2]);
    // Slight random-ish rotation for organic feel
    curl.rotation.set((c*0.7)%0.4, (c*0.5)%0.4, (c*0.3)%0.4);
    this.mesh.add(curl);
  }

  // Arms
  var armR = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 4), jacketMat);
  armR.position.set(8, 18, 8);
  this.mesh.add(armR);
  var armL = armR.clone();
  armL.position.z = -8;
  this.mesh.add(armL);

  // Hands
  var handR = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), skinMat);
  handR.position.set(12, 18, 8);
  this.mesh.add(handR);
  var handL = handR.clone();
  handL.position.z = -8;
  this.mesh.add(handL);

  // === PROPELLER (back of arrow, dark) ===
  this.propeller = new THREE.Object3D();

  var hub = new THREE.Mesh(new THREE.BoxGeometry(4, 5, 5), propMat);
  this.propeller.add(hub);

  for (var b = 0; b < 4; b++) {
    var blade = new THREE.Mesh(new THREE.BoxGeometry(3, 18, 4), propMat);
    blade.position.y = 9;
    var bw = new THREE.Object3D();
    bw.add(blade);
    bw.rotation.x = (Math.PI / 2) * b;
    this.propeller.add(bw);
  }

  this.propeller.position.set(-48, 0, 0);
  this.mesh.add(this.propeller);

  // Shadows
  this.mesh.traverse(function(child) {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Dummy pilot
  this.pilot = {
    mesh: new THREE.Object3D(),
    updateHairs: function(){}
  };
  this.mesh.add(this.pilot.mesh);
};

TimeArrow.prototype.updateWings = function(){
  // Propeller spins
  this.propeller.rotation.x += 0.1;
};

// -------- STAGE 2: OPABINIA (Cambrian creature) --------
var Opabinia = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "opabinia";

  // Color palette
  var bodyMat = new THREE.MeshPhongMaterial({color:0xE07040, shading:THREE.FlatShading}); // Orange
  var bodyDarkMat = new THREE.MeshPhongMaterial({color:0xB84820, shading:THREE.FlatShading}); // Darker orange/red
  var bodyLightMat = new THREE.MeshPhongMaterial({color:0xF09060, shading:THREE.FlatShading}); // Lighter orange
  var eyeWhiteMat = new THREE.MeshPhongMaterial({color:0xFFFFFF, shading:THREE.FlatShading});
  var eyeBlackMat = new THREE.MeshLambertMaterial({color:0x111111});
  var probMat = new THREE.MeshPhongMaterial({color:0x999088, shading:THREE.FlatShading}); // Gray proboscis
  var probDarkMat = new THREE.MeshPhongMaterial({color:0x777068, shading:THREE.FlatShading});
  var clawMat = new THREE.MeshPhongMaterial({color:0xBBA898, shading:THREE.FlatShading});
  var finMat = new THREE.MeshPhongMaterial({color:0xF09060, shading:THREE.FlatShading}); // Side fin lobes

  // === SEGMENTED BODY (alternating stripes) ===
  var segments = [
    {w:16, h:14, d:18, x:22, mat:bodyMat},     // Head
    {w:10, h:16, d:20, x:13, mat:bodyDarkMat},  // Seg 1
    {w:10, h:16, d:20, x:4, mat:bodyLightMat},  // Seg 2
    {w:10, h:15, d:19, x:-5, mat:bodyDarkMat},  // Seg 3
    {w:10, h:15, d:18, x:-14, mat:bodyLightMat}, // Seg 4
    {w:10, h:14, d:17, x:-23, mat:bodyDarkMat},  // Seg 5
    {w:10, h:12, d:15, x:-32, mat:bodyLightMat}, // Seg 6
    {w:8, h:10, d:12, x:-40, mat:bodyDarkMat},   // Seg 7
    {w:6, h:8, d:9, x:-46, mat:bodyMat},          // Seg 8 (tail base)
  ];

  for (var i = 0; i < segments.length; i++) {
    var s = segments[i];
    var seg = new THREE.Mesh(new THREE.BoxGeometry(s.w, s.h, s.d), s.mat);
    seg.position.set(s.x, 0, 0);
    this.mesh.add(seg);
  }

  // === 5 EYES (the iconic feature!) ===
  // Front pair
  var eyeStalkR1 = new THREE.Mesh(new THREE.BoxGeometry(4, 6, 4), bodyMat);
  eyeStalkR1.position.set(26, 8, 6);
  this.mesh.add(eyeStalkR1);
  var eyeWhiteR1 = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), eyeWhiteMat);
  eyeWhiteR1.position.set(27, 12, 6);
  this.mesh.add(eyeWhiteR1);
  var eyeBlackR1 = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 2), eyeBlackMat);
  eyeBlackR1.position.set(29, 12, 6);
  this.mesh.add(eyeBlackR1);

  var eyeStalkL1 = new THREE.Mesh(new THREE.BoxGeometry(4, 6, 4), bodyMat);
  eyeStalkL1.position.set(26, 8, -6);
  this.mesh.add(eyeStalkL1);
  var eyeWhiteL1 = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), eyeWhiteMat);
  eyeWhiteL1.position.set(27, 12, -6);
  this.mesh.add(eyeWhiteL1);
  var eyeBlackL1 = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 2), eyeBlackMat);
  eyeBlackL1.position.set(29, 12, -6);
  this.mesh.add(eyeBlackL1);

  // Back pair (slightly smaller)
  var eyeStalkR2 = new THREE.Mesh(new THREE.BoxGeometry(3, 5, 3), bodyMat);
  eyeStalkR2.position.set(20, 8, 8);
  this.mesh.add(eyeStalkR2);
  var eyeWhiteR2 = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), eyeWhiteMat);
  eyeWhiteR2.position.set(21, 11, 8);
  this.mesh.add(eyeWhiteR2);
  var eyeBlackR2 = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), eyeBlackMat);
  eyeBlackR2.position.set(23, 11, 8);
  this.mesh.add(eyeBlackR2);

  var eyeStalkL2 = new THREE.Mesh(new THREE.BoxGeometry(3, 5, 3), bodyMat);
  eyeStalkL2.position.set(20, 8, -8);
  this.mesh.add(eyeStalkL2);
  var eyeWhiteL2 = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), eyeWhiteMat);
  eyeWhiteL2.position.set(21, 11, -8);
  this.mesh.add(eyeWhiteL2);
  var eyeBlackL2 = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), eyeBlackMat);
  eyeBlackL2.position.set(23, 11, -8);
  this.mesh.add(eyeBlackL2);

  // Center eye (top, 5th eye)
  var eyeStalkC = new THREE.Mesh(new THREE.BoxGeometry(3, 5, 3), bodyMat);
  eyeStalkC.position.set(24, 9, 0);
  this.mesh.add(eyeStalkC);
  var eyeWhiteC = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), eyeWhiteMat);
  eyeWhiteC.position.set(25, 13, 0);
  this.mesh.add(eyeWhiteC);
  var eyeBlackC = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), eyeBlackMat);
  eyeBlackC.position.set(27, 13, 0);
  this.mesh.add(eyeBlackC);

  // === PROBOSCIS (curved trunk with claw at end) ===
  this.proboscis = new THREE.Object3D();

  // Curved segmented trunk (arches forward then down)
  var probPositions = [
    {x:30, y:-1},
    {x:34, y:-2},
    {x:38, y:-4},
    {x:41, y:-7},
    {x:43, y:-10},
    {x:44, y:-14},
    {x:44, y:-18},
    {x:43, y:-22},
    {x:41, y:-25},
    {x:38, y:-27},
  ];

  for (var p = 0; p < probPositions.length; p++) {
    var pp = probPositions[p];
    var pSize = 3.5 - p * 0.15;
    var pSeg = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, pSize, pSize),
      p % 2 === 0 ? probMat : probDarkMat
    );
    pSeg.position.set(pp.x, pp.y, 0);
    this.proboscis.add(pSeg);
  }

  // Claw at the end (bottom of curve)
  var clawBase = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 4), clawMat);
  clawBase.position.set(36, -29, 0);
  this.proboscis.add(clawBase);
  var clawR = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 2), clawMat);
  clawR.position.set(35, -31, 2);
  this.proboscis.add(clawR);
  var clawL = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 2), clawMat);
  clawL.position.set(35, -31, -2);
  this.proboscis.add(clawL);

  this.mesh.add(this.proboscis);

  // === SIDE LOBE FINS (along body) ===
  this.lobes = [];
  var lobePositions = [8, -2, -12, -22, -32];
  for (var l = 0; l < lobePositions.length; l++) {
    var lobeR = new THREE.Mesh(new THREE.BoxGeometry(8, 2, 8), finMat);
    lobeR.position.set(lobePositions[l], -6, 12);
    lobeR.rotation.z = 0.3;
    this.mesh.add(lobeR);
    this.lobes.push(lobeR);

    var lobeL = new THREE.Mesh(new THREE.BoxGeometry(8, 2, 8), finMat);
    lobeL.position.set(lobePositions[l], -6, -12);
    lobeL.rotation.z = 0.3;
    this.mesh.add(lobeL);
    this.lobes.push(lobeL);
  }

  // === TAIL (flat, straight paddle) ===
  this.tail = new THREE.Object3D();
  // Flat horizontal tail fin
  var tailFlat = new THREE.Mesh(new THREE.BoxGeometry(16, 3, 14), bodyDarkMat);
  tailFlat.position.set(-4, 2, 0);
  this.tail.add(tailFlat);
  // Slightly angled tip
  var tailTip = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 10), bodyMat);
  tailTip.position.set(-14, 4, 0);
  tailTip.rotation.z = 0.3;
  this.tail.add(tailTip);
  this.tail.position.set(-50, 0, 0);
  this.mesh.add(this.tail);

  // Shadows
  this.mesh.traverse(function(child) {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Dummy propeller
  this.propeller = new THREE.Object3D();
  this.mesh.add(this.propeller);

  // Dummy pilot
  this.pilot = {
    mesh: new THREE.Object3D(),
    updateHairs: function(){}
  };
  this.mesh.add(this.pilot.mesh);

  this.swimAngle = 0;
};

Opabinia.prototype.updateWings = function(){
  var speedFactor = (typeof game !== 'undefined' && game.speed) ? game.speed * deltaTime * 14 : 0.03;
  this.swimAngle += speedFactor;

  // Proboscis sways VERY slowly and subtly
  this.proboscis.rotation.y = Math.sin(this.swimAngle * 0.4) * 0.03;
  this.proboscis.rotation.z = Math.sin(this.swimAngle * 0.3) * 0.02;

  // Side lobes undulate like swimming
  for (var i = 0; i < this.lobes.length; i++) {
    this.lobes[i].rotation.z = 0.3 + Math.sin(this.swimAngle * 2.5 + i * 0.6) * 0.25;
  }

  // Tail fan sways
  this.tail.rotation.y = Math.sin(this.swimAngle) * 0.2;
};

// -------- STAGE 2: ANOMALOCARIS (Cambrian apex predator) --------
var Anomalocaris = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "anomalocaris";

  // Color palette (pinkish/tan - different from Opabinia's orange)
  var bodyMat = new THREE.MeshPhongMaterial({color:0xD08050, shading:THREE.FlatShading}); // Tan-orange
  var bodyPinkMat = new THREE.MeshPhongMaterial({color:0xD88090, shading:THREE.FlatShading}); // Pink
  var bodyDarkMat = new THREE.MeshPhongMaterial({color:0xB06040, shading:THREE.FlatShading}); // Darker
  var lobeMat = new THREE.MeshPhongMaterial({color:0xF0D090, shading:THREE.FlatShading}); // Cream/tan lobes
  var lobeLightMat = new THREE.MeshPhongMaterial({color:0xFFF0D0, shading:THREE.FlatShading}); // Light cream
  var eyeMat = new THREE.MeshPhongMaterial({color:0x3A3A3A, shading:THREE.FlatShading}); // Dark compound eyes
  var eyeDarkMat = new THREE.MeshLambertMaterial({color:0x222222});
  var appendMat = new THREE.MeshPhongMaterial({color:0x9A7050, shading:THREE.FlatShading}); // Brown appendages
  var appendDarkMat = new THREE.MeshPhongMaterial({color:0x7A5030, shading:THREE.FlatShading});
  var mouthMat = new THREE.MeshPhongMaterial({color:0xAA2020, shading:THREE.FlatShading}); // Red mouth/underbody
  var tailMat = new THREE.MeshPhongMaterial({color:0xC07040, shading:THREE.FlatShading});

  // === SEGMENTED BODY ===
  var segments = [
    {w:18, h:16, d:22, x:18, mat:bodyMat},       // Head
    {w:14, h:18, d:26, x:5, mat:bodyPinkMat},     // Seg 1
    {w:14, h:18, d:26, x:-8, mat:bodyMat},        // Seg 2
    {w:12, h:16, d:24, x:-20, mat:bodyPinkMat},   // Seg 3
    {w:12, h:14, d:22, x:-31, mat:bodyMat},       // Seg 4
    {w:10, h:12, d:18, x:-41, mat:bodyDarkMat},   // Seg 5
    {w:8, h:10, d:14, x:-49, mat:bodyMat},        // Seg 6
    {w:6, h:8, d:10, x:-55, mat:bodyDarkMat},     // Seg 7 (tail base)
  ];

  for (var i = 0; i < segments.length; i++) {
    var s = segments[i];
    var seg = new THREE.Mesh(new THREE.BoxGeometry(s.w, s.h, s.d), s.mat);
    seg.position.set(s.x, 0, 0);
    this.mesh.add(seg);
  }

  // Red underbody segments
  var underPositions = [5, -8, -20, -31, -41];
  for (var u = 0; u < underPositions.length; u++) {
    var under = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 10), mouthMat);
    under.position.set(underPositions[u], -10, 0);
    this.mesh.add(under);
  }

  // === COMPOUND EYES (large, dark, bulging) ===
  var eyeR = new THREE.Mesh(new THREE.BoxGeometry(8, 8, 8), eyeMat);
  eyeR.position.set(24, 4, 10);
  this.mesh.add(eyeR);
  // Eye bump details
  var eyeBumpR1 = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), eyeDarkMat);
  eyeBumpR1.position.set(28, 6, 12);
  this.mesh.add(eyeBumpR1);
  var eyeBumpR2 = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), eyeDarkMat);
  eyeBumpR2.position.set(27, 3, 13);
  this.mesh.add(eyeBumpR2);

  var eyeL = new THREE.Mesh(new THREE.BoxGeometry(8, 8, 8), eyeMat);
  eyeL.position.set(24, 4, -10);
  this.mesh.add(eyeL);
  var eyeBumpL1 = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), eyeDarkMat);
  eyeBumpL1.position.set(28, 6, -12);
  this.mesh.add(eyeBumpL1);
  var eyeBumpL2 = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), eyeDarkMat);
  eyeBumpL2.position.set(27, 3, -13);
  this.mesh.add(eyeBumpL2);

  // === GRASPING APPENDAGES (two curved arms) ===
  this.appendageR = new THREE.Object3D();
  this.appendageL = new THREE.Object3D();

  var armPositions = [
    {x:0, y:0}, {x:4, y:-3}, {x:7, y:-7}, {x:9, y:-12},
    {x:10, y:-17}, {x:9, y:-22}, {x:7, y:-26},
  ];

  for (var a = 0; a < armPositions.length; a++) {
    var ap = armPositions[a];
    var armSeg = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 3, 3),
      a % 2 === 0 ? appendMat : appendDarkMat
    );
    armSeg.position.set(ap.x, ap.y, 0);
    this.appendageR.add(armSeg.clone());
    this.appendageL.add(armSeg.clone());
  }

  this.appendageR.position.set(26, -4, 5);
  this.appendageL.position.set(26, -4, -5);
  this.mesh.add(this.appendageR);
  this.mesh.add(this.appendageL);

  // === MOUTH (red, circular) ===
  var mouth = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 6), mouthMat);
  mouth.position.set(26, -6, 0);
  this.mesh.add(mouth);

  // === SIDE LOBES (large flaps along body) ===
  this.lobes = [];
  var lobeData = [
    {x:8, size:14}, {x:-4, size:16}, {x:-16, size:14},
    {x:-28, size:12}, {x:-38, size:10}, {x:-48, size:7},
  ];

  for (var l = 0; l < lobeData.length; l++) {
    var ld = lobeData[l];
    var matChoice = l % 2 === 0 ? lobeMat : lobeLightMat;

    var lobeR = new THREE.Mesh(new THREE.BoxGeometry(10, 2, ld.size), matChoice);
    lobeR.position.set(ld.x, -6, 14);
    lobeR.rotation.z = 0.3;
    this.mesh.add(lobeR);
    this.lobes.push(lobeR);

    var lobeL = new THREE.Mesh(new THREE.BoxGeometry(10, 2, ld.size), matChoice);
    lobeL.position.set(ld.x, -6, -14);
    lobeL.rotation.z = 0.3;
    this.mesh.add(lobeL);
    this.lobes.push(lobeL);
  }

  // === TAIL FAN ===
  this.tail = new THREE.Object3D();
  var tailTop = new THREE.Mesh(new THREE.BoxGeometry(12, 3, 10), tailMat);
  tailTop.position.set(-4, 3, 0);
  this.tail.add(tailTop);
  var tailBot = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 8), bodyDarkMat);
  tailBot.position.set(-8, 5, 0);
  tailBot.rotation.z = 0.3;
  this.tail.add(tailBot);
  this.tail.position.set(-58, 0, 0);
  this.mesh.add(this.tail);

  // Shadows
  this.mesh.traverse(function(child) {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Dummy propeller
  this.propeller = new THREE.Object3D();
  this.mesh.add(this.propeller);

  // Dummy pilot
  this.pilot = {
    mesh: new THREE.Object3D(),
    updateHairs: function(){}
  };
  this.mesh.add(this.pilot.mesh);

  this.swimAngle = 0;
};

Anomalocaris.prototype.updateWings = function(){
  var speedFactor = (typeof game !== 'undefined' && game.speed) ? game.speed * deltaTime * 14 : 0.03;
  this.swimAngle += speedFactor;

  // Side lobes undulate (wave-like swimming)
  for (var i = 0; i < this.lobes.length; i++) {
    this.lobes[i].rotation.z = 0.3 + Math.sin(this.swimAngle * 2.5 + i * 0.5) * 0.3;
  }

  // Appendages sway very slowly
  this.appendageR.rotation.z = Math.sin(this.swimAngle * 0.5) * 0.05;
  this.appendageL.rotation.z = Math.sin(this.swimAngle * 0.5) * 0.05;

  // Tail sways
  this.tail.rotation.y = Math.sin(this.swimAngle) * 0.15;
};

// -------- PLESIOSAUR (Marine reptile) --------
var Plesiosaur = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "plesiosaur";

  // Color palette
  var bodyMat = new THREE.MeshPhongMaterial({color:0xD08050, shading:THREE.FlatShading}); // Warm orange
  var bodyPinkMat = new THREE.MeshPhongMaterial({color:0xDDA0A0, shading:THREE.FlatShading}); // Pink
  var bodyDarkMat = new THREE.MeshPhongMaterial({color:0xB06838, shading:THREE.FlatShading}); // Darker
  var neckMat = new THREE.MeshPhongMaterial({color:0xC09060, shading:THREE.FlatShading}); // Tan neck
  var neckDarkMat = new THREE.MeshPhongMaterial({color:0x9A7048, shading:THREE.FlatShading}); // Darker neck
  var headMat = new THREE.MeshPhongMaterial({color:0xD08050, shading:THREE.FlatShading}); // Head
  var flipperMat = new THREE.MeshPhongMaterial({color:0xF0DDB0, shading:THREE.FlatShading}); // Cream flipper
  var flipperDarkMat = new THREE.MeshPhongMaterial({color:0xC0A878, shading:THREE.FlatShading}); // Tan flipper
  var eyeMat = new THREE.MeshLambertMaterial({color:0x222222});

  // === BODY (compact, wide) ===
  var bodyCore = new THREE.Mesh(new THREE.BoxGeometry(30, 16, 28), bodyMat);
  bodyCore.position.set(0, 0, 0);
  this.mesh.add(bodyCore);

  // Pink top shell
  var bodyTop = new THREE.Mesh(new THREE.BoxGeometry(26, 6, 24), bodyPinkMat);
  bodyTop.position.set(0, 9, 0);
  this.mesh.add(bodyTop);

  // Side body fill
  var bodySideR = new THREE.Mesh(new THREE.BoxGeometry(24, 12, 6), bodyMat);
  bodySideR.position.set(0, 0, 15);
  this.mesh.add(bodySideR);
  var bodySideL = bodySideR.clone();
  bodySideL.position.z = -15;
  this.mesh.add(bodySideL);

  // Back taper
  var bodyBack = new THREE.Mesh(new THREE.BoxGeometry(12, 12, 20), bodyDarkMat);
  bodyBack.position.set(-18, 0, 0);
  this.mesh.add(bodyBack);

  // Front taper
  var bodyFront = new THREE.Mesh(new THREE.BoxGeometry(10, 14, 22), bodyMat);
  bodyFront.position.set(16, 0, 0);
  this.mesh.add(bodyFront);

  // === LONG NECK (segmented, curving upward) ===
  this.neck = new THREE.Object3D();
  var neckSegments = [
    {x:22, y:2}, {x:26, y:5}, {x:29, y:9}, {x:31, y:14},
    {x:32, y:19}, {x:32, y:24}, {x:31, y:29}, {x:29, y:34},
    {x:27, y:38}, {x:25, y:42},
  ];

  for (var n = 0; n < neckSegments.length; n++) {
    var ns = neckSegments[n];
    var nSize = 6 - n * 0.2;
    var nSeg = new THREE.Mesh(
      new THREE.BoxGeometry(nSize, 4.5, nSize),
      n % 2 === 0 ? neckMat : neckDarkMat
    );
    nSeg.position.set(ns.x, ns.y, 0);
    this.neck.add(nSeg);
  }
  this.mesh.add(this.neck);

  // === HEAD (small, at top of neck) ===
  var head = new THREE.Mesh(new THREE.BoxGeometry(10, 7, 8), headMat);
  head.position.set(26, 46, 0);
  this.mesh.add(head);

  // Snout
  var snout = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 6), headMat);
  snout.position.set(31, 45, 0);
  this.mesh.add(snout);

  // Eyes
  var eyeR = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 2), eyeMat);
  eyeR.position.set(29, 48, 4);
  this.mesh.add(eyeR);
  var eyeL = eyeR.clone();
  eyeL.position.z = -4;
  this.mesh.add(eyeL);

  // Nostril
  var nostril = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 4), bodyDarkMat);
  nostril.position.set(33, 46, 0);
  this.mesh.add(nostril);

  // === FOUR PADDLE FLIPPERS ===
  // Front right flipper
  this.flipperFR = new THREE.Object3D();
  var frPad1 = new THREE.Mesh(new THREE.BoxGeometry(10, 3, 14), flipperMat);
  frPad1.position.set(0, 0, 6);
  this.flipperFR.add(frPad1);
  var frPad2 = new THREE.Mesh(new THREE.BoxGeometry(8, 2, 10), flipperDarkMat);
  frPad2.position.set(-2, 0, 12);
  this.flipperFR.add(frPad2);
  var frTip = new THREE.Mesh(new THREE.BoxGeometry(5, 2, 6), flipperMat);
  frTip.position.set(-4, 0, 16);
  this.flipperFR.add(frTip);
  this.flipperFR.position.set(10, -6, 12);
  this.mesh.add(this.flipperFR);

  // Front left flipper
  this.flipperFL = new THREE.Object3D();
  var flPad1 = new THREE.Mesh(new THREE.BoxGeometry(10, 3, 14), flipperMat);
  flPad1.position.set(0, 0, -6);
  this.flipperFL.add(flPad1);
  var flPad2 = new THREE.Mesh(new THREE.BoxGeometry(8, 2, 10), flipperDarkMat);
  flPad2.position.set(-2, 0, -12);
  this.flipperFL.add(flPad2);
  var flTip = new THREE.Mesh(new THREE.BoxGeometry(5, 2, 6), flipperMat);
  flTip.position.set(-4, 0, -16);
  this.flipperFL.add(flTip);
  this.flipperFL.position.set(10, -6, -12);
  this.mesh.add(this.flipperFL);

  // Rear right flipper
  this.flipperRR = new THREE.Object3D();
  var rrPad1 = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 12), flipperMat);
  rrPad1.position.set(0, 0, 5);
  this.flipperRR.add(rrPad1);
  var rrPad2 = new THREE.Mesh(new THREE.BoxGeometry(6, 2, 8), flipperDarkMat);
  rrPad2.position.set(-2, 0, 10);
  this.flipperRR.add(rrPad2);
  this.flipperRR.position.set(-12, -6, 12);
  this.mesh.add(this.flipperRR);

  // Rear left flipper
  this.flipperRL = new THREE.Object3D();
  var rlPad1 = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 12), flipperMat);
  rlPad1.position.set(0, 0, -5);
  this.flipperRL.add(rlPad1);
  var rlPad2 = new THREE.Mesh(new THREE.BoxGeometry(6, 2, 8), flipperDarkMat);
  rlPad2.position.set(-2, 0, -10);
  this.flipperRL.add(rlPad2);
  this.flipperRL.position.set(-12, -6, -12);
  this.mesh.add(this.flipperRL);

  // === SHORT TAIL ===
  this.tail = new THREE.Object3D();
  var tailSeg1 = new THREE.Mesh(new THREE.BoxGeometry(8, 8, 12), bodyDarkMat);
  tailSeg1.position.set(0, 0, 0);
  this.tail.add(tailSeg1);
  var tailSeg2 = new THREE.Mesh(new THREE.BoxGeometry(6, 6, 8), bodyMat);
  tailSeg2.position.set(-7, 0, 0);
  this.tail.add(tailSeg2);
  var tailTip = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 6), bodyDarkMat);
  tailTip.position.set(-12, 0, 0);
  this.tail.add(tailTip);
  this.tail.position.set(-25, 0, 0);
  this.mesh.add(this.tail);

  // Shadows
  this.mesh.traverse(function(child) {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Dummy propeller
  this.propeller = new THREE.Object3D();
  this.mesh.add(this.propeller);

  // Dummy pilot
  this.pilot = {
    mesh: new THREE.Object3D(),
    updateHairs: function(){}
  };
  this.mesh.add(this.pilot.mesh);

  this.swimAngle = 0;
};

Plesiosaur.prototype.updateWings = function(){
  var speedFactor = (typeof game !== 'undefined' && game.speed) ? game.speed * deltaTime * 14 : 0.03;
  this.swimAngle += speedFactor;

  // Flippers paddle gracefully (front pair opposes rear pair)
  var flapAngle = Math.sin(this.swimAngle * 1.8) * 0.35;
  this.flipperFR.rotation.x = flapAngle;
  this.flipperFL.rotation.x = flapAngle;
  this.flipperRR.rotation.x = -flapAngle;
  this.flipperRL.rotation.x = -flapAngle;

  // Neck sways gently
  this.neck.rotation.y = Math.sin(this.swimAngle * 0.6) * 0.05;

  // Tail sways
  this.tail.rotation.y = Math.sin(this.swimAngle * 1.2) * 0.12;

  // Slight body bob
  this.mesh.rotation.z = Math.cos(this.swimAngle * 1.5) * 0.02;
};

// -------- STAGE 11: JETLINER (Modern Passenger Aircraft) --------
var Jetliner = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "jetliner";

  // Color palette
  var skyBlueMat = new THREE.MeshPhongMaterial({color:0x88CCDD, shading:THREE.FlatShading}); // Light sky blue
  var skyBlueDarkMat = new THREE.MeshPhongMaterial({color:0x70B8CC, shading:THREE.FlatShading});
  var navyMat = new THREE.MeshPhongMaterial({color:0x1A3A6B, shading:THREE.FlatShading}); // Dark navy blue
  var navyLightMat = new THREE.MeshPhongMaterial({color:0x2A5090, shading:THREE.FlatShading});
  var silverMat = new THREE.MeshPhongMaterial({color:0xBBBBBB, shading:THREE.FlatShading}); // Silver/gray belly
  var silverDarkMat = new THREE.MeshPhongMaterial({color:0x999999, shading:THREE.FlatShading});
  var whiteMat = new THREE.MeshPhongMaterial({color:0xEEEEEE, shading:THREE.FlatShading});
  var windowMat = new THREE.MeshLambertMaterial({color:0x222233}); // Dark windows
  var engineMat = new THREE.MeshPhongMaterial({color:0x1A3060, shading:THREE.FlatShading}); // Engine blue
  var engineGrayMat = new THREE.MeshPhongMaterial({color:0x666666, shading:THREE.FlatShading});

  // === FUSELAGE (main body) ===
  // Upper fuselage (sky blue)
  var fuselageTop = new THREE.Mesh(new THREE.BoxGeometry(90, 10, 14), skyBlueMat);
  fuselageTop.position.set(0, 4, 0);
  this.mesh.add(fuselageTop);

  // Lower fuselage (silver/gray)
  var fuselageBtm = new THREE.Mesh(new THREE.BoxGeometry(90, 6, 14), silverMat);
  fuselageBtm.position.set(0, -2, 0);
  this.mesh.add(fuselageBtm);

  // Stripe divider line
  var stripe = new THREE.Mesh(new THREE.BoxGeometry(92, 1, 15), whiteMat);
  stripe.position.set(0, 1, 0);
  this.mesh.add(stripe);

  // Nose cone (tapered)
  var nose1 = new THREE.Mesh(new THREE.BoxGeometry(12, 12, 12), skyBlueMat);
  nose1.position.set(48, 2, 0);
  this.mesh.add(nose1);
  var nose2 = new THREE.Mesh(new THREE.BoxGeometry(8, 10, 10), skyBlueMat);
  nose2.position.set(54, 2, 0);
  this.mesh.add(nose2);
  var nose3 = new THREE.Mesh(new THREE.BoxGeometry(5, 7, 7), skyBlueDarkMat);
  nose3.position.set(58, 2, 0);
  this.mesh.add(nose3);
  var noseTip = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 4), silverDarkMat);
  noseTip.position.set(61, 2, 0);
  this.mesh.add(noseTip);

  // Cockpit windshield
  var cockpit = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 10), windowMat);
  cockpit.position.set(50, 8, 0);
  cockpit.rotation.z = -0.2;
  this.mesh.add(cockpit);

  // Tail taper
  var tailTaper1 = new THREE.Mesh(new THREE.BoxGeometry(14, 10, 10), skyBlueMat);
  tailTaper1.position.set(-48, 3, 0);
  this.mesh.add(tailTaper1);
  var tailTaper2 = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 6), skyBlueDarkMat);
  tailTaper2.position.set(-55, 4, 0);
  this.mesh.add(tailTaper2);

  // === WINDOWS (row along fuselage) ===
  for (var w = -35; w <= 38; w += 5) {
    var win = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), windowMat);
    win.position.set(w, 5, 7.5);
    this.mesh.add(win);
    var winL = win.clone();
    winL.position.z = -7.5;
    this.mesh.add(winL);
  }

  // === VERTICAL TAIL FIN (navy blue) ===
  var tailFin = new THREE.Mesh(new THREE.BoxGeometry(16, 22, 3), navyMat);
  tailFin.position.set(-48, 18, 0);
  tailFin.rotation.z = 0.15;
  this.mesh.add(tailFin);
  var tailFinTop = new THREE.Mesh(new THREE.BoxGeometry(10, 6, 3), navyLightMat);
  tailFinTop.position.set(-44, 30, 0);
  tailFinTop.rotation.z = 0.2;
  this.mesh.add(tailFinTop);

  // === HORIZONTAL STABILIZERS ===
  var hStabR = new THREE.Mesh(new THREE.BoxGeometry(14, 2, 16), silverMat);
  hStabR.position.set(-50, 6, 12);
  this.mesh.add(hStabR);
  var hStabL = hStabR.clone();
  hStabL.position.z = -12;
  this.mesh.add(hStabL);

  // === MAIN WINGS (swept back) ===
  // Right wing
  var wingR1 = new THREE.Mesh(new THREE.BoxGeometry(22, 3, 30), silverMat);
  wingR1.position.set(-2, -2, 22);
  wingR1.rotation.z = -0.05;
  this.mesh.add(wingR1);
  var wingR2 = new THREE.Mesh(new THREE.BoxGeometry(14, 2, 18), silverDarkMat);
  wingR2.position.set(-8, -2, 38);
  wingR2.rotation.z = -0.08;
  this.mesh.add(wingR2);
  var wingRTip = new THREE.Mesh(new THREE.BoxGeometry(6, 2, 6), skyBlueMat);
  wingRTip.position.set(-12, -1, 48);
  this.mesh.add(wingRTip);

  // Left wing
  var wingL1 = new THREE.Mesh(new THREE.BoxGeometry(22, 3, 30), silverMat);
  wingL1.position.set(-2, -2, -22);
  wingL1.rotation.z = -0.05;
  this.mesh.add(wingL1);
  var wingL2 = new THREE.Mesh(new THREE.BoxGeometry(14, 2, 18), silverDarkMat);
  wingL2.position.set(-8, -2, -38);
  wingL2.rotation.z = -0.08;
  this.mesh.add(wingL2);
  var wingLTip = new THREE.Mesh(new THREE.BoxGeometry(6, 2, 6), skyBlueMat);
  wingLTip.position.set(-12, -1, -48);
  this.mesh.add(wingLTip);

  // === ENGINES (under wings) ===
  // Right engine
  var engineR = new THREE.Mesh(new THREE.BoxGeometry(14, 8, 8), engineMat);
  engineR.position.set(2, -8, 20);
  this.mesh.add(engineR);
  var engineRFront = new THREE.Mesh(new THREE.BoxGeometry(4, 7, 7), engineGrayMat);
  engineRFront.position.set(10, -8, 20);
  this.mesh.add(engineRFront);
  var engineRBack = new THREE.Mesh(new THREE.BoxGeometry(3, 6, 6), silverDarkMat);
  engineRBack.position.set(-5, -8, 20);
  this.mesh.add(engineRBack);
  // Engine pylon
  var pylonR = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 2), silverMat);
  pylonR.position.set(2, -4, 20);
  this.mesh.add(pylonR);

  // Left engine
  var engineL = new THREE.Mesh(new THREE.BoxGeometry(14, 8, 8), engineMat);
  engineL.position.set(2, -8, -20);
  this.mesh.add(engineL);
  var engineLFront = new THREE.Mesh(new THREE.BoxGeometry(4, 7, 7), engineGrayMat);
  engineLFront.position.set(10, -8, -20);
  this.mesh.add(engineLFront);
  var engineLBack = new THREE.Mesh(new THREE.BoxGeometry(3, 6, 6), silverDarkMat);
  engineLBack.position.set(-5, -8, -20);
  this.mesh.add(engineLBack);
  var pylonL = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 2), silverMat);
  pylonL.position.set(2, -4, -20);
  this.mesh.add(pylonL);

  // Shadows
  this.mesh.traverse(function(child) {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Dummy propeller
  this.propeller = new THREE.Object3D();
  this.mesh.add(this.propeller);

  // Dummy pilot
  this.pilot = {
    mesh: new THREE.Object3D(),
    updateHairs: function(){}
  };
  this.mesh.add(this.pilot.mesh);
};

Jetliner.prototype.updateWings = function(){
  // No moving parts - steady flight
};


// -------- ROCKET (Level 12 vehicle) --------
var Rocket = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "rocket";

  // Materials
  var whiteMat = new THREE.MeshPhongMaterial({color:0xF0F0F0, shading:THREE.FlatShading});
  var redMat = new THREE.MeshPhongMaterial({color:0xCC2222, shading:THREE.FlatShading});
  var darkMat = new THREE.MeshPhongMaterial({color:0x333333, shading:THREE.FlatShading});
  var grayMat = new THREE.MeshPhongMaterial({color:0x888888, shading:THREE.FlatShading});
  var orangeMat = new THREE.MeshPhongMaterial({
    color:0xFF6600,
    emissive:0xFF4400,
    emissiveIntensity:0.5,
    shading:THREE.FlatShading
  });
  var yellowMat = new THREE.MeshPhongMaterial({
    color:0xFFCC00,
    emissive:0xFF8800,
    emissiveIntensity:0.4,
    shading:THREE.FlatShading
  });

  // === NOSE CONE (pointing right - long & sharp) ===
  var noseGeom = new THREE.BoxGeometry(70, 30, 30, 1, 1, 1);
  // Taper front face to a sharp point: collapse all vertices with positive x to a single point
  for (var vi = 0; vi < noseGeom.vertices.length; vi++) {
    if (noseGeom.vertices[vi].x > 0) {
      noseGeom.vertices[vi].x = 45; // push further forward for a long sharp tip
      noseGeom.vertices[vi].y = 0;
      noseGeom.vertices[vi].z = 0;
    }
  }
  noseGeom.computeFaceNormals();
  noseGeom.computeVertexNormals();
  var nose = new THREE.Mesh(noseGeom, redMat);
  nose.position.set(40, 0, 0);
  nose.castShadow = true;
  this.mesh.add(nose);

  // === MAIN BODY (cylindrical tube) ===
  var bodyGeom = new THREE.BoxGeometry(80, 30, 30);
  var body = new THREE.Mesh(bodyGeom, whiteMat);
  body.position.set(0, 0, 0);
  body.castShadow = true;
  this.mesh.add(body);

  // Red stripes on body
  var stripe1Geom = new THREE.BoxGeometry(12, 31, 31);
  var stripe1 = new THREE.Mesh(stripe1Geom, redMat);
  stripe1.position.set(15, 0, 0);
  this.mesh.add(stripe1);

  var stripe2 = new THREE.Mesh(stripe1Geom, redMat);
  stripe2.position.set(-10, 0, 0);
  this.mesh.add(stripe2);

  // Window (porthole)
  var windowGeom = new THREE.BoxGeometry(2, 10, 10);
  var windowMat = new THREE.MeshPhongMaterial({
    color:0x4488CC,
    emissive:0x224466,
    emissiveIntensity:0.3,
    shininess:80,
    shading:THREE.FlatShading
  });
  var windowR = new THREE.Mesh(windowGeom, windowMat);
  windowR.position.set(30, 6, 16);
  this.mesh.add(windowR);
  var windowL = windowR.clone();
  windowL.position.z = -16;
  this.mesh.add(windowL);

  // === ENGINE SECTION (back) ===
  var engineGeom = new THREE.BoxGeometry(25, 32, 32);
  var engine = new THREE.Mesh(engineGeom, grayMat);
  engine.position.set(-45, 0, 0);
  engine.castShadow = true;
  this.mesh.add(engine);

  // Engine nozzle (dark, wider bell shape)
  var nozzleGeom = new THREE.BoxGeometry(10, 26, 26, 1, 1, 1);
  // Widen the back
  nozzleGeom.vertices[0].y *= 1.3; nozzleGeom.vertices[0].z *= 1.3;
  nozzleGeom.vertices[1].y *= 1.3; nozzleGeom.vertices[1].z *= 1.3;
  nozzleGeom.vertices[2].y *= 1.3; nozzleGeom.vertices[2].z *= 1.3;
  nozzleGeom.vertices[3].y *= 1.3; nozzleGeom.vertices[3].z *= 1.3;
  var nozzle = new THREE.Mesh(nozzleGeom, darkMat);
  nozzle.position.set(-60, 0, 0);
  nozzle.castShadow = true;
  this.mesh.add(nozzle);

  // === TAIL FINS (4 fins at 90 degrees) ===
  // Top fin
  var finGeom = new THREE.BoxGeometry(20, 25, 4, 1, 1, 1);
  finGeom.vertices[4].y += 8;
  finGeom.vertices[5].y += 8;
  finGeom.vertices[6].y += 8;
  finGeom.vertices[7].y += 8;
  var finTop = new THREE.Mesh(finGeom, redMat);
  finTop.position.set(-42, 22, 0);
  finTop.castShadow = true;
  this.mesh.add(finTop);

  // Bottom fin
  var finBottom = new THREE.Mesh(finGeom, redMat);
  finBottom.position.set(-42, -22, 0);
  finBottom.rotation.x = Math.PI;
  finBottom.castShadow = true;
  this.mesh.add(finBottom);

  // Right fin
  var finSideGeom = new THREE.BoxGeometry(20, 4, 25, 1, 1, 1);
  finSideGeom.vertices[4].z += 8;
  finSideGeom.vertices[5].z += 8;
  finSideGeom.vertices[6].z += 8;
  finSideGeom.vertices[7].z += 8;
  var finRight = new THREE.Mesh(finSideGeom, redMat);
  finRight.position.set(-42, 0, 22);
  finRight.castShadow = true;
  this.mesh.add(finRight);

  // Left fin
  var finLeft = new THREE.Mesh(finSideGeom, redMat);
  finLeft.position.set(-42, 0, -22);
  finLeft.rotation.x = Math.PI;
  finLeft.castShadow = true;
  this.mesh.add(finLeft);

  // === FLAME / EXHAUST (animated blocks) ===
  this.flameBlocks = [];
  for (var i = 0; i < 12; i++){
    var flameSize = 6 + Math.random() * 8;
    var flameGeom = new THREE.BoxGeometry(flameSize, flameSize * 0.8, flameSize * 0.8);
    var flameMat = (i < 6) ? orangeMat.clone() : yellowMat.clone();
    var flame = new THREE.Mesh(flameGeom, flameMat);
    flame.position.set(
      -65 - Math.random() * 30,
      (-1 + Math.random() * 2) * 8,
      (-1 + Math.random() * 2) * 8
    );
    flame.castShadow = false;
    this.mesh.add(flame);
    this.flameBlocks.push({
      mesh: flame,
      baseX: flame.position.x,
      baseY: flame.position.y,
      baseZ: flame.position.z,
      speed: 0.5 + Math.random() * 1.5,
      phase: Math.random() * Math.PI * 2
    });
  }

  // Flame glow (larger transparent sphere at exhaust)
  var glowGeom = new THREE.SphereGeometry(20, 6, 4);
  var glowMat = new THREE.MeshPhongMaterial({
    color: 0xFF6600,
    emissive: 0xFF4400,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide
  });
  this.flameGlow = new THREE.Mesh(glowGeom, glowMat);
  this.flameGlow.position.set(-75, 0, 0);
  this.mesh.add(this.flameGlow);

  // Shadows on body
  this.mesh.traverse(function(child) {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Dummy propeller
  this.propeller = new THREE.Object3D();
  this.mesh.add(this.propeller);

  // Dummy pilot
  this.pilot = {
    mesh: new THREE.Object3D(),
    updateHairs: function(){}
  };
  this.mesh.add(this.pilot.mesh);
};

Rocket.prototype.updateWings = function(){
  // Animate flame blocks
  var time = Date.now() * 0.003;
  for (var i = 0; i < this.flameBlocks.length; i++){
    var f = this.flameBlocks[i];
    var m = f.mesh;
    // Flicker position
    m.position.x = f.baseX + Math.sin(time * f.speed + f.phase) * 5 - Math.random() * 3;
    m.position.y = f.baseY + Math.sin(time * f.speed * 1.3 + f.phase) * 4;
    m.position.z = f.baseZ + Math.cos(time * f.speed * 0.9 + f.phase) * 4;
    // Flicker scale
    var s = 0.6 + Math.sin(time * f.speed * 2 + f.phase) * 0.4;
    m.scale.set(s, s, s);
    // Flicker opacity
    m.material.emissiveIntensity = 0.3 + Math.sin(time * f.speed * 3) * 0.3;
  }
  // Glow pulse
  if (this.flameGlow) {
    this.flameGlow.material.opacity = 0.15 + Math.sin(time * 2) * 0.08;
    this.flameGlow.scale.set(
      1 + Math.sin(time * 3) * 0.1,
      1 + Math.cos(time * 2.5) * 0.1,
      1 + Math.sin(time * 2) * 0.1
    );
  }
};


// -------- SPACE SHUTTLE (Level 13 vehicle) --------
var SpaceShuttle = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "spaceShuttle";

  // Materials
  var whiteMat = new THREE.MeshPhongMaterial({color:0xF5F5F0, shininess:40, shading:THREE.FlatShading});
  var darkMat = new THREE.MeshPhongMaterial({color:0x222222, shading:THREE.FlatShading});
  var grayMat = new THREE.MeshPhongMaterial({color:0x777788, shininess:30, shading:THREE.FlatShading});
  var heatMat = new THREE.MeshPhongMaterial({color:0x333333, shading:THREE.FlatShading});
  var orangeMat = new THREE.MeshPhongMaterial({
    color:0xFF6600,
    emissive:0xFF4400,
    emissiveIntensity:0.4,
    shading:THREE.FlatShading
  });
  var blueMat = new THREE.MeshPhongMaterial({
    color:0x4488FF,
    emissive:0x2266DD,
    emissiveIntensity:0.3,
    shading:THREE.FlatShading
  });

  // === FUSELAGE (main body - cylindrical, front tapers) ===
  var bodyGeom = new THREE.BoxGeometry(100, 28, 28);
  var body = new THREE.Mesh(bodyGeom, whiteMat);
  body.castShadow = true;
  body.receiveShadow = true;
  this.mesh.add(body);

  // Nose cone (front taper)
  var noseGeom = new THREE.BoxGeometry(40, 24, 24, 1, 1, 1);
  for (var vi = 0; vi < noseGeom.vertices.length; vi++) {
    if (noseGeom.vertices[vi].x > 0) {
      noseGeom.vertices[vi].x = 28;
      noseGeom.vertices[vi].y *= 0.3;
      noseGeom.vertices[vi].z *= 0.3;
    }
  }
  noseGeom.computeFaceNormals();
  noseGeom.computeVertexNormals();
  var nose = new THREE.Mesh(noseGeom, whiteMat);
  nose.position.set(60, 0, 0);
  nose.castShadow = true;
  this.mesh.add(nose);

  // Cockpit windows (dark strip on top-front)
  var windowGeom = new THREE.BoxGeometry(20, 3, 22);
  var windows = new THREE.Mesh(windowGeom, darkMat);
  windows.position.set(45, 14, 0);
  this.mesh.add(windows);

  // Belly heat shield (dark underside)
  var bellyGeom = new THREE.BoxGeometry(90, 4, 26);
  var belly = new THREE.Mesh(bellyGeom, heatMat);
  belly.position.set(0, -14, 0);
  this.mesh.add(belly);

  // === DELTA WINGS (large triangular wings) ===
  var wingGeom = new THREE.BoxGeometry(50, 4, 45, 1, 1, 1);
  // Taper trailing edge 
  for (var vi = 0; vi < wingGeom.vertices.length; vi++) {
    if (wingGeom.vertices[vi].x < 0 && Math.abs(wingGeom.vertices[vi].z) > 20) {
      wingGeom.vertices[vi].z *= 0.4;
    }
  }
  wingGeom.computeFaceNormals();
  wingGeom.computeVertexNormals();

  var wingR = new THREE.Mesh(wingGeom, whiteMat);
  wingR.position.set(-15, -4, 28);
  wingR.castShadow = true;
  this.mesh.add(wingR);

  var wingL = new THREE.Mesh(wingGeom.clone(), whiteMat);
  wingL.position.set(-15, -4, -28);
  wingL.castShadow = true;
  this.mesh.add(wingL);

  // Wing leading edge stripe (dark)
  var wingStripeGeom = new THREE.BoxGeometry(52, 5, 4);
  var wingStripeR = new THREE.Mesh(wingStripeGeom, heatMat);
  wingStripeR.position.set(-15, -4, 48);
  wingStripeR.rotation.y = 0.4;
  this.mesh.add(wingStripeR);
  var wingStripeL = new THREE.Mesh(wingStripeGeom, heatMat);
  wingStripeL.position.set(-15, -4, -48);
  wingStripeL.rotation.y = -0.4;
  this.mesh.add(wingStripeL);

  // === VERTICAL TAIL FIN ===
  var tailGeom = new THREE.BoxGeometry(30, 35, 5, 1, 1, 1);
  // Sweep back the top
  for (var vi = 0; vi < tailGeom.vertices.length; vi++) {
    if (tailGeom.vertices[vi].y > 0) {
      tailGeom.vertices[vi].x -= 12;
    }
  }
  tailGeom.computeFaceNormals();
  tailGeom.computeVertexNormals();
  var tail = new THREE.Mesh(tailGeom, whiteMat);
  tail.position.set(-38, 22, 0);
  tail.castShadow = true;
  this.mesh.add(tail);

  // Tail tip black
  var tailTipGeom = new THREE.BoxGeometry(8, 4, 6);
  var tailTip = new THREE.Mesh(tailTipGeom, darkMat);
  tailTip.position.set(-50, 38, 0);
  this.mesh.add(tailTip);

  // === ENGINE SECTION (3 engine nozzles at the back) ===
  var engineBaseGeom = new THREE.BoxGeometry(12, 24, 26);
  var engineBase = new THREE.Mesh(engineBaseGeom, grayMat);
  engineBase.position.set(-52, 0, 0);
  this.mesh.add(engineBase);

  // 3 engine nozzles
  var nozzleMat = new THREE.MeshPhongMaterial({color:0x444444, shininess:60, shading:THREE.FlatShading});
  var nozzlePositions = [[0, 6, 0], [0, -4, 8], [0, -4, -8]];
  this.engineFlames = [];

  for (var n = 0; n < 3; n++){
    var nozzleGeom = new THREE.CylinderGeometry(4, 5, 8, 6, 1);
    nozzleGeom.applyMatrix(new THREE.Matrix4().makeRotationZ(Math.PI/2));
    var nozzle = new THREE.Mesh(nozzleGeom, nozzleMat);
    nozzle.position.set(-58 + nozzlePositions[n][0], nozzlePositions[n][1], nozzlePositions[n][2]);
    this.mesh.add(nozzle);

    // Engine flame blocks
    for (var fi = 0; fi < 3; fi++){
      var flameSize = 4 + Math.random() * 4;
      var flameGeom = new THREE.BoxGeometry(flameSize, flameSize * 0.7, flameSize * 0.7);
      var flameMat = (fi < 2) ? orangeMat.clone() : blueMat.clone();
      var flame = new THREE.Mesh(flameGeom, flameMat);
      flame.position.set(
        -63 - Math.random() * 15,
        nozzlePositions[n][1] + (-1 + Math.random() * 2) * 3,
        nozzlePositions[n][2] + (-1 + Math.random() * 2) * 3
      );
      this.mesh.add(flame);
      this.engineFlames.push({
        mesh: flame,
        baseX: flame.position.x,
        baseY: flame.position.y,
        baseZ: flame.position.z,
        speed: 0.5 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  // "USA" text block (simple colored stripe on side)
  var usaStripeGeom = new THREE.BoxGeometry(25, 3, 1);
  var usaStripeMat = new THREE.MeshPhongMaterial({color:0x1155BB, shading:THREE.FlatShading});
  var usaStripeR = new THREE.Mesh(usaStripeGeom, usaStripeMat);
  usaStripeR.position.set(10, 8, 15);
  this.mesh.add(usaStripeR);
  var usaStripeL = usaStripeR.clone();
  usaStripeL.position.z = -15;
  this.mesh.add(usaStripeL);

  // Flag stripe (red)
  var flagGeom = new THREE.BoxGeometry(12, 2, 1);
  var flagMat = new THREE.MeshPhongMaterial({color:0xCC2222, shading:THREE.FlatShading});
  var flagR = new THREE.Mesh(flagGeom, flagMat);
  flagR.position.set(10, 5, 15);
  this.mesh.add(flagR);
  var flagL = flagR.clone();
  flagL.position.z = -15;
  this.mesh.add(flagL);

  // Shadows
  this.mesh.traverse(function(child) {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Dummy propeller
  this.propeller = new THREE.Object3D();
  this.mesh.add(this.propeller);

  // Dummy pilot
  this.pilot = {
    mesh: new THREE.Object3D(),
    updateHairs: function(){}
  };
  this.mesh.add(this.pilot.mesh);
};

SpaceShuttle.prototype.updateWings = function(){
  var time = Date.now() * 0.003;
  // Animate engine flames
  for (var i = 0; i < this.engineFlames.length; i++){
    var f = this.engineFlames[i];
    var m = f.mesh;
    m.position.x = f.baseX + Math.sin(time * f.speed + f.phase) * 4 - Math.random() * 2;
    m.position.y = f.baseY + Math.sin(time * f.speed * 1.3 + f.phase) * 2;
    m.position.z = f.baseZ + Math.cos(time * f.speed * 0.9 + f.phase) * 2;
    var s = 0.6 + Math.sin(time * f.speed * 2 + f.phase) * 0.4;
    m.scale.set(s, s, s);
    m.material.emissiveIntensity = 0.2 + Math.sin(time * f.speed * 3) * 0.3;
  }
};


// -------- UFO (Level 14 vehicle) --------
var UFO = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "ufo";

  // Materials
  var silverMat = new THREE.MeshPhongMaterial({color:0xC0C0C0, shininess:80, specular:0xFFFFFF, shading:THREE.FlatShading});
  var darkSilverMat = new THREE.MeshPhongMaterial({color:0x888899, shininess:60, shading:THREE.FlatShading});
  var domeMat = new THREE.MeshPhongMaterial({
    color:0x88CCFF,
    transparent:true,
    opacity:0.55,
    shininess:100,
    specular:0xFFFFFF,
    shading:THREE.FlatShading
  });
  var glowGreenMat = new THREE.MeshPhongMaterial({
    color:0x44FF88,
    emissive:0x22CC66,
    emissiveIntensity:0.6,
    shading:THREE.FlatShading
  });
  var glowBlueMat = new THREE.MeshPhongMaterial({
    color:0x4488FF,
    emissive:0x2266DD,
    emissiveIntensity:0.5,
    shading:THREE.FlatShading
  });
  var beamMat = new THREE.MeshPhongMaterial({
    color:0x88FFCC,
    emissive:0x44DD88,
    emissiveIntensity:0.7,
    transparent:true,
    opacity:0.25,
    side:THREE.DoubleSide,
    shading:THREE.FlatShading
  });

  // === MAIN SAUCER DISC (flat cylinder - NO rotationZ so it stays horizontal) ===
  var discGeom = new THREE.CylinderGeometry(55, 50, 14, 12, 1);
  var disc = new THREE.Mesh(discGeom, silverMat);
  disc.castShadow = true;
  disc.receiveShadow = true;
  this.mesh.add(disc);

  // Upper rim (slightly wider)
  var rimTopGeom = new THREE.CylinderGeometry(58, 56, 4, 12, 1);
  var rimTop = new THREE.Mesh(rimTopGeom, darkSilverMat);
  rimTop.position.set(0, 4, 0);
  this.mesh.add(rimTop);

  // Lower rim
  var rimBotGeom = new THREE.CylinderGeometry(56, 58, 4, 12, 1);
  var rimBot = new THREE.Mesh(rimBotGeom, darkSilverMat);
  rimBot.position.set(0, -4, 0);
  this.mesh.add(rimBot);

  // === DOME (transparent cockpit on top) ===
  var domeGeom = new THREE.SphereGeometry(22, 8, 6, 0, Math.PI*2, 0, Math.PI/2);
  var dome = new THREE.Mesh(domeGeom, domeMat);
  dome.position.set(0, 7, 0);
  dome.castShadow = true;
  this.mesh.add(dome);

  // Inner dome highlight
  var innerDomeMat = new THREE.MeshPhongMaterial({
    color:0xAADDFF,
    transparent:true,
    opacity:0.2,
    shininess:120,
    specular:0xFFFFFF
  });
  var innerDome = new THREE.Mesh(new THREE.SphereGeometry(18, 8, 6, 0, Math.PI*2, 0, Math.PI/2), innerDomeMat);
  innerDome.position.set(0, 7, 0);
  this.mesh.add(innerDome);

  // === RING LIGHTS around the saucer rim (on XZ plane) ===
  this.ringLights = [];
  var lightCount = 10;
  for (var i = 0; i < lightCount; i++){
    var angle = (i / lightCount) * Math.PI * 2;
    var lightGeom = new THREE.BoxGeometry(5, 4, 5);
    var lightMat = (i % 2 === 0) ? glowGreenMat.clone() : glowBlueMat.clone();
    var light = new THREE.Mesh(lightGeom, lightMat);
    light.position.set(
      Math.cos(angle) * 52,
      0,
      Math.sin(angle) * 52
    );
    light.castShadow = false;
    this.mesh.add(light);
    this.ringLights.push({
      mesh: light,
      phase: i * (Math.PI * 2 / lightCount)
    });
  }

  // === BOTTOM BEAM (abduction beam cone) ===
  var beamGeom = new THREE.CylinderGeometry(8, 35, 50, 8, 1, true);
  this.beam = new THREE.Mesh(beamGeom, beamMat);
  this.beam.position.set(0, -32, 0);
  this.mesh.add(this.beam);

  // Bottom glow disc
  var glowDiscMat = new THREE.MeshPhongMaterial({
    color:0x66FFAA,
    emissive:0x44DD88,
    emissiveIntensity:0.5,
    transparent:true,
    opacity:0.35,
    side:THREE.DoubleSide,
    shading:THREE.FlatShading
  });
  this.bottomGlow = new THREE.Mesh(new THREE.CylinderGeometry(20, 20, 2, 10, 1), glowDiscMat);
  this.bottomGlow.position.set(0, -8, 0);
  this.mesh.add(this.bottomGlow);

  // === ANTENNA on top of dome ===
  var antenna = new THREE.Mesh(new THREE.BoxGeometry(2, 12, 2),
    new THREE.MeshPhongMaterial({color:0x999999, shading:THREE.FlatShading}));
  antenna.position.set(0, 32, 0);
  this.mesh.add(antenna);

  // Antenna tip (red blinking light)
  var tipMat = new THREE.MeshPhongMaterial({
    color:0xFF3333,
    emissive:0xFF0000,
    emissiveIntensity:0.8,
    shading:THREE.FlatShading
  });
  this.antennaTip = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), tipMat);
  this.antennaTip.position.set(0, 38, 0);
  this.mesh.add(this.antennaTip);

  // Shadows
  this.mesh.traverse(function(child) {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Dummy propeller
  this.propeller = new THREE.Object3D();
  this.mesh.add(this.propeller);

  // Dummy pilot
  this.pilot = {
    mesh: new THREE.Object3D(),
    updateHairs: function(){}
  };
  this.mesh.add(this.pilot.mesh);
};

UFO.prototype.updateWings = function(){
  var time = Date.now() * 0.003;

  // Ring lights chase pattern
  for (var i = 0; i < this.ringLights.length; i++){
    var rl = this.ringLights[i];
    var intensity = 0.3 + 0.7 * Math.max(0, Math.sin(time * 3 + rl.phase));
    rl.mesh.material.emissiveIntensity = intensity;
    var s = 0.8 + intensity * 0.4;
    rl.mesh.scale.set(s, s, s);
  }

  // Beam pulse
  if (this.beam) {
    this.beam.material.opacity = 0.15 + Math.sin(time * 2) * 0.1;
    this.beam.rotation.y = time * 0.8;
  }

  // Bottom glow pulse
  if (this.bottomGlow) {
    this.bottomGlow.material.opacity = 0.25 + Math.sin(time * 2.5) * 0.1;
    var gs = 1 + Math.sin(time * 1.5) * 0.08;
    this.bottomGlow.scale.set(gs, 1, gs);
  }

  // Antenna tip blink
  if (this.antennaTip) {
    this.antennaTip.material.emissiveIntensity = 0.4 + 0.6 * Math.max(0, Math.sin(time * 5));
  }
};
