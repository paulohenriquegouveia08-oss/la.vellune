/* ============================================================
   LA VELLUNE — LÓGICA DA VITRINE (QUIET LUXURY)
   Usa a API global LV (data.js). Gerencia busca, filtros,
   renderização dos cards estilo NT Eleganz, carrinho (drawer)
   e o modal de produto interativo completo estilo FB Elegance.
   ============================================================ */
(function () {
  "use strict";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var CART_KEY = "lavellune_cart_v2";
  var WISHLIST_KEY = "lavellune_wishlist_v2";

  var state = { category: "all", search: "", priceMin: "", priceMax: "", size: "all", sort: "new", inStock: false, onlyWishlist: false };
  var modalProduct = null, modalSize = null, modalColor = null, modalQty = 1, modalActiveImgIdx = 0;

  /* ---------- Lista de Favoritos (Wishlist Louis Vuitton) ---------- */
  function getWishlist() {
    try { return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || []; } catch (e) { return []; }
  }
  function setWishlist(w) {
    try { localStorage.setItem(WISHLIST_KEY, JSON.stringify(w)); } catch (e) {}
    renderWishlistCount();
  }
  function isWishlisted(id) {
    return getWishlist().indexOf(id) !== -1;
  }
  function toggleWishlist(id) {
    var w = getWishlist();
    var idx = w.indexOf(id);
    var p = LV.getProduct(id);
    var name = p ? p.name : "Peça";
    if (idx !== -1) {
      w.splice(idx, 1);
      setWishlist(w);
      toast("Removido dos favoritos");
    } else {
      w.push(id);
      setWishlist(w);
      toast("♥ " + name + " adicionado aos favoritos");
    }
    render();
  }
  function renderWishlistCount() {
    var count = getWishlist().length;
    var badge = $("#wishlist-count");
    var btn = $("#header-wishlist-btn");
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? "grid" : "none";
    }
    if (btn) {
      if (count > 0) btn.classList.add("has-items");
      else btn.classList.remove("has-items");
    }
  }

  /* ---------- Carrinho (Sacola de compras) ---------- */
  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; }
  }
  function setCart(c) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(c)); } catch (e) {}
    renderCartCount();
  }
  function cartKey(id, size, color) {
    return id + "|" + (size || "") + "|" + (color || "");
  }
  function addToCart(product, size, color, qty) {
    var cart = getCart(), key = cartKey(product.id, size, color);
    var line = cart.filter(function (l) { return l.key === key; })[0];
    if (line) line.qty += (qty || 1);
    else cart.push({
      key: key,
      id: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      image: LV.imageOf(product),
      size: size,
      color: color,
      qty: qty || 1
    });
    setCart(cart);
    toast("✓ " + product.name + " adicionado à sacola");
  }
  function cartTotal() {
    return getCart().reduce(function (s, l) { return s + l.price * l.qty; }, 0);
  }
  function cartQty() {
    return getCart().reduce(function (s, l) { return s + l.qty; }, 0);
  }

  /* ---------- Toast de Notificação ---------- */
  var toastEl;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = msg;
    toastEl.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toastEl.classList.remove("show"); }, 2400);
  }

  /* ---------- Configurações e Textos da Loja ---------- */
  function applySettings() {
    var s = LV.getSettings();
    $$("[data-store-name]").forEach(function (el) {
      if (el.tagName === 'A' && el.querySelector('img')) return;
      el.innerHTML = s.storeName.replace(/\s+(\S+)$/, " <b>$1</b>");
    });
    $$("[data-tagline]").forEach(function (el) { el.textContent = s.tagline; });
    $$("[data-email]").forEach(function (el) { el.textContent = s.email; el.href = "mailto:" + s.email; });
    $$("[data-phone]").forEach(function (el) { el.textContent = s.phone; });
    $$("[data-address]").forEach(function (el) { el.textContent = s.address; });
    $$("[data-instagram]").forEach(function (el) { el.href = s.instagram; });
    $$("[data-footer-note]").forEach(function (el) { el.textContent = s.footerNote; });

    // WhatsApp links
    var cleanWpp = (s.whatsapp || "5579996179533").replace(/\D/g, "");
    var wppHeader = $("#header-wpp-btn");
    if (wppHeader) wppHeader.href = "https://wa.me/" + cleanWpp + "?text=" + encodeURIComponent("Olá La Vellune! Gostaria de um atendimento personalizado.");
    var wppHero = $("#hero-wpp-cta");
    if (wppHero) wppHero.href = "https://wa.me/" + cleanWpp + "?text=" + encodeURIComponent("Olá La Vellune! Gostaria de conhecer os destaques da coleção.");
    var wppFloat = $("#floating-wpp");
    if (wppFloat) wppFloat.href = "https://wa.me/" + cleanWpp + "?text=" + encodeURIComponent("Olá! Gostaria de tirar dúvidas sobre os produtos da La Vellune.");
    var wppFooter = $("#footer-wpp-link");
    if (wppFooter) {
      wppFooter.href = "https://wa.me/" + cleanWpp;
      wppFooter.innerHTML = '<i class="fab fa-whatsapp"></i> ' + (s.phone || "(79) 99617-9533");
    }

    document.title = s.storeName + " — Elegance in every detail | Moda Atemporal";
  }

  /* ---------- Filtros de Categorias e Tamanhos (Subnav + Drawer) ---------- */
  function renderFilters() {
    var cats = LV.getCategories();

    // 1. Subnav Horizontal (Estilo Louis Vuitton)
    var subnavTrack = $("#lv-subnav-track");
    if (subnavTrack) {
      subnavTrack.innerHTML =
        '<button type="button" class="lv-subnav-tab' + (state.category === "all" && !state.onlyWishlist ? " active" : "") + '" data-cat="all">Ver Tudo</button>' +
        cats.map(function (c) {
          return '<button type="button" class="lv-subnav-tab' + (state.category === c.name && !state.onlyWishlist ? " active" : "") + '" data-cat="' + esc(c.name) + '">' +
            esc(c.name) + '</button>';
        }).join("");

      $$(".lv-subnav-tab", subnavTrack).forEach(function (b) {
        b.onclick = function () {
          state.category = b.dataset.cat;
          state.onlyWishlist = false;
          render();
        };
      });
    }

    // 2. Chips no Drawer de Filtros
    var drawerCats = $("#drawer-categories");
    if (drawerCats) {
      drawerCats.innerHTML =
        '<button type="button" class="chip' + (state.category === "all" ? " active" : "") + '" data-cat="all">Todas</button>' +
        cats.map(function (c) {
          return '<button type="button" class="chip' + (state.category === c.name ? " active" : "") + '" data-cat="' + esc(c.name) + '">' +
            esc(c.name) + ' <span class="muted" style="font-size:10px">(' + c.count + ')</span></button>';
        }).join("");
      $$(".chip", drawerCats).forEach(function (b) {
        b.onclick = function () { state.category = b.dataset.cat; render(); };
      });
    }

    // 3. Tamanhos no Drawer de Filtros
    var sizes = LV.allSizes();
    var drawerSizes = $("#drawer-sizes");
    if (drawerSizes) {
      drawerSizes.innerHTML =
        '<button type="button" class="chip' + (state.size === "all" ? " active" : "") + '" data-size="all">Todos</button>' +
        sizes.map(function (s) {
          return '<button type="button" class="chip' + (state.size === s ? " active" : "") + '" data-size="' + esc(s) + '">' + esc(s) + '</button>';
        }).join("");
      $$(".chip", drawerSizes).forEach(function (b) {
        b.onclick = function () { state.size = b.dataset.size; render(); };
      });
    }

    // Atualiza o Título do Cabeçalho da Coleção
    var catTitle = $("#catalog-category-title");
    if (catTitle) {
      if (state.onlyWishlist) catTitle.textContent = "Meus Favoritos";
      else if (state.category === "all") catTitle.textContent = "Ready-to-Wear";
      else catTitle.textContent = state.category;
    }
  }

  /* ---------- Renderização do Catálogo (Grade 4 Colunas Louis Vuitton) ---------- */
  function render() {
    renderFilters();
    var list = LV.queryProducts(state);

    if (state.onlyWishlist) {
      var favs = getWishlist();
      list = list.filter(function (p) { return favs.indexOf(p.id) !== -1; });
    }

    var grid = $("#grid");
    var resCount = $("#result-count");
    if (resCount) {
      resCount.textContent = list.length + (list.length === 1 ? " peça disponível" : " peças selecionadas");
    }

    if (!list.length) {
      grid.innerHTML =
        '<div class="empty" style="grid-column:1/-1;text-align:center;padding:70px 20px;">' +
        '<div style="font-size:42px;color:var(--text);margin-bottom:12px;">✦</div>' +
        '<h3 style="font-family:var(--font-display);font-size:1.6rem;font-weight:400;margin-bottom:8px;">Nenhuma peça encontrada</h3>' +
        '<p class="muted" style="max-width:400px;margin:0 auto 20px;">' + (state.onlyWishlist ? "Você ainda não favoritou nenhuma peça. Clique no ícone de coração nos produtos para salvar aqui." : "Tente ajustar os filtros ou buscar por outros termos.") + '</p>' +
        '<button class="btn btn-outline btn-sm" id="empty-clear-btn" style="border-radius:var(--radius-pill);">Ver coleção completa</button>' +
        '</div>';
      var empClear = $("#empty-clear-btn");
      if (empClear) {
        empClear.onclick = function () {
          state.category = "all";
          state.onlyWishlist = false;
          render();
        };
      }
      return;
    }

    grid.innerHTML = list.map(cardHTML).join("");

    // O CARD INTEIRO É CLICÁVEL (ABRE MODAL EM TELA ÚNICA)
    $$(".card", grid).forEach(function (card) {
      card.onclick = function (e) {
        // Se clicar no botão de favoritar, não abre o modal
        if (e.target.closest(".card-wishlist-btn")) return;
        openProductModal(card.dataset.id);
      };
    });

    // Wire: Botões de Favoritos nos Cards
    $$(".card-wishlist-btn", grid).forEach(function (btn) {
      btn.onclick = function (e) {
        e.stopPropagation();
        toggleWishlist(btn.dataset.id);
      };
    });
  }

  function cardHTML(p) {
    var out = p.stock <= 0;
    var isFav = isWishlisted(p.id);
    var tags = "";
    if (out) tags += '<span class="badge badge-danger">ESGOTADO</span>';
    else if (p.stock <= 2) tags += '<span class="badge badge-muted">ÚLTIMAS ' + p.stock + '</span>';
    else if (p.badge) tags += '<span class="badge badge-accent">' + esc(p.badge) + '</span>';
    else if (p.featured) tags += '<span class="badge badge-accent">DESTAQUE</span>';

    // Parcelamento em até 6x
    var installments = "ou 6x de " + LV.formatPrice(p.price / 6) + " sem juros";

    return (
      '<article class="card lv-card reveal ' + (out ? "is-out-of-stock" : "") + '" data-id="' + p.id + '">' +
        '<div class="card-media lv-card-media">' +
          '<button type="button" class="card-wishlist-btn ' + (isFav ? "active" : "") + '" data-id="' + p.id + '" aria-label="Favoritar peça">' +
            '<i class="' + (isFav ? "fas fa-heart" : "far fa-heart") + '"></i>' +
          '</button>' +
          (tags ? '<div class="card-tags">' + tags + '</div>' : '') +
          '<img src="' + LV.imageOf(p) + '" alt="' + esc(p.name) + '" loading="lazy">' +
          '<div class="card-hover-overlay">' +
            '<button type="button" class="card-quick-view-btn">' +
              (out ? "Ver Detalhes" : "Ver Peça") +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div class="card-body lv-card-body">' +
          '<h3 class="card-name lv-card-name">' + esc(p.name) + '</h3>' +
          '<div class="card-foot">' +
            '<div class="price-row-card">' +
              '<span class="price lv-card-price">' + LV.formatPrice(p.price) + '</span>' +
              (p.oldPrice && p.oldPrice > p.price ? '<span class="price-old lv-card-price-old">' + LV.formatPrice(p.oldPrice) + '</span>' : '') +
            '</div>' +
            '<span class="price-installments lv-card-installments">' + installments + '</span>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }

  /* ============================================================
     MODAL DE PRODUTO INTERATIVO (ESTILO FB ELEGANCE)
     Abre sobreposto na mesma tela com foto grande, descrição,
     seletor de tamanho/cor, quantidade e botão de compra.
     ============================================================ */
  function openProductModal(id) {
    var p = LV.getProduct(id);
    if (!p) return;

    modalProduct = p;
    modalSize = (p.sizes && p.sizes.length) ? p.sizes[0] : null;
    modalColor = (p.colors && p.colors.length) ? p.colors[0] : null;
    modalQty = 1;
    modalActiveImgIdx = 0;

    var out = p.stock <= 0;
    var allImages = (p.images && p.images.length) ? p.images : [LV.imageOf(p)];
    if (!allImages.length) allImages = [LV.imageOf(p)];

    // Atualiza histórico / URL para compartilhar (ex: ?p=id) sem recarregar
    try {
      var newUrl = window.location.pathname + "?p=" + encodeURIComponent(p.id);
      window.history.replaceState({ modalId: p.id }, "", newUrl);
    } catch (e) {}

    // Remove qualquer modal existente
    var old = $("#product-modal-root");
    if (old) old.remove();

    var backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.id = "product-modal-root";

    // Cálculo parcelamento e desconto Pix
    var installmentText = "em até 6x de " + LV.formatPrice(p.price / 6) + " sem juros no cartão";
    var pixPrice = LV.formatPrice(p.price * 0.95);

    // Badges da galeria
    var galleryBadge = "";
    if (out) galleryBadge = '<span class="badge badge-danger">ESGOTADO</span>';
    else if (p.badge) galleryBadge = '<span class="badge badge-accent">' + esc(p.badge) + '</span>';

    backdrop.innerHTML =
      '<div class="modal-card" role="dialog" aria-modal="true" aria-label="' + esc(p.name) + '">' +
        '<button class="modal-close-btn" id="modal-close-trigger" aria-label="Fechar janela">&times;</button>' +

        '<!-- Galeria Esquerda Compacta -->' +
        '<div class="modal-gallery">' +
          '<div class="modal-main-img-wrap">' +
            (galleryBadge ? '<div class="modal-gallery-badge">' + galleryBadge + '</div>' : '') +
            '<img id="m-main-image" class="modal-main-img" src="' + allImages[0] + '" alt="' + esc(p.name) + '" style="' + (out ? "filter:grayscale(100%);opacity:0.65;" : "") + '">' +
          '</div>' +
          (allImages.length > 1 ?
            '<div class="modal-thumbs-row" id="m-thumbs">' +
              allImages.map(function (img, idx) {
                return '<img src="' + img + '" class="modal-thumb ' + (idx === 0 ? "active" : "") + '" data-idx="' + idx + '" alt="' + esc(p.name) + ' miniatura">';
              }).join("") +
            '</div>'
          : '') +
        '</div>' +

        '<!-- Detalhes Direita Compactos (Zero Rolagem) -->' +
        '<div class="modal-info">' +
          '<div class="modal-header-block">' +
            '<span class="modal-kicker">' + esc(p.brand || "La Vellune") + ' · ' + esc(p.category || "Atemporal") + '</span>' +
            '<h2 class="modal-title">' + esc(p.name) + '</h2>' +
          '</div>' +

          '<div class="modal-pricing-compact">' +
            '<div class="modal-price-main">' +
              '<span class="price">' + LV.formatPrice(p.price) + '</span>' +
              (p.oldPrice && p.oldPrice > p.price ? '<span class="price-old">' + LV.formatPrice(p.oldPrice) + '</span>' : '') +
            '</div>' +
            '<div class="modal-pricing-right">' +
              '<span class="modal-installment-text">' + installmentText + '</span>' +
              '<span class="modal-pix-badge"><i class="fas fa-bolt"></i> ' + pixPrice + ' no Pix (5% OFF)</span>' +
            '</div>' +
          '</div>' +

          '<div class="modal-stock-status ' + (out ? "out-stock" : "in-stock") + '">' +
            '<span class="stock-dot"></span>' +
            '<span>' + (out ? "Peça Esgotada no Momento" : (p.stock <= 2 ? "Últimas " + p.stock + " unidades em estoque" : "Disponível para envio imediato")) + '</span>' +
          '</div>' +

          '<div class="modal-desc-compact">' + esc(p.desc || "Peça confeccionada sob rigorosos padrões de alfaiataria e acabamento atemporal La Vellune.") + '</div>' +

          '<div class="modal-selectors-cluster">' +
            (p.sizes && p.sizes.length ?
              '<div class="modal-selector-group">' +
                '<span class="selector-label">Tamanho:</span>' +
                '<div class="modal-options-row" id="m-sizes-wrap">' +
                  p.sizes.map(function (s, i) {
                    return '<button type="button" class="modal-opt-btn ' + (i === 0 ? "active" : "") + '" data-val="' + esc(s) + '">' + esc(s) + '</button>';
                  }).join("") +
                '</div>' +
              '</div>'
            : '') +

            (p.colors && p.colors.length ?
              '<div class="modal-selector-group">' +
                '<span class="selector-label">Cor: <strong id="m-color-label" style="font-weight:700;color:var(--text);text-transform:none;">' + esc(p.colors[0]) + '</strong></span>' +
                '<div class="modal-options-row" id="m-colors-wrap">' +
                  p.colors.map(function (c, i) {
                    return '<button type="button" class="modal-opt-btn ' + (i === 0 ? "active" : "") + '" data-val="' + esc(c) + '">' + esc(c) + '</button>';
                  }).join("") +
                '</div>' +
              '</div>'
            : '') +
          '</div>' +

          '<div class="modal-actions-cluster">' +
            '<div class="modal-btn-row"' + (out ? ' style="grid-template-columns:1fr;"' : '') + '>' +
              (out ?
                '<button type="button" class="btn btn-outline btn-block" disabled style="opacity:0.6;cursor:not-allowed;">' +
                  '<i class="fas fa-ban"></i> PRODUTO ESGOTADO' +
                '</button>'
              :
                '<div class="modal-stepper">' +
                  '<button type="button" id="m-qty-dec">−</button>' +
                  '<span id="m-qty-val">1</span>' +
                  '<button type="button" id="m-qty-inc">+</button>' +
                '</div>' +
                '<button type="button" class="btn-modal-add" id="m-btn-add">' +
                  '<i class="fas fa-shopping-bag"></i> Adicionar à Sacola' +
                '</button>'
              ) +
            '</div>' +
            '<a href="#" target="_blank" rel="noopener" class="btn-modal-wpp" id="m-btn-wpp">' +
              '<i class="fab fa-whatsapp"></i> ' + (out ? "Consultar Reposição via WhatsApp" : "Pedir pelo WhatsApp") +
            '</a>' +
            '<div class="modal-footer-compact">' +
              '<span><i class="fas fa-shield-alt"></i> Peça Original · Envio Seguro</span>' +
              '<button type="button" class="modal-share-link" id="m-btn-copy">' +
                '<i class="fas fa-link"></i> Copiar link da peça' +
              '</button>' +
            '</div>' +
          '</div>' +

        '</div>' +
      '</div>';

    document.body.appendChild(backdrop);
    document.body.style.overflow = "hidden";

    // Wire: Miniaturas da galeria
    if (allImages.length > 1) {
      $$(".modal-thumb", backdrop).forEach(function (thumb) {
        thumb.onclick = function () {
          var idx = parseInt(thumb.dataset.idx, 10);
          modalActiveImgIdx = idx;
          $("#m-main-image", backdrop).src = allImages[idx];
          $$(".modal-thumb", backdrop).forEach(function (t) { t.classList.remove("active"); });
          thumb.classList.add("active");
        };
      });
    }

    // Wire: Seleção de Tamanho
    $$("#m-sizes-wrap .modal-opt-btn", backdrop).forEach(function (btn) {
      btn.onclick = function () {
        modalSize = btn.dataset.val;
        $$("#m-sizes-wrap .modal-opt-btn", backdrop).forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        updateWppButton();
      };
    });

    // Wire: Seleção de Cor
    $$("#m-colors-wrap .modal-opt-btn", backdrop).forEach(function (btn) {
      btn.onclick = function () {
        modalColor = btn.dataset.val;
        $("#m-color-label", backdrop).textContent = modalColor;
        $$("#m-colors-wrap .modal-opt-btn", backdrop).forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        updateWppButton();
      };
    });

    // Wire: Stepper de Quantidade
    var qtyValEl = $("#m-qty-val", backdrop);
    var btnInc = $("#m-qty-inc", backdrop);
    var btnDec = $("#m-qty-dec", backdrop);
    if (btnInc && btnDec && qtyValEl) {
      btnInc.onclick = function () {
        if (modalQty < (p.stock || 99)) {
          modalQty++;
          qtyValEl.textContent = modalQty;
          updateWppButton();
        }
      };
      btnDec.onclick = function () {
        if (modalQty > 1) {
          modalQty--;
          qtyValEl.textContent = modalQty;
          updateWppButton();
        }
      };
    }

    // Wire: Botão do WhatsApp (atualiza texto com tamanho e cor)
    function updateWppButton() {
      var s = LV.getSettings();
      var cleanWpp = (s.whatsapp || "5579996179533").replace(/\D/g, "");
      var details = [];
      if (modalSize) details.push("Tamanho: " + modalSize);
      if (modalColor) details.push("Cor: " + modalColor);
      if (modalQty > 1) details.push("Quantidade: " + modalQty);

      var msg = "Olá, La Vellune! Tenho interesse na peça:\n\n" +
        "• *" + p.name + "*\n" +
        "• Valor: " + LV.formatPrice(p.price) + "\n" +
        (details.length ? "• " + details.join("\n• ") + "\n" : "") +
        "\nAinda está disponível para compra imediata?";

      var wppLink = $("#m-btn-wpp", backdrop);
      if (wppLink) {
        wppLink.href = "https://wa.me/" + cleanWpp + "?text=" + encodeURIComponent(msg);
      }
    }
    updateWppButton();

    // Wire: Adicionar à Sacola
    var btnAdd = $("#m-btn-add", backdrop);
    if (btnAdd) {
      btnAdd.onclick = function () {
        addToCart(p, modalSize, modalColor, modalQty);
        closeProductModal();
        openCartDrawer();
      };
    }

    // Wire: Copiar Link da Peça
    var btnCopy = $("#m-btn-copy", backdrop);
    if (btnCopy) {
      btnCopy.onclick = function () {
        var shareUrl = window.location.origin + window.location.pathname + "?p=" + encodeURIComponent(p.id);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(shareUrl).then(function () {
            toast("✓ Link copiado para a área de transferência!");
          });
        } else {
          prompt("Copie o link da peça abaixo:", shareUrl);
        }
      };
    }

    // Wire: Guia de medidas
    var guideBtn = $("#m-guide-btn", backdrop);
    if (guideBtn) {
      guideBtn.onclick = function () {
        toast("Dica: Nossas peças seguem a tabela padrão Custom Slim Fit. Na dúvida, nossa consultora no WhatsApp auxilia na escolha!");
      };
    }

    // Fechar modal
    var closeModal = function () { closeProductModal(); };
    $("#modal-close-trigger", backdrop).onclick = closeModal;
    backdrop.onclick = function (e) {
      if (e.target === backdrop) closeModal();
    };

    // Fechar com tecla ESC
    var escHandler = function (e) {
      if (e.key === "Escape") {
        closeModal();
        document.removeEventListener("keydown", escHandler);
      }
    };
    document.addEventListener("keydown", escHandler);
  }

  function closeProductModal() {
    var m = $("#product-modal-root");
    if (m) m.remove();
    document.body.style.overflow = "";
    // Limpa parâmetro da URL suavemente
    try {
      window.history.replaceState({}, "", window.location.pathname);
    } catch (e) {}
  }

  /* ---------- Sacola de Compras (Drawer) ---------- */
  function openCartDrawer() {
    var old = $("#cart-drawer-root");
    if (old) old.remove();

    var backdrop = document.createElement("div");
    backdrop.className = "drawer-backdrop";
    backdrop.id = "cart-drawer-root";

    var drawer = document.createElement("aside");
    drawer.className = "drawer";

    drawer.innerHTML =
      '<div class="drawer-head">' +
        '<h3>Sua Sacola</h3>' +
        '<button class="modal-close-btn" style="position:static" id="drawer-close-btn" aria-label="Fechar sacola">&times;</button>' +
      '</div>' +
      '<div class="drawer-items" id="cart-drawer-items"></div>' +
      '<div class="drawer-foot">' +
        '<div id="drawer-shipping-alert"></div>' +
        '<div class="drawer-total-row">' +
          '<span>Total do Pedido</span>' +
          '<strong id="cart-drawer-total">R$ 0,00</strong>' +
        '</div>' +
        '<button class="btn btn-primary btn-block" id="cart-btn-checkout" style="padding:15px;font-size:14px;letter-spacing:0.04em;">' +
          '<i class="fab fa-whatsapp"></i> Finalizar Pedido pelo WhatsApp' +
        '</button>' +
        '<p class="muted" style="text-align:center;font-size:11px;margin:0;">Atendimento exclusivo com atendente humana La Vellune.</p>' +
      '</div>';

    backdrop.appendChild(drawer);
    document.body.appendChild(backdrop);
    document.body.style.overflow = "hidden";

    var close = function () {
      backdrop.remove();
      document.body.style.overflow = "";
    };
    $("#drawer-close-btn", drawer).onclick = close;
    backdrop.onclick = function (e) { if (e.target === backdrop) close(); };

    function paintCart() {
      var cart = getCart();
      var box = $("#cart-drawer-items", drawer);
      var total = cartTotal();
      var s = LV.getSettings();

      if (!cart.length) {
        box.innerHTML =
          '<div style="text-align:center;padding:60px 20px;color:var(--muted);">' +
            '<i class="fas fa-shopping-bag" style="font-size:42px;color:var(--accent);margin-bottom:14px;display:block;"></i>' +
            '<p style="font-size:15px;color:var(--text);font-weight:600;margin-bottom:6px;">Sua sacola está vazia</p>' +
            '<p style="font-size:13px;">Descubra as peças atemporais em nosso catálogo.</p>' +
          '</div>';
        $("#cart-btn-checkout", drawer).disabled = true;
        $("#cart-btn-checkout", drawer).style.opacity = "0.5";
      } else {
        $("#cart-btn-checkout", drawer).disabled = false;
        $("#cart-btn-checkout", drawer).style.opacity = "1";
        box.innerHTML = cart.map(function (item) {
          return (
            '<div class="cart-item" data-key="' + item.key + '">' +
              '<img src="' + item.image + '" alt="' + esc(item.name) + '">' +
              '<div>' +
                '<div class="ci-name">' + esc(item.name) + '</div>' +
                '<div class="ci-meta">' + [item.size, item.color].filter(Boolean).map(esc).join(" · ") + '</div>' +
                '<div class="price" style="font-size:14px;margin-top:4px;">' + LV.formatPrice(item.price) + '</div>' +
                '<button type="button" class="link-remove" data-remove="' + item.key + '">remover</button>' +
              '</div>' +
              '<div class="qty">' +
                '<button type="button" data-dec="' + item.key + '">−</button>' +
                '<span>' + item.qty + '</span>' +
                '<button type="button" data-inc="' + item.key + '">+</button>' +
              '</div>' +
            '</div>'
          );
        }).join("");
      }

      $("#cart-drawer-total", drawer).textContent = LV.formatPrice(total);

      // Aviso de frete grátis
      var shipBox = $("#drawer-shipping-alert", drawer);
      var freeLimit = s.freeShippingFrom || 499;
      if (total >= freeLimit) {
        shipBox.innerHTML = '<div class="drawer-shipping-progress" style="background:rgba(21,128,61,0.1);color:#15803d;"><i class="fas fa-check-circle"></i> Parabéns! Você ganhou <strong>Frete Grátis</strong>.</div>';
      } else if (total > 0) {
        var diff = freeLimit - total;
        shipBox.innerHTML = '<div class="drawer-shipping-progress"><i class="fas fa-shipping-fast"></i> Falta apenas <strong>' + LV.formatPrice(diff) + '</strong> para você garantir <strong>Frete Grátis</strong>!</div>';
      } else {
        shipBox.innerHTML = '';
      }

      // Eventos dos botões do carrinho
      $$("[data-inc]", drawer).forEach(function (b) {
        b.onclick = function () { changeQty(b.dataset.inc, 1); };
      });
      $$("[data-dec]", drawer).forEach(function (b) {
        b.onclick = function () { changeQty(b.dataset.dec, -1); };
      });
      $$("[data-remove]", drawer).forEach(function (b) {
        b.onclick = function () { removeLine(b.dataset.remove); };
      });
    }

    function changeQty(key, delta) {
      var cart = getCart().map(function (item) {
        return item.key === key ? Object.assign({}, item, { qty: item.qty + delta }) : item;
      }).filter(function (item) { return item.qty > 0; });
      setCart(cart);
      paintCart();
    }

    function removeLine(key) {
      setCart(getCart().filter(function (item) { return item.key !== key; }));
      paintCart();
    }

    $("#cart-btn-checkout", drawer).onclick = function () {
      var cart = getCart();
      if (!cart.length) {
        toast("Sua sacola está vazia.");
        return;
      }
      var s = LV.getSettings();
      var cleanWpp = (s.whatsapp || "5579996179533").replace(/\D/g, "");
      var lines = cart.map(function (item) {
        var details = [item.size, item.color].filter(Boolean).join(", ");
        return "• *" + item.name + "* " + (details ? "(" + details + ")" : "") + "\n  " +
          item.qty + "x " + LV.formatPrice(item.price) + " = *" + LV.formatPrice(item.price * item.qty) + "*";
      });

      var total = cartTotal();
      var msg = "Olá, La Vellune! Gostaria de finalizar o seguinte pedido da loja virtual:\n\n" +
        lines.join("\n\n") + "\n\n" +
        "━━━━━━━━━━━━━━━━━━\n" +
        "• *Total do Pedido: " + LV.formatPrice(total) + "*\n" +
        (total >= (s.freeShippingFrom || 499) ? "• *Frete Grátis incluso!*\n" : "") +
        "━━━━━━━━━━━━━━━━━━\n\n" +
        "Por favor, me informe as opções para pagamento e envio.";

      window.open("https://wa.me/" + cleanWpp + "?text=" + encodeURIComponent(msg), "_blank");
    };

    paintCart();
  }

  function renderCartCount() {
    var count = cartQty();
    var el = $("#cart-count");
    if (el) {
      el.textContent = count;
      el.style.display = count ? "grid" : "none";
    }
  }

  /* ---------- Eventos de Busca e Controles ---------- */
  function wireSearch() {
    var input = $("#search");
    var clearBtn = $("#search-clear");
    var t;
    if (input) {
      input.addEventListener("input", function () {
        clearTimeout(t);
        var val = input.value.trim();
        if (clearBtn) clearBtn.style.display = val ? "block" : "none";
        t = setTimeout(function () {
          state.search = val;
          render();
        }, 180);
      });
      if (clearBtn) {
        clearBtn.addEventListener("click", function () {
          input.value = "";
          clearBtn.style.display = "none";
          state.search = "";
          render();
          input.focus();
        });
      }
    }
  }

  function wireControls() {
    var pmin = $("#f-pmin");
    var pmax = $("#f-pmax");
    var instock = $("#f-instock");
    var sort = $("#sort");
    var clear = $("#f-clear");
    var cta = $("#hero-cta");
    var cartBtn = $("#cart-open");

    var debT;
    function debRender() {
      clearTimeout(debT);
      debT = setTimeout(render, 220);
    }

    if (pmin) pmin.addEventListener("input", function () { state.priceMin = this.value; debRender(); });
    if (pmax) pmax.addEventListener("input", function () { state.priceMax = this.value; debRender(); });
    if (instock) instock.addEventListener("change", function () { state.inStock = this.checked; render(); });
    if (sort) sort.addEventListener("change", function () { state.sort = this.value; render(); });

    if (clear) {
      clear.addEventListener("click", function () {
        state = { category: "all", search: "", priceMin: "", priceMax: "", size: "all", sort: "new", inStock: false, onlyWishlist: false };
        if ($("#search")) $("#search").value = "";
        if ($("#search-clear")) $("#search-clear").style.display = "none";
        if (pmin) pmin.value = "";
        if (pmax) pmax.value = "";
        if (instock) instock.checked = false;
        if (sort) sort.value = "new";
        render();
        toast("Filtros limpos");
      });
    }

    if (cta) {
      cta.addEventListener("click", function () {
        var cat = document.getElementById("catalogo");
        if (cat) cat.scrollIntoView({ behavior: "smooth" });
      });
    }

    if (cartBtn) cartBtn.addEventListener("click", openCartDrawer);

    /* ---- Drawer Lateral de Filtros (Estilo Louis Vuitton) ---- */
    var filterBackdrop = $("#filter-drawer-backdrop");
    var filterClose = $("#filter-drawer-close");
    var filterApply = $("#filter-drawer-apply");
    var openFilter = function () { if (filterBackdrop) filterBackdrop.classList.add("active"); };
    var closeFilter = function () { if (filterBackdrop) filterBackdrop.classList.remove("active"); };

    var floatFilterBtn = $("#floating-filter-btn");
    if (floatFilterBtn) floatFilterBtn.addEventListener("click", openFilter);
    var catFilterBtn = $("#catalog-filter-btn");
    if (catFilterBtn) catFilterBtn.addEventListener("click", openFilter);
    if (filterClose) filterClose.addEventListener("click", closeFilter);
    if (filterApply) filterApply.addEventListener("click", closeFilter);
    if (filterBackdrop) {
      filterBackdrop.addEventListener("click", function (e) {
        if (e.target === filterBackdrop) closeFilter();
      });
    }

    /* ---- Menu Lateral Offcanvas (Estilo Louis Vuitton) ---- */
    var menuBackdrop = $("#menu-backdrop");
    var menuClose = $("#menu-drawer-close");
    var menuToggle = $("#menu-toggle-btn");
    var openMenu = function () { if (menuBackdrop) menuBackdrop.classList.add("active"); };
    var closeMenu = function () { if (menuBackdrop) menuBackdrop.classList.remove("active"); };

    if (menuToggle) menuToggle.addEventListener("click", openMenu);
    if (menuClose) menuClose.addEventListener("click", closeMenu);
    if (menuBackdrop) {
      menuBackdrop.addEventListener("click", function (e) {
        if (e.target === menuBackdrop) closeMenu();
      });
    }
    $$("[data-menu-cat]", menuBackdrop).forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.category = btn.dataset.menuCat;
        state.onlyWishlist = false;
        closeMenu();
        render();
        var cat = document.getElementById("catalogo");
        if (cat) cat.scrollIntoView({ behavior: "smooth" });
      });
    });

    /* ---- Botão de Favoritos no Header ---- */
    var wishBtn = $("#header-wishlist-btn");
    if (wishBtn) {
      wishBtn.addEventListener("click", function () {
        var count = getWishlist().length;
        if (count === 0) {
          toast("Você ainda não favoritou nenhuma peça. Clique no ícone de coração nos produtos!");
          return;
        }
        state.onlyWishlist = !state.onlyWishlist;
        if (state.onlyWishlist) toast("Mostrando suas peças favoritas (" + count + ")");
        else toast("Mostrando catálogo completo");
        render();
        var cat = document.getElementById("catalogo");
        if (cat) cat.scrollIntoView({ behavior: "smooth" });
      });
    }

    /* ---- Visibilidade do Botão Flutuante ao Rolar ---- */
    var floatWrap = $("#floating-filter-wrap");
    if (floatWrap) {
      window.addEventListener("scroll", function () {
        var scrollY = window.scrollY || window.pageYOffset;
        var catEl = document.getElementById("catalogo");
        var catTop = catEl ? (catEl.offsetTop - 180) : 380;
        if (scrollY > catTop) {
          floatWrap.classList.remove("is-hidden");
        } else {
          floatWrap.classList.add("is-hidden");
        }
      }, { passive: true });
    }
  }

  /* ---------- Verificação de URL com produto (?p=id) ---------- */
  function checkUrlForProduct() {
    try {
      var params = new URLSearchParams(window.location.search);
      var pId = params.get("p");
      if (pId) {
        setTimeout(function () {
          openProductModal(pId);
        }, 350);
      }
    } catch (e) {}
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* ============================================================
     CARROSSEL 3D COVERFLOW DO INSTAGRAM
     Imagem central em destaque, laterais com profundidade/dimmed
     Troca automática a cada 3.5s, navegação por setas e dots
     ============================================================ */
  function initInstaCarousel() {
    var stage = $("#insta-stage");
    var prevBtn = $("#insta-prev");
    var nextBtn = $("#insta-next");
    var dotsContainer = $("#insta-dots");
    if (!stage) return;

    var slides = $$(".insta-slide", stage);
    if (!slides.length) return;

    var total = slides.length;
    var current = 0;
    var autoPlayTimer = null;
    var isHovered = false;

    // Renderiza dots
    if (dotsContainer) {
      dotsContainer.innerHTML = slides.map(function (_, i) {
        return '<button type="button" class="carousel-dot' + (i === 0 ? " active" : "") + '" data-idx="' + i + '" aria-label="Slide ' + (i + 1) + '"></button>';
      }).join("");

      $$(".carousel-dot", dotsContainer).forEach(function (dot) {
        dot.addEventListener("click", function () {
          goTo(parseInt(dot.dataset.idx, 10));
        });
      });
    }

    function updateView() {
      slides.forEach(function (slide, idx) {
        slide.classList.remove("slide-center", "slide-left", "slide-right", "slide-hidden");

        var diff = (idx - current) % total;
        if (diff < -Math.floor(total / 2)) diff += total;
        if (diff > Math.floor(total / 2)) diff -= total;

        if (diff === 0) {
          slide.classList.add("slide-center");
        } else if (diff === -1) {
          slide.classList.add("slide-left");
        } else if (diff === 1) {
          slide.classList.add("slide-right");
        } else {
          slide.classList.add("slide-hidden");
        }
      });

      if (dotsContainer) {
        $$(".carousel-dot", dotsContainer).forEach(function (dot, i) {
          if (i === current) dot.classList.add("active");
          else dot.classList.remove("active");
        });
      }
    }

    function goTo(idx) {
      current = (idx + total) % total;
      updateView();
      restartTimer();
    }

    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }

    // Click nos slides laterais navega direto para eles
    slides.forEach(function (slide, idx) {
      slide.addEventListener("click", function (e) {
        if (slide.classList.contains("slide-center") && e.target.closest("a")) return;
        if (slide.classList.contains("slide-left")) {
          e.preventDefault();
          prev();
        } else if (slide.classList.contains("slide-right")) {
          e.preventDefault();
          next();
        }
      });
    });

    if (prevBtn) prevBtn.addEventListener("click", prev);
    if (nextBtn) nextBtn.addEventListener("click", next);

    // Suporte a swipe em mobile
    var touchStartX = 0;
    stage.addEventListener("touchstart", function (e) {
      if (e.touches && e.touches[0]) touchStartX = e.touches[0].clientX;
    }, { passive: true });
    stage.addEventListener("touchend", function (e) {
      if (e.changedTouches && e.changedTouches[0]) {
        var diffX = e.changedTouches[0].clientX - touchStartX;
        if (diffX > 40) prev();
        else if (diffX < -40) next();
      }
    }, { passive: true });

    // Auto Play com pausa no hover
    function startTimer() {
      stopTimer();
      autoPlayTimer = setInterval(function () {
        if (!isHovered && document.visibilityState !== "hidden") {
          next();
        }
      }, 3500);
    }

    function stopTimer() {
      if (autoPlayTimer) clearInterval(autoPlayTimer);
      autoPlayTimer = null;
    }

    function restartTimer() {
      stopTimer();
      startTimer();
    }

    stage.addEventListener("mouseenter", function () { isHovered = true; });
    stage.addEventListener("mouseleave", function () { isHovered = false; });

    updateView();
    startTimer();
  }

  /* ============================================================
     TRANSIÇÕES SUAVES ENTRE SESSÕES (SCROLL REVEAL)
     Efeito dinâmico de entrada ao rolar (mobile e desktop)
     ============================================================ */
  function initScrollReveal() {
    var targets = $$("[data-reveal]");
    if (!targets.length) return;

    if (!("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("is-revealed"); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: "0px 0px -40px 0px",
      threshold: 0.08
    });

    targets.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- Inicialização ---------- */
  function init() {
    applySettings();
    wireSearch();
    wireControls();
    render();
    renderCartCount();
    renderWishlistCount();
    checkUrlForProduct();
    initInstaCarousel();
    initScrollReveal();
    window.addEventListener("lavellune:change", function () {
      applySettings();
      render();
    });
  }

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
