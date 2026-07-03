const API_URL = "https://script.google.com/macros/s/AKfycbyD98q075uflW72jgJyeW2hEDBIEyLrnuPWUyZLxo8zbFklqnMWY-EpFA2DE-hTI7nR/exec";
const WHATSAPP_URL = "https://wa.me/5493424307388?text=";
const CACHE_KEY = "lista_compras_blanca_cache_v1";
const DEBUG_SYNC = new URLSearchParams(window.location.search).get("debug") === "1";

const SEED_CATEGORIAS = [
  { IDCategoria: "CAT001_A", "Nombre Categoría": "Verduras" },
  { IDCategoria: "CAT002_A", "Nombre Categoría": "Frutas" },
  { IDCategoria: "CAT003_A", "Nombre Categoría": "Granja" },
  { IDCategoria: "CAT004_A", "Nombre Categoría": "Panadería" },
  { IDCategoria: "CAT005_A", "Nombre Categoría": "Carnicería" },
  { IDCategoria: "CAT006_A", "Nombre Categoría": "Congelados" },
  { IDCategoria: "CAT007_A", "Nombre Categoría": "Despensa" },
  { IDCategoria: "CAT008_A", "Nombre Categoría": "Limpieza" },
  { IDCategoria: "CAT009_A", "Nombre Categoría": "Lácteos" },
  { IDCategoria: "CAT010_A", "Nombre Categoría": "Bebidas" }
];

const SEED_PRODUCTOS = [
  { IDProducto: "Pro001", "Nombre Producto": "Acelga", "Categoría": "CAT001_A" },
  { IDProducto: "Pro002", "Nombre Producto": "Ajo", "Categoría": "CAT001_A" },
  { IDProducto: "Pro003", "Nombre Producto": "Cebolla", "Categoría": "CAT001_A" },
  { IDProducto: "Pro004", "Nombre Producto": "Lechuga", "Categoría": "CAT001_A" },
  { IDProducto: "Pro005", "Nombre Producto": "Papa", "Categoría": "CAT001_A" },
  { IDProducto: "Pro006", "Nombre Producto": "Tomate", "Categoría": "CAT001_A" },
  { IDProducto: "Pro007", "Nombre Producto": "Zanahoria", "Categoría": "CAT001_A" },
  { IDProducto: "Pro008", "Nombre Producto": "Banana", "Categoría": "CAT002_A" },
  { IDProducto: "Pro009", "Nombre Producto": "Manzana", "Categoría": "CAT002_A" },
  { IDProducto: "Pro010", "Nombre Producto": "Naranja", "Categoría": "CAT002_A" },
  { IDProducto: "Pro011", "Nombre Producto": "Huevos", "Categoría": "CAT003_A" },
  { IDProducto: "Pro012", "Nombre Producto": "Pan", "Categoría": "CAT004_A" },
  { IDProducto: "Pro013", "Nombre Producto": "Facturas", "Categoría": "CAT004_A" },
  { IDProducto: "Pro014", "Nombre Producto": "Carne Picada Especial", "Categoría": "CAT005_A" },
  { IDProducto: "Pro015", "Nombre Producto": "Milanesas de Pollo", "Categoría": "CAT005_A" },
  { IDProducto: "Pro016", "Nombre Producto": "Hamburguesas", "Categoría": "CAT006_A" },
  { IDProducto: "Pro017", "Nombre Producto": "Aceite de Cocina", "Categoría": "CAT007_A" },
  { IDProducto: "Pro018", "Nombre Producto": "Arroz", "Categoría": "CAT007_A" },
  { IDProducto: "Pro019", "Nombre Producto": "Fideos", "Categoría": "CAT007_A" },
  { IDProducto: "Pro020", "Nombre Producto": "Galletas de salvado", "Categoría": "CAT007_A" },
  { IDProducto: "Pro021", "Nombre Producto": "Detergente", "Categoría": "CAT008_A" },
  { IDProducto: "Pro022", "Nombre Producto": "Lavandina", "Categoría": "CAT008_A" },
  { IDProducto: "Pro023", "Nombre Producto": "Leche", "Categoría": "CAT009_A" },
  { IDProducto: "Pro024", "Nombre Producto": "Queso Cremoso", "Categoría": "CAT009_A" },
  { IDProducto: "Pro025", "Nombre Producto": "Yogur", "Categoría": "CAT009_A" },
  { IDProducto: "Pro026", "Nombre Producto": "Agua", "Categoría": "CAT010_A" },
  { IDProducto: "Pro027", "Nombre Producto": "Soda", "Categoría": "CAT010_A" }
];

