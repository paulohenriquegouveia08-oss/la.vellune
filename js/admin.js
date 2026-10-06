/* ============================================================
   LA VELLUNE — PAINEL ADMINISTRATIVO (lógica)
   Usa a mesma API LV (data.js) que a vitrine. O que salva aqui
   aparece na loja imediatamente (mesmo localStorage).

   DEMO: o login é apenas simbólico (sem servidor). Em produção,
   troque enterApp()/login por autenticação real.
   ============================================================ */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var DEMO_USER = "admin", DEMO_PASS = "lavellune";
  var SESSION = "lavellune_admin_session";

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function toast(msg) {
    var t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove("show"); }, 1800);
  }

  /* ---------- login (demo) ---------- */
  function isAuthed() { try { return sessionStorage.getItem(SESSION) === "1"; } catch (e) { return false; } }
  function login(u, p) {
    if (u === DEMO_USER && p === DEMO_PASS) { try { sessionStorage.setItem(SESSION, "1"); } catch (e) {} return true; }
    return false;
  }
  function logout() { try { sessionStorage.removeItem(SESSION); } catch (e) {} location.reload(); }

  function showLogin() {
    $("#app").classList.add("hide");
    $("#login").classList.remove("hide");
    $("#login-form").onsubmit = function (e) {
      e.preventDefault();
      if (login($("#l-user").value.trim(), $("#l-pass").value)) enterApp();
      else { $("#l-error").textContent = "Usuário ou senha inválidos."; }
    };
  }
  function enterApp() {
    $("#login").classList.add("hide");
    $("#app").classList.remove("hide");
    initApp();
  }

  /* ---------- navegação ---------- */
  function go(section) {
    $$(".section").forEach(function (s) { s.classList.toggle("active", s.id === "sec-" + section); });
    $$(".nav-item").forEach(function (n) { n.classList.toggle("active", n.dataset.go === section); });
    if (section === "products") renderProducts();
    if (section === "settings") fillSettings();
    if (section === "finance") renderFinance();
    if (section === "categories") renderCategories();
    if (section === "sizelists") renderSizeLists();
    // "new" NÃO chama openForm aqui — quem abre o formulário é o clique do
    // menu (initApp) ou o botão Editar. Chamar openForm daqui criava uma
    // recursão com o go() de dentro do openForm e estourava a pilha.
  }

  /* ---------- estatísticas ---------- */
  function renderStats() {
    var products = LV.getProducts();
    var units = products.reduce(function (s, p) { return s + (p.stock || 0); }, 0);
    var low = products.filter(function (p) { return (p.stock || 0) <= 3; }).length;
    var cats = LV.getCategories().length;
    $("#stat-products").textContent = products.length;
    $("#stat-units").textContent = units;
    $("#stat-low").textContent = low;
    $("#stat-cats").textContent = cats;
    $("#stat-low-card").classList.toggle("warn", low > 0);
  }

  /* ---------- tabela de produtos ---------- */
  function renderProducts() {
    renderStats();
    var products = LV.getProducts();
    var body = $("#product-rows");
    if (!products.length) {
      body.innerHTML = '<tr><td colspan="6"><p class="muted" style="padding:30px;text-align:center">Nenhum produto. Clique em “Novo produto”.</p></td></tr>';
      return;
    }
    body.innerHTML = products.map(function (p) {
      var low = (p.stock || 0) <= 3;
      return (
        "<tr data-id='" + p.id + "'>" +
          "<td><img class='t-thumb' src='" + LV.imageOf(p) + "' alt=''></td>" +
          "<td><div class='t-name'>" + esc(p.name) + "</div>" +
            "<div class='muted' style='font-size:var(--fs-xs)'>" + esc(p.brand) +
            (p.featured ? " · ⭐ destaque" : "") + "</div></td>" +
          "<td><span class='badge badge-muted'>" + esc(p.category) + "</span></td>" +
          "<td class='price'>" + LV.formatPrice(p.price) + "</td>" +
          "<td><input class='stock-input" + (low ? " low" : "") + "' type='number' min='0' value='" + (p.stock || 0) + "' data-stock='" + p.id + "'></td>" +
          "<td><div class='row-actions'>" +
            "<button class='icon-btn' data-edit='" + p.id + "' title='Editar'>✎</button>" +
            "<button class='icon-btn danger' data-del='" + p.id + "' title='Excluir'>🗑</button>" +
          "</div></td>" +
        "</tr>"
      );
    }).join("");

    $$("[data-stock]", body).forEach(function (inp) {
      inp.onchange = function () { LV.setStock(inp.dataset.stock, inp.value); toast("Estoque atualizado"); renderStats(); inp.classList.toggle("low", (parseInt(inp.value, 10) || 0) <= 3); };
    });
    $$("[data-edit]", body).forEach(function (b) { b.onclick = function () { openForm(b.dataset.edit); }; });
    $$("[data-del]", body).forEach(function (b) {
      b.onclick = function () {
        var p = LV.getProduct(b.dataset.del);
        if (confirm("Excluir “" + (p ? p.name : "") + "”? Esta ação não pode ser desfeita.")) {
          LV.removeProduct(b.dataset.del); toast("Produto excluído"); renderProducts();
        }
      };
    });
  }

  /* ---------- formulário de produto ---------- */
  var currentImage = "";
  var currentLogo = "";
  var selectedSizes = [];
  function openForm(id) {
    var p = id ? LV.getProduct(id) : null;
    currentImage = p ? (p.image || "") : "";
    // Ativa a seção do formulário aqui mesmo (sem passar pelo go("new"),
    // que chamaria openForm de volta).
    $$(".section").forEach(function (s) { s.classList.toggle("active", s.id === "sec-new"); });
    // Editando: destaca "Produtos" (você veio da lista). Só o cadastro de
    // verdade destaca "Novo produto". Assim a edição não parece a tela de add.
    $$(".nav-item").forEach(function (n) { n.classList.toggle("active", n.dataset.go === (p ? "products" : "new")); });
    $("#form-title").textContent = p ? "Editar: " + p.name : "Novo produto";
    var f = $("#product-form");
    f.id_.value = p ? p.id : "";
    f.name_.value = p ? p.name : "";
    f.brand_.value = p ? p.brand : "La Vellune";
    f.category_.value = p ? p.category : "";
    f.price_.value = p ? p.price : "";
    f.oldPrice_.value = p && p.oldPrice ? p.oldPrice : "";
    f.stock_.value = p ? p.stock : 0;
    f.sizes_.value = p ? (p.sizes || []).join(", ") : "";
    f.colors_.value = p ? (p.colors || []).join(", ") : "";
    f.desc_.value = p ? (p.desc || "") : "";
    f.imageUrl_.value = p && p.image && !/^data:/.test(p.image) ? p.image : "";
    f.featured_.checked = p ? !!p.featured : false;
    // Categorias cadastradas no datalist + tamanhos conforme a categoria.
    var dl = $("#cat-list");
    if (dl) dl.innerHTML = LV.getCategoryDefs().map(function (c) { return "<option>" + esc(c.name) + "</option>"; }).join("");
    renderProductSizes(f.category_.value, p ? (p.sizes || []) : []);
    updatePreview(p ? LV.imageOf(p) : LV.imageOf({ brand: "La Vellune", name: "" }));
    // Sobe para o topo para o formulário preenchido ficar visível de cara.
    try { window.scrollTo({ top: 0, behavior: "auto" }); } catch (e) { window.scrollTo(0, 0); }
  }

  function updatePreview(src) { $("#img-preview").src = src; }
  function updateLogoPreview() { var el = $("#logo-preview"); if (el) el.src = currentLogo || LV.brandMonogram(); }

  /* Os tamanhos do produto vêm da LISTA vinculada à sua CATEGORIA.
     Sem lista para aquela categoria, cai no campo de texto livre. */
  function renderProductSizes(category, preselected) {
    var f = $("#product-form");
    var chips = $("#sizes-chips"), hint = $("#sizes-hint");
    if (!chips) return;
    preselected = preselected || [];
    var avail = LV.sizesForCategory(category);
    if (avail.length) {
      f.sizes_.style.display = "none";
      var union = avail.slice();
      preselected.forEach(function (s) { if (union.indexOf(s) === -1) union.push(s); });
      selectedSizes = preselected.filter(function (s) { return union.indexOf(s) !== -1; });
      chips.innerHTML = union.map(function (s) {
        return '<button type="button" class="chip' + (selectedSizes.indexOf(s) !== -1 ? " active" : "") + '" data-size="' + esc(s) + '">' + esc(s) + "</button>";
      }).join("");
      $$(".chip", chips).forEach(function (b) {
        b.onclick = function () {
          var s = b.dataset.size, i = selectedSizes.indexOf(s);
          if (i === -1) selectedSizes.push(s); else selectedSizes.splice(i, 1);
          b.classList.toggle("active");
        };
      });
      if (hint) hint.textContent = 'Tamanhos da lista vinculada a "' + category + '". Clique para marcar os disponíveis.';
    } else {
      chips.innerHTML = "";
      f.sizes_.style.display = "";
      f.sizes_.value = preselected.join(", ");
      if (hint) hint.textContent = category
        ? 'A categoria "' + category + '" não tem lista de tamanho — digite os tamanhos, ou crie uma lista na aba Tamanhos.'
        : "Escolha uma categoria para ver os tamanhos.";
    }
  }
  function currentProductSizes() {
    var f = $("#product-form");
    var chips = $("#sizes-chips");
    if (chips && chips.children.length) return selectedSizes.slice();
    return (f.sizes_.value || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function wireForm() {
    var f = $("#product-form");
    f.imageUrl_.addEventListener("input", function () {
      currentImage = this.value.trim();
      updatePreview(currentImage || LV.imageOf({ brand: "La Vellune", name: f.name_.value }));
    });
    f.imageFile_.addEventListener("change", function () {
      var file = this.files[0]; if (!file) return;
      var reader = new FileReader();
      reader.onload = function () { currentImage = reader.result; updatePreview(currentImage); f.imageUrl_.value = ""; };
      reader.readAsDataURL(file);
    });
    // Remover foto: produto fica sem imagem e passa a mostrar a logo da loja.
    var imgClear = $("#img-clear");
    if (imgClear) imgClear.onclick = function () {
      currentImage = "";
      f.imageUrl_.value = "";
      try { f.imageFile_.value = ""; } catch (e) {}
      updatePreview(LV.imageOf({ image: "" }));
    };
    // Trocou a categoria: recarrega os tamanhos conforme a lista vinculada,
    // preservando o que já estava selecionado.
    f.category_.addEventListener("input", function () {
      renderProductSizes(f.category_.value, currentProductSizes());
    });
    f.onsubmit = function (e) {
      e.preventDefault();
      if (!f.name_.value.trim() || !f.price_.value) { toast("Preencha nome e preço"); return; }
      LV.saveProduct({
        id: f.id_.value || undefined,
        name: f.name_.value, brand: f.brand_.value, category: f.category_.value,
        price: f.price_.value, oldPrice: f.oldPrice_.value || null, stock: f.stock_.value,
        sizes: currentProductSizes(), colors: f.colors_.value, desc: f.desc_.value,
        image: currentImage, featured: f.featured_.checked,
      });
      toast(f.id_.value ? "Produto atualizado" : "Produto criado");
      go("products");
    };
    $("#form-cancel").onclick = function () { go("products"); };
  }

  /* ---------- configurações da loja ---------- */
  function fillSettings() {
    var s = LV.getSettings(), f = $("#settings-form");
    f.storeName.value = s.storeName; f.tagline.value = s.tagline; f.whatsapp.value = s.whatsapp;
    f.instagram.value = s.instagram; f.email.value = s.email; f.phone.value = s.phone;
    f.address.value = s.address; f.footerNote.value = s.footerNote; f.freeShippingFrom.value = s.freeShippingFrom;
    currentLogo = s.logo || "";
    // Guarda: HTML antigo em cache pode não ter o campo de logo ainda.
    if (f.logoUrl) f.logoUrl.value = currentLogo && !/^data:/.test(currentLogo) ? currentLogo : "";
    updateLogoPreview();
  }
  function wireSettings() {
    var f = $("#settings-form");
    if (f.logoUrl) f.logoUrl.addEventListener("input", function () { currentLogo = this.value.trim(); updateLogoPreview(); });
    if (f.logoFile) f.logoFile.addEventListener("change", function () {
      var file = this.files[0]; if (!file) return;
      var reader = new FileReader();
      reader.onload = function () { currentLogo = reader.result; if (f.logoUrl) f.logoUrl.value = ""; updateLogoPreview(); };
      reader.readAsDataURL(file);
    });
    var logoClear = $("#logo-clear");
    if (logoClear) logoClear.onclick = function () { currentLogo = ""; if (f.logoUrl) f.logoUrl.value = ""; try { f.logoFile.value = ""; } catch (e) {} updateLogoPreview(); };
    f.onsubmit = function (e) {
      e.preventDefault();
      LV.saveSettings({
        storeName: f.storeName.value, tagline: f.tagline.value, whatsapp: f.whatsapp.value,
        instagram: f.instagram.value, email: f.email.value, phone: f.phone.value,
        address: f.address.value, footerNote: f.footerNote.value,
        freeShippingFrom: Number(f.freeShippingFrom.value) || 0, logo: currentLogo,
      });
      toast("Configurações salvas");
    };
  }

  /* ---------- FINANCEIRO ---------- */
  function fmtDate(d) { if (!d) return ""; var p = String(d).split("-"); return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : d; }
  function renderFinance() {
    var s = LV.financeSummary();
    $("#fin-receitas").textContent = LV.formatPrice(s.receitas);
    $("#fin-despesas").textContent = LV.formatPrice(s.despesas);
    var saldoEl = $("#fin-saldo");
    saldoEl.textContent = LV.formatPrice(s.saldo);
    saldoEl.style.color = s.saldo >= 0 ? "var(--success)" : "var(--danger)";
    $("#fin-count").textContent = s.lancamentos;

    var months = LV.financeByMonth(), max = 1;
    months.forEach(function (m) { max = Math.max(max, m.receitas, m.despesas); });
    var chart = $("#fin-chart");
    chart.innerHTML = months.length ? months.map(function (m) {
      var rh = Math.max(2, Math.round(m.receitas / max * 150));
      var dh = Math.max(2, Math.round(m.despesas / max * 150));
      var label = m.month.slice(5) + "/" + m.month.slice(0, 4);
      return '<div class="bar-group"><div class="bars">' +
        '<div class="bar rec" style="height:' + rh + 'px" title="Receitas ' + LV.formatPrice(m.receitas) + '"></div>' +
        '<div class="bar desp" style="height:' + dh + 'px" title="Despesas ' + LV.formatPrice(m.despesas) + '"></div>' +
        "</div><div class=\"bar-label\">" + label + "</div></div>";
    }).join("") : '<p class="muted">Sem lançamentos ainda.</p>';
    if (months.length && chart.parentNode && !$("#fin-legend")) {
      var lg = document.createElement("div");
      lg.className = "fin-legend"; lg.id = "fin-legend";
      lg.innerHTML = '<span><i style="background:var(--success)"></i>Receitas</span><span><i style="background:var(--danger)"></i>Despesas</span>';
      chart.parentNode.appendChild(lg);
    }

    var rows = LV.getFinance();
    $("#finance-rows").innerHTML = rows.length ? rows.map(function (e) {
      var isDesp = e.type === "despesa";
      return "<tr><td>" + fmtDate(e.date) + "</td><td>" + esc(e.description) + "</td>" +
        "<td><span class='badge " + (isDesp ? "badge-danger" : "badge-success") + "'>" + e.type + "</span></td>" +
        "<td class='price' style='color:" + (isDesp ? "var(--danger)" : "var(--success)") + "'>" + (isDesp ? "− " : "+ ") + LV.formatPrice(e.amount) + "</td>" +
        "<td><div class='row-actions'><button class='icon-btn danger' data-finremove='" + e.id + "' title='Excluir'>🗑</button></div></td></tr>";
    }).join("") : "<tr><td colspan='5'><p class='muted' style='padding:20px;text-align:center'>Nenhum lançamento.</p></td></tr>";
    $$("[data-finremove]").forEach(function (b) { b.onclick = function () { LV.removeFinanceEntry(b.dataset.finremove); toast("Lançamento removido"); renderFinance(); }; });
  }
  function wireFinance() {
    var f = $("#finance-form"); if (!f) return;
    f.onsubmit = function (e) {
      e.preventDefault();
      if (!f.description.value.trim() || !f.amount.value) { toast("Preencha descrição e valor"); return; }
      LV.addFinanceEntry({ type: f.type.value, description: f.description.value, amount: f.amount.value, date: f.date.value });
      f.description.value = ""; f.amount.value = ""; f.date.value = "";
      toast("Lançamento adicionado"); renderFinance();
    };
  }

  /* ---------- CATEGORIAS ---------- */
  function renderCategories() {
    var lists = LV.getSizeLists(), sel = $("#cat-sizelist");
    if (sel) sel.innerHTML = '<option value="">— sem lista (tamanho livre) —</option>' +
      lists.map(function (l) { return '<option value="' + l.id + '">' + esc(l.name) + "</option>"; }).join("");
    var cats = LV.getCategoryDefs();
    $("#category-rows").innerHTML = cats.length ? cats.map(function (c) {
      var l = LV.getSizeList(c.sizeListId);
      return "<tr><td class='t-name'>" + esc(c.name) + "</td>" +
        "<td>" + (l ? "<span class='badge badge-muted'>" + esc(l.name) + "</span>" : "<span class='muted'>— livre —</span>") + "</td>" +
        "<td class='muted' style='font-size:var(--fs-xs)'>" + (l ? l.sizes.map(esc).join(", ") : "digitado à mão") + "</td>" +
        "<td><div class='row-actions'><button class='icon-btn' data-catedit='" + c.id + "'>✎</button><button class='icon-btn danger' data-catdel='" + c.id + "'>🗑</button></div></td></tr>";
    }).join("") : "<tr><td colspan='4'><p class='muted' style='padding:20px;text-align:center'>Nenhuma categoria.</p></td></tr>";
    $$("[data-catedit]").forEach(function (b) { b.onclick = function () { editCategory(b.dataset.catedit); }; });
    $$("[data-catdel]").forEach(function (b) {
      b.onclick = function () {
        var c = LV.getCategoryDefs().filter(function (x) { return x.id === b.dataset.catdel; })[0];
        if (confirm("Excluir a categoria “" + (c ? c.name : "") + "”?")) { LV.removeCategory(b.dataset.catdel); toast("Categoria excluída"); renderCategories(); }
      };
    });
  }
  function resetCatForm() { var f = $("#category-form"); f.id.value = ""; f.name.value = ""; f.sizeListId.value = ""; $("#cat-submit").textContent = "Adicionar categoria"; $("#cat-cancel").style.display = "none"; }
  function editCategory(id) {
    var c = LV.getCategoryDefs().filter(function (x) { return x.id === id; })[0]; if (!c) return;
    var f = $("#category-form"); f.id.value = c.id; f.name.value = c.name; f.sizeListId.value = c.sizeListId || "";
    $("#cat-submit").textContent = "Salvar categoria"; $("#cat-cancel").style.display = ""; f.name.focus();
  }
  function wireCategories() {
    var f = $("#category-form"); if (!f) return;
    f.onsubmit = function (e) {
      e.preventDefault();
      if (!f.name.value.trim()) { toast("Informe o nome da categoria"); return; }
      LV.saveCategory({ id: f.id.value || undefined, name: f.name.value, sizeListId: f.sizeListId.value });
      resetCatForm(); toast("Categoria salva"); renderCategories();
    };
    $("#cat-cancel").onclick = resetCatForm;
  }

  /* ---------- LISTAS DE TAMANHO ---------- */
  function renderSizeLists() {
    var lists = LV.getSizeLists(), cats = LV.getCategoryDefs();
    $("#sizelist-rows").innerHTML = lists.length ? lists.map(function (l) {
      var used = cats.filter(function (c) { return c.sizeListId === l.id; }).map(function (c) { return c.name; });
      return "<tr><td class='t-name'>" + esc(l.name) + "</td>" +
        "<td>" + l.sizes.map(function (s) { return "<span class='badge badge-muted' style='margin:2px'>" + esc(s) + "</span>"; }).join(" ") + "</td>" +
        "<td class='muted' style='font-size:var(--fs-xs)'>" + (used.length ? used.map(esc).join(", ") : "—") + "</td>" +
        "<td><div class='row-actions'><button class='icon-btn' data-sledit='" + l.id + "'>✎</button><button class='icon-btn danger' data-sldel='" + l.id + "'>🗑</button></div></td></tr>";
    }).join("") : "<tr><td colspan='4'><p class='muted' style='padding:20px;text-align:center'>Nenhuma lista.</p></td></tr>";
    $$("[data-sledit]").forEach(function (b) { b.onclick = function () { editSizeList(b.dataset.sledit); }; });
    $$("[data-sldel]").forEach(function (b) {
      b.onclick = function () {
        var l = LV.getSizeList(b.dataset.sldel);
        if (confirm("Excluir a lista “" + (l ? l.name : "") + "”? As categorias que a usam ficam com tamanho livre.")) { LV.removeSizeList(b.dataset.sldel); toast("Lista excluída"); renderSizeLists(); }
      };
    });
  }
  function resetSlForm() { var f = $("#sizelist-form"); f.id.value = ""; f.name.value = ""; f.sizes.value = ""; $("#sl-submit").textContent = "Adicionar lista"; $("#sl-cancel").style.display = "none"; }
  function editSizeList(id) {
    var l = LV.getSizeList(id); if (!l) return;
    var f = $("#sizelist-form"); f.id.value = l.id; f.name.value = l.name; f.sizes.value = l.sizes.join(", ");
    $("#sl-submit").textContent = "Salvar lista"; $("#sl-cancel").style.display = ""; f.name.focus();
  }
  function wireSizeLists() {
    var f = $("#sizelist-form"); if (!f) return;
    f.onsubmit = function (e) {
      e.preventDefault();
      if (!f.name.value.trim()) { toast("Informe o nome da lista"); return; }
      LV.saveSizeList({ id: f.id.value || undefined, name: f.name.value, sizes: f.sizes.value });
      resetSlForm(); toast("Lista salva"); renderSizeLists();
    };
    $("#sl-cancel").onclick = resetSlForm;
  }

  /* ---------- init ---------- */
  function initApp() {
    $$(".nav-item[data-go]").forEach(function (n) {
      n.onclick = function () {
        // "Novo produto" abre o formulário SEMPRE em branco (openForm(null));
        // as demais abas só trocam de seção.
        if (n.dataset.go === "new") openForm(null);
        else go(n.dataset.go);
      };
    });
    $("#logout").onclick = logout;
    $("#reset-demo").onclick = function () {
      if (confirm("Restaurar os dados de exemplo? Isso apaga as alterações do demo.")) { LV.resetDemo(); toast("Demo restaurado"); renderProducts(); }
    };
    wireForm(); wireSettings(); wireFinance(); wireCategories(); wireSizeLists();
    go("products");
    window.addEventListener("lavellune:change", function () { if ($("#sec-products").classList.contains("active")) renderProducts(); });
  }

  function boot() { if (isAuthed()) enterApp(); else showLogin(); }
  if (document.readyState !== "loading") boot();
  else document.addEventListener("DOMContentLoaded", boot);
})();
