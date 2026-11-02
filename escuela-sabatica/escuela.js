(() => {
  "use strict";
  const T = window.TRIMESTRE, W = window.SEMANAS || [];
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const MESES_L = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const parts = (iso) => iso.split("-").map(Number);
  const corta = (iso) => { const [, m, d] = parts(iso); return { d, m: MESES[m - 1] }; };
  const larga = (iso) => { const [, m, d] = parts(iso); return `Sábado ${d} de ${MESES_L[m - 1]}`; };
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } }
  };

  /* Tema (compartido con la portada) */
  const t = store.get("theme");
  if (t) document.documentElement.dataset.theme = t;
  $(".theme-toggle").addEventListener("click", () => {
    const d = document.documentElement.dataset.theme
      ? document.documentElement.dataset.theme === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches;
    const n = d ? "light" : "dark";
    document.documentElement.dataset.theme = n; store.set("theme", n);
  });

  /* Cabecera */
  $("#periodo").textContent = `Escuela Sabática · ${T.periodo}`;
  $("#titulo").textContent = T.titulo;
  $("#grupo").textContent = T.grupo;

  /* Semana actual: el primer sábado que aún no ha pasado */
  const hoy = new Date(); const pad = (n) => String(n).padStart(2, "0");
  const hoyISO = `${hoy.getFullYear()}-${pad(hoy.getMonth() + 1)}-${pad(hoy.getDate())}`;
  const actual = W.find((w) => w.fecha >= hoyISO);
  const estado = (w) => !actual ? "is-past" : w.fecha < actual.fecha ? "is-past" : w === actual ? "is-now" : "";

  /* Este sábado */
  if (actual) {
    $("#today").innerHTML = `
      <h2 id="hoy-titulo">Este sábado</h2>
      <p class="today__date">${larga(actual.fecha)} · Semana ${actual.semana}</p>
      <div class="today__grid">
        <div class="today__item">
          <span class="kind">🌍 Misionero · ${esc(actual.mision.pais)}</span>
          <h3>${esc(actual.mision.titulo)}</h3>
          <p>Juego: ${esc(actual.mision.juegoTitulo)}. ${esc(actual.mision.juegoDesc)}</p>
          <a class="btn btn--primary" href="juegos/${esc(actual.mision.juego)}/">Jugar la misión ▶</a>
        </div>
        <div class="today__item">
          <span class="kind">📖 Lección ${actual.leccion.numero}</span>
          <h3>${esc(actual.leccion.titulo)}</h3>
          <p>Juego: ${esc(actual.leccion.juegoTitulo)}. ${esc(actual.leccion.juegoDesc)}</p>
          <a class="btn btn--primary" href="juegos/${esc(actual.leccion.juego)}/">Jugar la lección ▶</a>
        </div>
      </div>`;
  } else {
    $("#today").innerHTML = `<h2 id="hoy-titulo">Trimestre terminado</h2><p class="muted">Este trimestre ya ha terminado. Los materiales siguen disponibles abajo.</p>`;
  }

  /* Descargas */
  const dl = (d, titulo) => `
    <a class="dl" href="${esc(d.archivo)}" download>
      <span class="dl__icon dl__icon--${d.formato.toLowerCase()}">${esc(d.formato)}</span>
      <span><strong>${esc(titulo)}</strong><small>${esc(d.detalles)} · ${esc(d.peso)} · Descargar ↓</small></span>
    </a>`;
  $("#dl-lecciones").innerHTML = dl(T.descargas.lecciones, `Libro de lecciones «${T.titulo}»`);
  $("#dl-misioneros").innerHTML = dl(T.descargas.mision, "Misión para niños · historias del trimestre")
    + dl(T.descargas.presentacion, "Aventura misionera en Croacia (presentación)");

  /* Listas */
  const fecha = (w) => { const c = corta(w.fecha); return `<div class="week__date"><strong>${c.d} ${c.m}</strong>Semana ${w.semana}</div>`; };
  $("#list-lecciones").innerHTML = W.map((w) => `
    <li class="week ${estado(w)}">
      ${fecha(w)}
      <div class="week__main"><span class="tag">Lección ${w.leccion.numero}</span><h3>${esc(w.leccion.titulo)}</h3></div>
      <a class="btn btn--ghost" href="juegos/${esc(w.leccion.juego)}/">Juego ▶</a>
    </li>`).join("");
  $("#list-misioneros").innerHTML = W.map((w) => `
    <li class="week ${estado(w)}">
      ${fecha(w)}
      <div class="week__main"><span class="tag">${esc(w.mision.pais)}</span><h3>${esc(w.mision.titulo)}</h3></div>
      <a class="btn btn--ghost" href="juegos/${esc(w.mision.juego)}/">Juego ▶</a>
    </li>`).join("");
  $("#list-juegos").innerHTML = W.map((w) => `
    <li class="week ${estado(w)}">
      ${fecha(w)}
      <a class="game-cell" href="juegos/${esc(w.mision.juego)}/"><span class="tag">Misión · ${esc(w.mision.pais)}</span><strong>${esc(w.mision.juegoTitulo)}</strong><small>${esc(w.mision.juegoDesc)}</small></a>
      <a class="game-cell" href="juegos/${esc(w.leccion.juego)}/"><span class="tag">Lección ${w.leccion.numero}</span><strong>${esc(w.leccion.juegoTitulo)}</strong><small>${esc(w.leccion.juegoDesc)}</small></a>
    </li>`).join("");

  /* Pestañas accesibles (flechas izquierda/derecha) */
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  function select(tab, focus) {
    tabs.forEach((b) => {
      const on = b === tab;
      b.setAttribute("aria-selected", String(on));
      b.tabIndex = on ? 0 : -1;
      document.getElementById(b.getAttribute("aria-controls")).hidden = !on;
    });
    if (focus) tab.focus();
    history.replaceState(null, "", "#" + tab.id.replace("tab-", ""));
  }
  tabs.forEach((b, i) => {
    b.addEventListener("click", () => select(b));
    b.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") select(tabs[(i + 1) % tabs.length], true);
      if (e.key === "ArrowLeft") select(tabs[(i - 1 + tabs.length) % tabs.length], true);
    });
  });
  const inicial = tabs.find((b) => "#" + b.id.replace("tab-", "") === location.hash);
  if (inicial) select(inicial);
})();
