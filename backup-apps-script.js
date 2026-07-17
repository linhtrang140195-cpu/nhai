/**
 * NHAI DAY — Google Apps Script for Supabase Backup
 *
 * SETUP:
 * 1. Mở Google Sheet backup → Extensions → Apps Script
 * 2. Paste toàn bộ code này vào
 * 3. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone (hoặc Anyone within Garena)
 * 4. Copy URL deployment → paste vào admin (Cài đặt site → Backup Sheet URL)
 * 5. Chạy function setupDailyBackup() 1 lần để cài trigger tự động hàng ngày
 */

var SB_URL = 'https://xmtxdfeengpbapgudprx.supabase.co';
var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdHhkZmVlbmdwYmFwZ3VkcHJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MDg0MTAsImV4cCI6MjA5OTE4NDQxMH0.NNePCWoFDuRWmeDI01FK5XOF9IbQq4E3H6wJEju-tRY';

// ===== SYNC: Fetch trực tiếp từ Supabase và ghi vào Sheet =====
function syncFromSupabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tables = [
    { name: 'registrations', path: 'registrations?order=created_at.desc&limit=5000' },
    { name: 'site_config', path: 'site_config' },
    { name: 'season_stats', path: 'season_stats?order=season_id' },
    { name: 'mentors', path: 'mentors?is_active=eq.true&order=display_order' },
    { name: 'events', path: 'events?order=display_order' },
    { name: 'faqs', path: 'faqs?is_active=eq.true&order=display_order' }
  ];

  var errors = [];
  var totalRegs = 0;

  for (var i = 0; i < tables.length; i++) {
    try {
      var res = UrlFetchApp.fetch(SB_URL + '/rest/v1/' + tables[i].path, {
        headers: {
          'apikey': SB_KEY,
          'Authorization': 'Bearer ' + SB_KEY
        },
        muteHttpExceptions: true
      });

      if (res.getResponseCode() === 200) {
        var rows = JSON.parse(res.getContentText());
        if (rows && rows.length > 0) {
          writeSheet(ss, tables[i].name, rows);
          if (tables[i].name === 'registrations') totalRegs = rows.length;
        }
      } else {
        errors.push(tables[i].name + ': HTTP ' + res.getResponseCode());
      }
    } catch (err) {
      errors.push(tables[i].name + ': ' + err.toString());
    }
  }

  // Ghi meta
  var metaSheet = getOrCreateSheet(ss, '_meta');
  metaSheet.getRange('A1').setValue('last_backup');
  metaSheet.getRange('B1').setValue(new Date().toISOString());
  metaSheet.getRange('A2').setValue('total_registrations');
  metaSheet.getRange('B2').setValue(totalRegs);
  metaSheet.getRange('A3').setValue('source');
  metaSheet.getRange('B3').setValue('syncFromSupabase');
  metaSheet.getRange('A4').setValue('errors');
  metaSheet.getRange('B4').setValue(errors.length ? errors.join('; ') : 'none');

  Logger.log('Sync done. Regs: ' + totalRegs + ', Errors: ' + errors.length);
  return { ok: errors.length === 0, regs: totalRegs, errors: errors };
}

// ===== TRIGGER: Cài backup tự động hàng ngày lúc 2:00 AM =====
function setupDailyBackup() {
  // Xóa trigger cũ (nếu có)
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'syncFromSupabase') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  // Tạo trigger mới: chạy mỗi ngày lúc 2-3 AM
  ScriptApp.newTrigger('syncFromSupabase')
    .timeBased()
    .everyDays(1)
    .atHour(2)
    .create();
  Logger.log('Daily backup trigger installed (2:00 AM)');
}

// ===== doPost: nhận data từ Admin và ghi vào sheet =====
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    var tables = ['registrations','site_config','season_stats','mentors','events','faqs','seasons','awards','award_categories','cases','top_pick_campaigns','top_pick_votes'];
    for (var i = 0; i < tables.length; i++) {
      if (data[tables[i]] && data[tables[i]].length) writeSheet(ss, tables[i], data[tables[i]]);
    }

    var metaSheet = getOrCreateSheet(ss, '_meta');
    metaSheet.getRange('A1').setValue('last_backup');
    metaSheet.getRange('B1').setValue(new Date().toISOString());
    metaSheet.getRange('A2').setValue('total_registrations');
    metaSheet.getRange('B2').setValue(data.registrations ? data.registrations.length : 0);
    metaSheet.getRange('A3').setValue('source');
    metaSheet.getRange('B3').setValue('doPost (admin)');

    return ContentService
      .createTextOutput(JSON.stringify({ok: true, timestamp: new Date().toISOString()}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ok: false, error: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ===== doGet: website fallback đọc data từ sheet =====
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var table = (e && e.parameter && e.parameter.table) || 'all';
    var result = {};

    if (table === 'all' || table === 'registrations') result.registrations = readSheet(ss, 'registrations');
    if (table === 'all' || table === 'site_config') result.site_config = readSheet(ss, 'site_config');
    if (table === 'all' || table === 'season_stats') result.season_stats = readSheet(ss, 'season_stats');
    if (table === 'all' || table === 'mentors') result.mentors = readSheet(ss, 'mentors');
    if (table === 'all' || table === 'events') result.events = readSheet(ss, 'events');
    if (table === 'all' || table === 'faqs') result.faqs = readSheet(ss, 'faqs');

    var metaSheet = ss.getSheetByName('_meta');
    if (metaSheet) {
      result._meta = {
        last_backup: metaSheet.getRange('B1').getValue(),
        total_registrations: metaSheet.getRange('B2').getValue()
      };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({error: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ===== HELPERS =====
function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

function writeSheet(ss, name, rows) {
  if (!rows || !rows.length) return;
  var sheet = getOrCreateSheet(ss, name);
  sheet.clear();

  var headers = Object.keys(rows[0]);
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');

  var data = rows.map(function(row) {
    return headers.map(function(h) {
      var v = row[h];
      if (v === null || v === undefined) return '';
      if (typeof v === 'object') return JSON.stringify(v);
      return v;
    });
  });

  if (data.length > 0) {
    sheet.getRange(2, 1, data.length, headers.length).setValues(data);
  }

  for (var i = 1; i <= headers.length; i++) {
    sheet.autoResizeColumn(i);
  }
}

function readSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      var val = data[i][j];
      if (val === '') val = null;
      row[headers[j]] = val;
    }
    rows.push(row);
  }
  return rows;
}
