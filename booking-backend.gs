/**
 * Smart Business Consultancy Firm - booking backend (Google Apps Script)
 *
 * Saves each booking as a row in the Google Sheet this script is attached to,
 * refuses a time that is already booked, and tells the website which times are taken.
 * Setup steps are in SETUP-GUIDE.md.
 */

var OWNER_EMAIL = "smartbusiness880@gmail.com"; // gets an email for each new booking. Use "" to turn off.
var SHEET_NAME  = "Bookings";
var FIRST_HOUR  = 10;      // first slot starts at 10:00
var LAST_HOUR   = 16;      // last slot starts at 16:00 (ends 17:00). Must match the website.
var CLOSED_DAYS = [5];     // 0 = Sunday ... 5 = Friday. Must match the website.
var TZ          = "Asia/Dhaka";
var MAX_PER_PHONE_PER_HOUR = 5;

var HEADERS = ["Timestamp","Booking ID","Date","Hour","Time","Service","Name","Phone","Note","Language","Status"];

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange("C:D").setNumberFormat("@"); // keep date and hour as plain text
    sh.getRange("H:H").setNumberFormat("@"); // keep the leading 0 of phone numbers
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function dateText_(v) {
  return v instanceof Date ? Utilities.formatDate(v, TZ, "yyyy-MM-dd") : String(v);
}

function takenHours_(sh, date) {
  var last = sh.getLastRow();
  if (last < 2) return [];
  var rows = sh.getRange(2, 1, last - 1, HEADERS.length).getValues();
  var out = [];
  for (var i = 0; i < rows.length; i++) {
    var status = String(rows[i][10]).toLowerCase();
    if (dateText_(rows[i][2]) === date && status !== "cancelled") out.push(parseInt(rows[i][3], 10));
  }
  return out;
}

function validSlot_(date, hour) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  if (typeof hour !== "number" || hour % 1 !== 0 || hour < FIRST_HOUR || hour > LAST_HOUR) return false;
  var p = date.split("-");
  var d = new Date(+p[0], +p[1] - 1, +p[2]);
  if (isNaN(d.getTime()) || d.getFullYear() !== +p[0] || d.getMonth() !== +p[1] - 1 || d.getDate() !== +p[2]) return false;
  if (CLOSED_DAYS.indexOf(d.getDay()) > -1) return false;
  var today = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd");
  if (date < today) return false;
  if (date === today && hour <= parseInt(Utilities.formatDate(new Date(), TZ, "H"), 10)) return false;
  return true;
}

function clean_(v, max) {
  v = String(v == null ? "" : v).replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
  return /^[=+\-@]/.test(v) ? "'" + v : v; // stop spreadsheet formulas
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action === "slots" && /^\d{4}-\d{2}-\d{2}$/.test(p.date || "")) {
    return json_({ ok: true, taken: takenHours_(sheet_(), p.date) });
  }
  return json_({ ok: true, service: "booking" });
}

function doPost(e) {
  var data;
  try { data = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: "invalid" }); }
  if (data.website) return json_({ ok: true, id: "SB-000000" }); // hidden field filled in: a bot, pretend it worked

  var date = String(data.date || ""), hour = data.hour;
  var name = clean_(data.name, 80), service = clean_(data.service, 80), note = clean_(data.note, 500);
  var phone = String(data.phone || "").replace(/[\s-]/g, "");
  if (!validSlot_(date, hour) || !name || !/^(\+?88)?01[3-9]\d{8}$/.test(phone)) {
    return json_({ ok: false, error: "invalid" });
  }

  var cache = CacheService.getScriptCache(), key = "ph" + phone;
  var count = parseInt(cache.get(key) || "0", 10);
  if (count >= MAX_PER_PHONE_PER_HOUR) return json_({ ok: false, error: "rate" });

  var lock = LockService.getScriptLock();
  try { lock.waitLock(20000); } catch (err) { return json_({ ok: false, error: "busy" }); }
  try {
    var sh = sheet_();
    if (takenHours_(sh, date).indexOf(hour) > -1) return json_({ ok: false, error: "taken" });
    var id = "SB-" + Utilities.getUuid().replace(/-/g, "").slice(0, 6).toUpperCase();
    var label = (hour % 12 === 0 ? 12 : hour % 12) + ":00 " + (hour < 12 ? "AM" : "PM");
    sh.appendRow([new Date(), id, date, String(hour), label, service, name, phone, note, clean_(data.lang, 5), "New"]);
    cache.put(key, String(count + 1), 3600);
    if (OWNER_EMAIL) {
      try {
        MailApp.sendEmail(OWNER_EMAIL, "New booking " + id + ": " + date + " " + label,
          "Booking ID: " + id + "\nDate: " + date + "\nTime: " + label + "\nService: " + service +
          "\nName: " + name + "\nPhone: " + phone + "\nNote: " + note + "\nLanguage: " + clean_(data.lang, 5));
      } catch (mailErr) { /* booking is saved even if email fails */ }
    }
    return json_({ ok: true, id: id });
  } finally {
    lock.releaseLock();
  }
}
