#!/usr/bin/env python3
"""Genera los datos estáticos de /biblia/ a partir de las fuentes abiertas.

Uso:  python3 tools/biblia/build.py RUTA_FUENTES

RUTA_FUENTES debe contener:
  spaRV1909/ spabes/ spapddpt/ spablm/ spavbl/ eng-kjv/ engwebp/ grctr/   (USFM de eBible.org)
  oshb/*.xml          (Open Scriptures Hebrew Bible, wlc/)
  nestle.csv          (biblicalhumanities/Nestle1904/morph/Nestle1904.csv)
  strongs-heb.js strongs-grk.js   (openscriptures/strongs)

Salida en biblia/data/:
  meta.json                       libros, versiones y créditos
  t/<version>/<LIBRO>.json        traducciones: {"c": [[versículos], ...]}; las palabras con número
                                  Strong van marcadas como ⟦palabra|H430⟧
  o/heb/<LIBRO>/<cap>.json        hebreo palabra a palabra: [[texto, strong, morfología], ...] por versículo
  o/tr/<LIBRO>/<cap>.json         griego TR: [[texto, strong], ...]
  o/na/<LIBRO>/<cap>.json         griego Nestle 1904: [[texto, strong, morfología, lema], ...]
  lex/<H|G>/<bloque>.json         léxico Strong + glosas en español + frecuencia
  conc/<H|G>/<bloque>.json        concordancia: número Strong -> lista de referencias (libro*1e6+cap*1e3+vers)
"""
import collections
import glob
import json
import os
import re
import sys

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "biblia", "data")

# código USFM, OSHB, Nestle, nombre, abreviatura
BOOKS = [
    ("GEN", "Gen", None, "Génesis", "Gn"), ("EXO", "Exod", None, "Éxodo", "Éx"), ("LEV", "Lev", None, "Levítico", "Lv"),
    ("NUM", "Num", None, "Números", "Nm"), ("DEU", "Deut", None, "Deuteronomio", "Dt"), ("JOS", "Josh", None, "Josué", "Jos"),
    ("JDG", "Judg", None, "Jueces", "Jue"), ("RUT", "Ruth", None, "Rut", "Rt"), ("1SA", "1Sam", None, "1 Samuel", "1 S"),
    ("2SA", "2Sam", None, "2 Samuel", "2 S"), ("1KI", "1Kgs", None, "1 Reyes", "1 R"), ("2KI", "2Kgs", None, "2 Reyes", "2 R"),
    ("1CH", "1Chr", None, "1 Crónicas", "1 Cr"), ("2CH", "2Chr", None, "2 Crónicas", "2 Cr"), ("EZR", "Ezra", None, "Esdras", "Esd"),
    ("NEH", "Neh", None, "Nehemías", "Neh"), ("EST", "Esth", None, "Ester", "Est"), ("JOB", "Job", None, "Job", "Job"),
    ("PSA", "Ps", None, "Salmos", "Sal"), ("PRO", "Prov", None, "Proverbios", "Pr"), ("ECC", "Eccl", None, "Eclesiastés", "Ec"),
    ("SNG", "Song", None, "Cantares", "Cnt"), ("ISA", "Isa", None, "Isaías", "Is"), ("JER", "Jer", None, "Jeremías", "Jer"),
    ("LAM", "Lam", None, "Lamentaciones", "Lm"), ("EZK", "Ezek", None, "Ezequiel", "Ez"), ("DAN", "Dan", None, "Daniel", "Dn"),
    ("HOS", "Hos", None, "Oseas", "Os"), ("JOL", "Joel", None, "Joel", "Jl"), ("AMO", "Amos", None, "Amós", "Am"),
    ("OBA", "Obad", None, "Abdías", "Abd"), ("JON", "Jonah", None, "Jonás", "Jon"), ("MIC", "Mic", None, "Miqueas", "Mi"),
    ("NAM", "Nah", None, "Nahúm", "Nah"), ("HAB", "Hab", None, "Habacuc", "Hab"), ("ZEP", "Zeph", None, "Sofonías", "Sof"),
    ("HAG", "Hag", None, "Hageo", "Hag"), ("ZEC", "Zech", None, "Zacarías", "Zac"), ("MAL", "Mal", None, "Malaquías", "Mal"),
    ("MAT", None, "Matt", "Mateo", "Mt"), ("MRK", None, "Mark", "Marcos", "Mr"), ("LUK", None, "Luke", "Lucas", "Lc"),
    ("JHN", None, "John", "Juan", "Jn"), ("ACT", None, "Acts", "Hechos", "Hch"), ("ROM", None, "Rom", "Romanos", "Ro"),
    ("1CO", None, "1Cor", "1 Corintios", "1 Co"), ("2CO", None, "2Cor", "2 Corintios", "2 Co"), ("GAL", None, "Gal", "Gálatas", "Gá"),
    ("EPH", None, "Eph", "Efesios", "Ef"), ("PHP", None, "Phil", "Filipenses", "Flp"), ("COL", None, "Col", "Colosenses", "Col"),
    ("1TH", None, "1Thess", "1 Tesalonicenses", "1 Ts"), ("2TH", None, "2Thess", "2 Tesalonicenses", "2 Ts"),
    ("1TI", None, "1Tim", "1 Timoteo", "1 Ti"), ("2TI", None, "2Tim", "2 Timoteo", "2 Ti"), ("TIT", None, "Titus", "Tito", "Tit"),
    ("PHM", None, "Phlm", "Filemón", "Flm"), ("HEB", None, "Heb", "Hebreos", "He"), ("JAS", None, "Jas", "Santiago", "Stg"),
    ("1PE", None, "1Pet", "1 Pedro", "1 P"), ("2PE", None, "2Pet", "2 Pedro", "2 P"), ("1JN", None, "1John", "1 Juan", "1 Jn"),
    ("2JN", None, "2John", "2 Juan", "2 Jn"), ("3JN", None, "3John", "3 Juan", "3 Jn"), ("JUD", None, "Jude", "Judas", "Jud"),
    ("REV", None, "Rev", "Apocalipsis", "Ap"),
]
BIDX = {b[0]: i + 1 for i, b in enumerate(BOOKS)}
OT = [b[0] for b in BOOKS[:39]]

