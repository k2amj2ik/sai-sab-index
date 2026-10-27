/* SAB Index 계산 엔진 — 시험판 16회차 채택 규칙(4회차 틀 + 5·8·9회차 보정 + 10~12회차 제작그룹 + 13회차 화풍 신호 + 16회차 시장 분기 지수)(Python sabindex_core_v4·v3·v2·core)를 그대로 옮긴 것.
   브라우저에서 작가 거래 기록(data/lots/a{작가}.js)만으로 오늘 평가가격·근거 작품·흐름을 계산한다.
   단어 판정(kind)·재질/제목 단어·경매사 급(tier)은 데이터 쪽에서 미리 계산해 넣었다. */
(function (root) {
  var E = {};
  var K = 7, POOLK = 15, SHOW_MIN = 10, LOW_MIN = 20, LOOKBACK = 10, SAME_SIM = 2.0;
  var IMG_CATS = { "paintings": 1, "works-on-paper": 1, "mixed-media": 1 };
  var GI_PRINT = /(lithograph|screen ?print|serigraph|silkscreen|etching|aquatint|woodcut|linocut|engraving|offset|gicl[eé]e|pigment print|digital print|inkjet|\bprint\b|판화|실크스크린|석판|목판)/i;   // 12회차 gi 묶음 S 판정용(sabindex_core_v4.GI_PRINT와 같음)

  /* 날짜 → 일수(UTC) */
  var dcache = {};
  function dn(s) { var v = dcache[s]; if (v === undefined) { var p = s.slice(0, 10).split("-"); v = dcache[s] = Date.UTC(+p[0], +p[1] - 1, +p[2]) / 864e5; } return v; }
  function years(a, b) { return (dn(a) - dn(b)) / 365.25; }
  E.years = years;

  /* 거래 기록 풀기 */
  /* 16회차 채택(10/27, 16b): 비교작 가격에 시장 분기 지수 변화의 절반 — data/market.js(window.SAB_MKT, 51번 export와 같은 파일).
     sabindex_core_v4.market_factor와 같은 계산. 구간 = 국내(서울옥션·케이옥션)/해외 × 회화류/그 외 */
  var MKT = null, DOMESTIC = { "SEOUL AUCTION": 1, "K AUCTION": 1 };
  E.setMarket = function (m) { MKT = m || null; };
  function qnum(d) { return (+d.slice(0, 4) - MKT.q0) * 4 + Math.floor((+d.slice(5, 7) - 1) / 3); }
  function marketFactor(c, asof) {
    if (!MKT) return 1;
    var sg = (DOMESTIC[String(c.house || "").toUpperCase()] ? "KR" : "INT") + "-" + (IMG_CATS[c.cat] ? "P" : "O");
    var b = (MKT.seg[sg] || {})[String(qnum(asof))], q1 = qnum(c.date);
    if (!b || q1 < 0 || q1 >= b.length - 1) return 1;
    return Math.exp(Math.max(-MKT.cap, Math.min(MKT.cap, MKT.damp * (b[b.length - 1] - b[q1]))));
  }
  E.load = function (raw) {
    var c = raw.cols, rows = raw.rows.map(function (r) { var o = {}; for (var i = 0; i < c.length; i++) o[c[i]] = r[i]; o.mtS = o.mt ? o.mt.split(" ") : []; o.ttS = o.tt ? o.tt.split(" ") : []; return o; });
    return { rows: rows, sty: raw.sty || {}, stc: raw.stc || [1, 0], styC: {}, res: raw.res || [] };
  };

  function jacc(a, b) { if (!a.length || !b.length) return null; var s = {}, inter = 0, uni = 0, k; for (k = 0; k < a.length; k++) s[a[k]] = 1; for (k = 0; k < b.length; k++) if (s[b[k]] === 1) { inter++; s[b[k]] = 2; } uni = a.length + b.length - inter; return inter / uni; }
  /* 13회차 채택(10/26): 화풍 신호 — 128개 1바이트 정수(base64). 정수 곱으로 코사인을 정확히 내서 sabindex_core_v3.style_sim과 같은 값 */
  function styVec(D, id) {
    var v = D.styC[id]; if (v !== undefined) return v;
    var b = D.sty[id]; if (!b) return (D.styC[id] = null);
    var bin = atob(b), q = new Int8Array(bin.length), n = 0;
    for (var i = 0; i < bin.length; i++) { q[i] = (bin.charCodeAt(i) << 24) >> 24; n += q[i] * q[i]; }
    return (D.styC[id] = { q: q, n: n });
  }
  function styleSim(D, a, b) {
    var sa = styVec(D, a), sb = styVec(D, b); if (!sa || !sb || !sa.n || !sb.n) return null;
    var dot = 0; for (var i = 0; i < sa.q.length; i++) dot += sa.q[i] * sb.q[i];
    var cos = D.stc[0] * (dot / Math.sqrt(sa.n * sb.n)) + D.stc[1];
    return Math.min(1, Math.max(0, (cos - 0.6) / 0.35));
  }
  /* core.sim */
  function simBase(t, c, asof) {
    var sSize = (t.area && c.area) ? Math.exp(-Math.abs(Math.log(c.area / t.area)) / 0.7) : 0.3;
    var j = jacc(t.mtS, c.mtS), sMed = j === null ? 0.3 : j;
    var sYear = (t.year && c.year) ? Math.exp(-Math.abs(t.year - c.year) / 10) : 0.5;
    var sRec = Math.exp(-years(asof, c.date) / 5);
    return 0.35 * sSize + 0.25 * sMed + 0.2 * sYear + 0.2 * sRec;
  }
  /* v2.sim */
  function simV2(t, c, asof) {
    var base = simBase(t, c, asof), j = jacc(t.ttS, c.ttS), sT = j === null ? 0 : j;
    var sameEd = sT >= 0.8 && t.area && c.area && Math.abs(Math.log(c.area / t.area)) < 0.1;
    var w = t.cat === "prints-and-multiples" ? 0.45 : 0.2;
    var s = (1 - w) * base + w * sT;
    return Math.min(1, s + (sameEd ? 0.3 : 0));
  }
  /* v3.sim */
  function simV3(D, t, c, asof) {
    var s = simV2(t, c, asof);
    if (IMG_CATS[t.cat]) { var v = styleSim(D, t.id, c.id); if (v !== null) s = 0.7 * s + 0.3 * v; }   /* 13회차: 비교작 유사도의 그림 항목 = 화풍 신호 */
    if (t.tier === c.tier) s += 0.1;
    return s;
  }
  function mean(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s / a.length; }
  function median(a) { var b = a.slice().sort(function (x, y) { return x - y; }), n = b.length; return n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2; }
  /* Python statistics.quantiles(n=4, method='exclusive') */
  function quartiles(data) {
    var d = data.slice().sort(function (x, y) { return x - y; }), n = d.length, m = n + 1, out = [];
    for (var i = 1; i < 4; i++) { var j = Math.floor(i * m / 4); j = j < 1 ? 1 : j > n - 1 ? n - 1 : j; var delta = i * m - j * 4; out.push((d[j - 1] * (4 - delta) + d[j] * delta) / 4); }
    return out;
  }
  function wmedian(vals) {
    var v = vals.slice().sort(function (a, b) { return a[0] - b[0]; }), tot = 0, acc = 0, i;
    for (i = 0; i < v.length; i++) tot += v[i][1];
    for (i = 0; i < v.length; i++) { acc += v[i][1]; if (acc >= tot / 2) return v[i][0]; }
    return v[v.length - 1][0];
  }
  E.wmedian = wmedian;
  E.quartiles = quartiles;
  /* 사용자가 고른 근거 작품만으로 계산(기획 P24·P26: 선택 목록에 추가·삭제하면 가격 즉시 재계산) — 값은 엔진이 보정한 adj, 가중치는 유사도 */
  E.fromSelection = function (sel, sc) {
    if (!sel.length) return null;
    var pts = sel.map(function (u) { return u.adj; }), q = pts.length >= 2 ? quartiles(pts) : [pts[0], pts[0], pts[0]], f = sc || 1;
    return { point: wmedian(sel.map(function (u) { return [u.adj, u.sim]; })) * f, lo: q[0] * f, hi: q[2] * f, n: sel.length };
  };
  function sizeExponent(cands) {
    var pts = [];
    cands.forEach(function (c) { if (c.status === "sold" && c.area && c.price) pts.push([Math.log(c.area), Math.log(c.price)]); });
    if (pts.length < 10) return 0.5;
    var mx = mean(pts.map(function (p) { return p[0]; })), my = mean(pts.map(function (p) { return p[1]; })), vx = 0, cv = 0;
    pts.forEach(function (p) { vx += (p[0] - mx) * (p[0] - mx); cv += (p[0] - mx) * (p[1] - my); });
    if (vx === 0) return 0.5;
    return Math.min(1, Math.max(0.2, cv / vx));
  }
  function tierFactor(sold, b) {
    var res = { major: [], other: [] };
    sold.forEach(function (c) { if (c.area) res[c.tier].push(Math.log(c.price) - b * Math.log(c.area)); });
    if (res.major.length < 5 || res.other.length < 5) return 2.0;
    return Math.min(6, Math.max(1, Math.exp(median(res.major) - median(res.other))));
  }
  /* 8회차 채택: 작가의 최근 2년 반복 거래 흐름(연 로그 변화율 중간값, 15쌍 이상, ±30% 제한) — 같은 작품 과거 가격에만 반영 */
  function recentTrend(D, asof) {
    var cut = asof.slice(0, 7) + "-01"; D._tr = D._tr || {};
    if (D._tr[cut] !== undefined) return D._tr[cut];
    var by = {};
    D.rows.forEach(function (r) { if (r.status === "sold" && r.price && r.date < cut && String(r.id).indexOf("aw_") !== 0) (by[r.id] = by[r.id] || []).push([r.date, r.price]); });
    var rates = [];
    Object.keys(by).forEach(function (k) {
      var v = by[k]; if (v.length < 2) return;
      v.sort(function (a, b) { return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] - b[1]; });
      for (var i = 1; i < v.length; i++) { var dy = years(v[i][0], v[i - 1][0]), q = v[i][1] / v[i - 1][1]; if (dy >= 0.25 && years(cut, v[i][0]) <= 2 && q >= 1 / 20 && q <= 20) rates.push(Math.log(q) / dy); }
    });
    var g = rates.length >= 15 ? Math.max(-0.3, Math.min(0.3, median(rates))) : 0;
    D._tr[cut] = g; return g;
  }
  E.recentTrend = recentTrend;
  /* 9회차 채택: 작가의 기준일 직전 12개월 낙찰에서 '그때 알던 정보로 낸 평가가격' 대비 실제가 로그 비율 중간값 r → exp(n/(n+10)·r), 5건 미만이면 1 */
  function selfCal(D, asof) {
    var lo = String(+asof.slice(0, 4) - 1).padStart(4, "0") + asof.slice(4), v = [];
    (D.res || []).forEach(function (x) { if (x[0] >= lo && x[0] < asof) v.push(x[1]); });
    return v.length < 5 ? 1 : Math.exp(v.length / (v.length + 10) * median(v));
  }
  E.selfCal = selfCal;
  /* v4.candidates: 같은 작가 기록 중 같은 분류·기준일 이전 10년, 평가 중인 그 랏만 제외 */
  E.candidates = function (D, t, asof) {
    return D.rows.filter(function (c) { return c.lot !== t.lot && c.cat === t.cat && c.date < asof && years(asof, c.date) <= LOOKBACK; });
  };
  /* v4.estimate(mode) + 화면용 상세. opt: {mode:'all'|'same'|'none', exclude:{lot:1}, include:{lot:1}, filter:fn(c)} */
  E.estimate = function (D, t, cands, asof, opt) {
    opt = opt || {}; var mode = opt.mode || "all";
    var tk = t.kind;
    /* 10회차 채택(10a): 같은 제작그룹(판화·멀티플 등 에디션, "g…")이면 같은 작품으로 계산. 등급은 같은 장(S)과 같은 판본(E)으로 나눔 */
    var tg = t.grp && String(t.grp).charAt(0) === "g" ? t.grp : null;
    function sameOf(c) { return c.id === t.id || (!!tg && c.grp === tg); }
    /* 12회차: "gi…" = 경매 사진이 같아 합친 '원화·단독' 묶음 → 손으로 그린 한 점(회화·종이·혼합재료 + 재질에 판화 표기 없음)이면 같은 묶음 = S.
       무제 판화처럼 에디션인데 원화·단독으로 남은 것은 같은 판의 다른 장이라 E (sabindex_core_v4.py와 같은 규칙) */
    var giOne = !!tg && tg.slice(0, 2) === "gi" && IMG_CATS[t.cat] && !GI_PRINT.test(t.med || "");
    function trueSame(c) { return c.id === t.id || (!!t.cid && String(t.cid).indexOf("#") >= 0 && c.cid === t.cid) || (giOne && c.grp === tg); }
    cands = cands.filter(function (c) { return c.kind === tk || (!!tg && c.grp === tg); });
    if (opt.filter) cands = cands.filter(function (c) { return sameOf(c) || opt.filter(c); });
    var sold = cands.filter(function (c) { return c.status === "sold" && c.price; });
    if (sold.length) { var med0 = median(sold.map(function (c) { return c.price; })); if (tk !== "goods") sold = sold.filter(function (c) { return c.price >= med0 / 10; }); }
    var sold5 = sold.filter(function (c) { return years(asof, c.date) <= 5; }).length;
    var same = sold.filter(sameOf);
    var out = { sold5: sold5, kind: tk, same_n: same.length, same_true: same.filter(trueSame).length };
    if (tk === "goods" || (sold5 < 3 && !same.length)) { out.shown = false; out.reason = tk === "goods" ? "굿즈" : "근거 부족"; return out; }
    var use = sold.map(function (c) { return [c, c.price]; });
    if (mode !== "none") cands.forEach(function (c) { if (c.status === "passed" && c.lo && (mode === "all" || sameOf(c))) use.push([c, c.lo * 0.9]); });
    if (t.area) use = use.filter(function (u) { return u[0].area || sameOf(u[0]); });
    if (!use.length) { out.shown = false; out.reason = "근거 부족"; return out; }
    var b = sizeExponent(cands), tf = tierFactor(sold, b), tt = t.tier;
    var scored = use.map(function (u) { var c = u[0]; return [sameOf(c) ? SAME_SIM : simV3(D, t, c, asof), c, u[1]]; });
    scored.sort(function (x, y) { return y[0] - x[0]; });
    var g = recentTrend(D, asof);
    function adj(c, p) { if (sameOf(c)) return g ? p * Math.exp(g * Math.min(3, years(asof, c.date))) : p; /* 5회차: 같은 작품은 크기·경매사 급 보정 없음 / 8회차: 최근 2년 흐름만 */ var f = (t.area && c.area) ? Math.pow(t.area / c.area, b) : 1; if (c.tier !== tt) f *= tt === "major" ? tf : 1 / tf; f *= marketFactor(c, asof); /* 16회차 */ return p * f; }
    var pool = scored.slice(0, POOLK);
    if (opt.exclude) pool = scored.filter(function (x) { return !opt.exclude[x[1].lot]; }).slice(0, POOLK);
    var vals = pool.map(function (x) { return [adj(x[1], x[2]), x[0], x[1], x[2]]; });
    var med = median(vals.map(function (v) { return v[0]; }));
    var kept = vals.filter(function (x) { return sameOf(x[2]) || (med / 3 <= x[0] && x[0] <= med * 3); }).slice(0, K);
    if (!kept.length) kept = vals.slice(0, K);
    if (opt.include) scored.forEach(function (x) { if (opt.include[x[1].lot] && !kept.some(function (k) { return k[2].lot === x[1].lot; })) kept.push([adj(x[1], x[2]), x[0], x[1], x[2]]); });
    var pts = kept.map(function (k) { return k[0]; }), q = pts.length >= 2 ? quartiles(pts) : [pts[0], pts[0], pts[0]];
    var top = kept[0];
    out.shown = sold5 >= SHOW_MIN || !!same.length;
    out.low_conf = sold5 < LOW_MIN && !same.length;
    out.point = wmedian(kept.map(function (k) { return [k[0], k[1]]; }));
    out.lo = q[0]; out.hi = q[2]; out.n = kept.length; out.b = b; out.tf = tf; out.g = g;
    out.sc = 1;
    if (!same.length && !opt.noSC) { var f = selfCal(D, asof); out.sc = f; out.point *= f; out.lo *= f; out.hi *= f; }
    out.top_sim = Math.round(Math.min(top[1], 1) * 100) / 100;
    var tImg = IMG_CATS[t.cat] ? styleSim(D, t.id, top[2].id) : null;
    out.img = sameOf(top[2]) ? 1 : (tImg === null ? null : Math.round(tImg * 100) / 100);   /* 등급 A의 그림 조건 — 10/27부터 화풍 신호, V3.t_img처럼 소수 둘째 자리 */
    out.used = kept.map(function (k) { return { c: k[2], adj: k[0], sim: k[1], price: k[3], same: sameOf(k[2]), ed: sameOf(k[2]) && !trueSame(k[2]) }; });
    var usedLots = {}; kept.forEach(function (k) { usedLots[k[2].lot] = 1; });
    out.more = scored.filter(function (x) { return !usedLots[x[1].lot]; }).slice(0, 40).map(function (x) { return { c: x[1], adj: adj(x[1], x[2]), sim: x[0], price: x[2], same: sameOf(x[1]), ed: sameOf(x[1]) && !trueSame(x[1]) }; });
    if (!out.shown) out.reason = "최근 5년 같은 종류 낙찰 " + sold5 + "건(10건 미만)";
    return out;
  };
  E.grade = function (e) {
    if (!e.shown) return "보류";
    if (e.same_true) return "S";
    if (e.same_n) return "E";            // 10회차: 같은 판본(제작그룹)의 다른 장 낙찰만 있음
    if (e.top_sim >= 0.8 && (e.img === null || e.img === undefined || e.img >= 0.7) && e.sold5 >= 20) return "A";
    return e.top_sim >= 0.7 ? "B" : "C";
  };
  /* 작품의 오늘 평가: 그 작품의 가장 최근 기록을 대상으로, 같은 작품의 모든 과거 거래를 근거로 */
  E.target = function (D, id) {
    var mine = D.rows.filter(function (r) { return r.id === id; }).map(function (r, i) { return [r, i]; });
    if (!mine.length) return null;
    mine.sort(function (a, b) { return a[0].date < b[0].date ? -1 : a[0].date > b[0].date ? 1 : a[1] - b[1]; });   // 날짜순(같은 날은 원래 순서) — 시험판 sorted()와 같게
    mine = mine.map(function (x) { return x[0]; });
    var t = Object.assign({}, mine[mine.length - 1]); t.lot = "__now__"; t.mine = mine; return t;
  };
  E.today = function (D, id, asof, opt) { var t = E.target(D, id); if (!t) return null; var e = E.estimate(D, t, E.candidates(D, t, asof), asof, opt); e.grade = E.grade(e); e.t = t; return e; };
  /* 월별 흐름(2016~) + 마켓무버 — 10% 넘는 변화나 마켓무버만 점으로 */
  E.flow = function (D, id, asof, opt) {
    var t = E.target(D, id), pts = [], movers = [], prev = null;
    if (!t) return { pts: pts, movers: movers };
    var y = 2016, m = 1, end = asof.slice(0, 7);
    while (true) {
      var ym = y + "-" + (m < 10 ? "0" + m : m); if (ym > end) break;
      var nx = m === 12 ? (y + 1) + "-01-01" : y + "-" + (m + 1 < 10 ? "0" + (m + 1) : m + 1) + "-01", at = nx < asof ? nx : asof;
      var e = E.estimate(D, t, E.candidates(D, t, at), at, opt);
      if (e.shown && e.point) {
        var newsales = e.used.filter(function (u) { return u.c.date.slice(0, 7) === ym; }).map(function (u) { return u.c; });
        var pt = { d: ym, v: e.point, lo: e.lo, hi: e.hi };
        if (prev && newsales.length && !(prev.lo <= e.point && e.point <= prev.hi)) { movers.push({ d: ym, chg: e.point / prev.v - 1, from: prev.v, to: e.point, sales: newsales }); pt.mv = 1; }
        if (!prev || Math.abs(e.point / prev.v - 1) > 0.10 || pt.mv) { pts.push(pt); prev = pt; }
      }
      m++; if (m === 13) { m = 1; y++; }
    }
    return { pts: pts, movers: movers };
  };
  root.SABE = E;
  if (typeof module !== "undefined") module.exports = E;
})(typeof window !== "undefined" ? window : globalThis);
