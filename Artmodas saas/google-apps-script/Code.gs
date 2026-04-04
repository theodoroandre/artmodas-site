/**
 * LOJACTRL — Google Apps Script Backend
 *
 * This script turns a Google Sheet into a REST API for the LOJACTRL app.
 * Each sheet tab stores one data collection as JSON rows.
 *
 * SETUP:
 * 1. Create a Google Sheet with these tabs: Produtos, Clientes, Vendas, Parcelamentos, Movimentacoes
 * 2. Open Extensions > Apps Script, paste this code
 * 3. Deploy > New deployment > Web app > Execute as "Me", access "Anyone"
 * 4. Copy the deployment URL and paste it in the app's config
 */

const SHEET_NAMES = ['Produtos', 'Clientes', 'Vendas', 'Parcelamentos', 'Movimentacoes'];

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
  try {
    return JSON.parse(val);
  } catch (e) {
    return [];
  }
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
    const action = (e.parameter && e.parameter.action) || 'readAll';

    if (action === 'readAll') {
      const result = {};
      SHEET_NAMES.forEach(function(name) {
        result[name] = readData(name);
      });
      return jsonResponse({ ok: true, data: result });
    }

    if (action === 'read') {
      const sheet = e.parameter.sheet;
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
    try {
      body = JSON.parse(e.postData.contents);
    } catch (err) {
      return jsonResponse({ ok: false, error: 'Invalid JSON body' });
    }

    var action = body.action || 'writeAll';

    if (action === 'writeAll') {
      // Expects body.data = { Produtos: [...], Clientes: [...], ... }
      var data = body.data;
      if (!data) return jsonResponse({ ok: false, error: 'Missing data' });
      SHEET_NAMES.forEach(function(name) {
        if (data[name] !== undefined) {
          writeData(name, data[name]);
        }
      });
      return jsonResponse({ ok: true });
    }

    if (action === 'write') {
      // Expects body.sheet and body.data
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
// Run this once to create all tabs
function setupSheets() {
  SHEET_NAMES.forEach(function(name) {
    getSheet(name);
  });
  SpreadsheetApp.getActiveSpreadsheet().toast('All tabs created!', 'LOJACTRL Setup', 5);
}