# Glosas fijas para palabras gramaticales, donde el recuento automático no sirve
MANUAL = {
    "H": {853: "(objeto directo)", 3068: "YHWH (Jehová)", 413: "a, hacia", 834: "que, el cual", 3588: "porque, que",
          5973: "con", 854: "con", 4480: "de, desde", 5921: "sobre", 3605: "todo", 3808: "no", 518: "si", 1571: "también",
          408: "no", 3651: "así", 2088: "este", 1931: "él, ese", 589: "yo", 859: "tú", 3478: "Israel"},
    "G": {3588: "el, la, lo", 2532: "y", 846: "él, mismo", 1722: "en", 1519: "a, hacia, en", 1161: "pero, y", 3756: "no",
          3361: "no", 1063: "porque", 3754: "que", 2443: "para que", 1537: "de, desde", 575: "de, desde", 4314: "a, hacia",
          1909: "sobre", 1223: "por, a través de", 2596: "según", 3326: "con, después de", 5259: "por, bajo", 4012: "acerca de",
          3739: "que, el cual", 1473: "yo", 4771: "tú", 2249: "nosotros", 5210: "vosotros", 3778: "este", 1565: "aquel",
          5100: "alguien, algo", 5101: "¿quién?, ¿qué?", 1510: "ser, estar", 1096: "llegar a ser", 25: "amar", 3004: "decir",
          2036: "decir", 2192: "tener", 4160: "hacer", 2064: "venir", 3708: "ver", 1492: "saber, ver", 1325: "dar",
          235: "sino, pero", 3767: "pues, entonces", 1437: "si", 1487: "si", 5613: "como", 3761: "ni", 2228: "o"},
}

