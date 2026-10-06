/* ============================================================
   LA VELLUNE — CAMADA DE DADOS (demo)
   ============================================================
   Guarda produtos e configurações no localStorage do navegador.
   A vitrine (store.js) e o painel (admin.js) usam ESTA MESMA API,
   então o que o admin salva aparece na loja na hora.

   DEMO: não há servidor. Para virar produção, basta trocar os
   métodos abaixo por chamadas a uma API/Supabase — a interface
   (getProducts, saveProduct, etc.) continua a mesma.
   ============================================================ */
(function () {
  "use strict";

  var PRODUCTS_KEY = "lavellune_products_v2";
  var SETTINGS_KEY = "lavellune_settings_v2";
  var SIZELISTS_KEY = "lavellune_sizelists_v2";   // listas de tamanho (ex: Roupas, Calçados)
  var CATEGORIES_KEY = "lavellune_categories_v2"; // categorias + lista de tamanho vinculada
  var FINANCE_KEY = "lavellune_finance_v2";       // lançamentos do controle financeiro

  /* ---- Catálogo Atemporal La Vellune (produtos reais em alta definição) ---- */
  var SEED_PRODUCTS = [
    {
      brand: "La Vellune",
      name: "Polo Custom Slim Fit Navy Blue",
      category: "Polos",
      price: 489.0,
      oldPrice: 590.0,
      sizes: ["P", "M", "G", "GG"],
      colors: ["Azul Marinho"],
      stock: 6,
      featured: true,
      badge: "DESTAQUE",
      image: "assets/images/products/polo-ralph-lauren-custom-navy.jpg",
      images: [
        "assets/images/products/polo-ralph-lauren-custom-navy.jpg",
        "assets/images/products/detalhe-textura-piquet.jpg",
        "assets/images/products/colecao-polos-atemporal.jpg"
      ],
      desc: "Confeccionada em piquet 100% algodão nobre penteado. Modelagem Custom Slim Fit que proporciona caimento impecável ao corpo, botões em madrepérola e bordado sutil de alto relevo. Uma peça essencial que personifica a elegância atemporal."
    },
    {
      brand: "La Vellune",
      name: "Camisa Linho Puro Italiano",
      category: "Camisas",
      price: 689.0,
      oldPrice: 790.0,
      sizes: ["P", "M", "G", "GG"],
      colors: ["Branco Neve", "Areia"],
      stock: 5,
      featured: true,
      badge: "NOVIDADE",
      image: "assets/images/products/camisa-linho.jpeg",
      images: [
        "assets/images/products/camisa-linho.jpeg"
      ],
      desc: "Linho puro de tecelagem italiana de toque arejado e fresco. Corte alfaiataria com costuras francesas, gola estruturada e abotoamento discreto. Ideal para composições de luxo discreto tanto em eventos diurnos quanto noturnos."
    },
    {
      brand: "La Vellune",
      name: "Polo Piquet Sky Blue Classic",
      category: "Polos",
      price: 489.0,
      oldPrice: null,
      sizes: ["P", "M", "G"],
      colors: ["Azul Claro"],
      stock: 4,
      featured: true,
      badge: "ATEMPORAL",
      image: "assets/images/products/polo-light-blue.jpeg",
      images: [
        "assets/images/products/polo-light-blue.jpeg",
        "assets/images/products/detalhe-textura-piquet.jpg"
      ],
      desc: "Polo clássica na nuance azul celeste suave. Fibras longas selecionadas com elasticidade natural e excelente respirabilidade térmica. Gola e punhos com acabamento canelado duplo que mantém a sustentação estrutural."
    },
    {
      brand: "La Vellune",
      name: "Quarter-Zip Pullover Atemporal",
      category: "Suéteres",
      price: 789.0,
      oldPrice: 890.0,
      sizes: ["P", "M", "G"],
      colors: ["Bege Areia", "Caramelo"],
      stock: 3,
      featured: true,
      badge: "OFERTA",
      image: "assets/images/products/quarter-zip.jpeg",
      images: [
        "assets/images/products/quarter-zip.jpeg"
      ],
      desc: "Pullover de meio zíper metálico em liga nobre antioxidante com puxador refinado. Malha encorpada de toque aveludado para compor sobreposições elegantes com camisas ou polos."
    },
    {
      brand: "La Vellune",
      name: "Polo Piquet Plum Burgundy",
      category: "Polos",
      price: 489.0,
      oldPrice: null,
      sizes: ["P", "M", "G"],
      colors: ["Borgonha", "Marsala"],
      stock: 2,
      featured: false,
      badge: "ÚLTIMAS PEÇAS",
      image: "assets/images/products/polo-purple.jpeg",
      images: [
        "assets/images/products/polo-purple.jpeg"
      ],
      desc: "Edição especial com tonalidade vinho profundo. Tingimento reativo que preserva o brilho e a solidez da cor mesmo após sucessivas lavagens. Perfeita para harmonizar com alfaiataria em tons neutros."
    },
    {
      brand: "La Vellune",
      name: "Polo Classic Deep Navy",
      category: "Polos",
      price: 489.0,
      oldPrice: 550.0,
      sizes: ["M", "G", "GG"],
      colors: ["Azul Noite"],
      stock: 7,
      featured: false,
      badge: "ESSENCIAL",
      image: "assets/images/products/polo-navy.jpeg",
      images: [
        "assets/images/products/polo-navy.jpeg",
        "assets/images/products/detalhe-textura-piquet.jpg"
      ],
      desc: "A polo indispensável no guarda-roupa masculino contemporâneo. Corte clássico alinhado, tecido de alta densidade e toque macio sem desbotamento."
    },
    {
      brand: "La Vellune",
      name: "Coleção Cápsula Polos Selecionadas",
      category: "Polos",
      price: 1350.0,
      oldPrice: 1590.0,
      sizes: ["Grade P", "Grade M", "Grade G"],
      colors: ["Cartela Atemporal"],
      stock: 5,
      featured: true,
      badge: "EDIÇÃO ESPECIAL",
      image: "assets/images/products/colecao-polos-atemporal.jpg",
      images: [
        "assets/images/products/colecao-polos-atemporal.jpg",
        "assets/images/products/detalhe-textura-piquet.jpg"
      ],
      desc: "Conjunto exclusivo contendo seleção de polos em cartela de cores clássicas (Marinho, Verde Floresta, Mostarda, Vinho e Celeste). Uma experiência completa da alfaiataria La Vellune."
    },
    {
      brand: "La Vellune",
      name: "Suéter Tricô Fino Merino Grey",
      category: "Suéteres",
      price: 720.0,
      oldPrice: null,
      sizes: ["M", "G"],
      colors: ["Cinza Mescla"],
      stock: 0,
      featured: false,
      badge: "ESGOTADO",
      image: "assets/images/products/sueter-ralph.jpg",
      images: [
        "assets/images/products/sueter-ralph.jpg"
      ],
      desc: "Tricô clássico em malha fina com caimento leve e confortável. Gola redonda com acabamento elástico que mantém a estrutura da peça intacta."
    }
  ];

  var DEFAULT_SETTINGS = {
    storeName: "La Vellune",
    tagline: "Elegance in every detail · Timeless fashion",
    whatsapp: "5579996179533",          /* << WhatsApp de atendimento La Vellune */
    instagram: "https://www.instagram.com/la.vellune/",
    email: "contato@lavellune.com.br",
    phone: "(79) 99617-9533",
    address: "Aracaju — SE, Brasil",
    footerNote: "CNPJ 00.000.000/0001-00 · Todos os direitos reservados",
    freeShippingFrom: 499,
    /* Logo da loja (URL ou dataURL). */
    logo: "assets/images/logo.png",
  };

  /* ---- Listas de tamanho ---- */
  var SEED_SIZELISTS = [
    { id: "sl-roupas", name: "Roupas e Polos", sizes: ["P", "M", "G", "GG"] },
    { id: "sl-calcados", name: "Calçados", sizes: ["39", "40", "41", "42", "43"] },
    { id: "sl-unico", name: "Peça única / Acessório", sizes: ["Único"] },
  ];

  /* ---- Categorias ---- */
  var SEED_CATEGORIES = [
    { id: "cat-polos", name: "Polos", sizeListId: "sl-roupas" },
    { id: "cat-camisas", name: "Camisas", sizeListId: "sl-roupas" },
    { id: "cat-sueteres", name: "Suéteres", sizeListId: "sl-roupas" },
    { id: "cat-alfaiataria", name: "Alfaiataria", sizeListId: "sl-roupas" },
    { id: "cat-acessorios", name: "Acessórios", sizeListId: "sl-unico" },
  ];

  /* ---- Lançamentos financeiros de exemplo ---- */
  var SEED_FINANCE = [
    { id: "fin-1", type: "receita", description: "Venda — Polo Custom Slim Fit Navy", amount: 489.0, date: "2026-10-01" },
    { id: "fin-2", type: "receita", description: "Venda — Camisa Linho Italiano", amount: 689.0, date: "2026-10-02" },
    { id: "fin-3", type: "despesa", description: "Fornecedor — tecidos algodão piquet", amount: 1200, date: "2026-10-02" },
    { id: "fin-4", type: "receita", description: "Venda — Quarter-Zip Pullover", amount: 789.0, date: "2026-10-03" },
    { id: "fin-5", type: "despesa", description: "Embalagens especiais La Vellune", amount: 350, date: "2026-10-04" },
    { id: "fin-6", type: "receita", description: "Venda — Polo Sky Blue Classic", amount: 489.0, date: "2026-10-05" },
    { id: "fin-7", type: "despesa", description: "Campanha Meta Ads Atemporal", amount: 180, date: "2026-10-05" },
  ];

  /* ---------- helpers ---------- */
  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }
  function uid() {
    return "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function emitChange() {
    window.dispatchEvent(new CustomEvent("lavellune:change"));
  }

  function ensureSeed() {
    var existing = read(PRODUCTS_KEY, null);
    if (!existing) {
      var now = Date.now();
      var seeded = SEED_PRODUCTS.map(function (p, i) {
        return Object.assign({ id: uid(), createdAt: now - i * 1000 }, p);
      });
      write(PRODUCTS_KEY, seeded);
    }
    if (!read(SETTINGS_KEY, null)) write(SETTINGS_KEY, DEFAULT_SETTINGS);
    if (!read(SIZELISTS_KEY, null)) write(SIZELISTS_KEY, SEED_SIZELISTS);
    if (!read(CATEGORIES_KEY, null)) write(CATEGORIES_KEY, SEED_CATEGORIES);
    if (!read(FINANCE_KEY, null)) write(FINANCE_KEY, SEED_FINANCE);
  }

  /* ---------- logo da marca / placeholder (SVG, funciona offline) ---------- */
  function xmlEsc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function brandMonogram() {
    var name = (getSettings().storeName || "La Vellune").trim();
    var svg =
      "<svg xmlns='http://www.w3.org/2000/svg' width='600' height='760'>" +
      "<rect width='600' height='760' fill='#faf7f0'/>" +
      "<rect x='20' y='20' width='560' height='720' fill='none' stroke='#c8a261' stroke-opacity='0.4'/>" +
      "<text x='300' y='360' font-family='Georgia,serif' font-size='120' fill='#112418' font-style='italic' " +
      "text-anchor='middle'>Lv</text>" +
      "<text x='300' y='430' font-family='Georgia,serif' font-size='24' fill='#112418' " +
      "letter-spacing='6' text-anchor='middle' opacity='0.85'>" + xmlEsc(name.toUpperCase()) + "</text>" +
      "</svg>";
    return "data:image/svg+xml," + encodeURIComponent(svg);
  }

  /* Imagem a exibir para um produto:
     1) a foto do produto, se tiver;
     2) senão, a logo da loja (configurações);
     3) senão, o monograma com o nome da loja. */
  function imageOf(product) {
    if (product && product.image && String(product.image).trim()) return String(product.image).trim();
    var logo = getSettings().logo;
    if (logo && String(logo).trim()) return String(logo).trim();
    return brandMonogram();
  }

  function formatPrice(value) {
    var n = Number(value) || 0;
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  /* ---------- API de produtos ---------- */
  function getProducts() {
    ensureSeed();
    return read(PRODUCTS_KEY, []);
  }
  function getProduct(id) {
    return getProducts().filter(function (p) { return p.id === id; })[0] || null;
  }
  function saveProduct(data) {
    var list = getProducts();
    var clean = sanitize(data);
    if (clean.id) {
      list = list.map(function (p) { return p.id === clean.id ? Object.assign({}, p, clean) : p; });
    } else {
      clean.id = uid();
      clean.createdAt = Date.now();
      list.unshift(clean);
    }
    write(PRODUCTS_KEY, list);
    emitChange();
    return clean;
  }
  function removeProduct(id) {
    write(PRODUCTS_KEY, getProducts().filter(function (p) { return p.id !== id; }));
    emitChange();
  }
  function setStock(id, stock) {
    write(PRODUCTS_KEY, getProducts().map(function (p) {
      return p.id === id ? Object.assign({}, p, { stock: Math.max(0, parseInt(stock, 10) || 0) }) : p;
    }));
    emitChange();
  }

  function sanitize(data) {
    var out = {};
    if (data.id) out.id = String(data.id);
    out.name = String(data.name || "").trim();
    out.brand = String(data.brand || "La Vellune").trim();
    out.category = String(data.category || "Diversos").trim();
    out.price = Number(data.price) || 0;
    out.oldPrice = data.oldPrice ? Number(data.oldPrice) : null;
    out.stock = Math.max(0, parseInt(data.stock, 10) || 0);
    out.sizes = normalizeList(data.sizes);
    out.colors = normalizeList(data.colors);
    out.desc = String(data.desc || "").trim();
    out.image = String(data.image || "").trim();
    out.featured = !!data.featured;
    if (data.createdAt) out.createdAt = data.createdAt;
    return out;
  }
  function normalizeList(v) {
    if (Array.isArray(v)) return v.map(String).map(function (s) { return s.trim(); }).filter(Boolean);
    return String(v || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
  }

  /* ---------- categorias derivadas dos produtos ---------- */
  function getCategories() {
    var set = {};
    getProducts().forEach(function (p) { if (p.category) set[p.category] = (set[p.category] || 0) + 1; });
    return Object.keys(set).sort().map(function (name) { return { name: name, count: set[name] }; });
  }

  /* ---------- busca + filtros (usado pela vitrine) ---------- */
  function queryProducts(opts) {
    opts = opts || {};
    var list = getProducts();
    var term = (opts.search || "").toLowerCase().trim();

    if (opts.category && opts.category !== "all") {
      list = list.filter(function (p) { return p.category === opts.category; });
    }
    if (term) {
      list = list.filter(function (p) {
        return (p.name + " " + p.brand + " " + p.category + " " + (p.colors || []).join(" "))
          .toLowerCase().indexOf(term) !== -1;
      });
    }
    if (opts.priceMin != null && opts.priceMin !== "") list = list.filter(function (p) { return p.price >= Number(opts.priceMin); });
    if (opts.priceMax != null && opts.priceMax !== "") list = list.filter(function (p) { return p.price <= Number(opts.priceMax); });
    if (opts.size && opts.size !== "all") list = list.filter(function (p) { return (p.sizes || []).indexOf(opts.size) !== -1; });
    if (opts.inStock) list = list.filter(function (p) { return (p.stock || 0) > 0; });

    switch (opts.sort) {
      case "price-asc":  list = list.slice().sort(function (a, b) { return a.price - b.price; }); break;
      case "price-desc": list = list.slice().sort(function (a, b) { return b.price - a.price; }); break;
      case "name":       list = list.slice().sort(function (a, b) { return a.name.localeCompare(b.name); }); break;
      default:           list = list.slice().sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
    }
    return list;
  }

  function allSizes() {
    var set = {};
    getProducts().forEach(function (p) { (p.sizes || []).forEach(function (s) { set[s] = true; }); });
    return Object.keys(set);
  }

  /* ---------- configurações da loja ---------- */
  function getSettings() { ensureSeed(); return read(SETTINGS_KEY, DEFAULT_SETTINGS); }
  function saveSettings(data) { write(SETTINGS_KEY, Object.assign({}, getSettings(), data)); emitChange(); }

  /* ---------- LISTAS DE TAMANHO ---------- */
  function getSizeLists() { ensureSeed(); return read(SIZELISTS_KEY, []); }
  function getSizeList(id) { return getSizeLists().filter(function (l) { return l.id === id; })[0] || null; }
  function saveSizeList(data) {
    var lists = getSizeLists();
    var clean = {
      id: data.id || "sl" + uid(),
      name: String(data.name || "").trim() || "Sem nome",
      sizes: normalizeList(data.sizes),
    };
    if (data.id && lists.some(function (l) { return l.id === data.id; })) {
      lists = lists.map(function (l) { return l.id === data.id ? clean : l; });
    } else { lists.push(clean); }
    write(SIZELISTS_KEY, lists); emitChange(); return clean;
  }
  function removeSizeList(id) {
    write(SIZELISTS_KEY, getSizeLists().filter(function (l) { return l.id !== id; }));
    // Categorias que usavam esta lista ficam sem lista (tamanho livre).
    write(CATEGORIES_KEY, getCategoryDefs().map(function (c) {
      return c.sizeListId === id ? Object.assign({}, c, { sizeListId: "" }) : c;
    }));
    emitChange();
  }

  /* ---------- CATEGORIAS (com lista de tamanho vinculada) ---------- */
  function getCategoryDefs() { ensureSeed(); return read(CATEGORIES_KEY, []); }
  function saveCategory(data) {
    var cats = getCategoryDefs();
    var clean = {
      id: data.id || "cat" + uid(),
      name: String(data.name || "").trim(),
      sizeListId: data.sizeListId || "",
    };
    if (!clean.name) return null;
    if (data.id && cats.some(function (c) { return c.id === data.id; })) {
      cats = cats.map(function (c) { return c.id === data.id ? clean : c; });
    } else { cats.push(clean); }
    write(CATEGORIES_KEY, cats); emitChange(); return clean;
  }
  function removeCategory(id) {
    write(CATEGORIES_KEY, getCategoryDefs().filter(function (c) { return c.id !== id; }));
    emitChange();
  }
  /* Tamanhos disponíveis para uma categoria = os da lista vinculada a ela. */
  function sizesForCategory(categoryName) {
    var cat = getCategoryDefs().filter(function (c) { return c.name === categoryName; })[0];
    if (!cat || !cat.sizeListId) return [];
    var list = getSizeList(cat.sizeListId);
    return list ? list.sizes.slice() : [];
  }

  /* ---------- CONTROLE FINANCEIRO ---------- */
  function getFinance() { ensureSeed(); return read(FINANCE_KEY, []).slice().sort(function (a, b) { return (b.date || "").localeCompare(a.date || ""); }); }
  function addFinanceEntry(data) {
    var list = read(FINANCE_KEY, []);
    var clean = {
      id: "fin" + uid(),
      type: data.type === "despesa" ? "despesa" : "receita",
      description: String(data.description || "").trim() || "Lançamento",
      amount: Math.max(0, Number(data.amount) || 0),
      date: data.date || new Date().toISOString().slice(0, 10),
    };
    list.push(clean); write(FINANCE_KEY, list); emitChange(); return clean;
  }
  function removeFinanceEntry(id) {
    write(FINANCE_KEY, read(FINANCE_KEY, []).filter(function (e) { return e.id !== id; }));
    emitChange();
  }
  function financeSummary() {
    var f = read(FINANCE_KEY, []);
    var receitas = 0, despesas = 0;
    f.forEach(function (e) { if (e.type === "despesa") despesas += Number(e.amount) || 0; else receitas += Number(e.amount) || 0; });
    return { receitas: receitas, despesas: despesas, saldo: receitas - despesas, lancamentos: f.length };
  }
  /* Receita por mês (YYYY-MM) — alimenta o gráfico do painel financeiro. */
  function financeByMonth() {
    var f = read(FINANCE_KEY, []);
    var map = {};
    f.forEach(function (e) {
      var m = (e.date || "").slice(0, 7); if (!m) return;
      if (!map[m]) map[m] = { month: m, receitas: 0, despesas: 0 };
      if (e.type === "despesa") map[m].despesas += Number(e.amount) || 0;
      else map[m].receitas += Number(e.amount) || 0;
    });
    return Object.keys(map).sort().map(function (k) { return map[k]; });
  }

  function resetDemo() {
    try {
      [PRODUCTS_KEY, SETTINGS_KEY, SIZELISTS_KEY, CATEGORIES_KEY, FINANCE_KEY].forEach(function (k) { localStorage.removeItem(k); });
    } catch (e) {}
    ensureSeed(); emitChange();
  }

  /* Reage a mudanças feitas em outra aba (admin aberto ao lado da loja) */
  window.addEventListener("storage", function (e) {
    if ([PRODUCTS_KEY, SETTINGS_KEY, SIZELISTS_KEY, CATEGORIES_KEY, FINANCE_KEY].indexOf(e.key) !== -1) emitChange();
  });

  /* API pública */
  window.LV = {
    getProducts: getProducts,
    getProduct: getProduct,
    saveProduct: saveProduct,
    removeProduct: removeProduct,
    setStock: setStock,
    getCategories: getCategories,
    queryProducts: queryProducts,
    allSizes: allSizes,
    getSettings: getSettings,
    saveSettings: saveSettings,
    imageOf: imageOf,
    brandMonogram: brandMonogram,
    formatPrice: formatPrice,
    resetDemo: resetDemo,
    // listas de tamanho
    getSizeLists: getSizeLists,
    getSizeList: getSizeList,
    saveSizeList: saveSizeList,
    removeSizeList: removeSizeList,
    // categorias
    getCategoryDefs: getCategoryDefs,
    saveCategory: saveCategory,
    removeCategory: removeCategory,
    sizesForCategory: sizesForCategory,
    // financeiro
    getFinance: getFinance,
    addFinanceEntry: addFinanceEntry,
    removeFinanceEntry: removeFinanceEntry,
    financeSummary: financeSummary,
    financeByMonth: financeByMonth,
  };
})();
