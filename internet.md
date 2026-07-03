# Diagnóstico de conexión - Lista de Compras de Blanca

## Problema observado

Desde dispositivos que ya tienen caché local, la app puede parecer que funciona aunque no esté conectando correctamente con Apps Script. En un celular nuevo, una computadora nueva, GitHub Pages o una ventana de incógnito, no existe caché previo y la app necesita cargar la base desde Google Sheets mediante Apps Script.

Si esa conexión falla, aparecen mensajes como "No se pudo conectar" o la app no carga productos.

## Posibles causas

- Apps Script no publicado como aplicación web accesible para "Cualquier usuario".
- URL vieja de implementación en `API_URL`.
- Apps Script tarda más que el timeout configurado.
- JSONP bloqueado por error de script.
- El backend devuelve `ok:false`.
- Hojas con nombres incorrectos.
- Caché local ocultando el problema real en dispositivos donde la app ya se abrió antes.

## Solución aplicada

- Se agregó `action=health` / `action=ping` para diagnosticar Apps Script sin modificar datos.
- Se aumentó el timeout de JSONP a 30000 ms.
- Se agregó parámetro anti-cache `_ts` en cada request.
- Se agregaron logs técnicos con prefijo `[SYNC]`.
- `sync` ahora devuelve `serverTime` y conteos de productos, categorías y lista.
- Si hay caché, la app renderiza datos guardados y sincroniza en segundo plano.
- Si falla la conexión con caché disponible, muestra datos guardados.
- Si falla la conexión sin caché, muestra un mensaje claro para avisar a Eduardo.

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
