/*
 * ============================================================
 *  ESTADÍSTICAS ANÓNIMAS (GoatCounter)
 *  Sin cookies ni datos personales: no hace falta aviso de cookies.
 *
 *  Para activarlas:
 *   1. Crea una cuenta gratis en https://www.goatcounter.com/signup
 *   2. Elige un código (p. ej. "recursosadventistas").
 *   3. Escríbelo aquí abajo entre las comillas y haz commit y push.
 *  Con el código vacío no se envía nada.
 *
 *  Qué se cuenta:
 *   - Visitas a cada página (portada, Escuela Sabática, cada juego).
 *   - Eventos: descarga/<archivo>, abrir/<recurso>, compartir/<recurso>.
 * ============================================================
 */
(() => {
  "use strict";
  const GOATCOUNTER = "recursosadventistas";

  const queue = [];
  const send = (e) => window.goatcounter && window.goatcounter.count ? window.goatcounter.count(e) : queue.push(e);
  window.track = (path, title) => { if (GOATCOUNTER) send({ path, title: title || path, event: true }); };
  if (!GOATCOUNTER) return;

  // No contar visitas en local ni en vistas previas
  if (location.protocol === "file:" || /^(localhost|127\.|0\.0\.0\.0)/.test(location.hostname)) { window.track = () => {}; return; }

  const s = document.createElement("script");
  s.async = true;
  s.src = "https://gc.zgo.at/count.js";
  s.dataset.goatcounter = `https://${GOATCOUNTER}.goatcounter.com/count`;
  s.onload = () => { while (queue.length) window.goatcounter.count(queue.shift()); };
  document.head.appendChild(s);

  const nota = document.getElementById("stats-note");
  if (nota) nota.hidden = false;

  // Descargas: cualquier enlace a un archivo
  const EXT = /\.(pdf|pptx?|docx?|xlsx?|zip|png|jpe?g|webp|mp3|mp4)$/i;
  document.addEventListener("click", (ev) => {
    const a = ev.target.closest("a[href]");
    if (!a) return;
    const url = new URL(a.href, location.href);
    if (url.origin === location.origin && (a.hasAttribute("download") || EXT.test(url.pathname))) {
      const file = decodeURIComponent(url.pathname.split("/").pop());
      window.track(`descarga/${file}`, `Descarga: ${file}`);
    }
  }, true);
})();