let productos = [];
let categorias = [];
let lista = [];
let cargando = false;
let vistaActiva = "productosView";
let toastTimer = null;

const buscar = document.getElementById("buscar");
const categoria = document.getElementById("categoria");
const productosDiv = document.getElementById("productos");
const listaDiv = document.getElementById("lista");
const estadoProductos = document.getElementById("estadoProductos");
const estadoResumen = document.getElementById("estadoResumen");
const contadorSuperior = document.getElementById("contadorSuperior");
const contadorLista = document.getElementById("contadorLista");
const resumenPedido = document.getElementById("resumenPedido");
const finalizarPedido = document.getElementById("finalizarPedido");
const limpiarComprados = document.getElementById("limpiarComprados");
const mensajeApp = document.getElementById("mensajeApp");
const tabs = document.querySelectorAll("[data-view]");
const views = document.querySelectorAll(".view");

function debugSync(...args) {
  if (DEBUG_SYNC) console.log("[SYNC]", ...args);
}

function crearErrorConexion(code, message, details) {
  const error = new Error(message || code);
  error.code = code;
  if (details) error.details = details;
  return error;
}

function getJsonpTestUrl(action = "sync") {
  return API_URL + "?" + new URLSearchParams({
    action,
    callback: "prueba",
    _ts: Date.now()
  }).toString();
}

function jsonp(params) {
  return new Promise((resolve, reject) => {
    const callback = "jsonp_cb_" + Date.now() + "_" + Math.floor(Math.random() * 1000000);
    const script = document.createElement("script");
    let terminado = false;

    const requestParams = {
      ...params,
      callback,
      _ts: Date.now()
    };

    const url = API_URL + "?" + new URLSearchParams(requestParams).toString();
    debugSync("JSONP request action " + params.action, { url });

    const timeout = setTimeout(() => {
      const error = crearErrorConexion("TIMEOUT", "El callback JSONP no respondió a tiempo", { action: params.action, url });
      console.warn("[SYNC]", "JSONP timeout", { action: params.action, url, timeoutMs: 15000 });
      cleanup();
      reject(error);
    }, 15000);

    function cleanup() {
      if (terminado) return;
      terminado = true;
      clearTimeout(timeout);
      if (script.parentNode) script.parentNode.removeChild(script);
      delete window[callback];
    }

    window[callback] = data => {
      cleanup();

      if (!data) {
        reject(crearErrorConexion("EMPTY_RESPONSE", "Apps Script devolvió una respuesta vacía", { action: params.action, url }));
        return;
      }

      if (data.ok === false) {
        const error = crearErrorConexion("BACKEND_ERROR", data.error || "Apps Script respondió ok:false", { action: params.action, url });
        error.response = data;
        reject(error);
        return;
      }

      debugSync("JSONP ok", { action: params.action, data });
      resolve(data);
    };

    script.onerror = () => {
      const error = crearErrorConexion("JSONP_ERROR", "No se pudo cargar el script JSONP", { action: params.action, url });
      console.error("[SYNC]", "JSONP script.onerror", { action: params.action, url });
      console.error(
        "[SYNC]",
        "ERROR JSONP: Apps Script no está respondiendo como JavaScript cargable. Probar manualmente: " +
          getJsonpTestUrl(params.action || "sync") +
          ". Debe devolver prueba({...}); Si no lo hace, revisar deployment de Apps Script: Ejecutar como Yo / Acceso Cualquier persona / Nueva versión implementada."
      );
      cleanup();
      reject(error);
    };

    script.src = url;
    document.body.appendChild(script);
  });
}

