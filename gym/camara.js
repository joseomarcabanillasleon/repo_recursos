/* =====================================================================
   Gimnasia para todos · modo cámara
   - Detecta la postura con MediaPipe Pose (Google) DENTRO del navegador:
     ninguna imagen sale del dispositivo.
   - Dibuja el «esqueleto», cuenta repeticiones y da avisos sencillos en
     10 ejercicios de pie o sentado. En el resto, solo modo espejo.
   - Orientativo: no sustituye a un profesional.
   ===================================================================== */
(() => {
  "use strict";
  const MP = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
  const MODEL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

  // Índices de MediaPipe Pose
  const P = { nose: 0, lSh: 11, rSh: 12, lEl: 13, rEl: 14, lWr: 15, rWr: 16, lHip: 23, rHip: 24, lKn: 25, rKn: 26, lAn: 27, rAn: 28 };
  const BONES = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28], [27, 31], [28, 32]];

  /* ---------- geometría ---------- */
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  // ángulo en B (grados) del triángulo A-B-C
  function ang(a, b, c) {
    const v1 = { x: a.x - b.x, y: a.y - b.y }, v2 = { x: c.x - b.x, y: c.y - b.y };
    const d = (v1.x * v2.x + v1.y * v2.y) / (Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y) || 1);
    return Math.acos(Math.max(-1, Math.min(1, d))) * 180 / Math.PI;
  }
  // apertura del brazo respecto al cuerpo (0° pegado abajo, 90° en cruz, 180° arriba)
  function abd(sh, wr, hip) { return ang(hip, sh, wr); }
  const torso = (L) => dist(mid(L[P.lSh], L[P.rSh]), mid(L[P.lHip], L[P.rHip])) || 0.3;
  const vis = (L, ids) => ids.every((i) => (L[i].visibility ?? 1) > 0.5);
  // inclinación lateral del tronco (grados, + hacia un lado, − hacia el otro)
  function tilt(L) {
    const s = mid(L[P.lSh], L[P.rSh]), h = mid(L[P.lHip], L[P.rHip]);
    return Math.atan2(s.x - h.x, h.y - s.y) * 180 / Math.PI;
  }

  /* ---------- reglas por ejercicio ----------
     need: puntos que deben verse · sig: valor que se sigue · hi/lo: umbrales (histéresis)
     dir: "up" = la repetición sube por encima de hi y vuelve por debajo de lo
          "down" = baja por debajo de lo y vuelve por encima de hi
     peak(min/max del recorrido) → aviso si no llega · form(L) → aviso de técnica durante el movimiento */
  // Se trabaja con el lado (o los lados) que se vean: de frente se ven los dos; de perfil, solo uno
  const SIDE = [{ sh: P.lSh, el: P.lEl, wr: P.lWr, hip: P.lHip, kn: P.lKn, an: P.lAn }, { sh: P.rSh, el: P.rEl, wr: P.rWr, hip: P.rHip, kn: P.rKn, an: P.rAn }];
  const ok = (L, i) => (L[i].visibility ?? 1) > 0.5;
  const armSides = (L) => SIDE.filter((d) => ok(L, d.sh) && ok(L, d.el) && ok(L, d.wr) && ok(L, d.hip));
  const legSides = (L) => SIDE.filter((d) => ok(L, d.hip) && ok(L, d.kn) && ok(L, d.an));
  const avg = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1);
  const ARMS = (L) => armSides(L).length > 0;
  const LEGS = (L) => legSides(L).length > 0;
  const meanAbd = (L) => avg(armSides(L).map((d) => abd(L[d.sh], L[d.wr], L[d.hip])));
  // ángulo medio de los codos, solo con los brazos cuya mano se ve bien dentro de la imagen
  const inFrame = (p) => (p.visibility ?? 1) > 0.7 && p.x > 0.03 && p.x < 0.97 && p.y > 0.03 && p.y < 0.97;
  const elbows = (L) => {
    const a = [[P.lSh, P.lEl, P.lWr], [P.rSh, P.rEl, P.rWr]].filter(([sh, e, w]) => inFrame(L[e]) && inFrame(L[w]) && dist(L[e], L[w]) > 0.5 * dist(L[sh], L[e]))
      .map(([sh, e, w]) => ang(L[sh], L[e], L[w])); // si el antebrazo se ve «escondido» o cortado, ese brazo no se evalúa
    return a.length ? a.reduce((x, y) => x + y, 0) / a.length : 180;
  };
  const knees = (L) => avg(legSides(L).map((d) => ang(L[d.hip], L[d.kn], L[d.an])));
  const kneeLift = (L) => { const t = torso(L); return Math.min(...legSides(L).map((d) => L[d.kn].y - L[d.hip].y)) / t; };

  const RULES = {
    1: { need: ARMS, sig: meanAbd, dir: "up", hi: 140, lo: 40,
      peak: (m) => m < 150 && "Sube los brazos hasta arriba, bien verticales.",
      form: (L, s) => s > 120 && elbows(L) < 140 && "Estira bien los codos." },
    22: { need: ARMS, sig: meanAbd, dir: "up", hi: 70, lo: 30,
      peak: (m) => (m < 78 && "Sube hasta la altura de los hombros.") || (m > 120 && "Para a la altura de los hombros, en cruz."),
      form: (L, s) => s > 60 && elbows(L) < 140 && "Mantén los brazos estirados." },
    15: { need: ARMS, sig: meanAbd, dir: "up", hi: 75, lo: 35,
      peak: (m) => m < 82 && "Abre los brazos hasta formar una cruz.",
      form: (L, s) => s > 60 && elbows(L) < 140 && "Estira los brazos todo lo posible." },
    27: { need: ARMS, sig: meanAbd, dir: "up", hi: 125, lo: 40,
      peak: (m) => m < 140 && "Súbelos por encima de la cabeza, en forma de V.",
      form: (L, s) => s > 110 && elbows(L) < 140 && "Estira bien los brazos arriba." },
    10: { need: ARMS, sig: elbows, dir: "down", hi: 145, lo: 75,
      peak: (m) => m > 65 && "Dobla más los codos, hasta acercar los puños al cuello.",
      form: (L) => { const t = torso(L); return armSides(L).some((d) => (L[d.el].y - L[d.sh].y) / t > 0.35) && "Mantén los codos a la altura de los hombros."; } },
    3: { need: LEGS, sig: knees, dir: "down", hi: 160, lo: 125,
      peak: (m) => m > 115 && "Baja un poco más, flexionando las rodillas.",
      form: (L) => armSides(L).some((d) => L[d.wr].y > L[d.sh].y) && "Lleva las manos a la nuca." },
    35: { need: LEGS, sig: knees, dir: "down", hi: 160, lo: 120,
      peak: (m) => m > 110 && "Flexiona del todo las piernas al bajar.",
      form: (L, s) => s > 155 && ARMS(L) && meanAbd(L) < 140 && "Arriba, sube los brazos hasta juntar las manos." },
    13: { need: LEGS, sig: (L) => -kneeLift(L), dir: "up", hi: -0.2, lo: -0.55,
      peak: (m) => m < 0 && "Sube la rodilla un poco más hacia el pecho." },
    9: { need: [P.lSh, P.rSh, P.lHip, P.rHip], sig: tilt, dir: "side", hi: 9, lo: -9,
      peak: (m) => m < 11 && "Inclínate un poco más hacia los lados." },
    31: { need: [P.lSh, P.rSh, P.lHip, P.rHip], sig: tilt, dir: "side", hi: 9, lo: -9,
      peak: (m) => m < 11 && "Inclínate un poco más, con la espalda recta." },
  };
  const tieneReglas = (n) => !!RULES[n];

  /* ---------- estado ---------- */
  let landmarker = null, video = null, canvas = null, ctx2 = null, stream = null, raf = 0, api = null, box = null;
  let rule = null, exN = 0, st = null, lastCue = 0, cueSeen = {}, lastVisWarn = 0, okSaid = false, lastT = -1, tipAt = 0;

  function reset(n) {
    exN = n; rule = RULES[n] || null;
    st = { phase: "rest", reps: 0, ext: null, ema: null, side: 0, sideExt: 0 };
    cueSeen = {}; okSaid = false; tipAt = 0;
    paint();
  }
  function cue(text, force = false) {
    const now = performance.now();
    if (!text || (!force && now - lastCue < 6000) || (cueSeen[text] && now - cueSeen[text] < 15000)) return;
    lastCue = now; cueSeen[text] = now;
    api.say(text); showMsg(text);
  }
  function showMsg(t) { const m = box && box.querySelector(".cam-msg"); if (m) { m.textContent = t; m.classList.add("is-on"); clearTimeout(showMsg.t); showMsg.t = setTimeout(() => m.classList.remove("is-on"), 3500); } }
  function paint() {
    if (!box) return;
    box.querySelector(".cam-reps b").textContent = rule ? st.reps : "—";
    box.querySelector(".cam-reps small").textContent = rule ? "repeticiones" : "modo espejo";
  }
  function onRep() { st.reps++; paint(); api.beep(); if (st.reps % 5 === 0) api.say(`¡Llevas ${st.reps}!`); }

  function track(L) {
    if (!rule) return;
    if (!(typeof rule.need === "function" ? rule.need(L) : vis(L, rule.need))) {
      if (performance.now() - lastVisWarn > 9000) { lastVisWarn = performance.now(); cue("Colócate para que la cámara te vea entero, de cabeza a pies.", true); }
      return;
    }
    if (!tipAt) tipAt = performance.now(); // desde la primera vez que te ve
    if (!okSaid && performance.now() - tipAt > 4000) { okSaid = true; showMsg("¡Te veo bien! 👍"); }
    if (!api.working()) return;
    const raw = rule.sig(L); if (window.GYMCAM_DEBUG) console.log("dbg " + raw.toFixed(2) + " elb " + elbows(L).toFixed(0));
    st.ema = st.ema == null ? raw : st.ema * 0.6 + raw * 0.4;
    const v = st.ema;
    if (rule.form) { const f = rule.form(L, v); if (f) cue(f); }
    if (rule.dir === "up") {
      if (st.phase === "rest" && v > rule.hi) { st.phase = "move"; st.ext = v; }
      else if (st.phase === "move") { st.ext = Math.max(st.ext, v); if (v < rule.lo) { st.phase = "rest"; onRep(); const p = rule.peak && rule.peak(st.ext); if (p) cue(p); } }
    } else if (rule.dir === "down") {
      if (st.phase === "rest" && v < rule.lo) { st.phase = "move"; st.ext = v; }
      else if (st.phase === "move") { st.ext = Math.min(st.ext, v); if (v > rule.hi) { st.phase = "rest"; onRep(); const p = rule.peak && rule.peak(st.ext); if (p) cue(p); } }
    } else { // "side": cuenta cada inclinación completa a un lado y vuelta al centro
      const s = v > rule.hi ? 1 : v < rule.lo ? -1 : 0;
      if (s && !st.side) { st.side = s; st.sideExt = Math.abs(v); }
      else if (st.side && s === st.side) st.sideExt = Math.max(st.sideExt, Math.abs(v));
      else if (st.side && Math.abs(v) < Math.abs(rule.hi) * 0.4) { const ext = st.sideExt; st.side = 0; onRep(); const p = rule.peak && rule.peak(ext); if (p) cue(p); }
    }
  }

  function draw(L) {
    const w = canvas.width = video.videoWidth, h = canvas.height = video.videoHeight;
    ctx2.clearRect(0, 0, w, h);
    if (!L) return;
    ctx2.lineWidth = Math.max(3, w / 160); ctx2.lineCap = "round";
    ctx2.strokeStyle = "rgba(124,196,164,.95)";
    for (const [a, b] of BONES) {
      if ((L[a].visibility ?? 1) < 0.5 || (L[b].visibility ?? 1) < 0.5) continue;
      ctx2.beginPath(); ctx2.moveTo(L[a].x * w, L[a].y * h); ctx2.lineTo(L[b].x * w, L[b].y * h); ctx2.stroke();
    }
    ctx2.fillStyle = "#f3793b";
    for (const i of [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]) {
      if ((L[i].visibility ?? 1) < 0.5) continue;
      ctx2.beginPath(); ctx2.arc(L[i].x * w, L[i].y * h, Math.max(4, w / 110), 0, 7); ctx2.fill();
    }
  }

  function loop() {
    raf = requestAnimationFrame(loop);
    if (!landmarker || video.readyState < 2 || video.currentTime === lastT) return;
    lastT = video.currentTime;
    let L = null;
    try { const r = landmarker.detectForVideo(video, performance.now()); L = r.landmarks && r.landmarks[0]; } catch { return; }
    draw(L);
    if (L) track(L);
  }

  async function load() {
    if (landmarker) return landmarker;
    const { FilesetResolver, PoseLandmarker } = await import(MP + "/vision_bundle.mjs");
    const fs = await FilesetResolver.forVisionTasks(MP + "/wasm");
    const opts = (delegate) => ({ baseOptions: { modelAssetPath: MODEL, delegate }, runningMode: "VIDEO", numPoses: 1 });
    try { landmarker = await PoseLandmarker.createFromOptions(fs, opts("GPU")); }
    catch { landmarker = await PoseLandmarker.createFromOptions(fs, opts("CPU")); }
    return landmarker;
  }

  /* ---------- API pública ---------- */
  window.GymCam = {
    tieneReglas,
    activo: () => !!stream,
    // container: elemento donde se pinta · n: número de ejercicio (0 si no aplica) · a: {say, beep, working}
    async start(container, n, a) {
      api = a; box = document.createElement("div"); box.className = "cam";
      box.innerHTML = `<video playsinline muted></video><canvas></canvas>
        <div class="cam-reps"><b>—</b><small></small></div>
        <p class="cam-msg" role="status" aria-live="polite"></p>
        <p class="cam-load">Cargando la cámara y el detector de postura…</p>`;
      container.innerHTML = ""; container.appendChild(box);
      video = box.querySelector("video"); canvas = box.querySelector("canvas"); ctx2 = canvas.getContext("2d");
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      } catch (e) {
        stream = null; box.querySelector(".cam-load").textContent = "No se pudo abrir la cámara. Revisa el permiso del navegador.";
        throw e;
      }
      video.srcObject = stream; await video.play().catch(() => {});
      await load();
      reset(n); lastT = -1; cancelAnimationFrame(raf);
      showMsg(rule ? "Apoya el móvil a 2–3 metros: que se te vea de cabeza a pies." : "Modo espejo: este ejercicio no tiene corrección automática.");
      loop(); // la primera detección puede tardar unos segundos (el modelo «arranca»)
      box?.querySelector(".cam-load")?.remove();
    },
    move(container, n) { if (!stream || !box) return; container.innerHTML = ""; container.appendChild(box); video.play().catch(() => {}); reset(n); showMsg(rule ? "Nuevo ejercicio: cuento tus repeticiones." : "Modo espejo: este ejercicio no tiene corrección automática."); },
    stop() {
      cancelAnimationFrame(raf); raf = 0;
      try { stream && stream.getTracks().forEach((t) => t.stop()); } catch { /* nada */ }
      stream = null; if (box) box.remove(); box = null;
    },
  };
})();
