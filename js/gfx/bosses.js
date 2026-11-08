// ===== 보스 모델 =====
// img/boss의 복셀 조각 이미지를 기준으로 절차적으로 쌓아 올린 고해상도 복셀 보스.
// 애니메이션용 부위(촉수, 아래턱, 발광부)는 기존 updateBoss()가 쓰는 이름 그대로 노출한다.
(function () {
  'use strict';

  var GFX = window.GFX;
  var M = GFX.models;
  var mix = GFX.mixHex;
  var noise = GFX.noise3;

  // 삼각형 판을 두께를 주어 찍는다 (지느러미용). 두께는 c 꼭짓점 쪽으로 얇아진다
  GFX.Voxels.prototype.plate = function (a, b, c, thick, color) {
    var R = this.res, pad = thick + 1 / R;
    function mn(i) { return Math.min(a[i], b[i], c[i]) - pad; }
    function mx(i) { return Math.max(a[i], b[i], c[i]) + pad; }
    var e0 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e1 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    var d00 = e0[0] * e0[0] + e0[1] * e0[1] + e0[2] * e0[2];
    var d01 = e0[0] * e1[0] + e0[1] * e1[1] + e0[2] * e1[2];
    var d11 = e1[0] * e1[0] + e1[1] * e1[1] + e1[2] * e1[2];
    var det = d00 * d11 - d01 * d01 || 1e-6;
    var nx = e0[1] * e1[2] - e0[2] * e1[1], ny = e0[2] * e1[0] - e0[0] * e1[2], nz = e0[0] * e1[1] - e0[1] * e1[0];
    var nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
    nx /= nl; ny /= nl; nz /= nl;
    for (var k = Math.max(0, Math.floor(mn(2) * R) - this.oz); k <= Math.min(this.d - 1, Math.ceil(mx(2) * R) - this.oz); k++) {
      var z = (k + this.oz + 0.5) / R - a[2];
      for (var j = Math.max(0, Math.floor(mn(1) * R) - this.oy); j <= Math.min(this.h - 1, Math.ceil(mx(1) * R) - this.oy); j++) {
        var y = (j + this.oy + 0.5) / R - a[1];
        for (var i = Math.max(0, Math.floor(mn(0) * R) - this.ox); i <= Math.min(this.w - 1, Math.ceil(mx(0) * R) - this.ox); i++) {
          var x = (i + this.ox + 0.5) / R - a[0];
          var d = x * nx + y * ny + z * nz;
          var px = x - d * nx, py = y - d * ny, pz = z - d * nz;
          var d20 = px * e0[0] + py * e0[1] + pz * e0[2], d21 = px * e1[0] + py * e1[1] + pz * e1[2];
          var v = (d11 * d20 - d01 * d21) / det, w = (d00 * d21 - d01 * d20) / det;
          if (v < 0 || w < 0 || v + w > 1) continue;
          if (Math.abs(d) <= thick * (1 - w * 0.82)) this.put(i, j, k, color);
        }
      }
    }
    return this;
  };

  // y축 회전체 (접시형 UFO 몸체)
  GFX.Voxels.prototype.revolve = function (rMax, bottomFn, topFn, color) {
    var R = this.res, n = Math.ceil(rMax * R);
    for (var i2 = -n; i2 <= n; i2++) {
      var x = (i2 + 0.5) / R;
      for (var k2 = -n; k2 <= n; k2++) {
        var z = (k2 + 0.5) / R;
        var r = Math.sqrt(x * x + z * z);
        if (r > rMax) continue;
        var y0 = Math.round(bottomFn(r) * R) - this.oy, y1 = Math.round(topFn(r) * R) - this.oy;
        var i = i2 - this.ox, k = k2 - this.oz;
        for (var j = Math.max(0, y0); j < Math.min(this.h, y1); j++) this.put(i, j, k, color);
      }
    }
    return this;
  };

  var MATS = null;
  function mats() {
    if (MATS) return MATS;
    MATS = {
      body: GFX.voxelMaterial({ specular: 0x3c3c3c, shininess: 48 }),
      shell: GFX.voxelMaterial({ specular: 0x777060, shininess: 88 }),
      metal: GFX.voxelMaterial({ specular: 0x8a8a90, shininess: 110 }),
      glowCyan: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.1, 7.5, 9) }),
      glowOrange: new THREE.MeshBasicMaterial({ color: new THREE.Color(9, 3.6, 0.6) }),
      glowGreen: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.3, 6.5, 1.8) })
    };
    return MATS;
  }

  function vox(voxels, material, opts) {
    var m = GFX.voxelMesh(voxels, material, opts);
    m.castShadow = true;
    return m;
  }

  // ----- 거대 암모나이트 -----
  function buildAmmonite(R) {
    var group = new THREE.Object3D();
    var v = new GFX.Voxels(-40, 66, -52, 58, -22, 22, R);
    var cx = 14, cy = 4, a0 = 1.4, growth = 0.175, thetaEnd = 5.6 * Math.PI, RIBS = 17;
    var BLACK = 0x17110a, GOLD = 0xc2931c, LIGHT = 0xf0c95c, DEEP = 0x84640f;

    function shellColor(x, y, z) {
      var dx = x - cx, dy = y - cy, rho = Math.sqrt(dx * dx + dy * dy), ph = Math.atan2(dy, dx);
      var base = thetaEnd - Math.PI / 2 - ph, best = -1, bestR = 1;
      for (var n = -4; n <= 4; n++) {
        var t2 = base + n * Math.PI * 2;
        if (t2 < 0 || t2 > thetaEnd) continue;
        var rr = a0 * Math.exp(growth * t2);
        if (Math.abs(rho - rr) <= rr * 0.7) { best = t2; bestR = rr; }
      }
      if (best < 0) return DEEP;
      var u2 = (best * RIBS / (Math.PI * 2) + (rho - bestR) / (bestR * 0.62) * 0.08) % 1;
      if (u2 < 0) u2 += 1;
      if (u2 < 0.24) return BLACK;
      var grain = noise(x * 0.5, y * 0.5, z * 0.5);
      if (Math.abs(u2 - 0.62) < 0.13) return mix(LIGHT, 0xfde39a, grain * 0.5);
      return mix(DEEP, GOLD, 0.45 + grain * 0.55);
    }

    var th = 0;
    while (th <= thetaEnd) {
      var r = a0 * Math.exp(growth * th);
      var tube = r * 0.62;
      var phi = -Math.PI / 2 + (thetaEnd - th);
      var u = (th * RIBS / (Math.PI * 2)) % 1;
      var bump = 1 + 0.06 * Math.cos(u * Math.PI * 2);
      v.ellipsoid(cx + Math.cos(phi) * r, cy + Math.sin(phi) * r, 0, tube * bump, tube * bump, tube * 0.8 * bump, shellColor);
      th += Math.min(0.11, 1.4 / (R * (r + tube)));
    }

    function flesh(x, y, z) {
      var n = noise(x * 0.42, y * 0.42, z * 0.42);
      return mix(0xd95f38, 0xf29466, n);
    }
    v.ellipsoid(-4, -31, 0, 19, 13, 12, flesh);
    v.ellipsoid(-20, -35, 0, 10, 8.5, 8, flesh);
    v.ellipsoid(3, -20, 0, 18, 7.5, 13.5, function (x, y, z) { return mix(0xa9872a, 0xd6b54a, noise(x * 0.6, y * 0.6, z * 0.6)); });

    [-1, 1].forEach(function (s) {
      v.sphere(-9, -26, s * 10.2, 4.6, 0xb58a72);
      v.sphere(-9.6, -26, s * 12, 3.4, 0xf6f0e2);
      v.sphere(-10, -26, s * 13.8, 1.9, 0x0a0a0c);
    });
    group.add(vox(v, mats().shell));

    // 촉수: 기존 애니메이션이 부위별로 회전시킨다
    function tentacle(seed) {
      var t = new GFX.Voxels(-44, 3, -13, 13, -7, 7, R);
      var steps = Math.ceil(36 * R / 1.2);
      for (var i = 0; i < steps; i++) {
        var s = i / steps;
        var bend = Math.sin(s * 5 + seed) * 5 * s;
        t.sphere(-s * 40, bend, Math.cos(s * 4 + seed) * 2 * s, 2.5 - 1.8 * s, function (x, y, z) {
          return mix(0xcf5a2f, 0xf58a45, noise(x * 0.8 + seed, y * 0.8, z * 0.8));
        });
      }
      return t;
    }
    var geos = [0.4, 2.3, 4.1].map(function (s) { return tentacle(s).toGeometry({ jitter: 0.06 }); });
    group.tentacles = [];
    for (var ti = 0; ti < 10; ti++) {
      var spread = (ti / 9 - 0.5) * 2;
      var holder = new THREE.Object3D();
      var mesh = new THREE.Mesh(geos[ti % 3], mats().body);
      mesh.scale.set(1 / R, 1 / R, 1 / R);
      holder.add(mesh);
      holder.position.set(-26, -37 + spread * 8, spread * 7);
      group.add(holder);
      group.tentacles.push(holder);
    }
    return group;
  }

  // ----- 메갈로돈 -----
  function buildMegalodon(R) {
    var group = new THREE.Object3D();
    var v = new GFX.Voxels(-58, 72, -42, 46, -36, 36, R);
    var GR = 0x7d8fa4, GR2 = 0x62758b, CREAM = 0xdcd5bb, INNER = 0x5a1a1c, GUM = 0xd98a8a, TOOTH = 0xf7f3e4;

    function shape(x) {
      var t = Math.max(0, Math.min(1, (x + 56) / 96));
      var f = Math.pow(Math.sin(Math.PI * Math.pow(t, 0.72)), 0.95);
      return { ry: 2 + 20 * f, rz: 1.5 + 16 * f, cy: 2 - t * 2 };
    }
    var HINGE = -12;
    function roofY(x) { return -1.5 + (-x - 12) * 0.045; }

    function skin(x, y, z) {
      var s = shape(x);
      if (x < HINGE + 3 && y < roofY(x) + 2.2) return INNER;
      var line = -1 + (noise(x * 0.22, z * 0.3, 2) - 0.5) * 8 + Math.sin(x * 0.12) * 1.5;
      if (x > -6 && x < 12 && Math.abs(y) < 9 && Math.abs(z) > s.rz * 0.7) {
        var slit = ((x + 6) / 3.8) % 1;
        if (slit < 0.26) return 0x445468;
      }
      if (y < line) return mix(CREAM, 0xbfb79c, noise(x * 0.6, y * 0.6, z * 0.6) * 0.5);
      return mix(GR2, GR, 0.35 + noise(x * 0.3, y * 0.45, z * 0.3) * 0.65);
    }

    var step = 0.7 / R;
    for (var x = -56; x <= 40; x += step) {
      var s = shape(x);
      v.ellipsoid(x, s.cy, 0, 1.1 / R, s.ry, s.rz, skin);
    }

    // 입 안 파내기
    v.box(-58, -34, -30, HINGE, 14, 30, function (px, py) {
      return py < roofY(px) ? null : undefined;
    });

    // 위턱 이빨과 잇몸
    var tx;
    for (tx = -51; tx <= -15; tx += 3.2) {
      var sh = shape(tx);
      [-1, 1].forEach(function (side) {
        var z = side * Math.max(1.5, sh.rz * 0.84);
        var y = roofY(tx) + 0.8;
        var nz = side * Math.max(1.5, shape(tx + 3.2).rz * 0.84);
        v.capsule(tx, y, z, 1.6, tx + 3.2, roofY(tx + 3.2) + 0.8, nz, 1.6, GUM);
        v.capsule(tx, y - 0.2, z, 2.3, tx, y - 8.2, z * 0.96, 0.3, TOOTH);
      });
    }

    // 눈
    [-1, 1].forEach(function (side) {
      var es = shape(-40);
      v.sphere(-40, 7, side * es.rz * 0.86, 2.7, 0xb9c4cf);
      v.sphere(-40.3, 7, side * (es.rz * 0.86 + 1.2), 2, 0x050507);
    });

    // 지느러미
    function fin(px, py, pz) {
      return mix(GR2, GR, noise(px * 0.2, py * 0.2, pz * 0.2));
    }
    v.plate([-12, 15, 0], [16, 14, 0], [13, 42, 0], 2.4, fin);
    v.plate([-16, -13, 12], [4, -13, 12], [8, -38, 30], 2.4, function (px, py, pz) { return py < -24 ? CREAM : fin(px, py, pz); });
    v.plate([-16, -13, -12], [4, -13, -12], [8, -38, -30], 2.4, function (px, py, pz) { return py < -24 ? CREAM : fin(px, py, pz); });
    v.plate([18, -13, 0], [30, -11, 0], [30, -24, 0], 1.6, fin);
    v.plate([29, 6, 0], [43, -6, 0], [70, 40, 0], 3.4, fin);
    v.plate([42, 5, 0], [30, -5, 0], [62, -30, 0], 3.4, fin);
    group.add(vox(v, mats().body));

    // 아래턱 (기본으로 벌어진 상태에서 애니메이션이 더 벌린다)
    var jaw = new GFX.Voxels(-44, 4, -20, 10, -24, 24, R);
    function jawW(px) {
      var t = Math.max(0, Math.min(1, -px / 40));
      return Math.max(2, 16.5 * Math.sqrt(1 - t * t * 0.9));
    }
    for (var jx = -40; jx <= 2; jx += step) {
      var w = jawW(jx), depth = 5 + w * 0.56;
      jaw.ellipsoid(jx, 0, 0, 1.1 / R, depth, w, function (px, py, pz) {
        if (py > -2.2) return Math.abs(pz) < jawW(px) * 0.76 ? INNER : mix(CREAM, 0xfbf3da, 0.4);
        return mix(CREAM, 0xc5bda1, noise(px * 0.5, py * 0.5, pz * 0.5));
      });
    }
    jaw.box(-44, 1, -24, 4, 10, 24, function () { return null; });
    for (tx = -37; tx <= -2; tx += 3.2) {
      var jw = jawW(tx) * 0.86;
      var jn = jawW(tx + 3.2) * 0.86;
      [-1, 1].forEach(function (side) {
        jaw.capsule(tx, 0.9, side * jw, 1.4, tx + 3.2, 0.9, side * jn, 1.4, GUM);
        jaw.capsule(tx, 0.9, side * jw, 2, tx, 8.4, side * jw * 0.98, 0.3, TOOTH);
      });
    }
    var jawGroup = new THREE.Object3D();
    jawGroup.position.set(HINGE, -2.5, 0);
    var jawMesh = vox(jaw, mats().body);
    var jawPivot = new THREE.Object3D();
    jawPivot.rotation.z = 0.34;
    jawPivot.add(jawMesh);
    jawGroup.add(jawPivot);
    group.add(jawGroup);
    group.lowerJaw = jawGroup;
    return group;
  }

  // ----- 티라노사우루스 -----
  function buildTrex(R) {
    var group = new THREE.Object3D();
    var k = 0.62;
    var v = new GFX.Voxels(-54, 66, -44, 38, -23, 23, R);
    var INNER = 0x8c3f3c, GUM = 0xb86a60, TOOTH = 0xf0ebd2, CLAW = 0x55524c;

    function skin(x, y, z) {
      var n = noise(x * 0.15, y * 0.15, z * 0.15);
      var fine = noise(x * 0.7, y * 0.7, z * 0.7);
      var stripe = Math.sin(x * 0.68 + n * 6 + y * 0.18);
      var c = mix(0x46461c, 0x74702e, n * 0.6 + fine * 0.4);
      if (stripe > 0.42) c = mix(c, 0x2c2610, 0.78);
      else if (stripe < -0.55) c = mix(c, 0x7a5a2c, 0.65);
      var belly = y < -2 && Math.abs(z) < 9 ? Math.min(1, (-2 - y) / 12) : 0;
      return mix(c, 0xa59566, belly * 0.8);
    }

    var MOUTH_BACK = -30;
    function mouthY(ux) { return 31 + (ux - MOUTH_BACK) * -0.05; }

    var baseSkin = skin;
    skin = function (x, y, z) {
      var ux = x / k, uy = y / k;
      if (ux < MOUTH_BACK + 2 && uy < mouthY(ux) + 2.4 && uy > 24) return INNER;
      return baseSkin(x, y, z);
    };

    function E(cx, cy, cz, rx, ry, rz, c) { v.ellipsoid(cx * k, cy * k, cz * k, rx * k, ry * k, rz * k, c || skin); }
    function C(ax, ay, az, ra, bx, by, bz, rb, c) { v.capsule(ax * k, ay * k, az * k, ra * k, bx * k, by * k, bz * k, rb * k, c || skin); }

    // 몸통과 목
    E(8, 2, 0, 31, 22, 18);
    E(27, 7, 0, 19, 19, 16);
    E(-11, 6, 0, 19, 21, 16);
    C(-16, 17, 0, 15, -30, 32, 0, 13);
    // 꼬리
    C(36, 8, 0, 16, 56, 12, 0, 10.5);
    C(56, 12, 0, 10.5, 78, 10, 0, 5.8);
    C(78, 10, 0, 5.8, 102, 1, 0, 1.2);
    // 머리 (윗턱)
    E(-40, 40, 0, 20, 13, 13.5);
    C(-44, 39, 0, 12, -72, 36, 0, 8);
    E(-42, 51, 6.5, 7, 3.4, 3.6);
    E(-42, 51, -6.5, 7, 3.4, 3.6);

    [-1, 1].forEach(function (s) {
      // 다리
      C(20, -6, s * 15, 15, 28, -28, s * 17, 10);
      C(28, -28, s * 17, 9.4, 18, -50, s * 17, 6);
      C(18, -50, s * 17, 6.2, 8, -58, s * 17, 5);
      [-4.2, 0, 4.2].forEach(function (off) {
        C(8, -58, s * 17 + off, 3.2, -7, -60, s * 17 + off * 1.5, 2.3);
        C(-7, -60, s * 17 + off * 1.5, 2.3, -13, -62, s * 17 + off * 1.6, 0.6, CLAW);
      });
      // 앞발
      C(-17, -3, s * 15, 3.8, -25, -13, s * 16, 2.6);
      C(-25, -13, s * 16, 2.6, -31, -13, s * 16, 1.7);
      C(-31, -13, s * 16, 1.7, -35, -16, s * 16, 0.5, CLAW);
      // 눈
      v.sphere(-46 * k, 47 * k, s * 11.8 * k, 2.3 * k, 0xd98212);
      v.sphere(-47 * k, 47 * k, s * 13.4 * k, 1.1 * k, 0x050505);
    });

    // 입 안 파내기
    v.box(-48, 22 * k, -16, MOUTH_BACK * k, 34, 16, function (px, py) {
      return py < mouthY(px / k) * k ? null : undefined;
    });

    // 윗니
    for (var tx = -71; tx <= -33; tx += 2.6) {
      var half = 6.6 + (tx + 71) / 38 * 5;
      var row = Math.round((tx + 71) / 2.6);
      [-1, 1].forEach(function (s) {
        var y0 = mouthY(tx) * k + 0.5, y1 = mouthY(tx + 2.6) * k + 0.5;
        var nextHalf = 6.6 + (tx + 2.6 + 71) / 38 * 5;
        v.capsule(tx * k, y0, s * half * k, 0.9, (tx + 2.6) * k, y1, s * nextHalf * k, 0.9, GUM);
        if ((row + (s > 0 ? 0 : 1)) % 2 === 0) v.capsule(tx * k, y0, s * half * k, 1.05, tx * k, y0 - 3.8, s * half * k, 0.25, TOOTH);
      });
    }
    group.add(vox(v, mats().body));

    // 아래턱 (기본으로 벌어진 상태에서 애니메이션이 더 벌린다)
    var jaw = new GFX.Voxels(-30, 3, -13, 7, -13, 13, R);
    function jawHalf(px) { var t = -px / 25; return 8.6 - t * 3.3; }
    for (var jx = -25; jx <= 1; jx += 0.7 / R) {
      var hw = jawHalf(jx);
      jaw.ellipsoid(jx, -2.2, 0, 1.1 / R, 5.2, hw, function (px, py, pz) {
        if (py > -0.8) return Math.abs(pz) < jawHalf(px) * 0.74 ? INNER : baseSkin(px, py + 20, pz);
        return py < -4.6 ? mix(0x9a8c60, 0xb7a877, noise(px, py, pz)) : baseSkin(px, py + 20, pz);
      });
    }
    jaw.box(-30, 0.9, -13, 3, 7, 13, function () { return null; });
    for (var ltx = -22.5; ltx <= -2; ltx += 1.8) {
      var lw = jawHalf(ltx) * 0.84, ln = jawHalf(ltx + 1.8) * 0.84;
      var lrow = Math.round((ltx + 22.5) / 1.8);
      [-1, 1].forEach(function (s) {
        jaw.capsule(ltx, 0.8, s * lw, 0.75, ltx + 1.8, 0.8, s * ln, 0.75, GUM);
        if ((lrow + (s > 0 ? 0 : 1)) % 2 === 0) jaw.capsule(ltx, 0.8, s * lw, 1, ltx, 4.2, s * lw, 0.22, TOOTH);
      });
    }
    var jawGroup = new THREE.Object3D();
    jawGroup.position.set(MOUTH_BACK * k, 25 * k, 0);
    var jawPivot = new THREE.Object3D();
    jawPivot.rotation.z = 0.36;
    jawPivot.add(vox(jaw, mats().body));
    jawGroup.add(jawPivot);
    group.add(jawGroup);
    group.lowerJaw = jawGroup;
    return group;
  }

  // ----- UFO -----
  function buildUfo(R) {
    var group = new THREE.Object3D();
    var Rmax = 50;
    var v = new GFX.Voxels(-54, 54, -34, 34, -54, 54, R);
    var HULL = 0x8a8a8e, HULL2 = 0x6c6c72, LIGHT = 0xb4b2ac, BAND = 0xc9783f, BAND2 = 0xa45b2c, DARK = 0x2b2d33;

    function top(r) { var t = r / Rmax; return 2 + 11 * Math.pow(Math.max(0, 1 - t * t), 0.75); }
    function bottom(r) { var t = r / Rmax; return -1 - 10 * Math.pow(Math.max(0, 1 - Math.pow(t, 1.5)), 0.72); }

    function hull(x, y, z) {
      var r = Math.sqrt(x * x + z * z), a = Math.atan2(z, x);
      var sector = ((a / (Math.PI * 2) * 8) % 1 + 1) % 1;
      if (Math.abs(sector - 0.5) < 0.09 && r > 17) return mix(BAND2, BAND, noise(x * 0.7, y * 0.7, z * 0.7));
      if (r > 46.5 && Math.abs(y - 0.5) < 1.2) return DARK;
      var ring = (r / 7) % 1;
      if (ring < 0.09) return mix(HULL2, DARK, 0.5);
      var seam = ((a / (Math.PI * 2) * 32) % 1 + 1) % 1;
      if (seam < 0.06) return HULL2;
      var n = noise(x * 0.55, y * 0.55, z * 0.55);
      return n > 0.72 ? LIGHT : mix(HULL2, HULL, n * 1.4);
    }
    v.revolve(Rmax, bottom, top, hull);

    // 돔과 조종석 창
    v.ellipsoid(0, 11, 0, 23, 20, 23, function (x, y, z) {
      var a = Math.atan2(z, x);
      var band = Math.abs(y - 19) < 1.4 || Math.abs(y - 13.5) < 0.9;
      if (band) return BAND;
      var seam = ((a / (Math.PI * 2) * 20) % 1 + 1) % 1;
      if (seam < 0.08) return HULL2;
      return mix(HULL2, LIGHT, noise(x * 0.5, y * 0.5, z * 0.5));
    });
    v.box(-14, 13, 15, 14, 24, 26, function (x, y, z) {
      var inside = x * x + (y - 11) * (y - 11) * 1.32 + z * z < 23 * 23 - 2;
      return inside ? (z > 17 ? null : 0x0f1a22) : undefined;
    });

    // 외계인 승무원
    [[-8, 0x9fb36a], [-1.5, 0xb9a98a], [5.5, 0x7fa6b8], [10.5, 0x8ca45c]].forEach(function (a, i) {
      v.ellipsoid(a[0], 17.2 + (i % 2) * 0.6, 17.2, 2.2, 2.8, 2, a[1]);
      v.sphere(a[0] - 0.9, 17.8, 19, 0.65, 0x05060a);
      v.sphere(a[0] + 0.9, 17.8, 19, 0.65, 0x05060a);
      v.ellipsoid(a[0], 13.8, 17, 2.4, 1.8, 1.8, i % 2 ? 0xc26a35 : 0x8f4a2d);
    });
    group.add(vox(v, mats().metal));

    // 하부 포드
    var pods = new GFX.Voxels(-54, 54, -36, 2, -32, 32, R);
    var podXs = [-34, -17, 0, 17, 34];
    podXs.forEach(function (px, i) {
      var pz = (i % 2 ? 1 : -1) * 6;
      pods.capsule(px, -7, pz, 7.2, px, -24, pz, 1.6, function (x, y, z) {
        if (Math.abs(y + 14) < 1 || Math.abs(y + 19) < 0.8) return BAND;
        return mix(0x4c4a4c, 0x7a766f, noise(x * 0.9, y * 0.9, z * 0.9));
      });
    });
    group.add(vox(pods, mats().metal));

    // 발광부: updateBoss()가 부위별로 크기를 맥동시킨다
    var ringVox = new GFX.Voxels(-9, 9, -3, 3, -9, 9, R);
    ringVox.revolve(8, function () { return -1.1; }, function () { return 1.1; }, function (x, y, z) {
      return Math.sqrt(x * x + z * z) > 5.8 ? 0xffffff : null;
    });
    var ringGeo = ringVox.toGeometry({ jitter: 0, wideAO: false });
    group.glowParts = [];
    podXs.forEach(function (px, i) {
      var holder = new THREE.Object3D();
      holder.position.set(px, -16.5, (i % 2 ? 1 : -1) * 6);
      var m = new THREE.Mesh(ringGeo, i % 2 ? mats().glowOrange : mats().glowCyan);
      m.scale.set(1 / R, 1 / R, 1 / R);
      holder.add(m);
      group.add(holder);
      group.glowParts.push(holder);
    });

    // 테두리 창문 불빛
    var lights = new GFX.Voxels(-54, 54, -5, 5, -54, 54, R);
    for (var a = 0; a < 44; a++) {
      var ang = a / 44 * Math.PI * 2;
      lights.sphere(Math.cos(ang) * 47.5, 1.6, Math.sin(ang) * 47.5, 0.9, 0xffffff);
    }
    group.add(new THREE.Mesh(lights.toGeometry({ jitter: 0, wideAO: false }), mats().glowCyan));
    group.children[group.children.length - 1].scale.set(1 / R, 1 / R, 1 / R);
    return group;
  }

  var BUILDERS = [buildAmmonite, buildMegalodon, buildTrex, buildUfo];
  var cache = [];

  function bossRes() { return 1.05 / GFX.q.voxel; }

  M.createBoss = function (type) {
    var t = type % 4;
    if (!cache[t]) cache[t] = BUILDERS[t](bossRes());
    return cache[t];
  };

  // 첫 보스 등장 때 끊기지 않도록 시작 화면 동안 나눠서 미리 만든다
  M.prebuildBosses = function () {
    var next = 0;
    function step() {
      if (next >= BUILDERS.length) return;
      M.createBoss(next++);
      setTimeout(step, 120);
    }
    setTimeout(step, 400);
  };

})();
