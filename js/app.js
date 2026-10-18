/* SAB Index (Wiveel판) 공통 — 머리말·꼬리말, 표기, 데이터 읽기(로컬 script / 웹 잠금 파일), 그래프 */
(function () {
  var SAB = window.SAB = {};
  SAB.TODAY = "2026-10-18";
  SAB.CAT = { "paintings": "회화", "prints-and-multiples": "판화", "works-on-paper": "종이 작품", "sculpture": "조각", "photographs": "사진", "mixed-media": "혼합 재료", "other": "기타", "ceramics": "도자", "design": "디자인", "textiles": "직물", "digital": "디지털", "jewelry": "주얼리", "furniture": "가구", "": "미분류" };
  SAB.GDESC = { S: "같은 작품의 이전 낙찰이 있어 가장 믿을 만함", A: "아주 비슷한 비교작 + 그림 닮음 + 최근 거래 충분", B: "비슷한 비교작 있음", C: "비교작 유사도 낮음 — 참고 범위로만", "보류": "근거가 부족해 값을 내지 않음" };
  SAB.q = function (k) { return new URLSearchParams(location.search).get(k); };
  SAB.esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  SAB.won = function (v) {
    if (v == null || isNaN(v)) return "-";
    if (v >= 1e8) { var e = v / 1e8; return (e >= 100 ? Math.round(e).toLocaleString() : e.toFixed(e >= 10 ? 1 : 2)) + "억"; }
    if (v >= 1e4) return Math.round(v / 1e4).toLocaleString() + "만";
    return Math.round(v).toLocaleString();
  };
  SAB.full = function (v) { return v == null ? "-" : "₩ " + Math.round(v).toLocaleString(); };
  SAB.pct = function (x) { return x == null || isNaN(x) ? "–" : (x > 0 ? "+" : "") + (x * 100).toFixed(Math.abs(x) < 0.1 ? 1 : 0) + "%"; };
  SAB.chg = function (x, big) { if (x == null || isNaN(x)) return ""; var u = x >= 0; return '<span class="' + (u ? "up" : "down") + '">' + (u ? "↑" : "↓") + " " + (Math.abs(x) * 100).toFixed(Math.abs(x) < 0.1 ? 1 : 0) + "%</span>"; };
  SAB.band = function (v) { return v == null ? "" : v < 1e7 ? "$" : v < 1e8 ? "$$" : v < 1e9 ? "$$$" : "$$$$"; };
  SAB.grade = function (g) { return '<span class="grade g' + g + '" title="' + SAB.esc(SAB.GDESC[g] || "") + '">' + (g === "보류" ? "판단 보류" : g + "등급") + "</span>"; };
  SAB.img = function (src, alt, cls) { return src ? '<img loading="lazy" ' + (cls ? 'class="' + cls + '" ' : "") + 'src="' + SAB.esc(src) + '" alt="' + SAB.esc(alt || "") + '" onerror="this.style.visibility=\'hidden\'">' : '<img alt="" style="visibility:hidden">'; };
  SAB.day = function (d) { return d ? d.slice(0, 10).replace(/-/g, ".") : ""; };
  SAB.ym = function (d) { return d ? d.slice(0, 7).replace("-", ".") : ""; };
  SAB.ago = function (d) { var m = Math.round((Date.UTC(2026, 9, 18) - Date.parse(d.slice(0, 10))) / (864e5 * 30.44)); return m < 1 ? "이번 달" : m < 12 ? m + "개월 전" : Math.floor(m / 12) + "년 전"; };
  SAB.load = function (k, def) { try { var v = localStorage.getItem("sabidx_" + k); return v ? JSON.parse(v) : def; } catch (e) { return def; } };
  SAB.save = function (k, v) { try { localStorage.setItem("sabidx_" + k, JSON.stringify(v)); } catch (e) {} };
  SAB.toast = function (m) { var t = document.querySelector(".toast"); if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); } t.textContent = m; t.classList.add("on"); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove("on"); }, 1900); };

  /* ---------- 데이터 읽기 ----------
     로컬(file://): <script src="data/...js"> / 웹 배포본(window.SAB_ENC): data/*.bin = AES-GCM(gzip(js)) — 열쇠는 잠금 비밀번호에서 PBKDF2 */
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
  async function gunzip(u8) {
    if (typeof DecompressionStream === "undefined") throw new Error("gzip 미지원 브라우저");
    var ds = new DecompressionStream("gzip"), s = new Blob([u8]).stream().pipeThrough(ds);
    return new Uint8Array(await new Response(s).arrayBuffer());
  }
  async function encRun(path) {
    var r = await fetch(path); if (!r.ok) throw new Error(path);
    var buf = new Uint8Array(await r.arrayBuffer()), k = await key();
    var pt = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: buf.slice(0, 12) }, k, buf.slice(12)));
    if (pt[0] === 0x1f && pt[1] === 0x8b) pt = await gunzip(pt);
    (0, eval)(new TextDecoder().decode(pt));
  }
  function scriptRun(path) { return new Promise(function (ok, no) { var s = document.createElement("script"); s.src = path; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }
  SAB.need = function (name) { return window.SAB_ENC ? encRun("data/" + name + ".bin") : scriptRun("data/" + name + ".js"); };
  SAB.boot = function (fn) {
    var need = window.SAB_NEED || [];
    if (!window.SAB_ENC) return fn();
    Promise.all(need.map(function (n) { return encRun("data/" + n + ".bin"); })).then(fn).catch(function (e) {
      try { localStorage.removeItem("sabidx_dk"); } catch (x) {}
      document.body.insertAdjacentHTML("beforeend", '<div class="empty">데이터를 열지 못했습니다. 새로고침해 주세요. (' + SAB.esc(e.message) + ")</div>");
    });
  };
  var LC = {};
  SAB.lots = function (aid) {   /* 작가 거래 기록 → 계산 엔진 형식 */
    if (LC[aid]) return LC[aid];
    LC[aid] = (window.SABL && window.SABL[aid] ? Promise.resolve() : SAB.need("lots/a" + aid)).then(function () { return SABE.load(window.SABL[aid]); });
    return LC[aid];
  };
  SAB.artist = function (aid) { return (window.SAB_ARTISTS2 || []).filter(function (a) { return a.id === aid; })[0]; };

  /* ---------- 머리말·꼬리말 ---------- */
  /* 시세로직 탭 하위 메뉴(blueIndex Demo는 js/bi.js의 BI.shell) */
  var SUB = [["logic.html", "계산 방식"], ["trust.html", "신뢰도"], ["movers.html", "마켓무버"], ["logic.html#data", "필요한 데이터"]];
  SAB.shell = function (on) {
    if (window.BI) BI.shell("logic");
    var sb = document.getElementById("sub");
    if (sb) sb.innerHTML = '<div class="w">' + SUB.map(function (n) { return '<a href="' + n[0] + '"' + (n[0] === on ? ' class="on"' : "") + ">" + n[1] + "</a>"; }).join("") + "</div>";
  };
  SAB.artistHead = function (a) {
    if (!a) return "";
    var ys = a.years, last = ys[ys.length - 1];
    var sp = SAB.sparkY(ys.map(function (y) { return y.med; }), 70, 26);
    return '<div class="ahd"><div class="w"><div class="ph">' + SAB.esc((a.name || "?").slice(0, 1)) + '</div><div><h1>' + SAB.esc(a.name) + '</h1><p class="nat">SAB DB 거래 ' + a.lots.toLocaleString() + "건 · 작품 " + a.works.toLocaleString() + '점</p></div><div class="stats">' +
      '<div><p class="l">SAB 순위 <span class="helpq" title="이 시안의 작가 ' + (window.SAB_ARTISTS2 || []).length + '명 중 2023~2025 낙찰 총액 순 · ' + SAB.esc(a.stage || '') + '">?</span></p><p class="v">' + a.rank + '</p></div>' +
      '<div><p class="l">수요 등급 <span class="helpq" title="2023~2025 낙찰률(낙찰 ÷ 낙찰+유찰)">?</span></p><p class="g">' + a.grade + '</p><p class="st">' + "★★★★★".slice(0, a.stars) + '<span style="color:#ddd">' + "★★★★★".slice(a.stars) + '</span> <span class="mut" style="font-size:11px;letter-spacing:0">' + (a.sellthrough3 != null ? Math.round(a.sellthrough3 * 100) + "%" : "") + '</span></p></div>' +
      (a.ridx ? '<div><p class="l">가격 지수 <span class="helpq" title="반복 거래 지수 — 같은 작품이 다시 팔린 ' + a.rpairs + '쌍으로 계산, 2016 = 100. 숫자 = 2025 지수, 아래 = 2024→2025 변화">?</span></p><div>' + SAB.sparkY(a.ridx.filter(function (x) { return x[1]; }).map(function (x) { return x[1]; }), 70, 26) + '</div><p class="d"><span style="color:#444">' + Math.round(a.ridx[a.ridx.length - 1][1] || 0) + '</span> <span class="' + (a.ridx_chg >= 0 ? "up" : "down") + '">' + SAB.pct(a.ridx_chg) + '</span></p></div>'
      : '<div><p class="l">가격 흐름 <span class="helpq" title="반복 거래가 적어 지수 대신 연도별 낙찰가 중간값(단순 집계) — 2025 vs 2024">?</span></p><div>' + sp + '</div><p class="d ' + (a.pidx >= 0 ? "up" : "down") + '">' + (a.pidx == null && a.pidx_note ? a.pidx_note : SAB.pct(a.pidx)) + '</p></div>') +
      "</div></div></div>";
  };

  /* ---------- 그래프 ---------- */
  function od(s) { var p = s.split("-"); return Date.UTC(+p[0], (+p[1] || 1) - 1, +(p[2] || 15)) / 864e5; }
  SAB.od = od;
  SAB.narrow = function () { return (window.innerWidth || 1200) < 700; };
  SAB.sparkY = function (vs, w, h) {
    if (!vs || vs.length < 2) return "";
    var a = Math.min.apply(null, vs), b = Math.max.apply(null, vs);
    var d = vs.map(function (v, i) { return (i / (vs.length - 1) * (w - 2) + 1).toFixed(1) + "," + (h - 2 - (v - a) / Math.max(1, b - a) * (h - 4)).toFixed(1); }).join(" ");
    return '<svg viewBox="0 0 ' + w + " " + h + '" width="' + w + '" height="' + h + '"><polyline points="' + d + '" fill="none" stroke="#2a9d1e" stroke-width="1.4"/></svg>';
  };
  function axis(x0, x1, X, H) {
    var g = "", y0 = new Date(x0 * 864e5).getUTCFullYear() + 1, y1 = new Date(x1 * 864e5).getUTCFullYear(), step = (y1 - y0) > (SAB.narrow() ? 4 : 7) ? 2 : 1;
    for (var y = y0; y <= y1; y += step) { var xo = X(Date.UTC(y, 0, 1) / 864e5); g += '<line x1="' + xo.toFixed(1) + '" x2="' + xo.toFixed(1) + '" y1="8" y2="' + (H - 22) + '" class="grid"/><text x="' + xo.toFixed(1) + '" y="' + (H - 7) + '" class="ax" text-anchor="middle">' + y + "</text>"; }
    return g;
  }
  SAB.flowSvg = function (pts, own, nowV) {
    var W = SAB.narrow() ? 420 : 900, H = SAB.narrow() ? 250 : 260, pad = SAB.narrow() ? 50 : 62;
    var x0 = od(pts[0].d) - 20, x1 = od(SAB.TODAY) + 10;
    var ys = []; pts.forEach(function (p) { ys.push(p.lo, p.hi, p.v); }); (own || []).forEach(function (o) { if (o.price) ys.push(o.price); }); if (nowV) ys.push(nowV);
    var y0 = Math.min.apply(null, ys) * 0.88, y1 = Math.max.apply(null, ys) * 1.08;
    var X = function (o) { return pad + (o - x0) / Math.max(1, x1 - x0) * (W - pad - 14); };
    var Y = function (v) { return H - 22 - (v - y0) / Math.max(1, y1 - y0) * (H - 36); };
    var last = pts[pts.length - 1];
    var band = pts.map(function (p) { return X(od(p.d)).toFixed(1) + "," + Y(p.hi).toFixed(1); }).join(" ") + " " + X(x1).toFixed(1) + "," + Y(last.hi).toFixed(1) + " " + X(x1).toFixed(1) + "," + Y(last.lo).toFixed(1) + " " + pts.slice().reverse().map(function (p) { return X(od(p.d)).toFixed(1) + "," + Y(p.lo).toFixed(1); }).join(" ");
    var line = pts.map(function (p) { return X(od(p.d)).toFixed(1) + "," + Y(p.v).toFixed(1); }).join(" ") + " " + X(x1).toFixed(1) + "," + Y(nowV || last.v).toFixed(1);
    var g = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="평가가격 흐름">' + axis(x0, x1, X, H);
    for (var k = 0; k < 4; k++) { var v = y0 + (y1 - y0) * k / 3; g += '<text x="' + (pad - 6) + '" y="' + (Y(v) + 4).toFixed(1) + '" class="ax" text-anchor="end">' + SAB.won(v) + "</text>"; }
    g += '<polygon points="' + band + '" class="band"/><polyline points="' + line + '" class="line"/>';
    (own || []).forEach(function (o) { if (o.price && od(o.date) >= x0) g += '<circle cx="' + X(od(o.date)).toFixed(1) + '" cy="' + Y(o.price).toFixed(1) + '" r="4" class="own"><title>이 작품 ' + (o.status === "passed" ? "유찰(최저 추정가 −10%) " : "낙찰 ") + SAB.day(o.date) + " " + SAB.won(o.price) + "</title></circle>"; });
    pts.forEach(function (p) { if (p.mv) g += '<circle cx="' + X(od(p.d)).toFixed(1) + '" cy="' + Y(p.v).toFixed(1) + '" r="5.5" class="mv"><title>마켓무버 ' + SAB.ym(p.d) + " → " + SAB.won(p.v) + "</title></circle>"; });
    if (nowV) { var xn = X(x1 - 4), yn = Y(nowV); g += '<circle cx="' + xn.toFixed(1) + '" cy="' + yn.toFixed(1) + '" r="6" class="act"><title>오늘 ' + SAB.won(nowV) + "</title></circle>"; }
    return g + "</svg>";
  };
  SAB.flowLegend = '<div class="legend"><span><i style="background:var(--gold)"></i>SAB Index 평가가격</span><span><i style="background:rgba(180,109,8,.25);height:10px"></i>범위</span><span><i class="dot" style="background:#555"></i>이 작품의 과거 거래</span><span><i class="dot" style="background:var(--gold)"></i>마켓무버</span></div>';
  var MC = { "SAB Index": "line", "S&P500": "m1", "KOSPI": "m2", "원/달러": "m3" };
  SAB.macroSvg = function (pts) {
    var W = SAB.narrow() ? 420 : 900, H = SAB.narrow() ? 190 : 170, pad = SAB.narrow() ? 50 : 62, M = window.SAB_MACRO || {};
    var x0 = od(pts[0].d) - 20, x1 = od(SAB.TODAY) + 10, start = pts[0].d.slice(0, 7), lines = {};
    lines["SAB Index"] = pts.map(function (p) { return [od(p.d), p.v / pts[0].v * 100]; }).concat([[x1, pts[pts.length - 1].v / pts[0].v * 100]]);
    Object.keys(M).forEach(function (k) { var ks = Object.keys(M[k]).filter(function (m) { return m >= start; }).sort(); if (!ks.length) return; var b = M[k][ks[0]]; lines[k] = ks.map(function (m) { return [od(m + "-15"), M[k][m] / b * 100]; }); });
    var ys = []; Object.keys(lines).forEach(function (k) { lines[k].forEach(function (p) { ys.push(p[1]); }); });
    var y0 = Math.min.apply(null, ys) * 0.95, y1 = Math.max.apply(null, ys) * 1.05;
    var X = function (o) { return pad + (o - x0) / Math.max(1, x1 - x0) * (W - pad - 14); };
    var Y = function (v) { return H - 22 - (v - y0) / Math.max(1, y1 - y0) * (H - 36); };
    var g = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="참고 지표">' + axis(x0, x1, X, H);
    for (var k = 0; k < 4; k++) { var v = y0 + (y1 - y0) * k / 3; g += '<text x="' + (pad - 6) + '" y="' + (Y(v) + 4).toFixed(1) + '" class="ax" text-anchor="end">' + Math.round(v) + "</text>"; }
    g += '<line x1="' + pad + '" x2="' + (W - 14) + '" y1="' + Y(100).toFixed(1) + '" y2="' + Y(100).toFixed(1) + '" class="base"/>';
    Object.keys(lines).forEach(function (k) { var l = lines[k]; if (l.length > 1) g += '<polyline points="' + l.map(function (p) { return X(p[0]).toFixed(1) + "," + Y(p[1]).toFixed(1); }).join(" ") + '" class="' + MC[k] + '"><title>' + k + "</title></polyline>"; });
    return g + "</svg>";
  };
  SAB.macroLegend = '<div class="legend"><span><i style="background:var(--gold)"></i>SAB Index</span><span><i style="background:#9a9a9a"></i>S&amp;P500</span><span><i style="background:#4d8ed3"></i>KOSPI</span><span><i style="background:#c9c9c9"></i>원/달러</span><span>· 같은 기간 첫 값 = 100 · 참고용(계산에는 미반영)</span></div>';

  /* 작가 가격 지수 그래프(Wiveel 작가 화면: 지수 면적 + S&P500 선 + 연도별 거래량 막대) */
  SAB.artistChart = function (a) {
    var W = SAB.narrow() ? 420 : 1000, H = 230, pad = SAB.narrow() ? 40 : 54, yrs = a.years.filter(function (y) { return y.y >= "2016" && y.y <= "2025"; });
    var ri = {}; (a.ridx || []).forEach(function (x) { if (x[1]) ri[x[0]] = x[1]; });
    var M = (window.SAB_MACRO || {})["S&P500"] || {}, sp = {}, b0 = M["2016-01"];
    for (var y = 2016; y <= 2025; y++) { var m = M[y + "-12"] || M[y + "-11"]; if (m && b0) sp[y] = m / b0 * 100; }
    var vals = Object.keys(ri).map(function (k) { return ri[k]; }).concat(Object.keys(sp).map(function (k) { return sp[k]; })), top = Math.max.apply(null, vals.concat([150])) * 1.1;
    var X = function (y) { return pad + (y - 2016) / 9 * (W - pad - 20); }, Y = function (v) { return 150 - v / top * 140; };
    var mxN = Math.max.apply(null, yrs.map(function (y) { return y.n; }));
    var g = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="가격 지수">';
    [0, 100, 200, 300, 400, 500].forEach(function (v) { if (v < top) g += '<line x1="' + pad + '" x2="' + (W - 20) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" class="grid"/><text x="' + (pad - 6) + '" y="' + (Y(v) + 4) + '" class="ax" text-anchor="end">' + v + '</text>'; });
    var keys = Object.keys(ri).map(Number).sort();
    if (keys.length > 1) g += '<polygon fill="rgba(77,142,211,.18)" points="' + keys.map(function (y) { return X(y) + "," + Y(ri[y]); }).join(" ") + ' ' + X(keys[keys.length - 1]) + ',' + Y(0) + ' ' + X(keys[0]) + ',' + Y(0) + '"/><polyline fill="none" stroke="#4d8ed3" stroke-width="2.4" points="' + keys.map(function (y) { return X(y) + "," + Y(ri[y]); }).join(" ") + '"/>';
    g += '<polyline fill="none" stroke="#9a9a9a" stroke-width="1.4" stroke-dasharray="4 3" points="' + Object.keys(sp).map(function (y) { return X(+y) + "," + Y(sp[y]); }).join(" ") + '"/>';
    yrs.forEach(function (y) { var x = X(+y.y), h = y.n / mxN * 52; g += '<rect x="' + (x - 7) + '" y="' + (164) + '" width="14" height="' + h.toFixed(1) + '" fill="#d6d6d6"><title>' + y.y + ' 낙찰 ' + y.n + '건</title></rect><text x="' + x + '" y="' + (H - 2) + '" class="ax" text-anchor="middle">' + (SAB.narrow() && +y.y % 2 ? "" : y.y) + '</text>'; });
    keys.forEach(function (y) { g += '<circle cx="' + X(y) + '" cy="' + Y(ri[y]) + '" r="3" fill="#4d8ed3"><title>' + y + ' 지수 ' + ri[y] + '</title></circle>'; });
    return '<div class="legend">' + (keys.length > 1 ? '<span><i style="background:#4d8ed3"></i>반복 거래 지수(2016 = 100, 같은 작품 ' + a.rpairs + '쌍)</span>' : '<span>반복 거래가 ' + (a.rpairs || 0) + '쌍뿐이라 지수를 만들지 않았습니다(40쌍 이상 필요)</span>') + '<span><i style="background:#9a9a9a"></i>S&amp;P500 (2016.01 = 100)</span><span><i style="background:#d6d6d6;height:10px"></i>연도별 낙찰 건수</span></div><div class="chart">' + g + '</svg></div>';
  };

  /* 포트폴리오(이 브라우저에만 저장) */
  SAB.pf = function () { return SAB.load("pf", null) || []; };
  SAB.pfToggle = function (aid, id) { var p = SAB.pf(), i = p.findIndex(function (x) { return x.id === id; }); if (i >= 0) p.splice(i, 1); else p.unshift({ aid: aid, id: id, at: SAB.TODAY }); SAB.save("pf", p); return i < 0; };
  SAB.inPf = function (id) { return SAB.pf().some(function (x) { return x.id === id; }); };
})();
