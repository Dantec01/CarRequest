/**
 * CarRequest - API en Google Apps Script (Google Sheets como base de datos)
 *
 * INSTALACION
 * 1. Crea una hoja de Google Sheets nueva (ej. "CarRequest").
 * 2. Extensiones > Apps Script. Borra el codigo de ejemplo y pega este archivo.
 * 3. Ejecuta la funcion setup() una vez (te pedira permisos).
 *    Crea la hoja "Pedidos" con sus columnas y genera el TOKEN.
 *    Ver > Registros de ejecucion: ahi aparece el TOKEN. Guardalo.
 * 4. Implementar > Nueva implementacion > Tipo: Aplicacion web
 *    - Ejecutar como: Yo
 *    - Quien tiene acceso: Cualquier persona
 *    Copia la URL que termina en /exec.
 * 5. Si cambias el codigo despues: Implementar > Administrar implementaciones >
 *    editar > Version nueva. (La URL se mantiene.)
 *
 * USO (desde la web)
 * - Leer:    GET  <URL>?token=TOKEN              -> { ok, version, cambios, items }
 * - Leer si hubo cambios: GET <URL>?token=TOKEN&since=VERSION
 *            -> { ok, cambios:false, version } si no cambio nada (respuesta barata)
 * - Escribir: POST <URL> con cuerpo JSON y Content-Type "text/plain"
 *            (evita el preflight de CORS). Cuerpo: { token, accion, ... }
 *     crear         { accion:"crear", item:{ dia, modelo, ... } }
 *     editar        { accion:"editar", id, item:{ campos a cambiar, y opcional dia } }
 *     eliminar      { accion:"eliminar", id }
 *     copiar        { accion:"copiar", id, dias:["martes","jueves"] }
 *     copiarSemana  { accion:"copiarSemana", id }   // a todos los demas dias
 *     crearVarios   { accion:"crearVarios", items:[{...}, ...], dias:["lunes", ...] }
 *                   // una fila por modelo x dia, en una sola peticion (max. 20 items)
 *   Toda escritura responde { ok, version, resultado, items } con el tablero ya
 *   actualizado, para refrescar la pantalla sin otra peticion.
 */

const HOJA = 'Pedidos';
const COLUMNAS = ['id', 'dia', 'modelo', 'subasta', 'chasis', 'anio', 'grado', 'km', 'color', 'puntaje', 'precio', 'nota', 'orden', 'actualizado'];
const CAMPOS_EDITABLES = ['modelo', 'subasta', 'chasis', 'anio', 'grado', 'km', 'color', 'puntaje', 'precio', 'nota'];
const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const MAX_TEXTO = 500;

// ---------- Configuracion inicial ----------

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName(HOJA) || ss.insertSheet(HOJA);
  // Todo como texto para que Sheets no convierta "3.5", "4 C-C" o "1/2" en fechas o numeros.
  hoja.getRange(1, 1, hoja.getMaxRows(), COLUMNAS.length).setNumberFormat('@');
  hoja.getRange(1, 1, 1, COLUMNAS.length).setValues([COLUMNAS]).setFontWeight('bold');
  hoja.setFrozenRows(1);

  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('TOKEN')) {
    props.setProperty('TOKEN', Utilities.getUuid().replace(/-/g, ''));
  }
  if (!props.getProperty('VERSION')) {
    props.setProperty('VERSION', String(Date.now()));
  }
  Logger.log('TOKEN: ' + props.getProperty('TOKEN'));
}

// ---------- Puntos de entrada ----------

