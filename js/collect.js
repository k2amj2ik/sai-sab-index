/* 내 소장 작품(컬렉션) — 10/20 운영자 요청 "blue index demo에 소장작품 등록 기능".
   저장 = 이 브라우저(localStorage 'sabidx_holdings') + 백업 파일(JSON 내보내기·불러오기). 구입가는 선택 입력이고 이 브라우저 밖으로 나가지 않는다.
   평가 = SAB DB 같은 작품과 연결돼 있으면 그 작품의 오늘 평가(경매 상세와 같은 값), 아니면 입력한 정보(분류·재질·크기·연도·제목)로 가상의 대상 작품을 만들어 같은 계산 엔진으로 평가.
   판매하러 가기 = 경매사 비교(숫자 정렬만) → 준비 체크 → 문의 글 초안 → 진행 기록. */
(function () {
  var S = window.SAB, C = window.COL = {};
  C.list = function () { return BI.holdings(); };
  C.get = function (hid) { return C.list().filter(function (h) { return h.hid === hid; })[0]; };
  C.put = function (h) {
    var L = C.list(), i = L.findIndex(function (x) { return x.hid === h.hid; });
    if (i >= 0) L[i] = h; else L.unshift(h);
    return BI.saveHoldings(L);
  };
  C.del = function (hid) { return BI.saveHoldings(C.list().filter(function (h) { return h.hid !== hid; })); };
  C.newId = function () { return "h" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); };

  /* ---------- 3단계(10/20): 컨설턴트 보기 — 같은 바탕(소장 작품)에 '누구의 컬렉션인가'(owner)만 다르게 ----------
     owner 없음 = 내 컬렉션, owner = 고객 id. 고객은 데모라 가상 고객만(운영자 결정). */
  C.of = function (cid) { return C.list().filter(function (h) { return cid ? h.owner === cid : !h.owner; }); };
  C.saveClients = function (v) { S.save("clients", v); };
  C.addClient = function (name, memo) { var L = BI.clients(), c = { cid: "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: name, memo: memo || "", at: BI.TODAY }; L.push(c); C.saveClients(L); return c; };
  C.delClient = function (cid) { C.saveClients(BI.clients().filter(function (c) { return c.cid !== cid; })); BI.saveHoldings(C.list().filter(function (h) { return h.owner !== cid; })); };
  C.ownerName = function (h) { if (!h.owner) return "My Collection"; var c = BI.client(h.owner); return c ? c.name : "(지운 고객)"; };
  /* 가상 고객 2명 — 대표작(SAB_WORKS, 평가 S·A 등급) 중에서 성격이 다른 두 묶음. 구입가는 지금 평가의 일정 비율로 지어 넣음(가상) */
  C.seedClients = function () {
    var W = (window.SAB_WORKS || []).filter(function (w) { return w.img && (w.grade === "S" || w.grade === "A" || w.grade === "E"); });
    var nat = function (w) { var a = BI.art(w.artist), n = a && a.info && a.info.nat || ""; return /Korea/.test(n); };
    function pick(f, n) { var seen = {}, out = []; W.forEach(function (w) { if (out.length < n && f(w) && !seen[w.artist]) { seen[w.artist] = 1; out.push(w); } }); return out; }
    var A = pick(function (w) { return nat(w) && w.cat === "paintings"; }, 5), B = pick(function (w) { return !nat(w) && w.cat === "prints-and-multiples"; }, 6);
    var RATE = [0.62, 0.85, 1.12, 0.74, 1.3, 0.93];
    function mk(w, cid, i) { var a = BI.art(w.artist), sz = (w.size || "").match(/[\d.]+/g) || []; return { hid: C.newId() + i, at: BI.TODAY, src: "sample", owner: cid, aid: w.artist, artist: a ? BI.en(a) : w.artist_name, wid: w.id, t: w.title, year: w.year, cat: w.cat, img: w.img, w: +sz[0] || null, h: +sz[1] || null, buyPrice: w.v ? Math.round(w.v * RATE[i % RATE.length] / 1e4) * 1e4 : null, buyAt: (2016 + i * 2) + "-0" + (i + 3) + "-15", photos: [], memo: "가상 고객 데이터(데모)", sale: { st: i === 1 ? "asked" : "hold", check: {}, log: i === 1 ? [{ st: "asked", at: "2026-10-12", note: "고객 판매 의사 확인 후 문의", house: "" }] : [] } }; }
    var ca = C.addClient("Client A (가상)", "국내 블루칩 회화 중심 · 장기 보유 성향"), cb = C.addClient("Client B (가상)", "해외 판화·멀티플 중심 · 회전 거래 성향");
    var L = C.list().concat(A.map(function (w, i) { return mk(w, ca.cid, i); }), B.map(function (w, i) { return mk(w, cb.cid, i); }));
    BI.saveHoldings(L); return [ca, cb];
  };
  /* 컬렉션 하나 요약(고객 비교·컬렉션 머리) */
  C.summary = function (list) {
    return Promise.all(list.map(function (h) { return Promise.all([C.estimate(h), C.estimate1y(h)]).then(function (x) { return { h: h, R: x[0], v1: x[1] }; }); })).then(function (W) {
      W.forEach(function (w) { w.v = w.R.ok ? w.R.e.point : null; w.a = w.R.a || null; w.chg = w.v && w.v1 ? w.v / w.v1 - 1 : null; });
      var ok = W.filter(function (w) { return w.v; }), both = W.filter(function (w) { return w.v && w.v1; }), bought = W.filter(function (w) { return w.v && w.h.buyPrice; });
      var sum = function (L, f) { return L.reduce(function (s, w) { return s + f(w); }, 0); };
      var byA = {}; ok.forEach(function (w) { if (w.a) byA[w.a.id] = (byA[w.a.id] || 0) + w.v; });
      var tot = sum(ok, function (w) { return w.v; }), topA = Object.keys(byA).sort(function (x, y) { return byA[y] - byA[x]; })[0];
      var base = sum(both, function (w) { return w.v1; }), bSum = sum(bought, function (w) { return w.h.buyPrice; }), bVal = sum(bought, function (w) { return w.v; });
      return { W: W, ok: ok, tot: tot, both: both, dv: sum(both, function (w) { return w.v - w.v1; }), pc: base ? sum(both, function (w) { return w.v; }) / base - 1 : null, bought: bought, bSum: bSum, bVal: bVal, bpc: bSum ? bVal / bSum - 1 : null, selling: W.filter(function (w) { var s = C.status(w.h); return s !== "hold" && s !== "paid" && s !== "sold"; }).length, top: topA ? { a: BI.art(topA), share: byA[topA] / (tot || 1) } : null };
    });
  };

  /* 분류 — SAB DB 분류 키 + '미술품 아님'(시계·생활 굿즈 등: 평가 대상 아님) */
  C.CATS = [["paintings", "Paintings"], ["prints-and-multiples", "Prints and Multiples"], ["works-on-paper", "Works on Paper"], ["sculpture", "Sculpture"], ["photographs", "Photographs"], ["mixed-media", "Mixed Media"], ["design", "Design · Art Toy"], ["goods", "Goods (굿즈)"], ["notart", "Not Artwork (시계·기타)"]];
  C.catName = function (k) { var x = C.CATS.filter(function (c) { return c[0] === k; })[0]; return x ? x[1] : (k || "-"); };
  C.CONDS = ["Excellent", "Good", "Fair", "Poor", "Unknown"];
  /* 판매 진행 단계(판매하러 가기 → 진행 기록) */
  C.STEPS = [["hold", "Holding", "보유 중"], ["prep", "Preparing", "판매 준비"], ["asked", "Inquiry Sent", "문의 보냄"], ["quoted", "Estimate Received", "추정가 받음"], ["consigned", "Consigned", "위탁 계약"], ["listed", "Listed", "출품 확정"], ["sold", "Sold", "낙찰"], ["unsold", "Unsold", "유찰"], ["paid", "Settled", "정산 완료"]];
  C.stepName = function (k) { var x = C.STEPS.filter(function (s) { return s[0] === k; })[0]; return x ? x[1] : "Holding"; };
  C.status = function (h) { return (h.sale && h.sale.st) || "hold"; };

  /* 작가 이름 → 데모 작가(289명) 찾기: 대소문자·점·공백 무시, 한글 이름도 */
  function norm(s) { return String(s || "").toLowerCase().replace(/^mr\.?\s*/, "mr").replace(/[^a-z0-9가-힣]+/g, ""); }
  C.findArtist = function (name) {
    var n = norm(name); if (!n) return null;
    return BI.arts().filter(function (a) { return [BI.en(a), BI.ko(a), a.name].some(function (x) { return x && norm(x) === n; }); })[0] || null;
  };
  var STOP = { "in": 1, "on": 1, "and": 1, "the": 1, "of": 1, "a": 1, "an": 1, "from": 1, "de": 1, "la": 1, "le": 1, "et": 1, "x": 1 };
  function tok(s) { var o = {}; String(s || "").toLowerCase().split(/[^a-z0-9가-힣]+/).forEach(function (w) { if (w && !STOP[w]) o[w] = 1; }); return Object.keys(o).sort(); }
  C.tok = tok;
  function jac(a, b) { if (!a.length || !b.length) return 0; var s = {}, i = 0; a.forEach(function (w) { s[w] = 1; }); b.forEach(function (w) { if (s[w]) i++; }); return i / (a.length + b.length - i); }
  C.area = function (h) { var w = +h.w, hh = +h.h; return w > 0 && hh > 0 ? w * hh : null; };
  C.sizeText = function (h) { return [h.w, h.h, h.d].filter(function (v) { return +v > 0; }).join(" x ") + ([h.w, h.h].some(function (v) { return +v > 0; }) ? " cm" : ""); };

  /* SAB DB에서 같은 작품 후보 찾기(제목 단어 + 크기 + 분류) — 등록 화면에서 연결할 작품을 고르게 */
  C.matches = function (D, h) {
    var tt = tok(h.t), ar = C.area(h), by = {};
    D.rows.forEach(function (r) {
      var js = jac(tt, r.ttS || []); if (js < 0.34) return;
      var sz = ar && r.area ? Math.exp(-Math.abs(Math.log(r.area / ar)) / 0.3) : 0.5, sc = 0.7 * js + 0.3 * sz + (h.cat && r.cat === h.cat ? 0.05 : 0);
      var k = r.grp && String(r.grp).charAt(0) === "g" ? r.grp : r.id;
      if (!by[k] || by[k].sc < sc || (by[k].sc === sc && r.date > by[k].r.date)) by[k] = { r: r, sc: sc, n: (by[k] ? by[k].n : 0) + 1 }; else by[k].n++;
    });
    return Object.keys(by).map(function (k) { return by[k]; }).sort(function (x, y) { return y.sc - x.sc; }).slice(0, 8);
  };

  /* 평가 — 결과 {ok, e, grade, how:'linked'|'manual', reason} */
  var EC = {};
  C.estimate = function (h) {
    if (h.cat === "notart") return Promise.resolve({ ok: false, reason: "미술품 아님 — SAB DB 경매 기록으로 평가하지 않습니다" });
    var a = h.aid ? BI.art(h.aid) : C.findArtist(h.artist);
    if (!a) return Promise.resolve({ ok: false, reason: "데모 작가 목록(" + BI.arts().length + "명)에 없는 작가 — 평가 보류" });
    var key = h.hid + "|" + JSON.stringify([h.wid, h.cat, h.med, h.w, h.h, h.year, h.t, a.id]);
    if (EC[key]) return EC[key];
    return (EC[key] = S.lots(a.id).then(function (D) {
      var e, how;
      if (h.wid && D.rows.some(function (r) { return r.id === h.wid; })) { e = SABE.today(D, h.wid, BI.TODAY); how = "linked"; }
      else {
        var tiers = { major: 0, other: 0 }; D.rows.forEach(function (r) { if (r.status === "sold") tiers[r.tier] = (tiers[r.tier] || 0) + 1; });
        var t = { id: "mine_" + h.hid, lot: "__now__", cat: h.cat === "goods" ? "other" : h.cat, kind: h.cat === "goods" ? "goods" : "single", tier: tiers.major >= tiers.other ? "major" : "other", year: +h.year || null, area: C.area(h), mtS: tok(h.med), ttS: tok(h.t), grp: null, cid: null, title: h.t, med: h.med, size: C.sizeText(h), mine: [] };
        e = SABE.estimate(D, t, SABE.candidates(D, t, BI.TODAY), BI.TODAY); e.grade = SABE.grade(e); e.t = t; how = "manual";
      }
      if (!e) return { ok: false, a: a, reason: "SAB DB에서 연결한 작품을 찾지 못함" };
      var g = SABE.grade(e);
      return { ok: !!(e.shown && e.point), a: a, e: e, grade: g, how: how, reason: e.shown ? "" : (e.reason || "근거 부족") };
    }));
  };
  /* 1년 전 평가(연결된 작품만 — 포트폴리오 1년 변화) */
  C.estimate1y = function (h) {
    if (!h.wid || !h.aid) return Promise.resolve(null);
    return S.lots(h.aid).then(function (D) { var e = SABE.today(D, h.wid, BI.Y1); return e && e.shown ? e.point : null; });
  };

  /* 사진: 긴 변 640px JPEG로 줄여 저장(브라우저 저장 공간이 작다 — 작품당 3장) */
  C.shrink = function (file) {
    return new Promise(function (ok, no) {
      var fr = new FileReader(); fr.onerror = no;
      fr.onload = function () { var im = new Image(); im.onerror = no; im.onload = function () { var k = Math.min(1, 640 / Math.max(im.width, im.height)), cv = document.createElement("canvas"); cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k); cv.getContext("2d").drawImage(im, 0, 0, cv.width, cv.height); ok(cv.toDataURL("image/jpeg", 0.78)); }; im.src = fr.result; };
      fr.readAsDataURL(file);
    });
  };
  C.cover = function (h) { return (h.photos && h.photos[0]) || h.img || null; };

  /* CSV 가져오기 — 노션 데이터베이스 '내보내기 → CSV'나 엑셀 CSV. 머리글 이름으로 칸을 맞춘다 */
  C.parseCSV = function (txt) {
    txt = txt.replace(/^﻿/, ""); var rows = [], row = [], f = "", q = false;
    for (var i = 0; i < txt.length; i++) {
      var c = txt[i];
      if (q) { if (c === '"') { if (txt[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
      else if (c === '"') q = true; else if (c === ",") { row.push(f); f = ""; } else if (c === "\n" || c === "\r") { if (c === "\r" && txt[i + 1] === "\n") i++; row.push(f); rows.push(row); row = []; f = ""; } else f += c;
    }
    if (f || row.length) { row.push(f); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (x) { return x.trim(); }); });
  };
  var COLS = { t: ["이름", "작품명", "제목", "name", "title", "artwork"], artist: ["작가명", "작가", "artist", "브랜드"], kind: ["종류", "분류", "category", "type"], prov: ["구매처", "구입처", "source", "seller"], myVal: ["리셀가", "시세", "내가 아는 시세", "market value", "value"], buyPrice: ["구입가", "구매가", "purchase price", "price paid"], buyAt: ["구입일", "구매일", "purchase date"], year: ["제작 연도", "제작연도", "연도", "year"], med: ["재질", "medium", "material"], size: ["크기", "사이즈", "size", "dimensions"], ed: ["에디션", "edition"], memo: ["메모", "note", "notes"] };
  function num(s) { var v = String(s || "").replace(/[^0-9.]/g, ""); return v ? +v : null; }
  function kindToCat(k) {
    k = String(k || "").toLowerCase();
    if (/시계|watch|가방|의류|notart/.test(k)) return "notart";
    if (/굿즈|goods|머그|키홀더/.test(k)) return "goods";
    if (/토이|피규어|toy|figure|design|디자인/.test(k)) return "design";
    if (/판화|print|lithograph|screen|실크/.test(k)) return "prints-and-multiples";
    if (/회화|painting|유화|아크릴|canvas/.test(k)) return "paintings";
    if (/종이|드로잉|drawing|paper/.test(k)) return "works-on-paper";
    if (/조각|sculpture/.test(k)) return "sculpture";
    if (/사진|photo/.test(k)) return "photographs";
    return "";
  }
  C.fromCSV = function (txt) {
    var R = C.parseCSV(txt); if (R.length < 2) return [];
    var hd = R[0].map(function (x) { return x.trim().toLowerCase(); }), idx = {};
    Object.keys(COLS).forEach(function (k) { var i = hd.findIndex(function (x) { return COLS[k].indexOf(x) >= 0; }); if (i >= 0) idx[k] = i; });
    return R.slice(1).map(function (r) {
      var g = function (k) { return idx[k] == null ? "" : (r[idx[k]] || "").trim(); };
      if (!g("t") && !g("artist")) return null;
      var sz = (g("size").match(/[\d.]+/g) || []).map(Number), a = C.findArtist(g("artist"));
      return { hid: C.newId(), at: BI.TODAY, src: "import", artist: a ? BI.en(a) : g("artist"), aid: a ? a.id : null, t: g("t"), cat: kindToCat(g("kind")), kindRaw: g("kind"), prov: g("prov"), myVal: num(g("myVal")), buyPrice: num(g("buyPrice")), buyAt: g("buyAt"), year: num(g("year")), med: g("med"), w: sz[0] || null, h: sz[1] || null, d: sz[2] || null, ed: g("ed"), memo: g("memo"), photos: [] };
    }).filter(Boolean);
  };

  /* 백업 — 이 브라우저 기록이 지워지면 사라지므로 파일로 내려받아 둔다 */
  C.backup = function () {
    var data = { kind: "blueIndex-collection", ver: 1, at: new Date().toISOString(), holdings: C.list(), clients: BI.clients(), evals: BI.evals(), watch: BI.watch(), fav_artists: BI.favs() };
    var b = new Blob([JSON.stringify(data, null, 1)], { type: "application/json" }), u = URL.createObjectURL(b), l = document.createElement("a");
    l.href = u; l.download = "blueIndex_my_collection_" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + ".json"; document.body.appendChild(l); l.click(); l.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 2000);
  };
  C.restore = function (txt, mode) {
    var d = JSON.parse(txt); if (!d || d.kind !== "blueIndex-collection") throw new Error("blueIndex 백업 파일이 아닙니다");
    var cur = mode === "replace" ? [] : C.list(), have = {}; cur.forEach(function (h) { have[h.hid] = 1; });
    (d.holdings || []).forEach(function (h) { if (!have[h.hid]) cur.push(h); });
    if (!BI.saveHoldings(cur)) throw new Error("브라우저 저장 공간이 부족합니다(사진을 줄이거나 지워 주세요)");
    if (d.clients) { var cl = mode === "replace" ? [] : BI.clients(); d.clients.forEach(function (c) { if (!cl.some(function (x) { return x.cid === c.cid; })) cl.push(c); }); C.saveClients(cl); }
    if (d.evals) S.save("evals", mode === "replace" ? d.evals : BI.evals().concat(d.evals.filter(function (x) { return !BI.evalOf(x.id); })));
    if (d.watch) S.save("watch", mode === "replace" ? d.watch : BI.watch().concat(d.watch.filter(function (x) { return !BI.inWatch(x.id); })));
    if (d.fav_artists) S.save("fav_artists", mode === "replace" ? d.fav_artists : BI.favs().concat(d.fav_artists.filter(function (x) { return BI.favs().indexOf(x) < 0; })));
    return (d.holdings || []).length;
  };
  C.usedKB = function () { var n = 0; try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); n += (localStorage.getItem(k) || "").length + k.length; } } catch (e) {} return Math.round(n * 2 / 1024); };

  /* 판매하러 가기 — 이 작가 작품을 다룬 경매사(최근 5년 5건 이상, SAB DB) + 경매사 판매 수수료·의뢰 주소(data/houses.js) */
  C.houseRows = function (a, by) {
    var H = window.SAB_HOUSES || {}, rows = ((a && a.houses) || []).map(function (x) { return Object.assign({}, x, { info: H[x.house] || {} }); });
    var key = { n: function (x) { return x.n; }, tv: function (x) { return x.tv; }, rate: function (x) { return x.rate; }, rel: function (x) { return x.rel == null ? -9 : x.rel; } }[by || "tv"];
    return rows.sort(function (x, y) { return key(y) - key(x); });
  };
  C.CHECK = [["photo", "작품 사진: 정면·뒷면·서명·에디션 번호·상태 근접(4장 이상)"], ["size", "크기(이미지/종이/액자 구분)·재질·제작 연도 확인"], ["sign", "서명·에디션 표기 위치 확인"], ["coa", "보증서(COA)·갤러리 영수증 등 진품 근거"], ["prov", "구입 경로(소장 이력) 정리 — 언제·어디서·얼마에"], ["cond", "상태 기록(변색·구김·액자 손상 등)"], ["price", "희망 최저가(리저브) 정하기 — blueIndex 평가 범위 참고"], ["fee", "판매 수수료·보험·운송·사진 촬영 비용 확인"]];
  C.inquiry = function (h, house, ev, lang) {
    var size = C.sizeText(h), lines;
    if (lang === "en") {
      lines = ["Dear " + house + " Consignment Team,", "", "I would like to consign the following work and ask for an auction estimate.", "", "- Artist: " + (h.artist || "-"), "- Title: " + (h.t || "-"), "- Year: " + (h.year || "unknown"), "- Medium: " + (h.med || "-"), "- Size: " + (size || "-"), h.ed ? "- Edition: " + h.ed : null, "- Signature: " + (h.sign || "unknown") + (h.signNote ? " (" + h.signNote + ")" : ""), "- Condition: " + (h.cond || "unknown"), "- Provenance: " + (h.prov || "-") + (h.buyAt ? " (" + h.buyAt + ")" : ""), "", "Photos (front, back, signature, details) are attached.", "Could you let me know the estimate, the seller's commission and the upcoming sale schedule?", "", "Best regards,", (BI.user() || {}).name || ""];
    } else {
      lines = [house + " 위탁 담당자님께,", "", "아래 작품의 경매 위탁(판매)을 문의드립니다.", "", "- 작가: " + (h.artist || "-"), "- 작품명: " + (h.t || "-"), "- 제작 연도: " + (h.year || "모름"), "- 재질: " + (h.med || "-"), "- 크기: " + (size || "-"), h.ed ? "- 에디션: " + h.ed : null, "- 서명: " + ({ "Signed and numbered": "서명·에디션 번호 있음", Signed: "서명 있음", Unsigned: "서명 없음", Stamped: "도장·스탬프", Unknown: "모름" }[h.sign] || h.sign || "모름") + (h.signNote ? " (" + h.signNote + ")" : ""), "- 상태: " + (h.cond || "모름"), "- 소장 경위: " + (h.prov || "-") + (h.buyAt ? " (" + h.buyAt + " 구입)" : ""), "", "정면·뒷면·서명·세부 사진을 첨부합니다.", "예상 추정가와 판매(위탁) 수수료, 다음 경매 일정을 알려 주시면 감사하겠습니다.", "", "감사합니다.", (BI.user() || {}).name || ""];
    }
    return lines.filter(function (x) { return x !== null; }).join("\n");
  };
})();
