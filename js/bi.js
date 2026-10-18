/* blueIndex Demo 공통 — 2015 BR 기획서(20150930) 화면 부품: 맨 위 탭, GNB, 작가 요약 바, 목록 카드, 알림 띠, 모달.
   데이터 읽기·계산은 js/app.js(SAB)·js/engine.js(SABE)를 그대로 쓴다. */
(function () {
  var S = window.SAB, BI = window.BI = {};
  BI.TODAY = S.TODAY;
  BI.M3 = "2026-07-18";                       // 기획: 목록·상세의 "3 mon ago" 평가가격 기준일
  BI.Y1 = "2025-10-18";
  BI.REVIEW = "https://k2amj2ik.github.io/sai-dataset-review/";
  var esc = S.esc;

  /* ---------- 표기 ---------- */
  BI.arts = function () { return window.SAB_ARTISTS2 || []; };
  BI.art = function (aid) { return BI.arts().filter(function (a) { return a.id === String(aid); })[0]; };
  BI.en = function (a) { return (a.info && a.info.name_en) || a.name || "?"; };
  BI.ko = function (a) { var k = (a.info && a.info.name_ko) || ""; return k && k !== BI.en(a) ? k : ""; };
  BI.life = function (a) { var i = a.info || {}; if (!i.birth) return ""; return i.death ? i.birth + "-" + i.death : "B." + i.birth; };
  BI.natLine = function (a) { var i = a.info || {}; return [i.nat, BI.life(a)].filter(Boolean).join(", "); };
  BI.CAT = { "paintings": "Paintings", "prints-and-multiples": "Prints and Multiples", "works-on-paper": "Works on Paper", "sculpture": "Sculptures", "photographs": "Photographs", "mixed-media": "Mixed Media", "design": "Design", "ceramics": "Ceramics", "other": "ETC", "digital": "Digital", "textiles": "Textiles", "furniture": "Furniture", "jewelry": "Jewelry", "": "ETC" };
  BI.cat = function (c) { return BI.CAT[c] || (c ? c.replace(/-/g, " ").replace(/\b\w/g, function (x) { return x.toUpperCase(); }) : "ETC"); };
  BI.won = function (v) { return v == null || isNaN(v) ? "-" : "₩ " + Math.round(v).toLocaleString(); };
  var SYM = { KRW: "₩", USD: "$", GBP: "£", EUR: "€", JPY: "¥", HKD: "HK$", CNY: "CN¥", CHF: "CHF ", TWD: "NT$", SGD: "S$", AUD: "A$", CAD: "C$" };
  BI.cur = function (v, c) { if (v == null) return "-"; var s = SYM[c]; return s ? s + " " + Math.round(v).toLocaleString() : Math.round(v).toLocaleString() + " " + (c || ""); };
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  BI.dt = function (d) { if (!d) return ""; var p = d.split("-"); return +p[2] + " " + MON[+p[1] - 1] + " " + p[0]; };     // 기획 P06: 1 Jan 2015
  BI.mY = function (d) { if (!d) return ""; var p = d.split("-"); return MON[+p[1] - 1].toUpperCase() + " " + p[0]; };
  BI.dd = function (d) { return Math.round((Date.parse(d) - Date.parse(BI.TODAY)) / 864e5); };
  BI.ago = function (d) {   // 기획 P06 날짜 표시
    var n = -BI.dd(d); if (n <= 0) return "Today"; if (n === 1) return "Yesterday"; if (n < 31) return n + " days ago";
    var m = Math.round(n / 30.44); if (m < 12) return m + (m === 1 ? " mon" : " mon") + " ago"; var y = Math.floor(m / 12); return y + (y === 1 ? " yr" : " yrs") + " ago";
  };
  BI.pct = function (x) { return x == null || isNaN(x) ? "" : (Math.abs(x) * 100).toFixed(Math.abs(x) < 0.1 ? 1 : 0) + "%"; };
  BI.ud = function (x, opt) { if (x == null || isNaN(x)) return ""; if (Math.abs(x) < 0.005) return '<span class="mut">stable</span>'; var u = x > 0; return '<span class="' + (u ? "up" : "down") + '">' + BI.pct(x) + (u ? "↑" : "↓") + "</span>"; };
  BI.rk = function (n) { if (!n) return '<small class="mut">-</small>'; return '<small class="' + (n > 0 ? "up" : "down") + '">' + (n > 0 ? "↑" : "↓") + Math.abs(n) + "</small>"; };
  BI.stars = function (g) { var n = { Prime: 5, High: 4, Neutral: 3, Low: 2 }[g] || 0; return "★★★★★".slice(0, n) + '<span style="color:#ddd">' + "★★★★★".slice(n) + "</span>"; };
  BI.img = function (src, alt, cls) { return src ? '<img loading="lazy" src="' + esc(src) + '" alt="' + esc(alt || "") + '"' + (cls ? ' class="' + cls + '"' : "") + ' onerror="this.outerHTML=\'<div class=noimg>No Image</div>\'">' : '<div class="noimg">No Image</div>'; };
  BI.q = S.q;
  BI.forSale = function (r) { return r.status === "upcoming" && BI.dd(r.date) >= 0; };   // 경매일이 지난 upcoming = 결과 미반영(Pending) — Only for Sale·Available Works에서 뺌

  /* ---------- 아이콘(기획서 그림의 globe·pin·겹친 사각형·폴더+ 등) ---------- */
  var sv = function (p, vb) { return '<svg viewBox="' + (vb || "0 0 24 24") + '" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + p + "</svg>"; };
  BI.ic = {
    globe: sv('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>'),
    pin: sv('<path d="M12 21s-6-6.1-6-11a6 6 0 0 1 12 0c0 4.9-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/>'),
    stack: sv('<rect x="3" y="7" width="12" height="12"/><path d="M8 7V4h12v12h-5"/>'),
    fold: sv('<path d="M3 7h6l2 2h10v10H3z"/><path d="M12 12v5M9.5 14.5h5"/>'),
    gear: sv('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>'),
    search: sv('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/>'),
    user: sv('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
    ok: sv('<circle cx="12" cy="12" r="9" stroke="#1aa34a"/><path d="M8 12.5l3 3 5-6" stroke="#1aa34a"/>'),
    tri: sv('<path d="M12 4l9 16H3z" stroke="#999"/>'),
    no: sv('<circle cx="12" cy="12" r="9" stroke="#e46a8a"/><path d="M5.6 18.4L18.4 5.6" stroke="#e46a8a"/>'),
    trophy: sv('<path d="M7 4h10v5a5 5 0 0 1-10 0z" stroke="#e0457b"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8" stroke="#e0457b"/>'),
    rise: sv('<path d="M3 17l6-6 4 4 8-8M15 7h6v6" stroke="#f07c17"/>')
  };
  BI.catIc = {
    "paintings": sv('<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10" cy="7" r="1.2"/><circle cx="15" cy="7" r="1.2"/>'),
    "photographs": sv('<rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8 7l1.5-3h5L16 7"/>'),
    "prints-and-multiples": sv('<rect x="4" y="4" width="16" height="7" rx="1"/><path d="M12 11v4M9 15h6v6H9z"/>'),
    "sculpture": sv('<circle cx="12" cy="6" r="3"/><path d="M8 21v-6c0-2.5 1.8-4 4-4s4 1.5 4 4v6M6 21h12"/>'),
    "works-on-paper": sv('<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h7M9 16h5"/>'),
    "_": sv('<circle cx="6" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="18" cy="12" r="1.5"/>')
  };

  /* ---------- 맨 위 탭 + 머리말 + 꼬리말 ---------- */
  BI.shell = function (tab, q) {
    var tt = document.getElementById("tt"), hd = document.getElementById("hd"), ft = document.getElementById("ft");
    if (tt) tt.innerHTML = '<div class="w"><a href="index.html"' + (tab === "demo" ? ' class="on"' : "") + '>blueIndex Demo</a><a href="logic.html"' + (tab === "logic" ? ' class="on"' : "") + '>시세로직</a><a class="ext" href="' + BI.REVIEW + '" target="_blank" rel="noopener">데이터 검수</a></div>';
    if (hd && tab === "demo") {
      hd.innerHTML = '<div class="w"><a class="logo" href="index.html">blue<b>Index</b></a><div class="srch"><form action="result.html" autocomplete="off"><input name="q" value="' + esc(q || "") + '" placeholder="Search Artists and Artworks" aria-label="검색"><button aria-label="검색">' + BI.ic.search.replace("<svg", '<svg width="18" height="18"') + '</button></form></div><div class="rt"><a class="user" href="portfolio.html">Consultant ▾</a><a class="out" href="index.html">Log Out</a></div></div>';
      BI.ac(hd.querySelector(".srch"));
    }
    if (ft) ft.innerHTML = "<b>© blueIndex</b>Seoul Auction Blue · blueIndex Demo — 2015 Wiveel(BR) 기획서 화면을 SAB DB 경매 기록(2016~)으로 재현 · " + BI.TODAY + " 기준 · 내부 검토용, 외부 공유 금지";
    if (!document.querySelector(".top")) document.body.insertAdjacentHTML("beforeend", '<a class="top" href="#" aria-label="맨 위로" onclick="window.scrollTo(0,0);return false">↑</a>');
  };
  /* 작가 자동완성(기획 메인: 3글자 이상, 일치 부분 굵게) */
  BI.match = function (s) {
    s = (s || "").trim().toLowerCase(); if (!s) return [];
    return BI.arts().filter(function (a) { return [BI.en(a), BI.ko(a), a.name].some(function (n) { return n && n.toLowerCase().indexOf(s) >= 0; }); })
      .sort(function (x, y) { return x.grank - y.grank; });
  };
  function bold(n, s) { var i = n.toLowerCase().indexOf(s.toLowerCase()); return i < 0 ? esc(n) : esc(n.slice(0, i)) + "<b>" + esc(n.slice(i, i + s.length)) + "</b>" + esc(n.slice(i + s.length)); }
  BI.ac = function (box) {
    var inp = box.querySelector("input"), form = box.querySelector("form"), list = null, sel = -1;
    function close() { if (list) { list.remove(); list = null; } sel = -1; }
    inp.addEventListener("input", function () {
      close(); var s = inp.value.trim(); if (s.length < 2) return;
      var m = BI.match(s).slice(0, 8); if (!m.length) return;
      list = document.createElement("div"); list.className = "ac";
      list.innerHTML = m.map(function (a) { var ko = BI.ko(a); return '<a href="result.html?a=' + a.id + '"><span>' + bold(BI.en(a), s) + (ko ? ' <small>' + bold(ko, s) + "</small>" : "") + '</span><small>' + esc(BI.life(a)) + "</small></a>"; }).join("");
      box.appendChild(list);
    });
    inp.addEventListener("keydown", function (e) {
      if (!list) return; var it = list.querySelectorAll("a");
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); sel = (sel + (e.key === "ArrowDown" ? 1 : -1) + it.length) % it.length; it.forEach(function (x, i) { x.classList.toggle("on", i === sel); }); }
      if (e.key === "Enter" && sel >= 0) { e.preventDefault(); location.href = it[sel].getAttribute("href"); }
      if (e.key === "Escape") close();
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault(); var m = BI.match(inp.value);
      if (m.length) location.href = "result.html?a=" + m[0].id; else BI.msg("warn", "<b>Nothing found!</b> Please insert an artist name — 이 데모는 작가 " + BI.arts().length + "명(1단계 블루칩 50인 + 순위표 2·3단계)을 담고 있습니다.");
    });
    document.addEventListener("click", function (e) { if (!box.contains(e.target)) close(); });
  };

  /* ---------- 알림 띠·모달 ---------- */
  BI.msg = function (type, html) {
    var m = document.querySelector(".msg"); if (!m) { m = document.createElement("div"); document.body.appendChild(m); }
    m.className = "msg " + type; m.innerHTML = html; void m.offsetWidth; m.classList.add("on");
    clearTimeout(m._h); m._h = setTimeout(function () { m.classList.remove("on"); }, 3200);
  };
  BI.modal = function (html, cls) {
    var m = document.createElement("div"); m.className = "mo";
    m.innerHTML = '<div class="bx ' + (cls || "") + '"><button class="x" aria-label="닫기">×</button>' + html + "</div>";
    document.body.appendChild(m);
    var close = function () { m.remove(); };
    m.addEventListener("click", function (e) { if (e.target === m || e.target.classList.contains("x") || e.target.hasAttribute("data-close")) close(); });
    return { el: m, close: close };
  };

  /* ---------- 작가 요약 바(기획 P13 · Common UI P06) ---------- */
  BI.spark = function (vs, w, h, col) {
    vs = (vs || []).filter(function (v) { return v != null; }); if (vs.length < 2) return "";
    var a = Math.min.apply(null, vs), b = Math.max.apply(null, vs);
    var d = vs.map(function (v, i) { return (i / (vs.length - 1) * (w - 2) + 1).toFixed(1) + "," + (h - 2 - (v - a) / Math.max(1e-9, b - a) * (h - 4)).toFixed(1); }).join(" ");
    return '<svg viewBox="0 0 ' + w + " " + h + '" width="' + w + '" height="' + h + '" preserveAspectRatio="none"><polyline points="' + d + '" fill="none" stroke="' + (col || "#26b631") + '" stroke-width="1.5"/></svg>';
  };
  /* Price Index(작가): 반복 거래 지수가 있으면 그것, 없으면 연도별 cm²당 낙찰가 중간값 — 최근 1년 변화 */
  BI.pidx = function (a) {
    if (a.ridx && a.ridx.length > 1) { var v = a.ridx.filter(function (x) { return x[1]; }); return { vs: v.map(function (x) { return x[1]; }), chg: a.ridx_chg, how: "반복 거래 지수(같은 작품 재판매 " + a.rpairs + "쌍, 2016 = 100)" }; }
    var y = (a.series && a.series.y) || {}, ks = Object.keys(y).filter(function (k) { return k <= "2025" && y[k][2]; }).sort();
    var vs = ks.map(function (k) { return y[k][2]; }), chg = ks.length > 1 ? vs[vs.length - 1] / vs[vs.length - 2] - 1 : null;
    return { vs: vs, chg: chg != null && Math.abs(chg) <= 1 ? chg : null, how: "연도별 cm²당 낙찰가 중간값(기획서 정의) — " + (ks.length > 1 ? ks[ks.length - 2] + "→" + ks[ks.length - 1] : "자료 부족") };
  };
  BI.abar = function (a, simple) {
    if (!a) return "";
    var p = BI.pidx(a), i = a.info || {}, ko = BI.ko(a);
    return '<div class="ab' + (simple ? " simple" : "") + '"><div class="w"><div class="ph">' + esc(BI.en(a).slice(0, 1)) + '</div><div class="nm"><h1>' + esc(BI.en(a)) + '</h1><p class="nat">' + esc(BI.natLine(a)) + (ko ? " · " + esc(ko) : "") + '</p></div><div class="st">' +
      '<div><p class="l">Global Rank<span class="qm" title="Rank in Global — 이 데모 작가 ' + BI.arts().length + '명 중 최근 1년 낙찰 총액 순위(기획서는 Artist Price Index 순위). 아래 = 1년 전 대비">?</span></p><p class="v">' + BI.ic.globe + a.grank + '</p><p class="d">' + BI.rk(a.grank_chg) + "</p></div>" +
      '<div><p class="l">Local Rank<span class="qm" title="Rank in Origin — 같은 국적(' + esc(i.nat || "?") + ') 작가 ' + a.lrank_of + '명 중 순위">?</span></p><p class="v">' + BI.ic.pin + a.lrank + '</p><p class="d"><span class="mut">' + esc(cc(i.nat)) + "</span> " + BI.rk(a.lrank_chg) + "</p></div>" +
      '<div><p class="l">Demand Grade<span class="qm" title="낙찰가 ÷ 추정가 평균(EvP), 최근 3년 ' + (a.evp_n || 0) + '건 평균 ' + (a.evp ? a.evp.toFixed(2) : "-") + ' · Prime > 2 / High > 1.25 / Neutral > 0.75 / Low">?</span></p><p class="dg ' + (a.demand || "") + '">' + esc((a.demand || "-").toUpperCase()) + '</p><p class="stars">' + BI.stars(a.demand) + "</p></div>" +
      '<div><p class="l">Price Index<span class="qm" title="' + esc(p.how) + '">?</span></p><div>' + BI.spark(p.vs, 64, 24) + '</div><p class="d">' + (p.chg == null ? '<span class="mut">-</span>' : BI.ud(p.chg)) + "</p></div>" +
      '</div><a class="more" href="artist.html?a=' + a.id + '"><span>More<br>About<br>' + esc(BI.en(a)) + "</span>&gt;</a></div></div>";
  };
  var CC = { "United States": "USA", "South Korea": "KOR", "Korea": "KOR", "United Kingdom": "UK", "Japan": "JPN", "China": "CHN", "France": "FRA", "Germany": "GER", "Spain": "ESP", "Italy": "ITA" };
  function cc(n) { return CC[n] || (n || "").slice(0, 3).toUpperCase(); }
  BI.cc = cc;

  /* ---------- 가격대($~$$$$): 그 작가 낙찰가의 4분위(기획은 최저~최고 사이 25%씩 — 고가 몇 점 때문에 거의 다 $가 돼 분위로 바꿈) ---------- */
  BI.bandsOf = function (D) {
    var p = D.rows.filter(function (r) { return r.status === "sold" && r.price; }).map(function (r) { return r.price; }).sort(function (a, b) { return a - b; });
    if (p.length < 4) return [Infinity, Infinity, Infinity];
    return [p[Math.floor(p.length * .25)], p[Math.floor(p.length * .5)], p[Math.floor(p.length * .75)]];
  };
  BI.band = function (v, q) { if (v == null) return ""; return v < q[0] ? "$" : v < q[1] ? "$$" : v < q[2] ? "$$$" : "$$$$"; };
  BI.sizeOf = function (r) { var m = (r.size || "").match(/([\d.]+)\s*x\s*([\d.]+)/); if (!m) return null; var l = Math.max(+m[1], +m[2]) / 2.54; return l < 21 ? "S" : l < 39 ? "M" : l < 61 ? "L" : "XL"; };   // 기획 P14: 장축 inch

  /* ---------- 3개월 전 평가(목록 카드·상세 공통, 작품 단위 캐시) ---------- */
  var E3 = {};
  BI.est = function (D, aid, id, asof, opt) {
    var k = aid + "|" + id + "|" + asof + (opt ? JSON.stringify(opt) : "");
    if (!E3[k]) { var e = SABE.today(D, id, asof, opt); E3[k] = e; }
    return E3[k];
  };

  /* ---------- 목록 카드(기획 P19) ---------- */
  BI.card = function (aid, r, q) {
    var st = r.status, yr = r.date.slice(0, 4), pin = S.inPf(r.id), line1;
    if (st === "upcoming") { var dd = BI.dd(r.date); line1 = '<p class="now"><span' + (dd < 0 ? ' title="출품 예정으로 등록됐지만 경매일이 지남 — SAB DB에 결과가 아직 반영되지 않음"' : "") + '>' + (dd > 0 ? "D-" + dd : dd === 0 ? "NOW" : "Pending") + '</span><span class="pr">' + (r.lo ? BI.won(r.lo) : "-") + '</span><span class="bd">' + BI.band(r.lo, q) + "</span></p>" + (r.hi ? '<p class="rng">' + BI.won(r.lo) + " - " + BI.won(r.hi) + "</p>" : ""); }
    else if (st === "sold") line1 = "<p><span>" + yr + '</span><span class="pr">' + BI.won(r.price) + '</span><span class="bd">' + BI.band(r.price, q) + "</span></p>";
    else line1 = '<p class="dd"><span>' + (st === "passed" ? "Passed" : st === "withdrawn" ? "Withdrawn" : "–") + " " + yr + '</span><span class="pr">' + (r.lo ? BI.won(r.lo) : "-") + '</span><span class="bd">Est.</span></p>';
    var line2 = st === "upcoming" ? "" : '<p class="lt" data-e><span>3 mon ago</span><span class="pr pending">…</span><span class="pc"></span></p>';
    return '<a class="ca" href="artwork.html?a=' + aid + "&l=" + r.lot + '" data-lot="' + r.lot + '" data-id="' + esc(r.id) + '"><span class="th">' + BI.img(r.img, r.title) + '<span class="cb" title="BR Similar Auctions — 평가에 쓴 유사 경매 수">' + BI.ic.stack + '<em data-n style="font-style:normal">·</em></span><span class="ap' + (pin ? " in" : "") + '" role="button" aria-label="Add to Portfolio" data-pf>' + BI.ic.fold + "</span></span>" +
      '<span class="ti">' + esc(r.title || "Untitled") + '</span><p class="cg">' + esc(BI.cat(r.cat)) + (r.year ? ", " + r.year : "") + '</p><div class="ai">' + line1 + line2 + "</div></a>";
  };
  /* 화면에 보이는 카드만 차례로 3개월 전 평가를 채운다(무거운 계산이 화면을 막지 않게) */
  BI.fillCards = function (root, D, aid) {
    var todo = [].slice.call(root.querySelectorAll(".ca:not([data-done])"));
    var byLot = {}; D.rows.forEach(function (r) { byLot[r.lot] = r; });
    (function step() {
      var t0 = Date.now();
      while (todo.length && Date.now() - t0 < 40) {
        var el = todo.shift(); el.setAttribute("data-done", "1");
        var r = byLot[el.getAttribute("data-lot")], ln = el.querySelector("[data-e]");
        var e = BI.est(D, aid, r.id, BI.M3);
        var nn = el.querySelector("[data-n]");
        if (nn) nn.textContent = e && e.shown && e.n ? e.n : 0;
        if (!ln) continue;
        if (!e || !e.shown || !e.point) { ln.querySelector(".pr").textContent = "판단 보류"; ln.querySelector(".pr").classList.remove("pending"); continue; }
        ln.querySelector(".pr").textContent = BI.won(e.point); ln.querySelector(".pr").classList.remove("pending");
        if (r.status === "sold" && r.price) ln.querySelector(".pc").innerHTML = BI.ud(e.point / r.price - 1);
      }
      if (todo.length) setTimeout(step, 0);
    })();
  };
  /* 포트폴리오 담기(카드·상세 공통) */
  BI.pfToggle = function (aid, id, extra) {
    var p = S.pf(), i = p.findIndex(function (x) { return x.id === id; });
    if (i >= 0) { p.splice(i, 1); S.save("pf", p); return false; }
    p.unshift(Object.assign({ aid: aid, id: id, at: BI.TODAY }, extra || {})); S.save("pf", p); return true;
  };
  BI.pfAdded = function () { BI.msg("ok", "<b>Well done!</b> This work has been added to your portfolio. You can see the result anytime."); };
})();
