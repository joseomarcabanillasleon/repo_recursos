/* =====================================================================
   Descansar bien · guía interactiva del sueño y del descanso
   Calculadora familiar, rutina de noche imprimible, diario de sueño,
   test de hábitos. Datos: CDC (horas por edad y hábitos), NHS.
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

  /* Horas recomendadas (CDC). min/max en horas; nota si incluye siestas */
  const AGES = [
    { id: "p", t: "Niño/a de 3 a 5 años", min: 10, max: 13, note: "en total, contando la siesta: si duerme siesta, puede acostarse más tarde" },
    { id: "e", t: "Niño/a de 6 a 12 años", min: 9, max: 12 },
    { id: "t", t: "Adolescente de 13 a 17", min: 8, max: 10 },
    { id: "a", t: "Adulto de 18 a 60", min: 7, max: 9, note: "7 horas o más" },
    { id: "b", t: "Adulto de 61 a 64", min: 7, max: 9 },
    { id: "m", t: "Mayor de 65", min: 7, max: 8 }
  ];
  const ABY = Object.fromEntries(AGES.map((a) => [a.id, a]));
  const toMin = (hhmm) => { const [h, m] = (hhmm || "07:00").split(":").map(Number); return h * 60 + m; };
  const fmt = (min) => { min = ((min % 1440) + 1440) % 1440; return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`; };

  /* ------------------------------------------------------------------
     1. CALCULADORA FAMILIAR
     ------------------------------------------------------------------ */
  let fam = store.get("des-fam", [
    { n: "Yo", age: "a", wake: "07:00" },
    { n: "Peque mayor", age: "e", wake: "07:30" },
    { n: "Peque pequeño", age: "p", wake: "07:30" }
  ]);
  const ageOpts = (sel) => AGES.map((a) => `<option value="${a.id}" ${a.id === sel ? "selected" : ""}>${esc(a.t)}</option>`).join("");
  function renderFam() {
    $("#fam").innerHTML = fam.map((p, i) => {
      const a = ABY[p.age], w = toMin(p.wake);
      const late = fmt(w - a.min * 60 - 15), early = fmt(w - a.max * 60 - 15);
      return `<div class="fam-row" data-i="${i}">
        <label class="field"><span>Nombre</span><input data-k="n" value="${esc(p.n)}" maxlength="20"></label>
        <label class="field"><span>Edad</span><select data-k="age">${ageOpts(p.age)}</select></label>
        <label class="field"><span>Se levanta</span><input type="time" data-k="wake" value="${esc(p.wake)}"></label>
        <div class="fam-out"><span class="moon" aria-hidden="true">🌙</span><div><b>Acostarse entre ${early} y ${late}</b>
          <small>${a.min}–${a.max} h de sueño${a.note ? " · " + esc(a.note) : ""} · +15 min para dormirse</small></div></div>
        <button type="button" class="fam-del" aria-label="Quitar a ${esc(p.n)}">✕</button>
      </div>`;
    }).join("");
    store.set("des-fam", fam);
  }
  $("#fam").addEventListener("change", (e) => {
    const row = e.target.closest(".fam-row"), k = e.target.dataset.k; if (!row || !k) return;
    fam[+row.dataset.i][k] = e.target.value; renderFam();
  });
  $("#fam").addEventListener("input", (e) => {
    if (e.target.dataset.k !== "n") return;
    fam[+e.target.closest(".fam-row").dataset.i].n = e.target.value; store.set("des-fam", fam);
  });
  $("#fam").addEventListener("click", (e) => {
    const b = e.target.closest(".fam-del"); if (!b) return;
    fam.splice(+b.closest(".fam-row").dataset.i, 1); renderFam();
  });
  $("#fam-add").addEventListener("click", () => { if (fam.length < 8) { fam.push({ n: "", age: "a", wake: "07:00" }); renderFam(); } });
  renderFam();

  /* ------------------------------------------------------------------
     2. RUTINA DE NOCHE (imprimible)
     ------------------------------------------------------------------ */
  const STEPS = [
    { id: "cena", ico: "🥣", t: "Cena ligera", before: 150 },
    { id: "pantallas", ico: "📵", t: "Apagar pantallas", before: 60 },
    { id: "preparar", ico: "🎒", t: "Preparar ropa y mochila", before: 50 },
    { id: "bano", ico: "🛁", t: "Ducha o baño tibio", before: 40 },
    { id: "dientes", ico: "🪥", t: "Pijama y dientes", before: 30 },
    { id: "cuento", ico: "📖", t: "Lectura o cuento", before: 20 },
    { id: "oracion", ico: "🙏", t: "Oración y gratitud", before: 10 },
    { id: "luces", ico: "🌙", t: "Luces apagadas", before: 0 }
  ];
  let rut = store.get("des-rut", { bed: "21:00", on: STEPS.map((s) => s.id), title: "Mi rutina de noche" });
  $("#rut-bed").value = rut.bed; $("#rut-title").value = rut.title;
  function renderRut() {
    const bed = toMin(rut.bed);
    $("#rut-steps").innerHTML = STEPS.map((s) => `<label class="rstep ${rut.on.includes(s.id) ? "is-on" : ""}">
      <input type="checkbox" value="${s.id}" ${rut.on.includes(s.id) ? "checked" : ""}>
      <span class="rstep__ico" aria-hidden="true">${s.ico}</span><span>${esc(s.t)}</span><small>${s.before ? s.before + " min antes" : "a la hora"}</small></label>`).join("");
    const on = STEPS.filter((s) => rut.on.includes(s.id));
    $("#card-title").textContent = rut.title || "Mi rutina de noche";
    $("#card-list").innerHTML = on.map((s) => `<li><time>${fmt(bed - s.before)}</time><span aria-hidden="true">${s.ico}</span>${esc(s.t)}<i class="box" aria-hidden="true"></i></li>`).join("");
    store.set("des-rut", rut);
  }
  $("#rut-steps").addEventListener("change", (e) => {
    const c = e.target.closest("input"); if (!c) return;
    rut.on = STEPS.map((s) => s.id).filter((id) => id === c.value ? c.checked : rut.on.includes(id)); renderRut();
  });
  $("#rut-bed").addEventListener("input", (e) => { rut.bed = e.target.value || "21:00"; renderRut(); });
  $("#rut-title").addEventListener("input", (e) => { rut.title = e.target.value; renderRut(); });
  $("#rut-print").addEventListener("click", () => {
    document.body.classList.add("print-card"); window.print();
    setTimeout(() => document.body.classList.remove("print-card"), 500);
    window.track?.("descanso/rutina-impresa", "Rutina de noche impresa");
  });
  window.addEventListener("afterprint", () => document.body.classList.remove("print-card"));
  renderRut();

  /* ------------------------------------------------------------------
     3. DIARIO DE SUEÑO (7 días)
     ------------------------------------------------------------------ */
  const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
  const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d; });
  const dk = (d) => d.toISOString().slice(0, 10);
  let diary = store.get("des-diario", {});
  let target = store.get("des-target", "a");
  $("#d-age").innerHTML = ageOpts(target);
  function hours(e) {
    if (!e || !e.bed || !e.wake) return null;
    let m = toMin(e.wake) - toMin(e.bed); if (m <= 0) m += 1440; return m / 60;
  }
  function renderDiary() {
    const a = ABY[target];
    $("#diary").innerHTML = days.map((d) => {
      const e = diary[dk(d)] || {}, h = hours(e);
      const pct = h ? Math.min(100, (h / 12) * 100) : 0;
      const cls = h == null ? "" : h < a.min ? "low" : h > a.max ? "high" : "ok";
      return `<div class="drow" data-k="${dk(d)}">
        <span class="drow__d">${DIAS[d.getDay()]} ${d.getDate()}</span>
        <label><span class="sr-only">Me acosté</span><input type="time" data-f="bed" value="${esc(e.bed || "")}" aria-label="Hora de acostarse, ${DIAS[d.getDay()]} ${d.getDate()}"></label>
        <label><span class="sr-only">Me levanté</span><input type="time" data-f="wake" value="${esc(e.wake || "")}" aria-label="Hora de levantarse, ${DIAS[d.getDay()]} ${d.getDate()}"></label>
        <div class="dbar dbar--${cls}"><span style="width:${pct}%"></span><b>${h == null ? "—" : h.toLocaleString("es-ES", { maximumFractionDigits: 1 }) + " h"}</b></div>
      </div>`;
    }).join("");
    const hs = days.map((d) => hours(diary[dk(d)])).filter((h) => h != null);
    const avg = hs.length ? hs.reduce((x, y) => x + y, 0) / hs.length : null;
    const bt = days.map((d) => diary[dk(d)]?.bed).filter(Boolean).map((t) => { let m = toMin(t); if (m < 720) m += 1440; return m; });
    const spread = bt.length > 1 ? Math.max(...bt) - Math.min(...bt) : 0;
    $("#d-sum").innerHTML = avg == null
      ? `<p class="muted">Apunta a qué hora te acostaste y te levantaste. Se guarda solo en este dispositivo.</p>`
      : `<p><b>Media: ${avg.toLocaleString("es-ES", { maximumFractionDigits: 1 })} h</b> (${hs.length} día${hs.length > 1 ? "s" : ""}) · recomendado ${a.min}–${a.max} h. ${
          avg < a.min ? "😴 Duermes menos de lo recomendado: prueba a adelantar la hora de acostarte 15 minutos cada pocos días." :
          avg > a.max ? "Duermes más de lo habitual para tu edad. Si te sigues sintiendo cansado, coméntalo con tu médico." : "✅ ¡Dentro de lo recomendado!"}</p>
         ${spread > 60 ? `<p>⏰ Tu hora de acostarte varía más de una hora entre días. Un horario regular ayuda a dormir mejor.</p>` : ""}`;
  }
  $("#diary").addEventListener("change", (e) => {
    const row = e.target.closest(".drow"), f = e.target.dataset.f; if (!row || !f) return;
    diary[row.dataset.k] = Object.assign({}, diary[row.dataset.k], { [f]: e.target.value });
    store.set("des-diario", diary); renderDiary();
  });
  $("#d-age").addEventListener("change", (e) => { target = e.target.value; store.set("des-target", target); renderDiary(); });
  renderDiary();

  /* ------------------------------------------------------------------
     4. TEST DE HÁBITOS (CDC)
     ------------------------------------------------------------------ */
  const Q = [
    ["Me acuesto y me levanto a la misma hora casi todos los días, también el fin de semana.", "Intenta mantener el mismo horario todos los días: es el hábito que más ayuda."],
    ["Mi dormitorio es tranquilo, oscuro y fresco.", "Oscurece y ventila el dormitorio; una temperatura fresca favorece el sueño."],
    ["Apago el móvil, la tele y las pantallas al menos 30 minutos antes de dormir.", "Apaga las pantallas al menos 30 minutos antes de acostarte."],
    ["Evito las cenas copiosas justo antes de acostarme.", "Cena algo ligero y un par de horas antes de dormir."],
    ["No tomo café, té o refrescos con cafeína por la tarde o la noche.", "Deja la cafeína para la mañana."],
    ["Hago actividad física casi todos los días.", "Moverte durante el día ayuda a dormir mejor de noche. Mira la guía de movimiento."],
    ["Salgo a la luz natural por la mañana.", "La luz de la mañana ayuda a regular el reloj interno: sal unos minutos al exterior."],
    ["Tengo una rutina relajante antes de dormir.", "Crea una rutina de noche más arriba y repítela cada día."]
  ];
  let ans = store.get("des-test", Q.map(() => null));
  function renderTest() {
    $("#test").innerHTML = Q.map(([q], i) => `<div class="q">
      <p>${esc(q)}</p>
      <div class="q__btns" role="group" aria-label="Respuesta">
        <button type="button" data-i="${i}" data-v="1" aria-pressed="${ans[i] === 1}">Sí</button>
        <button type="button" data-i="${i}" data-v="0" aria-pressed="${ans[i] === 0}">No</button>
      </div></div>`).join("");
    const done = ans.filter((v) => v !== null).length, yes = ans.filter((v) => v === 1).length;
    $("#test-res").innerHTML = done < Q.length
      ? `<p class="muted">Responde las ${Q.length} preguntas (${done}/${Q.length}).</p>`
      : `<div class="score-big"><b>${yes}/${Q.length}</b><span>${yes >= 7 ? "¡Muy buenos hábitos! 🌟" : yes >= 5 ? "Vas por buen camino 👍" : "Hay margen de mejora: empieza por un cambio 💪"}</span></div>
         ${yes < Q.length ? `<h3>Tus próximos pasos</h3><ul>${Q.map(([, tip], i) => ans[i] === 0 ? `<li>${esc(tip)}</li>` : "").join("")}</ul>` : ""}`;
    store.set("des-test", ans);
  }
  $("#test").addEventListener("click", (e) => { const b = e.target.closest("button[data-i]"); if (b) { ans[+b.dataset.i] = +b.dataset.v; renderTest(); } });
  $("#test-reset").addEventListener("click", () => { ans = Q.map(() => null); renderTest(); });
  renderTest();

  /* Ideas del día de descanso: marcar favoritas */
  let fav = store.get("des-fav", []);
  $$(".rest-idea").forEach((b) => {
    b.setAttribute("aria-pressed", String(fav.includes(b.dataset.id)));
    b.addEventListener("click", () => {
      fav = fav.includes(b.dataset.id) ? fav.filter((x) => x !== b.dataset.id) : fav.concat(b.dataset.id);
      b.setAttribute("aria-pressed", String(fav.includes(b.dataset.id))); store.set("des-fav", fav);
    });
  });

  /* Mitos */
  $$(".myth").forEach((m) => m.addEventListener("click", () => m.setAttribute("aria-pressed", String(m.getAttribute("aria-pressed") !== "true"))));

  /* Tema */
  try { const t = localStorage.getItem("theme"); if (t) document.documentElement.dataset.theme = t; } catch { /* nada */ }
  $(".theme-toggle").addEventListener("click", () => {
    const r = document.documentElement, d = r.dataset.theme ? r.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    r.dataset.theme = d ? "light" : "dark"; try { localStorage.setItem("theme", r.dataset.theme); } catch { /* nada */ }
  });
})();
