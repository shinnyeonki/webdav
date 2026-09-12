// 인프로세스 brute-force 가드. worker 공유 상태는 slab 공유 사전으로.
// watch(틀린 횟수, TTL 없음, number) / ban(차단 표시, 1d, string).
// 셀 수 있는 건 틀린 비번뿐: Authorization 없는 401(핸드셰이크)은 세지 않는다.
function key(r) {
  return (r.remoteAddress || '').replace(/[^0-9a-fA-F:.]/g, '');
}
function hasAuth(r) {
  for (var k in r.headersIn) {
    if (k.toLowerCase() === 'authorization') return true;
  }
  return false;
}
// js_set $guard_banned. 매 요청 gate. ban 존재 확인 1회.
function is_banned(r) {
  try {
    if (r.uri === '/_failcount') return '';
    return ngx.shared.ban.has(key(r)) ? '1' : '';
  } catch (e) { return ''; }
}
// error_page 401 → js_content. 세고 401을 그대로 재발행.
function count(r) {
  var max = parseInt(r.variables.guard_max || '5', 10);
  try {
    if (hasAuth(r)) {
      var n = ngx.shared.watch.incr(key(r), 1, 0);
      if (n >= max) {
        ngx.shared.watch.delete(key(r));
        ngx.shared.ban.set(key(r), '1');
      }
    }
  } catch (e) {}
  r.headersOut['WWW-Authenticate'] = 'Basic realm="WebDAV"';
  r.headersOut['Content-Type'] = 'text/html';
  r.return(401, '<html><head><title>401 Authorization Required</title></head><body><center><h1>401 Authorization Required</h1></center></body></html>');
}
// js_header_filter. 인증 성공 응답이면 watch에서 강등.
// filter는 반환만 한다. r.sendHeader()를 호출하면 응답이 죽는다(실측). 
function observe(r) {
  try {
    if (r.variables.remote_user) ngx.shared.watch.delete(key(r));
  } catch (e) {}
}
// 부팅 자가진단: zone 미선언·타입 오류면 throw → 기동 실패 (무보호 가동 불가).
// 모듈 최상위는 요청별 VM clone마다 재실행되므로 slab 쓰기 없이 형태만 읽는다(쓰면 경합+매요청 오버헤드).
(function () {
  var sh = (typeof ngx !== 'undefined' && ngx.shared) || null;
  if (!sh || !sh.watch || !sh.ban) { throw new Error('guard: shared zone missing'); }
  if (sh.watch.type !== 'number') { throw new Error('guard: watch must be number'); }
  if (typeof sh.watch.incr !== 'function') { throw new Error('guard: SharedDict NG'); }
})();
export default { is_banned: is_banned, count: count, observe: observe };
