'use strict';
/* WebDAV browser UI. Contract: ui.md. Vanilla, zero external requests.
 * Architecture: command map + dav-op helper + promise modal + shared upload loop.
 * All user-visible filenames use textContent only (XSS safe). */
(function () {
  var root = document.getElementById('wdb');
  if (!root) { return; }
  var home = location.pathname;

  if (!document.querySelector('meta[name="viewport"]')) {
    var vp = document.createElement('meta');
    vp.name = 'viewport';
    vp.content = 'width=device-width, initial-scale=1';
    document.head.appendChild(vp);
  }

  /* ---------- tiny dom ---------- */

  function $(sel, base) { return (base || document).querySelector(sel); }
  function $all(sel, base) { return Array.prototype.slice.call((base || document).querySelectorAll(sel)); }
  function txt(s) { return document.createTextNode(s == null ? '' : String(s)); }
  function node(tag, cls, kids) {
    var n = document.createElement(tag);
    if (cls) { n.className = cls; }
    (kids || []).forEach(function (k) { if (k) { n.appendChild(k); } });
    return n;
  }
  function btn(label, cls, fn) {
    var b = node('button', cls || '', [txt(label)]);
    if (fn) { b.addEventListener('click', fn); }
    return b;
  }
  // shell.html 내장 Lucide 스프라이트(외부 요청 없음). svg/use는 네임스페이스 필수.
  var SVGNS = 'http://www.w3.org/2000/svg';
  function icon(n) {
    var s = document.createElementNS(SVGNS, 'svg');
    s.setAttribute('class', 'ico');
    s.classList.add('ic-' + n);
    var u = document.createElementNS(SVGNS, 'use');
    u.setAttribute('href', '#i-' + n);
    s.appendChild(u);
    return s;
  }
  function ibtn(label, cls, ic, fn) {
    var b = btn(label, cls, fn);
    b.insertBefore(icon(ic), b.firstChild);
    return b;
  }
  // 글자 없는 아이콘 버튼(!, ⋯).
  function iconBtn(ic, cls, title, fn) {
    var b = btn('', cls, fn);
    b.appendChild(icon(ic));
    if (title) { b.title = title; }
    return b;
  }
  // 상태 따라 아이콘이 바뀌는 버튼(헤더 =/×, 크게/작게).
  // 둘 다 넣고 보이는 쪽은 CSS(.show-side·.wide)가 고른다. JS는 상태 클래스만 건든다.
  function stateBtn(cls, icA, icB, title, fn) {
    var b = btn('', cls, fn);
    b.appendChild(icon(icA));
    b.appendChild(icon(icB));
    b.title = title;
    return b;
  }
  // 서버 MIME 판정 복제(nginx.conf와 동기화. 요청 0, 어긋남 0).
  // text/plain 1020개+기본 10개 + extless 이름은 conf에서 그대로 가져오고,
  // image/video/audio/archive는 기본 mime.types 실측이다.
  // DOC(pdf/doc/office/html)은 서버가 application/*·text/html을 주지만 문서 모양이 맞아 file-text로 본다(보기용 예외).
  var TEXT = ' css htm html htc jad mml shtml txt wml xml 1in 1m 1x 3in 3m 3p 3pm 3qt 3x 4dm 4gl 4th 6pl 6pm 8xp a51 abap ada adb ado adoc adp ads agc agda ah1 ah2 ahk ahkl aidl aj ak al aleo alg als ampl apex apib apl app arc arr as asax asc ascx asd asddls ash ashx asl asm asmx asp aspx astro asy au3 aug auk aux aw awk axd axi axs b bal baml bas bash bashrc bat bats bb bbcode bbx bdy be bf bi bib bibtex bicep bison blade blp bmx bones boo boot bpl bqn bro brs bru bs bsl bst bsv bzl c c++ c3 cairo cake capnp carbon cats cbl cbx cc ccp cdc cdf cds ceylon cfc cfm cfml cgi cginc ch chem chpl chs circom cirru cj cjs cjsx ck cl cl2 clar click clj cljc cljs cljscm cljx clp cls clue clw cmake cmd cnc cob cobol cocci coffee com cook coq cp cpp cppm cps cpy cql cr creole cs csc csd csh cshrc cshtml csx ctl ctp cts cu cue cuh curry cw cwl cxx cy cyp cypher d d2 dart das dats db2 dcl ddl decls dfm dfy dhall di djs dlm dm do doh dpr druby dsc dsl dsp dsr dtx duby dwl dyalog dyl dylan e ebuild ec ecl eclass eclxml ecr ect edge edgeql eh ejs el eliom eliomi elm elv em emacs envrc epsi eq erb erl es es6 esdl ets ex exrc exs eye f f03 f08 f77 f90 f95 factor fan fcgi fir fish flex flix flux fnc fnl for forth fp fpp fppi fr frag frg frm frt fs fsh fsi fst fsti fsx fth ftl ftlh fun fut fx fxh fy g g4 gaml gap gawk gco gcode gd gdb geo geom gf gi gjs gleam glf glsl glslf glslv gmi gml gms gno gnu gnus go god gohtml golo gotmpl gp grace groovy grt gs gsc gsh gsp gst gsx gtpl gts gvimrc gvy gyp gypi h h++ ha hack haml hats hb hbs hc hcl heex hexpat hh hhi hic hip hlean hlsl hlsli hoon hpp hqf hql hrl hs hsc hta hurl hx hxsl hxx hy i i3 i7x ice iced icl idc idr ig ihlp ijm ijs ik il ily imba inc ink inl ino ins intr io iol ipf ipp ipynb irbrc isl ispc iss ixx j j2 jac jade jai jake janet jav java jcl jflex jinja jinja2 jison jl jq jsb jscad jsfl jsh jslib jsm json jsp jspre jss jst jsx jte just k kak kid kit kk kojo krl ks ksh kshrc ksy kt ktm kts kv l lagda las lasso lasso8 lasso9 latte lbx ld lds lean leex leo less lex lfe lgt lhs lid lidr ligo linq liq liquid lisp livemd lkml ll lmi login lol lookml lp lpr ls lsl lslp lsp ltx lua luau lvlib lvproj ly m m2 m3 m4 ma mak make mako man mao marko mask mata matah matlab mawk maxpat mbt mc mch mcr md mdoc mdown mdwn mdx me metal metta mg minid mint mirah mjs mk mkd mkdn mkdown mkfile mkii mkiv mkvi ml ml4 mli mligo mlir mll mly mm mmd mmk mms mo mod mojo monkey moo moon move mpl mps mq4 mq5 mqh mrc ms msd msg mspec mss mt mtml mts mu mud muf mumps muse mxt myt mzn n nas nasl nasm nawk nb nbp nc ncl ne ned nf ni nim nimble nimrod nims nit nix njk njs nl nlogo no nomad nqp nr nse nsh nsi nss nu numpy numpyw numsc nut nvimrc ny ob2 odin ol ooc opa opal opencl opy orc org os ox oxh oxo oz p p4 p6 p6l p6m p8 pac pact pan parrot pas pascal pasm pat pb pbi pbt pc pck pcss pddl pde peggy pegjs pep per perl pfa pgsql ph php php3 php4 php5 phps phpt phtml pic pig pike pir pkb pkl pks pl6 plb plot pls plsql plt plx pm6 pml pmod po pod pod6 podsl pogo polar pony por pot pov pp pprx pq praat prawn prg pri pro prolog prw pryrc ps1 psc psd1 psgi psm1 pug purs pwn pxd pxi py py3 pyde pyi pyp pyt pyw pyx q qasm qbs qc ql qll qmd qml qnt qs r r2 r3 rabl rake raku raml razor rb rbbas rbfrm rbi rbmnu rbres rbtbar rbuild rbw rbx rbxs rchit rd rdoc re reb rebol red reds rego rei religo res resi rest rex rexx rg rhai rhtml ring riot rkt rktd rktl rl rmd rmiss rnh rno rnw robot roc roff ronn rpgle rpy rs rsc rsh rst rsx ru ruby s sage sagews sail sas sass sats sbatch sbt sc scad scala scaml scd sce scenic sch sci scm sco scpt scrbl scss sdc sed self sexp sh shader shen sieve sig sip sj sjs sl slang sld slim slint sls slurm sma smali smithy smk sml smt smt2 snip sol soy sp spc spec spin sps sqf sql sra srt sru srw ss ssjs sss st stan star sthlp story sty styl surql sv svelte svh svx sw swg swift swig t tac tact tag talon tape tcc tcsh td tea templ tesc tese tex texi tf tftpl tfvars thor thrift thy tl tla tlv tm tmac tmpl tmux toc tofu toit tolk tool tpb tpl tpp tps trg tsp tst tsx tu twig txi txl txx typ uc udo uno upc uplc ur urs v vala vapi vark vb vba vbhtml vbs vcl veo verse vert vh vhd vhdl vhf vhi vho vhs vht vhw vim vimrc viper vmb volt vrx vs vsh vtl vto vue vw vy w wast wat watchr wdl webidl wgsl whiley wiki wisp wl wlk wls wlt wlua wren ws wsgi x x10 x68 xc xdc xht xi xm xpl xproc xpy xq xql xqm xquery xqy xrl xs xsh xsjs xsl xslt xtend xzap y yacc yaml yap yar yara yml yrl yul yy z3 zap zeek zep zig zil zimpl zlogin zmpl zpl zs zsh zshenv ';
  var NAMESRE = /(?:\.abbrev_defs|\.ackrc|\.agignore|\.all\-contributorsrc|\.arcconfig|\.atomignore|\.auto\-changelog|\.babelignore|\.babelrc|\.bash_aliases|\.bash_functions|\.bash_history|\.bash_logout|\.bash_profile|\.bashrc|\.browserslistrc|\.buckconfig|\.bzrignore|\.c8rc|\.ckignore|\.clang\-format|\.clang\-tidy|\.clangd|\.classpath|\.coffeelintignore|\.coveragerc|\.cproject|\.cshrc|\.curlrc|\.cvsignore|\.dir_colors|\.dircolors|\.dockerignore|\.easignore|\.editorconfig|\.eleventyignore|\.emacs|\.env|\.envrc|\.eslint\-ignore|\.eslintignore|\.eslintrc|\.exrc|\.factor\-boot\-rc|\.factor\-rc|\.flake8|\.flaskenv|\.gclient|\.gemrc|\.git\-blame\-ignore\-revs|\.gitattributes|\.gitconfig|\.gitmessage|\.gitmodules|\.gitreview|\.gn|\.gnus|\.gvimrc|\.htaccess|\.htmlhintrc|\.ignore|\.imgbotconfig|\.inputrc|\.irbrc|\.jscsrc|\.jshintrc|\.jslintrc|\.Justfile|\.justfile|\.JUSTFILE|\.kshrc|\.latexmkrc|\.login|\.luacheckrc|\.markdownlintignore|\.nanorc|\.nodemonignore|\.npmignore|\.npmrc|\.nvimrc|\.nycrc|\.php_cs|\.prettierignore|\.profile|\.project|\.pryrc|\.pylintrc|\.releaserc|\.rgignore|\.Rhistory|\.Rprofile|\.rspec|\.shellcheckrc|\.simplecov|\.spacemacs|\.stylelintignore|\.swcrc|\.tern\-config|\.tern\-project|\.tgitconfig|\.tm_properties|\.vercelignore|\.vimrc|\.viper|\.vscodeignore|\.watchmanconfig|\.wgetrc|\.XCompose|\.xinitrc|\.xsession|\.yardopts|\.zlogin|\.zlogout|\.zprofile|\.zshenv|\.zshrc|AUTHORS|Brewfile|CHANGELOG|CHANGES|CODEOWNERS|Containerfile|CONTRIBUTING|COPYING|Dockerfile|dockerfile|Dockerfile\.dev|Dockerfile\.prod|Earthfile|Gemfile|GNUmakefile|INSTALL|Justfile|LICENCE|LICENSE|Makefile|Makefile\.am|NEWS|NOTICE|PATENTS|Procfile|Rakefile|README|Tiltfile|TODO|Vagrantfile|VERSION)$/;
  var IMG = ' avif bmp gif ico jpeg jng jpg png svg svgz tif tiff wbmp webp ';
  var VID = ' 3gp 3gpp asf asx avi flv m4v mng mov mp4 mpeg mpg ts webm wmv ';
  var AUD = ' kar m4a mid midi mp3 ogg ra ';
  var ARC = ' 7z rar zip ';
  var DOC = ' doc docx htm html pdf ppt pptx xhtml xls xlsx ';
  var APPJ = ' atom js kml rss xspf ';
  function fileIcon(name) {
    var leaf = String(name || '').split('/').pop();
    if (NAMESRE.test('/' + leaf)) { return 'file-text'; }
    var m = /\.([a-z0-9]+)$/i.exec(leaf);
    var x = m ? ' ' + m[1].toLowerCase() + ' ' : ' ';
    if (TEXT.indexOf(x) !== -1 || APPJ.indexOf(x) !== -1) { return 'file-text'; }
    if (IMG.indexOf(x) !== -1) { return 'file-image'; }
    if (VID.indexOf(x) !== -1) { return 'file-video'; }
    if (AUD.indexOf(x) !== -1) { return 'file-music'; }
    if (ARC.indexOf(x) !== -1) { return 'file-archive'; }
    if (DOC.indexOf(x) !== -1) { return 'file-text'; }
    return 'file';
  }

  /* ---------- format ---------- */

  // 날짜 표기: 2026-09-12 09:14:05. 전부 0 패딩.
  function p2(v) { v = Number(v); return isNaN(v) ? v : ('0' + v).slice(-2); }
  function fmtK(y, mo, d, h, mi, s) {
    var t = y + '-' + p2(mo) + '-' + p2(d) + ' ' + p2(h) + ':' + p2(mi);
    return s === undefined ? t : t + ':' + p2(s);
  }
  // ms 숫자·Date 둘 다 받는다.
  function fmtT(when) {
    var d = when instanceof Date ? when : new Date(when);
    return fmtK(d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds());
  }
  var MON = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
  // 762817299 → 727.5 MB (762,817,299 바이트). 1024 단위.
  function comma(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function humanSize(s) {
    if (s === '' || s == null) { return ''; }
    var n = Number(s);
    if (!isFinite(n) || n < 0) { return ''; }
    if (n < 1024) { return comma(n) + ' 바이트'; }
    var units = ['KB', 'MB', 'GB', 'TB', 'PB'];
    var u = -1, v = n;
    do { v /= 1024; u++; } while (v >= 1024 && u < units.length - 1);
    return String(Math.round(v * 10) / 10) + ' ' + units[u] + ' (' + comma(n) + ' 바이트)';
  }

  /* ---------- path / url ---------- */

  function plain(href) { return new URL(href, location.href).pathname; }
  function full(href) { return new URL(href, location.href).href; }
  function trail(p) { return p.charAt(p.length - 1) === '/' ? p : p + '/'; }
  function untrail(p) { return p.charAt(p.length - 1) === '/' ? p.slice(0, -1) : p; }
  function parentOf(p) {
    var t = untrail(p);
    var i = t.lastIndexOf('/');
    return i <= 0 ? '/' : t.slice(0, i + 1);
  }
  function leafOf(p) { return untrail(p).split('/').pop(); }
  function readable(s) { try { return decodeURIComponent(s); } catch (e) { return s; } }
  // e.path는 인코딩된 상태라 표시는 디코딩해서 보여준다.
  function leafName(e) { return readable(leafOf(e.path)); }
  function show(href) { return readable(leafOf(plain(href))); }
  function escSeg(s) { return s.split('/').map(encodeURIComponent).join('/'); }
  // 기록용 표시 경로: 인코딩된 dir + 날 이름(입력·File API) 결합.
  function dispPath(dir, name) { return readable(dir) + name; }
  // 기록 한 줄의 표준 모양 `동작 결과: 대상 (상세)`. 대상이 여럿이면 한 줄에 하나씩. 문장 조립은 여기서만 한다.
  function fmtLog(action, result, targets, detail) {
    var head = action + ' ' + result + ':';
    if (!targets.length) { return head + ' (없음)' + (detail ? ' (' + detail + ')' : ''); }
    if (targets.length === 1) { return head + ' ' + targets[0] + (detail ? ' (' + detail + ')' : ''); }
    var lines = [head].concat(targets);
    if (detail) { lines.push('(' + detail + ')'); }
    return lines.join('\n');
  }
  function toneFor(result, tone) {
    return tone || (/^(실패|차단)/.test(result) ? 'err' : (result === '시작' ? '' : 'ok'));
  }
  function log(action, result, targets, detail, tone) {
    feed(fmtLog(action, result, targets, detail), toneFor(result, tone));
  }
  function fmtDur(ms) {
    var s = Math.round(ms / 1000);
    if (s < 1) { return '1초 미만'; }
    if (s < 60) { return s + '초'; }
    return Math.floor(s / 60) + '분 ' + (s % 60) + '초';
  }
  // 서버는 overlong 이름을 op마다 제각각으로 처리한다(PUT 201-ghost/500, MKCOL 409, MOVE 404).
  // 믿을 게 못 되니 240바이트(255 - PUT temp 접미사 11 - 여유)에서 클라이언트가 자른다.
  var NAME_CAP = 240;
  function byteLen(s) {
    try { return new TextEncoder().encode(s).length; }
    catch (e) { return s.length * 3; }
  }
  function nameOk(action, dir, name) {
    if (byteLen(name) > NAME_CAP) { log(action, '차단', [dispPath(dir, name)], '240바이트 초과'); return false; }
    return true;
  }
  function relOk(action, rel) {
    var bad = rel.split('/').some(function (s) { return byteLen(s) > NAME_CAP; });
    if (bad) { log(action, '차단', [dispPath(home, rel)], '240바이트 초과'); return false; }
    return true;
  }
  // '/' 검사 + 240B 검사. target은 호출자가 만든 표시 경로 그대로 쓴다.
  function okName(action, target, dir, name) {
    if (name.indexOf('/') !== -1) { log(action, '차단', [target], '쓸 수 없는 문자 /'); return false; }
    return nameOk(action, dir, name);
  }
  // 덮어쓰기 확인. 문구는 여기서만 만든다.
  function confirmOverwrite(label) { return confirm('이미 있습니다. 덮어쓸까요?\n' + label); }
  // 이름 입력+검사 공용. prompt 라벨·기본값만 받고 {name, disp}나 null을 돌린다.
  function askName(action, e, label, def) {
    if (!e) { return null; }
    var next = prompt(label, def);
    if (!next) { return null; }
    var pdir = parentOf(e.path);
    var disp = dispPath(pdir, next) + (e.dir ? '/' : '');
    return okName(action, disp, pdir, next) ? { name: next, disp: disp } : null;
  }
  // 폴더 + 디코딩된 이름 → 절대 URL. 인코딩은 여기서 딱 한 번.
  function joinUrl(dir, name, isDir) {
    return new URL(trail(dir) + encodeURIComponent(name) + (isDir ? '/' : ''), location.origin).href;
  }
  // 같은 폴더 안 새 이름 → MOVE/COPY Destination 절대 URL.
  function destUrlFor(e, name) { return joinUrl(parentOf(e.path), name, e.dir); }

  /* ---------- store ---------- */

  var LS_KEY = 'webdav-feed-v1', LS_MAX = 200;
  var store = {
    entries: [],   // {name,url,path,date,size,dir,up}
    feed: []       // {t,msg,tone,dur?} | {t,msg,tone:'run',job:{pct,sub}}
  };
  function persist() {
    try {
      var done = store.feed.filter(function (r) { return !r.job; }).slice(-LS_MAX);
      localStorage.setItem(LS_KEY, JSON.stringify(done));
    } catch (e) { /* 사설 모드 등: 저장이 안 돼도 동작은 계속 */ }
  }
  // debounce trailing분이 닫힘 순간에 날아가지 않게.
  window.addEventListener('pagehide', persist);
  function restore() {
    try {
      var a = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
      if (Array.isArray(a)) {
        store.feed = a.filter(function (r) {
          return r && typeof r.msg === 'string' && typeof r.t === 'number';
        }).slice(-LS_MAX);
      }
    } catch (e) { store.feed = []; }
  }
  // 폭주(수천 파일) 때도 살려고: 평시는 즉시, 폭주는 trailing 1회. 그리기·저장 같은 패턴이라 묶었다.
  function throttled(interval, trailing, fn) {
    var t = null, last = 0;
    return function () {
      var n = Date.now();
      if (n - last > interval) { last = n; fn(); return; }
      clearTimeout(t);
      t = setTimeout(function () { last = Date.now(); fn(); }, trailing);
    };
  }
  var drawSoon = throttled(250, 300, drawFeed);
  var saveSoon = throttled(1000, 800, persist);
  function feed(msg, tone) {
    store.feed.push({ t: Date.now(), msg: msg, tone: tone || '' });
    drawSoon();
    saveSoon();
  }
  function task(label) {
    var rec = { t: Date.now(), msg: label, tone: 'run', job: { pct: 0, sub: '' } };
    store.feed.push(rec);
    drawFeed();
    var last = 0;
    return {
      // XHR progress는 초당 수십 번 오므로 200ms로 솎아서 그린다.
      tick: function (pct, sub) {
        rec.job.pct = pct; rec.job.sub = sub;
        var n = Date.now();
        if (n - last > 200 || pct >= 100) { last = n; drawFeed(); }
      },
      done: function (action, result, targets, detail, tone) {
        rec.msg = fmtLog(action, result, targets, detail);
        rec.tone = toneFor(result, tone);
        rec.dur = Date.now() - rec.t;
        delete rec.job;
        drawFeed();
        persist();
      }
    };
  }

  /* ---------- net ---------- */

  // 401은 req/put이 reload로 처리한다. 끝난 페이지에 기록이 남지 않게 거른다.
  function isAuth(err) { return !!err && err.message === 'auth'; }
  // 표준 형식 `동작 실패: 대상 (상세)` 를 만드는 catch.
  function oopsCtx(action, target) {
    return function (err) { if (!isAuth(err)) { log(action, '실패', [target], err.message); } };
  }
  function req(method, url, body, headers) {
    return fetch(url, { method: method, body: body === undefined ? null : body, headers: headers || {} }).then(function (r) {
      if (r.status === 401) { location.reload(); throw new Error('auth'); }
      return r;
    });
  }
  function put(url, file, onTick) {
    return new Promise(function (ok, no) {
      var x = new XMLHttpRequest();
      x.open('PUT', url, true);
      x.upload.onprogress = function (ev) { if (ev.lengthComputable && onTick) { onTick(ev.loaded); } };
      x.onload = function () {
        if (x.status === 401) { location.reload(); return; }
        if (x.status >= 200 && x.status < 300) { ok(); }
        else { no(new Error('PUT 실패: ' + x.status)); }
      };
      x.onerror = function () { no(new Error('PUT 네트워크 오류')); };
      x.send(file);
    });
  }
  // DAV 변경 op 한 방. 기록은 log() 표준 형식으로만 남긴다.
  // dupReason이 있으면 405/409/412를 `동작 실패: 대상 (사유)` 로 기록한다.
  function op(action, target, method, url, headers, dupReason) {
    return req(method, url, null, headers).then(function (r) {
      if (dupReason && (r.status === 405 || r.status === 409 || r.status === 412)) { log(action, '실패', [target], dupReason); return; }
      if (!r.ok) { log(action, '실패', [target], r.status); return; }
      log(action, '완료', [target]);
      refresh();
    }).catch(oopsCtx(action, target));
  }
  // 목록 갱신. 겹치면 마지막 요청만 한 번 더 돈다.
  var loading = false, dirty = false;
  function refresh() {
    if (loading) { dirty = true; return; }
    loading = true;
    req('GET', home, null, { Accept: 'text/html' }).then(function (r) {
      // 상태만 던진다. 문장은 oopsCtx가 표준 형식으로 만든다.
      if (!r.ok) { throw new Error(r.status); }
      return r.text();
    }).then(function (html) {
      store.entries = scrape(new DOMParser().parseFromString(html, 'text/html'));
      drawList();
    }).catch(oopsCtx('목록', readable(home))).then(function () {
      loading = false;
      if (dirty) { dirty = false; refresh(); }
    });
  }
  var PROPFIND_BODY = '<?xml version="1.0" encoding="utf-8"?><propfind xmlns="DAV:"><allprop/></propfind>';
  function davXml(method, url, depth, body, errLabel) {
    return req(method, url, body === undefined ? null : body, { Depth: depth, 'Content-Type': 'application/xml' }).then(function (r) {
      if (!r.ok) { throw new Error(errLabel + ': ' + r.status); }
      return r.text();
    }).then(function (xmlText) {
      return new DOMParser().parseFromString(xmlText, 'text/xml');
    });
  }
  function scrape(doc) {
    var pre = doc.querySelector('pre');
    var out = [];
    if (!pre) { return out; }
    var kids = pre.childNodes;
    for (var i = 0; i < kids.length; i++) {
      var a = kids[i];
      if (a.nodeName !== 'A') { continue; }
      var href = a.getAttribute('href');
      if (!href) { continue; }
      var up = href === '../' || href === '..';
      var dir = up || href.charAt(href.length - 1) === '/';
      var date = '-', size = '';
      var nx = kids[i + 1];
      if (nx && nx.nodeType === 3) {
        // autoindex는 11-Sep-2026 21:55(영문 월) 형식이니 2026-09-11 21:55로 바꾼다.
        var m = nx.textContent.match(/(\d{2})-([A-Za-z]{3})-(\d{4})\s+(\d{2}):(\d{2})\s+(\S+)/);
        if (m) { date = fmtK(+m[3], MON[m[2]] || m[2], +m[1], +m[4], +m[5]); size = dir ? '' : m[6]; }
      }
      out.push({ name: up ? '상위 폴더' : show(href), url: full(href), path: plain(href), date: date, size: size, dir: dir, up: up });
    }
    return out;
  }

  /* ---------- shell ---------- */

  function shell() {
    var path = node('span', 'bar-path', [txt(readable(home))]);
    var quit = iconBtn('log-out', 'quit', '브라우저 저장 계정을 지웁니다. 완전 로그아웃은 브라우저 종료', bye);
    var menu = stateBtn('menu-btn', 'menu', 'x', '관리 패널', function (ev) { ev.stopPropagation(); root.classList.toggle('show-side'); });
    root.appendChild(node('div', 'bar', [
      node('div', 'bar-left', [node('span', 'bar-title', [txt('WebDAV')]), path]),
      quit,
      menu
    ]));
    root.appendChild(node('div', 'cols', [
      node('div', 'files'),
      node('aside', 'side', [node('div', 'adder'), node('div', 'feed'), node('div', 'card hidden')])
    ]));
    adder();
  }
  function uploadInput(multiple, dirMode) {
    var fi = document.createElement('input');
    fi.type = 'file'; fi.style.display = 'none';
    if (multiple) { fi.multiple = true; }
    if (dirMode) { fi.setAttribute('webkitdirectory', ''); }
    return fi;
  }
  function adder() {
    var box = $('.adder');
    box.appendChild(ibtn('새 폴더', '', 'plus', function () {
      var name = prompt('폴더 이름:');
      if (!name) { return; }
      // 목록이 바뀔 수 있으니 그때그때 현재 entries로 검사한다.
      var dup = store.entries.some(function (e) { return e.name === name; });
      var mkDisp = dispPath(trail(home), name);
      if (dup) { log('만들기', '실패', [mkDisp], '이미 있음'); return; }
      if (!okName('만들기', mkDisp, trail(home), name)) { return; }
      op('만들기', mkDisp, 'MKCOL', joinUrl(home, name, true), null, '이미 있음');
    }));
    // 파일 선택 대화상자는 비동기로 뜬다. 뜨기 전 두 번 누르면 대화상자가 2개 쌓인다.
    // 한 번 열면 포커스가 돌아올 때까지(선택·취소) 추가 클릭을 막는다.
    var picking = false;
    function pick(fi) {
      if (picking) { return; }
      picking = true;
      fi.click();
      function off() { picking = false; window.removeEventListener('focus', off); }
      window.addEventListener('focus', off);
      setTimeout(off, 5000);
    }
    // 선택 결과가 오면(change) 비어 있는지 보고 send로 넘긴다. 파일·폴더 공용.
    function onPick(input, emptyMsg, send) {
      input.addEventListener('change', function () {
        if (!input.files.length) { feed(emptyMsg, 'err'); return; }
        send(input.files); input.value = '';
      });
    }
    var fi = uploadInput(true, false);
    onPick(fi, '선택된 파일이 없습니다', sendFiles);
    box.appendChild(ibtn('파일 업로드', 'go', 'upload', function () { pick(fi); }));
    box.appendChild(fi);
    var di = uploadInput(false, true);
    onPick(di, '빈 폴더이거나 이 브라우저에서 폴더 선택을 지원하지 않습니다', sendFolder);
    box.appendChild(ibtn('폴더 업로드', '', 'upload', function () { pick(di); }));
    box.appendChild(di);
  }

  /* ---------- list ---------- */

  var MENU = [
    { cmd: 'open', label: '열기', ic: 'external-link' },
    { cmd: 'info', label: '정보', ic: 'info' },
    { cmd: 'rename', label: '이름 변경', ic: 'pencil' },
    { cmd: 'copy', label: '복사', ic: 'copy' },
    { cmd: 'move', label: '이동', ic: 'move' },
    { cmd: 'zip', label: 'zip 다운로드', ic: 'download', dirOnly: true },
    { cmd: 'drop', label: '삭제', ic: 'trash-2', danger: true }
  ];
  function findEntry(key) {
    for (var i = 0; i < store.entries.length; i++) {
      if (String(store.entries[i].key) === String(key)) { return store.entries[i]; }
    }
    return null;
  }
  function rowMenu(e, key) {
    var pop = node('div', 'f-menu', []);
    pop.setAttribute('data-pop', String(key));
    MENU.forEach(function (m) {
      if (m.dirOnly && !e.dir) { return; }
      var b = ibtn(m.label, m.danger ? 'bad' : '', m.ic, null);
      b.setAttribute('data-cmd', m.cmd);
      b.setAttribute('data-key', String(key));
      pop.appendChild(b);
    });
    return pop;
  }
  // 상위→폴더→이름순(ko). 목록·정보 이전/다음이 같은 순서다.
  function byName(a, b) {
    if (!!a.up !== !!b.up) { return a.up ? -1 : 1; }
    if (!!a.dir !== !!b.dir) { return a.dir ? -1 : 1; }
    return a.name.localeCompare(b.name, 'ko');
  }
  function drawList() {
    var box = $('.files');
    box.textContent = '';
    var items = store.entries.slice().sort(byName);
    if (!items.length) {
      box.appendChild(node('div', 'void', [txt('빈 폴더입니다.')]));
      return;
    }
    items.forEach(function (e, i) { box.appendChild(fileRow(e, i)); });
  }
  function fileRow(e, i) {
    e.key = i;
    var row = node('div', 'file' + (e.up ? ' up' : ''), []);
    row.setAttribute('data-key', String(i));
    row.appendChild(node('div', 'f-ico', [icon(e.up ? 'arrow-up' : (e.dir ? 'folder' : fileIcon(e.name)))]));
    var body = node('div', 'f-body', []);
    var link = document.createElement('a');
    link.className = 'f-name';
    link.href = e.url;
    link.appendChild(txt(e.name));
    body.appendChild(link);
    var meta = e.dir ? '폴더' : (e.size || '');
    if (e.date && e.date !== '-') { meta += (meta ? ' · ' : '') + e.date; }
    body.appendChild(node('div', 'f-meta', [txt(meta)]));
    row.appendChild(body);
    if (!e.up) {
      var btns = node('div', 'f-btns', []);
      var inf = iconBtn('info', 'f-info', '정보');
      inf.setAttribute('data-info', String(i));
      btns.appendChild(inf);
      var dots = iconBtn('ellipsis', 'f-more', '동작');
      dots.setAttribute('data-dots', String(i));
      btns.appendChild(dots);
      row.appendChild(btns);
      row.appendChild(rowMenu(e, i));
    }
    return row;
  }
  function hideMenus() { $all('.f-menu.lit').forEach(function (m) { m.classList.remove('lit'); }); }
  function plainClick(ev) {
    return ev.button === 0 && !ev.metaKey && !ev.ctrlKey && !ev.shiftKey && !ev.altKey;
  }
  function toggleMenu(dots) {
    var pop = $('.files [data-pop="' + dots.getAttribute('data-dots') + '"]');
    var lit = pop && pop.classList.contains('lit');
    hideMenus();
    if (pop && !lit) { pop.classList.add('lit'); }
  }
  function runCmd(cmd) {
    hideMenus();
    var fn = Commands[cmd.getAttribute('data-cmd')];
    if (fn) { fn(findEntry(cmd.getAttribute('data-key'))); }
  }
  function openRow(row) {
    var e = row && findEntry(row.getAttribute('data-key'));
    if (e) { location.href = e.url; }
  }
  document.addEventListener('click', function (ev) {
    var near = function (sel) { return ev.target.closest ? ev.target.closest(sel) : null; };
    var inf = near('[data-info]');
    if (inf) { hideMenus(); Commands.info(findEntry(inf.getAttribute('data-info'))); return; }
    var dots = near('[data-dots]');
    if (dots) { toggleMenu(dots); return; }
    var cmd = near('[data-cmd]');
    if (cmd) { runCmd(cmd); return; }
    // 행 전체가 이동/열기. 메뉴 배경 탭은 제외(닫기 동작 유지).
    var rowEl = near('.file');
    if (rowEl && !near('.f-menu')) {
      if (!plainClick(ev)) { return; }
      ev.preventDefault();
      openRow(rowEl);
      return;
    }
    hideMenus();
  });

  var Commands = {
    open: function (e) { if (e) { location.href = e.url; } },
    info: function (e) { if (e) { card(e); } },
    rename: function (e) {
      if (!e) { return; }
      var base = leafName(e);
      var q = askName('이름 변경', e, '새 이름:', base);
      if (!q || q.name === base) { return; }
      if (store.entries.some(function (x) { return x.name === q.name; })) {
        if (!confirmOverwrite(q.name)) { return; }
      }
      op('이름 변경', readable(e.path) + ' → ' + q.disp, 'MOVE', e.url, { Destination: destUrlFor(e, q.name) }, null);
    },
    copy: function (e) {
      var q = askName('복사', e, '복사본 이름:', leafName(e) + ' (복사본)');
      if (!q) { return; }
      op('복사', q.disp, 'COPY', e.url, { Destination: destUrlFor(e, q.name), Overwrite: 'F' }, '같은 이름 있음');
    },
    move: function (e) {
      if (!e) { return; }
      pickFolder(e).then(function (pick) {
        if (!pick) { return; }
        var destDir = pick.dir;
        // leafOf는 인코딩된 조각이라 디코딩 후 한 번만 인코딩한다(이중 인코딩=404 방지).
        var leaf = leafName(e);
        var destPath = trail(destDir) + encodeURIComponent(leaf) + (e.dir ? '/' : '');
        var destUrl = joinUrl(destDir, leaf, e.dir);
        if (e.url === destUrl) { log('이동', '차단', [readable(e.path)], '같은 위치'); return; }
        if (e.dir && trail(destUrl).indexOf(trail(e.url)) === 0) { log('이동', '차단', [readable(e.path) + ' → ' + readable(destPath)], '자기 하위'); return; }
        if (pick.names.indexOf(leaf) !== -1) {
          if (!confirmOverwrite(leaf)) { return; }
        }
        op('이동', readable(e.path) + ' → ' + readable(destPath), 'MOVE', e.url, { Destination: destUrl }, null);
      });
    },
    zip: function (e) {
      if (!e) { return; }
      log('다운로드', '시작', [readable(e.path)]);
      location.href = '/_zip/download?path=' + e.path;
    },
    drop: function (e) {
      if (!e) { return; }
      if (!confirm((e.dir ? '폴더 안의 내용까지 전부 삭제됩니다. ' : '') + '삭제할까요?\n' + readable(e.path))) { return; }
      op('삭제', readable(e.path), 'DELETE', e.url, null, null);
    }
  };

  /* ---------- uploads ---------- */

  // 파일·폴더 올리기 공용 루프. prep(rel)로 상위 폴더 체인(MKCOL)을 끼운다.
  // 작은 파일 수천 개가 latency-bound라 4개씩 병렬로 PUT한다. MKCOL 중복은 무시라 경합해도 안전하다.
  var CONC = 4;
  async function uploadAll(files, cfg) {
    var base = trail(home);
    var list = Array.prototype.slice.call(files);
    var total = 0;
    list.forEach(function (f) { total += f.size; });
    // 진행 중 라벨은 개수만. 이름 전부는 완료 기록(fmtLog)이 맡는다. 전부 나열하면 clamp 게이트(개행 기준)를 피해 카드가 끝없이 길어진다.
    var t = task(cfg.prog + ' (' + list.length + '개)');
    var got = 0, n = 0, att = 0, names = [], fails = [], qi = 0;
    var flying = list.map(function () { return 0; });
    function pct() {
      var live = got;
      for (var k = 0; k < flying.length; k++) { live += flying[k]; }
      return total ? Math.round((live / total) * 100) : 0;
    }
    async function worker() {
      for (;;) {
        var i = qi++;
        if (i >= list.length) { return; }
        var f = list[i], rel = cfg.rel(f);
        att++;
        // 이름 가드는 드물고 정확해서 즉시 낱개로 남긴다. 서버 실패는 마지막에 합산한다.
        if (!relOk(cfg.action, rel)) { bump(); continue; }
        try {
          await cfg.prep(rel);
          await put(base + escSeg(rel), f, function (loaded) {
            flying[i] = loaded;
            bump();
          });
          flying[i] = 0; n++; got += f.size; names.push(rel);
        } catch (err) { flying[i] = 0; if (!isAuth(err)) { fails.push({ rel: rel, msg: err.message }); } }
        bump();
      }
    }
    function bump() { t.tick(pct(), cfg.prog + ' ' + att + '/' + list.length + ' ' + pct() + '%'); }
    var pool = [];
    for (var w = 0; w < Math.min(CONC, list.length); w++) { pool.push(worker()); }
    await Promise.all(pool);
    var targets = names.map(function (rel) { return dispPath(home, rel); });
    if (!fails.length) {
      t.done(cfg.action, '완료 ' + n + '/' + list.length, targets);
    } else if (!names.length && fails.length === 1) {
      t.done(cfg.action, '실패', [dispPath(home, fails[0].rel)], fails[0].msg);
    } else if (!names.length) {
      t.done(cfg.action, '실패', [], list.length + '개 실패: ' + failSample(fails));
    } else {
      t.done(cfg.action, '완료 ' + n + '/' + list.length, targets, '실패 ' + fails.length + '개: ' + failSample(fails), 'err');
    }
    refresh();
  }
  // 실패 합산용: 전부 `경로 (사유)` 나열 (4줄 clamp가 접어준다).
  function failSample(fails) {
    return fails.map(function (f) { return dispPath(home, f.rel) + ' (' + f.msg + ')'; }).join(', ');
  }
  function sendFiles(files) {
    var dups = Array.prototype.slice.call(files).filter(function (f) {
      return store.entries.some(function (e) { return !e.up && e.name === f.name; });
    }).map(function (f) { return f.name; });
    if (dups.length && !confirmOverwrite(dups.join('\n'))) { return; }
    uploadAll(files, {
      action: '올리기',
      prog: '올리는 중',
      rel: function (f) { return f.name; },
      prep: function () { return null; }
    });
  }
  function sendFolder(files) {
    var made = {};
    function mk(rel) {
      if (!rel || made[rel]) { return null; }
      made[rel] = 1;
      return req('MKCOL', joinUrl(home, rel, true));
    }
    uploadAll(files, {
      action: '폴더 올리기',
      prog: '폴더 올리는 중',
      rel: function (f) { return f.webkitRelativePath || f.name; },
      prep: async function (rel) {
        var segs = rel.split('/');
        segs.pop();
        var acc = '';
        for (var j = 0; j < segs.length; j++) {
          acc = acc ? acc + '/' + segs[j] : segs[j];
          await mk(acc);
        }
      },
    });
  }

  /* ---------- feed + card ---------- */

  function feedRow(r) {
    var d = node('div', 'rec' + (r.tone ? ' ' + r.tone : ''), [
      node('span', 't', [txt(fmtT(r.t) + (r.dur ? ' · ' + fmtDur(r.dur) : ''))]),
      node('span', 'm', [txt(r.msg)])
    ]);
    // 4줄이 넘거나 한 줄이 길면 접고, 누르면 전체를 본다(다시 누르면 접힘). clamp CSS는 시각 줄 기준이라 콤마 한 줄도 접힌다.
    if (r.msg.split('\n').length > 4 || r.msg.length > 400) {
      d.classList.add('clamp');
      d.addEventListener('click', function () { d.classList.toggle('open'); });
    }
    if (r.job) {
      var p = document.createElement('progress');
      p.max = 100; p.value = r.job.pct || 0;
      d.appendChild(p);
      d.appendChild(node('div', 'sub', [txt(r.job.sub || '')]));
    }
    return d;
  }
  function drawFeed() {
    var box = $('.feed');
    if (!box) { return; }
    box.textContent = '';
    if (!store.feed.length) {
      box.appendChild(node('div', 'dim', [txt('아직 기록이 없습니다.')]));
    }
    store.feed.slice().reverse().forEach(function (r) { box.appendChild(feedRow(r)); });
    // 지우기 버튼은 맨 아래(가장 오래된 끝)에.
    var wipe = btn('기록 지우기', 'wipe', function () {
      if (!store.feed.length) { return; }
      if (!confirm('기록을 모두 지울까요?\n(서버 파일은 그대로 둡니다)')) { return; }
      store.feed = [];
      try { localStorage.removeItem(LS_KEY); } catch (e) {}
      drawFeed();
    });
    box.appendChild(wipe);
    box.scrollTop = 0;
  }
  var curUrl = null;
  function infoOrder() {
    return store.entries.filter(function (e) { return !e.up; }).sort(byName);
  }
  function stepInfo(d) {
    var items = infoOrder();
    if (!items.length) { return; }
    var urls = items.map(function (e) { return e.url; });
    card(items[(urls.indexOf(curUrl) + d + items.length) % items.length]);
  }
  function toggleWide() {
    $('.side').classList.toggle('wide');
  }
  function drawCard(rows, title) {
    var box = $('.card');
    box.textContent = '';
    var nav = node('div', 'c-nav', []);
    nav.appendChild(btn('← 기록으로', '', toFeed));
    nav.appendChild(stateBtn('wide-btn', 'expand', 'minimize-2', '정보 보기 크기', toggleWide));
    box.appendChild(nav);
    var pn = node('div', 'c-prevnext', [
      btn('← 이전', '', function () { stepInfo(-1); }),
      btn('다음 →', '', function () { stepInfo(1); })
    ]);
    box.appendChild(pn);
    var h3 = document.createElement('h3');
    h3.appendChild(txt(title));
    box.appendChild(h3);
    rows.forEach(function (kv) {
      if (kv[1] === undefined || kv[1] === null || kv[1] === '') { return; }
      box.appendChild(node('div', 'kv', [
        node('span', 'k', [txt(kv[0])]),
        node('span', 'v', [txt(kv[1])])
      ]));
    });
  }
  function toFeed() {
    $('.side').classList.remove('wide');
    $('.adder').classList.remove('hidden');
    $('.feed').classList.remove('hidden');
    $('.card').classList.add('hidden');
  }
  // ! 연타 시 이전 비동기 체인이 늦게 덮어쓰는 레이스 방지. 최신 run만 그린다.
  var cardSeq = 0;
  function card(e) {
    curUrl = e.url;
    var my = ++cardSeq;
    root.classList.add('show-side');
    $('.adder').classList.add('hidden');
    $('.feed').classList.add('hidden');
    $('.card').classList.remove('hidden');
    drawCard([['…', '불러오는 중...']], e.name);
    davXml('PROPFIND', e.url, '0', PROPFIND_BODY, '정보 실패').then(function (doc) {
      if (my !== cardSeq) { return null; }
      function tag(n) {
        var els = doc.getElementsByTagNameNS('*', n);
        return els.length ? els[0].textContent : '';
      }
      var isDir = doc.getElementsByTagNameNS('*', 'collection').length > 0;
      var rows = [
        ['이름', e.name],
        ['종류', isDir ? '폴더' : '파일'],
        ['경로', readable(e.path)]
      ];
      if (!isDir) { rows.push(['크기', humanSize(tag('getcontentlength'))]); }
      return req('HEAD', e.url).then(function (hd) {
        if (my !== cardSeq) { return; }
        var ct = (hd.headers.get('Content-Type') || '').split(';')[0];
        if (!isDir) {
          rows.push(['MIME', ct]);
          rows.push(['ETag', hd.headers.get('ETag') || '']);
        }
        // getlastmodified는 GMT(RFC1123)라 브라우저 현지시간으로 바꾼다.
        rows.push(['수정일', gmtFull(tag('getlastmodified'))]);
        drawCard(rows, e.name);
        if (!isDir) { preview($('.card'), e, ct, my); }
      });
    }).catch(function (err) { if (my !== cardSeq) { return; } if (!isAuth(err)) { drawCard([['오류', err.message]], e.name); } });
  }
  function gmtFull(gmt) {
    var t = new Date(gmt);
    return isNaN(t.getTime()) ? gmt : fmtT(t);
  }

  /* ---------- preview ---------- */

  // 정보 카드 미리 보기. 판정은 HEAD Content-Type 실측, 확장자 목록 없음.
  // 순서를 지켜야 한다: text/html이 text/에도 걸린다.
  function preview(box, e, ct, my) {
    if (my !== cardSeq) { return; }
    function section(tag) {
      var sec = node('div', 'pv', []);
      sec.appendChild(tag);
      // 로드 실패하면 섹션째 없앤다.
      tag.addEventListener('error', function () { sec.remove(); });
      box.appendChild(sec);
    }
    // src+class+append 반복은 여기서만 한다.
    function media(el, cls) {
      el.src = e.url;
      el.className = cls;
      section(el);
    }
    if (ct === 'text/html') {
      var fr = document.createElement('iframe');
      fr.setAttribute('sandbox', '');
      media(fr, 'pv-frame');
      return;
    }
    if (ct.indexOf('image/') === 0) {
      var im = document.createElement('img');
      media(im, 'pv-img');
      return;
    }
    if (ct.indexOf('video/') === 0 || ct.indexOf('audio/') === 0) {
      var av = document.createElement(ct.charAt(0) === 'v' ? 'video' : 'audio');
      av.controls = true;
      av.preload = 'metadata';
      media(av, 'pv-media');
      return;
    }
    if (ct === 'application/pdf') {
      var em = document.createElement('embed');
      em.type = 'application/pdf';
      media(em, 'pv-frame');
      return;
    }
    // 확장자→hljs 언어. 번들 36개 안에만 매핑, 없으면素 (자동감지 안 씀: 느리고 틀린다).
    var HL = { js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript', mts: 'typescript', css: 'css', scss: 'scss', less: 'less', html: 'xml', htm: 'xml', xhtml: 'xml', vue: 'xml', svelte: 'xml', xml: 'xml', svg: 'xml', json: 'json', md: 'markdown', markdown: 'markdown', yml: 'yaml', yaml: 'yaml', sh: 'bash', bash: 'bash', zsh: 'bash', py: 'python', rb: 'ruby', go: 'go', rs: 'rust', c: 'c', h: 'c', cpp: 'cpp', cc: 'cpp', hpp: 'cpp', java: 'java', php: 'php', sql: 'sql', cs: 'csharp', swift: 'swift', kt: 'kotlin', lua: 'lua', pl: 'perl', r: 'r', ini: 'ini', cfg: 'ini', conf: 'ini', toml: 'ini', mk: 'makefile', diff: 'diff', patch: 'diff', graphql: 'graphql', gql: 'graphql' };
    function hlLang(name) {
      var m = /\.([^.]+)$/.exec(name || '');
      if (!m) { return null; }
      return HL[m[1].toLowerCase()] || null;
    }
    // 하이라이트 렌더 상한 256KB. 내용은 통째로 (pre 상한 없음 결정 유지), span 변환만 생략.
    var HL_CAP = 262144;
    // text-like application/*도 pre: 서버 실측 기준 javascript·json·+xml.
    if (ct.indexOf('text/') === 0 || ct === 'application/javascript' || ct === 'application/json' || ct.slice(-4) === '+xml') {
      // 상한 없음(결정). 통째로 읽어 pre에 붓는다.
      req('GET', e.url).then(function (r) {
        if (!r.ok) { throw new Error(r.status); }
        return r.text();
      }).then(function (t) {
        if (my !== cardSeq) { return; }
        var pre = document.createElement('pre');
        pre.className = 'pv-pre';
        // hljs는 입력 이스케이프 후 span을 뱉어서 innerHTML이 안전하다. lib 실패·미매핑·초과는素.
        var lang = hlLang(e.name);
        if (lang && t.length <= HL_CAP && typeof hljs !== 'undefined' && hljs.getLanguage(lang)) {
          try {
            pre.innerHTML = hljs.highlight(t, { language: lang }).value;
            pre.classList.add('hljs');
          } catch (err) { pre.appendChild(txt(t)); }
        } else {
          pre.appendChild(txt(t));
        }
        section(pre);
      }).catch(function () { /* 섹션 없음 */ });
    }
    // 그 외는 섹션 없음.
  }

  /* ---------- folder picker (promise modal) ---------- */

  // 매번 새로 만들고 닫을 때 DOM에서 제거한다. (재사용 시 이전 resolve 물림 방지)
  function pickFolder(e) {
    return new Promise(function (resolve) {
      var dest = trail(home);
      var dirFiles = {};   // dir path → 디코딩된 파일명 목록 (목적지 동명 확인용)
      var foot = node('div', 'pick-foot', [
        node('span', 'pick-item', [txt('이동: ' + e.name)]),
        btn('닫기', '', function () { close(null); }),
        btn('여기로 이동', 'go', function () { close({ dir: dest, names: dirFiles[dest] || [] }); })
      ]);
      var bg = node('div', 'pick-bg', [
        node('div', 'pick', [
          node('div', 'pick-head', [node('b', '', [txt('이동할 폴더 선택')]), node('small', 'pick-path')]),
          node('div', 'pick-list'),
          foot
        ])
      ]);
      function close(v) {
        bg.classList.remove('lit');
        setTimeout(function () { bg.remove(); }, 150);
        resolve(v);
      }
      function walk(path) {
        dest = trail(path);
        $('.pick-path', bg).textContent = readable(path);
        var list = $('.pick-list', bg);
        list.textContent = '';
        list.appendChild(node('div', 'dim', [txt('불러오는 중...')]));
        davXml('PROPFIND', path, '1', null, '목록 실패').then(function (doc) {
          var resps = doc.getElementsByTagNameNS('*', 'response');
          var dirs = [], names = [];
          for (var i = 0; i < resps.length; i++) {
            var hs = resps[i].getElementsByTagNameNS('*', 'href');
            if (!hs.length) { continue; }
            var p = plain(hs[0].textContent);
            if (trail(p) === trail(path)) { continue; }
            if (!resps[i].getElementsByTagNameNS('*', 'collection').length) { names.push(readable(leafOf(p))); continue; }
            dirs.push(trail(p));
          }
          dirFiles[trail(path)] = names;
          dirs.sort();
          list.textContent = '';
          if (trail(path) !== '/') {
            var up = node('div', 'pick-row', [icon('arrow-up'), txt(' 상위 폴더')]);
            up.addEventListener('click', function () { walk(parentOf(path)); });
            list.appendChild(up);
          }
          if (!dirs.length) { list.appendChild(node('div', 'dim', [txt('하위 폴더 없음')])); }
          dirs.forEach(function (p) {
            var r = node('div', 'pick-row', [icon('folder'), txt(' ' + readable(p))]);
            r.addEventListener('click', function () { walk(p); });
            list.appendChild(r);
          });
        }).catch(function (err) {
          if (isAuth(err)) { return; }
          list.textContent = '';
          list.appendChild(node('div', 'dim', [txt(err.message)]));
        });
      }
      bg.addEventListener('click', function (ev) { if (ev.target === bg) { close(null); } });
      document.body.appendChild(bg);
      bg.classList.add('lit');
      walk(home);
    });
  }

  /* ---------- logout ---------- */

  function bye() {
    if (!confirm('로그아웃할까요?')) { return; }
    // Safari는 URL 계정(logout:logout@)을 무시해서 트릭이 원천 무효다. 분기한다.
    var safari = /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent);
    if (safari) {
      alert('Safari는 자동 로그아웃이 안 됩니다.\n브라우저를 완전히 종료해주세요.');
      return;
    }
    location.href = location.protocol + '//logout:logout@' + location.host + '/';
  }

  /* ---------- boot ---------- */

  // 부팅·폴더 이동·새로고침 성공은 조회일 뿐이라 기록하지 않는다. 변경 동작만 기록한다.
  shell();
  restore();
  store.entries = scrape(document);
  drawList();
  drawFeed();
})();
