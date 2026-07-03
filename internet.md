# Diagnóstico de conexión - Lista de Compras de Blanca

## Corrección conceptual importante

El caché no debe ser la fuente principal de datos. El primer intento de carga debe ir siempre contra Apps Script/Google Sheets. El caché solo se usa si la conexión real falla. Esto evita que un dispositivo viejo parezca funcionar mientras un dispositivo nuevo no puede cargar nada.

## Flujo correcto de arranque

1. Abrir app.
2. Intentar `action=sync` contra Apps Script.
3. Si responde bien, cargar base real y guardar caché.
4. Si falla, buscar caché local.
5. Si hay caché, mostrar datos guardados con aviso.
6. Si no hay caché, mostrar error claro.

## Qué estaba mal antes

- Se leía caché primero.
- Eso aceleraba la app, pero podía ocultar que Apps Script fallaba.
- En celulares nuevos sin caché, la app quedaba vacía.
- Por eso ahora se obliga a probar base primero.

## Prueba definitiva

- Abrir GitHub Pages en incógnito.
- Abrir en un celular donde nunca se haya abierto.
- Agregar `?debug=1`.
- Debe verse en consola:
  `[SYNC] API_URL`
  `[SYNC] JSONP request action sync`
  `[SYNC] sync ok`
- Si no aparece sync ok, todavía no está solucionado.

## Estado actual observado

- La URL de Apps Script con `action=sync` responde manualmente en navegador y devuelve productos.
- Sin embargo, desde GitHub Pages o desde un dispositivo nuevo la app muestra "Sin conexión con la base".
- Por lo tanto, el problema no parece ser que la Sheet esté vacía ni que Apps Script sea inaccesible en navegador.
- El foco de corrección está en la capa de transporte frontend/backend: JSONP, callback, timeout, fallback fetch, health y despliegue actualizado.

## Problema observado

Desde dispositivos que ya tienen caché local, la app puede parecer que funciona aunque no esté conectando correctamente con Apps Script. En un celular nuevo, una computadora nueva, GitHub Pages o una ventana de incógnito, no existe caché previo y la app necesita cargar la base desde Google Sheets mediante Apps Script.

Si esa conexión falla, aparecen mensajes como "No se pudo conectar" o la app no carga productos.

## Posibles causas

- Apps Script no publicado como aplicación web accesible para "Cualquier usuario".
- URL vieja de implementación en `API_URL`.
- Apps Script tarda más que el timeout configurado.
- JSONP bloqueado por error de script.
- El callback JSONP no se ejecuta aunque la URL responda manualmente.
- El backend devuelve JSON puro cuando el frontend esperaba JavaScript JSONP.
- El backend devuelve `ok:false`.
- Hojas con nombres incorrectos.
- Caché local ocultando el problema real en dispositivos donde la app ya se abrió antes.

## Solución nueva aplicada

- Se creó `requestBackend()`.
- `requestBackend()` intenta primero JSONP robusto.
- Si JSONP falla, intenta `fetch` normal con `mode: "cors"` y `cache: "no-store"` como fallback/diagnóstico.
- Todas las acciones (`sync`, `health`, `add`, `updateCantidad`, `updateComprado`, `delete`) pasan por `requestBackend()`.
- JSONP ahora usa callback global único, `_ts`, timeout de 30000 ms y limpieza segura.
- Los errores tienen códigos simples: `TIMEOUT`, `JSONP_ERROR`, `BACKEND_ERROR`, `EMPTY_RESPONSE`, `CORS_FETCH_ERROR`.
- Se agregó `health` real en Apps Script con `spreadsheetId` y estado de hojas.
- Apps Script usa `SpreadsheetApp.getActiveSpreadsheet()`.
- `jsonp_()` sanitiza el callback y devuelve JavaScript válido cuando hay callback.
- `syncData_()` devuelve `serverTime`, `counts` y error claro si no se encuentra una hoja.

## Solución aplicada

- Se agregó `action=health` / `action=ping` para diagnosticar Apps Script sin modificar datos.
- Se aumentó el timeout de JSONP a 30000 ms.
- Se agregó parámetro anti-cache `_ts` en cada request.
- Se agregaron logs técnicos con prefijo `[SYNC]`.
- `sync` ahora devuelve `serverTime` y conteos de productos, categorías y lista.
- Al abrir, la app intenta primero `action=sync` contra Apps Script.
- Si `sync` funciona, carga la base real y recién después guarda caché actualizado.
- Si falla la conexión con caché disponible, muestra datos guardados como respaldo.
- Si falla la conexión sin caché, muestra un mensaje claro con código simple para avisar a Eduardo.

## Cómo probar

1. Abrir la URL de Apps Script con:
   `?action=health`
2. Abrir la URL de Apps Script con:
   `?action=sync`
3. Abrir GitHub Pages en incógnito.
4. Abrir desde un celular con datos móviles.
5. Abrir la app con:
   `?debug=1`
6. Limpiar `localStorage` y probar otra vez.

## Pruebas obligatorias después de subir

1. Abrir:
   `API_URL?action=health`
   Debe devolver `ok:true`.

2. Abrir:
   `API_URL?action=sync`
   Debe devolver `productos`, `categorias` y `lista`.

3. Abrir GitHub Pages en incógnito con:
   `?debug=1`

4. En consola debe verse:
   `[SYNC] API_URL`
   `[SYNC] JSONP request`
   `[SYNC] sync ok` o `fetch ok` si el fallback fue necesario.

5. En un celular nuevo debe cargar productos sin caché previo.

## Resultado esperado

- `health` devuelve `ok:true`.
- `sync` devuelve `productos`, `categorias` y `lista`.
- GitHub Pages carga sin caché previo.
- Un celular nuevo carga productos.
- Si falla internet, usa caché solo si existe.

## Checklist de publicación de Apps Script

- Implementar > Nueva implementación.
- Tipo: Aplicación web.
- Ejecutar como: yo.
- Quién tiene acceso: cualquier usuario.
- Copiar URL `/exec` nueva.
- Pegar esa URL en `API_URL`.
- Guardar y subir `app.js` a GitHub.
