# IA gratuita del sitio (Cloudflare Worker + Google Gemini)

Este pequeño servidor permite que **cualquier visitante** use la IA en `/sermones/` y `/biblia/` sin configurar nada.

- **Coste:** 0 €. Cloudflare Workers ofrece 100 000 peticiones al día gratis, y Gemini tiene un plan gratuito.
- **Si alguien abusa:** como mucho se agota el cupo gratuito del día. **No se cobra nada mientras no actives la facturación** en Google ni en Cloudflare.
- **La clave no está en la web:** queda guardada como secreto dentro de Cloudflare.

## Paso 1 · Clave de Gemini (2 min)

1. Entra en <https://aistudio.google.com/apikey> con la cuenta de Google que quieras usar para el sitio.
2. Pulsa **Create API key** y cópiala.
3. **No actives la facturación** en ese proyecto. Así nunca habrá cargos.

## Paso 2 · Crear el Worker en Cloudflare (5 min, sin instalar nada)

1. Crea una cuenta gratuita en <https://dash.cloudflare.com/sign-up>.
2. Menú **Compute (Workers)** → **Workers & Pages** → **Create** → **Create Worker** (plantilla «Hello World»).
3. Ponle de nombre `ia-recursos` y pulsa **Deploy**.
4. Pulsa **Edit code**, borra todo, pega el contenido de [`worker.js`](worker.js) y pulsa **Deploy**.
5. Ve a **Settings → Variables and Secrets → Add**:
   - Tipo **Secret**, nombre `GEMINI_KEY`, valor: la clave del paso 1. Guarda.
6. (Recomendado) En **Settings → Bindings → Add → Workers AI**, nombre `AI`. Es la IA de respaldo si se agota el cupo de Gemini.
7. Copia la dirección del Worker, del tipo `https://ia-recursos.TU-USUARIO.workers.dev`.

## Paso 3 · Conectar la web

En [`assets/js/ia-config.js`](../../assets/js/ia-config.js), escribe la dirección:

```js
window.IA_PROXY = "https://ia-recursos.TU-USUARIO.workers.dev";
```

Haz commit y push. Comprueba que funciona abriendo `https://ia-recursos.TU-USUARIO.workers.dev/health`: debe responder `{"ok":true,"gemini":true,...}`.

## Ajustes opcionales (Settings → Variables, tipo texto)

| Variable | Por defecto | Para qué |
|---|---|---|
| `ALLOWED_ORIGINS` | tu dominio y `localhost:8765` | Webs que pueden usar el Worker |
| `GEMINI_MODELS` | `gemini-2.5-flash,gemini-2.5-flash-lite` | Modelos en orden de preferencia (si uno falla, se prueba el siguiente) |
| `CF_MODEL` | `@cf/meta/llama-3.3-70b-instruct-fp8-fast` | Modelo de respaldo de Workers AI |
| `PER_HOUR` | `20` | Consultas por persona y hora |

Si Google cambia los nombres de los modelos, basta con actualizar `GEMINI_MODELS`, sin tocar el código.

## Privacidad

En el plan gratuito, Google puede usar el contenido de las consultas para mejorar sus productos. La web avisa a los usuarios de que no incluyan datos personales.
