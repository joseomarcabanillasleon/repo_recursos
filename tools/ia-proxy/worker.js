/* =====================================================================
   IA de Recursos Adventistas · intermediario gratuito (Cloudflare Worker)
   - Guarda la clave de Google Gemini en secreto (variable GEMINI_KEY)
   - Solo acepta peticiones desde los dominios permitidos
   - Limita el uso por persona (IP) y el tamaño de cada petición
   - Si Gemini no está disponible o se agota su cupo gratuito, usa Workers AI
     de Cloudflare (si se ha añadido el enlace «AI»)
   Respuesta: flujo SSE con líneas  data: {"t":"texto"}  …  data: {"done":true,"via":"gemini"}
   ===================================================================== */

const DEFAULTS = {
  ALLOWED_ORIGINS: "https://recursosadventistas.es,https://www.recursosadventistas.es,http://localhost:8765",
  GEMINI_MODELS: "gemini-3-flash,gemini-2.5-flash,gemini-2.5-flash-lite",
  CF_MODEL: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  PER_HOUR: "20",            // peticiones por persona y hora
  MAX_INPUT: "40000",        // caracteres máximos del encargo
};

const hits = new Map(); // límite aproximado por instancia (complementa al enlace de Rate Limiting si existe)

export default {
  async fetch(req, env, ctx) {
    const cfg = { ...DEFAULTS, ...env };
    const origin = req.headers.get("Origin") || "";
    const allowed = cfg.ALLOWED_ORIGINS.split(",").map((s) => s.trim());
    const okOrigin = allowed.includes(origin);
    const cors = {
      "Access-Control-Allow-Origin": okOrigin ? origin : allowed[0],
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
    };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    const url = new URL(req.url);

    if (req.method === "GET" && url.pathname.endsWith("/health")) {
      return json({ ok: true, gemini: !!env.GEMINI_KEY, workersAI: !!env.AI }, 200, cors);
    }
    if (req.method !== "POST" || !url.pathname.endsWith("/chat")) return json({ error: "Ruta no válida" }, 404, cors);
    if (!okOrigin) return json({ error: "Origen no permitido" }, 403, cors);

    // límite por persona
    const ip = req.headers.get("CF-Connecting-IP") || "anon";
    if (env.LIMITER) {
      const { success } = await env.LIMITER.limit({ key: ip });
      if (!success) return json({ error: "Has hecho muchas consultas seguidas. Espera un poco y vuelve a intentarlo." }, 429, cors);
    }
    const now = Date.now(), per = +cfg.PER_HOUR;
    const list = (hits.get(ip) || []).filter((t) => now - t < 3600e3);
    if (list.length >= per) return json({ error: `Has llegado al límite de ${per} consultas por hora. Vuelve más tarde.` }, 429, cors);
    list.push(now); hits.set(ip, list);
    if (hits.size > 5000) hits.clear();

    let body;
    try { body = await req.json(); } catch { return json({ error: "Petición no válida" }, 400, cors); }
    const system = String(body.system || "").slice(0, 6000);
    const prompt = String(body.prompt || "");
    const maxTokens = Math.min(8192, Math.max(256, +body.maxTokens || 4096));
    if (!prompt) return json({ error: "Falta el texto de la consulta" }, 400, cors);
    if (prompt.length > +cfg.MAX_INPUT) return json({ error: "La consulta es demasiado larga. Elige un pasaje más corto." }, 413, cors);

    const { readable, writable } = new TransformStream();
    const w = writable.getWriter(), enc = new TextEncoder();
    const send = (o) => w.write(enc.encode(`data: ${JSON.stringify(o)}\n\n`));

    ctx.waitUntil((async () => {
      let errors = [];
      try {
        if (env.GEMINI_KEY) {
          for (const model of cfg.GEMINI_MODELS.split(",").map((s) => s.trim()).filter(Boolean)) {
            const r = await geminiStream(env.GEMINI_KEY, model, system, prompt, maxTokens, send);
            if (r.ok) { await send({ done: true, via: "gemini", model }); return; }
            errors.push(`${model}: ${r.error}`);
            if (r.started) { await send({ done: true, via: "gemini", model, partial: true }); return; }
          }
        }
        if (env.AI) {
          const r = await workersAIStream(env.AI, cfg.CF_MODEL, system, prompt, maxTokens, send);
          if (r.ok) { await send({ done: true, via: "workers-ai", model: cfg.CF_MODEL }); return; }
          errors.push(`workers-ai: ${r.error}`);
        }
        await send({ error: errors.some((e) => e.includes("429")) ? "Se ha agotado el uso gratuito de la IA por hoy. Prueba mañana o usa «copiar el encargo»." : "La IA no está disponible ahora mismo.", detail: errors.join(" | ").slice(0, 400) });
      } catch (e) {
        await send({ error: "Error inesperado en el servidor de IA.", detail: String(e).slice(0, 300) });
      } finally {
        await w.close();
      }
    })());

    return new Response(readable, { headers: { ...cors, "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-store" } });
  },
};

async function geminiStream(key, model, system, prompt, maxTokens, send) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: system ? { parts: [{ text: system }] } : undefined,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: maxTokens },
    }),
  });
  if (!r.ok) return { ok: false, error: `${r.status} ${(await r.text()).slice(0, 160)}` };
  const reader = r.body.getReader(), dec = new TextDecoder();
  let buf = "", started = false;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (!line.startsWith("data:")) continue;
      try {
        const d = JSON.parse(line.slice(5));
        const t = d.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
        if (t) { started = true; await send({ t }); }
      } catch { /* línea incompleta */ }
    }
  }
  return started ? { ok: true } : { ok: false, error: "respuesta vacía", started };
}

async function workersAIStream(ai, model, system, prompt, maxTokens, send) {
  try {
    const stream = await ai.run(model, {
      messages: [{ role: "system", content: system }, { role: "user", content: prompt }],
      max_tokens: Math.min(maxTokens, 4096), stream: true,
    });
    const reader = stream.getReader(), dec = new TextDecoder();
    let buf = "", started = false;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
        if (!line.startsWith("data:") || line.includes("[DONE]")) continue;
        try { const d = JSON.parse(line.slice(5)); if (d.response) { started = true; await send({ t: d.response }); } } catch { /* nada */ }
      }
    }
    return started ? { ok: true } : { ok: false, error: "respuesta vacía" };
  } catch (e) { return { ok: false, error: String(e).slice(0, 160) }; }
}

function json(o, status, headers) {
  return new Response(JSON.stringify(o), { status, headers: { ...headers, "Content-Type": "application/json; charset=utf-8" } });
}
