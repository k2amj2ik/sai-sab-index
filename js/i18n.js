/* blueIndex Demo 한국어 전환(10/20 운영자 요청) — 상단 탭 막대 오른쪽 'EN | 한' 버튼.
   화면 글자(메뉴·버튼·라벨)만 바꾸고 데이터(작품 제목·작가·경매사·도시 이름)는 그대로 둔다.
   방식: 글자 마디를 사전(정확히 같은 글자)과 규칙(숫자가 들어간 문장)으로 바꾸고, 새로 그려지는 부분은 변화 감지로 다시 바꾼다.
   새 영어 문구를 화면에 넣으면 아래 DICT나 RULES에 한 줄 추가한다. */
(function () {
  var KEY = "bi_lang", LANG = "en";
  try { LANG = localStorage.getItem(KEY) || "en"; } catch (e) {}
  var CAT = { "Paintings": "회화", "Prints and Multiples": "판화·멀티플", "Works on Paper": "종이 작품", "Sculptures": "조각", "Sculpture": "조각", "Photographs": "사진", "ETC": "기타", "Digital": "디지털", "Design": "디자인", "Ceramics": "도자" };
  var CTRY = { "United Kingdom": "영국", "United States": "미국", "South Korea": "한국", "Korea": "한국", "France": "프랑스", "Germany": "독일", "Japan": "일본", "China": "중국", "Hong Kong": "홍콩", "Switzerland": "스위스", "Italy": "이탈리아", "Spain": "스페인", "Austria": "오스트리아", "Netherlands": "네덜란드", "Belgium": "벨기에", "Sweden": "스웨덴", "Denmark": "덴마크", "Australia": "호주", "Canada": "캐나다", "Taiwan": "대만", "Singapore": "싱가포르", "Ireland": "아일랜드", "Israel": "이스라엘", "New Zealand": "뉴질랜드", "Monaco": "모나코", "Mexico": "멕시코", "Norway": "노르웨이", "Finland": "핀란드", "Poland": "폴란드", "Brazil": "브라질", "Argentina": "아르헨티나", "India": "인도", "Venezuela": "베네수엘라", "Russia": "러시아", "Czech Republic": "체코", "Hungary": "헝가리", "Portugal": "포르투갈" };
  var DICT = {
    // 로그인
    "How much is the artwork Today?": "이 작품, 오늘 얼마일까요?", "New Drive for Transparency": "미술 시장을 투명하게", "SIGN IN": "로그인", "Password": "비밀번호",
    // 머리말·계정
    "Log In": "로그인", "Log Out": "로그아웃", "My Portfolio": "내 포트폴리오", "Search Artists and Artworks": "작가·작품 검색", "Go to the Top": "맨 위로",
    // 메인
    "Live Market Price": "실시간 시세", "blueIndex, Your own art advisor": "blueIndex, 나만의 미술 자문가", "How blueIndex Works ∨": "blueIndex 사용법 ∨",
    "Just Search": "검색하고", "You can find what you want": "원하는 작가·작품을 찾고", "Matching…": "찾는 중…", "And Just Click": "클릭하면",
    "You can find Today's Price of the work": "그 작품의 오늘 시세가 나옵니다", "Find": "찾기", "Today's Price": "오늘 시세", "And, Just Read": "그리고 읽으면",
    "There are information you want": "필요한 정보가 다 있습니다", "Remarkable Market Mover": "주목할 시세 변동", "Remarkable Market Mover!": "주목할 시세 변동!",
    // 작가 요약 바
    "Global Rank": "세계 순위", "Local Rank": "국내 순위", "Global / Local Rank": "세계 / 국내 순위", "Demand Grade": "수요 등급", "Price Index": "가격 지수", "More": "더보기", "About": "소개",
    "Best Location": "추천 지역", "Buy": "구매", "Sell": "판매", "read more": "더 읽기", "Career Grade": "경력 등급",
    "NEUTRAL": "보통", "HIGH": "높음", "LOW": "낮음", "PRIME": "매우 높음",
    "♛ Blue-Chip Artist": "♛ 블루칩 작가", "♛ Established Artist": "♛ 중견 작가", "♛ Mid-career Artist": "♛ 미드커리어 작가", "♛ Early-career Artist": "♛ 신진 작가",
    // 필터
    "Category": "분류", "All": "전체", "or": "또는", "None": "없음", "Year": "제작 연도", "Price": "가격", "Size": "크기", "XL": "특대",
    "Sort by": "정렬", "Price (High to Low)": "가격 높은 순", "Price (Low to High)": "가격 낮은 순", "Most Popular": "인기 순", "Ending Soonest": "마감 임박 순", "Newly Listed": "최신 등록 순",
    "Auction Filter": "경매 필터", "Others": "기타", "Date": "날짜", "Any date": "전체 기간", "Ending Today": "오늘 마감", "Ending This Week": "이번 주 마감",
    "Ended in last 1 year": "최근 1년", "Ended in last 3 year": "최근 3년", "Ended in last 5 year": "최근 5년", "Location": "지역", "Choose a City of Saleroom": "경매장 도시 선택",
    "Worktitle, Medium and Any keyword": "작품명·재질·키워드", "Loading more…": "더 불러오는 중…", "Sorry,": "죄송합니다.", "There are no search results available.": "검색 결과가 없습니다.",
    "stable": "보합", "Est.": "추정가", "Remove": "빼기", "Add to Portfolio": "포트폴리오에 담기", "Monitor": "관심 작품", "Pending": "결과 대기", "NOW": "진행 중",
    // 작품 상세
    "more ∨": "더보기 ∨", "less ∧": "접기 ∧", "Sale": "경매명", "Auction": "경매", "Estimate": "추정가", "Medium": "재질", "Sold in": "낙찰",
    "Art Style · Description · Provenance · Literature": "화풍 · 설명 · 소장 이력 · 참고 문헌", "blueIndex Estimate": "blueIndex 평가가격", "Today": "오늘", "TODAY": "오늘", "Live": "실시간",
    "Market Price": "시세", "Filtering": "거르는 중", "Works": "작품", "Reset and try again": "초기화하고 다시 하기", "Selected Comparable Auction Results": "선택된 비교 경매 결과",
    "Other Similar Lots": "다른 비슷한 랏", "Apply your final estimation": "최종 평가 확정", "Add Myself": "직접 추가", "Optimize for Your Estimate": "평가 맞춤 조정",
    "Same work": "같은 작품", "Same edition": "같은 판본", "Passed": "유찰", "× Except": "× 제외", "Except": "제외", "Cancel": "취소", "OK": "확인",
    "Do you want to evaluate again?": "다시 평가하시겠어요?", "Past result will be removed.": "지난 결과는 지워집니다.",
    // 작가 상세
    "Turnover": "거래 총액", "Change": "변화", "▦ Overall": "▦ 전체", "All Category": "모든 분류", "♛ Artwork from": "♛ 전성기 작품", "⟳ Repeat": "⟳ 반복 거래", "Artwork": "작품", "⊞ Other": "⊞ 다른", "1 YR": "1년", "5 YR": "5년", "10 YR": "10년",
    "Best Location for Buy / Sell": "어디서 사고 팔면 좋을까", "Sell Here!": "여기서 판매!", "Buy Here!": "여기서 구매!", "⊡ TIP for SELLER": "⊡ 판매 팁", "$ TIP for BUYER": "$ 구매 팁",
    "Available Works": "출품 예정 작품", "See all works >": "전체 보기 >", "Popular Works": "인기 작품", "Prime Year": "전성기",
    // 포트폴리오·계정
    "There is no artwork in portfolio yet.": "아직 담은 작품이 없습니다.", "Go to find artworks": "작품 찾으러 가기", "Total Price": "총 평가액",
    "Consultant": "컨설턴트",
    // 내 소장 작품(10/20)
    "My Collection": "내 컬렉션", "I Own This": "내 작품으로 등록", "In My Collection": "내 컬렉션에 있음", "Add to Watchlist": "관심 작품에 담기", "Added to Watchlist": "관심 작품에 담음",
    "+ Register My Artwork": "+ 소장 작품 등록", "Register My Artwork": "소장 작품 등록", "Edit My Artwork": "소장 작품 수정", "Import CSV": "CSV 가져오기", "Backup": "백업 내려받기", "Restore": "백업 불러오기",
    "Register": "등록", "Save": "저장", "Edit": "수정", "Delete": "삭제", "Find in SAB DB": "SAB DB에서 같은 작품 찾기", "Saved": "저장함",
    "Artist *": "작가 *", "Title *": "작품명 *", "Category *": "분류 *", "Size (cm)": "크기 (cm)", "Edition": "에디션", "Signature": "서명", "Signature Details": "서명 자세히", "Signed and numbered": "서명·에디션 번호 있음", "Signed": "서명 있음", "Unsigned": "서명 없음", "Stamped": "도장·스탬프", "Condition": "상태",
    "Where Purchased": "구입처", "Purchase Date": "구입일", "Purchase Price (₩, optional)": "구입가 (₩, 선택)", "My Price Reference (₩, optional)": "내가 아는 시세 (₩, 선택)", "Photos (최대 3장)": "사진 (최대 3장)", "Memo": "메모",
    "Artist": "작가", "Purchase Price": "구입가", "My Price Reference": "내가 아는 시세",
    "Mixed Media": "혼합 재료", "Design · Art Toy": "디자인·아트토이", "Goods (굿즈)": "굿즈", "Not Artwork (시계·기타)": "미술품 아님(시계·기타)",
    "Excellent": "아주 좋음", "Good": "좋음", "Fair": "보통", "Poor": "나쁨", "Unknown": "모름",
    "Holding": "보유 중", "Preparing": "판매 준비", "Inquiry Sent": "문의 보냄", "Estimate Received": "추정가 받음", "Consigned": "위탁 계약", "Listed": "출품 확정", "Sold": "낙찰", "Unsold": "유찰", "Settled": "정산 완료",
    "Clients": "고객 컬렉션", "+ Register Client Artwork": "+ 고객 작품 등록", "Register Client Artwork": "고객 작품 등록", "Edit Artwork": "작품 수정", "Viewing": "보는 컬렉션", "+ Add Client": "+ 고객 추가", "Delete Client": "고객 삭제",
    "There is no artwork in your collection yet.":"아직 등록한 소장 작품이 없습니다.", "Actual Change": "실제 변화", "vs Purchase Price": "구입가 대비", "Noteworthy Movers": "눈에 띄는 변동", "For 1 Year": "1년",
    // 시세로직 탭
    "Reliability": "신뢰도", "Market Movers": "마켓무버"
  };
  function cat(s) { return CAT[s] || s; }
  var RULES = [
    [/^(\d+) mon ago(,?)$/, function (m) { return m[1] + "개월 전" + m[2]; }],
    [/^([\d,]+) Works · ([\d,]+) Auction Records$/, function (m) { return "작품 " + m[1] + "점 · 경매 기록 " + m[2] + "건"; }],
    [/^([\d,]+) Auction Records?$/, function (m) { return "경매 기록 " + m[1] + "건"; }],
    [/^· ([\d,]+) sold$/, function (m) { return "· 낙찰 " + m[1] + "건"; }],
    [/^([\d,]+) Results$/, function (m) { return "결과 " + m[1] + "건"; }],
    [/^([\d,]+) pairs$/, function (m) { return m[1] + "쌍"; }],
    [/^All \(([\d,]+)\)$/, function (m) { return "전체 (" + m[1] + ")"; }],
    [/^Only for Sale \(([\d,]+)\)$/, function (m) { return "판매 중 (" + m[1] + ")"; }],
    [/^Past Auction \(([\d,]+)\)$/, function (m) { return "지난 경매 (" + m[1] + ")"; }],
    [/^([\d,]+) Comparable Auctions$/, function (m) { return "비교 경매 " + m[1] + "건"; }],
    [/^\/ ([\d,]+) Comparables$/, function (m) { return "/ 비교 경매 " + m[1] + "건"; }],
    [/^([A-Za-z ]+), (\d{4})( · Edition of ([\d,]+))?$/, function (m) { return CAT[m[1]] ? cat(m[1]) + ", " + m[2] + (m[3] ? " · 에디션 " + m[4] + "장" : "") : null; }],
    [/^(\d{4}) · ([\d,]+) Works · (.+)$/, function (m) { return m[1] + " · 작품 " + m[2] + "점 · " + m[3]; }],
    [/^(\+?[\d.]+%) Higher$/, function (m) { return m[1] + " 높게 팔림"; }],
    [/^↓ ([\d.]+%) Cheaper$/, function (m) { return "↓ " + m[1] + " 싸게 삼"; }],
    [/^in (.+)$/, function (m) { return "· " + m[1]; }],
    [/^has been dropped ([\d.]+%)!$/, function (m) { return "이(가) " + m[1] + " 내렸습니다!"; }],
    [/^has been risen up ([\d.]+%)!$/, function (m) { return "이(가) " + m[1] + " 올랐습니다!"; }],
    [/^([A-Za-z .]+), B\.(\d{4})( · .+)?$/, function (m) { return (CTRY[m[1]] || m[1]) + ", " + m[2] + "년생" + (m[3] || ""); }],
    [/^LOT\. (\S+)$/, function (m) { return "랏 " + m[1]; }],
    [/^Withdrawn (\d{4})$/, function (m) { return "출품 취소 " + m[1]; }],
    [/^(\d{4})\.(\d{2}) · Remarkable Market Mover$/, function (m) { return m[1] + "." + m[2] + " · 주목할 시세 변동"; }],
    [/^(.+)'s Portfolio$/, function (m) { return m[1] + "의 포트폴리오"; }],
    [/^All Works \((\d+)\)$/, function (m) { return "전체 작품 (" + m[1] + ")"; }],
    [/^(\d+) Works$/, function (m) { return m[1] + "점"; }],
    [/^Edition of ([\d,]+)$/, function (m) { return "에디션 " + m[1] + "장"; }],
    [/^(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4})$/, function (m) { var M = "JanFebMarAprMayJunJulAugSepOctNovDec".indexOf(m[2]) / 3 + 1; return m[3] + "." + (M < 10 ? "0" : "") + M + "." + (m[1].length < 2 ? "0" : "") + m[1]; }],
    [/^★ Prime Year (.+)$/, function (m) { return "★ 전성기 " + m[1]; }]
  ];
  function tr(s) {
    var t = s.replace(/\s+/g, " ").trim(); if (!t || !/[A-Za-z]/.test(t)) return null;
    if (DICT.hasOwnProperty(t)) return DICT[t];
    if (CAT[t]) return CAT[t];
    if (CTRY[t]) return CTRY[t];
    for (var i = 0; i < RULES.length; i++) { var m = t.match(RULES[i][0]); if (m && RULES[i][1]) { var r = RULES[i][1](m); if (r) return r; } }
    return null;
  }
  var SKIP = "script,style,textarea,.ti,.notr,.sellt td:first-child";
  var ORIG = new WeakMap(), ATTR = ["placeholder", "title", "aria-label"];
  function doNode(n) {
    if (n.nodeType === 3) {
      var p = n.parentNode; if (!p || (p.closest && p.closest(SKIP))) return;
      var o = ORIG.has(n) ? ORIG.get(n) : n.nodeValue;
      if (LANG === "ko") { var r = tr(o); if (r != null) { if (!ORIG.has(n)) ORIG.set(n, o); var lead = o.match(/^\s*/)[0], tail = o.match(/\s*$/)[0]; if (n.nodeValue !== lead + r + tail) n.nodeValue = lead + r + tail; } }
      else if (ORIG.has(n)) { n.nodeValue = ORIG.get(n); ORIG.delete(n); }
      return;
    }
    if (n.nodeType !== 1 || n.matches(SKIP)) return;
    ATTR.forEach(function (a) {
      if (!n.hasAttribute(a)) return;
      var key = "data-i18n-" + a, o = n.getAttribute(key) || n.getAttribute(a);
      if (LANG === "ko") { var r = tr(o); if (r != null) { n.setAttribute(key, o); if (n.getAttribute(a) !== r) n.setAttribute(a, r); } }
      else if (n.hasAttribute(key)) { n.setAttribute(a, n.getAttribute(key)); n.removeAttribute(key); }
    });
    if (n.tagName === "OPTION") { var o2 = n.getAttribute("data-i18n-t") || n.textContent, r2 = LANG === "ko" ? tr(o2) : null; if (r2 != null) { n.setAttribute("data-i18n-t", o2); n.textContent = r2; } else if (LANG !== "ko" && n.hasAttribute("data-i18n-t")) { n.textContent = n.getAttribute("data-i18n-t"); n.removeAttribute("data-i18n-t"); } return; }
    for (var c = n.firstChild; c; c = c.nextSibling) doNode(c);
  }
  var busy = false;
  function run(root) { if (busy) return; busy = true; try { doNode(root || document.body); } finally { busy = false; } }
  function button() {
    var tt = document.querySelector("#tt .w"); if (!tt || tt.querySelector(".lang")) return;
    var b = document.createElement("span"); b.className = "lang notr"; b.setAttribute("role", "group"); b.setAttribute("aria-label", "언어");
    b.innerHTML = '<a data-lang="en" class="' + (LANG === "en" ? "on" : "") + '">EN</a><a data-lang="ko" class="' + (LANG === "ko" ? "on" : "") + '">한</a>';
    tt.appendChild(b);
    b.addEventListener("click", function (e) { var a = e.target.closest("[data-lang]"); if (!a) return; LANG = a.getAttribute("data-lang"); try { localStorage.setItem(KEY, LANG); } catch (x) {} document.documentElement.lang = LANG === "ko" ? "ko" : "en"; [].forEach.call(b.children, function (c) { c.classList.toggle("on", c.getAttribute("data-lang") === LANG); }); run(); });
  }
  function start() {
    document.documentElement.lang = LANG === "ko" ? "ko" : "en";
    button(); run();
    new MutationObserver(function (ms) { if (busy) return; button(); ms.forEach(function (m) { if (m.type === "characterData") run(m.target); else m.addedNodes.forEach(function (n) { run(n); }); }); })
      .observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  window.BI_I18N = { tr: tr, lang: function () { return LANG; } };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