async function requestBackend(params) {
  return await jsonp(params);
}

function campo(obj, nombres) {
  for (const nombre of nombres) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, nombre)) return obj[nombre];
  }
  return "";
}

function limpiarTexto(valor) {
  return String(valor ?? "").trim();
}

function normalizar(valor) {
  return limpiarTexto(valor).toLowerCase();
}

function pareceIdVisible(valor) {
  return /^(pro|cat|com)\d[\w-]*$/i.test(limpiarTexto(valor));
}

function esComprado(item) {
  const valor = item.Comprado;
  return valor === true || String(valor).toLowerCase() === "true" || String(valor).toLowerCase() === "si";
}

function cantidadItem(item) {
  const numero = Number(item.Cantidad || 1);
  return Number.isFinite(numero) && numero > 0 ? numero : 1;
}

function getCategoriaNombre(idCategoria) {
  const id = limpiarTexto(idCategoria);
  const categoriaEncontrada = categorias.find(cat => limpiarTexto(campo(cat, ["IDCategoria"])) === id);
  return limpiarTexto(campo(categoriaEncontrada, ["Nombre Categoría", "Nombre Categoria", "Nombre CategorÃ­a"])) || "Sin categoría";
}

function getProductoInfo(item) {
  const valorProducto = limpiarTexto(campo(item, ["Producto", "producto", "Nombre Producto", "NombreProducto"]));
  const idProductoDirecto = limpiarTexto(campo(item, ["IDProducto", "idProducto"]));

  let producto = productos.find(p => limpiarTexto(campo(p, ["IDProducto"])) === valorProducto);

  if (!producto && idProductoDirecto) {
    producto = productos.find(p => limpiarTexto(campo(p, ["IDProducto"])) === idProductoDirecto);
  }

  if (!producto) {
    producto = productos.find(p => normalizar(campo(p, ["Nombre Producto", "NombreProducto"])) === normalizar(valorProducto));
  }

  const idProducto = limpiarTexto(campo(producto, ["IDProducto"])) || idProductoDirecto;
  const nombreResuelto = limpiarTexto(campo(producto, ["Nombre Producto", "NombreProducto"]));
  const nombreProducto = nombreResuelto || (pareceIdVisible(valorProducto) ? "Producto sin nombre" : valorProducto) || "Producto sin nombre";
  const idCategoria = limpiarTexto(campo(producto, ["Categoría", "Categoria", "CategorÃ­a"]));
  const nombreCategoria = getCategoriaNombre(idCategoria);

  return { idProducto, nombreProducto, idCategoria, nombreCategoria };
}

function escapeHtml(valor) {
  return limpiarTexto(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function mostrarMensaje(texto) {
  clearTimeout(toastTimer);
  mensajeApp.textContent = texto;
  mensajeApp.classList.add("visible");
  toastTimer = setTimeout(() => mensajeApp.classList.remove("visible"), 3200);
}

function leerCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) {
      debugSync("No hay cache local");
      return false;
    }

    const cache = JSON.parse(raw);
    productos = Array.isArray(cache.productos) ? cache.productos : [];
    categorias = Array.isArray(cache.categorias) ? cache.categorias : [];
    lista = Array.isArray(cache.lista) ? cache.lista : [];
    debugSync("Cargo desde cache", {
      productos: productos.length,
      categorias: categorias.length,
      lista: lista.length,
      timestamp: cache.timestamp
    });
    return true;
  } catch (err) {
    console.warn("[SYNC]", "No se pudo leer cache local", err);
    return false;
  }
}

function cargarDatosInicialesRapidos() {
  if (leerCache()) return "cache";

  productos = SEED_PRODUCTOS.slice();
  categorias = SEED_CATEGORIAS.slice();
  lista = [];
  debugSync("Cargo catalogo semilla", {
    productos: productos.length,
    categorias: categorias.length,
    lista: lista.length
  });
  return "seed";
}

function guardarCache() {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      productos,
      categorias,
      lista,
      timestamp: Date.now()
    }));
  } catch (err) {
    console.warn("[SYNC]", "No se pudo guardar cache local", err);
  }
}

