# Diagnóstico de conexión - Lista de Compras de Blanca

## IMPORTANTE

`Code.gs` no se sube a GitHub.

El backend vive solo en Apps Script y se pega manualmente allí. El repositorio público debe contener solo archivos frontend como `index.html`, `app.js`, `styles.css` y documentación.

Si JSONP falla, probar manualmente:

```text
API_URL?action=sync&callback=prueba
```

Debe devolver:

```js
prueba({...});
```

Si no devuelve eso:

- Apps Script no fue desplegado con nueva versión.
- O el acceso no está en "Cualquier persona".
- O `API_URL` apunta a una implementación vieja/incorrecta.

## Arquitectura final

Fetch fue descartado para esta app porque desde GitHub Pages Apps Script puede redirigir a `script.googleusercontent.com` y fallar con 404 o bloqueos de CORS.

JSONP queda como método oficial de sincronización con Apps Script.

La app no espera Apps Script para pintar la pantalla:

1. Carga `localStorage` si existe.
2. Si no hay caché, carga `SEED_PRODUCTOS` y `SEED_CATEGORIAS` embebidos en `app.js`.
3. Renderiza Productos / Mi lista / Resumen inmediatamente.
4. Sincroniza con Apps Script en segundo plano usando JSONP.
5. Si Apps Script responde, actualiza productos, categorías y lista reales, guarda caché y vuelve a renderizar.
6. Si Apps Script falla, la app sigue usable con datos guardados o catálogo semilla.

## Requisito JSONP

Para que JSONP funcione, `Code.gs` debe devolver JavaScript válido cuando recibe `callback`.

Con callback:

```js
prueba({"ok":true});
```

Sin callback:

```json
{"ok":true}
```

La función responsable es:

```js
jsonResponse_(data, callback)
```

## Pruebas de Apps Script

Abrir en navegador:

```text
API_URL?action=health
```

Debe devolver JSON normal con `ok:true`.

Abrir:

```text
API_URL?action=health&callback=prueba
```

Debe devolver JavaScript:

```js
prueba({"ok":true,...});
```

Abrir:

```text
API_URL?action=sync&callback=prueba
```

Debe devolver:

```js
prueba({"ok":true,"serverTime":"...","productos":[...],"categorias":[...],"lista":[...]});
```

Si la URL con `callback=prueba` devuelve JSON puro en vez de `prueba({...});`, el Apps Script publicado no tiene el `Code.gs` actualizado o no se desplegó una nueva versión.

## Pruebas en GitHub Pages

Abrir:

```text
https://matiash2804.github.io/Blanca-s-per/?debug=1
```

Resultado esperado:

- En menos de 2 segundos se ven productos desde caché o catálogo semilla.
- En consola aparece `[SYNC] API_URL actual`.
- En consola aparece `[SYNC] JSONP request action sync`.
- Si Apps Script responde, aparece `[SYNC] sync ok`.
- Si Apps Script responde, aparece `[SYNC] Base actualizada`.
- Al agregar producto aparece `[SYNC] JSONP request action add`.
- Al cambiar cantidad aparece `[SYNC] JSONP request action updateCantidad`.
- Al marcar comprado aparece `[SYNC] JSONP request action updateComprado`.

No deberían aparecer errores normales de `TIMEOUT` ni `JSONP_ERROR`.

## Publicación obligatoria de Apps Script

Después de cambiar `Code.gs`, no alcanza con guardar el archivo.

Hay que publicar una nueva versión:

1. Apps Script > Implementar.
2. Administrar implementaciones.
3. Editar la implementación web.
4. Seleccionar Nueva versión.
5. Implementar.
6. Confirmar que la URL `/exec` sea la misma usada en `API_URL` o copiar la nueva URL si cambió.

## Resultado esperado

- La app carga visualmente en menos de 2 segundos.
- Un celular nuevo ve productos aunque no tenga caché.
- La sincronización real usa JSONP.
- Si Apps Script falla, la app sigue usable.
- Si Apps Script responde, Google Sheets queda sincronizado.
- No hay mezcla fetch/JSONP.
- No hay funciones muertas de transporte.
