(() => {
  "use strict";

  const CFG = window.CONFIG || {};
  const CATS = window.CATEGORIAS || {};
  const ALL = (window.RECURSOS || []).slice().sort((a, b) =>
    (b.destacado - a.destacado) || String(b.fecha).localeCompare(String(a.fecha)));

  const $ = (s) => document.querySelector(s);
  const els = {
    q: $("#q"), formato: $("#f-formato"), tipo: $("#f-tipo"), chips: $("#chips"),
    count: $("#count"), grid: $("#grid"), empty: $("#empty"), clear: $("#clear"), more: $("#more"),
    modal: $("#modal"), leadForm: $("#lead-form"), formView: $("#modal-form-view"),
    okView: $("#modal-ok-view"), modalRes: $("#modal-resource"), modalDl: $("#modal-download"),
    formErr: $("#form-error")
  };

  const state = { q: "", cat: "", formato: "", tipo: "", visible: CFG.porPagina || 9 };
  const NEW_DAYS = 30;

  /* ---------- Utilidades ---------- */
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const isExternal = (url) => /^https?:\/\//i.test(url || "");
  const isNew = (r) => r.fecha && (Date.now() - new Date(r.fecha)) / 864e5 <= NEW_DAYS;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } }
  };
  function toast(msg) {
    const t = document.createElement("div");
    t.className = "toast"; t.textContent = msg; t.setAttribute("role", "status");
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2200);
  }

  /* ---------- Textos generales ---------- */
  $("#hero-sub").textContent = CFG.subtitulo || "";
  if (CFG.licencia) {
    $("#license").innerHTML = `© ${new Date().getFullYear()} ${esc(CFG.autor)} · Juegos y diseños originales bajo licencia ` +
      `<a href="${esc(CFG.licencia.url)}" target="_blank" rel="noopener">${esc(CFG.licencia.nombre)}</a>. Las historias, lecciones y textos bíblicos citados pertenecen a sus editores.`;
  }
  const redesNombres = { instagram: "Instagram", youtube: "YouTube", tiktok: "TikTok", linkedin: "LinkedIn", github: "GitHub", email: "Correo" };
  $("#social").innerHTML = Object.entries(CFG.redes || {})
    .filter(([, url]) => url)
    .map(([k, url]) => `<a href="${k === "email" ? "mailto:" + esc(url) : esc(url)}" target="_blank" rel="noopener">${redesNombres[k] || k}</a>`)
    .join("");

  /* ---------- Tema claro/oscuro ---------- */
  const savedTheme = store.get("theme");
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  $(".theme-toggle").addEventListener("click", () => {
    const dark = document.documentElement.dataset.theme
      ? document.documentElement.dataset.theme === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches;
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    store.set("theme", next);
  });

  /* ---------- Filtros ---------- */
  [...new Set(ALL.map((r) => r.formato).filter(Boolean))].sort().forEach((f) => {
    els.formato.insertAdjacentHTML("beforeend", `<option value="${esc(f)}">${esc(f)}</option>`);
  });
  const usedCats = Object.keys(CATS).filter((k) => ALL.some((r) => r.categoria === k));
  els.chips.innerHTML = [`<button class="chip" data-cat="" aria-pressed="true">Todos</button>`]
    .concat(usedCats.map((k) => `<button class="chip" data-cat="${esc(k)}" aria-pressed="false">${CATS[k].icono} ${esc(CATS[k].nombre)}</button>`))
    .join("");

  function readUrl() {
    const p = new URLSearchParams(location.search);
    state.q = p.get("q") || "";
    state.cat = p.get("cat") || "";
    state.formato = p.get("formato") || "";
    state.tipo = p.get("tipo") || "";
    els.q.value = state.q; els.formato.value = state.formato; els.tipo.value = state.tipo;
  }
  function writeUrl() {
    const p = new URLSearchParams();
    ["q", "cat", "formato", "tipo"].forEach((k) => state[k] && p.set(k, state[k]));
    const qs = p.toString();
    history.replaceState(null, "", qs ? `?${qs}#biblioteca` : location.pathname);
  }

  function filtered() {
    const terms = norm(state.q).split(/\s+/).filter(Boolean);
    return ALL.filter((r) => {
      if (state.cat && r.categoria !== state.cat) return false;
      if (state.formato && r.formato !== state.formato) return false;
      if (state.tipo && r.tipo !== state.tipo) return false;
      if (!terms.length) return true;
      const hay = norm([r.titulo, r.descripcion, r.formato, CATS[r.categoria]?.nombre, ...(r.etiquetas || [])].join(" "));
      return terms.every((t) => hay.includes(t));
    });
  }

  /* ---------- Render ---------- */
  function card(r) {
    const cat = CATS[r.categoria] || { nombre: "Otros", icono: "📁" };
    const badges = [
      r.destacado && `<span class="badge badge--dest">Destacado</span>`,
      isNew(r) && `<span class="badge badge--new">Nuevo</span>`,
      r.tipo === "premium" ? `<span class="badge badge--premium">Premium</span>` : `<span class="badge badge--gratis">Gratis</span>`
    ].filter(Boolean).join("");
    const cover = r.portada
      ? `<div class="cover"><img src="${esc(r.portada)}" alt="" loading="lazy">${`<div class="badges">${badges}</div>`}</div>`
      : `<div class="cover cover--auto cat-${CATS[r.categoria] ? esc(r.categoria) : "otros"}">
           <span class="cover__icon" aria-hidden="true">${cat.icono}</span>
           <span class="cover__fmt">${esc(r.formato)}</span>
           <div class="badges">${badges}</div>
         </div>`;
    const meta = [r.formato, r.peso, r.detalles].filter(Boolean).map((m) => `<span>${esc(m)}</span>`).join("");
    const premium = r.tipo === "premium";
    const mail = /^mailto:/i.test(r.archivo || "");
    const ext = isExternal(r.archivo);
    const enlace = r.formato === "Enlace" || /\/$/.test(r.archivo || "");
    const label = mail ? "Pedir por correo ✉" : premium ? "Ver recurso ↗" : ext ? "Abrir ↗" : enlace ? "Abrir ▶" : "Descargar ↓";
    const attrs = mail ? "" : premium || ext ? 'target="_blank" rel="noopener"' : enlace ? "" : "download";
    return `
      <article class="card" id="r-${esc(r.id)}">
        ${cover}
        <div class="card__body">
          <span class="card__cat">${esc(cat.nombre)}</span>
          <h3>${esc(r.titulo)}</h3>
          <p>${esc(r.descripcion)}</p>
          <div class="meta">${meta}</div>
          <div class="card__actions">
            <a class="btn btn--primary" href="${esc(r.archivo)}" data-id="${esc(r.id)}"
               ${attrs}>${label}</a>
            <button class="btn btn--ghost btn--icon" type="button" data-share="${esc(r.id)}" aria-label="Copiar enlace a ${esc(r.titulo)}" title="Copiar enlace">🔗</button>
          </div>
        </div>
      </article>`;
  }

  function render() {
    const list = filtered();
    const shown = list.slice(0, state.visible);
    els.grid.innerHTML = shown.map(card).join("");
    els.count.textContent = `${list.length} ${list.length === 1 ? "recurso disponible" : "recursos disponibles"}`;
    els.empty.hidden = list.length > 0;
    els.more.hidden = list.length <= state.visible;
    els.chips.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.cat === state.cat)));
  }

  function update(patch) {
    Object.assign(state, patch, { visible: CFG.porPagina || 9 });
    writeUrl();
    render();
  }

  /* ---------- Eventos ---------- */
  let timer;
  els.q.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(() => update({ q: els.q.value.trim() }), 150); });
  els.formato.addEventListener("change", () => update({ formato: els.formato.value }));
  els.tipo.addEventListener("change", () => update({ tipo: els.tipo.value }));
  els.chips.addEventListener("click", (e) => {
    const b = e.target.closest(".chip");
    if (b) update({ cat: b.dataset.cat });
  });
  els.clear.addEventListener("click", () => {
    els.q.value = ""; els.formato.value = ""; els.tipo.value = "";
    update({ q: "", cat: "", formato: "", tipo: "" });
  });
  els.more.addEventListener("click", () => { state.visible += CFG.porPagina || 9; render(); });

  els.grid.addEventListener("click", async (e) => {
    const share = e.target.closest("[data-share]");
    if (share) {
      const url = `${location.origin}${location.pathname}?r=${encodeURIComponent(share.dataset.share)}`;
      window.track?.(`compartir/${share.dataset.share}`, "Compartir enlace");
      try { await navigator.clipboard.writeText(url); toast("Enlace copiado"); }
      catch { prompt("Copia este enlace:", url); }
      return;
    }
    const link = e.target.closest("a[data-id]");
    if (!link) return;
    const r = ALL.find((x) => x.id === link.dataset.id);
    if (r && (r.formato === "Enlace" || r.tipo === "premium")) window.track?.(`abrir/${r.id}`, `Abrir: ${r.titulo}`);
    if (!r || r.tipo === "premium" || r.formato === "Enlace") return;
    const cap = CFG.captura || {};
    if (cap.activo && !(cap.recordar && store.get("lead"))) {
      e.preventDefault();
      openModal(r);
    }
  });

  /* ---------- Modal de correo ---------- */
  let pending = null;
  function openModal(r) {
    pending = r;
    els.formView.hidden = false; els.okView.hidden = true; els.formErr.hidden = true;
    els.modalRes.textContent = r.titulo;
    els.leadForm.reset();
    if (typeof els.modal.showModal === "function") els.modal.showModal();
    else location.href = r.archivo;
  }
  function showOk() {
    els.formView.hidden = true; els.okView.hidden = false;
    els.modalDl.href = pending.archivo;
    if (isExternal(pending.archivo)) { els.modalDl.removeAttribute("download"); els.modalDl.target = "_blank"; }
    else { els.modalDl.setAttribute("download", ""); els.modalDl.removeAttribute("target"); }
  }
  els.leadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(els.leadForm);
    data.append("recurso", pending.id);
    const endpoint = (CFG.captura || {}).endpoint;
    try {
      if (endpoint) {
        const res = await fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(res.status);
      }
      store.set("lead", "1");
      showOk();
    } catch {
      els.formErr.hidden = false;
      showOk();
    }
  });

  /* ---------- Inicio ---------- */
  readUrl();
  render();

  // Enlace directo a un recurso: ?r=id
  const target = new URLSearchParams(location.search).get("r");
  if (target) {
    const idx = filtered().findIndex((r) => r.id === target);
    if (idx >= state.visible) { state.visible = idx + 1; render(); }
    const el = document.getElementById(`r-${target}`);
    if (el) { el.classList.add("is-target"); el.scrollIntoView({ block: "center" }); }
  }
})();
