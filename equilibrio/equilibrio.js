/* =====================================================================
   Vivir con equilibrio · guía interactiva
   Pantallas (AEP 2025, OMS 2019), plan digital familiar, alternativas,
   tabaco (beneficios OMS, calculadora de ahorro), alcohol (UBE, Sanidad).
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
  const num = (v) => parseFloat(String(v).replace(",", ".")) || 0;
  const eur = (v) => v.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  /* ------------------------------------------------------------------
     1. PANTALLAS SEGÚN LA EDAD (AEP; OMS para menores de 5)
     ------------------------------------------------------------------ */
  const AGE = {
    "0-2": { t: "De 0 a 2 años", lema: "Cuantas menos pantallas, mejor.", who: "OMS: antes del año, nada de pantallas; a los 2 años, no más de 1 hora al día (cuanto menos, mejor).",
      list: ["Priorizar el juego, el movimiento y la interacción con otras personas.", "No usar las pantallas para calmar, dar de comer o entretener.", "Proteger las comidas y las horas antes de dormir.", "Las videollamadas con la familia pueden ser una excepción, siempre con un adulto."] },
    "3-5": { t: "De 3 a 5 años", lema: "Poco tiempo y siempre acompañados.", who: "OMS: no más de 1 hora al día de pantalla sentado; cuanto menos, mejor.",
      list: ["Contenidos educativos, adecuados a la edad y sin ritmos muy rápidos.", "Ver los contenidos juntos siempre que se pueda.", "Momentos y espacios sin pantallas.", "Priorizar el juego libre, la actividad física, los cuentos y las actividades en familia."] },
    "6-12": { t: "De 6 a 12 años", lema: "Límites claros y acompañamiento.",
      list: ["Pactar horarios y normas de uso.", "Que las pantallas no desplacen el sueño, el deporte, el estudio, el juego o la familia.", "Supervisar contenidos, videojuegos y aplicaciones.", "Ningún dispositivo en la habitación por la noche.", "Hablar de privacidad, publicidad, ciberacoso y seguridad digital.", "Retrasar todo lo posible el teléfono inteligente y las redes sociales."] },
    "13+": { t: "Adolescencia", lema: "Acompañar hacia la autonomía.",
      list: ["Pactar límites y revisarlos juntos.", "Proteger el sueño: el móvil fuera de la habitación por la noche.", "Hablar de redes sociales, FOMO, ciberacoso, pornografía, sexting y privacidad.", "Ayudar a detectar contenidos falsos o manipuladores.", "Estar atentos a cambios de sueño, ánimo, notas o amistades.", "Educar desde la confianza, no solo desde el control."] }
  };
  let age = store.get("eq-age", "6-12");
  function renderAge() {
    const a = AGE[age];
    $$("#ages button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.age === age)));
    $("#age-out").innerHTML = `<h3>${esc(a.t)}: <span>${esc(a.lema)}</span></h3>
      <ul>${a.list.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
      ${a.who ? `<p class="who">📏 ${esc(a.who)}</p>` : ""}
      <p class="who">👀 A todas las edades: nuestro ejemplo es la herramienta educativa más importante.</p>`;
    store.set("eq-age", age); renderAlt();
  }
  $("#ages").addEventListener("click", (e) => { const b = e.target.closest("button[data-age]"); if (b) { age = b.dataset.age; renderAge(); } });

  /* Calculadora de tiempo de pantalla (aritmética) */
  function calcScreen() {
    const h = num($("#s-h").value);
    if (!h) { $("#s-out").innerHTML = `<p class="muted">Escribe las horas de pantalla de un día normal (sin contar el trabajo o el estudio obligatorio).</p>`; return; }
    const week = h * 7, yearDays = (h * 365) / 24, awake = (h / 16) * 100;
    $("#s-out").innerHTML = `<div class="big3">
      <div><b>${week.toLocaleString("es-ES", { maximumFractionDigits: 1 })} h</b><span>a la semana</span></div>
      <div><b>${Math.round(yearDays)} días</b><span>enteros al año</span></div>
      <div><b>${Math.round(awake)} %</b><span>del tiempo despierto*</span></div></div>
      <p class="muted small">*Suponiendo unas 16 horas despierto al día. Con solo 30 minutos menos al día recuperas ${Math.round((0.5 * 365) / 24)} días al año.</p>`;
  }
  $("#s-h").addEventListener("input", calcScreen); calcScreen();

  /* Alternativas a la pantalla */
  const ALT = {
    "0-2": ["Jugar a esconder un juguete bajo un trapo", "Cantar canciones con gestos", "Bloques para apilar y derribar", "Paseo para mirar pájaros y árboles", "Leer un cuento con dibujos grandes", "Jugar con agua en un barreño"],
    "3-5": ["Hacer una masa casera y modelar", "Búsqueda del tesoro en casa", "Plantar una semilla y verla crecer", "Dibujar con tiza en la calle", "Ayudar a poner la mesa", "Cuento inventado entre todos", "Pista de obstáculos con cojines"],
    "6-12": ["Construir una cabaña con mantas", "Juego de mesa en familia", "Montar en bici o patinete", "Cocinar una receta sencilla juntos", "Cuidar el huerto o las plantas", "Escribir y dibujar un diario", "Aprender un instrumento", "Excursión con mapa y brújula"],
    "13+": ["Quedar en persona con amigos", "Aprender a cocinar un plato nuevo", "Deporte en equipo", "Voluntariado en la comunidad", "Leer un libro y comentarlo", "Fotografía de naturaleza (sin redes)", "Proyecto manual: reparar o construir algo"]
  };
  function renderAlt() {
    const list = ALT[age], pick = [...list].sort(() => Math.random() - 0.5).slice(0, 3);
    $("#alt").innerHTML = pick.map((x) => `<li>${esc(x)}</li>`).join("");
  }
  $("#alt-more").addEventListener("click", renderAlt);

  /* Plan digital familiar (imprimible) */
  const RULES = [
    "Sin pantallas durante las comidas",
    "Sin pantallas una hora antes de dormir",
    "Los móviles se cargan fuera de los dormitorios",
    "Un día o una tarde a la semana sin pantallas",
    "Los contenidos se eligen y se ven acompañados",
    "Se pide permiso antes de descargar juegos o apps",
    "Notificaciones no esenciales desactivadas",
    "Los adultos también cumplimos el plan"
  ];
  let plan = store.get("eq-plan", { on: [0, 1, 2, 7], name: "" });
  $("#pl-name").value = plan.name;
  function renderPlan() {
    $("#rules").innerHTML = RULES.map((r, i) => `<li><label><input type="checkbox" data-i="${i}" ${plan.on.includes(i) ? "checked" : ""}> <span>${esc(r)}</span></label></li>`).join("");
    $("#pc-name").textContent = plan.name ? `Familia ${plan.name}` : "Nuestra familia";
    $("#pc-list").innerHTML = plan.on.sort((a, b) => a - b).map((i) => `<li>${esc(RULES[i])}</li>`).join("") || `<li class="muted">Marca las normas que queréis acordar.</li>`;
    store.set("eq-plan", plan);
  }
  $("#rules").addEventListener("change", (e) => {
    const c = e.target.closest("input"); if (!c) return; const i = +c.dataset.i;
    plan.on = c.checked ? [...new Set(plan.on.concat(i))] : plan.on.filter((x) => x !== i); renderPlan();
  });
  $("#pl-name").addEventListener("input", (e) => { plan.name = e.target.value; renderPlan(); });
  $("#pl-print").addEventListener("click", () => {
    document.body.classList.add("print-plan"); window.print();
    setTimeout(() => document.body.classList.remove("print-plan"), 500);
    window.track?.("equilibrio/plan-digital-impreso", "Plan digital familiar impreso");
  });
  window.addEventListener("afterprint", () => document.body.classList.remove("print-plan"));
  renderPlan(); renderAge();

  /* ------------------------------------------------------------------
     2. TABACO: beneficios (OMS) y ahorro
     ------------------------------------------------------------------ */
  const STEPS = [
    ["20 minutos", "Baja el ritmo cardiaco y la tensión arterial."],
    ["12 horas", "El monóxido de carbono en sangre vuelve a valores normales."],
    ["2–12 semanas", "Mejora la circulación y aumenta la función pulmonar."],
    ["1–9 meses", "Disminuyen la tos y la dificultad para respirar."],
    ["1 año", "El riesgo de enfermedad coronaria es la mitad que el de un fumador."],
    ["5–15 años", "El riesgo de ictus llega a ser como el de un no fumador."],
    ["10 años", "El riesgo de cáncer de pulmón baja a la mitad; también bajan los de boca, garganta, esófago, vejiga y páncreas."],
    ["15 años", "El riesgo de enfermedad coronaria es el de un no fumador."]
  ];
  const tl = $("#tl");
  function renderTL() {
    const v = +tl.value;
    $("#tl-list").innerHTML = STEPS.map(([t, d], i) => `<li class="${i <= v ? "on" : ""}"><b>${esc(t)}</b><span>${esc(d)}</span></li>`).join("");
    $("#tl-now").textContent = STEPS[v][0];
  }
  tl.addEventListener("input", renderTL); renderTL();
  function calcSave() {
    const c = num($("#t-c").value), p = num($("#t-p").value);
    if (!c || !p) { $("#t-out").innerHTML = `<p class="muted">Escribe cuántos cigarrillos al día y el precio del paquete de 20.</p>`; return; }
    const day = (c / 20) * p;
    $("#t-out").innerHTML = `<div class="big3">
      <div><b>${eur(day * 30)}</b><span>al mes</span></div>
      <div><b>${eur(day * 365)}</b><span>al año</span></div>
      <div><b>${eur(day * 365 * 5)}</b><span>en 5 años</span></div></div>
      <p class="muted small">¿Qué haríais en familia con ${eur(day * 365)} al año? Unas vacaciones, una bici para cada uno…</p>`;
  }
  ["#t-c", "#t-p"].forEach((s) => $(s).addEventListener("input", calcSave)); calcSave();

  /* Mitos */
  $$(".myth").forEach((m) => m.addEventListener("click", () => m.setAttribute("aria-pressed", String(m.getAttribute("aria-pressed") !== "true"))));

  /* Tema */
  try { const t = localStorage.getItem("theme"); if (t) document.documentElement.dataset.theme = t; } catch { /* nada */ }
  $(".theme-toggle").addEventListener("click", () => {
    const r = document.documentElement, d = r.dataset.theme ? r.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    r.dataset.theme = d ? "light" : "dark"; try { localStorage.setItem("theme", r.dataset.theme); } catch { /* nada */ }
  });
})();
