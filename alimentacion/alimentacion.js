/* =====================================================================
   Comer bien · guía interactiva de alimentación
   Plato interactivo, constructor de platos, mi semana, calculadora de
   etiquetas, reto de 7 días. Datos: AESAN (2022), OMS, Harvard, NHS.
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
  function toast(msg) {
    const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; t.setAttribute("role", "status");
    document.body.appendChild(t); setTimeout(() => t.remove(), 2200);
  }

  /* ------------------------------------------------------------------
     1. EL PLATO EQUILIBRADO (interactivo)
     ------------------------------------------------------------------ */
  const SECTORS = [
    { id: "proteinas", from: -90, to: 0, color: "#c9733f", ico: "🫘", t: "Proteínas saludables · ¼",
      d: "Legumbres (lentejas, garbanzos, alubias, soja), frutos secos, huevos y, si lo comes, pescado. La AESAN recomienda legumbres al menos 4 veces por semana, hasta llegar a tomarlas a diario." },
    { id: "cereales", from: 0, to: 90, color: "#d9a441", ico: "🌾", t: "Cereales integrales · ¼",
      d: "Pan, arroz, pasta y avena integrales, quinoa. Dan energía y fibra. Mejor de grano entero que refinados (pan blanco, bollería)." },
    { id: "frutas", from: 90, to: 135, color: "#e0566b", ico: "🍊", t: "Frutas · ⅛",
      d: "2–3 raciones al día, enteras mejor que en zumo. Variedad de colores y de temporada." },
    { id: "verduras", from: 135, to: 270, color: "#3f9a5c", ico: "🥦", t: "Verduras y hortalizas · ⅜",
      d: "La parte más grande del plato: al menos 3 raciones al día. Crudas y cocinadas, de todos los colores. Las patatas cuentan aparte, con moderación." }
  ];
  const rad = (a) => (a * Math.PI) / 180;
  const arc = (cx, cy, r, a0, a1) => {
    const [x0, y0] = [cx + r * Math.cos(rad(a0)), cy + r * Math.sin(rad(a0))];
    const [x1, y1] = [cx + r * Math.cos(rad(a1)), cy + r * Math.sin(rad(a1))];
    return `M${cx},${cy} L${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(1)},${y1.toFixed(1)} Z`;
  };
  function plateSVG(interactive) {
    const mid = (s) => rad((s.from + s.to) / 2);
    return `<svg viewBox="0 0 240 240" class="plate-svg" role="${interactive ? "group" : "img"}" aria-label="Plato equilibrado">
      <circle cx="120" cy="120" r="116" class="plate-rim"/>
      <circle cx="120" cy="120" r="104" class="plate-in"/>
      ${SECTORS.map((s) => `<path d="${arc(120, 120, 96, s.from, s.to)}" fill="${s.color}" class="sector" data-id="${s.id}"
        ${interactive ? `tabindex="0" role="button" aria-label="${esc(s.t)}"` : ""}/>`).join("")}
      ${SECTORS.map((s) => `<text x="${(120 + 58 * Math.cos(mid(s))).toFixed(1)}" y="${(126 + 58 * Math.sin(mid(s))).toFixed(1)}" class="sector-ico" text-anchor="middle">${s.ico}</text>`).join("")}
    </svg>`;
  }
  const plate = $("#plate");
  plate.innerHTML = plateSVG(true);
  function showSector(id) {
    const s = SECTORS.find((x) => x.id === id);
    $$(".sector", plate).forEach((p) => p.classList.toggle("is-on", p.dataset.id === id));
    $("#plate-info").innerHTML = `<span class="pi-ico" style="background:${s.color}">${s.ico}</span><div><h3>${esc(s.t)}</h3><p>${esc(s.d)}</p></div>`;
  }
  plate.addEventListener("click", (e) => { const p = e.target.closest(".sector"); if (p) showSector(p.dataset.id); });
  plate.addEventListener("keydown", (e) => { const p = e.target.closest(".sector"); if (p && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); showSector(p.dataset.id); } });
  showSector("verduras");
  $("#poster-plate") && ($("#poster-plate").innerHTML = plateSVG(false));

  /* ------------------------------------------------------------------
     2. CONSTRUYE TU PLATO
     ------------------------------------------------------------------ */
  const FOODS = [
    ["brocoli", "🥦", "Brócoli", "verdura"], ["zanahoria", "🥕", "Zanahoria", "verdura"], ["tomate", "🍅", "Tomate", "verdura"],
    ["espinacas", "🥬", "Espinacas", "verdura"], ["pimiento", "🫑", "Pimiento", "verdura"],
    ["naranja", "🍊", "Naranja", "fruta"], ["manzana", "🍎", "Manzana", "fruta"], ["fresas", "🍓", "Fresas", "fruta"],
    ["arroz", "🍚", "Arroz integral", "cereal"], ["pan", "🍞", "Pan integral", "cereal"], ["avena", "🥣", "Avena", "cereal"],
    ["lentejas", "🫘", "Lentejas", "proteina"], ["garbanzos", "🧆", "Garbanzos", "proteina"], ["huevo", "🥚", "Huevo", "proteina"],
    ["pescado", "🐟", "Pescado azul", "proteina"], ["nueces", "🥜", "Frutos secos", "proteina"],
    ["aceite", "🫒", "Aceite de oliva", "grasa"], ["agua", "💧", "Agua", "agua"],
    ["bolleria", "🥐", "Bollería", "ultra"], ["fritas", "🍟", "Patatas fritas", "ultra"], ["refresco", "🥤", "Refresco", "ultra"]
  ];
  const FBY = Object.fromEntries(FOODS.map((f) => [f[0], f]));
  let mine = store.get("ali-plato", []);
  $("#foods").innerHTML = FOODS.map(([id, e, n, g]) =>
    `<button type="button" class="food food--${g}" data-id="${id}"><span aria-hidden="true">${e}</span>${esc(n)}</button>`).join("");
  function evaluate() {
    const g = (k) => mine.filter((id) => FBY[id][3] === k).length;
    const ver = g("verdura"), fru = g("fruta"), cer = g("cereal"), pro = g("proteina"), ult = g("ultra");
    const rules = [
      [ver >= 2, "Al menos dos verduras u hortalizas: la mitad del plato", ver === 1 ? "Añade otra verdura: deberían ocupar la mitad del plato." : "Falta verdura: es la parte más grande del plato."],
      [pro >= 1, "Una proteína saludable (legumbre, huevo, frutos secos o pescado)", "Añade una proteína: legumbres, huevo, frutos secos o pescado."],
      [cer >= 1, "Un cereal integral para la energía", "Añade un cereal integral: arroz, pan o avena."],
      [mine.includes("agua"), "Agua para beber", "Acompaña con agua: es la bebida principal de una dieta saludable."],
      [ult === 0, "Sin ultraprocesados", "Quita bollería, fritos o refrescos: mejor como algo ocasional."]
    ];
    const ok = rules.filter((r) => r[0]).length;
    $("#score").innerHTML = mine.length
      ? `<div class="stars" aria-label="${ok} de 5">${"★".repeat(ok)}<span>${"★".repeat(5 - ok)}</span></div>
         <ul class="checks">${rules.map(([c, good, bad]) => `<li class="${c ? "ok" : "no"}">${esc(c ? good : bad)}</li>`).join("")}</ul>
         ${fru ? `<p class="tip">🍊 ¡Bien! Una fruta de postre suma a tus 2–3 raciones del día.</p>` : ""}
         ${ok === 5 ? `<p class="tip tip--win">🎉 ¡Plato equilibrado! Así de fácil.</p>` : ""}`
      : `<p class="muted">Toca alimentos de la lista para ponerlos en el plato.</p>`;
    $("#mine").innerHTML = mine.map((id) => `<button type="button" class="chip-food" data-id="${id}" aria-label="Quitar ${esc(FBY[id][2])}">${FBY[id][1]} ${esc(FBY[id][2])} ✕</button>`).join("");
    $$(".food").forEach((b) => b.classList.toggle("is-in", mine.includes(b.dataset.id)));
    store.set("ali-plato", mine);
  }
  $("#foods").addEventListener("click", (e) => {
    const b = e.target.closest(".food"); if (!b) return;
    const id = b.dataset.id;
    if (mine.includes(id)) mine = mine.filter((x) => x !== id);
    else if (mine.length >= 9) { toast("Máximo 9 alimentos en el plato"); return; }
    else mine.push(id);
    evaluate();
  });
  $("#mine").addEventListener("click", (e) => { const b = e.target.closest(".chip-food"); if (b) { mine = mine.filter((x) => x !== b.dataset.id); evaluate(); } });
  $("#reset").addEventListener("click", () => { mine = []; evaluate(); });
  evaluate();

  /* ------------------------------------------------------------------
     3. MI SEMANA (AESAN 2022)
     ------------------------------------------------------------------ */
  const today = new Date();
  const dayKey = `ali-day-${today.toISOString().slice(0, 10)}`;
  function weekKey(d = today) {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
    const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return `ali-week-${t.getUTCFullYear()}-${Math.ceil(((t - y0) / 864e5 + 1) / 7)}`;
  }
  const TRACK = [
    { id: "hortalizas", ico: "🥦", t: "Hortalizas", per: "hoy", goal: 3, kind: "min", txt: "al menos 3 al día" },
    { id: "frutas", ico: "🍊", t: "Frutas", per: "hoy", goal: 3, min: 2, kind: "range", txt: "2–3 al día" },
    { id: "legumbres", ico: "🫘", t: "Legumbres", per: "semana", goal: 4, kind: "min", txt: "al menos 4 a la semana" },
    { id: "frutossecos", ico: "🥜", t: "Frutos secos", per: "semana", goal: 3, kind: "min", txt: "3 o más a la semana (un puñado)" },
    { id: "huevos", ico: "🥚", t: "Huevos", per: "semana", goal: 4, kind: "max", txt: "hasta 4 a la semana" },
    { id: "pescado", ico: "🐟", t: "Pescado (si lo comes)", per: "semana", goal: 3, kind: "min", txt: "3 o más a la semana, mejor azul" }
  ];
  let dayData = store.get(dayKey, {}), weekData = store.get(weekKey(), {});
  function status(t, v) {
    if (t.kind === "max") return v > t.goal ? ["over", "Por encima de lo recomendado"] : [v ? "ok" : "", v ? "Dentro de lo recomendado" : ""];
    if (t.kind === "range") return v > t.goal ? ["ok", "¡Objetivo cumplido!"] : v >= t.min ? ["ok", "¡Objetivo cumplido!"] : ["", ""];
    return v >= t.goal ? ["ok", "¡Objetivo cumplido!"] : ["", ""];
  }
  function renderTrack() {
    $("#track").innerHTML = TRACK.map((t) => {
      const v = (t.per === "hoy" ? dayData : weekData)[t.id] || 0;
      const [cls, msg] = status(t, v);
      const pct = Math.min(100, (v / t.goal) * 100);
      return `<div class="trk ${cls ? "trk--" + cls : ""}">
        <span class="trk__ico" aria-hidden="true">${t.ico}</span>
        <div class="trk__main">
          <div class="trk__head"><strong>${esc(t.t)}</strong><span>${t.per === "hoy" ? "Hoy" : "Esta semana"}: <b>${v}</b> · ${esc(t.txt)}</span></div>
          <div class="trk__bar"><span style="width:${pct}%"></span></div>
          ${msg ? `<small>${esc(msg)}</small>` : ""}
        </div>
        <div class="trk__btns">
          <button type="button" data-id="${t.id}" data-d="-1" aria-label="Quitar una ración de ${esc(t.t)}">−</button>
          <button type="button" data-id="${t.id}" data-d="1" aria-label="Añadir una ración de ${esc(t.t)}">+</button>
        </div></div>`;
    }).join("");
  }
  $("#track").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-id]"); if (!b) return;
    const t = TRACK.find((x) => x.id === b.dataset.id), bag = t.per === "hoy" ? dayData : weekData;
    bag[t.id] = Math.max(0, (bag[t.id] || 0) + +b.dataset.d);
    store.set(dayKey, dayData); store.set(weekKey(), weekData); renderTrack();
  });
  renderTrack();

  /* ------------------------------------------------------------------
     4. CALCULADORA DE ETIQUETAS (OMS)
     ------------------------------------------------------------------ */
  function calc() {
    const sug = parseFloat($("#c-sug").value.replace(",", ".")) || 0;
    const sod = $("#c-mode").value === "sal";
    const salIn = parseFloat($("#c-sal").value.replace(",", ".")) || 0;
    const sal = sod ? salIn : salIn * 2.5;
    const spoons = sug / 4;
    $("#r-sug").innerHTML = sug
      ? `<div class="spoons" aria-hidden="true">${"🥄".repeat(Math.min(20, Math.round(spoons)))}${spoons > 20 ? "…" : ""}</div>
         <p><b>${spoons.toLocaleString("es-ES", { maximumFractionDigits: 1 })} cucharillas</b> de azúcar · <b>${Math.round((sug / 50) * 100)} %</b> del máximo diario recomendado (unos 50 g, el 10 % de las calorías).</p>`
      : `<p class="muted">Escribe los gramos de «azúcares» de la etiqueta (por ración o por envase).</p>`;
    $("#r-sal").innerHTML = salIn
      ? `<div class="meter"><span style="width:${Math.min(100, (sal / 5) * 100)}%"></span></div>
         <p><b>${sal.toLocaleString("es-ES", { maximumFractionDigits: 2 })} g de sal</b> · <b>${Math.round((sal / 5) * 100)} %</b> del máximo diario para un adulto (menos de 5 g).</p>`
      : `<p class="muted">Escribe la sal o el sodio de la etiqueta. Sal = sodio × 2,5.</p>`;
  }
  ["#c-sug", "#c-sal", "#c-mode"].forEach((s) => $(s).addEventListener("input", calc));
  calc();

  /* ------------------------------------------------------------------
     5. RETO DE 7 DÍAS
     ------------------------------------------------------------------ */
  const RETO = [
    "Bebe agua en cada comida en lugar de refrescos o zumos.",
    "Llena medio plato de verduras en la comida y en la cena.",
    "Cocina un plato de legumbres (lentejas, garbanzos o alubias).",
    "Cambia el pan o el arroz blanco por integral.",
    "Toma un puñado de frutos secos naturales como tentempié.",
    "Lee la etiqueta de 3 productos y compara el azúcar y la sal.",
    "Prepara una comida sin ultraprocesados y compártela en familia."
  ];
  let reto = store.get("ali-reto", RETO.map(() => false));
  function renderReto() {
    $("#reto").innerHTML = RETO.map((r, i) => `<li><label><input type="checkbox" data-i="${i}" ${reto[i] ? "checked" : ""}><span><b>Día ${i + 1}</b> ${esc(r)}</span></label></li>`).join("");
    const n = reto.filter(Boolean).length;
    $("#reto-bar").style.width = `${(n / 7) * 100}%`;
    $("#reto-n").textContent = n === 7 ? "🎉 ¡Reto completado! Ahora, a mantenerlo." : `${n} de 7 días completados`;
  }
  $("#reto").addEventListener("change", (e) => { const c = e.target.closest("input"); if (!c) return; reto[+c.dataset.i] = c.checked; store.set("ali-reto", reto); renderReto(); if (c.checked) window.track?.("alimentacion/reto-dia", "Reto: día completado"); });
  $("#reto-reset").addEventListener("click", () => { reto = RETO.map(() => false); store.set("ali-reto", reto); renderReto(); });
  renderReto();

  /* Mitos */
  $$(".myth").forEach((m) => m.addEventListener("click", () => m.setAttribute("aria-pressed", String(m.getAttribute("aria-pressed") !== "true"))));

  /* Tema */
  try { const t = localStorage.getItem("theme"); if (t) document.documentElement.dataset.theme = t; } catch { /* nada */ }
  $(".theme-toggle").addEventListener("click", () => {
    const r = document.documentElement, d = r.dataset.theme ? r.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    r.dataset.theme = d ? "light" : "dark"; try { localStorage.setItem("theme", r.dataset.theme); } catch { /* nada */ }
  });
})();
