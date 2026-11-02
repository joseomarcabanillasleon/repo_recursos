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
  const icono = (juego) => `juegos/${encodeURIComponent(juego)}/icon-192.png`;
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
  const estado = (w) => !actual || w.fecha < actual.fecha ? "is-past" : w === actual ? "is-now" : "";
  const marca = (w) => w === actual ? `<span class="week__now">Este sábado</span>` : "";

  /* Este sábado */
  if (actual) {
    $("#today").innerHTML = `
      <div class="today__head">
        <h2 id="hoy-titulo">Este sábado</h2>
        <p class="today__date">${larga(actual.fecha)} · Semana ${actual.semana} de ${W.length}</p>
      </div>
      <div class="today__grid">
        <div class="today__item today__item--mision">
          <img src="${icono(actual.mision.juego)}" alt="" width="88" height="88">
          <div>
            <span class="kind">Misionero · ${esc(actual.mision.pais)}</span>
            <h3>${esc(actual.mision.titulo)}</h3>
            <p>Juego: «${esc(actual.mision.juegoTitulo)}». ${esc(actual.mision.juegoDesc)}.</p>
            <a class="btn btn--primary" href="juegos/${esc(actual.mision.juego)}/">Jugar la misión</a>
          </div>
        </div>
        <div class="today__item today__item--leccion">
          <img src="${icono(actual.leccion.juego)}" alt="" width="88" height="88">
          <div>
            <span class="kind">Lección ${actual.leccion.numero}</span>
            <h3>${esc(actual.leccion.titulo)}</h3>
            <p>Juego: «${esc(actual.leccion.juegoTitulo)}». ${esc(actual.leccion.juegoDesc)}.</p>
            <a class="btn btn--primary" href="juegos/${esc(actual.leccion.juego)}/">Jugar la lección</a>
          </div>
        </div>
      </div>`;
  } else {
    $("#today").innerHTML = `<h2 id="hoy-titulo">Trimestre terminado</h2><p class="muted">Este trimestre ya ha terminado. Los materiales siguen disponibles abajo.</p>`;
  }

  /* Descargas */
  const dl = (d, titulo) => {
    const ext = /^https?:\/\//i.test(d.archivo);
    const meta = [d.formato, d.detalles, d.peso].filter(Boolean).map(esc).join(" · ");
    return `
    <a class="dl" href="${esc(d.archivo)}" ${ext ? 'target="_blank" rel="noopener"' : "download"}>
      <img src="${esc(d.portada)}" alt="" width="120" height="68" loading="lazy">
      <span><strong>${esc(titulo)}</strong><small>${meta}</small><span class="go">${ext ? `Ir a ${esc(d.fuente || "la web oficial")} ↗` : "Descargar ↓"}</span></span>
    </a>`;
  };
  $("#dl-lecciones").innerHTML = dl(T.descargas.lecciones, `Libro de lecciones «${T.titulo}»`);
  $("#dl-misioneros").innerHTML = dl(T.descargas.mision, "Misión para niños · historias del trimestre")
    + dl(T.descargas.presentacion, "Aventura misionera en Croacia (presentación)");

  /* Listas */
  const fecha = (w) => { const c = corta(w.fecha); return `<div class="week__date"><strong>${c.d} ${c.m}</strong>Semana ${w.semana}</div>`; };
  $("#list-lecciones").innerHTML = W.map((w) => `
    <li class="week ${estado(w)}">
      ${fecha(w)}
      <div class="week__main"><span class="tag">Lección ${w.leccion.numero}</span>${marca(w)}<h3>${esc(w.leccion.titulo)}</h3></div>
      <a class="btn btn--ghost" href="juegos/${esc(w.leccion.juego)}/">Juego ▶</a>
    </li>`).join("");
  $("#list-misioneros").innerHTML = W.map((w) => `
    <li class="week ${estado(w)}">
      ${fecha(w)}
      <div class="week__main"><span class="tag">${esc(w.mision.pais)}</span>${marca(w)}<h3>${esc(w.mision.titulo)}</h3></div>
      <a class="btn btn--ghost" href="juegos/${esc(w.mision.juego)}/">Juego ▶</a>
    </li>`).join("");
  const celda = (j, tag) => `
      <a class="game-cell" href="juegos/${esc(j.juego)}/">
        <img src="${icono(j.juego)}" alt="" width="52" height="52" loading="lazy">
        <span><span class="tag">${esc(tag)}</span><strong>${esc(j.juegoTitulo)}</strong><small>${esc(j.juegoDesc)}</small></span>
      </a>`;
  $("#list-juegos").innerHTML = W.map((w) => `
    <li class="week ${estado(w)}">
      ${fecha(w)}
      ${celda(w.mision, `Misión · ${w.mision.pais}`)}
      ${celda(w.leccion, `Lección ${w.leccion.numero}`)}
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
  if (inicial) { select(inicial); document.getElementById("semanas").scrollIntoView(); }
})();
