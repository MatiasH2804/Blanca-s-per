const CONFIG = {
  SHEET_LISTA: "Copia de ListaDeCompra",
  SHEET_PRODUCTOS: "Copia de Productos",
  SHEET_CATEGORIAS: "Copia de Categoria"
};

function doGet(e) {
  const p = e.parameter || {};
  const action = p.action || "sync";
  let result;

  try {
    if (action === "health" || action === "ping") result = health_();
    else if (action === "sync") result = syncData_();
    else if (action === "add") result = addItem_(p);
    else if (action === "updateCantidad") result = updateCantidad_(p);
    else if (action === "updateComprado") result = updateComprado_(p);
    else if (action === "delete") result = deleteItem_(p);
    else result = { ok: false, error: "Acción no válida", action };
  } catch (err) {
    result = { ok: false, error: err.message, action };
  }

  return jsonResponse_(result, p.callback);
}

function health_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  return {
    ok: true,
    status: "online",
    app: "Lista de Compras de Blanca",
    timestamp: new Date().toISOString(),
    spreadsheetId: ss.getId(),
    sheets: {
      lista: !!ss.getSheetByName(CONFIG.SHEET_LISTA),
      productos: !!ss.getSheetByName(CONFIG.SHEET_PRODUCTOS),
      categorias: !!ss.getSheetByName(CONFIG.SHEET_CATEGORIAS)
    }
  };
}

function syncData_() {
  const missing = missingSheets_();
  if (missing.length) {
    return {
      ok: false,
      error: "No se encontraron hojas en Google Sheets: " + missing.join(", "),
      missingSheets: missing,
      serverTime: new Date().toISOString()
    };
  }

  const productos = getObjects_(CONFIG.SHEET_PRODUCTOS).filter(r => r.IDProducto);
  const categorias = getObjects_(CONFIG.SHEET_CATEGORIAS).filter(r => r.IDCategoria);
  const lista = getObjects_(CONFIG.SHEET_LISTA).filter(r => r.IDCompra && r.Producto);

  return {
    ok: true,
    serverTime: new Date().toISOString(),
    productos,
    categorias,
    lista,
    counts: {
      productos: productos.length,
      categorias: categorias.length,
      lista: lista.length
    }
  };
}

function addItem_(p) {
  const sh = getSheet_(CONFIG.SHEET_LISTA);
  const id = nextId_(sh, "COM");
  const producto = getNombreProducto_(p.producto, p.idProducto);

  sh.appendRow([
    id,
    producto,
    Number(p.cantidad || 1),
    false
  ]);

  return { ok: true, id };
}

function getNombreProducto_(producto, idProducto) {
  const nombreDirecto = String(producto || "").trim();
  const id = String(idProducto || "").trim();

  if (nombreDirecto && nombreDirecto !== id) return nombreDirecto;

  if (id) {
    const productos = getObjects_(CONFIG.SHEET_PRODUCTOS);
    const encontrado = productos.find(p => String(p.IDProducto) === id);
    if (encontrado && encontrado["Nombre Producto"]) {
      return String(encontrado["Nombre Producto"]).trim();
    }
  }

  return nombreDirecto || id;
}

function updateCantidad_(p) {
  const sh = getSheet_(CONFIG.SHEET_LISTA);
  const row = findRowById_(sh, p.id);

  if (!row) throw new Error("No se encontró el producto en la lista");

  sh.getRange(row, 3).setValue(Number(p.cantidad || 1));
  return { ok: true };
}

function updateComprado_(p) {
  const sh = getSheet_(CONFIG.SHEET_LISTA);
  const row = findRowById_(sh, p.id);

  if (!row) throw new Error("No se encontró el producto en la lista");

  sh.getRange(row, 4).setValue(String(p.comprado) === "true");
  return { ok: true };
}

function deleteItem_(p) {
  const sh = getSheet_(CONFIG.SHEET_LISTA);
  const row = findRowById_(sh, p.id);

  if (!row) throw new Error("No se encontró el producto en la lista");

  sh.deleteRow(row);
  return { ok: true };
}

function hasSheet_(name) {
  return Boolean(SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name));
}

function missingSheets_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const missing = [];

  if (!ss.getSheetByName(CONFIG.SHEET_LISTA)) missing.push(CONFIG.SHEET_LISTA);
  if (!ss.getSheetByName(CONFIG.SHEET_PRODUCTOS)) missing.push(CONFIG.SHEET_PRODUCTOS);
  if (!ss.getSheetByName(CONFIG.SHEET_CATEGORIAS)) missing.push(CONFIG.SHEET_CATEGORIAS);

  return missing;
}

function getSheet_(name) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh) throw new Error("No existe la hoja: " + name);
  return sh;
}

function getObjects_(sheetName) {
  const sh = getSheet_(sheetName);
  const values = sh.getDataRange().getValues();

  if (values.length < 2) return [];

  const headers = values[0];

  return values.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function findRowById_(sh, id) {
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return null;

  const values = sh.getRange(2, 1, lastRow - 1, 1).getValues();

  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      return i + 2;
    }
  }

  return null;
}

function nextId_(sh, prefix) {
  const lastRow = sh.getLastRow();

  if (lastRow < 2) return prefix + "0001";

  const ids = sh.getRange(2, 1, lastRow - 1, 1).getValues().flat().filter(Boolean);
  let max = 0;

  ids.forEach(id => {
    const n = Number(String(id).replace(/\D/g, ""));
    if (n > max) max = n;
  });

  return prefix + String(max + 1).padStart(4, "0");
}

function jsonResponse_(data, callback) {
  const json = JSON.stringify(data);
  const safeCallback = String(callback || "").replace(/[^\w.$]/g, "");

  if (safeCallback) {
    return ContentService
      .createTextOutput(`${safeCallback}(${json});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
