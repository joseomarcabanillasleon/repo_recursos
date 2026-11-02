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