async function probarConexionAppsScript() {
  try {
    const data = await requestBackend({ action: "health" });
    console.log("[SYNC] health ok", data);
    return true;
  } catch (err) {
    console.warn("[SYNC] health error", { code: err.code, message: err.message, response: err.response });
    return false;
  }
}

function snapshotEstado() {
  return {
    productos: productos.slice(),
    categorias: categorias.slice(),
    lista: lista.map(item => ({ ...item }))
  };
}

function restaurarEstado(snapshot) {
  productos = snapshot.productos;
  categorias = snapshot.categorias;
  lista = snapshot.lista;
  renderTodo();
}

async function sincronizarDatos({ mostrarCarga = false, mantenerCache = true } = {}) {
  try {
    cargando = true;
    actualizarContadores();
    if (mostrarCarga && !productos.length) {
      estadoProductos.textContent = "Cargando productos...";
      productosDiv.innerHTML = `<div class="vacio">Cargando productos...</div>`;
    }

    await sincronizarDatosDesdeBase();
  } catch (err) {
    if (mantenerCache && (productos.length || categorias.length || lista.length)) {
      console.warn("[SYNC]", "Fallo sync, se mantiene cache", { code: err.code, message: err.message });
      mostrarMensaje("Sin conexión con la base. Mostrando datos guardados.");
      renderTodo();
      return;
    }

    mostrarErrorSinBase(err);
  } finally {
    cargando = false;
    actualizarContadores();
  }
}

async function sincronizarDatosDesdeBase() {
  const data = await requestBackend({ action: "sync" });

  if (!data) {
    throw crearErrorConexion("EMPTY_RESPONSE", "Sync devolvió una respuesta vacía");
  }

  if (!Array.isArray(data.productos)) {
    throw crearErrorConexion("INVALID_SYNC", "Sync no devolvió productos como array", { data });
  }

  if (!Array.isArray(data.categorias)) {
    throw crearErrorConexion("INVALID_SYNC", "Sync no devolvió categorias como array", { data });
  }

  if (data.lista && !Array.isArray(data.lista)) {
    throw crearErrorConexion("INVALID_SYNC", "Sync no devolvió lista como array", { data });
  }

  productos = data.productos;
  categorias = data.categorias;
  lista = data.lista || [];
  debugSync("sync ok", {
    serverTime: data.serverTime,
    counts: data.counts,
    productos: productos.length,
    categorias: categorias.length,
    lista: lista.length
  });
  guardarCache();
  renderTodo();
}

function mostrarErrorSinBase(err) {
  const codigo = escapeHtml(err.code || "CONNECTION_ERROR");
  const mensajeError = `<div class="error">No se pudo conectar con la base. Avisale a Eduardo.<br><small>Código: ${codigo}</small></div>`;

  productos = [];
  categorias = [];
  lista = [];
  renderCategorias();
  productosDiv.innerHTML = mensajeError;
  listaDiv.innerHTML = mensajeError;
  resumenPedido.innerHTML = mensajeError;
  estadoProductos.textContent = "Sin conexión con la base";
  estadoResumen.textContent = "Sin conexión con la base";
  actualizarContadores();
}

async function sincronizarEnSegundoPlano() {
  try {
    estadoProductos.textContent = "Sincronizando...";
    await sincronizarDatosDesdeBase();
    console.log("[SYNC] Base actualizada");
    mostrarMensaje("Base actualizada.");
    if (DEBUG_SYNC) probarConexionAppsScript();
  } catch (err) {
    console.warn("[SYNC] No se pudo actualizar en segundo plano", {
      code: err.code,
      message: err.message,
      response: err.response
    });
    if (err.code === "JSONP_ERROR" || err.code === "TIMEOUT") {
      mostrarMensaje("No se pudo sincronizar. Revisar Apps Script.");
    } else {
      mostrarMensaje("No se pudo actualizar la base. Usando datos guardados.");
    }
  }
}

function renderTodo() {
  renderCategorias();
  renderProductos();
  renderLista();
  renderResumenPedido();
  actualizarContadores();
}

