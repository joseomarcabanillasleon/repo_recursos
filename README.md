# Recursos · Jose Omar

Biblioteca web de recursos para descargar y compartir (materiales bíblicos, niños y familia, IA, datos y huerto).
Es una web estática: HTML + CSS + JavaScript, sin servidor ni base de datos. Se publica gratis con **GitHub Pages**.

## Estructura

```
index.html            → la página
assets/css/styles.css → diseño (colores en :root, modo claro/oscuro)
assets/js/config.js   → textos generales, redes, licencia, captura de correo
assets/js/app.js      → buscador, filtros, tarjetas, modal (no hace falta tocarlo)
data/recursos.js      → ⭐ EL CATÁLOGO: aquí añades tus recursos
archivos/             → los PDF/ZIP que se descargan
assets/img/           → portadas de los recursos (opcional)
```

## Añadir un recurso (3 pasos)

1. Sube el archivo a `archivos/` (p. ej. `archivos/salmos-para-ninos.pdf`).
   Si pesa más de ~25 MB, súbelo a Google Drive/Dropbox y usa el enlace público.
2. (Opcional) Sube una portada 16:9 a `assets/img/` (p. ej. 1200×675 px, `.webp` o `.jpg`).
   Si no pones portada, se genera una automática con el color e icono de la categoría.
3. En `data/recursos.js`, copia un bloque `{ ... }` al principio de la lista y rellénalo.

Haz commit y push: GitHub Pages actualiza la web en ~1 minuto.

## Publicar con GitHub Pages

1. En GitHub: **Settings → Pages**.
2. *Source*: **Deploy from a branch** → rama `main`, carpeta `/ (root)` → **Save**.
3. La web quedará en `https://joseomarcabanillasleon.github.io/repo_recursos/`.
   Consejo: renombra el repositorio (p. ej. `recursos`) para tener una URL más limpia,
   o conecta un dominio propio en la misma pantalla.

> Si el repositorio es privado, GitHub Pages requiere un plan de pago. Con repositorio público es gratis.

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
