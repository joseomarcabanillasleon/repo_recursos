/* =====================================================================
   Menores A · Coordinación (versión 1)
   - Sábados, roles rotativos y «Misiones de hoy» para proyectar
   - Puntos privados de reconocimiento: +1 por oportunidad, solo suben;
     un error solo se ANULA (con motivo), nunca se resta como castigo
   - Eventos con fecha: subastas (sobre cerrado o precio fijo, lotes
     individuales o colectivos), retos por equipos y convivencias
   - Historial por sábado, pasaporte privado por niño y auditoría
   - Datos solo en este navegador (localStorage); exportar / importar
   ===================================================================== */
(() => {
  "use strict";
  const KEY = "menoresA.v1";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
  const app = $("#app");

  /* ---------------- catálogos ---------------- */
  const CRIT = ["Preparación y esfuerzo", "Respeto y escucha", "Cooperación", "Servicio y cuidado", "Participación bíblica"];
  const OPORT0 = [
    { id: "orden", i: "🧹", n: "Orden y limpieza", d: "Ayudar a dejar el aula como estaba", c: "Servicio y cuidado" },
    { id: "biblia", i: "📖", n: "Biblia", d: "Buscar el pasaje y leerlo", c: "Participación bíblica" },
    { id: "leccion", i: "📘", n: "Lección", d: "Explicar una idea o hacer la pregunta", c: "Participación bíblica" },
    { id: "particip", i: "✋", n: "Participación", d: "Compartir una idea o responder", c: "Respeto y escucha" },
    { id: "versiculo", i: "🧠", n: "Versículo", d: "Decirlo de memoria (o con ayuda)", c: "Preparación y esfuerzo" },
    { id: "misionero", i: "🌍", n: "Misionero", d: "Presentar la historia misionera", c: "Preparación y esfuerzo" },
    { id: "oracion", i: "🙏", n: "Oración", d: "Dirigir o invitar a orar", c: "Respeto y escucha" },
    { id: "musica", i: "🎵", n: "Música", d: "Tocar, cantar o marcar el ritmo", c: "Servicio y cuidado" },
    { id: "ayuda", i: "🤝", n: "Ayudar a un compañero", d: "Incluir a alguien, explicarle", c: "Cooperación" },
  ];
  const ROLES = [
    { id: "bienvenida", i: "👋", n: "Bienvenida", d: "Saludar y ayudar a que todos se sientan incluidos" },
    { id: "acuerdos", i: "🤝", n: "Acuerdos de convivencia", d: "Recordar las normas con respeto" },
    { id: "misionero", i: "🌍", n: "Misionero", d: "Presentar una parte con tarjeta, mapa u objeto" },
    { id: "leccion", i: "📘", n: "Lección", d: "Leer el pasaje, hacer la pregunta o resumir" },
    { id: "actividad", i: "🎯", n: "Actividad", d: "Explicar la dinámica preparada con el maestro" },
    { id: "oracion", i: "🙏", n: "Oración", d: "Invitar a compartir motivos y dirigirla" },
    { id: "musica", i: "🎵", n: "Música y canto", d: "Tocar, cantar o apoyar la letra" },
    { id: "materiales", i: "📦", n: "Organización y materiales", d: "Preparar y recoger, con un adulto" },
  ];
  const MOTIVOS = { nino: "Niño equivocado", op: "Oportunidad equivocada", dup: "Registro duplicado" };
  const TIPOS = { subasta: "🏷️ Subasta / tienda", reto: "🏆 Reto por equipos", convivencia: "🎉 Convivencia" };

  /* ---------------- estado ---------------- */
  const blank = () => ({
    v: 1,
    ajustes: { inicio: "2026-11-07", fin: "2027-09-25", saldoInicial: 10, metaGrupo: 100, maxSabado: 5 },
    ninos: [], oport: OPORT0.map((o) => ({ ...o, activo: true })),
    sesiones: {}, rec: [], anul: [], eventos: [],
  });
  let S;
  try { S = JSON.parse(localStorage.getItem(KEY)) || blank(); } catch { S = blank(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { toast("⚠️ No se pudo guardar en este navegador"); } };

  /* ---------------- bloqueo con PIN ----------------
     Cortina frente a miradas indiscretas en el propio dispositivo: el PIN se guarda
     como huella SHA-256 con sal (nunca en claro). No cifra los datos. */
  const PINKEY = "menoresA.pin", AUTOLOCK_MIN = 10, HIDDEN_MIN = 2;
  const pinInfo = () => { try { return JSON.parse(localStorage.getItem(PINKEY)); } catch { return null; } };
  let locked = !!pinInfo(), lastAct = Date.now(), hiddenAt = 0, fails = 0, waitUntil = 0;
  async function hashPin(pin, salt) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salt + ":" + pin));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  async function setPin(pin) {
    const salt = [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, "0")).join("");
    localStorage.setItem(PINKEY, JSON.stringify({ salt, hash: await hashPin(pin, salt) }));
  }
  async function checkPin(pin) { const p = pinInfo(); return !!p && (await hashPin(pin, p.salt)) === p.hash; }
  function lockNow() { if (!pinInfo()) return; locked = true; $("#dlg").open && $("#dlg").close(); render(); }
  ["click", "keydown", "touchstart", "input"].forEach((e) => document.addEventListener(e, () => (lastAct = Date.now()), { passive: true }));
  setInterval(() => { if (!locked && pinInfo() && Date.now() - lastAct > AUTOLOCK_MIN * 6e4) lockNow(); }, 30e3);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) hiddenAt = Date.now();
    else if (hiddenAt && Date.now() - hiddenAt > HIDDEN_MIN * 6e4) lockNow();
  });

  /* ---------------- fechas ---------------- */
  const iso = (d) => d.toISOString().slice(0, 10);
  const D = (s) => new Date(s + "T12:00:00");
  const todayIso = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
  const fmt = (s, o = { weekday: "short", day: "numeric", month: "short" }) => D(s).toLocaleDateString("es-ES", o);
  const quarter = (s) => { const d = D(s); return d.getFullYear() * 4 + Math.floor(d.getMonth() / 3); };
  const qLabel = (q) => `${(q % 4) + 1}.º trimestre ${Math.floor(q / 4)}`;
  function sabados() {
    const out = []; let d = D(S.ajustes.inicio); const end = D(S.ajustes.fin);
    while (d.getDay() !== 6) d.setDate(d.getDate() + 1);
    for (; d <= end; d.setDate(d.getDate() + 7)) out.push(iso(d));
    return out;
  }
  const proximoSabado = () => sabados().find((s) => s >= todayIso()) || sabados().slice(-1)[0];
  const sesionAbierta = (f) => (D(todayIso()) - D(f)) / 864e5 <= 7; // hasta 7 días después se puede añadir

  /* ---------------- derivados ---------------- */
  const activos = () => S.ninos.filter((n) => n.activo).sort((a, b) => a.alias.localeCompare(b.alias, "es"));
  const todos = () => [...S.ninos].sort((a, b) => a.alias.localeCompare(b.alias, "es"));
  const nino = (id) => S.ninos.find((n) => n.id === id);
  const op = (id) => S.oport.find((o) => o.id === id) || { i: "⭐", n: "(oportunidad borrada)", c: "" };
  const anulados = () => new Set(S.anul.map((a) => a.rec));
  const validos = () => { const a = anulados(); return S.rec.filter((r) => !a.has(r.id)); };
  const ses = (f) => (S.sesiones[f] = S.sesiones[f] || { ausentes: [], roles: null, nota: "" });
  const recDe = (nid, f) => validos().filter((r) => r.nino === nid && (!f || r.fecha === f));
  const ganados = (nid, q) => validos().filter((r) => r.nino === nid && (q == null || quarter(r.fecha) === q)).length;
  function gastos(nid) {
    let g = 0;
    for (const e of S.eventos) {
      for (const x of e.resultado || []) if (x.nino === nid) g += +x.pts;
      for (const x of e.aportes || []) if (x.nino === nid) g += +x.pts;
    }
    return g;
  }
  function saldo(nid) {
    const q0 = quarter(S.ajustes.inicio), q1 = quarter(todayIso() < S.ajustes.inicio ? S.ajustes.inicio : todayIso());
    const iniciales = Math.max(1, q1 - q0 + 1) * (+S.ajustes.saldoInicial || 0);
    return iniciales + ganados(nid) - gastos(nid);
  }
  function metaGrupo(q) {
    const ind = validos().filter((r) => quarter(r.fecha) === q).length;
    const eq = S.eventos.filter((e) => quarter(e.fecha) === q).reduce((a, e) => a + (e.ptsEquipo || []).reduce((b, p) => b + +p.pts, 0), 0);
    return { ind, eq, total: ind + eq };
  }
  // roles rotativos: cada sábado avanza una posición; se puede cambiar a mano
  function rolesDe(f) {
    const s = ses(f);
    if (s.roles) return s.roles;
    const lista = activos(), k = Math.max(0, sabados().indexOf(f));
    const r = {};
    lista.forEach((n, i) => { const idx = (i + k) % Math.max(lista.length, ROLES.length); r[n.id] = ROLES[idx] ? ROLES[idx].id : "apoyo"; });
    return r;
  }
  const rol = (id) => ROLES.find((r) => r.id === id) || { i: "⭐", n: "Apoyo", d: "Ayudar donde haga falta" };
  // equidad: niños sin reconocimiento en sus 3 últimos sábados con asistencia
  function sinReconocimiento() {
    const pas = sabados().filter((s) => s <= todayIso()).reverse();
    return activos().filter((n) => {
      const asist = pas.filter((f) => !ses(f).ausentes.includes(n.id) && (S.rec.some((r) => r.fecha === f) || S.sesiones[f])).slice(0, 3);
      return asist.length >= 1 && asist.every((f) => recDe(n.id, f).length === 0);
    });
  }

  /* ---------------- utilidades de interfaz ---------------- */
  let toastT;
  function toast(msg, action) {
    const t = $("#toast"); clearTimeout(toastT);
    t.innerHTML = `<span>${esc(msg)}</span>` + (action ? `<button type="button">${esc(action.label)}</button>` : "");
    t.hidden = false;
    if (action) $("button", t).onclick = () => { action.fn(); t.hidden = true; };
    toastT = setTimeout(() => (t.hidden = true), action ? 10000 : 3500);
  }
  function ask(title, fields, okLabel = "Guardar") {
    return new Promise((res) => {
      const dlg = $("#dlg"), form = $("#dlg-form");
      form.innerHTML = `<h3>${esc(title)}</h3><div class="grid">${fields}</div>
        <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn" value="cancel">Cancelar</button><button class="btn btn--pri" value="ok">${esc(okLabel)}</button></div>`;
      dlg.onclose = () => res(dlg.returnValue === "ok" ? Object.fromEntries(new FormData(form)) : null);
      dlg.showModal();
    });
  }
  const opts = (arr, sel) => arr.map(([v, l]) => `<option value="${esc(v)}" ${v === sel ? "selected" : ""}>${esc(l)}</option>`).join("");
  const sinNinos = () => `<div class="card"><p>Aún no hay niños en la lista.</p><a class="btn btn--pri" href="#ajustes">Añadir niños</a> <button class="btn" data-demo>Cargar datos ficticios</button></div>`;

  /* ================= VISTAS ================= */
  const V = {};

  V.panel = () => {
    const f = proximoSabado(), q = quarter(todayIso()), m = metaGrupo(q), meta = +S.ajustes.metaGrupo || 1;
    const prox = S.eventos.filter((e) => e.fecha >= todayIso()).sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 4);
    const eq = sinReconocimiento();
    const roles = rolesDe(f);
    return `<h1>Panel</h1><p class="muted">${esc(qLabel(q))} · plan hasta ${esc(fmt(S.ajustes.fin, { month: "long", year: "numeric" }))}</p>
      ${S.ninos.length ? "" : sinNinos()}
      <div class="grid g2">
        <div class="card"><h3>Próximo sábado · ${esc(fmt(f, { weekday: "long", day: "numeric", month: "long" }))}</h3>
          <p class="small muted">Roles de esta semana (rotan cada sábado):</p>
          <ul class="small">${activos().map((n) => `<li>${rol(roles[n.id]).i} <b>${esc(n.alias)}</b>: ${esc(rol(roles[n.id]).n)}</li>`).join("") || "<li>Sin niños</li>"}</ul>
          <div class="row"><a class="btn btn--pri" href="#clase">▶ Abrir la clase</a><a class="btn" href="#misiones">📺 Misiones de hoy</a></div></div>
        <div class="card"><h3>Meta del grupo · ${esc(qLabel(q))}</h3>
          <p class="small">Todo lo que suman juntos (reconocimientos + retos por equipos).</p>
          <div class="bar"><span style="width:${Math.min(100, (m.total / meta) * 100)}%"></span></div>
          <p class="small"><b>${m.total}</b> de ${meta} · ${m.ind} reconocimientos y ${m.eq} de retos</p></div>
        <div class="card"><h3>Próximos eventos</h3>
          ${prox.length ? `<ul class="small">${prox.map((e) => `<li><a href="#evento/${e.id}">${esc(e.nombre)}</a> · ${esc(fmt(e.fecha))} <span class="muted">(${Math.round((D(e.fecha) - D(todayIso())) / 864e5)} días)</span></li>`).join("")}</ul>` : `<p class="small muted">No hay eventos próximos.</p>`}
          <a class="btn btn--sm" href="#eventos">Gestionar eventos</a></div>
        <div class="card"><h3>Equidad (solo para adultos)</h3>
          ${eq.length ? `<p class="alert small">Sin reconocimiento en sus últimos sábados: <b>${eq.map((n) => esc(n.alias)).join(", ")}</b>. Busca una oportunidad concreta para reconocerles.</p>` : `<p class="small">✅ Todos han recibido algún reconocimiento recientemente.</p>`}</div>
      </div>`;
  };

  /* ---- Clase: modo rápido ---- */
  let claseFecha = null, claseNino = null;
  V.clase = () => {
    if (!S.ninos.length) return `<h1>Clase</h1>${sinNinos()}`;
    claseFecha = claseFecha || proximoSabado();
    const f = claseFecha, s = ses(f), abierta = sesionAbierta(f), max = +S.ajustes.maxSabado || 5;
    const pend = validos().filter((r) => r.fecha === f && !r.com);
    return `<div class="row between"><h1>Clase</h1>
        <label class="f" style="min-width:200px">Sábado<select id="c-fecha">${opts(sabados().map((x) => [x, fmt(x, { weekday: "short", day: "numeric", month: "short", year: "numeric" })]), f)}</select></label></div>
      ${abierta ? "" : `<p class="alert small">Este sábado está cerrado (pasaron más de 7 días): solo se puede consultar y anular errores en el historial.</p>`}
      <p class="small muted">1) Toca un niño · 2) toca lo que ha hecho · +1. Los puntitos son solo de hoy; no se muestran totales.</p>
      <div class="kids">${todos().filter((n) => n.activo).map((n) => {
        const k = recDe(n.id, f).length, aus = s.ausentes.includes(n.id);
        return `<button type="button" class="kid ${aus ? "kid--off" : ""}" data-kid="${n.id}" aria-pressed="${claseNino === n.id}" ${aus || !abierta ? "disabled" : ""}>
          <b>${esc(n.alias)}</b><span class="small muted">${aus ? "No asistió" : esc(rol(rolesDe(f)[n.id]).n)}</span>
          <div class="dots" aria-label="${k} reconocimientos hoy">${"●".repeat(Math.min(k, max))}${"○".repeat(Math.max(0, max - k))}${k > max ? " +" + (k - max) : ""}</div></button>`;
      }).join("")}</div>
      <div class="card noprint" style="margin-top:12px">
        ${claseNino && abierta ? `<h3>¿Qué ha hecho ${esc(nino(claseNino)?.alias)}?</h3>
          <div class="ops">${S.oport.filter((o) => o.activo).map((o) => `<button type="button" class="op" data-op="${o.id}"><span>${o.i}</span>${esc(o.n)}<small>${esc(o.d)}</small></button>`).join("")}</div>`
        : `<p class="muted small">Elige un niño para registrar un reconocimiento.</p>`}
      </div>
      <details class="card" style="margin-top:12px"><summary><b>Asistencia de hoy</b> <span class="muted small">(marca quién no vino)</span></summary>
        <div class="row" style="margin-top:8px">${activos().map((n) => `<label class="btn btn--sm"><input type="checkbox" data-aus="${n.id}" ${s.ausentes.includes(n.id) ? "checked" : ""}> ${esc(n.alias)} no vino</label>`).join("")}</div></details>
      <div class="card" style="margin-top:12px"><h3>Cierre de la sesión</h3>
        ${pend.length ? `<p class="small">Completa la conducta concreta de cada reconocimiento (ej.: «Ayudó a Marta a encontrar Juan 3»):</p>
          ${pend.map((r) => `<label class="f">${op(r.op).i} ${esc(nino(r.nino)?.alias)} · ${esc(op(r.op).n)}<input type="text" maxlength="140" data-com="${r.id}" placeholder="¿Qué hizo exactamente?"></label>`).join("")}`
        : `<p class="small">✅ Todos los reconocimientos de hoy tienen comentario.</p>`}
        ${sinReconocimiento().length ? `<p class="alert small" style="margin-top:10px">Para el próximo sábado: busca una oportunidad para <b>${sinReconocimiento().map((n) => esc(n.alias)).join(", ")}</b>.</p>` : ""}
        <label class="f" style="margin-top:10px">Nota breve de la sesión (qué funcionó, qué ajustar)<textarea id="c-nota" rows="2">${esc(s.nota)}</textarea></label></div>`;
  };

  /* ---- Misiones de hoy (para proyectar) ---- */
  let misFecha = null;
  V.misiones = () => {
    if (!S.ninos.length) return `<h1>Misiones de hoy</h1>${sinNinos()}`;
    misFecha = misFecha || proximoSabado();
    const f = misFecha, r = rolesDe(f), s = ses(f);
    return `<div class="row between noprint"><h1>Misiones de hoy</h1>
        <div class="row"><select id="m-fecha" style="width:auto">${opts(sabados().map((x) => [x, fmt(x)]), f)}</select>
        <button class="btn" id="m-edit">✏️ Cambiar roles</button><button class="btn" id="m-full">⛶ Pantalla completa</button></div></div>
      <div class="projector" id="proj">
        <p style="font-size:22px;font-weight:800;text-align:center;margin:8px 0 16px">⭐ ${esc(fmt(f, { weekday: "long", day: "numeric", month: "long" }))} · ¡Cada uno tiene una misión!</p>
        <div class="mis">${activos().filter((n) => !s.ausentes.includes(n.id)).map((n) => `<div class="card"><div class="ico">${rol(r[n.id]).i}</div><div class="nm">${esc(n.alias)}</div><div class="rl">${esc(rol(r[n.id]).n)}</div><p class="small muted">${esc(rol(r[n.id]).d)}</p></div>`).join("")}</div>
        <p style="text-align:center;margin-top:16px;font-weight:700">🧹 Todos: al terminar dejamos el aula como estaba.</p>
        <details class="card" style="margin-top:14px"><summary><b>¿Cómo puedo participar hoy?</b></summary>
          <div class="stamps" style="margin-top:10px">${S.oport.filter((o) => o.activo).map((o) => `<div class="stamp"><div class="ico">${o.i}</div><b>${esc(o.n)}</b><div class="small muted">${esc(o.d)}</div></div>`).join("")}</div></details>
      </div>`;
  };

  /* ---- Eventos ---- */
  V.eventos = () => {
    const ev = [...S.eventos].sort((a, b) => a.fecha.localeCompare(b.fecha));
    return `<div class="row between"><h1>Eventos</h1><button class="btn btn--pri" id="e-new">＋ Nuevo evento</button></div>
      <p class="muted small">Subastas o tiendas simbólicas, retos por equipos y convivencias. Puedes crear todos los que quieras, cada uno con su fecha.</p>
      ${ev.length ? `<div class="tablewrap card"><table><thead><tr><th>Fecha</th><th>Evento</th><th>Tipo</th><th>Estado</th></tr></thead><tbody>
        ${ev.map((e) => `<tr><td>${esc(fmt(e.fecha, { day: "numeric", month: "short", year: "numeric" }))}</td><td><a href="#evento/${e.id}"><b>${esc(e.nombre)}</b></a></td><td>${esc(TIPOS[e.tipo])}${e.tipo === "subasta" ? ` · ${e.modo === "sobre" ? "sobre cerrado" : "precio fijo"}` : ""}</td>
          <td>${e.estado === "resuelto" ? `<span class="pill pill--ok">Cerrado</span>` : e.fecha < todayIso() ? `<span class="pill pill--warn">Pendiente de cerrar</span>` : `<span class="pill">Próximo</span>`}</td></tr>`).join("")}</tbody></table></div>`
      : `<div class="card"><p>Aún no hay eventos. Ejemplo: «Subasta de Navidad» el último sábado del trimestre.</p></div>`}`;
  };

  V.evento = (id) => {
    const e = S.eventos.find((x) => x.id === id);
    if (!e) return `<p>Evento no encontrado. <a href="#eventos">Volver</a></p>`;
    let body = "";
    if (e.tipo === "subasta") body = vistaSubasta(e);
    if (e.tipo === "reto") body = vistaReto(e);
    if (e.tipo === "convivencia") { const q = quarter(e.fecha), m = metaGrupo(q), meta = +S.ajustes.metaGrupo || 1;
      body = `<div class="card"><h3>Meta del grupo para desbloquearla</h3><div class="bar"><span style="width:${Math.min(100, (m.total / meta) * 100)}%"></span></div>
        <p class="small"><b>${m.total}</b> de ${meta} ${m.total >= meta ? "· 🎉 ¡Conseguida!" : ""}</p><p class="small muted">Recuerda comprobar alergias y necesidades alimentarias antes de un desayuno.</p></div>`; }
    return `<p class="noprint"><a href="#eventos">← Eventos</a></p>
      <div class="row between"><div><h1>${esc(e.nombre)}</h1><p class="muted">${esc(TIPOS[e.tipo])} · ${esc(fmt(e.fecha, { weekday: "long", day: "numeric", month: "long", year: "numeric" }))}</p></div>
      <div class="row noprint"><button class="btn btn--sm" data-ev-edit="${e.id}">✏️ Editar</button><button class="btn btn--sm" data-ev-del="${e.id}">🗑 Borrar</button></div></div>
      ${e.notas ? `<p>${esc(e.notas)}</p>` : ""}${body}`;
  };

  function vistaSubasta(e) {
    const lotes = e.lotes || [], res = e.resultado || [], cerrado = e.estado === "resuelto";
    const lotesInd = lotes.filter((l) => !l.colectivo), lotesCol = lotes.filter((l) => l.colectivo);
    const usados = (lid) => res.filter((r) => r.lote === lid).length;
    const aportado = (lid) => (e.aportes || []).filter((a) => a.lote === lid).reduce((s, a) => s + +a.pts, 0);
    let html = `<div class="card"><div class="row between"><h3>Lotes (privilegios simbólicos, sin dinero)</h3>${cerrado ? "" : `<button class="btn btn--sm" data-lote-new="${e.id}">＋ Lote</button>`}</div>
      ${lotes.length ? `<div class="tablewrap"><table><thead><tr><th>Lote</th><th>${e.modo === "sobre" ? "Puja mínima" : "Precio"}</th><th>Unidades</th><th>Tipo</th><th></th></tr></thead><tbody>
      ${lotes.map((l) => `<tr><td><b>${esc(l.nombre)}</b></td><td>${l.precio}</td><td>${l.colectivo ? "—" : `${l.uds - usados(l.id)} de ${l.uds} libres`}</td><td>${l.colectivo ? `Colectivo · ${aportado(l.id)}/${l.precio} ${aportado(l.id) >= l.precio ? "🎉" : ""}` : "Individual"}</td>
        <td>${cerrado ? "" : `<button class="btn btn--sm btn--ghost" data-lote-del="${e.id}:${l.id}" aria-label="Borrar lote">🗑</button>`}</td></tr>`).join("")}</tbody></table></div>`
      : `<p class="small muted">Ideas: elegir la dinámica, proponer el nombre de una misión, ser anfitrión, escoger una canción entre opciones.</p>`}</div>`;
    html += `<div class="card" style="margin-top:12px"><h3>Saldos (solo para adultos · no proyectar)</h3><p class="small muted">Saldo = ${S.ajustes.saldoInicial} por trimestre + puntos ganados − lo gastado. Gastar no reduce los «puntos ganados».</p>
      <div class="row">${activos().map((n) => `<span class="pill">${esc(n.alias)}: ${saldo(n.id)}</span>`).join("")}</div></div>`;
    if (lotesInd.length && e.modo === "sobre") {
      html += `<div class="card" style="margin-top:12px"><h3>Pujas en sobre cerrado</h3>
        <p class="small muted">Cada niño escribe su puja en un papel; aquí se anota. Gana la puja más alta de cada lote (empates: sorteo). Solo pagan los ganadores.</p>
        ${cerrado ? "" : `<div class="row"><button class="btn btn--sm" data-puja-new="${e.id}">＋ Anotar puja</button></div>`}
        ${(e.pujas || []).length ? `<div class="tablewrap"><table><thead><tr><th>Niño</th><th>Lote</th><th>Puja</th><th></th></tr></thead><tbody>
          ${[...e.pujas].sort((a, b) => (nino(a.nino)?.alias || "").localeCompare(nino(b.nino)?.alias || "", "es")).map((p, i) => `<tr><td>${esc(nino(p.nino)?.alias)}</td><td>${esc(lotes.find((l) => l.id === p.lote)?.nombre)}</td><td>${p.pts}</td>
          <td>${cerrado ? "" : `<button class="btn btn--sm btn--ghost" data-puja-del="${e.id}:${p.id}" aria-label="Borrar puja">🗑</button>`}</td></tr>`).join("")}</tbody></table></div>` : ""}
        <div class="row" style="margin-top:10px">${cerrado ? `<button class="btn" data-reabrir="${e.id}">↩ Reabrir subasta</button>` : `<button class="btn btn--pri" data-resolver="${e.id}">✅ Resolver subasta</button>`}</div></div>`;
    }
    if (lotesInd.length && e.modo === "fijo") {
      html += `<div class="card" style="margin-top:12px"><h3>Canjes a precio fijo</h3>
        ${cerrado ? "" : `<button class="btn btn--sm" data-canje-new="${e.id}">＋ Anotar canje</button>`}
        <div class="row" style="margin-top:10px">${cerrado ? `<button class="btn" data-reabrir="${e.id}">↩ Reabrir</button>` : `<button class="btn btn--pri" data-cerrar="${e.id}">✅ Cerrar tienda</button>`}</div></div>`;
    }
    if (lotesCol.length) {
      html += `<div class="card" style="margin-top:12px"><h3>Aportaciones a lotes colectivos</h3><p class="small muted">Cada niño puede aportar voluntariamente puntos de su saldo a un objetivo común.</p>
        ${cerrado ? "" : `<button class="btn btn--sm" data-aporte-new="${e.id}">＋ Anotar aportación</button>`}
        ${(e.aportes || []).length ? `<ul class="small">${e.aportes.map((a) => `<li>${esc(nino(a.nino)?.alias)} aporta ${a.pts} a «${esc(lotes.find((l) => l.id === a.lote)?.nombre)}» ${cerrado ? "" : `<button class="btn btn--sm btn--ghost" data-aporte-del="${e.id}:${a.id}" aria-label="Borrar">🗑</button>`}</li>`).join("")}</ul>` : ""}</div>`;
    }
    if (res.length) {
      html += `<div class="card" style="margin-top:12px"><h3>Resultado</h3><ul>${lotes.filter((l) => !l.colectivo).map((l) => {
        const g = res.filter((r) => r.lote === l.id);
        return `<li><b>${esc(l.nombre)}</b>: ${g.length ? g.map((r) => `${esc(nino(r.nino)?.alias)} (${r.pts})${cerrado ? "" : ` <button class="btn btn--sm btn--ghost" data-res-del="${e.id}:${r.id}" aria-label="Quitar">🗑</button>`}`).join(", ") : "sin adjudicar"}</li>`;
      }).join("")}</ul><p class="small muted">Comunícalo a cada niño en privado (por ejemplo, con una tarjeta), sin proyectar saldos.</p></div>`;
    }
    return html;
  }

  function vistaReto(e) {
    const eqs = e.equipos || [], pts = e.ptsEquipo || [];
    const tot = (i) => pts.filter((p) => p.eq === i).reduce((s, p) => s + +p.pts, 0);
    return `<div class="card"><div class="row between"><h3>Equipos</h3><button class="btn btn--sm" data-equipos="${e.id}">🔀 Formar equipos al azar</button></div>
      ${eqs.length ? `<div class="grid g2">${eqs.map((g, i) => `<div class="card"><h3>Equipo ${i + 1} · ${tot(i)} pts</h3><p class="small">${g.map((id) => esc(nino(id)?.alias)).join(", ")}</p>
        <button class="btn btn--sm" data-eqpts="${e.id}:${i}">＋ Puntos al equipo</button></div>`).join("")}</div>`
      : `<p class="small muted">Forma equipos nuevos en cada reto para que no compitan siempre los mismos.</p>`}
      <p class="small muted" style="margin-top:8px">Los puntos de equipo suman a la meta del grupo; no se reparten a cada niño.</p></div>
      ${pts.length ? `<div class="card" style="margin-top:12px"><h3>Registro</h3><ul class="small">${pts.map((p) => `<li>Equipo ${p.eq + 1}: +${p.pts} · ${esc(p.motivo)}</li>`).join("")}</ul></div>` : ""}`;
  }

  /* ---- Historial ---- */
  let hTab = "sabado", hFecha = null;
  V.historial = () => {
    hFecha = hFecha || (sabados().filter((s) => s <= todayIso()).slice(-1)[0] || proximoSabado());
    const tabs = [["sabado", "Por sábado"], ["ninos", "Por niño"], ["eventos", "Por evento"], ["auditoria", "Auditoría"]];
    let body = "";
    const an = anulados();
    if (hTab === "sabado") {
      const recs = S.rec.filter((r) => r.fecha === hFecha);
      body = `<label class="f" style="max-width:260px">Sábado<select id="h-fecha">${opts(sabados().map((x) => [x, fmt(x, { day: "numeric", month: "short", year: "numeric" })]), hFecha)}</select></label>
        <div class="tablewrap card" style="margin-top:10px"><table><thead><tr><th>Niño</th><th>Reconocimientos</th></tr></thead><tbody>
        ${todos().map((n) => { const rs = recs.filter((r) => r.nino === n.id); const aus = ses(hFecha).ausentes.includes(n.id);
          return `<tr><td><b>${esc(n.alias)}</b></td><td>${aus ? `<span class="muted">No asistió</span>` : rs.length ? rs.map((r) => recLinea(r, an)).join("<br>") : `<span class="muted">—</span>`}</td></tr>`; }).join("")}
        </tbody></table></div>${ses(hFecha).nota ? `<p class="small"><b>Nota:</b> ${esc(ses(hFecha).nota)}</p>` : ""}`;
    }
    if (hTab === "ninos") body = `<p class="small muted">Orden alfabético. Abre el pasaporte privado de cada niño para verlo o imprimirlo.</p><div class="grid g4">${todos().map((n) => `<a class="card" href="#nino/${n.id}" style="text-decoration:none"><b>${esc(n.alias)}</b><div class="small muted">${n.activo ? "Ver pasaporte" : "Inactivo"}</div></a>`).join("")}</div>`;
    if (hTab === "eventos") body = `<ul>${[...S.eventos].sort((a, b) => a.fecha.localeCompare(b.fecha)).map((e) => `<li><a href="#evento/${e.id}">${esc(e.nombre)}</a> · ${esc(fmt(e.fecha))} · ${esc(TIPOS[e.tipo])}</li>`).join("") || "<li class='muted'>Sin eventos</li>"}</ul>`;
    if (hTab === "auditoria") {
      const items = [...S.rec.map((r) => ({ t: r.t, html: `${recLinea(r, an)} <span class="muted">· ${esc(nino(r.nino)?.alias)} · ${esc(fmt(r.fecha))}</span>` })),
        ...S.anul.map((a) => { const r = S.rec.find((x) => x.id === a.rec); return { t: a.t, html: `🚫 Anulado por error (${esc(MOTIVOS[a.motivo])}): ${esc(op(r?.op).n)} de ${esc(nino(r?.nino)?.alias)} · ${esc(fmt(r?.fecha || todayIso()))}` }; })]
        .sort((a, b) => b.t - a.t);
      body = `<p class="small muted">Todo queda registrado: los reconocimientos nunca se borran; un error se anula con su motivo.</p><ul class="small timeline">${items.map((i) => `<li>${new Date(i.t).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })} · ${i.html}</li>`).join("") || "<li class='muted'>Sin registros</li>"}</ul>`;
    }
    return `<h1>Historial</h1><div class="row noprint">${tabs.map(([k, l]) => `<button class="btn btn--sm ${hTab === k ? "btn--pri" : ""}" data-htab="${k}">${l}</button>`).join("")}</div><div style="margin-top:12px">${body}</div>`;
  };
  function recLinea(r, an) {
    const o = op(r.op), x = an.has(r.id);
    return `<span style="${x ? "text-decoration:line-through;opacity:.6" : ""}">${o.i} ${esc(o.n)}${r.com ? ` — «${esc(r.com)}»` : ""}</span>${x ? ` <span class="pill pill--bad">anulado</span>` : ` <button class="btn btn--sm btn--ghost noprint" data-anular="${r.id}" title="Anular un error de registro">Anular error</button>`}`;
  }

  /* ---- Pasaporte privado ---- */
  let pQ = null;
  V.nino = (id) => {
    const n = nino(id); if (!n) return `<p>No encontrado. <a href="#historial">Volver</a></p>`;
    const qs = [...new Set(sabados().map(quarter))]; pQ = pQ && qs.includes(pQ) ? pQ : quarter(todayIso() < S.ajustes.inicio ? S.ajustes.inicio : todayIso());
    const rs = validos().filter((r) => r.nino === id && quarter(r.fecha) === pQ).sort((a, b) => a.fecha.localeCompare(b.fecha));
    const porOp = (oid) => rs.filter((r) => r.op === oid).length;
    const porCrit = CRIT.map((c) => [c, rs.filter((r) => op(r.op).c === c).length]);
    const fuerte = porCrit.slice().sort((a, b) => b[1] - a[1])[0];
    const lotes = S.eventos.flatMap((e) => (e.resultado || []).filter((r) => r.nino === id).map((r) => ({ e, l: (e.lotes || []).find((l) => l.id === r.lote) })));
    return `<p class="noprint"><a href="#historial">← Historial</a></p>
      <div class="row between"><div><h1>Pasaporte de ${esc(n.alias)}</h1><p class="muted">${esc(qLabel(pQ))}</p></div>
        <div class="row noprint"><select id="p-q" style="width:auto">${opts(qs.map((q) => [String(q), qLabel(q)]), String(pQ))}</select><button class="btn" onclick="print()">🖨 Imprimir</button></div></div>
      <div class="grid g2">
        <div class="card"><h3>⭐ Puntos ganados este trimestre: ${rs.length}</h3><p class="small muted">En total desde el inicio: ${ganados(id)}. Los puntos ganados nunca bajan.</p>
          ${fuerte && fuerte[1] ? `<p>💪 Tu fuerte este trimestre: <b>${esc(fuerte[0])}</b></p>` : ""}</div>
        <div class="card"><h3>🏷️ Saldo para la subasta: ${saldo(id)}</h3><p class="small muted">Incluye ${S.ajustes.saldoInicial} de partida cada trimestre.</p>
          ${lotes.length ? `<p class="small">Conseguido: ${lotes.map((x) => `${esc(x.l?.nombre)} (${esc(x.e.nombre)})`).join(", ")}</p>` : ""}</div>
      </div>
      <h2>Mis sellos</h2><div class="stamps">${S.oport.map((o) => { const k = porOp(o.id); return `<div class="stamp ${k ? "stamp--on" : ""}"><div class="ico">${o.i}</div><b>${esc(o.n)}</b><div class="small">${k ? "✔ ".repeat(Math.min(k, 6)) : `<span class="muted">${esc(o.d)}</span>`}</div></div>`; }).join("")}</div>
      <h2>Lo que hice</h2>${rs.length ? `<ul class="timeline">${rs.map((r) => `<li><b>${esc(fmt(r.fecha))}</b> · ${op(r.op).i} ${esc(op(r.op).n)}${r.com ? ` — ${esc(r.com)}` : ""}</li>`).join("")}</ul>` : `<p class="muted">Todavía no hay reconocimientos este trimestre.</p>`}`;
  };

  /* ---- Encuesta anónima para los niños ----
     Se responde en clase, por turnos, en el dispositivo del adulto. Sin nombres:
     cada respuesta se guarda suelta y solo se muestran totales. */
  const CARAS = [["4", "¡Muy bien!", "😀"], ["3", "Bien", "🙂"], ["2", "Regular", "😐"], ["1", "No muy bien", "🙁"]];
  const ENC_Q = [
    { id: "siento", t: "¿Cómo te sientes en la clase de Menores A?", tipo: "una", ops: CARAS },
    { id: "escuchado", t: "Cuando hablas, ¿sientes que te escuchan?", tipo: "una", ops: [["3", "Siempre", "👂"], ["2", "A veces", "🤔"], ["1", "Casi nunca", "😶"]] },
    { id: "gusta", t: "¿Qué partes de la clase te gustan más?", sub: "Puedes elegir varias", tipo: "varias",
      ops: [["historia", "Historia bíblica", "📖"], ["misionero", "Historia misionera", "🌍"], ["musica", "Música y canto", "🎵"], ["juegos", "Juegos con movimiento", "🏃"],
        ["equipos", "Retos por equipos", "🏆"], ["manual", "Manualidades", "✂️"], ["oracion", "Oración", "🙏"], ["versiculo", "Aprender el versículo", "🧠"]] },
    { id: "mision", t: "¿Qué misión te gustaría hacer?", sub: "Puedes elegir varias", tipo: "varias", ops: ROLES.map((r) => [r.id, r.n, r.i]) },
    { id: "cuesta", t: "¿Hay algo que te cueste un poco?", sub: "Puedes elegir varias. ¡No pasa nada!", tipo: "varias",
      ops: [["leer", "Leer en voz alta", "🗣️"], ["hablar", "Hablar delante de todos", "😳"], ["buscar", "Encontrar los textos en la Biblia", "🔎"], ["memorizar", "Memorizar el versículo", "🧠"], ["nada", "Nada, todo bien", "👍"]] },
    { id: "ayuda", t: "¿Qué te ayudaría a estar más a gusto?", sub: "Puedes elegir varias", tipo: "varias",
      ops: [["equipo", "Trabajar en equipo", "🤝"], ["juegos", "Más juegos", "🎲"], ["opinion", "Que me pregunten mi opinión", "💬"], ["companero", "Tener un compañero que me ayude", "🧑‍🤝‍🧑"],
        ["preguntas", "Más tiempo para preguntas", "❓"], ["tranquilo", "Un rato más tranquilo", "😌"]] },
    { id: "puntos", t: "Los sellos, los puntos y la subasta… ¿te animan a participar?", tipo: "una", ops: [["4", "¡Mucho!", "🤩"], ["3", "Un poco", "🙂"], ["2", "Me da igual", "😐"], ["1", "No me gustan", "🙁"]] },
    { id: "idea", t: "¿Qué cambiarías o añadirías a la clase?", sub: "Opcional. No escribas nombres.", tipo: "texto" },
  ];
  const enc = () => (S.encuesta = S.encuesta || { rondas: [] });
  const rondaActual = () => { const e = enc(); if (!e.rondas.length) e.rondas.push({ id: uid(), nombre: "Encuesta " + fmt(todayIso(), { month: "long", year: "numeric" }), fecha: todayIso(), resp: [] }); return e.rondas[e.rondas.length - 1]; };
  let kiosk = null; // { i: pregunta actual, a: respuestas en curso } o null

  V.encuesta = () => {
    const e = enc(), r = rondaActual(), n = r.resp.length;
    const res = ENC_Q.map((q) => {
      if (q.tipo === "texto") { const xs = r.resp.map((x) => x.a[q.id]).filter(Boolean);
        return `<div class="card"><h3>${esc(q.t)}</h3>${xs.length ? `<ul class="small">${xs.map((x) => `<li>«${esc(x)}»</li>`).join("")}</ul>` : `<p class="small muted">Sin respuestas.</p>`}</div>`; }
      const cnt = Object.fromEntries(q.ops.map(([v]) => [v, 0])), quien = r.resp.filter((x) => x.a[q.id] != null && (q.tipo === "una" || x.a[q.id].length)).length;
      r.resp.forEach((x) => [].concat(x.a[q.id] ?? []).forEach((v) => { if (v in cnt) cnt[v]++; }));
      return `<div class="card"><h3>${esc(q.t)}</h3><p class="small muted">${quien} de ${n} respondieron${q.tipo === "varias" ? " (podían elegir varias)" : ""}</p>
        ${q.ops.map(([v, l, i]) => `<div class="encbar"><span>${i} ${esc(l)}</span><div class="bar"><span style="width:${quien ? (cnt[v] / quien) * 100 : 0}%"></span></div><b>${cnt[v]}</b></div>`).join("")}</div>`;
    }).join("");
    return `<div class="row between"><h1>Encuesta de los niños</h1><button class="btn btn--pri" id="enc-start">▶ Empezar en este dispositivo</button></div>
      <p class="muted small">Anónima: los niños responden por turnos en tu móvil o tableta, sin poner su nombre. Aquí solo ves los totales. Dura unos 3 minutos por niño.</p>
      <div class="card"><div class="row between"><div><h3>${esc(r.nombre)}</h3><p class="small muted">Desde ${esc(fmt(r.fecha, { day: "numeric", month: "long", year: "numeric" }))} · <b>${n}</b> respuesta${n === 1 ? "" : "s"}</p></div>
        <div class="row"><button class="btn btn--sm" id="enc-csv" ${n ? "" : "disabled"}>⬇ CSV</button><button class="btn btn--sm" id="enc-new">＋ Nueva ronda</button><button class="btn btn--sm" id="enc-del" ${n ? "" : "disabled"}>🗑 Vaciar</button></div></div>
        ${e.rondas.length > 1 ? `<p class="small muted">Rondas anteriores: ${e.rondas.slice(0, -1).map((x) => `${esc(x.nombre)} (${x.resp.length})`).join(" · ")}</p>` : ""}</div>
      ${n ? `<p class="small muted" style="margin-top:10px">Con tan pocos niños, no intentes adivinar quién respondió qué: úsalo para ver tendencias y hablar con el grupo.</p><div class="grid g2" style="margin-top:6px">${res}</div>`
        : `<div class="card" style="margin-top:12px"><p>Aún no hay respuestas. Pulsa <b>Empezar</b> y pasa el dispositivo a cada niño.</p></div>`}`;
  };

  function vistaKiosk() {
    const k = kiosk;
    if (k.i >= ENC_Q.length) return `<div class="kiosk"><div class="kiosk__end"><div style="font-size:72px">🎉</div><h1>¡Gracias!</h1><p>Tu opinión nos ayuda a que la clase sea mejor para todos.</p>
      <p class="muted">Pasa el dispositivo al siguiente compañero.</p><button class="btn btn--pri kiosk__big" id="k-next-kid">Siguiente compañero ▶</button></div>
      <button class="btn btn--ghost btn--sm kiosk__exit" id="k-exit">Salir (adulto)</button></div>`;
    const q = ENC_Q[k.i], a = k.a[q.id];
    const sel = (v) => (q.tipo === "varias" ? (a || []).includes(v) : a === v);
    return `<div class="kiosk">
      <div class="kiosk__top"><span class="small muted">Pregunta ${k.i + 1} de ${ENC_Q.length}</span><div class="bar"><span style="width:${(k.i / ENC_Q.length) * 100}%"></span></div></div>
      <h1 class="kiosk__q">${esc(q.t)}</h1>${q.sub ? `<p class="muted">${esc(q.sub)}</p>` : ""}
      ${q.tipo === "texto" ? `<textarea id="k-txt" rows="3" maxlength="140" placeholder="Escribe aquí…">${esc(a || "")}</textarea>`
        : `<div class="kiosk__ops ${q.ops.length <= 4 ? "kiosk__ops--big" : ""}">${q.ops.map(([v, l, i]) => `<button type="button" class="kop" data-kv="${esc(v)}" aria-pressed="${sel(v)}"><span>${i}</span>${esc(l)}</button>`).join("")}</div>`}
      <div class="row between kiosk__nav"><button class="btn" id="k-back" ${k.i ? "" : "disabled"}>◀ Atrás</button>
        <button class="btn btn--pri kiosk__big" id="k-fwd">${k.i === ENC_Q.length - 1 ? "Terminar ✓" : q.tipo === "una" ? "Saltar ▶" : "Siguiente ▶"}</button></div>
      <button class="btn btn--ghost btn--sm kiosk__exit" id="k-exit">Salir (adulto)</button></div>`;
  }
  function kioskGuardar() {
    const a = kiosk.a, algo = Object.values(a).some((v) => (Array.isArray(v) ? v.length : v));
    // sin hora y en posición aleatoria: así no se puede deducir quién respondió por el orden
    if (algo) { const r = rondaActual(); r.resp.splice(Math.floor(Math.random() * (r.resp.length + 1)), 0, { a }); save(); }
  }

  /* ---- Pantalla de bloqueo ---- */
  V.lock = () => `<div class="card lock"><div class="lock__ico">🔒</div><h1>Menores A</h1>
      <p class="muted">Introduce el PIN para ver los datos de la clase.</p>
      <form id="lock-form" class="grid"><input type="password" name="pin" inputmode="numeric" autocomplete="current-password" pattern="[0-9]*"
        maxlength="8" placeholder="PIN" aria-label="PIN" required autofocus class="lock__pin">
        <button class="btn btn--pri">Desbloquear</button></form>
      <p class="small muted" id="lock-msg" role="status" aria-live="polite"></p>
      <button type="button" class="btn btn--ghost btn--sm" id="lock-forgot">¿Olvidaste el PIN?</button></div>`;

  /* ---- Ajustes ---- */
  V.ajustes = () => `<h1>Ajustes</h1>
    <div class="grid g2">
      <div class="card"><h3>🔒 Bloqueo con PIN</h3>
        ${pinInfo() ? `<p class="small">Activado. Se bloquea al pulsar 🔒 arriba, tras ${AUTOLOCK_MIN} min sin usarla o al volver después de ${HIDDEN_MIN} min en otra app.</p>
          <div class="row"><button class="btn" id="pin-change">Cambiar PIN</button><button class="btn" id="pin-off">Quitar PIN</button><button class="btn" id="pin-lock">🔒 Bloquear ahora</button></div>`
        : `<p class="small">Protege la app en este dispositivo frente a miradas indiscretas. Es una cortina, no un cifrado: si pierdes el PIN, la única salida es borrar los datos (exporta copias).</p>
          <form id="pin-set" class="grid"><label class="f">Nuevo PIN (4 a 8 cifras)<input type="password" name="a" inputmode="numeric" pattern="[0-9]{4,8}" maxlength="8" required autocomplete="new-password"></label>
          <label class="f">Repite el PIN<input type="password" name="b" inputmode="numeric" pattern="[0-9]{4,8}" maxlength="8" required autocomplete="new-password"></label>
          <button class="btn btn--pri">Activar PIN</button></form>`}</div>
      <div class="card"><h3>Niños</h3><p class="small muted">Solo nombre o alias. Nada de apellidos, salud ni datos familiares.</p>
        <ul class="small">${todos().map((n) => `<li class="row between"><span>${esc(n.alias)} ${n.activo ? "" : `<span class="pill">inactivo</span>`}</span>
          <span><button class="btn btn--sm" data-n-ren="${n.id}">Renombrar</button> <button class="btn btn--sm" data-n-act="${n.id}">${n.activo ? "Desactivar" : "Activar"}</button></span></li>`).join("") || "<li class='muted'>Sin niños</li>"}</ul>
        <form id="n-add" class="row"><input type="text" name="alias" placeholder="Nombre o alias" maxlength="30" required style="flex:1"><button class="btn btn--pri">Añadir</button></form></div>
      <div class="card"><h3>Parámetros</h3><form id="aj" class="grid">
        <label class="f">Primer sábado del plan<input type="date" name="inicio" value="${S.ajustes.inicio}"></label>
        <label class="f">Último sábado del plan<input type="date" name="fin" value="${S.ajustes.fin}"></label>
        <label class="f">Saldo inicial por trimestre (subasta)<input type="number" min="0" name="saldoInicial" value="${S.ajustes.saldoInicial}"></label>
        <label class="f">Meta del grupo por trimestre<input type="number" min="1" name="metaGrupo" value="${S.ajustes.metaGrupo}"></label>
        <label class="f">Reconocimientos orientativos por niño y sábado<input type="number" min="1" name="maxSabado" value="${S.ajustes.maxSabado}"></label>
        <button class="btn btn--pri">Guardar</button></form></div>
      <div class="card"><h3>Oportunidades (menú)</h3><p class="small muted">Lo que cada niño sabe que puede hacer. Cada una vale 1 punto.</p>
        <ul class="small">${S.oport.map((o) => `<li class="row between"><span>${o.i} ${esc(o.n)} <span class="muted">· ${esc(o.c)}</span> ${o.activo ? "" : `<span class="pill">oculta</span>`}</span>
          <span><button class="btn btn--sm" data-o-edit="${o.id}">Editar</button> <button class="btn btn--sm" data-o-act="${o.id}">${o.activo ? "Ocultar" : "Mostrar"}</button></span></li>`).join("")}</ul>
        <button class="btn btn--sm" data-o-new>＋ Oportunidad</button></div>
      <div class="card"><h3>Datos y privacidad</h3>
        <p class="small">Se guardan <b>solo en este navegador</b>. Si borras el historial del navegador o cambias de dispositivo, se pierden: exporta una copia cada semana.</p>
        <div class="row"><button class="btn" id="exp">⬇ Exportar copia</button><label class="btn">⬆ Importar copia<input type="file" id="imp" accept="application/json" hidden></label></div>
        <div class="row" style="margin-top:10px"><button class="btn" data-demo>Cargar datos ficticios</button><button class="btn" id="wipe">🗑 Borrar todo</button></div></div>
    </div>`;

  /* ================= ACCIONES ================= */
  function demo() {
    if (S.ninos.length && !confirm("Esto sustituye los datos actuales por datos ficticios. ¿Continuar?")) return;
    S = blank();
    ["Alba", "Bruno", "Carla", "Daniel", "Elena", "Félix", "Gala", "Hugo"].forEach((a) => S.ninos.push({ id: uid(), alias: a, activo: true }));
    const f = sabados()[0], ids = S.ninos.map((n) => n.id);
    [[0, "biblia", "Encontró Juan 3:16 y lo leyó en voz alta"], [1, "ayuda", "Ayudó a Gala a encontrar el pasaje"], [2, "versiculo", "Dijo el versículo casi sin ayuda"],
      [4, "orden", "Recogió los materiales sin que se lo pidieran"], [5, "particip", ""], [6, "musica", "Marcó el ritmo con la pandereta"]].forEach(([i, o, c], k) =>
      S.rec.push({ id: uid(), fecha: f, nino: ids[i], op: o, com: c, t: Date.now() - (10 - k) * 6e4 }));
    S.eventos.push({ id: uid(), nombre: "Subasta de Navidad", fecha: "2026-12-26", tipo: "subasta", modo: "sobre", estado: "abierto", notas: "Subasta simbólica de fin de trimestre.",
      lotes: [{ id: uid(), nombre: "Elegir la dinámica del próximo sábado", precio: 3, uds: 1 }, { id: uid(), nombre: "Proponer el nombre de una misión", precio: 2, uds: 2 },
        { id: uid(), nombre: "Escoger una canción entre opciones", precio: 2, uds: 2 }, { id: uid(), nombre: "Elegir la gran actividad de enero (colectivo)", precio: 30, uds: 1, colectivo: true }],
      pujas: [], resultado: [], aportes: [] });
    S.eventos.push({ id: uid(), nombre: "Reto bíblico por equipos", fecha: "2026-12-05", tipo: "reto", estado: "abierto", equipos: [], ptsEquipo: [] });
    S.eventos.push({ id: uid(), nombre: "Desayuno de convivencia", fecha: "2026-12-19", tipo: "convivencia", estado: "abierto", notas: "Se desbloquea al alcanzar la meta del grupo." });
    save(); toast("Datos ficticios cargados"); render();
  }

  async function nuevoEvento(e) {
    const r = await ask(e ? "Editar evento" : "Nuevo evento", `
      <label class="f">Nombre<input type="text" name="nombre" required maxlength="60" value="${esc(e?.nombre || "")}"></label>
      <label class="f">Fecha<input type="date" name="fecha" required value="${e?.fecha || proximoSabado()}"></label>
      <label class="f">Tipo<select name="tipo">${opts(Object.entries(TIPOS), e?.tipo || "subasta")}</select></label>
      <label class="f">Si es subasta: formato<select name="modo">${opts([["sobre", "Sobre cerrado (nadie ve el saldo de los demás)"], ["fijo", "Tienda de precio fijo"]], e?.modo || "sobre")}</select></label>
      <label class="f">Notas<input type="text" name="notas" maxlength="140" value="${esc(e?.notas || "")}"></label>`);
    if (!r || !r.nombre || !r.fecha) return;
    if (e) Object.assign(e, r);
    else { const n = { id: uid(), estado: "abierto", lotes: [], pujas: [], resultado: [], aportes: [], equipos: [], ptsEquipo: [], ...r }; S.eventos.push(n); location.hash = "#evento/" + n.id; }
    save(); render();
  }
  const ninoSel = () => `<label class="f">Niño<select name="nino">${opts(activos().map((n) => [n.id, `${n.alias} (saldo ${saldo(n.id)})`]))}</select></label>`;
  const loteSel = (e, col) => `<label class="f">Lote<select name="lote">${opts((e.lotes || []).filter((l) => !!l.colectivo === col).map((l) => [l.id, `${l.nombre} (${l.precio})`]))}</select></label>`;

  function resolver(e) {
    const res = [];
    for (const l of (e.lotes || []).filter((x) => !x.colectivo)) {
      const bids = (e.pujas || []).filter((p) => p.lote === l.id && +p.pts >= +l.precio).map((p) => ({ ...p, r: Math.random() }));
      bids.sort((a, b) => b.pts - a.pts || a.r - b.r);
      bids.slice(0, +l.uds || 1).forEach((b) => res.push({ id: uid(), nino: b.nino, lote: l.id, pts: +b.pts }));
    }
    e.resultado = res; e.estado = "resuelto";
  }

  document.addEventListener("click", async (ev) => {
    const t = ev.target.closest("button, [data-kid]"); if (!t) return;
    const d = t.dataset;
    if ("demo" in d) return demo();
    if (d.kid) { claseNino = claseNino === d.kid ? null : d.kid; return render(); }
    if (d.op && claseNino) {
      const f = claseFecha, max = +S.ajustes.maxSabado || 5;
      const r = { id: uid(), fecha: f, nino: claseNino, op: d.op, com: "", t: Date.now() };
      S.rec.push(r); save();
      const k = recDe(claseNino, f).length, n = nino(claseNino).alias;
      claseNino = null; render();
      toast(`+1 ${op(d.op).i} ${n}${k > max ? ` · ya lleva ${k} hoy (orientativo: ${max})` : ""}`, { label: "↶ Deshacer", fn: () => { S.rec = S.rec.filter((x) => x.id !== r.id); save(); render(); } });
      return;
    }
    if (d.anular) {
      const r = await ask("Anular un error de registro", `<p class="small">Solo para corregir errores (no es un castigo). El registro original queda en la auditoría.</p>
        <label class="f">Motivo<select name="motivo">${opts(Object.entries(MOTIVOS))}</select></label>`, "Anular");
      if (r) { S.anul.push({ id: uid(), rec: d.anular, motivo: r.motivo, t: Date.now() }); save(); render(); toast("Registro anulado (queda en la auditoría)"); }
      return;
    }
    if (d.htab) { hTab = d.htab; return render(); }
    if (t.id === "e-new") return nuevoEvento();
    if (d.evEdit) return nuevoEvento(S.eventos.find((x) => x.id === d.evEdit));
    if (d.evDel) { if (confirm("¿Borrar este evento y sus pujas o canjes? Los saldos se recalcularán.")) { S.eventos = S.eventos.filter((x) => x.id !== d.evDel); save(); location.hash = "#eventos"; } return; }
    const ev2 = (k) => S.eventos.find((x) => x.id === k);
    if (d.loteNew) { const e = ev2(d.loteNew);
      const r = await ask("Nuevo lote", `<label class="f">Nombre<input type="text" name="nombre" required maxlength="60"></label>
        <label class="f">${e.modo === "sobre" ? "Puja mínima" : "Precio"} (puntos)<input type="number" name="precio" min="0" value="2"></label>
        <label class="f">Unidades<input type="number" name="uds" min="1" value="1"></label>
        <label class="f"><span><input type="checkbox" name="colectivo"> Lote colectivo (todos aportan para conseguirlo)</span></label>`);
      if (r && r.nombre) { e.lotes.push({ id: uid(), nombre: r.nombre, precio: +r.precio || 0, uds: +r.uds || 1, colectivo: !!r.colectivo }); save(); render(); } return; }
    if (d.loteDel) { const [eid, lid] = d.loteDel.split(":"), e = ev2(eid); e.lotes = e.lotes.filter((l) => l.id !== lid); e.pujas = (e.pujas || []).filter((p) => p.lote !== lid); e.aportes = (e.aportes || []).filter((p) => p.lote !== lid); save(); render(); return; }
    if (d.pujaNew) { const e = ev2(d.pujaNew);
      const r = await ask("Anotar puja (sobre cerrado)", ninoSel() + loteSel(e, false) + `<label class="f">Puja (puntos)<input type="number" name="pts" min="0" required></label>`);
      if (!r) return;
      const ya = (e.pujas || []).filter((p) => p.nino === r.nino).reduce((s, p) => s + +p.pts, 0);
      if (ya + +r.pts > saldo(r.nino)) return toast(`No alcanza: sus pujas sumarían ${ya + +r.pts} y su saldo es ${saldo(r.nino)}`);
      e.pujas.push({ id: uid(), nino: r.nino, lote: r.lote, pts: +r.pts }); save(); render(); return; }
    if (d.pujaDel) { const [eid, pid] = d.pujaDel.split(":"), e = ev2(eid); e.pujas = e.pujas.filter((p) => p.id !== pid); save(); render(); return; }
    if (d.resolver) { const e = ev2(d.resolver); if (!(e.pujas || []).length) return toast("Aún no hay pujas"); resolver(e); save(); render(); toast("Subasta resuelta"); return; }
    if (d.reabrir) { const e = ev2(d.reabrir); if (e.modo === "sobre") e.resultado = []; e.estado = "abierto"; save(); render(); return; }
    if (d.cerrar) { ev2(d.cerrar).estado = "resuelto"; save(); render(); return; }
    if (d.canjeNew) { const e = ev2(d.canjeNew);
      const r = await ask("Anotar canje", ninoSel() + loteSel(e, false)); if (!r) return;
      const l = e.lotes.find((x) => x.id === r.lote);
      if ((e.resultado || []).filter((x) => x.lote === l.id).length >= l.uds) return toast("No quedan unidades de ese lote");
      if (saldo(r.nino) < l.precio) return toast(`Saldo insuficiente (${saldo(r.nino)} de ${l.precio})`);
      e.resultado.push({ id: uid(), nino: r.nino, lote: l.id, pts: +l.precio }); save(); render(); return; }
    if (d.resDel) { const [eid, rid] = d.resDel.split(":"), e = ev2(eid); e.resultado = e.resultado.filter((x) => x.id !== rid); save(); render(); return; }
    if (d.aporteNew) { const e = ev2(d.aporteNew);
      const r = await ask("Aportación voluntaria", ninoSel() + loteSel(e, true) + `<label class="f">Puntos<input type="number" name="pts" min="1" required></label>`); if (!r) return;
      if (+r.pts > saldo(r.nino)) return toast(`Saldo insuficiente (${saldo(r.nino)})`);
      e.aportes.push({ id: uid(), nino: r.nino, lote: r.lote, pts: +r.pts }); save(); render(); return; }
    if (d.aporteDel) { const [eid, aid] = d.aporteDel.split(":"), e = ev2(eid); e.aportes = e.aportes.filter((x) => x.id !== aid); save(); render(); return; }
    if (d.equipos) { const e = ev2(d.equipos), ids = activos().map((n) => n.id).sort(() => Math.random() - 0.5), k = Math.ceil(ids.length / 2);
      e.equipos = [ids.slice(0, k), ids.slice(k)]; save(); render(); return; }
    if (d.eqpts) { const [eid, i] = d.eqpts.split(":"), e = ev2(eid);
      const r = await ask(`Puntos para el equipo ${+i + 1}`, `<label class="f">Puntos<input type="number" name="pts" min="1" value="1" required></label><label class="f">Motivo<input type="text" name="motivo" maxlength="80" placeholder="Ej.: respondieron juntos la pregunta 3"></label>`);
      if (r) { e.ptsEquipo.push({ eq: +i, pts: +r.pts, motivo: r.motivo || "", t: Date.now() }); save(); render(); } return; }
    if (t.id === "m-full") { $("#proj").requestFullscreen?.(); return; }
    if (t.id === "m-edit") { const f = misFecha, cur = rolesDe(f);
      const r = await ask("Cambiar roles de este sábado", activos().map((n) => `<label class="f">${esc(n.alias)}<select name="${n.id}">${opts([...ROLES.map((x) => [x.id, x.i + " " + x.n]), ["apoyo", "⭐ Apoyo"]], cur[n.id])}</select></label>`).join(""));
      if (r) { const vals = Object.values(r).filter((v) => v !== "apoyo"); if (new Set(vals).size !== vals.length) toast("⚠️ Hay un rol repetido; revísalo");
        ses(f).roles = r; save(); render(); } return; }
    if (d.nRen) { const n = nino(d.nRen); const r = await ask("Renombrar", `<label class="f">Nombre o alias<input type="text" name="alias" maxlength="30" value="${esc(n.alias)}" required></label>`); if (r?.alias) { n.alias = r.alias.trim(); save(); render(); } return; }
    if (d.nAct) { const n = nino(d.nAct); n.activo = !n.activo; save(); render(); return; }
    if (d.oAct) { const o = op(d.oAct); o.activo = !o.activo; save(); render(); return; }
    if (d.oEdit || "oNew" in d) { const o = d.oEdit ? op(d.oEdit) : null;
      const r = await ask(o ? "Editar oportunidad" : "Nueva oportunidad", `<label class="f">Icono (emoji)<input type="text" name="i" maxlength="4" value="${esc(o?.i || "⭐")}"></label>
        <label class="f">Nombre<input type="text" name="n" maxlength="30" required value="${esc(o?.n || "")}"></label>
        <label class="f">Qué hay que hacer<input type="text" name="d" maxlength="60" value="${esc(o?.d || "")}"></label>
        <label class="f">Criterio<select name="c">${opts(CRIT.map((c) => [c, c]), o?.c || CRIT[0])}</select></label>`);
      if (r?.n) { if (o) Object.assign(o, r); else S.oport.push({ id: uid(), activo: true, ...r }); save(); render(); } return; }
    if (t.id === "enc-start") { kiosk = { i: 0, a: {} }; render(); window.scrollTo(0, 0); return; }
    if (t.id === "k-next-kid") { kiosk = { i: 0, a: {} }; render(); return; }
    if (t.id === "k-back" && kiosk) { kiosk.i = Math.max(0, kiosk.i - 1); render(); return; }
    if (t.id === "k-fwd" && kiosk) {
      const q = ENC_Q[kiosk.i]; if (q?.tipo === "texto") kiosk.a[q.id] = ($("#k-txt")?.value || "").trim().slice(0, 140);
      kiosk.i++; if (kiosk.i >= ENC_Q.length) kioskGuardar(); render(); return;
    }
    if (d.kv != null && kiosk) {
      const q = ENC_Q[kiosk.i];
      if (q.tipo === "varias") { const cur = new Set(kiosk.a[q.id] || []); cur.has(d.kv) ? cur.delete(d.kv) : cur.add(d.kv); kiosk.a[q.id] = [...cur]; render(); }
      else { kiosk.a[q.id] = d.kv; render(); setTimeout(() => { if (kiosk && ENC_Q[kiosk.i] === q) { kiosk.i++; if (kiosk.i >= ENC_Q.length) kioskGuardar(); render(); } }, 350); }
      return;
    }
    if (t.id === "k-exit" && kiosk) {
      const fin = kiosk.i >= ENC_Q.length;
      if (pinInfo()) {
        const r = await ask("Salir de la encuesta", `<p class="small">Solo para adultos.${fin ? "" : " Las respuestas a medias de este niño no se guardarán."}</p><label class="f">PIN<input type="password" name="pin" inputmode="numeric" maxlength="8" required></label>`, "Salir");
        if (!r) return; if (!(await checkPin(r.pin))) return toast("PIN incorrecto");
      } else if (!confirm(fin ? "¿Salir de la encuesta?" : "¿Salir? Las respuestas a medias de este niño no se guardarán.")) return;
      kiosk = null; location.hash = "#encuesta"; render(); return;
    }
    if (t.id === "enc-new") { const r = await ask("Nueva ronda de encuesta", `<label class="f">Nombre<input type="text" name="nombre" maxlength="60" required value="Encuesta ${esc(fmt(todayIso(), { month: "long", year: "numeric" }))}"></label>
      <p class="small muted">Las respuestas anteriores se conservan como otra ronda.</p>`, "Crear");
      if (r?.nombre) { enc().rondas.push({ id: uid(), nombre: r.nombre, fecha: todayIso(), resp: [] }); save(); render(); } return; }
    if (t.id === "enc-del") { if (confirm("¿Vaciar las respuestas de esta ronda?")) { rondaActual().resp = []; save(); render(); } return; }
    if (t.id === "enc-csv") {
      const r = rondaActual(), cols = ENC_Q.map((q) => q.id);
      const lab = (q, v) => (q.ops ? (q.ops.find((o) => o[0] === v) || [v, v])[1] : v);
      const rows = [ENC_Q.map((q) => q.t)].concat(r.resp.map((x) => ENC_Q.map((q) => [].concat(x.a[q.id] ?? []).map((v) => lab(q, v)).join(" | "))));
      const csv = "\ufeff" + rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = `encuesta-menoresA-${todayIso()}.csv`; a.click(); URL.revokeObjectURL(a.href); return;
    }
    if (t.id === "exp") { const b = new Blob([JSON.stringify(S, null, 1)], { type: "application/json" }); const a = document.createElement("a");
      a.href = URL.createObjectURL(b); a.download = `menoresA-copia-${todayIso()}.json`; a.click(); URL.revokeObjectURL(a.href); return; }
    if (t.id === "wipe") { if (confirm("¿Borrar TODOS los datos de este navegador (y el PIN)? Exporta antes una copia si la necesitas.")) { localStorage.removeItem(KEY); localStorage.removeItem(PINKEY); S = blank(); locked = false; render(); toast("Datos borrados"); } return; }
    if (t.id === "lock-btn" || t.id === "pin-lock") return lockNow();
    if (t.id === "pin-off") { if (confirm("¿Quitar el PIN? La app quedará abierta en este dispositivo.")) { localStorage.removeItem(PINKEY); render(); toast("PIN quitado"); } return; }
    if (t.id === "pin-change") {
      const r = await ask("Cambiar PIN", `<label class="f">PIN actual<input type="password" name="old" inputmode="numeric" maxlength="8" required></label>
        <label class="f">Nuevo PIN (4 a 8 cifras)<input type="password" name="a" inputmode="numeric" pattern="[0-9]{4,8}" maxlength="8" required></label>
        <label class="f">Repite el nuevo PIN<input type="password" name="b" inputmode="numeric" pattern="[0-9]{4,8}" maxlength="8" required></label>`);
      if (!r) return;
      if (!(await checkPin(r.old))) return toast("El PIN actual no es correcto");
      if (!/^\d{4,8}$/.test(r.a) || r.a !== r.b) return toast("El nuevo PIN debe tener 4 a 8 cifras y coincidir");
      await setPin(r.a); toast("PIN cambiado"); return;
    }
    if (t.id === "lock-forgot") {
      if (confirm("Sin el PIN no se puede entrar. La única opción es BORRAR todos los datos de este dispositivo (luego puedes importar una copia). ¿Continuar?")
        && confirm("¿Seguro? Se borrarán niños, puntos y eventos de este navegador.")) {
        localStorage.removeItem(KEY); localStorage.removeItem(PINKEY); S = blank(); locked = false; render(); toast("Datos y PIN borrados");
      }
      return;
    }
  });

  document.addEventListener("change", (ev) => {
    const t = ev.target;
    if (t.id === "c-fecha") { claseFecha = t.value; claseNino = null; return render(); }
    if (t.id === "m-fecha") { misFecha = t.value; return render(); }
    if (t.id === "h-fecha") { hFecha = t.value; return render(); }
    if (t.id === "p-q") { pQ = +t.value; return render(); }
    if (t.dataset.aus) { const s = ses(claseFecha); s.ausentes = t.checked ? [...new Set([...s.ausentes, t.dataset.aus])] : s.ausentes.filter((x) => x !== t.dataset.aus); save(); return render(); }
    if (t.dataset.com) { const r = S.rec.find((x) => x.id === t.dataset.com); if (r) { r.com = t.value.trim().slice(0, 140); save(); toast("Comentario guardado"); render(); } return; }
    if (t.id === "c-nota") { ses(claseFecha).nota = t.value.slice(0, 500); save(); return; }
    if (t.id === "imp" && t.files[0]) { const fr = new FileReader(); fr.onload = () => { try { const j = JSON.parse(fr.result); if (!j.ninos || !j.rec) throw 0;
      if (confirm("¿Sustituir los datos actuales por los de la copia?")) { S = j; save(); render(); toast("Copia importada"); } } catch { toast("El archivo no es una copia válida"); } }; fr.readAsText(t.files[0]); }
  });
  document.addEventListener("submit", async (ev) => {
    const f = ev.target;
    if (f.id === "lock-form") {
      ev.preventDefault();
      const msg = $("#lock-msg");
      if (Date.now() < waitUntil) { msg.textContent = `Demasiados intentos. Espera ${Math.ceil((waitUntil - Date.now()) / 1000)} s.`; return; }
      if (await checkPin(f.pin.value)) { locked = false; fails = 0; lastAct = Date.now(); render(); return; }
      fails++; f.pin.value = "";
      if (fails >= 5) { waitUntil = Date.now() + 30e3; fails = 0; msg.textContent = "PIN incorrecto. Espera 30 s antes de volver a intentarlo."; }
      else msg.textContent = `PIN incorrecto (${fails} de 5).`;
      return;
    }
    if (f.id === "pin-set") {
      ev.preventDefault();
      if (!/^\d{4,8}$/.test(f.a.value) || f.a.value !== f.b.value) return toast("El PIN debe tener 4 a 8 cifras y coincidir");
      await setPin(f.a.value); render(); toast("🔒 PIN activado"); return;
    }
    if (f.id === "n-add") { ev.preventDefault(); const a = f.alias.value.trim(); if (a) { S.ninos.push({ id: uid(), alias: a, activo: true }); save(); render(); } }
    if (f.id === "aj") { ev.preventDefault(); const r = Object.fromEntries(new FormData(f)); if (r.fin < r.inicio) return toast("El último sábado debe ser posterior al primero");
      Object.assign(S.ajustes, { inicio: r.inicio, fin: r.fin, saldoInicial: +r.saldoInicial, metaGrupo: +r.metaGrupo, maxSabado: +r.maxSabado }); save(); toast("Guardado"); render(); }
  });

  /* ---------------- enrutado ---------------- */
  function render() {
    const lb = $("#lock-btn"); if (lb) lb.hidden = !pinInfo() || locked;
    $(".nav").hidden = locked;
    if (locked) { app.innerHTML = V.lock(); $(".lock__pin")?.focus(); return; }
    document.body.classList.toggle("is-kiosk", !!kiosk);
    if (kiosk) { if (lb) lb.hidden = true; $(".nav").hidden = true; app.innerHTML = vistaKiosk(); return; }
    const [r, arg] = (location.hash.slice(1) || "panel").split("/");
    const view = V[r] || V.panel;
    app.innerHTML = view(arg);
    const sec = r === "evento" ? "eventos" : r === "nino" ? "historial" : r;
    $$(".nav a").forEach((a) => (a.dataset.r === sec ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
  }
  window.addEventListener("hashchange", () => { claseNino = null; if (kiosk) return; render(); window.scrollTo(0, 0); });
  render();
})();
