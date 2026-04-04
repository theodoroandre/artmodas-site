/**
 * LOJACTRL — Google Apps Script Backend
 *
 * SETUP:
 * 1. Create a Google Sheet
 * 2. Open Extensions > Apps Script, paste this code
 * 3. Run setupSheets() once to create tabs
 * 4. Run setPassword() once to set your secret password
 * 5. Deploy > New deployment > Web app > Execute as "Me", access "Anyone"
 * 6. Copy the deployment URL and paste it in the app's config
 */

const SHEET_NAMES = ['Produtos', 'Clientes', 'Vendas', 'Parcelamentos', 'Movimentacoes'];

// ---- Password ----

/**
 * Run this function manually to set your password.
 * Go to: Run > setPassword
 * It will prompt you for a password and store it securely in Script Properties.
 */
function setPassword() {
  var ui = SpreadsheetApp.getUi();
  var result = ui.prompt('LOJACTRL Setup', 'Digite a senha de acesso ao sistema:', ui.ButtonSet.OK_CANCEL);
  if (result.getSelectedButton() === ui.Button.OK) {
    var pwd = result.getResponseText().trim();
    if (!pwd) { ui.alert('Senha não pode ser vazia.'); return; }
    PropertiesService.getScriptProperties().setProperty('LOJACTRL_PWD', pwd);
    ui.alert('Senha salva com sucesso!');
  }
}

function checkAuth(pwd) {
  var stored = PropertiesService.getScriptProperties().getProperty('LOJACTRL_PWD');
  if (!stored) return true; // no password set = open access (backwards compat)
  return pwd === stored;
}

// ---- Helpers ----

function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange('A1').setValue('data');
    sheet.getRange('A2').setValue('[]');
  }
  return sheet;
}

function readData(sheetName) {
  const sheet = getSheet(sheetName);
  const val = sheet.getRange('A2').getValue();
  if (!val) return [];
  try { return JSON.parse(val); } catch (e) { return []; }
}

function writeData(sheetName, data) {
  const sheet = getSheet(sheetName);
  sheet.getRange('A2').setValue(JSON.stringify(data));
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---- API Endpoints ----

function doGet(e) {
  try {
    var pwd = (e.parameter && e.parameter.pwd) || '';
    if (!checkAuth(pwd)) return jsonResponse({ ok: false, error: 'auth' });

    var action = (e.parameter && e.parameter.action) || 'readAll';

    if (action === 'readAll') {
      var result = {};
      SHEET_NAMES.forEach(function(name) {
        result[name] = readData(name);
      });
      return jsonResponse({ ok: true, data: result });
    }

    if (action === 'read') {
      var sheet = e.parameter.sheet;
      if (!sheet) return jsonResponse({ ok: false, error: 'Missing sheet parameter' });
      return jsonResponse({ ok: true, data: readData(sheet) });
    }

    return jsonResponse({ ok: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message });
  }
}

function doPost(e) {
  try {
    var body;
    try { body = JSON.parse(e.postData.contents); } catch (err) {
      return jsonResponse({ ok: false, error: 'Invalid JSON body' });
    }

    if (!checkAuth(body.pwd || '')) return jsonResponse({ ok: false, error: 'auth' });

    var action = body.action || 'writeAll';

    if (action === 'writeAll') {
      var data = body.data;
      if (!data) return jsonResponse({ ok: false, error: 'Missing data' });
      SHEET_NAMES.forEach(function(name) {
        if (data[name] !== undefined) writeData(name, data[name]);
      });
      return jsonResponse({ ok: true });
    }

    if (action === 'write') {
      var sheetName = body.sheet;
      var sheetData = body.data;
      if (!sheetName || sheetData === undefined) {
        return jsonResponse({ ok: false, error: 'Missing sheet or data' });
      }
      writeData(sheetName, sheetData);
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ ok: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message });
  }
}

// ---- Manual Setup Helper ----
function setupSheets() {
  SHEET_NAMES.forEach(function(name) { getSheet(name); });
  SpreadsheetApp.getActiveSpreadsheet().toast('All tabs created!', 'LOJACTRL Setup', 5);
}
