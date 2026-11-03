/* =====================================================================
   Figura 3D · persona en 3D con luz y sombras (Three.js)
   Reutiliza los movimientos de movimientos.js y el esqueleto de
   figura.js (solve / poseAt). Un único renderizador WebGL dibuja todas
   las tarjetas visibles. Se puede arrastrar para girar 360°.
   Si no hay WebGL, se mantienen las ilustraciones SVG.
   ===================================================================== */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

(function init() {
  const F = window.Figura;
  if (!F || !window.MOV) return;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  } catch { return; }
  if (!renderer.getContext()) return;

  const SIZE = 600;
  renderer.setPixelRatio(1);
  renderer.setSize(SIZE, SIZE, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  /* ---------- Escena ---------- */
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#fbf4ec");
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 30);

  scene.add(new THREE.HemisphereLight("#ffffff", "#d8c3ad", 0.95));
  const key = new THREE.DirectionalLight("#fff6ec", 2.5);
  key.position.set(1.4, 2.8, 2.2);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -1.6, right: 1.6, top: 2.2, bottom: -0.4, near: 0.5, far: 8 });
  key.shadow.bias = -0.0006;
  key.shadow.radius = 5;
  scene.add(key);
  const rim = new THREE.DirectionalLight("#cfe2ff", 0.9);
  rim.position.set(-2.2, 1.8, -1.6);
  scene.add(rim);
  const fill = new THREE.DirectionalLight("#ffe7d6", 0.35);
  fill.position.set(-1.5, 0.8, 2.2);
  scene.add(fill);

  const floor = new THREE.Mesh(new THREE.CircleGeometry(1.7, 64), new THREE.MeshStandardMaterial({ color: "#efe3d6", roughness: 1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  /* ---------- Materiales ---------- */
  const M = {
    skin: new THREE.MeshStandardMaterial({ color: "#e0a27a", roughness: 0.55 }),
    shirt: new THREE.MeshStandardMaterial({ color: "#2a9d8f", roughness: 0.78 }),
    pants: new THREE.MeshStandardMaterial({ color: "#2f3b55", roughness: 0.82 }),
    shoe: new THREE.MeshStandardMaterial({ color: "#f3793b", roughness: 0.5 }),
    sole: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.6 }),
    hair: new THREE.MeshStandardMaterial({ color: "#33241b", roughness: 0.95 }),
    eye: new THREE.MeshStandardMaterial({ color: "#1d1d1d", roughness: 0.3 }),
    lip: new THREE.MeshStandardMaterial({ color: "#b8735a", roughness: 0.6 }),
    wood: new THREE.MeshStandardMaterial({ color: "#b98f66", roughness: 0.65 }),
    woodD: new THREE.MeshStandardMaterial({ color: "#9a7350", roughness: 0.7 }),
    wall: new THREE.MeshStandardMaterial({ color: "#ece3d6", roughness: 0.95 }),
    cue: new THREE.MeshBasicMaterial({ color: "#f3793b" }),
    focus: new THREE.MeshBasicMaterial({ color: "#ff6a3d", transparent: true, opacity: 0.2, depthTest: false, depthWrite: false }),
    ghost: new THREE.MeshBasicMaterial({ color: "#8a98ad", transparent: true, opacity: 0.15, depthWrite: false })
  };

  /* ---------- Utilidades geométricas ---------- */
  const Y = new THREE.Vector3(0, 1, 0);
  const tmp = new THREE.Vector3();
  const S3 = 0.01;
  const v2 = (p, z = 0) => new THREE.Vector3((p[0] - 100) * S3, (188 - p[1]) * S3, z);
  function placeSeg(mesh, a, b) {
    tmp.subVectors(b, a);
    const l = tmp.length() || 1e-4;
    mesh.position.copy(a).addScaledVector(tmp, 0.5);
    mesh.quaternion.setFromUnitVectors(Y, tmp.divideScalar(l));
    mesh.scale.set(1, l, 1);
  }
  const cyl = (rTop, rBot, mat) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, 1, 22), mat); m.castShadow = true; return m; };
  const sph = (r, mat, sx = 1, sy = 1, sz = 1) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), mat); m.scale.set(sx, sy, sz); m.castShadow = true; return m; };

  /* ---------- Persona ---------- */
  function makeMan(ghost) {
    const mat = (k) => (ghost ? M.ghost : M[k]);
    const g = new THREE.Group();
    const P = {};
    P.pelvis = sph(1, mat("pants"));
    P.abdomen = sph(1, mat("shirt"));
    P.chest = sph(1, mat("shirt"));
    P.neck = cyl(0.042, 0.046, mat("skin"));
    P.head = new THREE.Group();
    const skull = sph(0.1, mat("skin"), 0.95, 1.06, 1);
    const hair = sph(0.106, mat("hair"), 0.98, 1.04, 1.02); hair.position.set(0, 0.022, -0.02);
    const nose = sph(0.017, mat("skin"), 1, 1.3, 1); nose.position.set(0, -0.008, 0.098);
    const eyeL = sph(0.011, mat("eye")); eyeL.position.set(-0.034, 0.016, 0.088);
    const eyeR = sph(0.011, mat("eye")); eyeR.position.set(0.034, 0.016, 0.088);
    const earL = sph(0.022, mat("skin"), 0.6, 1, 1); earL.position.set(-0.097, 0, -0.004);
    const earR = sph(0.022, mat("skin"), 0.6, 1, 1); earR.position.set(0.097, 0, -0.004);
    const mouth = sph(0.018, mat("lip"), 1.3, 0.35, 0.6); mouth.position.set(0, -0.045, 0.087);
    P.head.add(skull, hair, nose, eyeL, eyeR, earL, earR, mouth);
    P.head.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    for (const s of ["L", "R"]) {
      P["shoulder" + s] = sph(0.056, mat("shirt"));
      P["ua" + s] = cyl(0.037, 0.046, mat("skin"));
      P["sleeve" + s] = cyl(0.05, 0.057, mat("shirt"));
      P["elbow" + s] = sph(0.037, mat("skin"));
      P["fa" + s] = cyl(0.028, 0.036, mat("skin"));
      P["hand" + s] = sph(0.036, mat("skin"), 0.8, 1.15, 0.6);
      P["hip" + s] = sph(0.072, mat("pants"));
      P["th" + s] = cyl(0.056, 0.074, mat("pants"));
      P["knee" + s] = sph(0.056, mat("pants"));
      P["sh" + s] = cyl(0.038, 0.054, mat("pants"));
      P["ankle" + s] = sph(0.037, mat("shoe"));
      P["foot" + s] = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.12, 6, 16), mat("shoe")); P["foot" + s].castShadow = true;
      P["sole" + s] = new THREE.Mesh(new THREE.CapsuleGeometry(0.041, 0.12, 6, 16), mat("sole"));
    }
    for (const k in P) g.add(P[k]);
    if (ghost) g.renderOrder = -1;

    const basis = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    function orient(obj, right, up, fwd) { basis.makeBasis(right, up, fwd); q.setFromRotationMatrix(basis); obj.quaternion.copy(q); }
    function ellipsoid(mesh, center, rx, ry, rz, right, up, fwd) {
      mesh.position.copy(center); orient(mesh, right, up, fwd); mesh.scale.set(rx, ry, rz);
    }

    /* Coloca la persona a partir de las articulaciones 2D (Figura.solve) */
    function set(J) {
      const side = J.view === "side";
      let pts = {};
      const Pp = v2(J.P), Np = v2(J.N);
      const up = new THREE.Vector3().subVectors(Np, Pp).normalize();
      let fwd0;
      if (side) fwd0 = new THREE.Vector3(1, 0, 0);
      else if (J.back) fwd0 = new THREE.Vector3(0, 0, -1);
      else fwd0 = new THREE.Vector3(Math.sin((J.rot || 0) * Math.PI / 180), 0, Math.cos((J.rot || 0) * Math.PI / 180));
      const fwd = fwd0.clone().addScaledVector(up, -fwd0.dot(up)).normalize();
      const right = new THREE.Vector3().crossVectors(up, fwd).normalize(); // base dextrógira

      if (side) {
        // lado derecho (R, cerca de la cámara) = extremidades «F»; izquierdo (L) = «B»
        const sideZ = { L: -1, R: 1 }, src = { L: "B", R: "F" };
        const Sh = v2(J.S);
        for (const s of ["L", "R"]) {
          const k = src[s], zS = 0.165 * sideZ[s], zH = 0.088 * sideZ[s];
          pts["S" + s] = Sh.clone().addScaledVector(right, 0.165 * sideZ[s]).setZ(zS);
          pts["E" + s] = v2(J["E" + k], zS); pts["W" + s] = v2(J["W" + k], zS); pts["Hd" + s] = v2(J["Hd" + k], zS);
          pts["H" + s] = Pp.clone().setZ(zH);
          pts["K" + s] = v2(J["K" + k], zH); pts["A" + s] = v2(J["A" + k], zH);
          pts["Toe" + s] = v2(J["Toe" + k], zH); pts["Heel" + s] = v2(J["Heel" + k], zH);
        }
      } else {
        const L3 = { ua: 0.29, fa: 0.26, th: 0.4, sh: 0.4 };
        const depthSign = J.back ? -1 : 1;
        const deep = (a3, b2, len) => {
          const b3 = v2(b2);
          const proj = Math.hypot(b3.x - a3.x, b3.y - a3.y);
          b3.z = a3.z + depthSign * Math.sqrt(Math.max(0, len * len - proj * proj));
          return b3;
        };
        for (const s of ["L", "R"]) {
          const S = v2(J["S" + s]); S.z = -0.01 * depthSign;
          const E = deep(S, J["E" + s], L3.ua), W = deep(E, J["W" + s], L3.fa);
          const hd = W.clone().add(new THREE.Vector3().subVectors(W, E).normalize().multiplyScalar(0.03));
          const H = v2(J["H" + s]);
          const K = deep(H, J["K" + s], L3.th), A = deep(K, J["A" + s], L3.sh);
          const toe = A.clone().add(new THREE.Vector3((s === "L" ? -1 : 1) * 0.03, -0.025, 0.14 * depthSign));
          const heel = A.clone().add(new THREE.Vector3(0, -0.025, -0.035 * depthSign));
          Object.assign(pts, { ["S" + s]: S, ["E" + s]: E, ["W" + s]: W, ["Hd" + s]: hd, ["H" + s]: H, ["K" + s]: K, ["A" + s]: A, ["Toe" + s]: toe, ["Heel" + s]: heel });
        }
      }
      // tronco
      ellipsoid(P.pelvis, Pp.clone().addScaledVector(up, 0.02), 0.165, 0.115, 0.115, right, up, fwd);
      ellipsoid(P.abdomen, Pp.clone().addScaledVector(up, 0.17), 0.15, 0.15, 0.1, right, up, fwd);
      ellipsoid(P.chest, Pp.clone().addScaledVector(up, 0.33), 0.175, 0.165, 0.112, right, up, fwd);
      // cabeza
      const HC = v2(J.HC);
      const hUp = new THREE.Vector3().subVectors(HC, Np).normalize();
      const hF = fwd.clone().addScaledVector(hUp, -fwd.dot(hUp)).normalize();
      const hR = new THREE.Vector3().crossVectors(hUp, hF).normalize();
      placeSeg(P.neck, Np.clone().addScaledVector(up, -0.03), Np.clone().addScaledVector(hUp, 0.06));
      P.head.position.copy(HC); orient(P.head, hR, hUp, hF);
      // extremidades
      for (const s of ["L", "R"]) {
        const S = pts["S" + s], E = pts["E" + s], W = pts["W" + s];
        P["shoulder" + s].position.copy(S);
        placeSeg(P["ua" + s], S, E);
        placeSeg(P["sleeve" + s], S, S.clone().lerp(E, 0.5));
        P["elbow" + s].position.copy(E);
        placeSeg(P["fa" + s], E, W);
        P["hand" + s].position.copy(pts["Hd" + s]);
        P["hand" + s].quaternion.setFromUnitVectors(Y, new THREE.Vector3().subVectors(W, E).normalize());
        const H = pts["H" + s], K = pts["K" + s], A = pts["A" + s];
        P["hip" + s].position.copy(H);
        placeSeg(P["th" + s], H, K);
        P["knee" + s].position.copy(K);
        placeSeg(P["sh" + s], K, A);
        P["ankle" + s].position.copy(A);
        const toe = pts["Toe" + s], heel = pts["Heel" + s];
        const mid = toe.clone().lerp(heel, 0.5), dirF = new THREE.Vector3().subVectors(toe, heel).normalize();
        for (const [m, dy] of [[P["foot" + s], 0.012], [P["sole" + s], -0.004]]) {
          m.position.copy(mid).add(new THREE.Vector3(0, dy, 0));
          m.quaternion.setFromUnitVectors(Y, dirF);
          m.scale.set(1.2, Math.max(0.6, toe.distanceTo(heel) / 0.2), m === P["sole" + s] ? 0.55 : 0.9);
        }
      }
      return pts;
    }
    return { group: g, set };
  }

  const man = makeMan(false);
  const ghost = makeMan(true);
  scene.add(man.group, ghost.group);

  /* ---------- Atrezo 3D ---------- */
  const box3 = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m; };
  const leg3 = (x, z, h, mat = M.wood) => { const m = cyl(0.016, 0.018, mat); m.scale.y = h; m.position.set(x, h / 2, z); return m; };
  function chairSide(x2) { // silla vista de lado: respaldo en x2, asiento hacia +x
    const X = (x2 - 100) * S3, g = new THREE.Group();
    g.add(box3(0.46, 0.04, 0.44, M.woodD, X + 0.22, 0.4, 0));
    g.add(leg3(X + 0.03, -0.19, 0.38), leg3(X + 0.03, 0.19, 0.38), leg3(X + 0.41, -0.19, 0.38), leg3(X + 0.41, 0.19, 0.38));
    const p1 = cyl(0.016, 0.018, M.wood); p1.scale.y = 0.52; p1.position.set(X + 0.02, 0.66, -0.19);
    const p2 = p1.clone(); p2.position.z = 0.19;
    g.add(p1, p2, box3(0.03, 0.16, 0.42, M.woodD, X + 0.02, 0.84, 0), box3(0.025, 0.05, 0.38, M.wood, X + 0.02, 0.62, 0));
    return g;
  }
  function chairBeside(x2) { // vista frontal: silla a la derecha, respaldo en z = 0
    const X = (x2 + 17 - 100) * S3, g = new THREE.Group();
    g.add(box3(0.38, 0.04, 0.42, M.woodD, X, 0.4, 0.2));
    g.add(leg3(X - 0.16, 0.02, 0.38), leg3(X + 0.16, 0.02, 0.38), leg3(X - 0.16, 0.39, 0.38), leg3(X + 0.16, 0.39, 0.38));
    const p1 = cyl(0.016, 0.018, M.wood); p1.scale.y = 0.52; p1.position.set(X - 0.17, 0.66, 0);
    const p2 = p1.clone(); p2.position.x = X + 0.17;
    g.add(p1, p2, box3(0.38, 0.16, 0.03, M.woodD, X, 0.84, 0));
    return g;
  }
  function chairBehind() { // vista frontal: silla detrás de la persona sentada
    const g = new THREE.Group();
    g.add(box3(0.5, 0.04, 0.46, M.woodD, 0, 0.5, -0.1));
    g.add(leg3(-0.22, -0.3, 0.48), leg3(0.22, -0.3, 0.48), leg3(-0.22, 0.1, 0.48), leg3(0.22, 0.1, 0.48));
    g.add(box3(0.5, 0.3, 0.03, M.woodD, 0, 0.92, -0.32));
    const p1 = cyl(0.016, 0.018, M.wood); p1.scale.y = 0.6; p1.position.set(-0.23, 0.8, -0.32);
    const p2 = p1.clone(); p2.position.x = 0.23; g.add(p1, p2);
    return g;
  }
  const wall3 = (x2) => box3(0.06, 2.2, 2.6, M.wall, (x2 - 100) * S3 + 0.03, 1.1, 0);
  const PROP3 = { chair: chairSide, chairFront: chairSide, chairSide: chairBeside, wall: wall3 };

  /* ---------- Flechas ---------- */
  function arrow(curve) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.009, 8, false), M.cue));
    const end = curve.getPoint(1), tan = curve.getTangent(1);
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.07, 14), M.cue);
    head.position.copy(end).addScaledVector(tan, 0.02);
    head.quaternion.setFromUnitVectors(Y, tan);
    g.add(head);
    return g;
  }
  function parsePath(d, z) {
    const n = d.match(/-?\d+(\.\d+)?/g).map(Number), c = d.replace(/[^MLQ]/g, "");
    let i = 0, cur = null; const curves = [];
    for (const cmd of c) {
      if (cmd === "M") { cur = [n[i], n[i + 1]]; i += 2; }
      else if (cmd === "L") { const b = [n[i], n[i + 1]]; curves.push(new THREE.LineCurve3(v2(cur, z), v2(b, z))); cur = b; i += 2; }
      else if (cmd === "Q") { const c1 = [n[i], n[i + 1]], b = [n[i + 2], n[i + 3]]; curves.push(new THREE.QuadraticBezierCurve3(v2(cur, z), v2(c1, z), v2(b, z))); cur = b; i += 4; }
    }
    return curves;
  }

  /* ---------- Escena de cada ejercicio (en caché) ---------- */
  const cache = new Map();
  function extras(ex) {
    if (cache.has(ex.id)) return cache.get(ex.id);
    const g = new THREE.Group();
    for (const p of ex.props || []) {
      const [name, x] = Array.isArray(p) ? p : [p];
      if (PROP3[name]) g.add(PROP3[name](x));
    }
    if (ex.id === "giro") g.add(chairBehind());
    const view = ex.frames[0].pose.view || "side";
    const zc = view === "side" ? 0.32 : 0.3;
    if (ex.cuePaths) ex.cuePaths.forEach((d) => parsePath(d, zc).forEach((c) => g.add(arrow(c))));
    else if (ex.cue) {
      const J0 = F.solve(ex.frames[0].pose), Jp = F.solve(ex.frames[ex.peak ?? 1].pose);
      const off = ex.cue.off || [0, 0];
      const a = [J0[ex.cue.j][0] + off[0], J0[ex.cue.j][1] + off[1]], b = [Jp[ex.cue.j][0] + off[0], Jp[ex.cue.j][1] + off[1]];
      const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], vx = b[0] - a[0], vy = b[1] - a[1], l = Math.hypot(vx, vy) || 1;
      const c = [m[0] - (vy / l) * (ex.cue.bow ?? 14), m[1] + (vx / l) * (ex.cue.bow ?? 14)];
      if (l > 4) g.add(arrow(new THREE.QuadraticBezierCurve3(v2(a, zc), v2(c, zc), v2(b, zc))));
    }
    const focus = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), M.focus);
    focus.renderOrder = 10;
    g.add(focus);
    const data = { group: g, focus, view, peakJ: F.solve(ex.frames[ex.peak ?? Math.min(1, ex.frames.length - 1)].pose) };
    g.visible = false;
    scene.add(g);
    cache.set(ex.id, data);
    return data;
  }

  /* ---------- Render de una tarjeta ---------- */
  const boxes = [];
  function renderBox(b, ms) {
    const ex = b.ex, X = extras(ex);
    for (const [, d] of cache) d.group.visible = d === X;
    const pose = ms == null ? ex.frames[ex.peak ?? 1].pose : F.poseAt(ex.frames, ms);
    const J = F.solve(pose);
    const pts = man.set(J);
    ghost.group.visible = !ex.noGhost;
    if (!ex.noGhost) ghost.set(X.peakJ);
    if (ex.focus) {
      const j = ex.focus.j, off = ex.focus.off || [0, 0];
      let p3;
      if (X.view === "side") {
        const zs = /F$/.test(j) ? 0.12 : /B$/.test(j) ? -0.12 : 0.06;
        p3 = v2([J[j][0] + off[0], J[j][1] + off[1]], zs);
      } else {
        const base = pts[j] || v2(J[j]);
        p3 = v2([J[j][0] + off[0], J[j][1] + off[1]], (base.z || 0) + 0.04);
      }
      X.focus.visible = true; X.focus.position.copy(p3); X.focus.scale.setScalar((ex.focus.r || 14) * S3 * 0.85);
    } else X.focus.visible = false;
    // cámara
    const seated = J.P[1] > 120;
    const baseAz = ex.az ?? (X.view === "side" ? 30 : -16);
    const az = (baseAz + b.az) * Math.PI / 180, el = (seated ? 10 : 12) * Math.PI / 180;
    const target = new THREE.Vector3(X.view === "side" ? (ex.tx ?? 0.06) : 0.04, seated ? (X.view === "side" ? 0.72 : 0.8) : 0.88, 0);
    const r = b.big ? 3.15 : 3.35;
    camera.position.set(target.x + r * Math.sin(az) * Math.cos(el), target.y + r * Math.sin(el), target.z + r * Math.cos(az) * Math.cos(el));
    camera.lookAt(target);
    renderer.render(scene, camera);
    const c = b.canvas;
    const w = Math.round(Math.min(SIZE, (c.clientWidth || 300) * Math.min(2, devicePixelRatio || 1)));
    if (c.width !== w) { c.width = w; c.height = w; }
    b.ctx.drawImage(renderer.domElement, 0, 0, c.width, c.height);
  }

  /* ---------- Montaje ---------- */
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => es.forEach((e) => {
    const b = boxes.find((x) => x.el === e.target); if (b) { b.visible = e.isIntersecting; if (b.visible && reduce) renderBox(b, null); }
  }), { rootMargin: "100px" }) : null;

  function mount(el, ex, opts = {}) {
    const canvas = document.createElement("canvas");
    canvas.className = "fig3d";
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", "Animación 3D: " + ex.t + ". Arrastra para girar.");
    const hint = document.createElement("span");
    hint.className = "fig3d-hint"; hint.textContent = "↻ Arrastra para girar";
    el.innerHTML = ""; el.append(canvas, hint);
    el.classList.add("is-3d");
    const b = { el, canvas, ctx: canvas.getContext("2d"), ex, big: !!opts.big, az: 0, visible: true, t0: performance.now() };
    // girar arrastrando
    let drag = null;
    canvas.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, az: b.az }; canvas.setPointerCapture(e.pointerId); el.classList.add("is-dragging"); });
    canvas.addEventListener("pointermove", (e) => { if (drag) { b.az = drag.az - (e.clientX - drag.x) * 0.6; if (reduce) renderBox(b, null); } });
    const end = () => { drag = null; el.classList.remove("is-dragging"); };
    canvas.addEventListener("pointerup", end); canvas.addEventListener("pointercancel", end);
    canvas.addEventListener("dblclick", () => { b.az = 0; if (reduce) renderBox(b, null); });
    boxes.push(b);
    io && io.observe(el);
    requestAnimationFrame(() => renderBox(b, reduce ? null : 0));
    return b;
  }
  function unmount(el) { const i = boxes.findIndex((b) => b.el === el); if (i >= 0) { io && io.unobserve(el); boxes.splice(i, 1); } }

  let last = 0;
  function loop(ms) {
    if (!reduce && ms - last > 40) { // ~25 fps
      last = ms;
      for (const b of boxes) if (b.visible && b.el.isConnected) renderBox(b, ms - b.t0);
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  window.Figura3D = { mount, unmount };
  window.dispatchEvent(new Event("figura3d-ready"));
})();
