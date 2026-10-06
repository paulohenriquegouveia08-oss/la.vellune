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
    updatePreview(p ? LV.imageOf(p) : LV.imageOf({ brand: "La Vellune", name: "" }));
    // Sobe para o topo para o formulário preenchido ficar visível de cara.
    try { window.scrollTo({ top: 0, behavior: "auto" }); } catch (e) { window.scrollTo(0, 0); }
  }

  function updatePreview(src) { $("#img-preview").src = src; }
  function updateLogoPreview() { var el = $("#logo-preview"); if (el) el.src = currentLogo || LV.brandMonogram(); }

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
    f.onsubmit = function (e) {
      e.preventDefault();
      if (!f.name_.value.trim() || !f.price_.value) { toast("Preencha nome e preço"); return; }
      LV.saveProduct({
        id: f.id_.value || undefined,
        name: f.name_.value, brand: f.brand_.value, category: f.category_.value,
        price: f.price_.value, oldPrice: f.oldPrice_.value || null, stock: f.stock_.value,
        sizes: f.sizes_.value, colors: f.colors_.value, desc: f.desc_.value,
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
    wireForm(); wireSettings();
    go("products");
    window.addEventListener("lavellune:change", function () { if ($("#sec-products").classList.contains("active")) renderProducts(); });
  }

  function boot() { if (isAuthed()) enterApp(); else showLogin(); }
  if (document.readyState !== "loading") boot();
  else document.addEventListener("DOMContentLoaded", boot);
})();