function doGet(e) {
  try {
    const p = (e && e.parameter) || {};
    verificarToken_(p.token);
    const version = leerVersion_();
    if (p.since && p.since === version) {
      return json_({ ok: true, cambios: false, version: version });
    }
    return json_({ ok: true, cambios: true, version: version, items: leerTodo_() });
  } catch (err) {
    return json_({ ok: false, error: mensaje_(err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    verificarToken_(body.token);
    lock.waitLock(10000);

    let resultado;
    switch (body.accion) {
      case 'crear':
        resultado = crear_(body.item || {});
        break;
      case 'editar':
        resultado = editar_(body.id, body.item || {});
        break;
      case 'eliminar':
        resultado = eliminar_(body.id);
        break;
      case 'copiar':
        resultado = copiar_(body.id, body.dias);
        break;
      case 'copiarSemana':
        resultado = copiarSemana_(body.id);
        break;
      case 'crearVarios':
        resultado = crearVarios_(body.items, body.dias);
        break;
      default:
        throw new Error('Accion no valida');
    }

    const version = String(Date.now());
    PropertiesService.getScriptProperties().setProperty('VERSION', version);
    return json_({ ok: true, version: version, resultado: resultado, items: leerTodo_() });
  } catch (err) {
    return json_({ ok: false, error: mensaje_(err) });
  } finally {
    try { lock.releaseLock(); } catch (_) { /* no tenia el lock */ }
  }
}

// ---------- Acciones ----------

function crear_(item) {
  const dia = validarDia_(item.dia);
  const id = Utilities.getUuid();
  hoja_().appendRow(armarFila_(id, dia, item, siguienteOrden_(dia)));
  return { id: id };
}

function editar_(id, item) {
  const fila = buscarFila_(id);
  if (fila < 0) throw new Error('Pedido no encontrado');
  const hoja = hoja_();
  const actual = hoja.getRange(fila, 1, 1, COLUMNAS.length).getValues()[0];
  const obj = filaAObjeto_(actual);

  CAMPOS_EDITABLES.forEach(function (campo) {
    if (Object.prototype.hasOwnProperty.call(item, campo)) obj[campo] = texto_(item[campo]);
  });
  if (item.dia && validarDia_(item.dia) !== obj.dia) {
    obj.dia = item.dia;
    obj.orden = String(siguienteOrden_(obj.dia));
  }
  obj.actualizado = new Date().toISOString();

  hoja.getRange(fila, 1, 1, COLUMNAS.length).setValues([COLUMNAS.map(function (c) { return obj[c]; })]);
  return { id: id };
}

function eliminar_(id) {
  const fila = buscarFila_(id);
  if (fila < 0) throw new Error('Pedido no encontrado');
  hoja_().deleteRow(fila);
  return { id: id };
}

function copiar_(id, dias) {
  const fila = buscarFila_(id);
  if (fila < 0) throw new Error('Pedido no encontrado');
  if (!Array.isArray(dias) || dias.length === 0) throw new Error('Indica al menos un dia');

  const origen = filaAObjeto_(hoja_().getRange(fila, 1, 1, COLUMNAS.length).getValues()[0]);
  return { ids: agregarFilas_([origen], dias) };
}
function copiarSemana_(id) {
  const fila = buscarFila_(id);
  if (fila < 0) throw new Error('Pedido no encontrado');
  const origen = filaAObjeto_(hoja_().getRange(fila, 1, 1, COLUMNAS.length).getValues()[0]);
  const resto = DIAS.filter(function (d) { return d !== origen.dia; });
  return copiar_(id, resto);
}

/**
 * Crea varios pedidos de una vez: una fila por cada combinacion modelo x dia.
 * Sirve para "varios modelos con los mismos datos" (el + junto a Modelo).
 * items: [{ modelo, subasta, ... }, ...]   dias: ["lunes", ...] (por defecto, lunes)
 */
function crearVarios_(items, dias) {
  if (!Array.isArray(items) || items.length === 0) throw new Error('Indica al menos un pedido');
  if (items.length > 20) throw new Error('Maximo 20 pedidos a la vez');
  const lista = Array.isArray(dias) && dias.length > 0 ? dias : ['lunes'];
  return { ids: agregarFilas_(items, lista) };
}

/**
 * Agrega una fila por cada combinacion item x dia con una sola lectura y una sola
 * escritura. Devuelve los ids creados.
 */
function agregarFilas_(items, dias) {
  const unicos = dias
    .filter(function (d, i) { return dias.indexOf(d) === i; })
    .map(validarDia_);

  const orden = ordenMaximo_();
  const filas = [];
  const ids = [];
  unicos.forEach(function (dia) {
    let n = orden[dia] || 0;
    items.forEach(function (item) {
      n += 1;
      const id = Utilities.getUuid();
      filas.push(armarFila_(id, dia, item || {}, n));
      ids.push(id);
    });
  });

  const hoja = hoja_();
  const inicio = hoja.getLastRow() + 1;
  const falta = inicio + filas.length - 1 - hoja.getMaxRows();
  if (falta > 0) hoja.insertRowsAfter(hoja.getMaxRows(), falta);
  const rango = hoja.getRange(inicio, 1, filas.length, COLUMNAS.length);
  rango.setNumberFormat('@');
  rango.setValues(filas);
  return ids;
}
// ---------- Utilidades ----------

function hoja_() {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA);
  if (!hoja) throw new Error('Falta la hoja "' + HOJA + '". Ejecuta setup().');
  return hoja;
}

function leerTodo_() {
  const hoja = hoja_();
  const ultima = hoja.getLastRow();
  if (ultima < 2) return [];
  const valores = hoja.getRange(2, 1, ultima - 1, COLUMNAS.length).getValues();
  return valores
    .filter(function (f) { return f[0] !== ''; })
    .map(filaAObjeto_)
    .sort(function (a, b) {
      const d = DIAS.indexOf(a.dia) - DIAS.indexOf(b.dia);
      return d !== 0 ? d : Number(a.orden) - Number(b.orden);
    });
}

function filaAObjeto_(fila) {
  const obj = {};
  COLUMNAS.forEach(function (c, i) { obj[c] = fila[i] == null ? '' : String(fila[i]); });
  return obj;
}

function armarFila_(id, dia, item, orden) {
  const obj = { id: id, dia: dia, orden: String(orden), actualizado: new Date().toISOString() };
  CAMPOS_EDITABLES.forEach(function (c) { obj[c] = texto_(item[c]); });
  return COLUMNAS.map(function (c) { return obj[c]; });
}

function buscarFila_(id) {
  if (!id) return -1;
  const hoja = hoja_();
  const ultima = hoja.getLastRow();
  if (ultima < 2) return -1;
  const ids = hoja.getRange(2, 1, ultima - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  return -1;
}

/** Mayor orden usado por dia, leyendo solo las columnas dia y orden. */
function ordenMaximo_() {
  const hoja = hoja_();
  const ultima = hoja.getLastRow();
  const max = {};
  if (ultima < 2) return max;
  const iDia = COLUMNAS.indexOf('dia') + 1;
  const iOrden = COLUMNAS.indexOf('orden') + 1;
  const dias = hoja.getRange(2, iDia, ultima - 1, 1).getValues();
  const ordenes = hoja.getRange(2, iOrden, ultima - 1, 1).getValues();
  for (let i = 0; i < dias.length; i++) {
    const n = Number(ordenes[i][0]) || 0;
    if (n > (max[dias[i][0]] || 0)) max[dias[i][0]] = n;
  }
  return max;
}

function siguienteOrden_(dia) {
  return (ordenMaximo_()[dia] || 0) + 1;
}
function validarDia_(dia) {
  if (DIAS.indexOf(dia) < 0) throw new Error('Dia no valido: ' + dia);
  return dia;
}

function texto_(valor) {
  return valor == null ? '' : String(valor).slice(0, MAX_TEXTO);
}

function leerVersion_() {
  return PropertiesService.getScriptProperties().getProperty('VERSION') || '0';
}

function verificarToken_(token) {
  const esperado = PropertiesService.getScriptProperties().getProperty('TOKEN');
  if (!esperado || token !== esperado) throw new Error('No autorizado');
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function mensaje_(err) {
  return String((err && err.message) || err);
}
