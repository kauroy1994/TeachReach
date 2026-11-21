/**
 * TeachReach shared question register · University of Alabama.
 * Free Google Apps Script + private Google Sheet backend.
 * Deploy as Web app / Execute as Me / Who has access: Anyone.
 * The public listing never returns student email addresses.
 */
const TEACHREACH_SHEET_ID = '1i5se-ApkNFNxh1cRSx7oI1DN8K65RaNbPb2ohesbLZI';
const TEACHREACH_SHEET_NAME = 'Questions';
const TEACHREACH_PARENT_ORIGIN = 'https://kauroy1994.github.io';
const TEACHREACH_MODULES = ['module-01', 'module-02', 'module-03'];

function getQuestionSheet_() {
  const sheet = SpreadsheetApp.openById(TEACHREACH_SHEET_ID).getSheetByName(TEACHREACH_SHEET_NAME);
  if (!sheet) throw new Error('Questions tab was not found');
  return sheet;
}
function field_(value, limit) {
  return String(value || '').trim().replace(/[\u0000-\u001f]/g, ' ').slice(0, limit);
}
function sheetValue_(value) {
  const s = String(value || '');
  return /^[\s]*[=+@-]/.test(s) ? "'" + s : s;
}
function publicName_(fullName) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'Student';
  return parts[0].slice(0, 35) + (parts.length > 1 ? ' ' + parts[parts.length - 1][0].toUpperCase() + '.' : '');
}
function publicQuestions_(module) {
  const sh = getQuestionSheet_();
  const last = sh.getLastRow();
  if (last < 2) return [];
  const rows = sh.getRange(2, 1, last - 1, 11).getValues();
  return rows.filter(r => r[3] === module && String(r[9]).toLowerCase() === 'pending')
    .map(r => ({ date: r[0] instanceof Date ? r[0].toISOString() : r[0], id: String(r[1]),
      student: String(r[6]), lesson: String(r[7]), question: String(r[8]), status:'Awaiting answer' }))
    .reverse().slice(0, 150);
}
function doGet(e) {
  const callback = String((e && e.parameter && e.parameter.callback) || '');
  if (!/^[A-Za-z_$][A-Za-z0-9_$]{0,90}$/.test(callback)) {
    return ContentService.createTextOutput(JSON.stringify({ok:false,error:'Invalid callback'}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  const module = field_(e && e.parameter && e.parameter.module,30);
  const result = {ok:true,items:TEACHREACH_MODULES.includes(module) ? publicQuestions_(module) : []};
  // JSONP allows a static GitHub Pages site to read the public, email-free queue.
  return ContentService.createTextOutput(callback + '(' + JSON.stringify(result) + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
function receipt_(result) {
  // A cross-origin hidden iframe responds to the GitHub Pages parent via postMessage.
  const json = JSON.stringify(result).replace(/</g,'\\u003c');
  const script = '<!doctype html><html><body><script>window.parent.postMessage(' + json + ', ' +
      JSON.stringify(TEACHREACH_PARENT_ORIGIN) + ');<\\/script></body></html>';
  return HtmlService.createHtmlOutput(script.replace('<\\/script>', '</script>'));
}
function doPost(e) {
  const p = e && e.parameter ? e.parameter : {};
  const nonce = field_(p.nonce, 64);
  const receipt = {type:'teachreach-question-result',nonce,ok:false};
  try {
    if (p.website) return receipt_(receipt); // Honeypot
    const name = field_(p.name, 80), email = field_(p.email, 160), question = field_(p.question, 650);
    const lesson = field_(p.lesson, 50), module = field_(p.module, 30);
    if (name.length < 2 || question.length < 8 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return receipt_(receipt);
    if (!TEACHREACH_MODULES.includes(module) || !nonce || !lesson) return receipt_(receipt);
    const lock = LockService.getScriptLock(); lock.waitLock(12000);
    try {
      const sh = getQuestionSheet_();
      const id = 'TR-' + Utilities.getUuid().slice(0,8).toUpperCase();
      sh.appendRow([new Date(),id,'ml-foundations',module,sheetValue_(name),sheetValue_(email),
        sheetValue_(publicName_(name)),sheetValue_(lesson),sheetValue_(question),'pending','']);
      receipt.ok = true; receipt.id = id;
    } finally { lock.releaseLock(); }
  } catch(err) { console.error('TeachReach registration failed',err); }
  return receipt_(receipt);
}