function renderCategorias() {
  const valorActual = categoria.value;
  categoria.innerHTML = `<option value="">Todas las categorías</option>`;

  categorias.forEach(cat => {
    const id = limpiarTexto(campo(cat, ["IDCategoria"]));
    const nombre = limpiarTexto(campo(cat, ["Nombre Categoría", "Nombre Categoria", "Nombre CategorÃ­a"]));
    if (!id || !nombre) return;

    const option = document.createElement("option");
    option.value = id;
    option.textContent = nombre;
    categoria.appendChild(option);
  });

  categoria.value = [...categoria.options].some(option => option.value === valorActual) ? valorActual : "";
}

function renderProductos() {
  const texto = normalizar(buscar.value);
  const cat = limpiarTexto(categoria.value);

  const filtrados = productos.filter(p => {
    const info = getProductoInfo(p);
    const coincideTexto = normalizar(info.nombreProducto).includes(texto);
    const coincideCategoria = !cat || info.idCategoria === cat;
    return coincideTexto && coincideCategoria;
  });

  productosDiv.innerHTML = "";
  estadoProductos.textContent = productos.length ? `${filtrados.length} disponibles` : "No hay productos cargados";

  if (!productos.length) {
    productosDiv.innerHTML = `<div class="vacio">No hay productos cargados</div>`;
    return;
  }

  if (!filtrados.length) {
    productosDiv.innerHTML = `<div class="vacio">No se encontraron productos</div>`;
    return;
  }

  const grupos = agruparPorCategoria(filtrados, getProductoInfo);

  nombresCategoriaOrdenados(grupos).forEach(nombreCategoria => {
    const grupo = document.createElement("section");
    grupo.className = "category-group";
    grupo.innerHTML = `
      <h3 class="category-heading">${escapeHtml(nombreCategoria)}</h3>
      <div class="category-grid"></div>
    `;

    const grid = grupo.querySelector(".category-grid");
    grupos[nombreCategoria]
      .sort((a, b) => a.info.nombreProducto.localeCompare(b.info.nombreProducto, "es"))
      .forEach(({ info }) => {
        const card = document.createElement("article");
        card.className = "product-card";
        card.innerHTML = `
          <div>
            <h3 class="nombre">${escapeHtml(info.nombreProducto)}</h3>
          </div>
          <button class="btn btn-agregar" type="button">Agregar</button>
        `;

        card.querySelector("button").addEventListener("click", () => agregarProducto(info));
        grid.appendChild(card);
      });

    productosDiv.appendChild(grupo);
  });
}

function renderLista() {
  listaDiv.innerHTML = "";

  if (!lista.length) {
    listaDiv.innerHTML = `<div class="vacio">La lista está vacía</div>`;
    return;
  }

  const grupos = agruparPorCategoria(lista, getProductoInfo);

  nombresCategoriaOrdenados(grupos).forEach(nombreCategoria => {
    const grupo = document.createElement("section");
    grupo.className = "category-group";
    grupo.innerHTML = `
      <h3 class="category-heading">${escapeHtml(nombreCategoria)}</h3>
      <div class="category-grid"></div>
    `;

    const grid = grupo.querySelector(".category-grid");
    grupos[nombreCategoria]
      .sort((a, b) => a.info.nombreProducto.localeCompare(b.info.nombreProducto, "es"))
      .forEach(({ item, info }) => {
        const comprado = esComprado(item);
        const cantidad = cantidadItem(item);
        const card = document.createElement("article");
        card.className = `list-card${comprado ? " comprado" : ""}`;

        card.innerHTML = `
          <div>
            <h3 class="nombre">${escapeHtml(info.nombreProducto)}</h3>
          </div>
          ${comprado ? `<span class="status">Comprado</span>` : ""}
          <div class="cantidad-control" aria-label="Cantidad">
            <button class="qty-btn" type="button" data-restar>-</button>
            <span class="cantidad-numero">${cantidad}</span>
            <button class="qty-btn" type="button" data-sumar>+</button>
          </div>
          <div class="card-actions">
            <button class="btn ${comprado ? "btn-desmarcar" : "btn-comprado"}" type="button" data-comprado>${comprado ? "Desmarcar" : "Comprado"}</button>
            <button class="btn btn-borrar" type="button" data-borrar>Quitar</button>
          </div>
        `;

        card.querySelector("[data-restar]").addEventListener("click", () => cambiarCantidad(item.IDCompra, cantidad - 1));
        card.querySelector("[data-sumar]").addEventListener("click", () => cambiarCantidad(item.IDCompra, cantidad + 1));
        card.querySelector("[data-comprado]").addEventListener("click", () => cambiarComprado(item.IDCompra, !comprado));
        card.querySelector("[data-borrar]").addEventListener("click", () => borrarItem(item.IDCompra));
        grid.appendChild(card);
      });

    listaDiv.appendChild(grupo);
  });
}

