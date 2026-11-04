# Recursos Adventistas

Web personal de recursos para descargar y compartir: Escuela Sabática, estudio bíblico, familias y educadores.
Dominio: **https://recursosadventistas.es**

Es una web estática: HTML + CSS + JavaScript, sin servidor ni base de datos. Se publica gratis con **GitHub Pages**.

## Estructura

```
index.html            → la página
assets/css/styles.css → diseño (colores en :root, modo claro/oscuro)
assets/js/config.js   → textos generales, redes, licencia, captura de correo
assets/js/app.js      → buscador, filtros, tarjetas, modal (no hace falta tocarlo)
data/recursos.js      → ⭐ EL CATÁLOGO: aquí añades tus recursos
archivos/             → los PDF/ZIP que se descargan
escuela-sabatica/     → apartado Escuela Sabática (página propia, lecciones, misioneros y juegos)
  trimestre.js        → ⭐ datos semana a semana del trimestre
gym/                  → guía interactiva «Gimnasia para todos» (ejercicios, sesión guiada, cartel)
  gym.js              → ejercicios, filtros, sesión guiada, cartel
  figura.js           → personaje articulado (esqueleto, cinemática inversa, cuerpo y animación)
  movimientos.js      → fotogramas clave de cada ejercicio
  figura3d.js         → persona en 3D con luz y sombras (Three.js); se gira arrastrando. Si no hay WebGL, se usan las ilustraciones SVG
CNAME                 → dominio propio para GitHub Pages
assets/img/           → portadas de los recursos (opcional)
```

## Añadir un recurso (3 pasos)

1. Sube el archivo a `archivos/` (p. ej. `archivos/salmos-para-ninos.pdf`).
   Si pesa más de ~25 MB, súbelo a Google Drive/Dropbox y usa el enlace público.
2. (Opcional) Sube una portada 16:9 a `assets/img/` (p. ej. 1200×675 px, `.webp` o `.jpg`).
   Si no pones portada, se genera una automática con el color e icono de la categoría.
3. En `data/recursos.js`, copia un bloque `{ ... }` al principio de la lista y rellénalo.

Haz commit y push: GitHub Pages actualiza la web en ~1 minuto.

## Publicar con GitHub Pages y el dominio recursosadventistas.es

1. **GitHub → Settings → Pages**: *Deploy from a branch* → `main` / `(root)` → **Save**.
   En *Custom domain* debe aparecer `recursosadventistas.es` (lo lee del archivo `CNAME`).
