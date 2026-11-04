/* =====================================================================
   Biblia de estudio · lector en paralelo, interlineal, versículo y búsqueda
   Datos estáticos en ./data (generados con tools/biblia/build.py)
   ===================================================================== */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const M = window.Morfo;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } }
  };
  const fmt = (n) => n.toLocaleString("es-ES");

  /* ---------------- Carga de datos con caché ---------------- */
  const cache = new Map();
  function load(path) {
    if (!cache.has(path)) cache.set(path, fetch("data/" + path).then((r) => { if (!r.ok) throw new Error(path); return r.json(); }).catch((e) => { cache.delete(path); throw e; }));
    return cache.get(path);
  }
  const loadTrans = (v, b) => load(`t/${v}/${b}.json`).then((d) => d.c);
  const loadOrig = (v, b, c) => load(`o/${v}/${b}/${c}.json`).catch(() => []);
  const lexEntry = async (s) => { const L = s[0], n = +s.slice(1); const d = await load(`lex/${L}/${Math.floor(n / 100)}.json`); return d[n] || null; };
  const concRefs = async (s) => { const L = s[0], n = +s.slice(1); try { const d = await load(`conc/${L}/${Math.floor(n / 100)}.json`); return d[n] || []; } catch { return []; } };

  /* ---------------- Estado ---------------- */
  let META, BOOK, VER;
  const ORIG = ["heb", "tr", "na"];
  const S = Object.assign({
    book: "JHN", ch: 1, verse: null, mode: "par",
    vers: ["rv1909", "pdpt", "heb", "na"],
    vowels: true, cant: false, translit: true, morph: true, strong: false, size: 18, base: "rv1909"
  }, store.get("biblia-st", {}));
  const save = () => store.set("biblia-st", { vers: S.vers, vowels: S.vowels, cant: S.cant, translit: S.translit, morph: S.morph, strong: S.strong, size: S.size, base: S.base, mode: S.mode });

  const bookName = (id) => BOOK[id]?.n || id;
  const isOT = (id) => BOOK[id]?.t === "AT";
  const verAvail = (v, b = S.book) => { const o = VER[v]; return !o.only || o.only === (isOT(b) ? "AT" : "NT"); };
  const refStr = (b, c, v) => `${bookName(b)} ${c}${v ? ":" + v : ""}`;
  const refFromInt = (r) => { const bi = Math.floor(r / 1e6), c = Math.floor(r / 1e3) % 1e3, v = r % 1e3; return [META.books[bi - 1].id, c, v]; };

  /* ---------------- Interpretar referencias ---------------- */
  const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  let ALIAS = [];
  function buildAlias() {
    const extra = { GEN: ["gen", "gn"], EXO: ["ex", "exo"], LEV: ["lev", "lv"], NUM: ["num", "nm"], DEU: ["deut", "dt"], JOS: ["jos", "josue"],
      JDG: ["jue", "jueces"], RUT: ["rut", "rt"], PSA: ["sal", "salmo", "salmos", "ps"], PRO: ["prov", "pr"], ECC: ["ecl", "ec", "eclesiastes"],
      SNG: ["cant", "cnt", "cantar", "cantares"], ISA: ["is", "isa", "isaias"], JER: ["jer"], LAM: ["lam", "lm"], EZK: ["ez", "eze", "ezequiel"],
      DAN: ["dan", "dn"], HOS: ["os", "oseas"], JOL: ["jl", "joel"], AMO: ["am", "amos"], OBA: ["abd"], JON: ["jon", "jonas"], MIC: ["mi", "miq"],
      NAM: ["nah", "nahum"], HAB: ["hab"], ZEP: ["sof"], HAG: ["hag"], ZEC: ["zac"], MAL: ["mal"], MAT: ["mt", "mat", "mateo"], MRK: ["mr", "mc", "mar", "marcos"],
      LUK: ["lc", "luc", "lucas"], JHN: ["jn", "juan", "jua"], ACT: ["hch", "hech", "hechos"], ROM: ["ro", "rom"], GAL: ["ga", "gal"], EPH: ["ef", "efe"],
      PHP: ["flp", "fil", "filipenses"], COL: ["col"], TIT: ["tit"], PHM: ["flm", "filem"], HEB: ["heb", "he"], JAS: ["stg", "sant", "santiago"],
      JUD: ["jud", "judas"], REV: ["ap", "apoc", "apocalipsis"], EST: ["est"], NEH: ["neh"], EZR: ["esd"], JOB: ["job"] };
    for (const b of META.books) {
      const set = new Set([norm(b.n), norm(b.a).replace(/ /g, ""), norm(b.a), b.id.toLowerCase()]);
      (extra[b.id] || []).forEach((x) => set.add(x));
      const m = b.n.match(/^(\d) (.*)$/);
      if (m) { const base = norm(m[2]); [base, base.slice(0, 3), base.slice(0, 2)].forEach((x) => { set.add(m[1] + x); set.add(m[1] + " " + x); }); }
      for (const a of set) ALIAS.push([a, b.id]);
    }
    ALIAS.sort((a, b) => b[0].length - a[0].length);
  }
  function parseRef(q) {
    const s = norm(q).replace(/\./g, " ");
    const m = s.match(/^((?:[1-3] ?)?[a-zñ]+(?: [a-zñ]+)?)\s*(\d+)?(?:\s*[:,.]\s*(\d+))?/);
    if (!m) return null;
    const name = m[1].trim();
    let hit = ALIAS.find(([a]) => a === name) || ALIAS.find(([a]) => a.startsWith(name) && name.length >= 2) ||
      ALIAS.find(([a]) => name.startsWith(a) && a.length >= 3);
    if (!hit) return null;
    const b = hit[0] && hit[1];
    const maxC = BOOK[b].ch.length;
    const c = Math.min(maxC, Math.max(1, +(m[2] || 1)));
    const v = m[3] ? Math.max(1, +m[3]) : null;
    return { b, c, v };
  }

  /* ---------------- Render de textos ---------------- */
  const TAG = /⟦([^|⟧]*)\|([HG]\d+)⟧/g;
  const plain = (t) => (t || "").replace(TAG, "$1");
  function transHTML(t, tagged) {
    const e = esc(t || "");
    return e.replace(/⟦([^|⟧]*)\|([HG]\d+)⟧/g, (_, w, s) => tagged ? `<span class="w" data-s="${s}">${w}</span>${S.strong ? `<sup class="sn">${s}</sup>` : ""}` : w);
  }
  function hebText(w) { let t = w; if (!S.cant) t = M.stripCant(t); if (!S.vowels) t = M.stripVowels(t); return t; }
  function origWordHTML(w, v, i) {
    const pref = v === "heb" ? "H" : "G";
    const s = w[1] ? pref + w[1] : "";
    const txt = v === "heb" ? hebText(w[0]) : w[0];
    return `<span class="ow" data-v="${v}" data-i="${i}"${s ? ` data-s="${s}"` : ""}>${esc(txt)}${S.strong && s ? `<sup class="sn">${s}</sup>` : ""}</span>`;
  }
  const origVerseHTML = (ws, v) => (ws || []).map((w, i) => origWordHTML(w, v, i)).join(" ");

  /* ---------------- Vista ---------------- */
  const view = $("#view");
  let CUR = { trans: {}, orig: {} }; // datos del capítulo actual
  let renderSeq = 0;

  async function loadChapter() {
    const b = S.book, c = S.ch, seq = ++renderSeq;
    const vs = S.vers.filter((v) => verAvail(v));
    const out = { trans: {}, orig: {} };
    await Promise.all(vs.map(async (v) => {
      if (VER[v].orig) out.orig[v] = await loadOrig(v, b, c);
      else { try { out.trans[v] = (await loadTrans(v, b))[c - 1] || []; } catch { out.trans[v] = []; } }
    }));
    if (seq !== renderSeq) return null;
    return out;
  }

  async function render(opts = {}) {
    syncControls();
    $("#ref-title").textContent = refStr(S.book, S.ch);
    document.title = `${refStr(S.book, S.ch, S.verse)} · Biblia de estudio · Recursos Adventistas`;
    writeHash();
    if (S.mode === "bus") { renderSearch(); return; }
    view.innerHTML = `<p class="loading">Cargando ${esc(refStr(S.book, S.ch))}…</p>`;
    const data = await loadChapter();
    if (!data) return;
    CUR = data;
    const vs = S.vers.filter((v) => verAvail(v));
    // aviso de numeración distinta
    const lens = vs.map((v) => (VER[v].orig ? data.orig[v] : data.trans[v])?.length || 0).filter(Boolean);
    const notice = $("#notice");
    const hasOrig = vs.some((v) => VER[v].orig);
    if (hasOrig && lens.length > 1 && Math.max(...lens) !== Math.min(...lens)) {
      notice.hidden = false;
      notice.textContent = "En este capítulo la numeración de los versículos no coincide entre el original y las traducciones. Es frecuente en los Salmos con título, donde el título es el versículo 1 en hebreo.";
    } else notice.hidden = true;
    if (S.mode === "par") renderParallel(vs);
    else if (S.mode === "int") await renderInterlinear(vs);
    else if (S.mode === "ver") await renderVerse();
    if (S.verse && opts.scroll !== false && S.mode !== "ver") {
      const el = view.querySelector(`[data-vn="${S.verse}"]`);
      if (el) { el.classList.add("is-target"); setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 50); }
    }
  }

  function renderParallel(vs) {
    if (!vs.length) { view.innerHTML = `<p class="empty">Elige al menos una versión en «Versiones y ajustes».</p>`; return; }
    const n = Math.max(...vs.map((v) => (VER[v].orig ? CUR.orig[v] : CUR.trans[v])?.length || 0));
    let h = `<div class="par" style="--cols:${vs.length}"><div class="par__row par__head"><span></span>${vs.map((v) => `<span class="ph ph--${VER[v].lang}">${esc(VER[v].s)}</span>`).join("")}</div>`;
    for (let i = 0; i < n; i++) {
      h += `<div class="par__row" data-vn="${i + 1}"><button type="button" class="vn" data-vn-go="${i + 1}" title="Ver el versículo ${i + 1} en todas las versiones">${i + 1}</button>`;
      for (const v of vs) {
        const o = VER[v];
        if (o.orig) {
          const ws = CUR.orig[v]?.[i];
          h += `<div class="pc pc--${o.lang}" data-label="${esc(o.s)}" ${o.lang === "he" ? 'dir="rtl" lang="he"' : 'lang="grc"'}>${ws ? origVerseHTML(ws, v) : ""}</div>`;
        } else {
          const t = CUR.trans[v]?.[i];
          h += `<div class="pc pc--${o.lang}" data-label="${esc(o.s)}" lang="${o.lang}">${t ? transHTML(t, o.tag) : ""}</div>`;
        }
      }
      h += `</div>`;
    }
    view.innerHTML = h + `</div>`;
  }

  async function renderInterlinear(vs) {
    const ov = isOT(S.book) ? "heb" : (S.vers.includes("tr") && !S.vers.includes("na") ? "tr" : "na");
    const L = ov === "heb" ? "H" : "G";
    const [orig, gl] = await Promise.all([loadOrig(ov, S.book, S.ch), load(`gl/${L}.json`)]);
    const base = S.base && !VER[S.base].orig ? S.base : "rv1909";
    const baseCh = (await loadTrans(base, S.book).catch(() => []))[S.ch - 1] || [];
    // traducciones etiquetadas para la glosa en contexto
    const tagged = {};
    for (const t of ["rv1909", "pdpt", "blm"]) tagged[t] = (await loadTrans(t, S.book).catch(() => []))[S.ch - 1] || [];
    const ctxGloss = (vi, s) => {
      for (const t of ["rv1909", "pdpt", "blm"]) {
        const txt = tagged[t][vi]; if (!txt) continue;
        TAG.lastIndex = 0; let m;
        while ((m = TAG.exec(txt))) if (m[2] === s) { const g = m[1].replace(/^[¡¿("«“]+|[)»”.,;:!?]+$/g, ""); return g.length > 26 ? g.split(" ").slice(-3).join(" ") : g; }
      }
      return null;
    };
    const rtl = ov === "heb";
    const parseM = (m) => (ov === "heb" ? M.hebrew(m) : M.greek(m));
    let h = `<div class="intl ${rtl ? "intl--he" : "intl--grc"}">`;
    h += `<p class="intl__src">Texto: <strong>${esc(VER[ov].n)}</strong> · Traducción de abajo: <label>versión <select id="int-base">${META.versions.filter((v) => !v.orig).map((v) => `<option value="${v.id}" ${v.id === base ? "selected" : ""}>${esc(v.s)}</option>`).join("")}</select></label>${ov !== "heb" ? ` · <button type="button" class="linkbtn" id="int-swap">Cambiar a ${ov === "na" ? "Textus Receptus" : "Nestle 1904"}</button>` : ""}</p>`;
    orig.forEach((ws, vi) => {
      h += `<div class="intl__v" data-vn="${vi + 1}"><button type="button" class="vn" data-vn-go="${vi + 1}">${vi + 1}</button><div class="intl__words" ${rtl ? 'dir="rtl"' : ""}>`;
      ws.forEach((w, i) => {
        const s = w[1] ? L + w[1] : "";
        const g = s ? (ctxGloss(vi, s) || gl[w[1]] || "") : "";
        const txt = rtl ? hebText(w[0]) : w[0];
        const tl = rtl ? M.trHebrew(w[0]) : M.trGreek(w[0]);
        const pm = w[2] ? parseM(w[2]).short : "";
        h += `<button type="button" class="iw" data-v="${ov}" data-i="${i}" data-vi="${vi}"${s ? ` data-s="${s}"` : ""}>
          <span class="iw__o" ${rtl ? 'lang="he"' : 'lang="grc"'}>${esc(txt)}</span>
          ${S.translit ? `<span class="iw__t">${esc(tl)}</span>` : ""}
          <span class="iw__g">${esc(g)}</span>
          ${S.strong && s ? `<span class="iw__s">${s}</span>` : ""}
          ${S.morph && pm ? `<span class="iw__m">${esc(pm)}</span>` : ""}
        </button>`;
      });
      h += `</div><p class="intl__tr" lang="${VER[base].lang}"><span class="intl__tl">${esc(VER[base].s)}</span> ${transHTML(baseCh[vi] || "", VER[base].tag)}</p></div>`;
    });
    if (!orig.length) h += `<p class="empty">No hay texto original para este capítulo.</p>`;
    view.innerHTML = h + "</div>";
    $("#int-base")?.addEventListener("change", (e) => { S.base = e.target.value; save(); render({ scroll: false }); });
    $("#int-swap")?.addEventListener("click", () => {
      const to = ov === "na" ? "tr" : "na";
      S.vers = S.vers.filter((v) => v !== "tr" && v !== "na"); S.vers.push(to); save(); render({ scroll: false });
    });
  }

  /* ---- Diferencias palabra a palabra (LCS) ---- */
  function diffWords(a, b, nf) {
    const A = a.map(nf), B = b.map(nf), n = A.length, m = B.length;
    const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const inB = new Array(m).fill(false), missing = [];
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (A[i] === B[j]) { inB[j] = true; i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) { missing.push(a[i]); i++; }
      else j++;
    }
    while (i < n) missing.push(a[i++]);
    return { same: inB, missing };
  }
  const normEs = (w) => w.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-zñ0-9]/g, "");

  async function renderVerse() {
    const v = S.verse || 1;
    const all = META.versions.filter((x) => verAvail(x.id));
    const texts = {};
    await Promise.all(all.map(async (x) => {
      if (x.orig) texts[x.id] = (await loadOrig(x.id, S.book, S.ch))[v - 1] || null;
      else texts[x.id] = ((await loadTrans(x.id, S.book).catch(() => []))[S.ch - 1] || [])[v - 1] || null;
    }));
    const maxV = ((await loadTrans("rv1909", S.book).catch(() => []))[S.ch - 1] || []).length;
    const base = S.base && !VER[S.base].orig ? S.base : "rv1909";
    let h = `<div class="vv">
      <div class="vv__top">
        <div class="vv__nav"><button type="button" class="ib" id="vv-prev" aria-label="Versículo anterior">‹</button>
          <strong>${esc(refStr(S.book, S.ch, v))}</strong>
          <button type="button" class="ib" id="vv-next" aria-label="Versículo siguiente">›</button></div>
        <label class="vv__base">Marcar diferencias respecto a <select id="vv-base">${all.filter((x) => !x.orig).map((x) => `<option value="${x.id}" ${x.id === base ? "selected" : ""}>${esc(x.s)}</option>`).join("")}</select></label>
        <div class="vv__act"><button type="button" class="btn btn--ghost" id="vv-copy">Copiar</button><button type="button" class="btn btn--ghost" id="vv-share">Compartir enlace</button></div>
      </div>
      <p class="vv__legend"><span class="dif">palabra distinta</span> respecto a la versión de referencia (en el mismo idioma) · En griego se comparan el Textus Receptus y el Nestle 1904.</p>`;
    const baseWords = plain(texts[base] || "").split(/\s+/).filter(Boolean);
    for (const x of all) {
      const t = texts[x.id];
      h += `<article class="vv__card vv__card--${x.lang}${x.id === base ? " is-base" : ""}"><header><b>${esc(x.s)}</b><span>${esc(x.n)}</span></header>`;
      if (!t) { h += `<p class="muted">—</p></article>`; continue; }
      if (x.orig) {
        let marks = null;
        if (x.lang === "grc") {
          const other = texts[x.id === "tr" ? "na" : "tr"];
          if (other) {
            const d = diffWords(other.map((w) => w[0]), t.map((w) => w[0]), M.normGreek);
            marks = d.same;
            if (d.missing.length) h += `<p class="vv__miss">Le faltan respecto al ${x.id === "tr" ? "Nestle 1904" : "Textus Receptus"}: <span lang="grc">${esc(d.missing.join(" "))}</span></p>`;
          }
        }
        h += `<p class="vv__t vv__t--${x.lang}" ${x.lang === "he" ? 'dir="rtl" lang="he"' : 'lang="grc"'}>${t.map((w, i) => {
          const html = origWordHTML(w, x.id, i);
          return marks && !marks[i] ? `<span class="dif">${html}</span>` : html;
        }).join(" ")}</p>`;
      } else {
        const words = plain(t).split(/\s+/).filter(Boolean);
        let body;
        if (x.id !== base && x.lang === VER[base].lang && baseWords.length) {
          const d = diffWords(baseWords, words, normEs);
          body = words.map((w, i) => (d.same[i] ? esc(w) : `<span class="dif">${esc(w)}</span>`)).join(" ");
        } else body = transHTML(t, x.tag);
        h += `<p class="vv__t" lang="${x.lang}">${body}</p>`;
      }
      h += `</article>`;
    }
    // palabra por palabra
    const ov = isOT(S.book) ? "heb" : "na", ws = texts[ov];
    if (ws && ws.length) {
      const L = ov === "heb" ? "H" : "G";
      const gl = await load(`gl/${L}.json`);
      h += `<h3 class="vv__h">Palabra por palabra · ${esc(VER[ov].s)}</h3><div class="wtab-wrap"><table class="wtab"><thead><tr><th>Original</th><th>Transliteración</th><th>Glosa</th><th>Strong</th><th>Análisis</th></tr></thead><tbody>`;
      ws.forEach((w, i) => {
        const s = w[1] ? L + w[1] : "";
        const an = ov === "heb" ? M.hebrew(w[2]).long : M.greek(w[2]).long;
        h += `<tr><td class="${ov === "heb" ? "he" : "grc"}"><span class="ow" data-v="${ov}" data-i="${i}"${s ? ` data-s="${s}"` : ""}>${esc(ov === "heb" ? hebText(w[0]) : w[0])}</span></td>
          <td>${esc(ov === "heb" ? M.trHebrew(w[0]) : M.trGreek(w[0]))}</td><td>${esc(w[1] ? gl[w[1]] || "" : "")}</td>
          <td>${s ? `<button type="button" class="linkbtn" data-open="${s}">${s}</button>` : ""}</td><td>${esc(an)}</td></tr>`;
      });
      h += `</tbody></table></div>`;
    }
    h += aiBoxHTML("vv", "Pregunta a la IA sobre este versículo", [
      ["explicar", "✨ Explícame este versículo"], ["difieren", "✨ ¿Por qué difieren las traducciones?"], ["ninos", "✨ Explícalo para niños"]]);
    view.innerHTML = h + "</div>";
    const nV = maxV;
    $("#vv-prev").onclick = () => { if (v > 1) { S.verse = v - 1; render(); } else goChapter(-1, true); };
    $("#vv-next").onclick = () => { if (!nV || v < nV) { S.verse = v + 1; render(); } else goChapter(1); };
    $("#vv-base").onchange = (e) => { S.base = e.target.value; save(); render(); };
    $("#vv-copy").onclick = async () => {
      const lines = [refStr(S.book, S.ch, v)];
      for (const x of all) { const t = texts[x.id]; if (!t) continue; lines.push(`${x.s}: ${x.orig ? t.map((w) => w[0]).join(" ") : plain(t)}`); }
      await copy(lines.join("\n"), "Versículo copiado en todas las versiones");
    };
    $("#vv-share").onclick = () => copy(location.href, "Enlace copiado");
    wireAI("vv", async (kind, q) => verseContext(v, texts, all, kind, q));
  }

  /* ---------------- IA: explicar versículos y palabras ---------------- */
  const AI_SYS = [
    "Eres un asistente de estudio bíblico en español, riguroso y claro. Ayudas a entender el texto, no a confirmar ideas previas.",
    "Distingue siempre: 1) lo que dice literalmente el texto; 2) su contexto histórico y literario; 3) las interpretaciones posibles. Si hay debate entre intérpretes cristianos, dilo y resume las posturas principales. Puedes señalar la lectura adventista del séptimo día cuando sea pertinente, sin forzarla.",
    "Usa los datos que te doy (versiones, hebreo o griego, léxico). No inventes significados de palabras originales, citas de autores ni datos históricos. Si citas otros versículos, da la referencia completa (Libro capítulo:versículo). Marca con [verificar] lo que no puedas asegurar.",
    "Escribe en Markdown con encabezados ##, de forma concisa (entre 250 y 600 palabras salvo que se pida otra cosa)."
  ].join("\n");
  function aiBoxHTML(id, title, buttons, compact) {
    const st = window.IA ? window.IA.status() : { ok: false };
    return `<section class="aibox${compact ? " aibox--c" : ""}" id="${id}-ai">
      <p class="aibox__t">${esc(title)} <small>${st.ok ? esc(st.via === "site" ? "IA gratuita del sitio" : "con tu clave de Gemini") : "sin IA conectada: se copia el encargo"}</small></p>
      <div class="aibox__b">${buttons.map(([k, l]) => `<button type="button" class="btn btn--ghost" data-ai="${k}">${esc(l)}</button>`).join("")}</div>
      ${compact ? "" : `<form class="aibox__q" data-ai-form><input placeholder="Escribe tu pregunta sobre este pasaje…" aria-label="Tu pregunta"><button class="btn btn--primary btn--plain" type="submit">Preguntar</button></form>`}
      <div class="aibox__ext" hidden>Sin IA conectada en esta web. Copia el encargo y pégalo en
        <button type="button" class="linkbtn" data-ext="chatgpt">ChatGPT</button>, <button type="button" class="linkbtn" data-ext="claude">Claude</button> o <button type="button" class="linkbtn" data-ext="gemini">Gemini</button>.</div>
      <div class="aibox__out doc" aria-live="polite"></div><div class="aibox__ver verify"></div>
    </section>`;
  }
  function wireAI(id, build) {
    const box = $(`#${id}-ai`); if (!box) return;
    const out = $(".aibox__out", box), ver = $(".aibox__ver", box);
    let ctrl = null, lastFull = "";
    async function run(kind, q) {
      const P = await build(kind, q);
      lastFull = `${P.system}\n\n---\n\n${P.prompt}`;
      if (!window.IA.status().ok) { $(".aibox__ext", box).hidden = false; out.innerHTML = ""; return; }
      ctrl?.abort(); ctrl = new AbortController();
      out.innerHTML = `<p class="loading">Pensando…</p>`; ver.innerHTML = "";
      let last = 0;
      try {
        const t = await window.IA.ask({ system: P.system, prompt: P.prompt, maxTokens: P.max || 2048, signal: ctrl.signal,
          onText: (txt) => { const n = performance.now(); if (n - last > 120) { last = n; out.innerHTML = window.IA.md(txt); } } });
        out.innerHTML = window.IA.md(t) + `<p class="aibox__note">Respuesta generada por IA: compárala con el texto y con las fuentes antes de usarla.</p>`;
        ver.innerHTML = await window.IA.verify(t, { base: "data/", link: "" });
        window.track?.("biblia/ia/" + kind, "IA en la Biblia");
      } catch (err) {
        if (err.name !== "AbortError") out.innerHTML = `<p class="err">❌ ${esc(err.message)}</p>`;
      }
    }
    $$("[data-ai]", box).forEach((b) => b.addEventListener("click", () => run(b.dataset.ai)));
    $("[data-ai-form]", box)?.addEventListener("submit", (e) => { e.preventDefault(); const q = $("input", e.target).value.trim(); if (q) run("pregunta", q); });
    $$(".aibox__ext [data-ext]", box).forEach((b) => b.addEventListener("click", () => { window.IA.external(b.dataset.ext, lastFull); toast("Encargo copiado: pégalo con Ctrl+V si no aparece"); }));
  }
  async function verseContext(v, texts, all, kind, q) {
    const ref = refStr(S.book, S.ch, v);
    const base = ((await loadTrans("rv1909", S.book).catch(() => []))[S.ch - 1]) || [];
    const ctxV = base.map((t, i) => [i + 1, plain(t)]).filter(([n]) => n >= v - 4 && n <= v + 4).map(([n, t]) => `${n} ${t}`).join("\n");
    const ov = isOT(S.book) ? "heb" : "na", L = ov === "heb" ? "H" : "G";
    const ws = texts[ov] || [];
    const gl = await load(`gl/${L}.json`).catch(() => ({}));
    const wl = ws.map((w) => `${w[0]} (${ov === "heb" ? M.trHebrew(w[0]) : M.trGreek(w[0])}; ${w[1] ? L + w[1] : "—"}; «${gl[w[1]] || ""}»; ${ov === "heb" ? M.hebrew(w[2]).long : M.greek(w[2]).long}${ov === "na" && w[3] ? "; lema " + w[3] : ""})`).join("\n");
    const lexs = [];
    for (const w of ws) {
      if (!w[1] || lexs.length >= 6) continue;
      const m = w[2] || "";
      if (!(ov === "heb" ? /(^|\/)(V|Nc|Aa)/.test(m.slice(1)) : /^(V-|N-(?!PRI)|A-)/.test(m))) continue;
      const e = await lexEntry(L + w[1]).catch(() => null);
      if (e && !lexs.some((x) => x.s === L + w[1])) lexs.push({ s: L + w[1], e });
    }
    const vers = all.filter((x) => texts[x.id]).map((x) => `${x.s}: ${x.orig ? texts[x.id].map((w) => w[0]).join(" ") : plain(texts[x.id])}`).join("\n");
    const ask = {
      explicar: `Explícame ${ref}: qué dice, su contexto en el capítulo y en el libro, el significado de las palabras clave del original y una aplicación breve.`,
      difieren: `Compara cómo traducen ${ref} las distintas versiones. Explica las diferencias importantes, por qué se producen (texto original, variantes del manuscrito como Textus Receptus frente a Nestle 1904, decisiones de traducción) y cuál se ajusta mejor al original.`,
      ninos: `Explica ${ref} para niños de 6 a 10 años: muy sencillo, con un ejemplo de su vida, una pregunta para pensar y una frase para recordar. Fiel al texto.`,
      pregunta: `Pregunta sobre ${ref}: ${q}`
    }[kind];
    const prompt = [ask, "", `VERSÍCULO EN TODAS LAS VERSIONES (${ref}):`, vers, "", `CONTEXTO (RV1909, ${bookName(S.book)} ${S.ch}):`, ctxV,
      ws.length ? `\nPALABRA POR PALABRA (${VER[ov].n}; forma, transliteración, Strong, glosa, análisis):\n${wl}` : "",
      lexs.length ? `\nLÉXICO DE STRONG (definiciones en inglés):\n${lexs.map(({ s, e }) => `- ${e.l} ${s} (${e.x}): ${e.d} · se traduce: ${e.es.map((x) => x[0]).join(", ")} · ${e.f} apariciones`).join("\n")}` : ""].join("\n");
    return { system: AI_SYS, prompt, max: kind === "ninos" ? 1200 : 2048 };
  }
  async function wordContext(s, e, refs, ctx) {
    const sample = [];
    for (const r of refs.slice(0, 10)) {
      const [b, c, v] = refFromInt(r);
      const t = ((await loadTrans("rv1909", b).catch(() => []))[c - 1] || [])[v - 1];
      if (t) sample.push(`${refStr(b, c, v)}: ${plain(t)}`);
    }
    const prompt = [`Explícame la palabra ${s[0] === "H" ? "hebrea" : "griega"} ${e.l} (${e.x}, Strong ${s}): su significado básico, sus matices, cómo la traducen las versiones españolas y qué aporta al leer los pasajes donde aparece. Si hay palabras cercanas con las que se confunde, menciónalas.`,
      ctx && ctx.w ? `La consulta viene de ${refStr(S.book, S.ch, ctx.vn)}, donde aparece como «${ctx.w[0]}».` : "",
      "", `DATOS DEL LÉXICO DE STRONG (inglés): ${e.d}`, `KJV la traduce: ${e.k}`, `Origen: ${e.o}`,
      `Traducciones al español (recuento en RV1909, PDPT y BLM): ${e.es.map(([w, n]) => `${w} (${n})`).join(", ")}`,
      `Aparece ${e.f} veces en ${refs.length} versículos.`, "", "PRIMERAS APARICIONES (RV1909):", ...sample].join("\n");
    return { system: AI_SYS, prompt, max: 1500 };
  }

  /* ---------------- Búsqueda ---------------- */
  let lastSearch = store.get("biblia-q", { q: "", v: "rv1909", scope: "all" });
  function renderSearch() {
    $("#notice").hidden = true;
    $("#ref-title").textContent = "Buscar en la Biblia";
    view.innerHTML = `<form class="sform" id="sform">
        <input id="s-q" placeholder="Palabra o frase (sin importar tildes) · o un número de Strong: H2617, G26" value="${esc(lastSearch.q)}" spellcheck="false">
        <select id="s-v" aria-label="Versión">${META.versions.filter((v) => !v.orig).map((v) => `<option value="${v.id}" ${v.id === lastSearch.v ? "selected" : ""}>${esc(v.s)}</option>`).join("")}</select>
        <select id="s-scope" aria-label="Dónde buscar">
          <option value="all">Toda la Biblia</option><option value="AT">Antiguo Testamento</option><option value="NT">Nuevo Testamento</option><option value="book">Solo ${esc(bookName(S.book))}</option>
        </select>
        <button class="btn btn--primary btn--plain" type="submit">Buscar</button>
      </form><div id="s-out" class="sout" aria-live="polite"></div>`;
    $("#s-scope").value = lastSearch.scope;
    $("#sform").addEventListener("submit", (e) => { e.preventDefault(); doSearch(); });
    if (lastSearch.q) doSearch();
    else $("#s-q").focus();
  }
  let searchSeq = 0;
  async function doSearch() {
    const q = $("#s-q").value.trim(), v = $("#s-v").value, scope = $("#s-scope").value;
    lastSearch = { q, v, scope }; store.set("biblia-q", lastSearch);
    const out = $("#s-out");
    if (!q) { out.innerHTML = ""; return; }
    if (/^[HGhg]\d{1,4}$/.test(q)) { openLex(q.toUpperCase()); out.innerHTML = `<p class="muted">He abierto la ficha de ${esc(q.toUpperCase())}.</p>`; return; }
    const seq = ++searchSeq;
    const nq = norm(q);
    const books = META.books.filter((b) => scope === "all" || (scope === "book" ? b.id === S.book : b.t === scope));
    let hits = [], total = 0;
    out.innerHTML = `<p class="loading" id="s-prog">Buscando…</p>`;
    const words = nq.replace(/"/g, "").split(" ").filter(Boolean);
    for (let k = 0; k < books.length; k++) {
      const b = books[k];
      const chs = await loadTrans(v, b.id).catch(() => []);
      if (seq !== searchSeq) return;
      chs.forEach((vs, ci) => vs.forEach((t, vi) => {
        const p = norm(plain(t));
        const ok = /^".*"$/.test(q) ? (" " + p).includes(" " + norm(q.slice(1, -1))) : words.every((w) => (" " + p.replace(/[^a-zñ0-9 ]/g, " ")).includes(" " + w));
        if (ok) { total++; if (hits.length < 400) hits.push([b.id, ci + 1, vi + 1, plain(t)]); }
      }));
      const pr = $("#s-prog"); if (pr) pr.textContent = `Buscando… ${bookName(b.id)} (${k + 1}/${books.length}) · ${fmt(total)} resultados`;
    }
    const re = new RegExp(`(?<![\\p{L}])(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "giu");
    const hl = (t) => {
      // resaltar sin tildes: comparar sobre texto normalizado manteniendo el original
      const n = t.normalize("NFD").replace(/[̀-ͯ]/g, "");
      let out2 = "", last = 0; re.lastIndex = 0; let m;
      while ((m = re.exec(n))) { out2 += esc(t.slice(last, m.index)) + "<mark>" + esc(t.slice(m.index, m.index + m[0].length)) + "</mark>"; last = m.index + m[0].length; }
      return out2 + esc(t.slice(last));
    };
    const counts = {};
    hits.forEach((h) => { counts[h[0]] = (counts[h[0]] || 0) + 1; });
    out.innerHTML = `<p class="sout__sum"><strong>${fmt(total)}</strong> versículo${total === 1 ? "" : "s"} con «${esc(q)}» en ${esc(VER[v].s)}${total > hits.length ? ` · se muestran los primeros ${hits.length}` : ""}. Consejo: escribe la frase entre comillas para buscarla exacta.</p>` +
      (hits.length ? `<div class="sout__books">${Object.entries(counts).map(([b, n]) => `<span>${esc(BOOK[b].a)} <b>${n}</b></span>`).join("")}</div>` : "") +
      hits.map(([b, c, vv, t]) => `<button type="button" class="hit" data-go="${b}.${c}.${vv}"><b>${esc(refStr(b, c, vv))}</b> ${hl(t)}</button>`).join("");
  }

  /* ---------------- Ficha léxica ---------------- */
  const lex = $("#lex"), lexBody = $("#lex-body"), scrim = $("#scrim");
  let lexHist = [];
  async function openLex(s, ctx) {
    if (!/^[HG]\d+$/.test(s)) return;
    lex.hidden = false; scrim.hidden = false; document.body.classList.add("lex-open");
    if (!ctx && lexHist.length && lexHist[lexHist.length - 1].s === s) { /* ya abierta */ }
    else lexHist.push({ s, ctx });
    $("#lex-back").hidden = lexHist.length < 2;
    lexBody.innerHTML = `<p class="loading">Cargando ${s}…</p>`;
    const [e, refs] = await Promise.all([lexEntry(s), concRefs(s)]);
    if (!e) { lexBody.innerHTML = `<p>No encuentro ${esc(s)} en el diccionario.</p>`; return; }
    const heb = s[0] === "H";
    const per = {}; refs.forEach((r) => { const bi = Math.floor(r / 1e6); per[bi] = (per[bi] || 0) + 1; });
    const maxB = Math.max(1, ...Object.values(per));
    const derivLinks = esc(e.o).replace(/\b([HG])(\d+)\b/g, '<button type="button" class="linkbtn" data-open="$1$2">$1$2</button>');
    let ctxHTML = "";
    if (ctx && ctx.w) {
      const an = ctx.v === "heb" ? M.hebrew(ctx.w[2]) : ctx.v === "na" ? M.greek(ctx.w[2]) : null;
      ctxHTML = `<div class="lex__ctx"><p class="lex__k2">En ${esc(refStr(S.book, S.ch, ctx.vn))}</p>
        <p class="lex__form ${heb ? "he" : "grc"}" ${heb ? 'dir="rtl"' : ""}>${esc(heb ? hebText(ctx.w[0]) : ctx.w[0])}</p>
        <p class="lex__tl">${esc(heb ? M.trHebrew(ctx.w[0]) : M.trGreek(ctx.w[0]))}</p>
        ${an && an.long ? `<p class="lex__an"><b>Análisis:</b> ${esc(an.long)}${ctx.v === "na" && ctx.w[3] ? ` · <b>lema:</b> <span lang="grc">${esc(ctx.w[3])}</span>` : ""}</p>` : ctx.v === "tr" ? `<p class="lex__an muted">El Textus Receptus no trae análisis gramatical. Para verlo, usa el Nestle 1904.</p>` : ""}
      </div>`;
    }
    const books = META.books.map((b, i) => [b, per[i + 1] || 0]).filter(([, n]) => n);
    lexBody.innerHTML = `
      ${ctxHTML}
      <div class="lex__lemma ${heb ? "he" : "grc"}" ${heb ? 'dir="rtl" lang="he"' : 'lang="grc"'}>${esc(e.l)}</div>
      <p class="lex__meta"><span class="badge">${esc(s)}</span> ${esc(e.x)}${e.p ? ` · <i>${esc(e.p)}</i>` : ""} · ${heb ? "hebreo/arameo" : "griego"}</p>
      ${e.es.length ? `<div class="lex__sec"><p class="lex__k2">Cómo se traduce en español</p><div class="lex__es">${e.es.map(([w, n]) => `<span>${esc(w)}${n ? ` <b>${fmt(n)}</b>` : ""}</span>`).join("")}</div><p class="lex__fine">Recuento en RV1909, PDPT y BLM, según sus etiquetas de Strong.</p></div>` : ""}
      <div class="lex__sec"><p class="lex__k2">Definición de Strong <small>(en inglés)</small></p><p>${esc(e.d) || "—"}</p>
        ${e.k ? `<p class="lex__fine"><b>KJV la traduce:</b> ${esc(e.k)}</p>` : ""}
        ${e.o ? `<p class="lex__fine"><b>Origen:</b> ${derivLinks}</p>` : ""}</div>
      <div class="lex__sec"><p class="lex__k2">Aparece ${fmt(e.f || 0)} veces · en ${fmt(refs.length)} versículos</p>
        <div class="lex__bars">${books.map(([b, n]) => `<button type="button" class="lb" data-book="${b.id}" title="${esc(b.n)}: ${n}"><span style="--h:${Math.max(6, (n / maxB) * 100)}%"></span><i>${esc(b.a)}</i></button>`).join("")}</div>
      </div>
      <div class="lex__sec"><p class="lex__k2">Dónde aparece</p><div id="lex-refs" class="lex__refs"></div>
        <button type="button" class="btn btn--ghost" id="lex-more" hidden>Ver más</button></div>
      ${aiBoxHTML("lx", "IA sobre esta palabra", [["palabra", "✨ Explícame esta palabra"]], true)}
      <p class="lex__fine"><button type="button" class="linkbtn" id="lex-copy">Copiar ficha</button> · <button type="button" class="linkbtn" id="lex-search">Buscar ${esc(s)}</button></p>`;
    let page = 0, list = refs;
    const PAGE = 15;
    async function more() {
      const slice = list.slice(page * PAGE, (page + 1) * PAGE); page++;
      const box = $("#lex-refs");
      for (const r of slice) {
        const [b, c, v] = refFromInt(r);
        const vtxt = ((await loadTrans("rv1909", b).catch(() => []))[c - 1] || [])[v - 1] || "";
        const html = esc(vtxt).replace(/⟦([^|⟧]*)\|([HG]\d+)⟧/g, (_, w, ss) => (ss === s ? `<mark>${w}</mark>` : w));
        box.insertAdjacentHTML("beforeend", `<button type="button" class="hit" data-go="${b}.${c}.${v}"><b>${esc(refStr(b, c, v))}</b> ${html}</button>`);
      }
      $("#lex-more").hidden = page * PAGE >= list.length;
    }
    $("#lex-more").onclick = more;
    $$(".lb", lexBody).forEach((x) => x.addEventListener("click", () => {
      const bi = BIDX[x.dataset.book];
      list = refs.filter((r) => Math.floor(r / 1e6) === bi); page = 0; $("#lex-refs").innerHTML = ""; more();
      $$(".lb", lexBody).forEach((y) => y.classList.toggle("is-on", y === x));
    }));
    $("#lex-copy").onclick = () => copy(`${e.l} (${s}) · ${e.x}\n${e.es.map(([w]) => w).join(", ")}\n${e.d}\nAparece ${e.f} veces en ${refs.length} versículos.\n${location.origin}${location.pathname}`, "Ficha copiada");
    $("#lex-search").onclick = () => { closeLex(); lastSearch.q = s; S.mode = "bus"; render(); };
    more();
    wireAI("lx", async () => wordContext(s, e, refs, ctx));
    window.track?.("biblia/ficha/" + s, "Ficha " + s);
  }
  function closeLex() { lex.hidden = true; scrim.hidden = true; document.body.classList.remove("lex-open"); lexHist = []; }
  $("#lex-x").addEventListener("click", closeLex);
  scrim.addEventListener("click", closeLex);
  $("#lex-back").addEventListener("click", () => { lexHist.pop(); const p = lexHist.pop(); if (p) openLex(p.s, p.ctx); });
  let BIDX = {};

  /* ---------------- Interacción con palabras ---------------- */
  function rowOf(el) { return el.closest(".par__row, .intl__v, .vv"); }
  document.addEventListener("mouseover", (e) => {
    const w = e.target.closest("[data-s]");
    $$(".hl").forEach((x) => x.classList.remove("hl"));
    if (!w || !view.contains(w)) return;
    const r = rowOf(w); if (!r) return;
    $$(`[data-s="${w.dataset.s}"]`, r).forEach((x) => x.classList.add("hl"));
  });
  document.addEventListener("click", (e) => {
    const go = e.target.closest("[data-go]");
    if (go) {
      e.preventDefault();
      const [b, c, v] = go.dataset.go.split(".");
      closeLex();
      S.book = b; S.ch = +c; S.verse = v ? +v : null;
      if (S.mode === "bus") S.mode = "par";
      render(); $("#lector").scrollIntoView({ behavior: "smooth" });
      return;
    }
    const op = e.target.closest("[data-open]");
    if (op) { openLex(op.dataset.open); return; }
    const vg = e.target.closest("[data-vn-go]");
    if (vg) { S.verse = +vg.dataset.vnGo; S.mode = "ver"; render(); return; }
    const w = e.target.closest("[data-s]");
    if (w && (view.contains(w))) {
      const row = rowOf(w);
      $$(".sel", view).forEach((x) => x.classList.remove("sel"));
      if (row) $$(`[data-s="${w.dataset.s}"]`, row).forEach((x) => x.classList.add("sel"));
      let ctx = null;
      if (w.dataset.v) {
        const v = w.dataset.v, i = +w.dataset.i;
        const vn = +(w.closest("[data-vn]")?.dataset.vn || S.verse || 1);
        ctx = { v, i, vn, w: null };
        loadOrig(v, S.book, S.ch).then((a) => { ctx.w = a?.[vn - 1]?.[i] || null; openLex(w.dataset.s, ctx); });
        return;
      }
      openLex(w.dataset.s);
    }
  });

  /* ---------------- Controles ---------------- */
  const selBook = $("#sel-book"), selCh = $("#sel-ch");
  function syncControls() {
    selBook.value = S.book;
    const n = BOOK[S.book].ch.length;
    if (selCh.options.length !== n || selCh.dataset.book !== S.book) {
      selCh.innerHTML = Array.from({ length: n }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join("");
      selCh.dataset.book = S.book;
    }
    selCh.value = S.ch;
    $$(".modes [data-mode]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.mode === S.mode)));
    renderChips();
    document.documentElement.style.setProperty("--bsize", S.size + "px");
  }
  function renderChips() {
    $("#vchips").innerHTML = META.versions.map((v) => {
      const on = S.vers.includes(v.id), av = verAvail(v.id);
      const pos = on ? S.vers.indexOf(v.id) + 1 : "";
      return `<button type="button" class="vchip ${on ? "is-on" : ""} ${v.orig ? "vchip--orig" : ""}" data-ver="${v.id}" aria-pressed="${on}" ${av ? "" : 'aria-disabled="true"'} title="${esc(v.n)}${av ? "" : " (solo " + (v.only === "AT" ? "Antiguo" : "Nuevo") + " Testamento)"}">
        ${pos ? `<i>${pos}</i>` : ""}${esc(v.s)}${v.tag ? ' <small title="Con números de Strong">S</small>' : ""}</button>`;
    }).join("");
  }
  $("#vchips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-ver]"); if (!b) return;
    const id = b.dataset.ver;
    if (S.vers.includes(id)) S.vers = S.vers.filter((x) => x !== id); else S.vers.push(id);
    save(); render({ scroll: false });
  });
  $("#btn-opts").addEventListener("click", () => {
    const o = $("#opts"), open = o.hidden; o.hidden = !open; $("#btn-opts").setAttribute("aria-expanded", String(open));
  });
  for (const [id, key] of [["o-vowels", "vowels"], ["o-cant", "cant"], ["o-translit", "translit"], ["o-morph", "morph"], ["o-strong", "strong"]]) {
    const el = $("#" + id); el.checked = !!S[key];
    el.addEventListener("change", () => { S[key] = el.checked; save(); render({ scroll: false }); });
  }
  $("#o-size").value = S.size;
  $("#o-size").addEventListener("input", (e) => { S.size = +e.target.value; document.documentElement.style.setProperty("--bsize", S.size + "px"); save(); });
  selBook.addEventListener("change", () => { S.book = selBook.value; S.ch = 1; S.verse = null; if (S.mode === "bus") S.mode = "par"; render(); });
  selCh.addEventListener("change", () => { S.ch = +selCh.value; S.verse = null; if (S.mode === "bus") S.mode = "par"; render(); });
  $$(".modes [data-mode]").forEach((b) => b.addEventListener("click", () => { S.mode = b.dataset.mode; if (S.mode === "ver" && !S.verse) S.verse = 1; save(); render(); }));
  function goChapter(d, toLast) {
    const ids = META.books.map((b) => b.id);
    let bi = ids.indexOf(S.book), c = S.ch + d;
    if (c < 1) { bi = (bi - 1 + ids.length) % ids.length; c = BOOK[ids[bi]].ch.length; }
    else if (c > BOOK[ids[bi]].ch.length) { bi = (bi + 1) % ids.length; c = 1; }
    S.book = ids[bi]; S.ch = c;
    S.verse = S.mode === "ver" ? (toLast ? BOOK[ids[bi]].ch[c - 1] : 1) : null;
    if (S.mode === "bus") S.mode = "par";
    render();
    $("#lector").scrollIntoView({ behavior: "smooth" });
  }
  $("#prev").onclick = $("#prev2").onclick = () => goChapter(-1);
  $("#next").onclick = $("#next2").onclick = () => goChapter(1);
  document.addEventListener("keydown", (e) => {
    if (e.target.closest("input, select, textarea")) return;
    if (e.key === "Escape" && !lex.hidden) closeLex();
    if (e.key === "ArrowLeft") goChapter(-1);
    if (e.key === "ArrowRight") goChapter(1);
  });
  $("#goto").addEventListener("submit", (e) => {
    e.preventDefault();
    const q = $("#goto-q").value.trim(); if (!q) return;
    if (/^[HGhg]\d{1,4}$/.test(q)) { openLex(q.toUpperCase()); return; }
    const r = parseRef(q);
    if (r && /\d/.test(q) || r && q.split(" ").length === 1 && ALIAS.some(([a]) => a === norm(q))) {
      S.book = r.b; S.ch = r.c; S.verse = r.v; if (S.mode === "bus") S.mode = "par";
    } else { lastSearch.q = q; S.mode = "bus"; }
    render(); $("#lector").scrollIntoView({ behavior: "smooth" });
  });
  if (store.get("biblia-tip", false)) $("#tip").hidden = true;
  $("#tip-x").addEventListener("click", () => { $("#tip").hidden = true; store.set("biblia-tip", true); });

  /* ---------------- Enlace (hash) ---------------- */
  function writeHash() {
    const h = `#${S.book}.${S.ch}${S.verse ? "." + S.verse : ""}~${S.vers.join(",")}~${S.mode}`;
    if (location.hash !== h) history.replaceState(null, "", h);
  }
  function readHash() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (!h) return;
    const [ref, vers, mode] = h.split("~");
    const [b, c, v] = (ref || "").split(".");
    if (BOOK[b]) { S.book = b; S.ch = Math.min(+c || 1, BOOK[b].ch.length); S.verse = v ? +v : null; }
    if (vers) { const list = vers.split(",").filter((x) => VER[x]); if (list.length) S.vers = list; }
    if (["par", "int", "ver", "bus"].includes(mode)) S.mode = mode;
  }

  async function copy(text, msg) {
    try { await navigator.clipboard.writeText(text); toast(msg); } catch { prompt("Copia el texto:", text); }
  }
  function toast(msg) {
    const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; t.setAttribute("role", "status");
    document.body.appendChild(t); setTimeout(() => t.remove(), 2200);
  }

  /* ---------------- Estudios de palabras ---------------- */
  const STUDIES = [
    ["H2617", "Amor leal, misericordia"], ["H7965", "Paz, bienestar completo"], ["H530", "Fidelidad, firmeza"], ["H7307", "Espíritu, viento, aliento"],
    ["H8451", "Instrucción, ley"], ["H3519", "Gloria, peso"], ["H6944", "Santidad"], ["H7676", "Sábado, día de reposo"],
    ["G26", "Amor"], ["G5485", "Gracia"], ["G4102", "Fe, fidelidad"], ["G3056", "Palabra, Verbo"],
    ["G1577", "Iglesia, asamblea"], ["G3341", "Arrepentimiento"], ["G1343", "Justicia"], ["G2098", "Evangelio"]
  ];
  async function renderStudies() {
    const box = $("#studies");
    const cards = await Promise.all(STUDIES.map(async ([s, label]) => {
      const e = await lexEntry(s).catch(() => null);
      if (!e) return "";
      const heb = s[0] === "H";
      return `<button type="button" class="study" data-open="${s}"><span class="study__l ${heb ? "he" : "grc"}" ${heb ? 'dir="rtl"' : ""}>${esc(e.l)}</span>
        <span class="study__x">${esc(e.x)}</span><span class="study__d">${esc(label)}</span><span class="study__n">${s} · ${fmt(e.f)} veces</span></button>`;
    }));
    box.innerHTML = cards.join("");
  }

  /* ---------------- Tema ---------------- */
  try { const t = localStorage.getItem("theme"); if (t) document.documentElement.dataset.theme = t; } catch { /* nada */ }
  $(".theme-toggle").addEventListener("click", () => {
    const d = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    const n = d ? "light" : "dark"; document.documentElement.dataset.theme = n;
    try { localStorage.setItem("theme", n); } catch { /* nada */ }
  });

  /* ---------------- Inicio ---------------- */
  (async function init() {
    try { META = await load("meta.json"); }
    catch { view.innerHTML = `<p class="empty">No se han podido cargar los datos. Recarga la página.</p>`; return; }
    BOOK = Object.fromEntries(META.books.map((b) => [b.id, b]));
    VER = Object.fromEntries(META.versions.map((v) => [v.id, v]));
    BIDX = Object.fromEntries(META.books.map((b, i) => [b.id, i + 1]));
    S.vers = S.vers.filter((v) => VER[v]);
    buildAlias();
    selBook.innerHTML = `<optgroup label="Antiguo Testamento">${META.books.filter((b) => b.t === "AT").map((b) => `<option value="${b.id}">${esc(b.n)}</option>`).join("")}</optgroup>
      <optgroup label="Nuevo Testamento">${META.books.filter((b) => b.t === "NT").map((b) => `<option value="${b.id}">${esc(b.n)}</option>`).join("")}</optgroup>`;
    $("#src-list").innerHTML = META.versions.map((v) => `<li><strong>${esc(v.n)}</strong> (${esc(v.s)}): ${esc(v.lic)}.</li>`).join("");
    readHash();
    window.addEventListener("hashchange", () => { readHash(); render(); });
    render();
    renderStudies();
  })();
})();
