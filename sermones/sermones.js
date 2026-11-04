/* =====================================================================
   Sermones con IA
   - Texto bíblico real (datos de /biblia/) y palabras clave del original
   - IA gratuita: Google Gemini con la clave del usuario (se guarda solo en su navegador)
   - Alternativa sin clave: copiar el encargo y abrir ChatGPT, Claude o Gemini
   - Verificador de citas bíblicas con la RV1909
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
  const DATA = "../biblia/data/";
  const cache = new Map();
  const load = (p) => {
    if (!cache.has(p)) cache.set(p, fetch(DATA + p).then((r) => { if (!r.ok) throw new Error(p); return r.json(); }).catch((e) => { cache.delete(p); throw e; }));
    return cache.get(p);
  };
  const TAG = /⟦([^|⟧]*)\|([HG]\d+)⟧/g;
  const plain = (t) => (t || "").replace(TAG, "$1");
  const norm = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  let META, BOOK, ALIAS = [];

  /* ---------------- Referencias ---------------- */
  function buildAlias() {
    const extra = { GEN: ["gen", "gn"], EXO: ["ex", "exo"], LEV: ["lev", "lv"], NUM: ["num", "nm"], DEU: ["deut", "dt"], JOS: ["jos", "josue"], JDG: ["jue"],
      RUT: ["rt"], PSA: ["sal", "salmo", "salmos"], PRO: ["prov", "pr"], ECC: ["ecl", "ec"], SNG: ["cant", "cnt", "cantar de los cantares"], ISA: ["is", "isa"],
      JER: ["jer"], LAM: ["lam", "lm"], EZK: ["ez", "eze"], DAN: ["dan", "dn"], HOS: ["os"], JOL: ["jl"], AMO: ["am"], OBA: ["abd"], JON: ["jon"], MIC: ["mi", "miq"],
      NAM: ["nah"], HAB: ["hab"], ZEP: ["sof"], HAG: ["hag"], ZEC: ["zac"], MAL: ["mal"], MAT: ["mt", "mat"], MRK: ["mr", "mc", "mar"], LUK: ["lc", "luc"],
      JHN: ["jn", "jua"], ACT: ["hch", "hech"], ROM: ["ro", "rom"], GAL: ["ga", "gal"], EPH: ["ef", "efe"], PHP: ["flp", "fil"], COL: ["col"], TIT: ["tit"],
      PHM: ["flm"], HEB: ["heb"], JAS: ["stg", "sant"], JUD: ["jud"], REV: ["ap", "apoc"], EST: ["est"], NEH: ["neh"], EZR: ["esd"] };
    for (const b of META.books) {
      const set = new Set([norm(b.n), norm(b.a)]);
      (extra[b.id] || []).forEach((x) => set.add(x));
      const m = b.n.match(/^(\d) (.*)$/);
      if (m) { const base = norm(m[2]); [base, base.slice(0, 3), base.slice(0, 2)].forEach((x) => { set.add(`${m[1]} ${x}`); set.add(`${m[1]}${x}`); }); }
      for (const a of set) if (a.length >= 2) ALIAS.push([a, b.id]);
    }
    ALIAS.sort((a, b) => b[0].length - a[0].length);
  }
  const bookOf = (name) => { const n = norm(name).replace(/\s+/g, " "); const hit = ALIAS.find(([a]) => a === n || a.replace(/ /g, "") === n.replace(/ /g, "")); return hit ? hit[1] : null; };
  function parseRef(q) {
    const s = norm(q).replace(/\./g, " ").replace(/\s+/g, " ");
    const m = s.match(/^((?:[1-3] ?)?[a-zñ]+(?: [a-zñ]+)*?)\s*(\d+)(?:\s*[:,]\s*(\d+))?(?:\s*[-–]\s*(\d+)(?:\s*[:,]\s*(\d+))?)?\s*$/);
    if (!m) return null;
    const b = bookOf(m[1]) || (ALIAS.find(([a]) => a.startsWith(m[1].trim()) && m[1].trim().length >= 3) || [])[1];
    if (!b) return null;
    const c1 = +m[2];
    if (!BOOK[b].ch[c1 - 1]) return null;
    let v1 = m[3] ? +m[3] : 1, c2 = c1, v2;
    if (m[5]) { c2 = +m[4]; v2 = +m[5]; }
    else if (m[4]) { if (m[3]) v2 = +m[4]; else { c2 = +m[4]; v2 = BOOK[b].ch[c2 - 1]; } }
    else v2 = m[3] ? +m[3] : BOOK[b].ch[c1 - 1];
    c2 = Math.min(c2, BOOK[b].ch.length);
    v2 = Math.min(v2 || 1, BOOK[b].ch[c2 - 1]);
    return { b, c1, v1, c2, v2 };
  }
  const refLabel = (r) => `${BOOK[r.b].n} ${r.c1}:${r.v1}${r.c2 !== r.c1 ? `–${r.c2}:${r.v2}` : r.v2 !== r.v1 ? `-${r.v2}` : ""}`;
  async function passage(r, ver) {
    const chs = (await load(`t/${ver}/${r.b}.json`)).c;
    const out = [];
    for (let c = r.c1; c <= r.c2; c++) {
      const vs = chs[c - 1] || [];
      const a = c === r.c1 ? r.v1 : 1, z = c === r.c2 ? r.v2 : vs.length;
      for (let v = a; v <= z; v++) if (vs[v - 1]) out.push({ c, v, t: plain(vs[v - 1]) });
    }
    return out;
  }
  async function keyWords(r) {
    const ot = BOOK[r.b].t === "AT", src = ot ? "heb" : "na", L = ot ? "H" : "G";
    const seen = new Map();
    for (let c = r.c1; c <= r.c2; c++) {
      let ch; try { ch = await load(`o/${src}/${r.b}/${c}.json`); } catch { continue; }
      const a = c === r.c1 ? r.v1 : 1, z = c === r.c2 ? r.v2 : ch.length;
      for (let v = a; v <= z; v++) for (const w of ch[v - 1] || []) {
        const m = w[2] || "";
        const content = ot ? /(^|\/)(V|Nc|Ng|Aa)/.test(m.slice(1)) : /^(V-|N-(?!PRI)|A-(?!NUI))/.test(m);
        if (!w[1] || !content) continue;
        if (!seen.has(w[1])) seen.set(w[1], { n: w[1], form: w[0], ref: `${c}:${v}`, k: 0 });
        seen.get(w[1]).k++;
      }
    }
    const list = [];
    for (const it of seen.values()) {
      const blk = await load(`lex/${L}/${Math.floor(it.n / 100)}.json`).catch(() => ({}));
      const e = blk[it.n]; if (!e) continue;
      list.push(Object.assign(it, { s: L + it.n, l: e.l, x: e.x, f: e.f, es: e.es.map((x) => x[0]).slice(0, 3), d: e.d }));
    }
    // palabras más distintivas: repetidas en el pasaje o poco frecuentes en la Biblia
    // repetidas en el pasaje (tema) y de frecuencia media en la Biblia (ni triviales ni rarezas)
    const sc = (w) => Math.min(w.k, 4) * 3 - Math.abs(Math.log(w.f + 1) - 4) * 1.2;
    const pool = list.filter((w) => w.f <= 1500);
    pool.sort((a, b) => sc(b) - sc(a));
    return { lang: ot ? "hebreo" : "griego", words: (pool.length >= 4 ? pool : list).slice(0, 8) };
  }

  /* ---------------- El encargo (prompt) ---------------- */
  const AUD = {
    "ninos-peq": { n: "niños de 3 a 5 años", g: "Frases muy cortas y concretas. Una sola idea. Repeticiones, gestos y sonidos. Nada de miedo ni amenazas. Un objeto que puedan tocar. Si propones una canción, que sea una rima original y muy corta (no copies letras existentes).", wpm: 70, kid: true },
    ninos: { n: "niños de 6 a 9 años", g: "Historia viva con diálogos y emoción, preguntas para que participen, un objeto o ilustración visual y una actividad con materiales caseros. Lenguaje sencillo. Nada de miedo ni amenazas.", wpm: 90, kid: true },
    "ninos-may": { n: "niños de 10 a 12 años", g: "Pueden razonar: conecta con su vida (colegio, amigos, pantallas, familia). Preguntas que hagan pensar y un reto para la semana. Sin infantilizar.", wpm: 100, kid: true },
    adolescentes: { n: "adolescentes de 13 a 17 años", g: "Honestidad, preguntas reales sobre identidad, presión de grupo y fe. Ejemplos actuales. Evita el moralismo y el sermón de reproche.", wpm: 115 },
    jovenes: { n: "jóvenes de 18 a 30 años", g: "Profundidad, contexto y relevancia. Responde a dudas reales con respeto. Aplicaciones prácticas y desafíos concretos.", wpm: 120 },
    adultos: { n: "adultos", g: "Exposición sólida del texto con su contexto histórico y literario, aplicación práctica para la vida familiar, laboral y espiritual.", wpm: 120 }
  };
  const FORMAT = {
    sermon: (kid) => kid
      ? "## Título\n## Para el que predica (objetivo, materiales, tiempo)\n## Comienzo con un objeto o pregunta\n## La historia o explicación (en escenas cortas; acciones y gestos entre [corchetes])\n## Lo que aprendemos (una idea clara)\n## Preguntas para los niños\n## Versículo para memorizar\n## Actividad o manualidad (materiales y pasos)\n## Oración corta\n## Notas para el predicador"
      : "## Título\n## Texto e idea central (una frase)\n## Propósito\n## Introducción\n## Contexto del pasaje (histórico y literario)\n## Desarrollo (de 2 a 4 puntos, cada uno anclado en versículos concretos del pasaje)\n## Aplicación\n## Conclusión y llamado\n## Preguntas para conversar\n## Versículo para memorizar\n## Notas para el predicador (puntos que conviene verificar, posibles malentendidos del texto)",
    historia: () => "## Título\n## Para el que cuenta (objetivo, materiales, tiempo)\n## Comienzo (gancho con un objeto o pregunta)\n## La historia (en escenas, con diálogos; gestos y acciones entre [corchetes]; fiel al relato bíblico, sin añadir hechos que cambien el sentido)\n## Preguntas\n## Lo que aprendemos\n## Versículo para memorizar\n## Actividad o manualidad (materiales caseros y pasos)\n## Oración corta",
    devocional: () => "## Título\n## Lectura\n## Reflexión (de 3 a 5 párrafos)\n## Para hoy (una aplicación concreta)\n## Oración\n## Pregunta para pensar",
    estudio: () => "## Título\n## Objetivo\n## Lectura\n## Contexto\n## Observación (preguntas sobre lo que dice el texto)\n## Interpretación (palabras clave, referencias cruzadas)\n## Aplicación\n## Preguntas para el grupo\n## Para profundizar",
    culto: () => "## Título\n## Lectura en familia\n## Explicación para todas las edades\n## Dinámica o juego corto\n## Preguntas por edades (pequeños, mayores, adultos)\n## Oración\n## Reto de la semana"
  };
  const TIPO = { sermon: "un sermón", historia: "una historia bíblica contada", devocional: "un devocional", estudio: "un estudio bíblico", culto: "un culto familiar" };

  function systemPrompt(o) {
    return [
      "Eres un asistente para preparar predicaciones y materiales bíblicos en español. Escribes con claridad, calidez y fidelidad al texto bíblico.",
      o.persp === "adventista"
        ? "Escribes desde la perspectiva de la Iglesia Adventista del Séptimo Día, coherente con sus creencias fundamentales, pero sin forzar en el pasaje doctrinas que no trata."
        : "Escribes desde una perspectiva cristiana evangélica general.",
      "REGLAS:",
      "1. El texto bíblico proporcionado es la fuente principal. Distingue lo que dice el texto de la aplicación.",
      "2. Cuando cites literalmente, usa solo el texto proporcionado. Si mencionas otros versículos, da la referencia completa (Libro capítulo:versículo); si los citas de memoria, márcalos con [verificar].",
      "3. No inventes citas textuales de Elena G. de White ni de otros autores, ni datos históricos, estadísticas o anécdotas de personas reales. Las ilustraciones inventadas deben presentarse como tales («imagina que…»).",
      "4. Usa los datos del hebreo o del griego que te doy; no añadas significados de palabras originales que no estén ahí sin marcarlos con [verificar].",
      "5. Marca con [verificar] cualquier dato del que no estés seguro.",
      "6. Escribe en Markdown, con encabezados ##, listas cuando ayuden y negritas con moderación. No añadas comentarios fuera del material."
    ].join("\n");
  }
  function userPrompt(o, pas, kw) {
    const a = AUD[o.aud];
    const words = Math.round(o.dur * a.wpm);
    const lines = [];
    lines.push(`Prepara ${TIPO[o.tipo]} para ${a.n}, para la ocasión «${o.ocasion}», de unos ${o.dur} minutos (aproximadamente ${words} palabras de texto para decir en voz alta).`);
    lines.push(`Estilo: ${{ narrativo: "narrativo, contando la historia", expositivo: "expositivo, versículo a versículo", tematico: "temático", dialogo: "participativo, con preguntas y respuestas" }[o.estilo]}.`);
    if (o.tema) lines.push(`Tema o idea central deseada: ${o.tema}.`);
    lines.push(`Público: ${a.g}`);
    const inc = [];
    if (o.ilus) inc.push("ilustraciones de la vida real (presentadas como ejemplos, no como hechos verídicos)");
    if (o.preg) inc.push("preguntas para pensar o conversar");
    if (o.llam && !a.kid) inc.push("un llamado o compromiso final respetuoso");
    if (o.llam && a.kid) inc.push("una invitación final sencilla, sin presión emocional");
    if (o.act && a.kid) inc.push("una actividad, objeto o manualidad con materiales caseros");
    if (o.mem) inc.push("un versículo para memorizar del pasaje");
    if (o.orig && kw.words.length) inc.push(`una explicación sencilla de una o dos palabras del ${kw.lang} (usa los datos de abajo)`);
    if (o.egw) inc.push("hasta tres lecturas sugeridas de Elena G. de White, solo con el título del libro y el capítulo, sin citas textuales y marcadas con [verificar]");
    if (inc.length) lines.push(`Incluye: ${inc.join("; ")}.`);
    if (o.extra) lines.push(`Indicaciones del predicador: ${o.extra}.`);
    lines.push("", `Estructura (usa estos encabezados):\n${FORMAT[o.tipo](!!a.kid)}`);
    lines.push("", `TEXTO BÍBLICO · ${o.refLabel} (${o.verName}):`);
    lines.push(pas.map((x) => `${x.c}:${x.v} ${x.t}`).join("\n"));
    if (o.orig && kw.words.length) {
      lines.push("", `PALABRAS CLAVE DEL ${kw.lang.toUpperCase()} (datos verificados del léxico de Strong; la definición está en inglés):`);
      for (const w of kw.words) lines.push(`- ${w.l} (${w.x}, ${w.s}), en ${w.ref}: se traduce como «${w.es.join("», «") || "—"}»; aparece ${w.f} veces en la Biblia. Strong: ${w.d.slice(0, 180)}`);
    }
    return lines.join("\n");
  }

  /* ---------------- Formulario ---------------- */
  const F = () => ({
    aud: $("input[name=aud]:checked").value, tipo: $("input[name=tipo]:checked").value,
    ref: $("#ref").value.trim(), ver: $("#ver").value, tema: $("#tema").value.trim(),
    dur: +$("#dur").value, estilo: $("#estilo").value, ocasion: $("#ocasion").value,
    ilus: $("#i-ilus").checked, orig: $("#i-orig").checked, preg: $("#i-preg").checked, llam: $("#i-llam").checked,
    act: $("#i-act").checked, mem: $("#i-mem").checked, egw: $("#i-egw").checked, persp: $("#persp").value, extra: $("#extra").value.trim()
  });
  const FORM_KEYS = ["ref", "ver", "tema", "dur", "estilo", "ocasion", "persp", "extra"];
  function saveForm() { const o = F(); store.set("serm-form", o); }
  function restoreForm() {
    const o = store.get("serm-form", null); if (!o) return;
    FORM_KEYS.forEach((k) => { if (o[k] != null && $("#" + k)) $("#" + k).value = o[k]; });
    for (const k of ["aud", "tipo"]) { const r = $(`input[name=${k}][value="${o[k]}"]`); if (r) r.checked = true; }
    for (const [id, k] of [["i-ilus", "ilus"], ["i-orig", "orig"], ["i-preg", "preg"], ["i-llam", "llam"], ["i-act", "act"], ["i-mem", "mem"], ["i-egw", "egw"]]) if (o[k] != null) $("#" + id).checked = o[k];
  }
  $("#form").addEventListener("change", saveForm);
  $("#form").addEventListener("input", (e) => { if (e.target.id !== "paste") saveForm(); });

  // vista previa del pasaje
  let refTimer;
  $("#ref").addEventListener("input", () => { clearTimeout(refTimer); refTimer = setTimeout(previewRef, 400); });
  $("#ver").addEventListener("change", previewRef);
  async function previewRef() {
    const box = $("#refbox"), q = $("#ref").value.trim();
    if (!q || !META) { box.hidden = true; return; }
    const r = parseRef(q);
    if (!r) { box.hidden = false; box.innerHTML = `<p class="refbox__bad">No reconozco la referencia. Prueba con «Lucas 15:11-32» o «Sal 23».</p>`; return; }
    const pas = await passage(r, $("#ver").value).catch(() => []);
    const words = pas.reduce((n, x) => n + x.t.split(" ").length, 0);
    box.hidden = false;
    box.innerHTML = `<p class="refbox__h"><b>${esc(refLabel(r))}</b> · ${pas.length} versículos${words > 2500 ? " · <span class=\"warn\">pasaje largo: la IA lo resumirá</span>" : ""} · <a href="../biblia/#${r.b}.${r.c1}.${r.v1}~${$("#ver").value},${BOOK[r.b].t === "AT" ? "heb" : "na"}~par" target="_blank" rel="noopener">abrir en la Biblia de estudio</a></p>
      <div class="refbox__t">${pas.slice(0, 40).map((x) => `<sup>${x.v}</sup>${esc(x.t)}`).join(" ")}${pas.length > 40 ? " …" : ""}</div>`;
  }

  async function prepare() {
    const o = F();
    const r = parseRef(o.ref);
    if (!r) throw new Error("No reconozco la referencia bíblica. Escribe, por ejemplo, «Lucas 15:11-32».");
    let pas = await passage(r, o.ver);
    if (!pas.length) throw new Error("No encuentro ese pasaje en la versión elegida.");
    // límite razonable para el encargo
    let cut = false;
    if (pas.length > 120) { pas = pas.slice(0, 120); cut = true; }
    const kw = o.orig ? await keyWords(r).catch(() => ({ lang: "", words: [] })) : { lang: "", words: [] };
    o.refLabel = refLabel(r) + (cut ? " (primeros 120 versículos)" : "");
    o.verName = META.versions.find((v) => v.id === o.ver).n;
    return { o, r, sys: systemPrompt(o), user: userPrompt(o, pas, kw) };
  }

  /* ---------------- Gemini ---------------- */
  const API = "https://generativelanguage.googleapis.com/v1beta";
  const cfg = store.get("serm-ai", { key: "", model: "" });
  function aiState() {
    const el = $("#ai-state"), st = window.IA.status();
    el.innerHTML = st.via === "own" ? `<span class="ok">● IA conectada</span> · ${esc(st.label)}`
      : st.via === "site" ? `<span class="ok">● IA gratuita del sitio lista</span> · no necesitas configurar nada`
      : `<span class="no">● Sin IA conectada.</span> Conecta tu clave gratuita de Gemini o usa «copiar el encargo».`;
    $("#cfg-open").textContent = st.via === "site" ? "⚙ Usar mi propia clave" : "⚙ Conectar IA gratuita";
  }
  async function listModels(key) {
    const r = await fetch(`${API}/models?pageSize=200`, { headers: { "x-goog-api-key": key } });
    if (!r.ok) { const t = await r.text(); throw new Error(r.status === 400 || r.status === 403 ? "La clave no es válida o no tiene permiso." : `Error ${r.status}: ${t.slice(0, 160)}`); }
    const d = await r.json();
    return (d.models || []).filter((m) => (m.supportedGenerationMethods || []).includes("generateContent") && /gemini/.test(m.name) &&
      !/(embedding|tts|image|vision|live|audio|robotics|computer|exp-0)/.test(m.name));
  }
  function pickModel(models) {
    const score = (n) => {
      const v = parseFloat((n.match(/gemini-(\d+(?:\.\d+)?)/) || [])[1] || 0);
      return (/flash/.test(n) ? 1000 : 0) + (/lite/.test(n) ? -300 : 0) + (/preview|exp/.test(n) ? -50 : 0) + v * 10;
    };
    return [...models].sort((a, b) => score(b.name) - score(a.name))[0]?.name || "models/gemini-2.5-flash";
  }
  const dlg = $("#cfg");
  $("#cfg-open").addEventListener("click", () => {
    $("#cfg-key").value = cfg.key;
    $("#cfg-model").innerHTML = cfg.model ? `<option value="${esc(cfg.model)}">${esc(cfg.model.replace("models/", ""))}</option>` : `<option value="">(se elige al probar la clave)</option>`;
    $("#cfg-msg").textContent = "";
    dlg.showModal ? dlg.showModal() : dlg.setAttribute("open", "");
  });
  $("#cfg-test").addEventListener("click", async () => {
    const key = $("#cfg-key").value.trim(), msg = $("#cfg-msg");
    if (!key) { msg.textContent = "Pega primero tu clave."; return; }
    msg.textContent = "Comprobando…";
    try {
      const models = await listModels(key);
      if (!models.length) throw new Error("La clave funciona, pero no encuentro modelos disponibles.");
      const best = $("#cfg-model").value && models.some((m) => m.name === $("#cfg-model").value) ? $("#cfg-model").value : pickModel(models);
      $("#cfg-model").innerHTML = models.map((m) => `<option value="${esc(m.name)}" ${m.name === best ? "selected" : ""}>${esc(m.displayName || m.name.replace("models/", ""))}</option>`).join("");
      cfg.key = key; cfg.model = best; store.set("serm-ai", cfg); aiState();
      msg.innerHTML = `✅ Conectado. Modelo: <b>${esc(best.replace("models/", ""))}</b>. Ya puedes cerrar esta ventana.`;
    } catch (e) { msg.textContent = "❌ " + e.message; }
  });
  $("#cfg-model").addEventListener("change", (e) => { if (cfg.key) { cfg.model = e.target.value; store.set("serm-ai", cfg); aiState(); } });
  $("#cfg-del").addEventListener("click", () => { cfg.key = ""; cfg.model = ""; store.set("serm-ai", cfg); $("#cfg-key").value = ""; $("#cfg-msg").textContent = "Clave borrada de este navegador."; aiState(); });

  let ctrl = null;
  async function generate(sys, user, onText) {
    ctrl = new AbortController();
    return window.IA.ask({ system: sys, prompt: user, maxTokens: 8192, onText, signal: ctrl.signal });
  }
  const md = (t) => window.IA.md(t);
  async function verify(text) {
    const box = $("#verify");
    box.hidden = false;
    box.innerHTML = await window.IA.verify(text, { base: DATA, link: "../biblia/" });
  }

  /* ---------------- Generar ---------------- */
  let current = null;
  function showDoc(text, meta) {
    $("#out-empty").hidden = true; $("#out-bar").hidden = false;
    $("#doc").innerHTML = md(text);
    current = Object.assign({ md: text }, meta || current || {});
  }
  $("#form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!window.IA.status().ok) { $("#cfg-open").click(); return; }
    const btn = $("#go");
    let P;
    try { P = await prepare(); } catch (err) { toast(err.message); return; }
    btn.disabled = true; btn.textContent = "✨ Generando…"; $("#o-stop").hidden = false;
    $("#verify").hidden = true;
    showDoc("", { title: P.o.refLabel, ref: P.o.refLabel, aud: P.o.aud, tipo: P.o.tipo });
    $("#doc").innerHTML = `<p class="loading">Preparando el borrador de ${esc(P.o.refLabel)}…</p>`;
    $("#out").scrollIntoView({ behavior: "smooth", block: "start" });
    let last = 0;
    try {
      const text = await generate(P.sys, P.user, (t) => { const now = performance.now(); if (now - last > 120) { last = now; showDoc(t); } });
      showDoc(text);
      const t1 = (text.match(/^#+\s*(?:Título:?\s*)?(.+)$/m) || [])[1];
      if (t1 && !/^título$/i.test(t1.trim())) current.title = t1.replace(/\*/g, "").trim();
      await verify(text);
      window.track?.("sermones/generado", "Sermón generado");
    } catch (err) {
      if (err.name === "AbortError") toast("Generación detenida");
      else { $("#doc").insertAdjacentHTML("beforeend", `<p class="err">❌ ${esc(err.message)}</p>`); }
    } finally {
      btn.disabled = false; btn.textContent = "✨ Generar con IA"; $("#o-stop").hidden = true; ctrl = null;
    }
  });
  $("#o-stop").addEventListener("click", () => ctrl?.abort());

  /* ---------------- Sin clave: copiar y abrir otra IA ---------------- */
  $$("[data-ext]").forEach((b) => b.addEventListener("click", async () => {
    let P; try { P = await prepare(); } catch (err) { toast(err.message); return; }
    const full = `${P.sys}\n\n---\n\n${P.user}`, ext = b.dataset.ext;
    await window.IA.external(ext, full);
    toast(ext === "copy" ? "Encargo copiado" : "Encargo copiado: si no aparece escrito, pégalo con Ctrl+V");
    window.track?.("sermones/externo/" + ext, "Encargo a " + ext);
  }));
  $("#paste-go").addEventListener("click", async () => {
    const t = $("#paste").value.trim(); if (!t) { toast("Pega primero el texto"); return; }
    const o = F();
    showDoc(t, { title: (t.match(/^#+\s*(.+)$/m) || [])[1]?.replace(/\*/g, "") || o.ref || "Borrador", ref: o.ref, aud: o.aud, tipo: o.tipo });
    await verify(t);
    $("#out").scrollIntoView({ behavior: "smooth" });
  });

  /* ---------------- Copiar, imprimir, guardar ---------------- */
  $("#o-copy").addEventListener("click", async () => { if (!current) return; try { await navigator.clipboard.writeText(current.md); toast("Copiado"); } catch { prompt("Copia el texto:", current.md); } });
  $("#o-print").addEventListener("click", () => window.print());
  const AUDN = { "ninos-peq": "Niños 3–5", ninos: "Niños 6–9", "ninos-may": "Niños 10–12", adolescentes: "Adolescentes", jovenes: "Jóvenes", adultos: "Adultos" };
  const TIPON = { sermon: "Sermón", historia: "Historia", devocional: "Devocional", estudio: "Estudio", culto: "Culto familiar" };
  function renderSaved() {
    const list = store.get("serm-saved", []);
    $("#saved").innerHTML = list.length ? list.map((s, i) => `<article class="sv"><h3>${esc(s.title || s.ref)}</h3>
      <p class="muted">${esc(s.ref || "")} · ${esc(AUDN[s.aud] || "")} · ${esc(TIPON[s.tipo] || "")} · ${new Date(s.date).toLocaleDateString("es-ES")}</p>
      <div class="sv__b"><button type="button" class="btn btn--ghost" data-sv-open="${i}">Abrir</button><button type="button" class="btn btn--ghost" data-sv-del="${i}">Borrar</button></div></article>`).join("")
      : `<p class="muted center">Todavía no has guardado ningún borrador.</p>`;
  }
  $("#o-save").addEventListener("click", () => {
    if (!current?.md) return;
    const list = store.get("serm-saved", []);
    list.unshift({ title: current.title, ref: current.ref, aud: current.aud, tipo: current.tipo, md: current.md, date: Date.now() });
    store.set("serm-saved", list.slice(0, 40)); renderSaved(); toast("Guardado en este dispositivo");
  });
  $("#saved").addEventListener("click", async (e) => {
    const o = e.target.closest("[data-sv-open]"), d = e.target.closest("[data-sv-del]");
    const list = store.get("serm-saved", []);
    if (o) { const s = list[+o.dataset.svOpen]; showDoc(s.md, s); await verify(s.md); $("#out").scrollIntoView({ behavior: "smooth" }); }
    if (d && confirm("¿Borrar este borrador?")) { list.splice(+d.dataset.svDel, 1); store.set("serm-saved", list); renderSaved(); }
  });

  function toast(msg) {
    const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; t.setAttribute("role", "status");
    document.body.appendChild(t); setTimeout(() => t.remove(), 3200);
  }

  /* ---------------- Tema ---------------- */
  try { const t = localStorage.getItem("theme"); if (t) document.documentElement.dataset.theme = t; } catch { /* nada */ }
  $(".theme-toggle").addEventListener("click", () => {
    const d = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    const n = d ? "light" : "dark"; document.documentElement.dataset.theme = n;
    try { localStorage.setItem("theme", n); } catch { /* nada */ }
  });

  /* ---------------- Inicio ---------------- */
  (async () => {
    aiState(); renderSaved();
    try { META = await load("meta.json"); } catch { toast("No se han podido cargar los datos bíblicos"); return; }
    BOOK = Object.fromEntries(META.books.map((b) => [b.id, b]));
    buildAlias();
    $("#ver").innerHTML = META.versions.filter((v) => !v.orig && v.lang === "es").map((v) => `<option value="${v.id}">${esc(v.s)} · ${esc(v.n)}</option>`).join("");
    restoreForm();
    if (!$("#ref").value) $("#ref").value = "Lucas 15:11-32";
    previewRef();
    window.__serm = { parseRef, prepare, verify, md }; // para pruebas
  })();
})();
