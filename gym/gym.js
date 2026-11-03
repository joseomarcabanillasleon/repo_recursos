/* =====================================================================
   Gimnasia para todos · guía interactiva
   - Figuras animadas propias (SVG generado a partir de poses)
   - Ejercicios, filtros, sesión guiada con temporizador
   - Test del habla, mi semana, cartel de invitación
   ===================================================================== */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } }
  };
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------
     EJERCICIOS (contenido de la guía «Gimnasia para todos»)
     Los movimientos de cada figura están en movimientos.js
     ------------------------------------------------------------------ */
  const EJ = [
    { id: "marcha", n: 1, t: "Marcha cómoda", cat: ["cardio"], pos: ["sentado", "pie"], dosis: "45–60 segundos", dur: 90,
      como: "De pie detrás de la silla o sentado, alterna levantar los pies como si caminaras. Mantén el tronco erguido y pisa con suavidad.",
      facil: "Marcha sentado, levantando un pie cada vez.",
      porque: "Calienta el cuerpo, sube un poco el pulso y prepara las articulaciones para el resto de la sesión." },
    { id: "brazos", n: 2, t: "Brazos que se abren", cat: ["movilidad"], pos: ["sentado", "pie"], dosis: "6–10 repeticiones",
      como: "Deja los brazos junto al cuerpo. Súbelos hacia los lados hasta una altura cómoda y bájalos lentamente, sin encoger los hombros.",
      facil: "Sube solo hasta media altura. Inspira al abrir y suelta el aire al bajar.",
      porque: "Mantiene la movilidad de los hombros, que usamos para vestirnos, peinarnos o alcanzar objetos." },
    { id: "omoplatos", n: 3, t: "Juntar omóplatos", cat: ["movilidad", "fuerza"], pos: ["sentado", "pie"], dosis: "8–10 repeticiones · 2 s",
      como: "Con los brazos relajados, lleva suavemente los hombros hacia atrás y acerca los omóplatos, sin arquear la espalda. Mantén 2 segundos y relaja.",
      facil: "Hazlo sentado y con un movimiento más pequeño.",
      porque: "Fortalece los músculos de la espalda alta y ayuda a compensar las horas con los hombros hacia delante." },
    { id: "giro", n: 4, t: "Giro sentado, corto y cómodo", cat: ["movilidad"], pos: ["sentado"], dosis: "5–8 por lado",
      como: "Siéntate con los pies apoyados y los brazos cruzados sobre el pecho. Gira el tronco un poco hacia un lado, vuelve al centro y cambia. Mantén la pelvis estable y no tires del cuello.",
      facil: "Deja las manos sobre los muslos y gira menos.",
      porque: "Da movilidad a la columna de forma suave. El movimiento nunca debe provocar dolor." },
    { id: "levantarse", n: 5, t: "Levantarse y sentarse", cat: ["fuerza"], pos: ["pie"], dosis: "5–8 repeticiones",
      como: "Siéntate cerca del borde de una silla firme, con los pies debajo de las rodillas. Inclina ligeramente el tronco hacia delante y ponte de pie; vuelve a sentarte despacio.",
      facil: "Usa las manos en los muslos o en los apoyabrazos, o practica solo despegarte un poco del asiento. Que la silla no se deslice.",
      porque: "Es uno de los gestos más útiles del día a día: fortalece piernas y glúteos y ayuda a mantener la autonomía." },
    { id: "talones", n: 6, t: "Elevación de talones", cat: ["fuerza", "equilibrio"], pos: ["pie"], dosis: "8–12 repeticiones",
      como: "De pie, sujeta la silla con una o dos manos. Eleva los talones, haz una pausa breve y bájalos de forma controlada.",
      facil: "Eleva solo un poco los talones o hazlo sentado.",
      porque: "Fortalece las pantorrillas, que ayudan a caminar con seguridad y a recuperar el equilibrio." },
    { id: "rodilla", n: 7, t: "Extensión de rodilla sentado", cat: ["fuerza"], pos: ["sentado"], dosis: "6–10 por pierna",
      como: "Sentado con la espalda cómoda, estira una rodilla hasta donde resulte fácil; baja el pie lentamente y cambia de pierna. No bloquees la rodilla ni balancees la pierna.",
      facil: "Estira solo a medias y descansa entre repeticiones.",
      porque: "Trabaja el músculo de delante del muslo (cuádriceps), clave para subir escaleras y levantarse." },
    { id: "pared", n: 8, t: "Empujes contra la pared", cat: ["fuerza"], pos: ["pie"], dosis: "6–10 repeticiones",
      como: "Coloca las manos en la pared a la altura del pecho, algo más abiertas que los hombros. Da un pequeño paso atrás, flexiona los codos acercando el pecho a la pared y empuja para volver. Mantén el cuerpo alineado.",
      facil: "Acércate más a la pared. Sustituye a las flexiones en el suelo.",
      porque: "Fortalece pecho, hombros y brazos sin cargar las muñecas ni la espalda como en el suelo." },
    { id: "paso", n: 9, t: "Paso atrás con apoyo", cat: ["fuerza", "equilibrio"], pos: ["pie"], dosis: "6–8 por lado",
      como: "De pie detrás de la silla, sujétala. Lleva un pie hacia atrás y toca el suelo con la punta; vuelve al centro y cambia. Mantén el paso corto y el tronco estable.",
      facil: "Mueve el pie solo unos centímetros. No hace falta bajar a una zancada profunda.",
      porque: "Entrena el control de la pierna de apoyo y la capacidad de dar un paso para no perder el equilibrio." },
    { id: "lado", n: 10, t: "Pierna hacia el lado", cat: ["fuerza", "equilibrio"], pos: ["pie"], dosis: "6–10 por lado",
      como: "Sujeta la silla con una mano. Lleva una pierna recta unos centímetros hacia el lado, sin inclinar el cuerpo ni girar el pie; vuelve despacio. Cambia de mano para mantener el apoyo.",
      facil: "Levanta la pierna muy poco, casi deslizando el pie.",
      porque: "Fortalece la cadera por fuera, que estabiliza la pelvis al caminar." },
    { id: "rodillas", n: 11, t: "Elevación alterna de rodillas", cat: ["fuerza", "cardio"], pos: ["sentado", "pie"], dosis: "6–10 por pierna",
      como: "Sentado o de pie con apoyo, eleva una rodilla unos centímetros y bájala; cambia de lado. Mantén la espalda cómoda y respira con normalidad.",
      facil: "Sentado, levanta solo el talón y la punta del pie.",
      porque: "Activa los flexores de la cadera y el abdomen, que intervienen al subir escalones." },
    { id: "equilibrio", n: 12, t: "Equilibrio con apoyo cercano", cat: ["equilibrio"], pos: ["pie"], dosis: "10–20 segundos por lado", dur: 90,
      como: "De pie junto a la silla o a una pared, coloca un pie ligeramente delante del otro. Mantén la posición y cambia los pies. Mira al frente y deja una mano cerca del apoyo.",
      facil: "Separa más los pies. No cierres los ojos ni sueltes el apoyo si tienes inestabilidad.",
      porque: "El equilibrio se entrena: practicarlo con seguridad ayuda a prevenir caídas." }
  ];
  const CALMA = { id: "calma", t: "Vuelta a la calma" };
  const BYID = Object.fromEntries(EJ.map((e) => [e.id, e]));
  const CATS = { fuerza: "Fuerza", movilidad: "Movilidad", equilibrio: "Equilibrio", cardio: "Cardio suave" };

  /* Figura animada realista (figura.js + movimientos.js) */
  /* Primero se dibuja la ilustración SVG; cuando el motor 3D está listo,
     se sustituye por la persona en 3D (figura3d.js). */
  const pending3d = [];
  function figure(ex, big) {
    const data = Object.assign({}, window.MOV[ex.id], { t: ex.t, id: ex.id });
    const box = document.createElement("div");
    box.className = "fig-box" + (big ? " fig-box--big" : "");
    box._data = data; box._big = !!big;
    box.appendChild(window.Figura.mount(data, { big }));
    pending3d.push(box); upgrade3d();
    return box;
  }
  function upgrade3d() {
    if (!window.Figura3D) return;
    while (pending3d.length) {
      const box = pending3d.shift(), svg = box.querySelector("svg");
      if (svg) window.Figura.unmount(svg);
      window.Figura3D.mount(box, box._data, { big: box._big });
    }
  }
  window.addEventListener("figura3d-ready", upgrade3d);
  function dropFigure(box) {
    if (!box) return;
    window.Figura3D?.unmount(box);
    const svg = box.querySelector("svg"); if (svg) window.Figura.unmount(svg);
    const i = pending3d.indexOf(box); if (i >= 0) pending3d.splice(i, 1);
  }

  /* ------------------------------------------------------------------
     TARJETAS DE EJERCICIOS
     ------------------------------------------------------------------ */
  const sel = new Set(store.get("gym-sel", ["marcha", "brazos", "omoplatos", "levantarse", "talones", "pared", "equilibrio"]));
  const grid = $("#ex-grid");
  EJ.forEach((e) => {
    const card = document.createElement("article");
    card.className = "ex";
    card.id = "ej-" + e.id;
    card.dataset.cat = e.cat.join(" ");
    card.dataset.pos = e.pos.join(" ");
    card.innerHTML = `
      <div class="ex__fig"><span class="ex__n">${e.n}</span></div>
      <div class="ex__body">
        <div class="ex__tags">${e.cat.map((c) => `<span class="tag tag--${c}">${CATS[c]}</span>`).join("")}
          <span class="tag tag--pos">${e.pos.map((p) => p === "pie" ? "De pie con apoyo" : "Sentado").join(" · ")}</span></div>
        <h3>${esc(e.t)}</h3>
        <p class="ex__dose">⏱ ${esc(e.dosis)}</p>
        <p>${esc(e.como)}</p>
        <details><summary>Más fácil y por qué sirve</summary>
          <p><strong>Más fácil:</strong> ${esc(e.facil)}</p>
          <p><strong>Para qué sirve:</strong> ${esc(e.porque)}</p>
        </details>
        <label class="pick"><input type="checkbox" value="${e.id}" ${sel.has(e.id) ? "checked" : ""}> En mi sesión</label>
      </div>`;
    $(".ex__fig", card).prepend(figure(e));
    grid.appendChild(card);
  });

  // Filtros
  let fCat = "", fPos = "";
  function applyFilter() {
    $$(".ex", grid).forEach((c) => {
      const ok = (!fCat || c.dataset.cat.includes(fCat)) && (!fPos || c.dataset.pos.includes(fPos));
      c.hidden = !ok;
    });
    $$("#ex-filters [data-cat]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.cat === fCat)));
    $$("#ex-filters [data-pos]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.pos === fPos)));
  }
  $("#ex-filters").addEventListener("click", (ev) => {
    const b = ev.target.closest("button"); if (!b) return;
    if ("cat" in b.dataset) fCat = b.dataset.cat === fCat ? "" : b.dataset.cat;
    if ("pos" in b.dataset) fPos = b.dataset.pos === fPos ? "" : b.dataset.pos;
    applyFilter();
  });
  applyFilter();

  // Selección para la sesión
  function syncSel() {
    store.set("gym-sel", [...sel]);
    $$(".pick input", grid).forEach((i) => { i.checked = sel.has(i.value); i.closest(".ex").classList.toggle("is-picked", i.checked); });
    const n = sel.size, min = Math.round(4 + n * 2 + 5);
    $("#sel-count").textContent = n ? `${n} ejercicio${n === 1 ? "" : "s"} · unos ${min} minutos` : "Elige al menos un ejercicio";
    $("#start").disabled = !n;
    $$("[data-preset]").forEach((b) => b.setAttribute("aria-pressed", "false"));
  }
  grid.addEventListener("change", (ev) => {
    const i = ev.target.closest(".pick input"); if (!i) return;
    i.checked ? sel.add(i.value) : sel.delete(i.value); syncSel();
  });
  const PRESETS = {
    sentado: ["marcha", "brazos", "omoplatos", "giro", "rodilla", "rodillas"],
    pie: ["marcha", "brazos", "levantarse", "talones", "pared", "paso", "lado", "equilibrio"],
    mixto: ["marcha", "brazos", "omoplatos", "levantarse", "talones", "pared", "equilibrio"]
  };
  $$("[data-preset]").forEach((b) => b.addEventListener("click", () => {
    sel.clear(); PRESETS[b.dataset.preset].forEach((id) => sel.add(id)); syncSel();
    b.setAttribute("aria-pressed", "true");
  }));
  syncSel();

  /* ------------------------------------------------------------------
     SESIÓN GUIADA
     ------------------------------------------------------------------ */
  const ov = $("#session");
  let steps = [], idx = 0, left = 0, paused = false, tick = null, wake = null, sFig = null;
  function buildSteps() {
    const chosen = EJ.filter((e) => sel.has(e.id));
    steps = [{ ex: BYID.marcha, title: "Activación", text: "Marcha suave en el sitio o sentado. Mueve los hombros y abre y cierra las manos.", dose: "4 minutos", dur: 240, warm: true }]
      .concat(chosen.map((e) => ({ ex: e, title: e.t, text: e.como, dose: e.dosis, easy: e.facil, dur: e.dur || 120 })))
      .concat([{ ex: CALMA, title: "Vuelta a la calma", text: "Camina despacio, respira con calma y haz estiramientos suaves, sin rebotes ni dolor.", dose: "5 minutos", dur: 300 }]);
  }
  let actx = null;
  function beep(f = 880, d = 0.18) {
    if (!$("#snd").checked) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain();
      o.frequency.value = f; o.connect(g); g.connect(actx.destination);
      g.gain.setValueAtTime(0.0001, actx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.25, actx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + d);
      o.start(); o.stop(actx.currentTime + d + 0.02);
    } catch { /* sin audio */ }
  }
  const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  function renderStep() {
    const s = steps[idx];
    $("#s-count").textContent = `Paso ${idx + 1} de ${steps.length}`;
    $("#s-bar").style.width = `${(idx / (steps.length - 1)) * 100}%`;
    $("#s-title").textContent = s.title;
    $("#s-text").textContent = s.text;
    $("#s-dose").textContent = s.dose;
    $("#s-easy").hidden = !s.easy;
    $("#s-easy").innerHTML = s.easy ? `<strong>Más fácil:</strong> ${esc(s.easy)}` : "";
    const nx = steps[idx + 1];
    $("#s-next").textContent = nx ? `Siguiente: ${nx.title}` : "Último paso";
    const box = $("#s-fig"); box.innerHTML = "";
    dropFigure(sFig);
    sFig = figure(s.ex, true); box.appendChild(sFig);
    $("#s-prev").disabled = idx === 0;
    $("#s-skip").textContent = nx ? "Siguiente ⏭" : "Terminar ✓";
    left = s.dur; paused = false; updTimer();
  }
  function updTimer() {
    const s = steps[idx], frac = s ? left / s.dur : 0;
    $("#s-time").textContent = mmss(left);
    $("#s-ring").style.strokeDashoffset = String(339.3 * (1 - frac));
    $("#s-pause").textContent = paused ? "▶ Seguir" : "⏸ Pausa";
  }
  function next() {
    if (idx < steps.length - 1) { idx++; beep(988); renderStep(); }
    else finish();
  }
  function finish() {
    beep(1175, 0.3);
    stopSession(false);
    markToday();
    $("#done").hidden = false;
    $("#done").scrollIntoView({ behavior: "smooth", block: "center" });
    window.track?.("gym/sesion-completada", "Sesión de gimnasia completada");
  }
  async function startSession() {
    buildSteps(); idx = 0;
    ov.hidden = false; document.body.classList.add("no-scroll");
    renderStep(); beep(660);
    clearInterval(tick);
    tick = setInterval(() => {
      if (paused) return;
      left = Math.max(0, left - 1);
      if (left <= 3 && left > 0) beep(520, 0.08);
      updTimer();
      if (left === 0) next();
    }, 1000);
    try { wake = await navigator.wakeLock?.request("screen"); } catch { wake = null; }
    $("#s-close").focus();
    window.track?.("gym/sesion-iniciada", "Sesión de gimnasia iniciada");
  }
  function stopSession(focusBack = true) {
    clearInterval(tick); tick = null;
    ov.hidden = true; document.body.classList.remove("no-scroll");
    try { wake?.release(); } catch { /* nada */ } wake = null;
    if (focusBack) $("#start").focus();
  }
  $("#start").addEventListener("click", startSession);
  $("#s-close").addEventListener("click", () => stopSession());
  $("#s-pause").addEventListener("click", () => { paused = !paused; updTimer(); });
  $("#s-skip").addEventListener("click", next);
  $("#s-prev").addEventListener("click", () => { if (idx > 0) { idx--; renderStep(); } });
  $("#s-plus").addEventListener("click", () => { left += 15; steps[idx].dur = Math.max(steps[idx].dur, left); updTimer(); });
  document.addEventListener("keydown", (e) => {
    if (ov.hidden) return;
    if (e.key === "Escape") stopSession();
    if (e.key === " ") { e.preventDefault(); paused = !paused; updTimer(); }
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft" && idx > 0) { idx--; renderStep(); }
  });

  /* ------------------------------------------------------------------
     TEST DEL HABLA
     ------------------------------------------------------------------ */
  const RPE = [
    [0, 2, "Muy suave", "Puedes cantar sin problema. Perfecto para calentar o volver a la calma.", "lo"],
    [3, 4, "Suave", "Hablas con total normalidad. Buen punto de partida si llevas tiempo sin moverte.", "lo"],
    [5, 6, "Moderada ✓", "Puedes hablar, pero no cantar. Es la intensidad recomendada para la mayoría de la actividad semanal.", "ok"],
    [7, 8, "Vigorosa", "Solo dices frases cortas. Útil en personas entrenadas; en esta guía no hace falta llegar aquí.", "hi"],
    [9, 10, "Máxima", "No puedes hablar. Baja el ritmo: esta sesión no busca este nivel.", "max"]
  ];
  const r = $("#rpe");
  function updRpe() {
    const v = +r.value, x = RPE.find(([a, b]) => v >= a && v <= b);
    $("#rpe-v").textContent = v;
    $("#rpe-t").textContent = x[2];
    $("#rpe-d").textContent = x[3];
    $("#rpe-card").dataset.lvl = x[4];
  }
  r.addEventListener("input", updRpe); updRpe();

  /* ------------------------------------------------------------------
     MI SEMANA (se guarda solo en este navegador)
     ------------------------------------------------------------------ */
  const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  function weekKey(d = new Date()) {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
    const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return `gym-week-${t.getUTCFullYear()}-${Math.ceil(((t - y0) / 864e5 + 1) / 7)}`;
  }
  const todayIdx = (new Date().getDay() + 6) % 7;
  let week = store.get(weekKey(), [0, 0, 0, 0, 0, 0, 0]);
  const LV = ["", "move", "str"]; // 0 nada · 1 me moví · 2 fuerza
  function renderWeek() {
    $("#week").innerHTML = DIAS.map((d, i) => `
      <button type="button" class="day day--${LV[week[i]] || "none"} ${i === todayIdx ? "is-today" : ""}" data-i="${i}"
        aria-label="${d}: ${["sin registrar", "me moví", "hice fuerza"][week[i]]}">
        <span>${d}</span><b>${["·", "🚶", "💪"][week[i]]}</b></button>`).join("");
    const moved = week.filter(Boolean).length, str = week.filter((v) => v === 2).length;
    $("#week-sum").innerHTML = `Días activos: <strong>${moved}/7</strong> · Días de fuerza: <strong>${str}</strong>` +
      (str >= 2 ? " · ¡Objetivo de fuerza cumplido! 🎉" : ` · Te falta${2 - str === 1 ? "" : "n"} ${2 - str} para el objetivo de fuerza`);
  }
  $("#week").addEventListener("click", (e) => {
    const b = e.target.closest(".day"); if (!b) return;
    const i = +b.dataset.i; week[i] = (week[i] + 1) % 3; store.set(weekKey(), week); renderWeek();
  });
  function markToday() { week[todayIdx] = 2; store.set(weekKey(), week); renderWeek(); }
  renderWeek();

  /* ------------------------------------------------------------------
     CHECKLIST DE SEGURIDAD
     ------------------------------------------------------------------ */
  const chk = $$("#safety input");
  const updSafe = () => {
    const n = chk.filter((c) => c.checked).length;
    $("#safe-state").textContent = n === chk.length ? "✓ Todo listo. ¡A moverse!" : `${n} de ${chk.length} comprobados`;
    $("#safe-state").classList.toggle("is-ok", n === chk.length);
  };
  chk.forEach((c) => c.addEventListener("change", updSafe)); updSafe();

  /* ------------------------------------------------------------------
     CARTEL DE INVITACIÓN
     ------------------------------------------------------------------ */
  const INV = store.get("gym-inv", { lugar: "", cuando: "", contacto: "" });
  ["lugar", "cuando", "contacto"].forEach((k) => {
    const i = $("#inv-" + k); i.value = INV[k] || "";
    i.addEventListener("input", () => { INV[k] = i.value; store.set("gym-inv", INV); renderInv(); });
  });
  const val = (k, d) => (INV[k] || "").trim() || d;
  function renderInv() {
    $("#p-lugar").textContent = val("lugar", "[Lugar]");
    $("#p-cuando").textContent = val("cuando", "[Día y hora]");
    $("#p-contacto").textContent = val("contacto", "[Contacto]");
  }
  renderInv();
  const pageUrl = location.origin + location.pathname;
  function invText() {
    return `🌿 *Gimnasia para todos* — encuentro comunitario de gimnasia suave\n\n` +
      `¿Te gustaría moverte un poco más y hacerlo acompañado? Ejercicios sencillos de movilidad, fuerza y equilibrio, con opciones sentado y de pie, pausas y un ambiente de apoyo. No necesitas experiencia ni material: solo ropa cómoda, agua y ganas de participar a tu ritmo.\n\n` +
      `📍 ${val("lugar", "[Lugar]")}\n🗓 ${val("cuando", "[Día y hora]")}\n📞 ${val("contacto", "[Contacto]")}\n\n` +
      `Si tienes una lesión o una condición de salud, consulta antes con tu profesional sanitario.\nGuía: ${pageUrl}\n\nVen como eres; empezamos paso a paso.`;
  }
  function toast(msg) {
    const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; t.setAttribute("role", "status");
    document.body.appendChild(t); setTimeout(() => t.remove(), 2200);
  }
  $("#inv-copy").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(invText()); toast("Texto copiado: pégalo en WhatsApp"); }
    catch { prompt("Copia este texto:", invText()); }
    window.track?.("gym/invitacion-copiada", "Invitación copiada");
  });
  $("#inv-wa").addEventListener("click", () => {
    window.open("https://wa.me/?text=" + encodeURIComponent(invText()), "_blank", "noopener");
    window.track?.("gym/invitacion-whatsapp", "Invitación por WhatsApp");
  });
  $("#inv-print").addEventListener("click", () => {
    document.body.classList.add("print-poster"); window.print();
    setTimeout(() => document.body.classList.remove("print-poster"), 500);
    window.track?.("gym/cartel-impreso", "Cartel impreso");
  });
  window.addEventListener("afterprint", () => document.body.classList.remove("print-poster"));
  $("#poster-fig").appendChild(figure(BYID.brazos));

  /* Figuras decorativas de la portada y de los mitos */
  $("#hero-fig-1").appendChild(figure(BYID.levantarse));
  $("#hero-fig-2").appendChild(figure(BYID.talones));
  $("#hero-fig-3").appendChild(figure(BYID.pared));

  /* Mitos: tarjetas que se giran */
  $$(".myth").forEach((m) => m.addEventListener("click", () => {
    const on = m.getAttribute("aria-pressed") !== "true";
    m.setAttribute("aria-pressed", String(on));
  }));

  /* Tema (compartido con el resto de la web) */
  try { const t = localStorage.getItem("theme"); if (t) document.documentElement.dataset.theme = t; } catch { /* nada */ }
  $(".theme-toggle").addEventListener("click", () => {
    const d = document.documentElement.dataset.theme
      ? document.documentElement.dataset.theme === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches;
    const n = d ? "light" : "dark";
    document.documentElement.dataset.theme = n;
    try { localStorage.setItem("theme", n); } catch { /* nada */ }
  });
})();
