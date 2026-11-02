/*
 * ============================================================
 *  CATÁLOGO DE RECURSOS
 *  Para añadir un recurso: copia un bloque { ... }, pégalo al
 *  principio de la lista y cambia sus datos. No hace falta tocar
 *  nada más de la web.
 * ============================================================
 *
 *  Campos:
 *   id          → identificador único, sin espacios (se usa en la URL: ?r=id)
 *   titulo      → nombre visible del recurso
 *   descripcion → 1–2 frases sobre qué es y para quién
 *   categoria   → una de las claves de CATEGORIAS (abajo)
 *   formato     → "PDF", "ZIP", "PNG", "Enlace", "XLSX", "Plantilla"...
 *   tipo        → "gratis" | "premium"   (premium = enlace externo de pago)
 *   destacado   → true | false
 *   peso        → texto libre: "2,1 MB"
 *   detalles    → texto libre opcional: "12 páginas", "30 imágenes"
 *   etiquetas   → lista de palabras clave para el buscador
 *   portada     → ruta a imagen (assets/img/...) o "" para portada automática
 *   archivo     → ruta al archivo (archivos/...) o URL externa (Drive, Gumroad...)
 *   fecha       → "AAAA-MM-DD" (sirve para ordenar y marcar "Nuevo")
 *
 *  Para enlazar a una página o app (no a un archivo), pon formato: "Enlace".
 */

window.CATEGORIAS = {
  escuela:  { nombre: "Escuela Sabática",    icono: "⛪" },
  biblia:   { nombre: "Biblia",              icono: "📖" },
  ninos:    { nombre: "Niños y familia",     icono: "🧒" },
  ia:       { nombre: "IA y prompts",        icono: "✨" },
  datos:    { nombre: "Datos y BI",          icono: "📊" },
  huerto:   { nombre: "Huerto y naturaleza", icono: "🌱" }
};

window.RECURSOS = [
  {
    id: "juegos-escuela-sabatica-4t-2026",
    titulo: "Mi Biblia, mi tesoro: 26 juegos de detectives para Escuela Sabática",
    descripcion: "Un juego por lección y otro por historia misionera del 4.º trimestre 2026, para proyectar en clase desde el móvil y que participen todos los niños.",
    categoria: "escuela",
    formato: "Enlace",
    tipo: "gratis",
    destacado: true,
    peso: "",
    detalles: "26 juegos · 9–12 años",
    etiquetas: ["escuela sabática", "juegos", "niños", "detectives", "misión", "hechos", "pablo"],
    portada: "",
    archivo: "escuela-sabatica/juegos/",
    fecha: "2026-11-02"
  },
  {
    id: "lecciones-mi-biblia-mi-tesoro-4t-2026",
    titulo: "Lecciones «Mi Biblia, mi tesoro» · 4.º trimestre 2026",
    descripcion: "Libro de lecciones del alumno de 9–12 años (Año C): de «Debate en Jerusalén» a «Y mientras esperamos… amor».",
    categoria: "escuela",
    formato: "PDF",
    tipo: "gratis",
    destacado: false,
    peso: "45 MB",
    detalles: "13 lecciones · 86 páginas",
    etiquetas: ["escuela sabática", "lecciones", "niños", "hechos", "pablo", "trimestre"],
    portada: "",
    archivo: "escuela-sabatica/lecciones/Mi_Biblia_mi_tesoro_9-12_4T_2026.pdf",
    fecha: "2026-11-02"
  },
  {
    id: "mision-ninos-4t-2026",
    titulo: "Misión para niños · 4.º trimestre 2026",
    descripcion: "Historias misioneras de Finlandia, Croacia, Polonia y Reino Unido, una por sábado, con el programa del decimotercer sábado.",
    categoria: "escuela",
    formato: "PDF",
    tipo: "gratis",
    destacado: false,
    peso: "4,1 MB",
    detalles: "13 historias",
    etiquetas: ["escuela sabática", "misionero", "misión", "niños", "polonia", "croacia"],
    portada: "",
    archivo: "escuela-sabatica/misioneros/Mision_Ninos_4T_2026.pdf",
    fecha: "2026-11-02"
  },
  {
    id: "aventura-misionera-croacia",
    titulo: "Aventura misionera en Croacia (presentación)",
    descripcion: "Presentación para contar en clase la historia misionera de Croacia, el país de los guardianes.",
    categoria: "escuela",
    formato: "PPTX",
    tipo: "gratis",
    destacado: false,
    peso: "25 MB",
    detalles: "15 diapositivas",
    etiquetas: ["escuela sabática", "misionero", "croacia", "presentación"],
    portada: "",
    archivo: "escuela-sabatica/misioneros/Aventura_Misionera_en_Croacia.pptx",
    fecha: "2026-11-02"
  }
];
