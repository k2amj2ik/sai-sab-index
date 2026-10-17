/* SAB Index 프로토타입 공통 — 머리·꼬리말, 표기, 그래프, 저장(이 브라우저에만) */
(function () {
  var SAB = window.SAB = {};
  var GNB = [["search.html", "작품 검색"], ["artist.html", "작가"], ["movers.html", "마켓무버"], ["trust.html", "신뢰도"], ["mypage.html", "마이페이지"]];
  SAB.CAT = { "paintings": "회화", "prints-and-multiples": "판화", "works-on-paper": "종이 작품", "sculpture": "조각", "photographs": "사진", "mixed-media": "혼합 재료", "other": "기타", "ceramics": "도자" };
  SAB.GDESC = { S: "같은 작품의 이전 낙찰이 있음", A: "아주 비슷한 비교작 + 그림 닮음 + 최근 거래 충분", B: "비슷한 비교작 있음", C: "비교작 유사도 낮음 — 참고 범위만", "보류": "최근 5년 같은 종류 낙찰 10건 미만" };

  SAB.q = function (k) { return new URLSearchParams(location.search).get(k); };
  SAB.esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  SAB.won = function (v) {
    if (v == null) return "-";
    if (v >= 1e8) { var e = v / 1e8; return (e >= 100 ? Math.round(e).toLocaleString() : e.toFixed(e >= 10 ? 1 : 2)) + "억"; }
    if (v >= 1e4) return Math.round(v / 1e4).toLocaleString() + "만";
    return Math.round(v).toLocaleString();
  };
  SAB.pct = function (x, sign) { if (x == null) return "-"; var s = (x * 100).toFixed(Math.abs(x) < 0.1 ? 1 : 0) + "%"; return sign && x > 0 ? "+" + s : s; };
  SAB.arrow = function (x) { if (x == null) return '<span class="mut">-</span>'; return x > 0.005 ? '<span class="up">▲' + SAB.pct(Math.abs(x)) + "</span>" : x < -0.005 ? '<span class="down">▼' + SAB.pct(Math.abs(x)) + "</span>" : '<span class="mut">–0%</span>'; };
  SAB.grade = function (g) { return '<span class="grade g' + g + '" title="' + SAB.esc(SAB.GDESC[g] || "") + '">' + g + "</span>"; };
  SAB.img = function (src, alt) { return src ? '<img loading="lazy" src="' + SAB.esc(src) + '" alt="' + SAB.esc(alt || "") + '" onerror="this.style.display=\'none\'">' : ""; };
  SAB.ym = function (d) { return d ? d.slice(0, 7).replace("-", ".") : ""; };
  SAB.day = function (d) { return d ? d.slice(0, 10).replace(/-/g, ".") : ""; };

  /* 저장 — 프로토타입이라 이 브라우저에만 남는다 */
  SAB.load = function (k, def) { try { var v = localStorage.getItem("sabidx_" + k); return v ? JSON.parse(v) : def; } catch (e) { return def; } };
  SAB.save = function (k, v) { try { localStorage.setItem("sabidx_" + k, JSON.stringify(v)); } catch (e) {} };
  SAB.toast = function (m) { var t = document.querySelector(".toast"); if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); } t.textContent = m; t.classList.add("on"); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove("on"); }, 1800); };
  SAB.follows = function () { return SAB.load("follow", null) || (window.SAB_WORKS || []).filter(function (w) { return w.grade === "S"; }).slice(0, 6).map(function (w) { return w.id; }); };
  SAB.toggleFollow = function (id) { var f = SAB.follows(), i = f.indexOf(id); if (i >= 0) f.splice(i, 1); else f.unshift(id); SAB.save("follow", f); return i < 0; };

  /* 데이터 읽기 — 로컬(file://)은 script 태그로 이미 읽혀 있음.
     웹 배포본(window.SAB_ENC)은 data/*.bin(비밀번호로 잠근 파일)을 받아 풀어서 실행한다. 열쇠 = PBKDF2(잠금 비밀번호, 고정 소금). */
  var KEYP = null;
  function b64(s) { return Uint8Array.from(atob(s), function (c) { return c.charCodeAt(0); }); }
  function key() {
    if (KEYP) return KEYP;
    KEYP = (async function () {
      var raw = null; try { raw = localStorage.getItem("sabidx_dk"); } catch (e) {}
      if (raw) return crypto.subtle.importKey("raw", b64(raw), "AES-GCM", false, ["decrypt"]);
      var pw = null; try { pw = localStorage.getItem("sai_gate_pw"); } catch (e) {}
      var kb = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw || ""), "PBKDF2", false, ["deriveBits"]);
      var bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: new TextEncoder().encode("sab-index-data-v1"), iterations: 600000, hash: "SHA-256" }, kb, 256);
      try { localStorage.setItem("sabidx_dk", btoa(String.fromCharCode.apply(null, new Uint8Array(bits)))); } catch (e) {}
      return crypto.subtle.importKey("raw", bits, "AES-GCM", false, ["decrypt"]);
    })();
    return KEYP;
  }
  async function encRun(path) {
    var r = await fetch(path); if (!r.ok) throw new Error(path);
    var buf = new Uint8Array(await r.arrayBuffer()), k = await key();
    var pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: buf.slice(0, 12) }, k, buf.slice(12));
    (0, eval)(new TextDecoder().decode(pt));
  }
  SAB.boot = function (fn) {
    if (!window.SAB_ENC) return fn();
    var need = window.SAB_NEED || [];
    Promise.all(need.map(function (n) { return encRun("data/" + n + ".bin"); })).then(fn).catch(function () {
      try { localStorage.removeItem("sabidx_dk"); } catch (e) {}
      document.body.insertAdjacentHTML("beforeend", '<div class="wrap empty">데이터를 열지 못했습니다. 새로고침해 주세요.</div>');
    });
  };
  /* 작품 상세 데이터는 작품마다 따로 */
  SAB.work = function (id, cb) {
    if (window.SABW && window.SABW[id]) return cb(window.SABW[id]);
    if (window.SAB_ENC) { encRun("data/works/w" + id + ".bin").then(function () { cb(window.SABW && window.SABW[id]); }, function () { cb(null); }); return; }
    var s = document.createElement("script"); s.src = "data/works/w" + id + ".js";
    s.onload = function () { cb(window.SABW && window.SABW[id]); }; s.onerror = function () { cb(null); };
    document.head.appendChild(s);
  };

  SAB.shell = function (on) {
    var h = document.getElementById("header");
    h.innerHTML = '<div class="wrap"><h1><a href="index.html">SAB INDEX.</a><small>내부용 시안</small></h1><nav class="gnb">' +
      GNB.map(function (g) { return '<a href="' + g[0] + '"' + (g[0] === on ? ' class="on"' : "") + ">" + g[1] + "</a>"; }).join("") +
      '</nav><form class="hsearch" action="search.html"><input name="q" placeholder="작가·작품명" aria-label="검색어"><button aria-label="검색"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="10" cy="10" r="6.5"/><path d="M15 15l6 6"/></svg></button></form></div>';
    var f = document.getElementById("footer");
    if (f) f.innerHTML = '<div class="lg">SEOUL AUCTION BLUE</div><p>SAB Index 1단계 시안 · 사내 컨설턴트용 · 2026-10-18 데이터 기준</p><p class="mut" style="margin-top:6px">평가가격은 SAB DB 경매 기록(2016~)으로 계산한 시험판 값입니다. 외부 공유 금지.</p>';
  };

  /* ---------- 그래프 ---------- */
  function od(s) { var p = s.split("-"); return Date.UTC(+p[0], (+p[1] || 1) - 1, +(p[2] || 15)) / 864e5; }
  SAB.od = od;
  function axis(x0, x1, X, H) {
    var g = "", y0 = new Date(x0 * 864e5).getUTCFullYear() + 1, y1 = new Date(x1 * 864e5).getUTCFullYear(), step = (y1 - y0) > (SAB.narrow() ? 4 : 7) ? 2 : 1;
    for (var y = y0; y <= y1; y += step) { var xo = X(Date.UTC(y, 0, 1) / 864e5); g += '<line x1="' + xo.toFixed(1) + '" x2="' + xo.toFixed(1) + '" y1="8" y2="' + (H - 22) + '" class="grid"/><text x="' + xo.toFixed(1) + '" y="' + (H - 7) + '" class="ax" text-anchor="middle">' + y + "</text>"; }
    return g;
  }
  /* 평가가격 흐름: pts[{d:'YYYY-MM',v,lo,hi,mv}], own[{date,price}], now{v} */
  SAB.narrow = function () { return (window.innerWidth || 1000) < 600; };   // 휴대폰: 좁은 폭으로 그려 글자를 키운다
  SAB.flowSvg = function (pts, own, nowV, opt) {
    opt = opt || {};
    var W = SAB.narrow() ? 420 : 760, H = opt.h || (SAB.narrow() ? 260 : 240), pad = SAB.narrow() ? 50 : 58;
    var x0 = od(pts[0].d) - 20, x1 = od(opt.end || "2026-10-18") + 10;
    var ys = []; pts.forEach(function (p) { ys.push(p.lo, p.hi, p.v); }); (own || []).forEach(function (o) { if (o.price) ys.push(o.price); });
    var y0 = Math.min.apply(null, ys) * 0.88, y1 = Math.max.apply(null, ys) * 1.08;
    var X = function (o) { return pad + (o - x0) / Math.max(1, x1 - x0) * (W - pad - 14); };
    var Y = function (v) { return H - 22 - (v - y0) / Math.max(1, y1 - y0) * (H - 36); };
    var band = pts.map(function (p) { return X(od(p.d)).toFixed(1) + "," + Y(p.hi).toFixed(1); }).join(" ") + " " + X(x1).toFixed(1) + "," + Y(pts[pts.length - 1].hi).toFixed(1) + " " + X(x1).toFixed(1) + "," + Y(pts[pts.length - 1].lo).toFixed(1) + " " + pts.slice().reverse().map(function (p) { return X(od(p.d)).toFixed(1) + "," + Y(p.lo).toFixed(1); }).join(" ");
    var line = "", prev = null;
    pts.forEach(function (p) { var x = X(od(p.d)).toFixed(1), y = Y(p.v).toFixed(1); line += (prev ? " " + x + "," + prev : "") + " " + x + "," + y; prev = y; });
    line += " " + X(x1).toFixed(1) + "," + prev;
    var g = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="평가가격 흐름">' + axis(x0, x1, X, H);
    for (var k = 0; k < 4; k++) { var v = y0 + (y1 - y0) * k / 3; g += '<text x="' + (pad - 6) + '" y="' + (Y(v) + 4).toFixed(1) + '" class="ax" text-anchor="end">' + SAB.won(v) + "</text>"; }
    g += '<polygon points="' + band + '" class="band"/><polyline points="' + line + '" class="line"/>';
    (own || []).forEach(function (o) { if (o.price && od(o.date) >= x0) g += '<circle cx="' + X(od(o.date)).toFixed(1) + '" cy="' + Y(o.price).toFixed(1) + '" r="4" class="own"><title>같은 작품 ' + (o.status === "sold" ? "낙찰 " : "") + SAB.day(o.date) + " " + SAB.won(o.price) + "</title></circle>"; });
    pts.forEach(function (p) { if (p.mv) g += '<circle cx="' + X(od(p.d)).toFixed(1) + '" cy="' + Y(p.v).toFixed(1) + '" r="5" class="mv"><title>마켓무버 ' + SAB.ym(p.d) + " → " + SAB.won(p.v) + "</title></circle>"; });
    if (nowV) { var xn = X(x1 - 5), yn = Y(nowV); g += '<rect x="' + (xn - 5).toFixed(1) + '" y="' + (yn - 5).toFixed(1) + '" width="10" height="10" class="act" transform="rotate(45 ' + xn.toFixed(1) + " " + yn.toFixed(1) + ')"><title>오늘 평가가격 ' + SAB.won(nowV) + "</title></rect>"; }
    return g + "</svg>";
  };
  SAB.flowLegend = '<div class="legend"><span><i style="background:var(--idx)"></i>SAB Index 평가가격</span><span><i style="background:var(--band)"></i>범위(비교작 사분위)</span><span><i style="background:var(--own);border-radius:50%"></i>같은 작품 과거 거래</span><span><i style="background:var(--mv);border-radius:50%"></i>마켓무버</span><span><i style="background:var(--act);transform:rotate(45deg)"></i>오늘</span></div>';
  /* 참고 지표: 같은 기간, 첫 값 = 100 */
  var MC = { "SAB Index": "line", "S&P500": "m1", "KOSPI": "m2", "원/달러": "m3" };
  SAB.macroSvg = function (pts, opt) {
    opt = opt || {};
    var W = SAB.narrow() ? 420 : 760, H = SAB.narrow() ? 200 : 160, pad = SAB.narrow() ? 50 : 58, M = window.SAB_MACRO || {};
    var x0 = od(pts[0].d) - 20, x1 = od(opt.end || "2026-10-18") + 10, start = pts[0].d.slice(0, 7), lines = {};
    lines["SAB Index"] = pts.map(function (p) { return [od(p.d), p.v / pts[0].v * 100]; }).concat([[x1, pts[pts.length - 1].v / pts[0].v * 100]]);
    Object.keys(M).forEach(function (k) { var ks = Object.keys(M[k]).filter(function (m) { return m >= start; }).sort(); if (!ks.length) return; var b = M[k][ks[0]]; lines[k] = ks.map(function (m) { return [od(m + "-15"), M[k][m] / b * 100]; }); });
    var ys = []; Object.keys(lines).forEach(function (k) { lines[k].forEach(function (p) { ys.push(p[1]); }); });
    var y0 = Math.min.apply(null, ys) * 0.95, y1 = Math.max.apply(null, ys) * 1.05;
    var X = function (o) { return pad + (o - x0) / Math.max(1, x1 - x0) * (W - pad - 14); };
    var Y = function (v) { return H - 22 - (v - y0) / Math.max(1, y1 - y0) * (H - 36); };
    var g = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="참고 지표 비교">' + axis(x0, x1, X, H);
    for (var k = 0; k < 4; k++) { var v = y0 + (y1 - y0) * k / 3; g += '<text x="' + (pad - 6) + '" y="' + (Y(v) + 4).toFixed(1) + '" class="ax" text-anchor="end">' + Math.round(v) + "</text>"; }
    g += '<line x1="' + pad + '" x2="' + (W - 14) + '" y1="' + Y(100).toFixed(1) + '" y2="' + Y(100).toFixed(1) + '" class="base"/>';
    Object.keys(lines).forEach(function (k) { var l = lines[k]; if (l.length > 1) g += '<polyline points="' + l.map(function (p) { return X(p[0]).toFixed(1) + "," + Y(p[1]).toFixed(1); }).join(" ") + '" class="' + MC[k] + '"><title>' + k + "</title></polyline>"; });
    return g + "</svg>";
  };
  SAB.macroLegend = '<div class="legend"><span><i style="background:var(--idx)"></i>SAB Index</span><span><i style="background:var(--m1)"></i>S&amp;P500</span><span><i style="background:var(--m2)"></i>KOSPI</span><span><i style="background:var(--m3)"></i>원/달러 환율</span><span class="mut">· 같은 기간 첫 값 = 100 · 참고용(계산에는 미반영)</span></div>';
  /* 작은 흐름선(목록용) */
  SAB.spark = function (pts, w, h) {
    w = w || 120; h = h || 34; if (!pts || pts.length < 2) return "";
    var vs = pts.map(function (p) { return p.v; }), a = Math.min.apply(null, vs), b = Math.max.apply(null, vs), x0 = od(pts[0].d), x1 = od(pts[pts.length - 1].d);
    var d = pts.map(function (p) { return ((od(p.d) - x0) / Math.max(1, x1 - x0) * (w - 2) + 1).toFixed(1) + "," + (h - 2 - (p.v - a) / Math.max(1, b - a) * (h - 4)).toFixed(1); }).join(" ");
    return '<svg viewBox="0 0 ' + w + " " + h + '" width="' + w + '" height="' + h + '"><polyline points="' + d + '" fill="none" stroke="#000" stroke-width="1.3"/></svg>';
  };
  /* 유사도 가중 중간값(계산과 같음): [[값, 가중치]] */
  SAB.wmedian = function (vals) {
    vals = vals.slice().sort(function (a, b) { return a[0] - b[0]; });
    var tot = vals.reduce(function (s, x) { return s + x[1]; }, 0), acc = 0;
    for (var i = 0; i < vals.length; i++) { acc += vals[i][1]; if (acc >= tot / 2) return vals[i][0]; }
    return vals.length ? vals[vals.length - 1][0] : null;
  };
  /* 작품 카드(BR lot 카드) */
  SAB.lotCard = function (w, opt) {
    opt = opt || {};
    return '<div class="lot' + (opt.off ? " off" : "") + '"><a href="' + (opt.href || "artwork.html?id=" + w.id) + '"><div class="ph">' + (opt.badge ? '<span class="badge">' + opt.badge + "</span>" : "") + SAB.img(w.img, w.title) + (opt.x || "") + '</div><p class="nm">' + SAB.esc(w.title) + "</p></a>" + (opt.body || "") + "</div>";
  };
})();
