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
  salud:    { nombre: "Vida sana",           icono: "💪" },
  biblia:   { nombre: "Biblia",              icono: "📖" },
  ninos:    { nombre: "Niños y familia",     icono: "🧒" },
  ia:       { nombre: "IA y prompts",        icono: "✨" },
  datos:    { nombre: "Datos y BI",          icono: "📊" },
  huerto:   { nombre: "Huerto y naturaleza", icono: "🌱" }
};

window.RECURSOS = [
  {
    id: "descansar-bien",
    titulo: "Descansar bien: guía interactiva del sueño y del descanso",
    descripcion: "Horas de sueño por edad, calculadora familiar de la hora de dormir, rutina de noche para imprimir, diario de sueño, test de hábitos e ideas para el día de descanso.",
    categoria: "salud",
    formato: "Enlace",
    tipo: "gratis",
    destacado: true,
    peso: "",
    detalles: "Calculadora · rutina imprimible",
    etiquetas: ["sueño", "dormir", "descanso", "niños", "rutina", "sábado", "vida sana", "familia"],
    portada: "assets/img/descanso-cover.webp",
    archivo: "descanso/",
    fecha: "2026-11-03"
  },
  {
    id: "comer-bien",
    titulo: "Comer bien: guía interactiva de alimentación saludable",
    descripcion: "El plato equilibrado, un juego para construir tu plato, las raciones de la AESAN, nutrientes clave en dietas vegetarianas, calculadora de etiquetas y reto de 7 días.",
    categoria: "salud",
    formato: "Enlace",
    tipo: "gratis",
    destacado: true,
    peso: "",
    detalles: "Plato · raciones · reto 7 días",
    etiquetas: ["alimentación", "nutrición", "vegetariano", "plato", "recetas", "vida sana", "familia", "B12"],
    portada: "assets/img/alimentacion-cover.webp",
    archivo: "alimentacion/",
    fecha: "2026-11-03"
  },
  {
    id: "gimnasia-para-todos",
    titulo: "Gimnasia para todos: guía interactiva de movimiento seguro",
    descripcion: "12 ejercicios de fuerza, movilidad y equilibrio con una silla y una pared, sesión guiada de 25 minutos con temporizador y cartel para invitar a tu comunidad.",
    categoria: "salud",
    formato: "Enlace",
    tipo: "gratis",
    destacado: true,
    peso: "",
    detalles: "12 ejercicios · 25 min",
    etiquetas: ["gimnasia", "ejercicio", "salud", "mayores", "fuerza", "equilibrio", "vida sana", "comunidad"],
    portada: "assets/img/gym-cover.webp",
    archivo: "gym/",
    fecha: "2026-11-03"
  },
  {
    id: "juegos-escuela-sabatica-4t-2026",
    titulo: "Mi Biblia, mi tesoro: 26 juegos de detectives para Escuela Sabática",
    descripcion: "Un juego por lección y otro por historia misionera del 4.º trimestre 2026, para proyectar en clase desde el móvil y que participen todos los niños. Basados en las historias de Misión Adventista y en «Mi Biblia, mi tesoro».",
    categoria: "escuela",
    formato: "Enlace",
    tipo: "gratis",
    destacado: true,
    peso: "",
    detalles: "26 juegos · 9–12 años",
    etiquetas: ["escuela sabática", "juegos", "niños", "detectives", "misión", "hechos", "pablo"],
    portada: "assets/img/es-juegos.webp",
    archivo: "escuela-sabatica/juegos/",
    fecha: "2026-11-02"
  },
  {
    id: "lecciones-mi-biblia-mi-tesoro-4t-2026",
    titulo: "Lecciones «Mi Biblia, mi tesoro» · 4.º trimestre 2026",
    descripcion: "Libro de lecciones del alumno de 9–12 años (Año C), de Aula7activa y la Unión Adventista Española. No se puede difundir en internet: pídelo a tu iglesia o a Aula7activa.",
    categoria: "escuela",
    formato: "PDF",
    tipo: "gratis",
    destacado: false,
    peso: "",
    detalles: "13 lecciones · se pide por correo",
    etiquetas: ["escuela sabática", "lecciones", "niños", "hechos", "pablo", "trimestre"],
    portada: "assets/img/es-lecciones.webp",
    archivo: "mailto:infantil.aula7activa@gmail.com?subject=Lecciones%20Mi%20Biblia%2C%20mi%20tesoro%20%C2%B7%209-12%20a%C3%B1os%20%C2%B7%20A%C3%B1o%20C%20%C2%B7%204.%C2%BA%20trimestre",
    fecha: "2026-11-02"
  },
  {
    id: "mision-ninos-4t-2026",
    titulo: "Misión para niños · 4.º trimestre 2026",
    descripcion: "Historias misioneras de Finlandia, Croacia, Polonia y Reino Unido para cada sábado. Se reparte en la iglesia cada trimestre; más información en Misión Adventista.",
    categoria: "escuela",
    formato: "PDF",
    tipo: "gratis",
    destacado: false,
    peso: "",
    detalles: "13 historias · en tu iglesia",
    etiquetas: ["escuela sabática", "misionero", "misión", "niños", "polonia", "croacia"],
    portada: "assets/img/es-mision.webp",
    archivo: "https://www.adventistmission.org/",
    fecha: "2026-11-02"
  },
  {
    id: "aventura-misionera-croacia",
    titulo: "Aventura misionera en Croacia (presentación)",
    descripcion: "Presentación para contar en clase la historia misionera de Croacia. Basada en Misión Adventista: Niños (4.º trim. 2026) © AG / ACES; imágenes generadas con IA.",
    categoria: "escuela",
    formato: "PPTX",
    tipo: "gratis",
    destacado: false,
    peso: "25 MB",
    detalles: "15 diapositivas",
    etiquetas: ["escuela sabática", "misionero", "croacia", "presentación"],
    portada: "assets/img/es-croacia.webp",
    archivo: "escuela-sabatica/misioneros/Aventura_Misionera_en_Croacia.pptx",
    fecha: "2026-11-02"
  }
];
