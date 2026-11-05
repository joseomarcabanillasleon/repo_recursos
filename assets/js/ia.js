/* =====================================================================
   IA compartida (sermones y Biblia de estudio)
   - Orden: 1) clave propia del usuario (Gemini, guardada en su navegador)
            2) IA del sitio (Cloudflare Worker, window.IA_PROXY)
   - md(): Markdown sencillo y seguro
   - verify(): comprueba las citas bíblicas de un texto con los datos de /biblia/
   ===================================================================== */
(() => {
  "use strict";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } }
  };
  const API = "https://generativelanguage.googleapis.com/v1beta";
  const own = () => store.get("serm-ai", { key: "", model: "" });
  const proxy = () => (window.IA_PROXY || "").replace(/\/+$/, "");

  function status() {
    const o = own();
    if (o.key) return { ok: true, via: "own", label: `tu clave de Gemini (${(o.model || "").replace("models/", "")})` };
    if (proxy()) return { ok: true, via: "site", label: "IA gratuita del sitio" };
    return { ok: false, via: "none", label: "sin IA conectada" };
  }

  async function readSSE(res, onData) {
    const reader = res.body.getReader(), dec = new TextDecoder();
    let buf = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
        if (!line.startsWith("data:")) continue;
        let d; try { d = JSON.parse(line.slice(5)); } catch { continue; }
        onData(d);
      }
    }
  }

  /* ask({system, prompt, maxTokens, onText, signal}) → texto completo */
  async function ask({ system, prompt, maxTokens = 4096, onText = () => {}, signal }) {
    const o = own();
    let text = "", err = null;
    if (o.key) {
      const r = await fetch(`${API}/${o.model || "models/gemini-2.5-flash"}:streamGenerateContent?alt=sse`, {
        method: "POST", signal, headers: { "Content-Type": "application/json", "x-goog-api-key": o.key },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: Math.min(maxTokens + 8192, 32768) } })
      });
      if (!r.ok) {
        if (r.status === 429) throw new Error("Se ha agotado el uso gratuito de tu clave por ahora. Espera unos minutos o usa «copiar el encargo».");
        throw new Error(`La IA respondió con un error (${r.status}). ${(await r.text()).slice(0, 180)}`);
      }
      await readSSE(r, (d) => {
        const t = d.candidates?.[0]?.content?.parts?.filter((p) => !p.thought).map((p) => p.text || "").join("") || "";
        if (t) { text += t; onText(text); }
        if (d.candidates?.[0]?.finishReason === "SAFETY") err = "La IA ha bloqueado la respuesta por sus filtros. Prueba a reformular.";
      });
    } else if (proxy()) {
      const r = await fetch(proxy() + "/chat", { method: "POST", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ system, prompt, maxTokens: 8192 }) }); // margen para el «razonamiento» del modelo
      if (!r.ok) { let m = ""; try { m = (await r.json()).error; } catch { /* nada */ } throw new Error(m || `La IA del sitio no responde (${r.status}).`); }
      await readSSE(r, (d) => {
        if (d.t) { text += d.t; onText(text); }
        if (d.error) err = d.error;
        if (d.done) ask.lastVia = d.via + (d.model ? " · " + d.model : "");
      });
    } else {
      const e = new Error("No hay IA conectada."); e.code = "NO_AI"; throw e;
    }
    if (err && !text) throw new Error(err);
    return text;
  }

  /* ---------------- Markdown ---------------- */
  function md(src) {
    const inline = (s) => esc(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, "$1<em>$2</em>")
      .replace(/\[verificar\]/gi, '<mark class="vf" title="La IA no está segura: compruébalo">[verificar]</mark>');
    const lines = String(src || "").replace(/\r/g, "").split("\n");
    let h = "", list = null, para = [];
    const flushP = () => { if (para.length) { h += `<p>${inline(para.join(" "))}</p>`; para = []; } };
    const flushL = () => { if (list) { h += `</${list}>`; list = null; } };
    for (const raw of lines) {
      const l = raw.trimEnd();
      let m;
      if (!l.trim()) { flushP(); flushL(); continue; }
      if ((m = l.match(/^(#{1,4})\s+(.*)$/))) { flushP(); flushL(); const n = Math.min(4, m[1].length + 1); h += `<h${n}>${inline(m[2])}</h${n}>`; continue; }
      if ((m = l.match(/^\s*[-*•]\s+(.*)$/))) { flushP(); if (list !== "ul") { flushL(); h += "<ul>"; list = "ul"; } h += `<li>${inline(m[1])}</li>`; continue; }
      if ((m = l.match(/^\s*\d+[.)]\s+(.*)$/))) { flushP(); if (list !== "ol") { flushL(); h += "<ol>"; list = "ol"; } h += `<li>${inline(m[1])}</li>`; continue; }
      if ((m = l.match(/^>\s?(.*)$/))) { flushP(); flushL(); h += `<blockquote>${inline(m[1])}</blockquote>`; continue; }
      if (/^---+$/.test(l)) { flushP(); flushL(); h += "<hr>"; continue; }
      flushL(); para.push(l.trim());
    }
    flushP(); flushL();
    return h;
  }

  /* ---------------- Verificador de citas ---------------- */
  let V = null; // { base, META, BOOK, ALIAS, RE }
  const norm = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  const TAG = /⟦([^|⟧]*)\|([HG]\d+)⟧/g;
  const plain = (t) => (t || "").replace(TAG, "$1");
  const cache = new Map();
  const load = (p) => { if (!cache.has(p)) cache.set(p, fetch(V.base + p).then((r) => { if (!r.ok) throw new Error(p); return r.json(); }).catch((e) => { cache.delete(p); throw e; })); return cache.get(p); };
  async function setup(base) {
    if (V && V.base === base) return V;
    V = { base };
    const META = await load("meta.json");
    const extra = { GEN: ["gen", "gn"], EXO: ["ex", "exo"], LEV: ["lev", "lv"], NUM: ["num", "nm"], DEU: ["deut", "dt"], JOS: ["jos", "josue"], JDG: ["jue"],
      RUT: ["rt"], PSA: ["sal", "salmo", "salmos"], PRO: ["prov", "pr"], ECC: ["ecl", "ec"], SNG: ["cant", "cnt", "cantar de los cantares"], ISA: ["is", "isa"],
      JER: ["jer"], LAM: ["lam", "lm"], EZK: ["ez", "eze"], DAN: ["dan", "dn"], HOS: ["os"], JOL: ["jl"], AMO: ["am"], OBA: ["abd"], JON: ["jon"], MIC: ["mi", "miq"],
      NAM: ["nah"], HAB: ["hab"], ZEP: ["sof"], HAG: ["hag"], ZEC: ["zac"], MAL: ["mal"], MAT: ["mt", "mat"], MRK: ["mr", "mc", "mar"], LUK: ["lc", "luc"],
      JHN: ["jn", "jua"], ACT: ["hch", "hech"], ROM: ["ro", "rom"], GAL: ["ga", "gal"], EPH: ["ef", "efe"], PHP: ["flp", "fil"], COL: ["col"], TIT: ["tit"],
      PHM: ["flm"], HEB: ["heb"], JAS: ["stg", "sant"], JUD: ["jud"], REV: ["ap", "apoc"], EST: ["est"], NEH: ["neh"], EZR: ["esd"] };
    const ALIAS = [];
    for (const b of META.books) {
      const set = new Set([norm(b.n), norm(b.a)]);
      (extra[b.id] || []).forEach((x) => set.add(x));
      const m = b.n.match(/^(\d) (.*)$/);
      if (m) { const base2 = norm(m[2]); [base2, base2.slice(0, 3), base2.slice(0, 2)].forEach((x) => { set.add(`${m[1]} ${x}`); set.add(`${m[1]}${x}`); }); }
      for (const a of set) if (a.length >= 2) ALIAS.push([a, b.id]);
    }
    ALIAS.sort((a, b) => b[0].length - a[0].length);
    const alt = ALIAS.map(([a]) => a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s?")).join("|");
    Object.assign(V, { META, BOOK: Object.fromEntries(META.books.map((b) => [b.id, b])), ALIAS,
      RE: new RegExp(`(?<![a-z0-9])(${alt})\\.?\\s+(\\d{1,3})\\s*[:.,]\\s*(\\d{1,3})(?:\\s*[-–]\\s*(\\d{1,3}))?`, "g") });
    return V;
  }
  const bookOf = (name) => { const n = norm(name); const hit = V.ALIAS.find(([a]) => a === n || a.replace(/ /g, "") === n.replace(/ /g, "")); return hit ? hit[1] : null; };
  const tokens = (s) => norm(s).replace(/[^a-zñ0-9 ]/g, " ").split(" ").filter((w) => w.length > 2);
  const overlap = (a, b) => { const A = tokens(a), B = new Set(tokens(b)); return A.length ? A.filter((w) => B.has(w)).length / A.length : 0; };
  const VERS_ES = ["rv1909", "bes", "pdpt", "blm", "vbl"];

  /* verify(texto, {base, link}) → HTML del informe */
  async function verify(text, { base = "../biblia/data/", link = "../biblia/" } = {}) {
    await setup(base);
    text = String(text || "").normalize("NFC");
    const n = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    V.RE.lastIndex = 0;
    const found = new Map(); let m;
    while ((m = V.RE.exec(n))) {
      const b = bookOf(m[1]); if (!b) continue;
      const c = +m[2], v1 = +m[3], v2 = m[4] ? +m[4] : v1;
      const key = `${b}.${c}.${v1}-${v2}`;
      if (!found.has(key)) found.set(key, { b, c, v1, v2, at: m.index, len: m[0].length });
    }
    if (!found.size) return `<h3>🔎 Verificador de citas</h3><p class="muted">No he encontrado referencias bíblicas con capítulo y versículo en el texto.</p>`;
    let rows = "", okN = 0, badN = 0, warnN = 0;
    for (const f of found.values()) {
      const B = V.BOOK[f.b];
      const lab = `${B.n} ${f.c}:${f.v1}${f.v2 !== f.v1 ? "-" + f.v2 : ""}`;
      const chs = (await load(`t/rv1909/${f.b}.json`)).c, vs = chs[f.c - 1];
      if (!vs || !vs[f.v1 - 1] || !vs[f.v2 - 1]) { badN++; rows += `<li class="v-bad"><b>❌ ${esc(lab)}</b> — esta cita no existe (el capítulo o el versículo no están en la Biblia). Corrígela.</li>`; continue; }
      const real = vs.slice(f.v1 - 1, f.v2).map(plain).join(" ");
      const qs = [];
      const bef = text.slice(Math.max(0, f.at - 600), f.at).match(/[«“"]([^«»“”"]{15,500})[»”"][.,;]?\s*[(\[—–-]?\s*$/);
      const aft = text.slice(f.at + f.len, f.at + f.len + 600).match(/^\s*[)\]]?\s*[:—–-]?\s*[«“"]([^«»“”"]{15,500})[»”"]/);
      if (bef) qs.push(bef[1]); if (aft) qs.push(aft[1]);
      let note = "", warn = false;
      if (qs.length) {
        let best = 0, bestV = "";
        for (const vid of VERS_ES) {
          const vv = (await load(`t/${vid}/${f.b}.json`).catch(() => ({ c: [] }))).c[f.c - 1] || [];
          const t = vv.slice(f.v1 - 1, f.v2).map(plain).join(" ");
          for (const q of qs) { const o = overlap(q, t); if (o > best) { best = o; bestV = vid; } }
        }
        if (best >= 0.6) note = `<span class="v-tag ok">la cita coincide con ${esc(V.META.versions.find((x) => x.id === bestV).s)}</span>`;
        else { note = `<span class="v-tag warn">⚠️ el texto citado no coincide con este versículo: revísalo</span>`; warn = true; warnN++; }
      }
      if (!warn) okN++;
      rows += `<li class="${warn ? "v-warn" : "v-ok"}"><a href="${link}#${f.b}.${f.c}.${f.v1}~rv1909,pdpt,${B.t === "AT" ? "heb" : "na"}~ver" target="_blank" rel="noopener"><b>${warn ? "⚠️" : "✅"} ${esc(lab)}</b></a> ${note}<span class="v-real">RV1909: ${esc(real.length > 420 ? real.slice(0, 420) + "…" : real)}</span></li>`;
    }
    return `<h3>🔎 Verificador de citas</h3>
      <p class="v-sum"><b>${found.size}</b> referencias · <span class="ok">${okN} correctas</span>${warnN ? ` · <span class="warnc">${warnN} para revisar</span>` : ""}${badN ? ` · <span class="badc">${badN} inexistentes</span>` : ""}</p>
      <p class="muted">Abre cada referencia para leerla en su contexto y en el original. Comprueba también lo marcado como <mark class="vf">[verificar]</mark>.</p>
      <ul class="v-list">${rows}</ul>`;
  }

  /* abrir una IA externa con el encargo copiado */
  async function external(where, full) {
    try { await navigator.clipboard.writeText(full); } catch { prompt("Copia el encargo:", full); }
    const q = encodeURIComponent(full), short = full.length < 7000;
    const urls = { chatgpt: short ? `https://chatgpt.com/?q=${q}` : "https://chatgpt.com/", claude: short ? `https://claude.ai/new?q=${q}` : "https://claude.ai/new", gemini: "https://gemini.google.com/app" };
    if (urls[where]) window.open(urls[where], "_blank", "noopener");
  }

  window.IA = { ask, status, md, verify, external, esc };
})();
