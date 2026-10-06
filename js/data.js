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

  var PRODUCTS_KEY = "lavellune_products_v1";
  var SETTINGS_KEY = "lavellune_settings_v1";
  var SIZELISTS_KEY = "lavellune_sizelists_v1";   // listas de tamanho (ex: Roupas, Calçados)
  var CATEGORIES_KEY = "lavellune_categories_v1"; // categorias + lista de tamanho vinculada
  var FINANCE_KEY = "lavellune_finance_v1";       // lançamentos do controle financeiro

  /* ---- Dados de exemplo (o cliente troca pelos reais no painel) ---- */
  var SEED_PRODUCTS = [
    { brand: "La Vellune", name: "Vestido Midi Seda Pura", category: "Vestidos", price: 689.9, oldPrice: 890, sizes: ["PP", "P", "M", "G"], colors: ["Preto", "Champagne"], stock: 8, featured: true, desc: "Vestido midi em seda com caimento fluido e acabamento artesanal." },
    { brand: "La Vellune", name: "Blazer Alfaiataria Lã Fria", category: "Blazers", price: 759, oldPrice: null, sizes: ["P", "M", "G"], colors: ["Caramelo", "Preto"], stock: 5, featured: true, desc: "Alfaiataria estruturada em lã fria, forro acetinado." },
    { brand: "La Vellune", name: "Blusa Cetim Gola Laço", category: "Blusas", price: 329.9, oldPrice: 399, sizes: ["PP", "P", "M", "G", "GG"], colors: ["Marfim", "Vinho"], stock: 14, featured: false, desc: "Blusa em cetim com gola laço removível." },
    { brand: "La Vellune", name: "Calça Pantalona Cintura Alta", category: "Calças", price: 459, oldPrice: null, sizes: ["36", "38", "40", "42"], colors: ["Preto", "Areia"], stock: 0, featured: false, desc: "Pantalona de cintura alta com prega marcada." },
    { brand: "La Vellune", name: "Scarpin Couro Nobuck", category: "Calçados", price: 549.9, oldPrice: 649, sizes: ["34", "35", "36", "37", "38", "39"], colors: ["Nude", "Preto"], stock: 11, featured: true, desc: "Scarpin em couro nobuck com salto taça de 7cm." },
    { brand: "La Vellune", name: "Bolsa Estruturada Couro", category: "Bolsas", price: 899, oldPrice: null, sizes: ["Único"], colors: ["Caramelo", "Off-white"], stock: 6, featured: true, desc: "Bolsa estruturada em couro legítimo com alça dupla." },
    { brand: "La Vellune", name: "Conjunto Tricô Costela", category: "Conjuntos", price: 619, oldPrice: 720, sizes: ["P", "M", "G"], colors: ["Cinza", "Terracota"], stock: 9, featured: false, desc: "Conjunto de tricô canelado — cropped e saia midi." },
    { brand: "La Vellune", name: "Lenço Seda Estampado", category: "Acessórios", price: 189.9, oldPrice: null, sizes: ["Único"], colors: ["Esmeralda", "Dourado"], stock: 22, featured: false, desc: "Lenço 90x90 em seda com estampa exclusiva." },
    { brand: "La Vellune", name: "Vestido Longo Festa", category: "Vestidos", price: 1290, oldPrice: 1490, sizes: ["P", "M", "G"], colors: ["Marsala", "Petróleo"], stock: 3, featured: true, desc: "Vestido longo de festa com fenda e decote drapeado." },
    { brand: "La Vellune", name: "Mule Salto Bloco", category: "Calçados", price: 429, oldPrice: null, sizes: ["35", "36", "37", "38", "39"], colors: ["Caramelo", "Preto"], stock: 7, featured: false, desc: "Mule de salto bloco confortável, couro macio." },
  ];

  var DEFAULT_SETTINGS = {
    storeName: "La Vellune",
    tagline: "Moda autoral feita para durar",
    whatsapp: "5543000000000",          /* << troque pelo WhatsApp real */
    instagram: "https://instagram.com/lavellune",
    email: "contato@lavellune.com.br",
    phone: "(43) 0000-0000",
    address: "Rua Exemplo, 000 — Centro, Cidade/UF",
    footerNote: "CNPJ 00.000.000/0001-00 · Todos os direitos reservados",
    freeShippingFrom: 499,
    /* Logo da loja (URL ou dataURL). Vazio = usa o monograma com o nome. */
    logo: "",
  };

  /* ---- Listas de tamanho: uma lista é reutilizada por várias categorias ---- */
  var SEED_SIZELISTS = [
    { id: "sl-roupas", name: "Roupas", sizes: ["PP", "P", "M", "G", "GG"] },
    { id: "sl-calcados", name: "Calçados", sizes: ["34", "35", "36", "37", "38", "39", "40"] },
    { id: "sl-unico", name: "Peça única", sizes: ["Único"] },
  ];

  /* ---- Categorias: cada uma aponta para uma lista de tamanho ---- */
  var SEED_CATEGORIES = [
    { id: "cat-vestidos", name: "Vestidos", sizeListId: "sl-roupas" },
    { id: "cat-blusas", name: "Blusas", sizeListId: "sl-roupas" },
    { id: "cat-blazers", name: "Blazers", sizeListId: "sl-roupas" },
    { id: "cat-calcas", name: "Calças", sizeListId: "sl-roupas" },
    { id: "cat-conjuntos", name: "Conjuntos", sizeListId: "sl-roupas" },
    { id: "cat-calcados", name: "Calçados", sizeListId: "sl-calcados" },
    { id: "cat-bolsas", name: "Bolsas", sizeListId: "sl-unico" },
    { id: "cat-acessorios", name: "Acessórios", sizeListId: "sl-unico" },
  ];

  /* ---- Lançamentos financeiros de exemplo (receitas e despesas) ---- */
  var SEED_FINANCE = [
    { id: "fin-1", type: "receita", description: "Venda — Vestido Midi Seda", amount: 689.9, date: "2026-10-01" },
    { id: "fin-2", type: "receita", description: "Venda — Scarpin Couro", amount: 549.9, date: "2026-10-02" },
    { id: "fin-3", type: "despesa", description: "Fornecedor — tecidos", amount: 1200, date: "2026-10-02" },
    { id: "fin-4", type: "receita", description: "Venda — Bolsa Estruturada", amount: 899, date: "2026-10-03" },
    { id: "fin-5", type: "despesa", description: "Anúncios — Meta Ads", amount: 350, date: "2026-10-04" },
    { id: "fin-6", type: "receita", description: "Venda — Conjunto Tricô", amount: 619, date: "2026-10-05" },
    { id: "fin-7", type: "despesa", description: "Embalagens e etiquetas", amount: 180, date: "2026-10-05" },
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
        return Object.assign({ id: uid(), createdAt: now - i * 1000, image: "" }, p);
      });
      write(PRODUCTS_KEY, seeded);
    }
    if (!read(SETTINGS_KEY, null)) write(SETTINGS_KEY, DEFAULT_SETTINGS);
    if (!read(SIZELISTS_KEY, null)) write(SIZELISTS_KEY, SEED_SIZELISTS);
    if (!read(CATEGORIES_KEY, null)) write(CATEGORIES_KEY, SEED_CATEGORIES);
    if (!read(FINANCE_KEY, null)) write(FINANCE_KEY, SEED_FINANCE);
  }

  /* ---------- logo da marca / placeholder (SVG, funciona offline) ----------
     Quando o produto NÃO tem foto, a vitrine mostra a logo da loja. Se a
     loja também não tiver logo cadastrada, cai neste monograma elegante
     gerado a partir do NOME da loja (não das iniciais do produto). */
  function xmlEsc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function brandMonogram() {
    var name = (getSettings().storeName || "La Vellune").trim();
    var initials = name.split(/\s+/).slice(0, 2).map(function (w) { return w[0]; }).join("").toUpperCase();
    var svg =
      "<svg xmlns='http://www.w3.org/2000/svg' width='600' height='760'>" +
      "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>" +
      "<stop offset='0' stop-color='#1b1b20'/><stop offset='1' stop-color='#2b2620'/>" +
      "</linearGradient></defs>" +
      "<rect width='600' height='760' fill='url(#g)'/>" +
      "<rect x='20' y='20' width='560' height='720' fill='none' stroke='#c8a261' stroke-opacity='0.35'/>" +
      "<text x='300' y='360' font-family='Georgia,serif' font-size='120' fill='#c8a261' " +
      "text-anchor='middle' opacity='0.85'>" + xmlEsc(initials) + "</text>" +
      "<text x='300' y='430' font-family='Georgia,serif' font-size='26' fill='#f5f3ef' " +
      "letter-spacing='6' text-anchor='middle' opacity='0.75'>" + xmlEsc(name.toUpperCase()) + "</text>" +
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