function actualizarContadores() {
  const distintos = lista.length;
  const texto = `${distintos} ${distintos === 1 ? "producto" : "productos"}`;

  if (contadorSuperior) contadorSuperior.textContent = texto;
  if (contadorLista) contadorLista.textContent = "";
  limpiarComprados.style.display = lista.some(esComprado) ? "inline-flex" : "none";
  finalizarPedido.disabled = cargando;
}

function agruparLista() {
  const grupos = {};

  lista.forEach(item => {
    const info = getProductoInfo(item);
    const categoriaNombre = info.nombreCategoria || "Sin categoría";

    if (!grupos[categoriaNombre]) grupos[categoriaNombre] = [];
    grupos[categoriaNombre].push({
      nombre: info.nombreProducto,
      cantidad: cantidadItem(item),
      comprado: esComprado(item)
    });
  });

  return grupos;
}

function agruparPorCategoria(items, resolver) {
  const grupos = {};

  items.forEach(item => {
    const info = resolver(item);
    const categoriaNombre = info.nombreCategoria || "Sin categoría";

    if (!grupos[categoriaNombre]) grupos[categoriaNombre] = [];
    grupos[categoriaNombre].push({ item, info });
  });

  return grupos;
}

function nombresCategoriaOrdenados(grupos) {
  return Object.keys(grupos).sort((a, b) => a.localeCompare(b, "es"));
}

function renderResumenPedido() {
  const grupos = agruparLista();
  const distintos = lista.length;
  const unidades = lista.reduce((total, item) => total + cantidadItem(item), 0);
  const nombresCategoria = Object.keys(grupos).sort((a, b) => a.localeCompare(b, "es"));

  estadoResumen.textContent = lista.length ? "Agrupado por categoría" : "Pedido actual";

  if (!lista.length) {
    resumenPedido.innerHTML = `<div class="vacio">La lista está vacía</div>`;
    return;
  }

  const detalle = nombresCategoria.map(nombreCategoria => {
    const items = grupos[nombreCategoria]
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
      .map(item => `
        <div class="summary-row">
          <span class="summary-name">${item.comprado ? '<span class="summary-check">✓</span> ' : ""}${escapeHtml(item.nombre)}</span>
          <span class="summary-qty">x ${item.cantidad}</span>
        </div>
      `).join("");

    return `
      <section class="summary-category-card">
        <h3>${escapeHtml(nombreCategoria)}</h3>
        ${items}
      </section>
    `;
  }).join("");

  resumenPedido.innerHTML = `
    ${detalle}
    <div class="resumen-totales">
      <div class="stat"><span>Total de productos</span><strong>${distintos}</strong></div>
      <div class="stat"><span>Total de unidades</span><strong>${unidades}</strong></div>
    </div>
  `;
}

function fechaArgentinaHoy() {
  const hoy = new Date();
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(hoy);
}

function crearMensajeWhatsApp() {
  return `Hola Eduardo, ya te hice la compra de hoy, ${fechaArgentinaHoy()}.`;
}

function activarVista(idVista) {
  vistaActiva = idVista;

  views.forEach(view => {
    view.classList.toggle("active", view.id === idVista);
  });

  tabs.forEach(tab => {
    const activo = tab.dataset.view === idVista;
    tab.classList.toggle("active", activo);
    tab.setAttribute("aria-current", activo ? "page" : "false");
  });

  if (idVista === "resumenView") renderResumenPedido();
}