2. **Hostinger → Dominios → recursosadventistas.es → DNS / Nameservers**:
   - Borra los registros `A` y `CNAME` de aparcamiento que haya para `@` y `www`.
   - Añade 4 registros `A` para `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
   - Añade un `CNAME` para `www` → `joseomarcabanillasleon.github.io`.
3. Espera a que propague (de minutos a unas horas) y en GitHub Pages marca **Enforce HTTPS**.

## Nuevo trimestre de Escuela Sabática

1. Sube el PDF de lecciones a `escuela-sabatica/lecciones/` y el de misión a `escuela-sabatica/misioneros/`.
2. Sube los juegos nuevos a `escuela-sabatica/juegos/`.
3. Edita `escuela-sabatica/trimestre.js`: título, fechas, descargas y la lista de semanas.
4. Actualiza las fichas correspondientes en `data/recursos.js`.

## Gimnasia para todos (`/gym/`)

Guía interactiva con los **42 ejercicios de «La Reforma Pro-Salud», Tomo I**. Textos redactados de nuevo, sin afirmaciones de salud sin respaldo.
- Textos, niveles y precauciones: `gym/gym.js` (lista `EJ`). Movimientos 3D: `gym/movimientos.js` (`e1`…`e42`, `act`, `calma`).
- Filtros por zona, posición (de pie, sentado, suelo) y nivel (suave, medio, exigente); sesiones prediseñadas por nivel.
- Sesión guiada a pantalla completa: activación (complemento del ej. 6), los ejercicios elegidos y vuelta a la calma (ej. 1 lento).
- «Mi semana» (se guarda solo en el navegador) y cartel de invitación imprimible / WhatsApp.

## Biblia de estudio (`/biblia/`)

Lector con versiones en paralelo, interlineal hebreo/griego, comparación de un versículo, búsqueda y ficha de cada palabra (Strong, glosas en español, análisis gramatical, frecuencia y concordancia).
- App: `biblia/index.html`, `biblia/biblia.js` (lector) y `biblia/morfo.js` (análisis en español y transliteración).
- Datos estáticos en `biblia/data/`, generados con `python3 tools/biblia/build.py RUTA_FUENTES` (ver la cabecera del script para las fuentes y el formato).
- Versiones: RV1909, BES, BLM, KJV y WEB (dominio público), PDPT (CC BY 4.0) y VBL (CC BY-SA 4.0). Originales: WLC con morfología OSHB (CC BY 4.0), Textus Receptus (DP) y Nestle 1904 con morfología CC0. Strong: Open Scriptures (CC BY-SA).
- Para añadir una versión: descarga su USFM de eBible.org, añádela a `VERSIONS` en el script y vuelve a generarlo.

## Sermones con IA (`/sermones/`)

Generador de sermones, historias para niños, devocionales, estudios y cultos familiares.
- IA gratuita con la clave de Google Gemini de cada usuario (se guarda solo en su navegador y se envía solo a Google); sin clave, copia el encargo y abre ChatGPT, Claude o Gemini.
- El encargo incluye el texto bíblico real (datos de `/biblia/`) y palabras clave del hebreo o griego con datos del léxico.
- Verificador de citas: comprueba que cada referencia existe y que las citas textuales coinciden con alguna versión.
- Código: `sermones/sermones.js` (prompts en `AUD`, `FORMAT` y `systemPrompt`).

## IA gratuita del sitio (`tools/ia-proxy/`)

Un Cloudflare Worker guarda en secreto la clave de Gemini y da IA gratis a todos los visitantes de `/sermones/` y `/biblia/`.
Pasos de despliegue en [`tools/ia-proxy/README.md`](tools/ia-proxy/README.md); después se escribe su dirección en `assets/js/ia-config.js`.
Código compartido en el navegador: `assets/js/ia.js` (consulta, Markdown y verificador de citas).
Orden de uso: la clave propia del usuario (si la ha puesto) → la IA del sitio → copiar el encargo a ChatGPT, Claude o Gemini.

## Vida sana (`/vida-sana/`)

Centro con ocho áreas. Disponibles: **Movimiento** (`/gym/`), **Alimentación** (`/alimentacion/`), **Descanso** (`/descanso/`) **Agua, aire y sol** (`/agua-aire-sol/`, tres áreas en una guía) y **Equilibrio** (`/equilibrio/`).
Alimentación: plato interactivo, constructor de platos, mi semana (raciones AESAN 2022), nutrientes clave,
calculadora de etiquetas (límites OMS) y reto de 7 días. Para añadir un área: crea su carpeta y cambia su
tarjeta en `vida-sana/index.html` de «Próximamente» a enlace.

## Estadísticas de visitas y descargas (GoatCounter)

Anónimas y sin cookies: no hace falta aviso de cookies. Gratis para sitios no comerciales.

1. Crea una cuenta en https://www.goatcounter.com/signup y elige un código (p. ej. `recursosadventistas`).
2. En `assets/js/stats.js`, escribe ese código en `const GOATCOUNTER = "";` y haz commit y push.
3. Mira los datos en `https://TU-CODIGO.goatcounter.com`.

Qué verás:
- **Visitas** por página: portada, Escuela Sabática y cada juego (`/escuela-sabatica/juegos/leccion-6/`).
- **Eventos**: `descarga/<archivo>`, `abrir/<recurso>` y `compartir/<recurso>`.

Con el código vacío no se envía nada. Tampoco se cuentan las visitas desde `localhost`.

## Funcionalidades

- Buscador sin tildes (busca en título, descripción, categoría y etiquetas).
- Filtros por categoría, formato y gratis/premium. Los filtros quedan en la URL (`?cat=biblia`), así puedes compartir una vista filtrada.
- Enlace directo a un recurso: botón 🔗 en cada tarjeta (`?r=id-del-recurso`).
- Etiquetas automáticas: *Destacado*, *Nuevo* (últimos 30 días), *Gratis*/*Premium*.
- Recursos premium: el botón abre un enlace externo (Gumroad, Hotmart, Ko-fi, etc.).
- Modo claro/oscuro, diseño adaptado a móvil, accesible con teclado.
- Captura de correo opcional antes de descargar (ver abajo).

## Captura de correo (opcional)

Por defecto está **desactivada**: los recursos se descargan directamente.
Para activarla, en `assets/js/config.js`:

```js
captura: { activo: true, endpoint: "https://formspree.io/f/XXXXXXX", recordar: true }
```

El `endpoint` puede ser Formspree, Getform, Basin o cualquier servicio que acepte un POST de formulario.
Se envían los campos `email`, `consent` y `recurso`.
Si activas la captura en España/UE, añade una página de política de privacidad (RGPD).

## Probar en local

Abre `index.html` con doble clic, o mejor:

```bash
python3 -m http.server 8000   # y abre http://localhost:8000
```
