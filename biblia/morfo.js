/* =====================================================================
   Morfología en español y transliteración
   - Hebreo/arameo: códigos del Open Scriptures Hebrew Bible (OSHB)
   - Griego: códigos de Robinson (Nestle 1904)
   ===================================================================== */
(() => {
  "use strict";

  /* ---------------- Hebreo (OSHB) ---------------- */
  const H_STEM = {
    q: "qal", N: "nifal", p: "piel", P: "pual", h: "hifil", H: "hofal", t: "hitpael", o: "polel", O: "polal",
    r: "hitpolel", m: "poel", M: "poal", k: "palel", K: "pulal", Q: "qal pasivo", l: "pilpel", L: "polpal",
    f: "hitpalpel", D: "nitpael", j: "pealal", i: "pilel", u: "hotpaal", c: "tifil", v: "histafel",
    w: "nitpalel", y: "nitpoel", z: "hitpoel"
  };
  const A_STEM = {
    q: "peal", Q: "peil", u: "hitpeel", p: "pael", P: "itpaal", M: "hitpaal", a: "afel", h: "hafel", s: "safel",
    e: "safel", H: "hofal", i: "itpeel", t: "histafal", v: "istafal", w: "hitafel", o: "polel", z: "itpoel",
    r: "hitpolel", f: "hitpalpel", b: "hefal", c: "tifel", m: "poel", l: "palpel", L: "itpalpal", O: "itpolel", G: "itafal"
  };
  const H_TYPE = {
    p: "perfecto", q: "perfecto consecutivo", i: "imperfecto", w: "imperfecto consecutivo (wayyiqtol)", h: "cohortativo",
    j: "yusivo", v: "imperativo", r: "participio activo", s: "participio pasivo", a: "infinitivo absoluto", c: "infinitivo constructo"
  };
  const PER = { 1: "1.ª persona", 2: "2.ª persona", 3: "3.ª persona" };
  const GEN = { m: "masculino", f: "femenino", b: "ambos géneros", c: "común" };
  const NUM = { s: "singular", p: "plural", d: "dual" };
  const STATE = { a: "absoluto", c: "constructo", d: "determinado" };

  function hebSeg(code, aram) {
    const c = code[0], r = code.slice(1);
    const out = [];
    const pgn = (s) => { if (PER[s[0]]) out.push(PER[s[0]]); if (GEN[s[1]]) out.push(GEN[s[1]]); if (NUM[s[2]]) out.push(NUM[s[2]]); };
    switch (c) {
      case "V": {
        out.push("verbo");
        const st = (aram ? A_STEM : H_STEM)[r[0]]; if (st) out.push(st);
        const ty = H_TYPE[r[1]]; if (ty) out.push(ty);
        const rest = r.slice(2);
        if (r[1] === "r" || r[1] === "s") { if (GEN[rest[0]]) out.push(GEN[rest[0]]); if (NUM[rest[1]]) out.push(NUM[rest[1]]); if (STATE[rest[2]]) out.push(STATE[rest[2]]); }
        else if (rest) pgn(rest);
        break;
      }
      case "N": {
        out.push({ c: "sustantivo", g: "gentilicio", p: "nombre propio" }[r[0]] || "sustantivo");
        if (r[0] !== "p") { if (GEN[r[1]]) out.push(GEN[r[1]]); if (NUM[r[2]]) out.push(NUM[r[2]]); if (STATE[r[3]]) out.push(STATE[r[3]]); }
        break;
      }
      case "A": {
        out.push({ a: "adjetivo", c: "número cardinal", g: "gentilicio", o: "número ordinal" }[r[0]] || "adjetivo");
        if (GEN[r[1]]) out.push(GEN[r[1]]); if (NUM[r[2]]) out.push(NUM[r[2]]); if (STATE[r[3]]) out.push(STATE[r[3]]);
        break;
      }
      case "P": {
        out.push({ d: "pronombre demostrativo", f: "pronombre indefinido", i: "pronombre interrogativo", p: "pronombre personal", r: "pronombre relativo" }[r[0]] || "pronombre");
        if (r.length > 1) pgn(r.slice(1));
        break;
      }
      case "S": {
        out.push({ d: "sufijo direccional (-ah)", h: "he paragógica", n: "nun paragógica", p: "sufijo pronominal" }[r[0]] || "sufijo");
        if (r[0] === "p") pgn(r.slice(1));
        break;
      }
      case "T": {
        out.push({ a: "partícula afirmativa", d: "artículo definido", e: "partícula exhortativa", i: "partícula interrogativa",
          j: "interjección", m: "partícula demostrativa", n: "negación", o: "marcador de objeto directo (et)", r: "partícula relativa" }[r[0]] || "partícula");
        break;
      }
      case "R": out.push(r[0] === "d" ? "preposición con artículo" : "preposición"); break;
      case "C": out.push("conjunción"); break;
      case "D": out.push("adverbio"); break;
      default: out.push(code);
    }
    return out.join(", ");
  }
  function hebrew(morph) {
    if (!morph) return { short: "", long: "" };
    const aram = morph[0] === "A";
    const segs = morph.slice(1).split("/");
    const long = segs.map((s) => hebSeg(s, aram)).join(" + ");
    const main = segs.find((s) => /^[VNAP]/.test(s)) || segs[segs.length - 1];
    const short = hebSeg(main, aram).split(", ").slice(0, 3).join(" ");
    return { short, long: (aram ? "Arameo. " : "") + long.charAt(0).toUpperCase() + long.slice(1) };
  }

  /* ---------------- Griego (Robinson) ---------------- */
  const CASE = { N: "nominativo", G: "genitivo", D: "dativo", A: "acusativo", V: "vocativo" };
  const GNUM = { S: "singular", P: "plural" };
  const GGEN = { M: "masculino", F: "femenino", N: "neutro" };
  const TENSE = { P: "presente", I: "imperfecto", F: "futuro", A: "aoristo", R: "perfecto", L: "pluscuamperfecto", X: "sin tiempo" };
  const VOICE = { A: "activa", M: "media", P: "pasiva", E: "media o pasiva", D: "media deponente", O: "pasiva deponente", N: "media/pasiva deponente", Q: "activa impersonal", X: "sin voz" };
  const MOOD = { I: "indicativo", S: "subjuntivo", O: "optativo", M: "imperativo", N: "infinitivo", P: "participio", R: "participio imperativo" };
  const SIMPLE = {
    CONJ: "conjunción", PREP: "preposición", ADV: "adverbio", PRT: "partícula", "PRT-N": "partícula negativa", "PRT-I": "partícula interrogativa",
    COND: "conjunción condicional", INJ: "interjección", HEB: "palabra hebrea", ARAM: "palabra aramea", "ADV-I": "adverbio interrogativo",
    "ADV-N": "adverbio negativo", "CONJ-N": "conjunción negativa", "ADV-C": "adverbio comparativo", "ADV-S": "adverbio superlativo"
  };
  const PRON = {
    T: "artículo", P: "pronombre personal", R: "pronombre relativo", C: "pronombre recíproco", D: "pronombre demostrativo",
    K: "pronombre correlativo", I: "pronombre interrogativo", X: "pronombre indefinido", Q: "pronombre correlativo o interrogativo",
    F: "pronombre reflexivo", S: "pronombre posesivo", N: "sustantivo", A: "adjetivo"
  };
  const cgn = (s) => [CASE[s[0]], GNUM[s[1]], GGEN[s[2]]].filter(Boolean);
  function greek(m) {
    if (!m) return { short: "", long: "" };
    if (SIMPLE[m]) return { short: SIMPLE[m], long: SIMPLE[m].charAt(0).toUpperCase() + SIMPLE[m].slice(1) };
    const p = m.split("-");
    const out = [];
    if (p[0] === "V") {
      out.push("verbo");
      let t = p[1] || "";
      let second = "";
      if (/^\d/.test(t)) { second = t[0] === "2" ? " segundo" : ""; t = t.slice(1); }
      if (TENSE[t[0]]) out.push(TENSE[t[0]] + second);
      if (VOICE[t[1]]) out.push("voz " + VOICE[t[1]]);
      if (MOOD[t[2]]) out.push(MOOD[t[2]]);
      const x = p[2] || "";
      if (t[2] === "P" || t[2] === "R") out.push(...cgn(x));
      else if (x) { if (PER[x[0]]) out.push(PER[x[0]]); if (GNUM[x[1]]) out.push(GNUM[x[1]]); }
    } else if (PRON[p[0]]) {
      out.push(PRON[p[0]]);
      let x = p[1] || "";
      if (x === "PRI") out.splice(0, 1, "nombre propio indeclinable");
      else if (x === "NUI") out.splice(0, 1, "número indeclinable");
      else if (x === "LI") out.push("letra indeclinable");
      else if (x === "OI") out.push("indeclinable");
      else {
        if (/^[123]/.test(x)) { out.push(PER[x[0]]); x = x.slice(1); }
        if (p[0] === "S") x = x.slice(1); // posesivo: número del poseedor
        out.push(...cgn(x));
      }
      if (p[2] === "C") out.push("comparativo");
      if (p[2] === "S") out.push("superlativo");
      if (p[2] === "I") out.push("interrogativo");
      if (p[2] === "N") out.push("negativo");
    } else out.push(m);
    const long = out.join(", ");
    return { short: out.slice(0, 3).join(" "), long: long.charAt(0).toUpperCase() + long.slice(1) };
  }

  /* ---------------- Transliteración ---------------- */
  const G1 = { α: "a", β: "b", γ: "g", δ: "d", ε: "e", ζ: "z", η: "ē", θ: "th", ι: "i", κ: "k", λ: "l", μ: "m", ν: "n", ξ: "x", ο: "o", π: "p", ρ: "r", σ: "s", ς: "s", τ: "t", υ: "y", φ: "ph", χ: "ch", ψ: "ps", ω: "ō" };
  function trGreek(w) {
    const d = w.normalize("NFD").toLowerCase();
    let out = "", rough = false;
    const chars = [...d];
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      if (ch === "̔") { rough = true; continue; }
      if (/[̀-ͯ]/.test(ch)) continue;
      const nx = (chars.slice(i + 1).find((c) => !/[̀-ͯ]/.test(c))) || "";
      if (ch === "γ" && /[γκξχ]/.test(nx)) { out += "n"; continue; }
      if ((ch === "α" || ch === "ε" || ch === "ο" || ch === "η") && nx === "υ") { out += { α: "a", ε: "e", ο: "o", η: "ē" }[ch] + "u"; i = chars.indexOf(nx, i + 1); continue; }
      out += G1[ch] ?? (/[a-z]/.test(ch) ? ch : "");
    }
    if (rough) out = out.startsWith("r") ? "rh" + out.slice(1) : "h" + out;
    return out;
  }
  const HC = { א: "ʼ", ב: "v", ג: "g", ד: "d", ה: "h", ו: "v", ז: "z", ח: "ḥ", ט: "ṭ", י: "y", כ: "kh", ך: "kh", ל: "l", מ: "m", ם: "m", נ: "n", ן: "n", ס: "s", ע: "ʻ", פ: "f", ף: "f", צ: "ts", ץ: "ts", ק: "q", ר: "r", ש: "sh", ת: "t" };
  const HV = { "ַ": "a", "ָ": "ā", "ֶ": "e", "ֵ": "ē", "ִ": "i", "ֹ": "ō", "ֺ": "ō", "ֻ": "u", "ֱ": "e", "ֲ": "a", "ֳ": "o", "ׇ": "o" };
  function trHebrew(w) {
    const s = w.normalize("NFD").replace(/[֑-ֽֿ֯׀׃-׆]/g, "");
    let out = "", first = true, lastV = "";
    const L = [...s];
    for (let i = 0; i < L.length; i++) {
      const ch = L[i];
      if (ch === "־") { out += "-"; first = true; continue; }
      if (!HC[ch]) continue;
      const marks = [];
      let j = i + 1;
      while (j < L.length && /[ְ-ׇ]/.test(L[j])) marks.push(L[j++]);
      const dag = marks.includes("ּ");
      let cons = HC[ch];
      if (dag && "בכךפף".includes(ch)) cons = { ב: "b", כ: "k", ך: "k", פ: "p", ף: "p" }[ch];
      if (ch === "ש" && marks.includes("ׂ")) cons = "s";
      let vow = "";
      for (const m of marks) if (HV[m]) vow = HV[m];
      // vav como vocal (holam / shureq)
      if (ch === "ו" && !first && marks.includes("ֹ") && !vow.replace("ō", "")) { out += "ô"; lastV = "o"; i = j - 1; continue; }
      if (ch === "ו" && dag && !marks.some((m) => HV[m]) && !first) { out += "û"; lastV = "u"; i = j - 1; continue; }
      if (ch === "ו" && dag && first && !marks.some((m) => HV[m])) { out += "û"; lastV = "u"; first = false; i = j - 1; continue; }
      // yod sin vocal tras i/e: vocal larga
      if (ch === "י" && !vow && !marks.includes("ְ") && /[iēe]/.test(lastV) && j >= L.length - 0) { out = out.replace(/(i|ē|e)$/, (m) => ({ i: "î", ē: "ê", e: "ê" }[m])); lastV = ""; i = j - 1; continue; }
      if (ch === "י" && !vow && !marks.includes("ְ") && /[iēe]/.test(lastV)) { out = out.replace(/(i|ē|e)$/, (m) => ({ i: "î", ē: "ê", e: "ê" }[m])); lastV = ""; i = j - 1; continue; }
      // he final muda
      if (ch === "ה" && j >= L.length && !vow && !dag) { out += "h"; i = j - 1; continue; }
      if (ch === "א" && !vow && !first && !marks.includes("ְ")) { i = j - 1; continue; }
      if (marks.includes("ְ") && first) vow = "e";
      if (ch === "ח" && j >= L.length && vow === "a") { out += "a" + cons; i = j - 1; continue; } // patah furtivo
      out += cons + vow;
      if (vow) lastV = vow;
      first = false;
      i = j - 1;
    }
    out = out.replace(/^ʼ/, "");
    return /^y[e]?hv[āa]h$/.test(out) ? "YHWH" : out;
  }

  /* Quitar signos del hebreo: cantilación y, opcionalmente, vocales */
  const stripCant = (w) => w.replace(/[֑-ֽֿ֯׀ׅׄ]/g, "");
  const stripVowels = (w) => stripCant(w).replace(/[ְ-ׇּׁׂ]/g, "");

  /* Normalizar griego para comparar (sin acentos ni puntuación) */
  const normGreek = (w) => w.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^\p{L}]/gu, "").replace(/ς/g, "σ");

  window.Morfo = { hebrew, greek, trGreek, trHebrew, stripCant, stripVowels, normGreek };
})();
