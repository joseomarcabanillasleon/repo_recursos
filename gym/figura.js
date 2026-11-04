/* =====================================================================
   Figura · personaje articulado para las ilustraciones de ejercicios
   - Esqueleto con huesos de longitud fija (proporciones humanas)
   - Ángulos o cinemática inversa (manos y pies anclados a la silla,
     la pared o el suelo)
   - Cuerpo con volumen, ropa, pelo y cara; vista lateral y frontal
   - Animación por fotogramas clave, «sombra» de la posición final,
     flecha de dirección y zona muscular resaltada
   Ángulos absolutos en grados: 0 = hacia abajo, 90 = hacia delante
   (derecha en vista lateral / hacia fuera en vista frontal), 180 = arriba.
   ===================================================================== */
(() => {
  "use strict";
  const R = Math.PI / 180;
  const L = { torso: 50, neck: 5, head: 12, ua: 29, fa: 26, hand: 6, th: 40, sh: 40, foot: 16, heel: 4 };
  const C = {
    skin: "#e9b48f", skinB: "#cf9a75", hair: "#3a2a20", shirt: "#2a9d8f", shirtB: "#1f7e73",
    pants: "#33415c", pantsB: "#252f44", shoe: "#f3793b", shoeB: "#cf5f26", sole: "#fff", eye: "#2b2b2b",
    prop: "#b9997a", propD: "#9c7c5d", wall: "#ece4d8", floor: "rgba(36,50,71,.10)", cue: "#f3793b", focus: "#ff7a45"
  };
  const dir = (a) => [Math.sin(a * R), Math.cos(a * R)];
  const add = (p, v, l = 1) => [p[0] + v[0] * l, p[1] + v[1] * l];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const len = (v) => Math.hypot(v[0], v[1]);
  const unit = (v) => { const l = len(v) || 1e-6; return [v[0] / l, v[1] / l]; };
  const f1 = (n) => (Math.round(n * 10) / 10).toString();
  const pt = (p) => `${f1(p[0])},${f1(p[1])}`;

  /* Cinemática inversa de dos huesos. bend: +1 / -1 elige hacia qué lado se dobla */
  function ik(s, t, a, b, bend) {
    const v = sub(t, s);
    let d = len(v);
    d = Math.max(Math.abs(a - b) + 0.5, Math.min(a + b - 0.5, d));
    const base = Math.atan2(v[1], v[0]);
    const cosA = Math.max(-1, Math.min(1, (a * a + d * d - b * b) / (2 * a * d)));
    const ang = base + bend * Math.acos(cosA);
    const e = [s[0] + a * Math.cos(ang), s[1] + a * Math.sin(ang)];
    const w = add(s, unit(v), d);
    return [e, w];
  }

  /* ---------- Resolver la pose: devuelve las posiciones de las articulaciones ---------- */
  function solve(p) {
    const J = { view: p.view || "side" };
    const P = p.P, T = p.T ?? 180, H = p.H ?? T;
    J.P = P;
    J.N = add(P, dir(T), L.torso);
    J.HC = add(add(J.N, dir(H), L.neck), dir(H), L.head);
    J.H = H; J.T = T; J.rot = p.rot || 0;
    J.z = p.z || null; J.yaw = p.yaw || 0; J.yawA = p.yawA ?? true;
    if (J.view === "side") {
      J.S = add(P, dir(T), L.torso - 5);
      for (const k of ["B", "F"]) {
        const a = p["a" + k] || [0, 0];
        let E, W, fa;
        if (Array.isArray(a)) { E = add(J.S, dir(a[0]), L.ua); W = add(E, dir(a[1]), L.fa); }
        else if (a.E) { E = a.E; W = a.W; }
        else { [E, W] = ik(J.S, a.to, L.ua, L.fa, a.bend ?? 1); }
        fa = unit(sub(W, E));
        J["E" + k] = E; J["W" + k] = W; J["Hd" + k] = add(W, fa, 3);
        const g = p["l" + k] || [0, 0, 90];
        let K, A, ft;
        if (Array.isArray(g)) { K = add(P, dir(g[0]), L.th); A = add(K, dir(g[1]), L.sh); ft = g[2] ?? 90; }
        else {
          ft = g.ft ?? 90;
          const tgt = g.toe ? add(g.toe, dir(ft), -L.foot) : g.to;
          [K, A] = ik(P, tgt, L.th, L.sh, g.bend ?? -1);
        }
        J["K" + k] = K; J["A" + k] = A;
        J["Toe" + k] = add(A, dir(ft), L.foot); J["Heel" + k] = add(A, dir(ft), -L.heel);
      }
    } else {
      /* Vista frontal: lado L (izquierda de la pantalla) y R (derecha) */
      const sw = (p.sw ?? 14) * Math.cos((J.rot || 0) * R), hw = 9;
      J.back = !!p.back;
      const perp = [-Math.cos(T * R), Math.sin(T * R)]; // perpendicular al tronco (hacia la derecha si está erguido)
      const S0 = add(P, dir(T), L.torso - 5);
      J.SL = add(S0, perp, -sw); J.SR = add(S0, perp, sw);
      const PT = p.PT ?? T, pp = [-Math.cos(PT * R), Math.sin(PT * R)];
      J.HL = add(P, pp, -hw); J.HR = add(P, pp, hw);
      for (const k of ["L", "R"]) {
        const sgn = k === "L" ? -1 : 1, S = J["S" + k];
        const a = p["a" + k] || [6, 6];
        let E, W; J["dz" + k] = 1;
        if (a.E) { E = a.E; W = a.W; }
        else if (Array.isArray(a)) {
          const d0 = (ang) => [sgn * Math.sin(ang * R), Math.cos(ang * R)];
          E = add(S, d0(a[0]), L.ua); W = add(E, d0(a[1]), L.fa);
        } else { [E, W] = ik(S, a.to, L.ua, L.fa, (a.bend ?? 1) * -sgn); J["dz" + k] = a.dz ?? 1; }
        J["E" + k] = E; J["W" + k] = W; J["Hd" + k] = add(W, unit(sub(W, E)), 3);
        const g = p["l" + k] || [3, 2];
        const d0 = (ang) => [sgn * Math.sin(ang * R), Math.cos(ang * R)];
        const fs = g[2] ?? 1; // escorzo del muslo (sentado)
        const K = add(J["H" + k], d0(g[0]), L.th * fs);
        const A = add(K, d0(g[1]), L.sh * (g[3] ?? 1));
        J["K" + k] = K; J["A" + k] = A;
        J["Toe" + k] = add(A, [sgn * 0.55, 0.35], 9);
      }
    }
    return J;
  }

  /* ---------- Formas ---------- */
  function cap(a, b, ra, rb, fill, extra = "") {
    const v = sub(b, a), l = len(v) || 1e-6, n = [-v[1] / l, v[0] / l];
    const p1 = add(a, n, ra), p2 = add(b, n, rb), p3 = add(b, n, -rb), p4 = add(a, n, -ra);
    return `<path d="M${pt(p1)} L${pt(p2)} A${f1(rb)},${f1(rb)} 0 0 0 ${pt(p3)} L${pt(p4)} A${f1(ra)},${f1(ra)} 0 0 0 ${pt(p1)} Z" fill="${fill}"${extra}/>`;
  }
  const circ = (c, r, fill, extra = "") => `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${f1(r)}" fill="${fill}"${extra}/>`;

  function arm(S, E, W, Hd, back) {
    const sk = back ? C.skinB : C.skin, sh = back ? C.shirtB : C.shirt;
    const sleeveEnd = add(S, sub(E, S), 0.48);
    return cap(S, E, 5.3, 4.4, sk) + cap(E, W, 4.3, 3.3, sk) + circ(Hd, 4, sk) + cap(S, sleeveEnd, 6.4, 5.6, sh);
  }
  function leg(P, K, A, Toe, Heel, back) {
    const pa = back ? C.pantsB : C.pants, so = back ? C.shoeB : C.shoe;
    return cap(P, K, 8.6, 6.6, pa) + cap(K, A, 6.4, 4.6, pa) + cap(Heel, Toe, 4.4, 3.4, so) +
      `<path d="M${pt(add(Heel, unit(sub(Toe, Heel)), -1))} L${pt(Toe)}" stroke="${C.sole}" stroke-width="1.6" stroke-linecap="round" opacity=".8" transform="translate(0,3.2)"/>`;
  }

  function bodySide(J, ghost) {
    // «delante» de la cara: perpendicular a la cabeza (con H = 180, apunta a +x)
    const front = [-Math.cos(J.H * R), Math.sin(J.H * R)];
    const upv = dir(J.H);
    let s = "";
    s += arm(J.S, J.EB, J.WB, J.HdB, true);
    s += leg(J.P, J.KB, J.AB, J.ToeB, J.HeelB, true);
    // tronco
    s += cap(J.P, J.N, 10.5, 11.5, C.shirt);
    s += cap(J.P, add(J.P, dir(J.T), 9), 10.8, 10.6, C.pants);
    // cuello y cabeza
    s += cap(J.N, add(J.N, upv, 7), 4.6, 4.4, C.skin);
    s += circ(add(add(J.HC, front, -2.6), upv, 1.6), 12.2, C.hair);
    s += circ(add(J.HC, front, 1.4), 10.6, C.skin);
    s += circ(add(add(J.HC, front, 10.6), upv, -1.5), 2.3, C.skin);
    s += circ(add(add(J.HC, front, 5.6), upv, 1.8), 1.25, C.eye);
    s += circ(add(add(J.HC, front, -3.5), upv, -0.5), 2.6, C.skinB); // oreja
    s += leg(J.P, J.KF, J.AF, J.ToeF, J.HeelF, false);
    s += arm(J.S, J.EF, J.WF, J.HdF, false);
    return ghost ? s.replace(/fill="[^"]+"/g, 'fill="#8796ab"').replace(/stroke="[^"]+"/g, 'stroke="none"') : s;
  }

  function bodyFront(J, ghost) {
    const upv = dir(J.T);
    const shift = Math.sin((J.rot || 0) * R) * 5;
    let s = "";
    // piernas
    for (const k of ["L", "R"]) {
      s += cap(J["H" + k], J["K" + k], 8.2, 6.4, C.pants) + cap(J["K" + k], J["A" + k], 6.2, 4.6, C.pants) +
        cap(J["A" + k], J["Toe" + k], 4.6, 3.6, C.shoe);
    }
    // tronco
    const W1 = add(J.P, upv, 20), wl = add(add(J.HL, upv, 20), [1, 0], 1.5), wr = add(add(J.HR, upv, 20), [-1, 0], 1.5);
    s += `<path d="M${pt(add(J.SL, upv, 3))} Q${pt(add(add(J.SL, upv, 5), [8, 0]))} ${pt(add(add(J.SL, [J.SR[0] - J.SL[0], J.SR[1] - J.SL[1]], 0.5), upv, 6))} Q${pt(add(add(J.SR, upv, 5), [-8, 0]))} ${pt(add(J.SR, upv, 3))} L${pt(add(J.SR, upv, -3))} L${pt(wr)} L${pt(add(J.HR, [1, 0], 2))} L${pt(add(J.HL, [-1, 0], 2))} L${pt(wl)} L${pt(add(J.SL, upv, -3))} Z" fill="${C.shirt}"/>`;
    s += `<path d="M${pt(add(wl, upv, -10))} L${pt(add(wr, upv, -10))} L${pt(add(J.HR, [1, 0], 3))} L${pt(add(J.HL, [-1, 0], 3))} Z" fill="${C.pants}"/>`;
    void W1;
    // vista de espalda: omóplatos marcados y cabeza sin cara
    if (J.back) {
      const mid = add(J.P, upv, 38), gap = Math.max(3, (J.SR[0] - J.SL[0]) / 2 - 6);
      s += `<path d="M${pt(add(mid, [-gap, -6]))} q-5 8 0 16 M${pt(add(mid, [gap, -6]))} q5 8 0 16" stroke="${C.shirtB}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
      s += cap(J.N, add(J.N, upv, 7), 4.8, 4.6, C.skinB);
      s += circ(add(J.HC, upv, 0.5), 12.4, C.hair);
      s += circ(add(add(J.HC, [-11.5, 0]), upv, -1), 2.6, C.skinB) + circ(add(add(J.HC, [11.5, 0]), upv, -1), 2.6, C.skinB);
      for (const k of ["L", "R"]) s += arm(J["S" + k], J["E" + k], J["W" + k], J["Hd" + k], false);
      return ghost ? s.replace(/fill="[^"]+"/g, 'fill="#8796ab"').replace(/stroke="#[^"]+"/g, 'stroke="none"') : s;
    }
    // cuello y cabeza
    s += cap(J.N, add(J.N, upv, 7), 4.8, 4.6, C.skinB);
    const hc = add(J.HC, [shift, 0]);
    s += circ(add(hc, upv, 1.8), 12.4, C.hair);
    s += circ(add(hc, upv, -1.2), 10.6, C.skin);
    s += circ(add(add(hc, [-4 + shift * 0.4, 0]), upv, -1.5), 1.25, C.eye) + circ(add(add(hc, [4 + shift * 0.4, 0]), upv, -1.5), 1.25, C.eye);
    s += `<path d="M${pt(add(add(hc, [-3 + shift * 0.4, 0]), upv, -5.5))} Q${pt(add(add(hc, [shift * 0.4, 0]), upv, -7.8))} ${pt(add(add(hc, [3 + shift * 0.4, 0]), upv, -5.5))}" stroke="#a35d43" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
    // brazos (encima del tronco)
    for (const k of ["L", "R"]) s += arm(J["S" + k], J["E" + k], J["W" + k], J["Hd" + k], false);
    return ghost ? s.replace(/fill="[^"]+"/g, 'fill="#8796ab"').replace(/stroke="#[^"]+"/g, 'stroke="none"') : s;
  }

  const body = (J, ghost) => (J.view === "side" ? bodySide(J, ghost) : bodyFront(J, ghost));

  /* ---------- Atrezo ---------- */
  const PROPS = {
    // silla vista de lado, respaldo a la izquierda (x), asiento hacia la derecha
    chair: (x = 66) => `<g fill="none" stroke="${C.prop}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M${x} 98 V187"/><path d="M${x} 146 H${x + 44} V187"/></g>
      <rect x="${x - 3}" y="142" width="${50}" height="7" rx="3" fill="${C.propD}"/>`,
    // silla delante de la persona, de espaldas (respaldo cerca de las manos)
    chairFront: (x = 132) => `<g fill="none" stroke="${C.prop}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M${x} 96 V187"/><path d="M${x} 146 H${x + 40} V187"/></g>
      <rect x="${x - 3}" y="142" width="46" height="7" rx="3" fill="${C.propD}"/><rect x="${x - 4}" y="93" width="8" height="10" rx="3" fill="${C.propD}"/>`,
    // silla vista de frente, detrás de la persona sentada
    chairBack: () => `<g fill="${C.prop}"><rect x="76" y="70" width="48" height="66" rx="6" opacity=".55"/><rect x="70" y="134" width="60" height="8" rx="3" fill="${C.propD}"/>
      <rect x="74" y="140" width="5" height="47" rx="2"/><rect x="121" y="140" width="5" height="47" rx="2"/></g>`,
    // silla vista de frente al lado (para apoyar la mano)
    chairSide: (x = 140) => `<g fill="${C.prop}"><rect x="${x}" y="96" width="34" height="48" rx="5" opacity=".75"/><rect x="${x - 4}" y="142" width="42" height="8" rx="3" fill="${C.propD}"/>
      <rect x="${x - 1}" y="148" width="5" height="39" rx="2"/><rect x="${x + 30}" y="148" width="5" height="39" rx="2"/></g>`,
    chairRev: (x = 134) => `<g fill="none" stroke="${C.prop}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M${x + 44} 98 V187"/><path d="M${x + 44} 146 H${x} V187"/></g>
      <rect x="${x - 3}" y="142" width="50" height="7" rx="3" fill="${C.propD}"/>`,
    chairFar: (x = 96) => `<g fill="${C.prop}" opacity=".6"><rect x="${x - 20}" y="96" width="40" height="48" rx="5"/><rect x="${x - 22}" y="142" width="44" height="7" rx="3"/>
      <rect x="${x - 19}" y="148" width="5" height="39" rx="2"/><rect x="${x + 14}" y="148" width="5" height="39" rx="2"/></g>`,
    stool: (x = 80) => `<g fill="${C.prop}"><rect x="${x - 20}" y="142" width="40" height="7" rx="3" fill="${C.propD}"/>
      <rect x="${x - 17}" y="148" width="5" height="39" rx="2"/><rect x="${x + 12}" y="148" width="5" height="39" rx="2"/></g>`,
    book: (x = 112) => `<rect x="${x - 14}" y="181" width="28" height="7" rx="1.5" fill="#7a4b8c"/>`,
    box: (x = 172, h = 40) => `<rect x="${x - 16}" y="${188 - h}" width="32" height="${h}" rx="3" fill="${C.prop}"/>`,
    bench: (x = 172) => `<g fill="${C.propD}"><rect x="${x - 22}" y="156" width="44" height="5" rx="2"/><rect x="${x - 20}" y="160" width="4" height="27"/><rect x="${x + 16}" y="160" width="4" height="27"/></g>`,
    wall: (x = 176) => `<rect x="${x}" y="14" width="20" height="173" fill="${C.wall}"/><rect x="${x}" y="14" width="3" height="173" fill="#d9cdbb"/>`
  };

  /* ---------- Interpolación ---------- */
  const lerp = (a, b, t) => {
    if (typeof a === "number") return a + (b - a) * t;
    if (Array.isArray(a)) return a.map((x, i) => lerp(x, b[i], t));
    if (a && typeof a === "object") { const o = {}; for (const k in a) o[k] = (b && k in b) ? lerp(a[k], b[k], t) : a[k]; return o; }
    return a;
  };
  const ease = (x) => x * x * (3 - 2 * x);

  /* frames: [{pose, t (ms de transición hacia este), hold (ms)}] */
  function poseAt(frames, ms) {
    const total = frames.reduce((s, f) => s + (f.t || 700) + (f.hold || 0), 0);
    let x = ms % total;
    for (let i = 0; i < frames.length; i++) {
      const f = frames[i], prev = frames[(i - 1 + frames.length) % frames.length];
      const tt = f.t || 700;
      if (x < tt) return lerp(prev.pose, f.pose, ease(x / tt));
      x -= tt;
      if (x < (f.hold || 0)) return f.pose;
      x -= f.hold || 0;
    }
    return frames[0].pose;
  }

  /* ---------- Componer el SVG ---------- */
  let uid = 0;
  function create(ex, opts = {}) {
    const id = "fg" + (++uid);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 200 200");
    svg.setAttribute("class", "fig" + (opts.big ? " fig--big" : ""));
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Ilustración animada: " + ex.t);
    const frames = ex.frames;
    const peak = frames[ex.peak ?? Math.min(1, frames.length - 1)].pose;
    const first = frames[0].pose;
    const Jp = solve(peak), J0 = solve(first);
    // flecha de dirección
    let cue = "";
    if (ex.cuePaths) {
      cue = ex.cuePaths.map((d) => `<path d="${d}" fill="none" stroke="${C.cue}" stroke-width="2.6" stroke-dasharray="5 4" stroke-linecap="round" marker-end="url(#${id}-ar)" opacity=".9"/>`).join("");
    } else if (ex.cue) {
      const a = add(J0[ex.cue.j], ex.cue.off || [0, 0]), b = add(Jp[ex.cue.j], ex.cue.off || [0, 0]);
      const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], v = sub(b, a), n = unit([-v[1], v[0]]);
      const c = add(m, n, (ex.cue.bow ?? 14));
      cue = `<path d="M${pt(a)} Q${pt(c)} ${pt(b)}" fill="none" stroke="${C.cue}" stroke-width="2.6" stroke-dasharray="5 4" stroke-linecap="round" marker-end="url(#${id}-ar)" opacity=".9"/>`;
    }
    const props = (ex.props || []).map((p) => { const [n, ...a] = Array.isArray(p) ? p : [p]; return PROPS[n] ? PROPS[n](...a) : ""; }).join("");
    svg.innerHTML = `<defs>
        <marker id="${id}-ar" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${C.cue}"/></marker>
        <radialGradient id="${id}-fo"><stop offset="0" stop-color="${C.focus}" stop-opacity=".55"/><stop offset="1" stop-color="${C.focus}" stop-opacity="0"/></radialGradient>
      </defs>
      <ellipse cx="105" cy="188" rx="78" ry="6" fill="${C.floor}"/>
      ${props}
      <g opacity=".16">${ex.noGhost ? "" : body(Jp, true)}</g>
      <g class="fig-body"></g>
      <g class="fig-focus" style="mix-blend-mode:multiply"></g>
      ${cue}`;
    const gBody = svg.querySelector(".fig-body"), gFocus = svg.querySelector(".fig-focus");
    function draw(ms) {
      const pose = typeof ms === "number" ? poseAt(frames, ms) : (ms && ms.P ? ms : peak);
      const J = solve(pose);
      gBody.innerHTML = body(J, false) + (ex.stick ? (() => { const a = J.HdB || J.HdL, b = J.HdF || J.HdR, v = unit(sub(b, a));
        return `<path d="M${pt(add(a, v, -14))} L${pt(add(b, v, 14))}" stroke="#8a5a35" stroke-width="3" stroke-linecap="round"/>`; })() : "");
      if (ex.focus) {
        const c = add(J[ex.focus.j], ex.focus.off || [0, 0]);
        gFocus.innerHTML = circ(c, ex.focus.r || 14, `url(#${id}-fo)`);
      }
    }
    draw(0);
    return { svg, draw };
  }

  /* ---------- Bucle de animación compartido ---------- */
  const live = [];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => es.forEach((e) => {
    const f = live.find((x) => x.svg === e.target); if (f) f.visible = e.isIntersecting;
  })) : null;
  let last = 0;
  function loop(ms) {
    if (ms - last > 30) { // ~30 fps
      last = ms;
      for (const f of live) if (f.visible && f.svg.isConnected) f.draw(ms);
    }
    requestAnimationFrame(loop);
  }
  if (!reduce) requestAnimationFrame(loop);

  function mount(ex, opts) {
    const f = create(ex, opts);
    f.visible = true;
    if (reduce) f.draw(null); // sin animación: muestra la posición clave
    else { live.push(f); io && io.observe(f.svg); }
    return f.svg;
  }
  function unmount(svg) { const i = live.findIndex((f) => f.svg === svg); if (i >= 0) live.splice(i, 1); }

  window.Figura = { mount, unmount, solve, create, poseAt, PROPS, L };
})();