function actualizarItemLocal(id, cambios) {
  lista = lista.map(item => String(item.IDCompra) === String(id) ? { ...item, ...cambios } : item);
}

async function ejecutarAccion({ accion, optimista, actionName }) {
  const anterior = snapshotEstado();

  try {
    if (optimista) {
      optimista();
      renderTodo();
      guardarCache();
    }

    await accion();
    await sincronizarDatos({ mantenerCache: true });
  } catch (err) {
    restaurarEstado(anterior);
    guardarCache();
    console.warn("[SYNC]", "No se pudo sincronizar operación", { code: err.code, message: err.message });
    if (actionName) {
      console.warn("[SYNC]", "Falló escritura. Revisar URL JSONP manual: " + getJsonpTestUrl(actionName));
    }
    mostrarMensaje("No se pudo sincronizar. Revisá internet.");
  }
}

async function agregarProducto(info) {
  const temporal = {
    IDCompra: "TEMP_" + Date.now(),
    Producto: info.nombreProducto,
    Cantidad: 1,
    Comprado: false
  };

  await ejecutarAccion({
    optimista: () => {
      lista = [...lista, temporal];
      activarVista("listaView");
    },
    accion: () => requestBackend({
      action: "add",
      idProducto: info.idProducto,
      producto: info.nombreProducto,
      cantidad: 1
    }),
    actionName: "add"
  });
}

async function cambiarCantidad(id, cantidad) {
  const nuevaCantidad = Math.max(1, Number(cantidad) || 1);

  await ejecutarAccion({
    optimista: () => actualizarItemLocal(id, { Cantidad: nuevaCantidad }),
    accion: () => requestBackend({
      action: "updateCantidad",
      id,
      cantidad: nuevaCantidad
    }),
    actionName: "updateCantidad"
  });
}

async function cambiarComprado(id, comprado) {
  await ejecutarAccion({
    optimista: () => actualizarItemLocal(id, { Comprado: comprado }),
    accion: () => requestBackend({
      action: "updateComprado",
      id,
      comprado
    }),
    actionName: "updateComprado"
  });
}

async function borrarItem(id) {
  await ejecutarAccion({
    optimista: () => {
      lista = lista.filter(item => String(item.IDCompra) !== String(id));
    },
    accion: () => requestBackend({
      action: "delete",
      id
    }),
    actionName: "delete"
  });
}

async function limpiarItemsComprados() {
  const comprados = lista.filter(esComprado);
  if (!comprados.length) return;

  await ejecutarAccion({
    optimista: () => {
      lista = lista.filter(item => !esComprado(item));
    },
    accion: async () => {
      for (const item of comprados) {
        await requestBackend({ action: "delete", id: item.IDCompra });
      }
    },
    actionName: "delete"
  });
}

async function iniciarApp() {
  debugSync("API_URL actual:", API_URL);
  if (DEBUG_SYNC) {
    console.log("[SYNC] URL test JSONP sync:", getJsonpTestUrl("sync"));
    console.log("[SYNC] URL test JSONP health:", getJsonpTestUrl("health"));
  }

  const origenInicial = cargarDatosInicialesRapidos();
  renderTodo();

  if (origenInicial === "cache") {
    mostrarMensaje("Datos guardados. Sincronizando...");
  } else if (origenInicial === "seed") {
    mostrarMensaje("Catálogo inicial cargado. Sincronizando...");
  }

  sincronizarEnSegundoPlano();
}

buscar.addEventListener("input", renderProductos);
categoria.addEventListener("change", renderProductos);
limpiarComprados.addEventListener("click", limpiarItemsComprados);
finalizarPedido.addEventListener("click", () => {
  window.open(WHATSAPP_URL + encodeURIComponent(crearMensajeWhatsApp()), "_blank", "noopener");
});

tabs.forEach(tab => {
  tab.addEventListener("click", () => activarVista(tab.dataset.view));
});

iniciarApp();
