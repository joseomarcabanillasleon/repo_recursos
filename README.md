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
