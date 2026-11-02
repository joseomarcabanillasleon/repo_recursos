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
 *  ⚠️ Los recursos de ejemplo de abajo son de muestra:
 *     sustitúyelos por los tuyos reales.
 */

window.CATEGORIAS = {
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
    categoria: "ninos",
    formato: "Enlace",
    tipo: "gratis",
    destacado: true,
    peso: "11 MB",
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
    categoria: "biblia",
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
    categoria: "ninos",
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
    categoria: "ninos",
    formato: "PPTX",
    tipo: "gratis",
    destacado: false,
    peso: "25 MB",
    detalles: "15 diapositivas",
    etiquetas: ["escuela sabática", "misionero", "croacia", "presentación"],
    portada: "",
    archivo: "escuela-sabatica/misioneros/Aventura_Misionera_en_Croacia.pptx",
    fecha: "2026-11-02"
  },
  {
    id: "versiculo-diario-genesis",
    titulo: "Pack de imágenes: Génesis capítulo a capítulo",
    descripcion: "Un versículo destacado por capítulo de Génesis, listo para compartir en redes o imprimir.",
    categoria: "biblia",
    formato: "ZIP",
    tipo: "gratis",
    destacado: true,
    peso: "24 MB",
    detalles: "50 imágenes",
    etiquetas: ["versículos", "redes sociales", "génesis", "devocional"],
    portada: "",
    archivo: "archivos/ejemplo.pdf",
    fecha: "2026-10-28"
  },
  {
    id: "atributos-de-dios-ninos",
    titulo: "Atributos de Dios para niños",
    descripcion: "Fichas ilustradas con un atributo de Dios, un versículo y una actividad práctica para hacer en familia.",
    categoria: "ninos",
    formato: "PDF",
    tipo: "gratis",
    destacado: true,
    peso: "3,2 MB",
    detalles: "12 fichas",
    etiquetas: ["homeschool", "culto familiar", "actividades", "imprimible"],
    portada: "",
    archivo: "archivos/ejemplo.pdf",
    fecha: "2026-10-20"
  },
  {
    id: "prompts-ilustraciones-biblicas",
    titulo: "Prompts para ilustraciones bíblicas con coherencia histórica",
    descripcion: "Plantillas de prompts para generar escenas bíblicas con vestimenta, arquitectura y paisaje de la época.",
    categoria: "ia",
    formato: "PDF",
    tipo: "gratis",
    destacado: false,
    peso: "800 KB",
    detalles: "20 prompts",
    etiquetas: ["imágenes", "ia generativa", "ilustración", "iconografía"],
    portada: "",
    archivo: "archivos/ejemplo.pdf",
    fecha: "2026-10-12"
  },
  {
    id: "checklist-admin-strategy",
    titulo: "Checklist de administración de Strategy (MicroStrategy)",
    descripcion: "Revisión periódica de cubos, suscripciones, cachés, seguridad y rendimiento para administradores BI.",
    categoria: "datos",
    formato: "PDF",
    tipo: "gratis",
    destacado: false,
    peso: "450 KB",
    detalles: "6 páginas",
    etiquetas: ["microstrategy", "administración", "bi", "monitorización"],
    portada: "",
    archivo: "archivos/ejemplo.pdf",
    fecha: "2026-09-30"
  },
  {
    id: "plan-huerto-jardinera",
    titulo: "Plan de cultivo para jardinera 80×40 cm",
    descripcion: "Qué plantar, cuándo y cómo combinar cultivos en una jardinera pequeña con clima mediterráneo.",
    categoria: "huerto",
    formato: "PDF",
    tipo: "gratis",
    destacado: false,
    peso: "1,1 MB",
    detalles: "Calendario anual",
    etiquetas: ["huerto urbano", "tomate cherry", "fresas", "aromáticas"],
    portada: "",
    archivo: "archivos/ejemplo.pdf",
    fecha: "2026-09-15"
  },
  {
    id: "kit-ia-familias",
    titulo: "Kit de IA para familias cristianas",
    descripcion: "Guía práctica para usar la IA en el estudio bíblico y la educación en casa con criterio y límites claros.",
    categoria: "ia",
    formato: "PDF",
    tipo: "premium",
    destacado: false,
    peso: "2,4 MB",
    detalles: "5 guías · 15 prompts",
    etiquetas: ["homeschool", "estudio bíblico", "pantallas", "prompts"],
    portada: "",
    archivo: "https://ejemplo.com/tu-tienda",
    fecha: "2026-09-01"
  }
];
