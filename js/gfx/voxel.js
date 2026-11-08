// ===== 복셀 조형 도구와 캐릭터 마감 처리 =====
// Voxels: 구/캡슐/상자를 쌓아 고해상도 복셀 모델을 만들고, 보이는 면만 골라
//         틈새 그림자(AO)까지 구워 넣은 지오메트리로 변환한다.
// polish: 기존 박스 조립 캐릭터의 모서리를 깎고 접합부 그림자를 구워 재질을 끌어올린다.
(function () {
  'use strict';

  var GFX = window.GFX;

  function hash3(x, y, z) {
    var h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
    h = (h ^ (h >>> 13)) * 1274126177 | 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  }
  GFX.hash3 = hash3;

  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(t) { return t * t * (3 - 2 * t); }

  // 값 노이즈 (무늬용)
  GFX.noise3 = function (x, y, z) {
    var xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    var fx = smooth(x - xi), fy = smooth(y - yi), fz = smooth(z - zi);
    function c(dx, dy, dz) { return hash3(xi + dx, yi + dy, zi + dz); }
    return lerp(
      lerp(lerp(c(0, 0, 0), c(1, 0, 0), fx), lerp(c(0, 1, 0), c(1, 1, 0), fx), fy),
      lerp(lerp(c(0, 0, 1), c(1, 0, 1), fx), lerp(c(0, 1, 1), c(1, 1, 1), fx), fy),
      fz
    );
  };

  // 색상 혼합 (0xRRGGBB)
  GFX.mixHex = function (a, b, t) {
    var ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
    var br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
    return (Math.round(lerp(ar, br, t)) << 16) | (Math.round(lerp(ag, bg, t)) << 8) | Math.round(lerp(ab, bb, t));
  };

  var FILLED = 0x1000000;

  // 좌표는 모델 단위로 받고, res(단위당 복셀 수)에 맞춰 격자에 찍는다
  function Voxels(minX, maxX, minY, maxY, minZ, maxZ, res) {
    this.res = res;
    this.ox = Math.floor(minX * res) - 2;
    this.oy = Math.floor(minY * res) - 2;
    this.oz = Math.floor(minZ * res) - 2;
    this.w = Math.ceil((maxX - minX) * res) + 5;
    this.h = Math.ceil((maxY - minY) * res) + 5;
    this.d = Math.ceil((maxZ - minZ) * res) + 5;
    this.cells = new Int32Array(this.w * this.h * this.d);
  }
  GFX.Voxels = Voxels;

  Voxels.prototype.index = function (i, j, k) { return i + this.w * (j + this.h * k); };

  Voxels.prototype.filled = function (i, j, k) {
    if (i < 0 || j < 0 || k < 0 || i >= this.w || j >= this.h || k >= this.d) return 0;
    return this.cells[i + this.w * (j + this.h * k)] !== 0 ? 1 : 0;
  };

  // color: 0xRRGGBB, null(지우기), 또는 function(x,y,z) -> 색/null  (x,y,z는 모델 단위)
  Voxels.prototype.put = function (i, j, k, color) {
    if (i < 0 || j < 0 || k < 0 || i >= this.w || j >= this.h || k >= this.d) return;
    var c = color;
    if (typeof color === 'function') {
      c = color((i + this.ox + 0.5) / this.res, (j + this.oy + 0.5) / this.res, (k + this.oz + 0.5) / this.res);
      if (c === undefined) return;
    }
    this.cells[i + this.w * (j + this.h * k)] = c === null ? 0 : (c | FILLED);
  };

  Voxels.prototype.ellipsoid = function (cx, cy, cz, rx, ry, rz, color) {
    var R = this.res;
    var x0 = Math.floor((cx - rx) * R) - this.ox, x1 = Math.ceil((cx + rx) * R) - this.ox;
    var y0 = Math.floor((cy - ry) * R) - this.oy, y1 = Math.ceil((cy + ry) * R) - this.oy;
    var z0 = Math.floor((cz - rz) * R) - this.oz, z1 = Math.ceil((cz + rz) * R) - this.oz;
    var irx = 1 / (rx * R), iry = 1 / (ry * R), irz = 1 / (rz * R);
    var ccx = cx * R - this.ox - 0.5, ccy = cy * R - this.oy - 0.5, ccz = cz * R - this.oz - 0.5;
    for (var k = Math.max(0, z0); k <= Math.min(this.d - 1, z1); k++) {
      var dz = (k - ccz) * irz;
      for (var j = Math.max(0, y0); j <= Math.min(this.h - 1, y1); j++) {
        var dy = (j - ccy) * iry;
        for (var i = Math.max(0, x0); i <= Math.min(this.w - 1, x1); i++) {
          var dx = (i - ccx) * irx;
          if (dx * dx + dy * dy + dz * dz <= 1) this.put(i, j, k, color);
        }
      }
    }
    return this;
  };

  Voxels.prototype.sphere = function (cx, cy, cz, r, color) {
    return this.ellipsoid(cx, cy, cz, r, r, r, color);
  };

  // 양 끝 반지름이 다른 캡슐
  Voxels.prototype.capsule = function (ax, ay, az, ra, bx, by, bz, rb, color) {
    var R = this.res, rMax = Math.max(ra, rb);
    var x0 = Math.floor((Math.min(ax, bx) - rMax) * R) - this.ox, x1 = Math.ceil((Math.max(ax, bx) + rMax) * R) - this.ox;
    var y0 = Math.floor((Math.min(ay, by) - rMax) * R) - this.oy, y1 = Math.ceil((Math.max(ay, by) + rMax) * R) - this.oy;
    var z0 = Math.floor((Math.min(az, bz) - rMax) * R) - this.oz, z1 = Math.ceil((Math.max(az, bz) + rMax) * R) - this.oz;
    var ux = bx - ax, uy = by - ay, uz = bz - az;
    var uu = ux * ux + uy * uy + uz * uz || 1e-6;
    for (var k = Math.max(0, z0); k <= Math.min(this.d - 1, z1); k++) {
      var pz = (k + this.oz + 0.5) / R - az;
      for (var j = Math.max(0, y0); j <= Math.min(this.h - 1, y1); j++) {
        var py = (j + this.oy + 0.5) / R - ay;
        for (var i = Math.max(0, x0); i <= Math.min(this.w - 1, x1); i++) {
          var px = (i + this.ox + 0.5) / R - ax;
          var t = (px * ux + py * uy + pz * uz) / uu;
          if (t < 0) t = 0; else if (t > 1) t = 1;
          var qx = px - ux * t, qy = py - uy * t, qz = pz - uz * t;
          var r = ra + (rb - ra) * t;
          if (qx * qx + qy * qy + qz * qz <= r * r) this.put(i, j, k, color);
        }
      }
    }
    return this;
  };

  Voxels.prototype.box = function (x0, y0, z0, x1, y1, z1, color) {
    var R = this.res;
    var ia = Math.round(x0 * R) - this.ox, ib = Math.round(x1 * R) - this.ox;
    var ja = Math.round(y0 * R) - this.oy, jb = Math.round(y1 * R) - this.oy;
    var ka = Math.round(z0 * R) - this.oz, kb = Math.round(z1 * R) - this.oz;
    for (var k = Math.max(0, ka); k < Math.min(this.d, kb); k++)
      for (var j = Math.max(0, ja); j < Math.min(this.h, jb); j++)
        for (var i = Math.max(0, ia); i < Math.min(this.w, ib); i++) this.put(i, j, k, color);
    return this;
  };

  // 2D 윤곽(x-y)을 z 두께로 세운다. fn(x,y)가 z 반두께(없으면 0 이하)를 돌려준다
  Voxels.prototype.extrude = function (x0, x1, y0, y1, fn, color) {
    var R = this.res;
    for (var j = Math.max(0, Math.floor(y0 * R) - this.oy); j <= Math.min(this.h - 1, Math.ceil(y1 * R) - this.oy); j++) {
      var y = (j + this.oy + 0.5) / R;
      for (var i = Math.max(0, Math.floor(x0 * R) - this.ox); i <= Math.min(this.w - 1, Math.ceil(x1 * R) - this.ox); i++) {
        var x = (i + this.ox + 0.5) / R;
        var half = fn(x, y);
        if (half <= 0) continue;
        var k0 = Math.floor(-half * R) - this.oz, k1 = Math.ceil(half * R) - this.oz;
        for (var k = Math.max(0, k0); k < Math.min(this.d, k1); k++) this.put(i, j, k, color);
      }
    }
    return this;
  };

  var LIN = new Float32Array(256);
  for (var li = 0; li < 256; li++) LIN[li] = Math.pow(li / 255, 2.2);

  var AO_CURVE = [0.42, 0.62, 0.82, 1.0];

  // 보이는 면만 메시로 변환. 격자 좌표 단위라서 메시를 1/res 로 축소해 사용한다.
  Voxels.prototype.toGeometry = function (opts) {
    opts = opts || {};
    var jitter = opts.jitter === undefined ? 0.07 : opts.jitter;
    var wideAO = opts.wideAO !== false;
    var w = this.w, h = this.h, d = this.d, cells = this.cells;
    var i, j, k, a, n = 0;
    var DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

    for (k = 0; k < d; k++) for (j = 0; j < h; j++) for (i = 0; i < w; i++) {
      if (cells[i + w * (j + h * k)] === 0) continue;
      for (a = 0; a < 6; a++) if (!this.filled(i + DIRS[a][0], j + DIRS[a][1], k + DIRS[a][2])) n++;
    }

    var pos = new Float32Array(n * 18), nor = new Float32Array(n * 18), col = new Float32Array(n * 18);
    var p = 0;
    var ox = this.ox, oy = this.oy, oz = this.oz;
    var cu = [0, 1, 1, 0], cv = [0, 0, 1, 1];
    var q = [0, 0, 0], qa = [0, 0, 0], ao = [0, 0, 0, 0];

    for (k = 0; k < d; k++) for (j = 0; j < h; j++) for (i = 0; i < w; i++) {
      var cell = cells[i + w * (j + h * k)];
      if (cell === 0) continue;
      var r0 = LIN[(cell >> 16) & 255], g0 = LIN[(cell >> 8) & 255], b0 = LIN[cell & 255];
      var tint = 1 + (hash3(i, j, k) - 0.5) * jitter * 2;

      for (a = 0; a < 6; a++) {
        var dx = DIRS[a][0], dy = DIRS[a][1], dz = DIRS[a][2];
        if (this.filled(i + dx, j + dy, k + dz)) continue;
        var axis = dx !== 0 ? 0 : (dy !== 0 ? 1 : 2);
        var sign = dx + dy + dz;
        var u = (axis + 1) % 3, v = (axis + 2) % 3;
        var c;

        for (c = 0; c < 4; c++) {
          var su = cu[c] ? 1 : -1, sv = cv[c] ? 1 : -1;
          qa[axis] = sign; qa[u] = su; qa[v] = 0;
          var s1 = this.filled(i + qa[0], j + qa[1], k + qa[2]);
          qa[u] = 0; qa[v] = sv;
          var s2 = this.filled(i + qa[0], j + qa[1], k + qa[2]);
          qa[u] = su; qa[v] = sv;
          var s3 = this.filled(i + qa[0], j + qa[1], k + qa[2]);
          ao[c] = (s1 && s2) ? 0 : 3 - (s1 + s2 + s3);
        }

        // 넓은 범위의 틈새 그림자: 면 위쪽 공간이 얼마나 막혀 있는지 본다
        var open = 1;
        if (wideAO) {
          var hit = 0, tot = 0;
          for (var l = 1; l <= 3; l++) {
            var rad = l + 1;
            for (var du = -rad; du <= rad; du += 2) for (var dv = -rad; dv <= rad; dv += 2) {
              qa[axis] = sign * l; qa[u] = du; qa[v] = dv;
              hit += this.filled(i + qa[0], j + qa[1], k + qa[2]);
              tot++;
            }
          }
          open = 1 - Math.min(1, hit / tot * 1.9) * 0.62;
        }

        var faceAxisLight = axis === 1 ? (sign > 0 ? 1 : 0.86) : 0.95;
        var order = (ao[0] + ao[2] > ao[1] + ao[3]) ? [0, 1, 2, 0, 2, 3] : [1, 2, 3, 1, 3, 0];
        if (sign < 0) order = [order[0], order[2], order[1], order[3], order[5], order[4]];

        for (var t = 0; t < 6; t++) {
          var cc = order[t];
          q[axis] = (axis === 0 ? i : axis === 1 ? j : k) + (sign > 0 ? 1 : 0);
          q[u] = (u === 0 ? i : u === 1 ? j : k) + cu[cc];
          q[v] = (v === 0 ? i : v === 1 ? j : k) + cv[cc];
          pos[p] = q[0] + ox; pos[p + 1] = q[1] + oy; pos[p + 2] = q[2] + oz;
          nor[p] = dx; nor[p + 1] = dy; nor[p + 2] = dz;
          var shade = tint * AO_CURVE[ao[cc]] * open * faceAxisLight;
          col[p] = r0 * shade; col[p + 1] = g0 * shade; col[p + 2] = b0 * shade;
          p += 3;
        }
      }
    }

    var g = new THREE.BufferGeometry();
    g.addAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.addAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.addAttribute('color', new THREE.BufferAttribute(col, 3));
    g.computeBoundingSphere();
    return g;
  };

  // 복셀 전용 재질: 줄눈 표현 + 정점 색(AO 포함)
  GFX.voxelMaterial = function (params) {
    var m = new THREE.MeshPhongMaterial({
      color: 0xffffff, vertexColors: THREE.VertexColors,
      specular: (params && params.specular) || 0x222222,
      shininess: (params && params.shininess) || 34,
      shading: THREE.SmoothShading
    });
    if (params && params.emissive) m.emissive.setHex(params.emissive);
    m.defines = { GFX_VOXEL: 1 };
    m.extensions = { derivatives: true };
    return m;
  };

  GFX.voxelMesh = function (voxels, material, opts) {
    var mesh = new THREE.Mesh(voxels.toGeometry(opts), material);
    var s = 1 / voxels.res;
    mesh.scale.set(s, s, s);
    return mesh;
  };

  // ----- 박스 조립 캐릭터 마감 처리 -----

  // 8개 꼭짓점 상자를 모서리가 깎인 상자로 변환한다 (면 중앙은 평평, 모서리에서만 법선이 부드럽게 꺾임)
  function bevelBox(geo) {
    var V = geo.vertices, F = geo.faces, i, j;
    var quads = [];
    for (i = 0; i + 1 < F.length; i += 2) {
      quads.push([F[i].a, F[i].b, F[i + 1].b, F[i + 1].c]);
    }

    var shortest = Infinity;
    quads.forEach(function (qd) {
      for (var e = 0; e < 4; e++) {
        var L = V[qd[e]].distanceTo(V[qd[(e + 1) % 4]]);
        if (L > 0.001 && L < shortest) shortest = L;
      }
    });
    var b = Math.max(0.12, Math.min(2.2, shortest * 0.16));

    var pos = [], nor = [], idx = [];
    var edgeMap = {}, cornerMap = {};
    var tmpE1 = new THREE.Vector3(), tmpE2 = new THREE.Vector3();

    quads.forEach(function (qd, qi) {
      var a = V[qd[0]], c = V[qd[2]];
      var nrm = new THREE.Vector3().crossVectors(
        new THREE.Vector3().subVectors(V[qd[1]], a),
        new THREE.Vector3().subVectors(c, a)
      );
      if (nrm.lengthSq() < 1e-10) nrm.crossVectors(new THREE.Vector3().subVectors(c, a), new THREE.Vector3().subVectors(V[qd[3]], a));
      nrm.normalize();

      var base = pos.length / 3;
      for (j = 0; j < 4; j++) {
        var v = V[qd[j]];
        tmpE1.subVectors(V[qd[(j + 1) % 4]], v);
        tmpE2.subVectors(V[qd[(j + 3) % 4]], v);
        var l1 = tmpE1.length(), l2 = tmpE2.length();
        if (l1 > 0.0001) tmpE1.multiplyScalar(Math.min(b, l1 * 0.45) / l1); else tmpE1.set(0, 0, 0);
        if (l2 > 0.0001) tmpE2.multiplyScalar(Math.min(b, l2 * 0.45) / l2); else tmpE2.set(0, 0, 0);
        pos.push(v.x + tmpE1.x + tmpE2.x, v.y + tmpE1.y + tmpE2.y, v.z + tmpE1.z + tmpE2.z);
        nor.push(nrm.x, nrm.y, nrm.z);
        (cornerMap[qd[j]] = cornerMap[qd[j]] || []).push(base + j);
      }
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);

      for (j = 0; j < 4; j++) {
        var from = qd[j], to = qd[(j + 1) % 4];
        var key = from < to ? from + '_' + to : to + '_' + from;
        var other = edgeMap[key];
        if (other) {
          // 인접 면과 다리를 놓는 모서리 면
          idx.push(base + j, other.a, other.b, base + j, other.b, base + (j + 1) % 4);
        } else {
          edgeMap[key] = { a: base + (j + 1) % 4, b: base + j };
        }
      }
    });

    // 꼭짓점 삼각형
    var P = pos;
    Object.keys(cornerMap).forEach(function (key) {
      var list = cornerMap[key];
      if (list.length !== 3) return;
      var vtx = V[+key];
      var a = list[0], b2 = list[1], c = list[2];
      var ax = P[a * 3], ay = P[a * 3 + 1], az = P[a * 3 + 2];
      var ux = P[b2 * 3] - ax, uy = P[b2 * 3 + 1] - ay, uz = P[b2 * 3 + 2] - az;
      var vx = P[c * 3] - ax, vy = P[c * 3 + 1] - ay, vz = P[c * 3 + 2] - az;
      var cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
      var ox = nor[a * 3] + nor[b2 * 3] + nor[c * 3], oy = nor[a * 3 + 1] + nor[b2 * 3 + 1] + nor[c * 3 + 1], oz = nor[a * 3 + 2] + nor[b2 * 3 + 2] + nor[c * 3 + 2];
      if (cx * ox + cy * oy + cz * oz > 0) idx.push(a, b2, c); else idx.push(a, c, b2);
    });

    return { pos: pos, nor: nor, idx: idx };
  }

  function isSimpleBox(geo) {
    return geo instanceof THREE.Geometry && geo.vertices.length === 8 && geo.faces.length === 12;
  }

  // 일반 지오메트리: 일정 각도 이내의 면끼리만 법선을 부드럽게 잇는다
  function smoothGeometry(geo, creaseDeg) {
    var cosLimit = Math.cos((creaseDeg || 48) * Math.PI / 180);
    var V = geo.vertices, F = geo.faces;
    var adj = {};
    var faceN = F.map(function (f, i) {
      var n = new THREE.Vector3().crossVectors(
        new THREE.Vector3().subVectors(V[f.b], V[f.a]),
        new THREE.Vector3().subVectors(V[f.c], V[f.a])
      );
      var area = n.length();
      if (area > 1e-9) n.multiplyScalar(1 / area);
      [f.a, f.b, f.c].forEach(function (v) { (adj[v] = adj[v] || []).push(i); });
      return n;
    });
    var pos = [], nor = [], idx = [];
    F.forEach(function (f, i) {
      var base = pos.length / 3;
      [f.a, f.b, f.c].forEach(function (v) {
        var sum = new THREE.Vector3();
        adj[v].forEach(function (o) { if (faceN[o].dot(faceN[i]) >= cosLimit) sum.add(faceN[o]); });
        sum.normalize();
        pos.push(V[v].x, V[v].y, V[v].z);
        nor.push(sum.x, sum.y, sum.z);
      });
      idx.push(base, base + 1, base + 2);
    });
    return { pos: pos, nor: nor, idx: idx };
  }

  function toBuffer(data, ao) {
    var g = new THREE.BufferGeometry();
    var n = data.pos.length / 3;
    var col = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) {
      var a = ao ? ao[i] : 1;
      col[i * 3] = a; col[i * 3 + 1] = a; col[i * 3 + 2] = a;
    }
    g.addAttribute('position', new THREE.BufferAttribute(new Float32Array(data.pos), 3));
    g.addAttribute('normal', new THREE.BufferAttribute(new Float32Array(data.nor), 3));
    g.addAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setIndex(new THREE.BufferAttribute(n > 65000 ? new Uint32Array(data.idx) : new Uint16Array(data.idx), 1));
    g.computeBoundingSphere();
    return g;
  }

  // 반구 샘플 방향 (캐릭터 접합부 그림자 계산용)
  var RAY_DIRS = (function () {
    var out = [], n = 18, golden = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < n; i++) {
      var y = 1 - (i + 0.5) / n;
      var r = Math.sqrt(1 - y * y), a = i * golden;
      out.push([Math.cos(a) * r, y, Math.sin(a) * r]);
    }
    return out;
  })();

  function rayHitsBox(o, d, box, maxT) {
    // 레이를 상자의 지역 좌표로 옮겨 슬랩 테스트
    var m = box.inv;
    var ox = m[0] * o[0] + m[4] * o[1] + m[8] * o[2] + m[12];
    var oy = m[1] * o[0] + m[5] * o[1] + m[9] * o[2] + m[13];
    var oz = m[2] * o[0] + m[6] * o[1] + m[10] * o[2] + m[14];
    var dx = m[0] * d[0] + m[4] * d[1] + m[8] * d[2];
    var dy = m[1] * d[0] + m[5] * d[1] + m[9] * d[2];
    var dz = m[2] * d[0] + m[6] * d[1] + m[10] * d[2];
    var t0 = 0.0, t1 = maxT;
    var axes = [[ox, dx, box.min.x, box.max.x], [oy, dy, box.min.y, box.max.y], [oz, dz, box.min.z, box.max.z]];
    for (var a = 0; a < 3; a++) {
      var ax = axes[a];
      if (Math.abs(ax[1]) < 1e-7) {
        if (ax[0] < ax[2] || ax[0] > ax[3]) return false;
      } else {
        var inv = 1 / ax[1], tn = (ax[2] - ax[0]) * inv, tf = (ax[3] - ax[0]) * inv;
        if (tn > tf) { var sw = tn; tn = tf; tf = sw; }
        if (tn > t0) t0 = tn;
        if (tf < t1) t1 = tf;
        if (t0 > t1) return false;
      }
    }
    return true;
  }

  function bakeOcclusion(data, matrixWorld, normalMatrix, boxes, selfIndex, radius) {
    var n = data.pos.length / 3, ao = new Float32Array(n);
    var e = matrixWorld.elements, nm = normalMatrix.elements;
    var offset = radius * 0.03;
    for (var v = 0; v < n; v++) {
      var x = data.pos[v * 3], y = data.pos[v * 3 + 1], z = data.pos[v * 3 + 2];
      var nx = data.nor[v * 3], ny = data.nor[v * 3 + 1], nz = data.nor[v * 3 + 2];
      var wnx = nm[0] * nx + nm[3] * ny + nm[6] * nz;
      var wny = nm[1] * nx + nm[4] * ny + nm[7] * nz;
      var wnz = nm[2] * nx + nm[5] * ny + nm[8] * nz;
      var len = Math.sqrt(wnx * wnx + wny * wny + wnz * wnz) || 1;
      wnx /= len; wny /= len; wnz /= len;
      var ox = e[0] * x + e[4] * y + e[8] * z + e[12] + wnx * offset;
      var oy = e[1] * x + e[5] * y + e[9] * z + e[13] + wny * offset;
      var oz = e[2] * x + e[6] * y + e[10] * z + e[14] + wnz * offset;

      // 법선을 축으로 하는 좌표계
      var hx = Math.abs(wny) < 0.9 ? 0 : 1, hy = Math.abs(wny) < 0.9 ? 1 : 0;
      var tx = wny * 0 - wnz * hy, ty = wnz * hx - wnx * 0, tz = wnx * hy - wny * hx;
      var tl = Math.sqrt(tx * tx + ty * ty + tz * tz) || 1;
      tx /= tl; ty /= tl; tz /= tl;
      var bx = wny * tz - wnz * ty, by = wnz * tx - wnx * tz, bz = wnx * ty - wny * tx;

      var hits = 0, total = 0;
      for (var r = 0; r < RAY_DIRS.length; r++) {
        var rd = RAY_DIRS[r];
        var d = [tx * rd[0] + wnx * rd[1] + bx * rd[2], ty * rd[0] + wny * rd[1] + by * rd[2], tz * rd[0] + wnz * rd[1] + bz * rd[2]];
        var hit = false;
        for (var b = 0; b < boxes.length && !hit; b++) {
          if (b !== selfIndex && rayHitsBox([ox, oy, oz], d, boxes[b], radius)) hit = true;
        }
        if (hit) hits += rd[1];
        total += rd[1];
      }
      ao[v] = 1 - Math.min(1, (hits / total) * 1.5) * 0.62;
    }
    return ao;
  }

  function upgradeMaterial(src, cache) {
    if (cache[src.uuid]) return cache[src.uuid];
    if (!(src instanceof THREE.MeshPhongMaterial) && !(src instanceof THREE.MeshLambertMaterial)) return src;

    var lum = src.color.r * 0.3 + src.color.g * 0.59 + src.color.b * 0.11;
    var isEye = lum < 0.06;
    var m = new THREE.MeshPhongMaterial({
      color: src.color.getHex(),
      emissive: src.emissive ? src.emissive.getHex() : 0,
      specular: isEye ? 0xffffff : (src.specular && src.specular.getHex() > 0x222222 ? src.specular.getHex() : 0x3a3a3a),
      shininess: isEye ? 160 : Math.max(src.shininess || 0, 58),
      transparent: src.transparent, opacity: src.opacity,
      vertexColors: THREE.VertexColors,
      shading: THREE.SmoothShading,
      side: src.side
    });
    cache[src.uuid] = m;
    return m;
  }

  var bakeCache = {};

  // 캐릭터 한 벌을 마감 처리한다. key가 같은 캐릭터는 계산 결과를 재사용한다.
  GFX.polish = function (root, key) {
    root.updateMatrixWorld(true);
    var meshes = [];
    root.traverse(function (o) { if (o instanceof THREE.Mesh && o.geometry) meshes.push(o); });

    var cacheEntry = key ? bakeCache[key] : null;
    var valid = cacheEntry && cacheEntry.length === meshes.length;
    var matCache = {};

    var rootInv = new THREE.Matrix4().getInverse(root.matrixWorld);
    var relative = meshes.map(function (m) { return new THREE.Matrix4().multiplyMatrices(rootInv, m.matrixWorld); });

    var boxes = null, radius = 1;
    if (!valid) {
      var bounds = new THREE.Box3();
      boxes = meshes.map(function (m, i) {
        if (!(m.geometry instanceof THREE.Geometry)) return null;
        m.geometry.computeBoundingBox();
        var bb = m.geometry.boundingBox;
        var world = bb.clone().applyMatrix4(relative[i]);
        bounds.union(world);
        return { min: bb.min, max: bb.max, inv: new THREE.Matrix4().getInverse(relative[i]).elements };
      }).filter(Boolean);
      radius = Math.max(8, bounds.size().length() * 0.14);
      cacheEntry = [];
    }

    meshes.forEach(function (mesh, i) {
      var geo;
      if (valid) {
        geo = cacheEntry[i];
      } else if (mesh.geometry instanceof THREE.Geometry) {
        var data = isSimpleBox(mesh.geometry) ? bevelBox(mesh.geometry) : smoothGeometry(mesh.geometry);
        var nmat = new THREE.Matrix3().getNormalMatrix(relative[i]);
        var selfIdx = -1;
        for (var b = 0; b < boxes.length; b++) {
          if (boxes[b].min === mesh.geometry.boundingBox.min) { selfIdx = b; break; }
        }
        geo = toBuffer(data, bakeOcclusion(data, relative[i], nmat, boxes, selfIdx, radius));
        cacheEntry.push(geo);
      } else {
        geo = mesh.geometry;
        cacheEntry.push(geo);
      }
      mesh.geometry = geo;
      mesh.material = upgradeMaterial(mesh.material, matCache);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });

    if (key && !valid) bakeCache[key] = cacheEntry;
    return root;
  };

})();