VERSIONS = [
    # id, carpeta eBible, nombre, sigla, idioma, licencia, etiquetado con Strong
    ("rv1909", "spaRV1909", "Reina-Valera 1909", "RV1909", "es", "Dominio público", True),
    ("bes", "spabes", "La Biblia en Español Sencillo", "BES", "es", "Dominio público", False),
    ("pdpt", "spapddpt", "Palabra de Dios para ti", "PDPT", "es", "© 2020 Asociación Bíblica Latinoamericana · CC BY 4.0", True),
    ("blm", "spablm", "Biblia Libre para el Mundo", "BLM", "es", "Dominio público", True),
    ("vbl", "spavbl", "Versión Biblia Libre", "VBL", "es", "© 2018-2020 J. Gallagher y S. Barrios de Ávila · CC BY-SA 4.0", False),
    ("kjv", "eng-kjv", "King James Version", "KJV", "en", "Dominio público", False),
    ("web", "engwebp", "World English Bible", "WEB", "en", "Dominio público", False),
]

W_RE = re.compile(r'\\\+?w\s+([^|\\]*?)\|[^\\]*?strong="([HG])0*(\d+)[a-z]?[^"]*"[^\\]*?\\\+?w\*')
W_PLAIN = re.compile(r'\\\+?w\s+([^|\\]*?)(\|[^\\]*?)?\\\+?w\*')
NOTE_RE = re.compile(r'\\(f|x|fe)\s.*?\\\1\*', re.S)
MARK_RE = re.compile(r'\\[a-z0-9+]+\*|\\[a-z0-9+]+\s?')


def dump(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))


def clean(s, tagged):
    s = NOTE_RE.sub("", s)
    if tagged:
        s = W_RE.sub(lambda m: f"⟦{m.group(1).strip()}|{m.group(2)}{int(m.group(3))}⟧" if m.group(1).strip() else "", s)
    s = W_PLAIN.sub(lambda m: m.group(1), s)
    s = MARK_RE.sub("", s)
    s = s.replace("¶", "")
    return re.sub(r"\s+", " ", s).strip()


def parse_usfm(path, tagged):
    chapters = []
    cur = None
    buf = []
    vnum = None

    def flush():
        nonlocal buf
        if cur is not None and vnum is not None:
            txt = clean(" ".join(buf), tagged)
            while len(cur) < vnum[0]:
                cur.append("")
            if cur[vnum[0] - 1]:
                cur[vnum[0] - 1] += " " + txt
            else:
                cur[vnum[0] - 1] = txt
            for extra in range(vnum[0] + 1, vnum[1] + 1):
                while len(cur) < extra:
                    cur.append("")
        buf = []

    for line in open(path, encoding="utf-8"):
        line = line.rstrip("\n")
        m = re.match(r"\\c\s+(\d+)", line)
        if m:
            flush()
            vnum = None
            n = int(m.group(1))
            while len(chapters) < n:
                chapters.append([])
            cur = chapters[n - 1]
            continue
        if re.match(r"\\(s\d?|ms\d?|mr|r|d|h|toc\d|mt\d?|id|ide|rem|sp|cl|is\d?|ip|imt\d?|io\d?|iot)\b", line):
            continue
        rest = line
        while True:
            m = re.search(r"\\v\s+(\d+)(?:-(\d+))?\s?", rest)
            if not m:
                if vnum is not None:
                    buf.append(rest)
                break
            if vnum is not None:
                buf.append(rest[:m.start()])
            flush()
            a = int(m.group(1))
            vnum = (a, int(m.group(2) or a))
            rest = rest[m.end():]
    flush()
    return chapters


def find_usfm(folder, code):
    g = glob.glob(os.path.join(SRC, folder, f"*-{code}{folder}.usfm"))
    return g[0] if g else None


