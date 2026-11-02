/*
 * ============================================================
 *  CONFIGURACIÓN GENERAL DE LA WEB
 * ============================================================
 */
window.CONFIG = {
  autor: "Jose Omar",
  titulo: "Recursos que creo y comparto",
  subtitulo:
    "Materiales bíblicos, educativos, de IA y de datos. Descárgalos, úsalos y compártelos.",

  // Licencia que se muestra en el pie. Cambia si prefieres otra.
  licencia: {
    nombre: "CC BY-NC 4.0",
    url: "https://creativecommons.org/licenses/by-nc/4.0/deed.es"
  },

  /*
   * CAPTURA DE CORREO (opcional)
   * - activo: false → los recursos gratis se descargan directamente.
   * - activo: true  → antes de descargar se pide el correo.
   * Para guardar los correos necesitas un servicio de formularios.
   * El más sencillo: crea un formulario en https://formspree.io (gratis
   * hasta 50 envíos/mes) y pega aquí su URL "https://formspree.io/f/XXXX".
   */
  captura: {
    activo: false,
    endpoint: "",
    recordar: true // si ya dejó su correo una vez, no se lo vuelve a pedir
  },

  // Redes: deja "" en las que no uses y no aparecerán.
  redes: {
    instagram: "",
    youtube: "",
    tiktok: "",
    linkedin: "",
    github: "https://github.com/joseomarcabanillasleon",
    email: ""
  },

  porPagina: 9 // recursos visibles antes de "Ver más"
};
