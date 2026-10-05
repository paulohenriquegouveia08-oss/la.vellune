/* ============================================================
   LA VELLUNE — LÓGICA DA VITRINE
   Usa a API global LV (data.js). Toda a funcionalidade da loja
   (busca, filtros, categorias, carrinho, checkout) vive aqui.
   ============================================================ */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var CART_KEY = "lavellune_cart_v1";

  var state = { category: "all", search: "", priceMin: "", priceMax: "", size: "all", sort: "new", inStock: false };
  var modalProduct = null, modalSize = null, modalColor = null;

  /* ---------- carrinho ---------- */
  function getCart() { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; } }
  function setCart(c) { try { localStorage.setItem(CART_KEY, JSON.stringify(c)); } catch (e) {} renderCartCount(); }
  function cartKey(id, size, color) { return id + "|" + (size || "") + "|" + (color || ""); }
  function addToCart(product, size, color, qty) {
    var cart = getCart(), key = cartKey(product.id, size, color);
    var line = cart.filter(function (l) { return l.key === key; })[0];
    if (line) line.qty += (qty || 1);
    else cart.push({ key: key, id: product.id, name: product.name, brand: product.brand, price: product.price, image: LV.imageOf(product), size: size, color: color, qty: qty || 1 });
    setCart(cart); toast("Adicionado à sacola");
  }
  function cartTotal() { return getCart().reduce(function (s, l) { return s + l.price * l.qty; }, 0); }
  function cartQty() { return getCart().reduce(function (s, l) { return s + l.qty; }, 0); }

  /* ---------- toast ---------- */
  var toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "toast"; document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(function () { toastEl.classList.remove("show"); }, 1800);
  }

  /* ---------- configurações (logo, rodapé, WhatsApp) ---------- */
  function applySettings() {
    var s = LV.getSettings();
    $$("[data-store-name]").forEach(function (el) { el.innerHTML = s.storeName.replace(/\s+(\S+)$/, " <b>$1</b>"); });
    $$("[data-tagline]").forEach(function (el) { el.textContent = s.tagline; });
    $$("[data-email]").forEach(function (el) { el.textContent = s.email; el.href = "mailto:" + s.email; });
    $$("[data-phone]").forEach(function (el) { el.textContent = s.phone; });
    $$("[data-address]").forEach(function (el) { el.textContent = s.address; });
    $$("[data-instagram]").forEach(function (el) { el.href = s.instagram; });
    $$("[data-footer-note]").forEach(function (el) { el.textContent = s.footerNote; });
    var ship = $("[data-shipping]");
    if (ship) ship.textContent = "Frete grátis acima de " + LV.formatPrice(s.freeShippingFrom) + " · Troca garantida em 30 dias";
    document.title = s.storeName + " — " + s.tagline;
  }

  /* ---------- filtros ---------- */
  function renderFilters() {
    var cats = LV.getCategories();
    var catRow = $("#f-categories");
    catRow.innerHTML =
      '<button class="chip' + (state.category === "all" ? " active" : "") + '" data-cat="all">Tudo</button>' +
      cats.map(function (c) {
        return '<button class="chip' + (state.category === c.name ? " active" : "") + '" data-cat="' + esc(c.name) + '">' + esc(c.name) + " <span class='muted'>(" + c.count + ")</span></button>";
      }).join("");
    $$("#f-categories .chip").forEach(function (b) {
      b.onclick = function () { state.category = b.dataset.cat; render(); };
    });

    var sizes = LV.allSizes();
    var sizeRow = $("#f-sizes");
    sizeRow.innerHTML =
      '<button class="chip' + (state.size === "all" ? " active" : "") + '" data-size="all">Todos</button>' +
      sizes.map(function (s) {
        return '<button class="chip' + (state.size === s ? " active" : "") + '" data-size="' + esc(s) + '">' + esc(s) + "</button>";
      }).join("");
    $$("#f-sizes .chip").forEach(function (b) {
      b.onclick = function () { state.size = b.dataset.size; render(); };
    });
  }

  /* ---------- grid ---------- */
  function render() {
    renderFilters();
    var list = LV.queryProducts(state);
    var grid = $("#grid");
    $("#result-count").textContent = list.length + (list.length === 1 ? " peça" : " peças");

    if (!list.length) {
      grid.innerHTML = '<div class="empty"><h3>Nada encontrado</h3><p>Tente limpar os filtros ou buscar outro termo.</p></div>';
      return;
    }
    grid.innerHTML = list.map(cardHTML).join("");
    $$(".card").forEach(function (c) {
      c.querySelector(".card-media").onclick = function () { openModal(c.dataset.id); };
      c.querySelector(".card-name").onclick = function () { openModal(c.dataset.id); };
      var add = c.querySelector(".card-add");
      if (add) add.onclick = function (e) { e.stopPropagation(); quickAdd(c.dataset.id); };
    });
  }

  function cardHTML(p) {
    var out = p.stock <= 0;
    var tags = "";
    if (out) tags += '<span class="badge badge-danger">Esgotado</span>';
    else if (p.stock <= 3) tags += '<span class="badge badge-muted">Últimas ' + p.stock + "</span>";
    if (p.oldPrice && p.oldPrice > p.price) tags += '<span class="badge badge-accent">Oferta</span>';
    if (p.featured) tags += '<span class="badge badge-accent">Destaque</span>';
    return (
      '<article class="card reveal" data-id="' + p.id + '">' +
        '<div class="card-media"><img src="' + LV.imageOf(p) + '" alt="' + esc(p.name) + '" loading="lazy">' +
          '<div class="card-tags">' + tags + "</div></div>" +
        '<div class="card-body">' +
          '<span class="card-brand">' + esc(p.brand) + "</span>" +
          '<h3 class="card-name">' + esc(p.name) + "</h3>" +
          '<div class="card-foot">' +
            '<span class="price">' + LV.formatPrice(p.price) +
              (p.oldPrice && p.oldPrice > p.price ? '<span class="price-old">' + LV.formatPrice(p.oldPrice) + "</span>" : "") +
            "</span>" +
            (out ? '<button class="card-add" disabled>Esgotado</button>' : '<button class="card-add">Comprar</button>') +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function quickAdd(id) {
    var p = LV.getProduct(id); if (!p || p.stock <= 0) return;
    addToCart(p, (p.sizes || [])[0] || null, (p.colors || [])[0] || null, 1);
  }

  /* ---------- modal ---------- */
  function openModal(id) {
    var p = LV.getProduct(id); if (!p) return;
    modalProduct = p; modalSize = (p.sizes || [])[0] || null; modalColor = (p.colors || [])[0] || null;
    var out = p.stock <= 0;
    var el = document.createElement("div");
    el.className = "modal-backdrop"; el.id = "modal";
    el.innerHTML =
      '<div class="modal" style="position:relative">' +
        '<button class="modal-close" aria-label="Fechar">&times;</button>' +
        '<div class="modal-media"><img src="' + LV.imageOf(p) + '" alt="' + esc(p.name) + '"></div>' +
        '<div class="modal-body">' +
          '<span class="card-brand">' + esc(p.brand) + "</span>" +
          "<h2>" + esc(p.name) + "</h2>" +
          '<div><span class="price" style="font-size:1.4rem">' + LV.formatPrice(p.price) + "</span>" +
            (p.oldPrice && p.oldPrice > p.price ? '<span class="price-old">' + LV.formatPrice(p.oldPrice) + "</span>" : "") + "</div>" +
          '<p class="muted">' + esc(p.desc || "") + "</p>" +
          (p.sizes && p.sizes.length ? '<div class="field"><span>Tamanho</span><div class="option-row" id="m-sizes"></div></div>' : "") +
          (p.colors && p.colors.length ? '<div class="field"><span>Cor</span><div class="option-row" id="m-colors"></div></div>' : "") +
          '<div style="margin-top:auto;padding-top:16px">' +
            (out
              ? '<button class="btn btn-outline btn-block" disabled>Esgotado</button>'
              : '<button class="btn btn-primary btn-block" id="m-add">Adicionar à sacola</button>') +
          "</div>" +
        "</div>" +
      "</div>";
    document.body.appendChild(el);
    document.body.style.overflow = "hidden";

    function opts(containerId, values, kind) {
      var c = $("#" + containerId, el); if (!c) return;
      c.innerHTML = values.map(function (v) {
        var active = (kind === "size" ? modalSize : modalColor) === v;
        return '<button class="option' + (active ? " active" : "") + '" data-v="' + esc(v) + '">' + esc(v) + "</button>";
      }).join("");
      $$(".option", c).forEach(function (b) {
        b.onclick = function () {
          if (kind === "size") modalSize = b.dataset.v; else modalColor = b.dataset.v;
          $$(".option", c).forEach(function (x) { x.classList.remove("active"); });
          b.classList.add("active");
        };
      });
    }
    if (p.sizes && p.sizes.length) opts("m-sizes", p.sizes, "size");
    if (p.colors && p.colors.length) opts("m-colors", p.colors, "color");

    var closeModal = function () { el.remove(); document.body.style.overflow = ""; };
    $(".modal-close", el).onclick = closeModal;
    el.onclick = function (e) { if (e.target === el) closeModal(); };
    var add = $("#m-add", el);
    if (add) add.onclick = function () { addToCart(p, modalSize, modalColor, 1); closeModal(); openCart(); };
  }

  /* ---------- carrinho (drawer) ---------- */
  function openCart() {
    var cart = getCart();
    var back = document.createElement("div"); back.className = "drawer-backdrop"; back.id = "cart-back";
    var dr = document.createElement("aside"); dr.className = "drawer";
    dr.innerHTML =
      '<div class="drawer-head"><h3>Sua sacola</h3><button class="modal-close" style="position:static" aria-label="Fechar">&times;</button></div>' +
      '<div class="drawer-items" id="cart-items"></div>' +
      '<div class="drawer-foot">' +
        '<div class="drawer-total"><span>Total</span><strong class="price" id="cart-total"></strong></div>' +
        '<button class="btn btn-primary btn-block" id="cart-checkout">Finalizar pelo WhatsApp</button>' +
        '<p class="muted" style="text-align:center;font-size:var(--fs-xs)">Você será levado ao WhatsApp da loja com o pedido pronto.</p>' +
      "</div>";
    document.body.appendChild(back); document.body.appendChild(dr);
    document.body.style.overflow = "hidden";
    var close = function () { back.remove(); dr.remove(); document.body.style.overflow = ""; };
    back.onclick = close;
    $(".modal-close", dr).onclick = close;

    function paint() {
      var c = getCart(), box = $("#cart-items", dr);
      if (!c.length) { box.innerHTML = '<p class="muted" style="text-align:center;padding:40px 0">Sua sacola está vazia.</p>'; }
      else {
        box.innerHTML = c.map(function (l) {
          return (
            '<div class="cart-item" data-key="' + l.key + '">' +
              '<img src="' + l.image + '" alt="">' +
              "<div><div class='ci-name'>" + esc(l.name) + "</div>" +
                "<div class='ci-meta'>" + [l.size, l.color].filter(Boolean).map(esc).join(" · ") + "</div>" +
                "<div class='price' style='font-size:.95rem;margin-top:4px'>" + LV.formatPrice(l.price) + "</div>" +
                '<button class="link-remove" data-remove="' + l.key + '">remover</button></div>' +
              '<div class="qty"><button data-dec="' + l.key + '">−</button><span>' + l.qty + "</span><button data-inc='" + l.key + "'>+</button></div>" +
            "</div>"
          );
        }).join("");
      }
      $("#cart-total", dr).textContent = LV.formatPrice(cartTotal());
      $$("[data-inc]", dr).forEach(function (b) { b.onclick = function () { chgQty(b.dataset.inc, 1); }; });
      $$("[data-dec]", dr).forEach(function (b) { b.onclick = function () { chgQty(b.dataset.dec, -1); }; });
      $$("[data-remove]", dr).forEach(function (b) { b.onclick = function () { removeLine(b.dataset.remove); }; });
    }
    function chgQty(key, d) {
      var c = getCart().map(function (l) { return l.key === key ? Object.assign({}, l, { qty: l.qty + d }) : l; })
        .filter(function (l) { return l.qty > 0; });
      setCart(c); paint();
    }
    function removeLine(key) { setCart(getCart().filter(function (l) { return l.key !== key; })); paint(); }

    $("#cart-checkout", dr).onclick = function () {
      var c = getCart(); if (!c.length) { toast("Sua sacola está vazia"); return; }
      var s = LV.getSettings();
      var lines = c.map(function (l) {
        return "• " + l.name + (l.size || l.color ? " (" + [l.size, l.color].filter(Boolean).join(", ") + ")" : "") +
          " x" + l.qty + " — " + LV.formatPrice(l.price * l.qty);
      });
      var msg = "Olá, " + s.storeName + "! Quero finalizar meu pedido:\n\n" + lines.join("\n") +
        "\n\nTotal: " + LV.formatPrice(cartTotal());
      window.open("https://wa.me/" + s.whatsapp.replace(/\D/g, "") + "?text=" + encodeURIComponent(msg), "_blank");
    };
    paint();
  }

  function renderCartCount() {
    var n = cartQty(); var el = $("#cart-count");
    if (el) { el.textContent = n; el.style.display = n ? "grid" : "none"; }
  }

  /* ---------- busca (com debounce) ---------- */
  function wireSearch() {
    var input = $("#search");
    var t;
    input.addEventListener("input", function () {
      clearTimeout(t);
      t = setTimeout(function () { state.search = input.value; render(); }, 180);
    });
  }

  function wireControls() {
    $("#f-pmin").addEventListener("input", function () { state.priceMin = this.value; debounceRender(); });
    $("#f-pmax").addEventListener("input", function () { state.priceMax = this.value; debounceRender(); });
    $("#f-instock").addEventListener("change", function () { state.inStock = this.checked; render(); });
    $("#sort").addEventListener("change", function () { state.sort = this.value; render(); });
    $("#f-clear").addEventListener("click", function () {
      state = { category: "all", search: "", priceMin: "", priceMax: "", size: "all", sort: "new", inStock: false };
      $("#search").value = ""; $("#f-pmin").value = ""; $("#f-pmax").value = "";
      $("#f-instock").checked = false; $("#sort").value = "new"; render();
    });
    $("#cart-open").addEventListener("click", openCart);
    $("#hero-cta").addEventListener("click", function () {
      document.getElementById("catalogo").scrollIntoView({ behavior: "smooth" });
    });
  }
  var drT;
  function debounceRender() { clearTimeout(drT); drT = setTimeout(render, 220); }

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* ---------- init ---------- */
  function init() {
    applySettings();
    wireSearch(); wireControls();
    render(); renderCartCount();
    window.addEventListener("lavellune:change", function () { applySettings(); render(); });
  }
  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