def main():
    meta_books = []
    counts = {}
    es_gloss = {"H": collections.defaultdict(collections.Counter), "G": collections.defaultdict(collections.Counter)}
    STOP = set("de el la los las y mi su en a que se no del al por para con un una sus mis tu tus lo le les nos me te o e ni ha han he".split())

    # ---------- traducciones ----------
    for vid, folder, *_rest in VERSIONS:
        tagged = _rest[-1]
        for code, *_ in BOOKS:
            p = find_usfm(folder, code)
            if not p:
                continue
            chs = parse_usfm(p, tagged)
            if vid == "rv1909":
                counts[code] = [len(c) for c in chs]
            if tagged:
                for ch in chs:
                    for v in ch:
                        for m in re.finditer(r"⟦([^|⟧]*)\|([HG])(\d+)⟧", v):
                            words = re.findall(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+", m.group(1).lower())
                            words = [w for w in words if w not in STOP and len(w) > 1]
                            if words:
                                es_gloss[m.group(2)][int(m.group(3))][words[-1]] += 1
            dump(os.path.join(OUT, "t", vid, code + ".json"), {"c": chs})
        print("versión", vid)

    # ---------- hebreo (OSHB) ----------
    conc = {"H": collections.defaultdict(list), "G": collections.defaultdict(list)}
    freq = {"H": collections.Counter(), "G": collections.Counter()}
    vre = re.compile(r'<verse osisID="([^"]+)">(.*?)</verse>', re.S)
    wre = re.compile(r'<w ([^>]*)>(.*?)</w>(<seg type="x-maqqef">־</seg>)?')
    for code, osis, *_ in BOOKS[:39]:
        xml = open(os.path.join(SRC, "oshb", osis + ".xml"), encoding="utf-8").read()
        xml = re.sub(r"<note.*?</note>", "", xml, flags=re.S)
        chapters = collections.defaultdict(dict)
        for vm in vre.finditer(xml):
            _, c, v = vm.group(1).split(".")
            c, v = int(c), int(v)
            words = []
            for wm in wre.finditer(vm.group(2)):
                attrs = dict(re.findall(r'(\w+)="([^"]*)"', wm.group(1)))
                text = wm.group(2).replace("/", "") + ("־" if wm.group(3) else "")
                nums = re.findall(r"(\d+)", attrs.get("lemma", ""))
                s = int(nums[-1]) if nums else 0
                words.append([text, s, attrs.get("morph", "")])
                if s:
                    ref = BIDX[code] * 1000000 + c * 1000 + v
                    lst = conc["H"][s]
                    if not lst or lst[-1] != ref:
                        lst.append(ref)
                    freq["H"][s] += 1
            chapters[c][v] = words
        for c, vs in chapters.items():
            n = max(vs)
            dump(os.path.join(OUT, "o", "heb", code, f"{c}.json"), [vs.get(i, []) for i in range(1, n + 1)])
        print("hebreo", code)

    # ---------- griego TR (eBible, con Strong) ----------
    for code, _o, nst, *_ in BOOKS[39:]:
        chs = parse_usfm(find_usfm("grctr", code), True)
        for ci, ch in enumerate(chs, 1):
            out = []
            for vi, v in enumerate(ch, 1):
                words = []
                for tok in re.findall(r"\S+", v):
                    m = re.match(r"^(.*?)⟦(.*?)\|G(\d+)⟧(.*)$", tok)
                    if m:
                        s = int(m.group(3))
                        words.append([m.group(1) + m.group(2) + m.group(4), s])
                        ref = BIDX[code] * 1000000 + ci * 1000 + vi
                        lst = conc["G"][s]
                        if not lst or lst[-1] != ref:
                            lst.append(ref)
                    elif words and re.fullmatch(r"[^\w]+", tok):
                        words[-1][0] += tok
                    else:
                        words.append([tok, 0])
                out.append(words)
            dump(os.path.join(OUT, "o", "tr", code, f"{ci}.json"), out)
    print("griego TR")

    # ---------- griego Nestle 1904 (morfología, lema y Strong) ----------
    nmap = {b[2]: b[0] for b in BOOKS if b[2]}
    na = collections.defaultdict(lambda: collections.defaultdict(lambda: collections.defaultdict(list)))
    with open(os.path.join(SRC, "nestle.csv"), encoding="utf-8-sig") as f:
        next(f)
        for line in f:
            p = line.rstrip("\r\n").split("\t")
            if len(p) < 6:
                continue
            bk, cv = p[0].split(" ")
            c, v = map(int, cv.split(":"))
            code = nmap[bk]
            sn = re.findall(r"\d+", p[4])
            s = int(sn[0]) if sn else 0
            na[code][c][v].append([p[1], s, p[2], p[5]])
            if s:
                ref = BIDX[code] * 1000000 + c * 1000 + v
                lst = conc["G"][s]
                if ref not in lst[-3:]:
                    lst.append(ref)
                freq["G"][s] += 1
    for code, chs in na.items():
        for c, vs in chs.items():
            n = max(vs)
            dump(os.path.join(OUT, "o", "na", code, f"{c}.json"), [vs.get(i, []) for i in range(1, n + 1)])
    print("griego Nestle")

    # ---------- léxico Strong ----------
    for L, fn in (("H", "strongs-heb.js"), ("G", "strongs-grk.js")):
        raw = open(os.path.join(SRC, fn), encoding="utf-8").read()
        js = json.loads(raw[raw.index("{"):raw.rindex("}") + 1])
        blocks = collections.defaultdict(dict)
        for k, e in js.items():
            n = int(re.sub(r"\D", "", k))
            gl = es_gloss[L].get(n)
            blocks[n // 100][n] = {
                "l": e.get("lemma", ""), "x": e.get("xlit") or e.get("translit", ""), "p": e.get("pron", ""),
                "d": (e.get("strongs_def") or "").strip(), "k": (e.get("kjv_def") or "").strip(),
                "o": (e.get("derivation") or "").strip(), "f": freq[L].get(n, 0),
                "es": [[w, c] for w, c in gl.most_common(4)] if gl else [],
            }
        for b, d in blocks.items():
            dump(os.path.join(OUT, "lex", L, f"{b}.json"), d)
        # glosa corta para el interlineal: español si existe; si no, la primera de la KJV (inglés, entre corchetes)
        gl = {}
        for k, v in MANUAL[L].items():
            n = k
            b = blocks[n // 100].get(n)
            if b is not None:
                b["es"] = [[v, 0]] + [e for e in b["es"] if e[0] != v][:3]
        for blk in blocks.values():
            for n, e in blk.items():
                if e["es"]:
                    gl[n] = e["es"][0][0]
                else:
                    k = re.sub(r"\[[^\]]*\]|\([^)]*\)", "", e["k"]).split(",")[0].strip(" .;-")
                    if k:
                        gl[n] = "[" + k + "]"
        dump(os.path.join(OUT, "gl", L + ".json"), gl)
        cb = collections.defaultdict(dict)
        for n, refs in conc[L].items():
            cb[n // 100][n] = sorted(set(refs))
        for b, d in cb.items():
            dump(os.path.join(OUT, "conc", L, f"{b}.json"), d)
        print("léxico", L, len(js))

    meta = {
        "books": [{"id": b[0], "n": b[3], "a": b[4], "t": "AT" if b[0] in OT else "NT", "ch": counts.get(b[0], [])} for b in BOOKS],
        "versions": [{"id": v[0], "n": v[2], "s": v[3], "lang": v[4], "lic": v[5], "tag": v[6]} for v in VERSIONS] + [
            {"id": "heb", "n": "Hebreo · Texto masorético (Códice de Leningrado)", "s": "Hebreo", "lang": "he",
             "lic": "WLC: dominio público · Morfología: Open Scriptures Hebrew Bible, CC BY 4.0", "orig": True, "only": "AT"},
            {"id": "tr", "n": "Griego · Textus Receptus", "s": "Griego TR", "lang": "grc",
             "lic": "Dominio público (eBible.org, notas de A. Boyd)", "orig": True, "only": "NT"},
            {"id": "na", "n": "Griego · Nestle 1904", "s": "Griego NA1904", "lang": "grc",
             "lic": "Texto: dominio público · Morfología: biblicalhumanities.org, CC0", "orig": True, "only": "NT"},
        ],
    }
    dump(os.path.join(OUT, "meta.json"), meta)
    print("listo")


if __name__ == "__main__":
    main()
