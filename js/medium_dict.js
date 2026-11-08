/* 재질 사전 (11/8 운영자: "AI 없이도 정상으로 돌 수 있게 유사어 데이터셋" — 초안 = Claude, 검증 = 자동 점검 + 독립 검토)
   쓰는 곳: 작품 상세 '다른 비슷한 랏' 재질 칸 ○△ 판정(artwork.html). 시세 계산(엔진)은 쓰지 않음 — 엔진에 쓰려면 백테스트 회차 필요
   고치는 법: 아래 drop / syn / kind 에 한 줄 더하고, node C:/tmp/wk/med_dict_check.js 로 검증 → 웹배포
   판정: 재질 글 → 단어로 나눔 → drop 단어 빼고 → syn으로 같은 말 통일 → 남은 단어 묶음이 같으면 ○
     · 사전에 없는 단어는 그대로 남긴다(모르는 말은 '다르다'고 보는 쪽이 안전 — 잘못된 ○를 막음)
     · 재질 글이 70자에서 잘린 경우(화면 데이터 16번) 마지막 단어는 뺀다 · 한 글자 단어는 뺀다
   kind: 통일된 단어의 종류(기법 / 바탕 / 재료) — "기법은 같고 바탕만 다름" 같은 설명에 씀 */
(function (W) {
  var DROP = [
    /* 연결어(영·불·독·한) */ "on", "and", "in", "with", "the", "of", "an", "to", "by", "from", "over", "under", "each", "as", "without", "within", "for", "both", "between", "behind", "onto", "all", "out", "its", "or", "into", "upon", "at", "is", "are", "be", "this", "that", "their", "including", "comprising", "comprised", "containing", "contained", "together", "after", "based", "using", "via", "plus",
    "de", "sur", "en", "et", "du", "dans", "aux", "au", "avec", "la", "le", "les", "un", "une", "des", "auf", "und", "mit", "su", "su", "con", "di", "에", "위에", "및",
    /* 색 설명 — 금·은은 재료일 수 있어 남김(silver foil, gold leaf) */ "color", "colors", "colour", "colours", "colored", "coloured", "coloring", "colouring", "couleurs", "couleur", "colori", "farben", "multicolour", "multicolor", "multicolored", "polychrome", "polychromed", "white", "black", "brown", "red", "green", "blue", "yellow", "grey", "gray", "pink", "orange", "purple", "violet", "teal", "cream", "beige", "ivory", "tan", "buff", "dark", "light", "pale", "reddish", "brownish", "greenish", "bluish", "golden", "noir", "noire", "blanc", "blanche", "rouge", "bleu", "tinted", "tint", "shade", "shades", "tone", "toned", "tones", "nuanced", "hues", "monochrome", "위",
    /* 상태·액자·마운트·보관 */ "full", "margin", "margins", "sheet", "sheets", "framed", "unframed", "frame", "frames", "matted", "mat", "mount", "mounted", "flush", "stretcher", "strainer", "stretched", "laminated", "diasec", "dibond", "housed", "box", "boxes", "case", "sleeve", "slipcase", "packaging", "package", "folder", "envelope", "flightcase", "présentés", "leur", "encadrée", "conservation", "museum", "deckle", "deckled", "edges", "edge", "trimmed", "loose", "bound", "unbound", "folded", "hinged", "glued", "pasted", "backed", "backing",
    /* 에디션·서명·출판 */ "edition", "editions", "signed", "numbered", "dated", "titled", "inscribed", "proof", "proofs", "issued", "executed", "published", "publisher", "printed", "print", "prints", "printing", "printer", "impression", "copy", "copies", "certificate", "authenticity", "authen", "accompanied", "accompanying", "catalogue", "raisonné", "title", "text", "page", "pages", "illustrated", "illustrations", "illustration", "frontispiece", "album", "book", "books", "portfolio", "suite", "series", "set", "sets", "complete", "unique", "multiple", "multiples", "original", "originals", "limited", "number", "artist", "artists", "exhibition", "poster", "posters", "issue", "volume", "volumes", "facsimile", "reproduction", "reproductions", "special", "first", "state", "states", "variant", "work", "works", "piece", "pieces", "parts", "part", "pair", "elements", "object", "objects", "figure", "figures", "decoration", "decorated", "décor", "decor", "made", "executed",
    /* 수·크기·모양 설명 */ "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "twenty", "thin", "thick", "heavy", "heavyweight", "lightweight", "large", "small", "mini", "wide", "high", "double", "round", "square", "oval", "rectangular", "monumental", "fine", "good", "rare", "vintage", "old", "new", "professional", "strong", "very", "slightly", "partially", "partly", "partial", "various", "chosen", "custom", "shaped", "sized", "sided", "smooth", "textured", "soft", "hard", "firm", "matte", "matt", "glossy", "gloss", "satin", "clear", "opaque", "transparent", "natural", "pure", "fully", "entire", "whole", "each", "approximately", "approx", "medium", "handmade", "archival", "cm", "mm", "gsm", "inch", "inches",
    /* 잘린 조각(70자 잘림·띄어쓰기 오류) */ "pap", "pape", "pa", "shee", "wit", "marg", "margi", "ful", "fram", "pri", "prin", "pr", "col", "orig", "sh", "she", "ma", "mar", "fr", "fra", "wo", "wi", "dr", "co", "stra", "straine", "gl", "mou", "port", "sa", "th", "tip", "tipped", "ii", "iii",
    /* 물건 모양·용도(재질이 아님 — earthenware pitcher와 earthenware vase는 같은 재질) */ "plate", "plates", "pitcher", "vase", "vases", "dish", "dishes", "plaque", "plaques", "bowl", "bowls", "jug", "platter", "tray", "tile", "tiles", "ashtray", "cup", "cups", "teapot", "jar", "vessel", "drawing", "drawings", "painting", "paintings", "medicom", "picasso", "vollard", "art", "object", "base", "pedestal", "korean", "japanese", "chinese", "down", "cold", "brush", "process", "technique"
  ];
  var SYN = {
    /* 판화 기법 */ "silkscreen": "screenprint", "silkscreens": "screenprint", "serigraph": "screenprint", "serigraphs": "screenprint", "serigraphy": "screenprint", "sérigraphie": "screenprint", "serigrafia": "screenprint", "screenprints": "screenprint", "screenprinted": "screenprint", "screenprinting": "screenprint", "실크스크린": "screenprint",
    "lithographs": "lithograph", "lithographic": "lithograph", "lithography": "lithograph", "lithographie": "lithograph", "lithographies": "lithograph", "litografia": "lithograph", "lithografie": "lithograph", "석판화": "lithograph",
    "etchings": "etching", "radierung": "etching", "에칭": "etching",
    "aquatints": "aquatint", "aquatinte": "aquatint", "drypoints": "drypoint", "pointe": "drypoint", "sèche": "drypoint",
    "woodcuts": "woodcut", "woodblock": "woodcut", "목판화": "woodcut", "linoleum": "linocut", "linocuts": "linocut", "engraved": "engraving", "engravings": "engraving", "gravure": "photogravure",
    "heliogravure": "photogravure", "héliogravure": "photogravure", "aquatinted": "aquatint",
    "giclée": "digital", "giclee": "digital", "inkjet": "digital", "ultrachrome": "digital", "옵셋": "offset", "offsetlithograph": "offset",
    "monoprints": "monoprint", "monotypes": "monotype", "embossed": "embossing", "embossment": "embossing", "pochoir": "stencil", "stencils": "stencil",
    /* 그리는 재료 */ "huile": "oil", "olio": "oil", "öl": "oil", "유채": "oil", "oils": "oil",
    "acrylique": "acrylic", "acrylics": "acrylic", "아크릴릭": "acrylic", "아크릴": "acrylic",
    "watercolour": "watercolor", "watercolours": "watercolor", "watercolors": "watercolor", "aquarelle": "watercolor", "acquerello": "watercolor", "수채": "watercolor",
    "pastels": "pastel", "crayons": "crayon", "conté": "crayon", "conte": "crayon", "pencils": "pencil", "penci": "pencil", "연필": "pencil",
    "inks": "ink", "indian": "ink", "encre": "ink", "india": "ink", "sumi": "ink", "먹": "ink", "lavis": "wash", "sanguine": "chalk", "chalks": "chalk", "charcoals": "charcoal", "목탄": "charcoal",
    "peint": "paint", "peinte": "paint", "peinture": "paint", "painted": "paint", "paints": "paint", "spraypaint": "spray", "aerosol": "spray", "markers": "marker",
    "mixed": "mixedmedia", "media": "mixedmedia", "mixedmedia": "mixedmedia", "혼합재료": "mixedmedia", "collaged": "collage", "collé": "collage", "collages": "collage",
    "handcoloring": "handcolored", "handcoloured": "handcolored", "handpainted": "handcolored",
    /* 사진 */ "photographs": "photograph", "photo": "photograph", "photographic": "photograph", "photography": "photograph",
    "lambda": "chromogenic", "ektacolor": "chromogenic", "fujicolor": "chromogenic", "fujicolour": "chromogenic", "polacolor": "polaroid", "polaroids": "polaroid",
    /* 바탕(종이) — 종이 상표·종류는 '종이'로 통일 */ "papier": "paper", "papers": "paper", "carta": "paper", "papel": "paper", "종이에": "paper", "종이": "paper",
    "wove": "paper", "wov": "paper", "laid": "paper", "vergé": "paper", "vellum": "paper", "vélin": "paper", "velin": "paper", "arches": "paper", "rives": "paper", "bfk": "paper", "somerset": "paper", "lenox": "paper", "montval": "paper", "japan": "paper", "japon": "paper", "chine": "paper", "hahnemühle": "paper", "hahnemuhle": "paper", "fabriano": "paper", "saunders": "paper", "strathmore": "paper", "canson": "paper", "arjomari": "paper", "rag": "paper", "mulberry": "paper", "kozo": "paper", "hosho": "paper", "zerkall": "paper", "inveresk": "paper", "crisbrook": "paper", "coventry": "paper", "magnani": "paper", "stonehenge": "paper", "mohawk": "paper", "twinrocker": "paper", "schoellers": "paper", "moulin": "paper", "guarro": "paper", "ingres": "paper", "bristol": "paper", "essex": "paper", "auvergne": "paper", "waterford": "paper", "hodgkinson": "paper", "beckett": "paper", "crestwood": "paper", "lanaquarelle": "paper", "newsprint": "paper", "tissue": "paper", "watermark": "paper", "watermarked": "paper", "innova": "paper", "hmp": "paper", "tgl": "paper", "chromolux": "paper",
    "한지에": "hanji", "한지": "hanji", "장지": "hanji", "닥종이": "hanji", "비단": "silk", "목판": "wood", "스크린프린트": "screenprint", "브론즈": "bronze", "파스텔": "pastel",
    /* 바탕(캔버스·판) */ "toile": "canvas", "tela": "canvas", "leinwand": "canvas", "canvases": "canvas", "캔버스에": "canvas", "캔버스": "canvas", "마대에": "burlap", "hessian": "burlap",
    "carton": "cardboard", "cover": "paper", "terre": "earthenware", "paperboard": "cardboard", "card": "cardboard", "masonite": "hardboard", "panels": "panel", "wooden": "wood", "bois": "wood", "legno": "wood", "holz": "wood",
    "aluminium": "aluminum", "alu": "aluminum", "plexiglas": "plexiglass", "perspex": "plexiglass", "acrylglas": "plexiglass", "verre": "glass", "fibreglass": "fiberglass", "frp": "fiberglass",
    "stainless": "steel", "résine": "resin", "resine": "resin", "vinyle": "vinyl",
    /* 도자·조각 재료 */ "ceramics": "ceramic", "céramique": "ceramic", "faïence": "earthenware", "faience": "earthenware", "terracota": "terracotta",
    "glazed": "glaze", "glazes": "glaze", "unglazed": "unglazed", "engobes": "engobe", "engo": "engobe", "engob": "engobe",
    "enameled": "enamel", "enamelled": "enamel", "émaillée": "enamel", "émaillé": "enamel", "patinated": "patina", "patiné": "patina", "patinée": "patina", "gilded": "gilt", "varnished": "varnish", "varnishing": "varnish",
    "urethane": "polyurethane", "sculptures": "sculpture"
  };
  var KIND = {
    "기법": "screenprint lithograph etching aquatint drypoint woodcut linocut engraving photogravure digital offset collotype monotype monoprint stencil embossing intaglio carborundum mezzotint photolithograph letterpress chromogenic gelatin polaroid cibachrome photograph oil acrylic watercolor gouache tempera pastel crayon pencil graphite charcoal chalk ink pen ballpoint marker spray paint wash mixedmedia collage handcolored oilstick oilpastel coloredpencil watercolorpencil colorpaint chinecolle casein fresco emulsion airbrush frottage glaze engobe enamel patina gilt varnish lacquer embroidery tapestry appliqué cast",
    "바탕": "paper hanji hemp canvas linen burlap board cardboard hardboard panel wood plywood mdf aluminum plexiglass glass foil silk cotton fabric cloth felt leather parchment canvasboard masonite",
    "재료": "coldcast bronze resin fiberglass ceramic earthenware porcelain stoneware terracotta clay plaster marble stone concrete vinyl plastic pvc polyester polyurethane polystone wax steel iron copper brass zinc nickel metal gold silver leaf glitter diamond sand rubber"
  };
  /* 여러 단어로 된 말(단어로 나누기 전에 바꿈) — 한 단어만 보면 뜻이 갈리는 것들
     pigment: 'pigment print'·'archival pigment'만 디지털 프린트, 'oil and pigment'의 pigment는 물감이라 그대로
     screen: 'screen print'만 실크스크린, 병풍(eight-panel screen)은 그대로 */
  var PHRASE = [
    /* 독립 검토(11/8)에서 찾은 잘못된 '같음' 막기 — 단어로 나누기 전에 한 단어로 묶어 남김 */
    [/수묵\s*(채색|담채)/g, " ink colorpaint "], [/수묵/g, " ink "], [/채색/g, " colorpaint "],
    [/ink[\s-]+and[\s-]+colou?rs?/g, "ink colorpaint"], [/colou?rs?[\s-]+and[\s-]+ink/g, "colorpaint ink"], [/(^|[,;]\s*)colou?rs?[\s-]+on\b/g, "$1colorpaint on"],
    [/watercolou?r[\s-]+pencils?/g, "watercolorpencil"], [/colou?r(ed)?[\s-]+pencils?/g, "coloredpencil"], [/oil[\s-]+pastels?/g, "oilpastel"], [/oil[\s-]+sticks?/g, "oilstick"],
    [/laid[\s-]+(down[\s-]+)?(on|to|onto)\b/g, " on "], [/chine[\s-]*coll[ée]e?/g, "chinecolle"], [/india[\s-]+paper/g, "paper"], [/cold[\s-]*cast/g, "coldcast"],
    [/black[\s-]+(and|&)[\s-]+white[\s-]+(photo)/g, "bw $2"], [/colou?r[\s-]+(photo)/g, "chromogenic $1"],
    [/(with\s+|in\s+)?(the\s+|its\s+|their\s+|an?\s+)?(artist'?s'?\s+|original\s+|presentation\s+|custom\s+|product\s+)*(wooden\s+|wood\s+|cardboard\s+|plexiglas?s?\s+|perspex\s+|metal\s+|aluminium\s+|aluminum\s+|acrylic\s+|painted\s+|card\s+|paper\s+)*(box|boxes|case|packaging|frame|sleeve)\b/g, " "],
    [/([가-힣]{2,})(에|와|과)(?=[\s,.;]|$)/g, "$1"],
    [/silk[\s-]*screen/g, "screenprint"], [/screen[\s-]*print(ed|s|ing)?/g, "screenprint"], [/screenprint[\s-]+print(s)?\b/g, "screenprint"],
    [/hand[\s-]*(signed|made|numbered|written|inscribed)/g, " "], [/hand[\s-]*(colou?r(ed|ing)?|painted|tinted)/g, "handcolored"],
    [/water[\s-]+colou?rs?/g, "watercolor"], [/dry[\s-]+point/g, "drypoint"], [/van[\s-]+gelder([\s-]+zonen)?/g, "paper"], [/richard[\s-]+de[\s-]+bas/g, "paper"], [/mixed[\s-]*media/g, "mixedmedia"],
    [/(archival|ultrachrome)[\s-]+pigment/g, "digital"], [/(digital|inkjet|gicl[ée]e)[\s-]+pigment/g, "$1"], [/synthetic[\s-]+polymer([\s-]+paint)?/g, "acrylic"], [/polymer[\s-]+paint/g, "acrylic"], [/pigment[\s-]+(ink[\s-]+)?(jet[\s-]+)?print/g, "digital print"],
    [/eau[\s-]+forte/g, "etching"], [/terre[\s-]+cuite/g, "terracotta"], [/\bc[\s-]+print/g, "chromogenic"], [/type[\s-]+c\b/g, "chromogenic"],
    [/pointe[\s-]+s[èe]che/g, "drypoint"], [/offset[\s-]+lithograph/g, "offset lithograph"]
  ];
  var D = {}; DROP.forEach(function (w) { D[w] = 1; });
  var K = {}; Object.keys(KIND).forEach(function (k) { KIND[k].split(" ").forEach(function (w) { K[w] = k; }); });
  function words(m) {
    var raw = String(m || "").toLowerCase(), cut = raw.length >= 70 && /[a-zà-ÿ가-힣]$/i.test(raw), s = raw;
    PHRASE.forEach(function (p) { s = s.replace(p[0], p[1]); });
    var w = s.match(/[a-zà-ÿ가-힣]+/g) || [];
    if (cut) w = w.slice(0, -1);     // 70자에서 잘린 글의 마지막 조각
    return w;
  }
  function core(m) {
    var out = [];
    words(m).forEach(function (x) {
      if (x.length < 2 || D[x]) return;
      var c = SYN[x] || x;
      if (out.indexOf(c) < 0) out.push(c);
    });
    return out.sort();
  }
  function same(a, b) { if (String(a).toLowerCase() === String(b).toLowerCase()) return true; var x = core(a).join(" "); return !!x && x === core(b).join(" "); }
  function share(a, b) { var y = core(b); return core(a).some(function (w) { return y.indexOf(w) >= 0; }); }
  W.SAB_MED = { DROP: DROP, SYN: SYN, KIND: KIND, kind: function (w) { return K[w] || null; }, words: words, core: core, same: same, share: share, known: function (w) { return !!(D[w] || SYN[w] || K[w]); } };
})(typeof window !== "undefined" ? window : globalThis);
