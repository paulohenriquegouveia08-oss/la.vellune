# Louis Vuitton Design System — Reverse Engineered (La Vellune)

Documentação do Design System extraído e adaptado da **Louis Vuitton** (`https://br.louisvuitton.com/por-br/mulher/ready-to-wear/todas-as-roupas/_/N-to8aw9x`) para a loja virtual **La Vellune**.

---

## 1. Identidade Visual & Atmosfera

- **Conceito**: *Haute Horlogerie & High Fashion Minimalism* — Minimalismo editorial puro, espaços em branco generosos, sem molduras pesadas, tipografia geométrica precisa e fotografia em destaque absoluto.
- **Backgrounds**: Branco puro (`#FFFFFF`) e off-white seda quente (`#F7F6F4` / `#F9F8F6`).
- **Linhas e Divisões**: Bordas ultrafinas (`1px solid #EBEAEA`), sem sombras exageradas nem degradês artificiais.

---

## 2. Paleta de Cores (Tokens)

```css
:root {
  /* Bases Monocromáticas */
  --lv-black: #000000;
  --lv-noir: #111111;
  --lv-charcoal: #2A2A2A;
  --lv-gray-dark: #555555;
  --lv-gray-muted: #767676;
  --lv-gray-light: #EBEAEA;
  --lv-gray-bg: #F7F6F4;
  --lv-white: #FFFFFF;

  /* Acentos de Luxo */
  --lv-gold: #C29B38;
  --lv-gold-dark: #997424;
  --lv-gold-subtle: rgba(194, 155, 56, 0.12);
  --lv-whatsapp: #15803D;
  --lv-danger: #D92D20;
}
```

---

## 3. Tipografia & Escala

- **Família Primária**: `Futura`, `-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `Helvetica Neue`, `Arial`, `sans-serif`.
- **Família Display / Logotipo**: `Cinzel`, `"Didot"`, `"Bodoni MT"`, `serif` com alto letter-spacing.
- **Logotipo La Vellune**: `letter-spacing: 0.28em; text-transform: uppercase; font-weight: 600;`.
- **Título da Coleção**: `font-size: 32px; font-weight: 400; letter-spacing: 0.4px; line-height: 40px;`.
- **Abas de Categoria (Subnav)**: `font-size: 15px; font-weight: 400; letter-spacing: 0.4px;` com linha indicadora sólida de 2px no item ativo.
- **Título do Produto**: `font-size: 14px; font-weight: 400; letter-spacing: 0.4px; line-height: 1.35; color: var(--lv-noir);`.
- **Preço**: `font-size: 14px; font-weight: 400; letter-spacing: 0.4px; color: var(--lv-gray-muted);`.

---

## 4. Componentes Chave (Louis Vuitton Style)

### A. Top Announcement Bar
- Faixa superior esbelta com mensagens alternadas ou fixas de envio, parcelamento e atendimento.
- Tipografia limpa de 11px em caixa alta/baixa.

### B. Header Minimalista
- Menu e busca no lado esquerdo.
- Logotipo centralizado com tracking estendido (`L A   V E L L U N E`).
- Atendimento VIP (WhatsApp), Wishlist (coração) e Sacola de compras no lado direito.

### C. Subnav Horizontal de Categorias (The LV Sub-nav)
- Barra horizontal limpa: `Ver Tudo` · `Polos` · `Camisas de Linho` · `Quarter-Zips & Suéteres` · `Edições Limitadas`.
- Linha preta ativa na categoria selecionada.

### D. Grade de Produtos (4 Colunas Borderless)
- Cada célula de produto tem fundo neutro limpo, moldura sutil com divisória de 1px.
- Foto com fundo estúdio neutro (`#F7F6F4`), proporção 1:1 / 4:5.
- Botão de favorito/wishlist flutuante no topo direito do card (`♡`).
- Quick view e botão de compra ao passar o mouse ou clicar no card.

### E. Botão Flutuante de Filtros ("Filtros") & Drawer Lateral
- Botão em formato de pílula preta flutuante no centro-inferior da tela: `[ 🎛️ Filtros ]`.
- Ao clicar, abre o drawer lateral direito no estilo Louis Vuitton com acordeões: Categorias, Tamanhos, Preço e botão inferior `[ Mostrar Produtos ]`.

### F. Modal de Produto em Tela Única
- Preserva a exigência de **Zero Rolagem**: foto grande na esquerda, seletores elegantes na direita, botões de ação e garantia tudo visível de imediato.

---

## 5. Arquitetura Mobile & Responsividade (Louis Vuitton Mobile)

- **Header Mobile em 2 Linhas**:
  - *Linha 1*: `☰ Menu` na esquerda, logotipo `LA VELLUNE` centralizado e botões de `♡ Favoritos` e `🛍️ Sacola` na direita.
  - *Linha 2*: Barra de pesquisa dedicada com formato de pílula (`#f4f3ef`, 38px, bordas arredondadas 999px), ícone de lupa e botão de limpar busca sincronizado em tempo real.
- **Hero Editorial Mobile**:
  - Altura otimizada e botões em coluna (`flex-direction: column; width: 100%; max-width: 320px;`) com toque confortável (`min-height: 46px`).
- **Subnav Horizontal Touch**:
  - Abas horizontais com scroll touch nativo sem barra de rolagem visível (`scrollbar-width: none; -webkit-overflow-scrolling: touch;`).
- **Grade de Produtos 2 Colunas**:
  - `grid-template-columns: repeat(2, 1fr); gap: 18px 10px;`.
  - Cards com proporção de imagem 4:5, botões de favoritos (`♡`) de 30px com alvo de toque aprimorado.
  - Tipografia de 12.5px para o nome e 13px para o preço, alinhada à elegância sutil da LV.
- **Pílula Flutuante de Filtros & WhatsApp Concierge**:
  - Botão `[ 🎛️ Filtros ]` centralizado no rodapé com respeito à `safe-area-inset-bottom`.
  - Botão WhatsApp de 48px posicionado no canto inferior direito sem sobrepor os controles centrais.
- **Gavetas Offcanvas (Filtros, Menu e Sacola)**:
  - Ocupam 100% da largura em telas compactas (`< 540px`), com botões de ação fixos no rodapé com preenchimento para áreas seguras do dispositivo.
- **Modal de Produto Mobile**:
  - Estrutura vertical compacta (`max-height: min(90vh, 640px)`) que preserva a experiência de tela única sem que o usuário precise rolar para encontrar os seletores de tamanho e botões de compra.

