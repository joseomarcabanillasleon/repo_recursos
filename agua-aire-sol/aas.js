/* =====================================================================
   Agua, aire y sol · guía interactiva
   Calculadora de agua (EFSA), vasos de hoy, color de la orina (NHS),
   plan verde semanal, índice UV (AEMET) y checklist de calor (Sanidad).
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

  /* ------------------------------------------------------------------
     1. AGUA: ingesta adecuada total (EFSA 2010), incluye agua de alimentos
     ------------------------------------------------------------------ */
  const PERF = [
    { id: "n23", t: "Niño/a de 2 a 3 años", l: 1.3 },
    { id: "n48", t: "Niño/a de 4 a 8 años", l: 1.6 },
    { id: "o913", t: "Chico de 9 a 13 años", l: 2.1 },
    { id: "a913", t: "Chica de 9 a 13 años", l: 1.9 },
    { id: "m", t: "Mujer (desde 14 años)", l: 2.0 },
    { id: "h", t: "Hombre (desde 14 años)", l: 2.5 },
    { id: "emb", t: "Embarazada", l: 2.3 },
    { id: "lac", t: "Madre lactante", l: 2.7 }
  ];
  const GLASS = 0.25, DRINK_SHARE = 0.8; // vasos de 250 ml; ~80 % en forma de bebida (orientativo)
  let perf = store.get("aas-perf", "m");
  $("#w-perf").innerHTML = PERF.map((p) => `<option value="${p.id}" ${p.id === perf ? "selected" : ""}>${esc(p.t)}</option>`).join("");
  const todayKey = `aas-vasos-${new Date().toISOString().slice(0, 10)}`;
  let drunk = store.get(todayKey, 0);
  function goal() { const p = PERF.find((x) => x.id === perf); return { p, glasses: Math.round((p.l * DRINK_SHARE) / GLASS) }; }
  function renderWater() {
    const { p, glasses } = goal();
    $("#w-out").innerHTML = `<b>${p.l.toLocaleString("es-ES")} litros de agua al día</b><span class="w-sub">En total, contando bebidas y alimentos.</span>
      <span>Unos <strong>${glasses} vasos</strong> de bebida (250 ml); el resto lo aportan los alimentos como frutas, verduras o sopas.</span>`;
    const n = Math.max(glasses, drunk);
    $("#glasses").innerHTML = [...Array(n)].map((_, i) => `<button type="button" class="glass ${i < drunk ? "is-full" : ""}" data-i="${i}" aria-label="Vaso ${i + 1}${i < drunk ? ", bebido" : ""}">
      <svg viewBox="0 0 40 52" aria-hidden="true"><path d="M5 3 H35 L31 49 H9 Z" class="g-out"/><path d="M8.6 18 H31.4 L28.8 46 H11.2 Z" class="g-water"/></svg></button>`).join("");
    $("#w-count").textContent = drunk >= glasses ? `🎉 ${drunk} vasos: ¡objetivo de hoy cumplido!` : `${drunk} de ${glasses} vasos hoy`;
    $("#w-bar").style.width = `${Math.min(100, (drunk / glasses) * 100)}%`;
    store.set("aas-perf", perf); store.set(todayKey, drunk);
  }
  $("#w-perf").addEventListener("change", (e) => { perf = e.target.value; renderWater(); });
  $("#glasses").addEventListener("click", (e) => {
    const b = e.target.closest(".glass"); if (!b) return;
    const i = +b.dataset.i; drunk = i < drunk ? i : i + 1; renderWater();
  });
  $("#w-plus").addEventListener("click", () => { drunk++; renderWater(); });
  renderWater();

  /* Color de la orina (NHS: orina amarillo oscuro = señal de deshidratación) */
  const PEE = [
    ["#f7f3c4", "Amarillo muy claro", "Estás bien hidratado."],
    ["#f2e27a", "Amarillo pálido", "Bien. Sigue bebiendo a lo largo del día."],
    ["#e3b93a", "Amarillo oscuro", "Bebe agua: es una señal de que te falta líquido."],
    ["#b9781f", "Ámbar o marrón", "Bebe ya. Si dura o te encuentras mal, consulta."]
  ];
  $("#pee").innerHTML = PEE.map(([c, t], i) => `<button type="button" class="pee" data-i="${i}" style="--c:${c}" aria-label="${esc(t)}"></button>`).join("");
  $("#pee").addEventListener("click", (e) => {
    const b = e.target.closest(".pee"); if (!b) return;
    $$(".pee").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    const [, t, d] = PEE[+b.dataset.i]; $("#pee-out").innerHTML = `<b>${esc(t)}:</b> ${esc(d)}`;
  });

  /* ------------------------------------------------------------------
     2. AIRE: plan verde semanal
     ------------------------------------------------------------------ */
  const ACT = [["paseo", "🚶", "Paseo"], ["parque", "🛝", "Parque"], ["huerto", "🌱", "Huerto"], ["bici", "🚲", "Bici"], ["excursion", "⛰️", "Excursión"], ["playa", "🏖️", "Playa"]];
  const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  let plan = store.get("aas-plan", DIAS.map(() => []));
  function renderPlan() {
    $("#gplan").innerHTML = DIAS.map((d, i) => `<div class="pday"><b>${d}</b><div class="pacts">${ACT.map(([id, e, t]) =>
      `<button type="button" class="pact" data-d="${i}" data-a="${id}" aria-pressed="${plan[i].includes(id)}" title="${esc(t)}" aria-label="${d}: ${esc(t)}">${e}</button>`).join("")}</div></div>`).join("");
    const n = plan.filter((x) => x.length).length;
    $("#plan-sum").textContent = n ? `${n} día${n > 1 ? "s" : ""} con plan al aire libre esta semana${n >= 5 ? " · ¡Genial! 🌳" : ""}` : "Toca las actividades que quieras hacer cada día.";
    store.set("aas-plan", plan);
  }
  $("#gplan").addEventListener("click", (e) => {
    const b = e.target.closest(".pact"); if (!b) return;
    const d = +b.dataset.d, a = b.dataset.a;
    plan[d] = plan[d].includes(a) ? plan[d].filter((x) => x !== a) : plan[d].concat(a); renderPlan();
  });
  $("#plan-reset").addEventListener("click", () => { plan = DIAS.map(() => []); renderPlan(); });
  renderPlan();

  /* ------------------------------------------------------------------
     3. SOL: índice UV (categorías AEMET / OMS)
     ------------------------------------------------------------------ */
  const UV = [
    [0, 2, "Bajo", "#4caf50", ["Puedes estar al aire libre con normalidad.", "Gafas de sol si hay mucha claridad o nieve."]],
    [3, 5, "Moderado", "#f2c12e", ["Busca la sombra en las horas centrales del día.", "Camiseta, sombrero y gafas de sol homologadas.", "Protector solar de factor 30 o más en la piel expuesta."]],
    [6, 7, "Alto", "#f3793b", ["Reduce la exposición en las horas centrales.", "Ropa, sombrero, gafas y protector de factor alto.", "Vuelve a aplicar el protector cada 2 horas y tras el baño."]],
    [8, 10, "Muy alto", "#d33b3b", ["Evita el sol en las horas centrales: la sombra es imprescindible.", "Protección completa: ropa, sombrero, gafas y protector.", "Cuidado con la arena y el agua: reflejan la radiación."]],
    [11, 16, "Extremo", "#8e3fb5", ["Evita la exposición al sol.", "Si sales, todas las medidas de protección.", "Los niños pequeños, a cubierto."]]
  ];
  const uv = $("#uv");
  function renderUV() {
    const v = +uv.value, c = UV.find(([a, b]) => v >= a && v <= b);
    $("#uv-v").textContent = v >= 11 ? "11+" : v;
    $("#uv-card").style.setProperty("--uvc", c[3]);
    $("#uv-t").textContent = c[2];
    $("#uv-list").innerHTML = c[4].map((x) => `<li>${esc(x)}</li>`).join("");
  }
  uv.addEventListener("input", renderUV); renderUV();

  /* ------------------------------------------------------------------
     4. CALOR: checklist (Ministerio de Sanidad)
     ------------------------------------------------------------------ */
  const heat = store.get("aas-calor", []);
  $$("#calor input").forEach((c, i) => {
    c.checked = heat.includes(i);
    c.addEventListener("change", () => {
      const s = new Set(store.get("aas-calor", [])); c.checked ? s.add(i) : s.delete(i); store.set("aas-calor", [...s]); updHeat();
    });
  });
  function updHeat() {
    const n = $$("#calor input").filter((c) => c.checked).length, t = $$("#calor input").length;
    $("#calor-n").textContent = n === t ? "✓ ¡Preparado para el calor!" : `${n} de ${t} preparados`;
  }
  updHeat();

  /* Mitos */
  $$(".myth").forEach((m) => m.addEventListener("click", () => m.setAttribute("aria-pressed", String(m.getAttribute("aria-pressed") !== "true"))));

  /* Tema */
  try { const t = localStorage.getItem("theme"); if (t) document.documentElement.dataset.theme = t; } catch { /* nada */ }
  $(".theme-toggle").addEventListener("click", () => {
    const r = document.documentElement, d = r.dataset.theme ? r.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    r.dataset.theme = d ? "light" : "dark"; try { localStorage.setItem("theme", r.dataset.theme); } catch { /* nada */ }
  });
})();
