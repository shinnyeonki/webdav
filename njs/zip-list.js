// 폴더 다운로드: njs 목록 생성 -> 내부 proxy 홉 -> mod_zip 스트리밍.
// mod_zip은 upstream 응답의 X-Archive-Files에서만 발동하고,
// njs 직접 응답(js_content)에 붙이면 워커가 죽으므로 temp 파일 + proxy를 태운다.
import fs from 'fs';

var DATA_ROOT = '/data';
var TMP_DIR = '/tmp/ziplist';
var FILE_PREFIX = '/_zipfile/';
var TMP_TTL_MS = 10 * 60 * 1000;

function bad(r, code, msg) { r.return(code, msg + '\n'); }

function cleanName(s) {
  return String(s).replace(/["\r\n]/g, '').slice(0, 128) || 'download';
}

// GET /_zip/download?path=/상대/폴더 -> X-Accel-Redirect /_zipasm
function download(r) {
  var rel = r.args.path || '/';
  if (rel.indexOf('\0') !== -1) { bad(r, 400, 'bad path'); return; }
  var parts = rel.split('/').filter(function (p) { return p && p !== '.'; });
  for (var i = 0; i < parts.length; i++) {
    if (parts[i] === '..') { bad(r, 400, 'path escape'); return; }
  }
  var fsPath = DATA_ROOT + (parts.length ? '/' + parts.join('/') : '');
  var zipBase = parts.length ? parts[parts.length - 1] : 'root';

  try { fs.mkdirSync(TMP_DIR); } catch (e) { /* exists */ }
  sweep();

  var lines = [];
  function walk(dir, zipDir) {
    var names;
    try { names = fs.readdirSync(dir); } catch (e) { return; }
    for (var i = 0; i < names.length; i++) {
      var name = names[i];
      if (name === '.' || name === '..') { continue; }
      var full = dir.charAt(dir.length - 1) === '/' ? dir + name : dir + '/' + name;
      var st;
      try { st = fs.statSync(full); } catch (e) { continue; }
      var zipName = zipDir ? zipDir + '/' + name : name;
      if (st.isDirectory()) {
        lines.push('0 0 @directory ' + zipName);
        walk(full, zipName);
      } else if (st.isFile()) {
        var relPath = full.slice(DATA_ROOT.length + 1).split('/').map(encodeURIComponent).join('/');
        lines.push('- ' + st.size + ' ' + FILE_PREFIX + relPath + ' ' + zipName);
      }
    }
  }
  walk(fsPath, '');

  if (!lines.length) { bad(r, 404, 'empty or not found'); return; }

  var fname = 'l' + Date.now().toString(36) + Math.floor(Math.random() * 2176782336).toString(36) + '.txt';
  try {
    fs.writeFileSync(TMP_DIR + '/' + fname, lines.join('\n') + '\n');
  } catch (e) { bad(r, 500, 'tmp write failed'); return; }

  r.internalRedirect('/_zipasm?f=' + fname + '&n=' + encodeURIComponent(zipBase));
}

// internal: GET /_zipasm?f=..&n=.. 의 proxy 목적지. 목록 본문 반환.
// X-Archive-Files 헤더는 location의 add_header가 upstream 응답에 붙인다.
function listfile(r) {
  var f = r.args.f || '';
  if (!/^[A-Za-z0-9]+\.txt$/.test(f)) { bad(r, 400, 'bad file'); return; }
  var body;
  try {
    body = fs.readFileSync(TMP_DIR + '/' + f);
  } catch (e) { bad(r, 404, 'expired, retry download'); return; }
  r.headersOut['Content-Disposition'] = 'attachment; filename="' + cleanName(r.args.n || 'download') + '.zip"';
  r.return(200, body);
}

function sweep() {
  var now = Date.now();
  var names;
  try { names = fs.readdirSync(TMP_DIR); } catch (e) { return; }
  for (var i = 0; i < names.length; i++) {
    var full = TMP_DIR + '/' + names[i];
    try {
      var st = fs.statSync(full);
      if (now - st.mtime.getTime() > TMP_TTL_MS) { fs.unlinkSync(full); }
    } catch (e) { /* ignore */ }
  }
}

export default { download, listfile };
