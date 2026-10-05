# La Vellune — Loja virtual (demo)

Demonstração funcional de e-commerce para apresentar ao cliente. **HTML/CSS/JS puro, sem backend**: os produtos e as configurações ficam no `localStorage` do navegador, então tudo funciona abrindo os arquivos ou publicando em qualquer hospedagem estática (GitHub Pages, Vercel, Hostinger).

## Como abrir

Basta abrir o `index.html` no navegador. Para um ambiente mais fiel (fontes e navegação entre páginas), sirva a pasta:

```bash
# Python
python3 -m http.server 5500
# ou Node
npx serve .
```

Depois acesse `http://localhost:5500`.

- **Vitrine:** `/index.html`
- **Painel administrativo:** `/admin/` — usuário **admin**, senha **lavellune** (login só de demonstração).

## O que já funciona

**Vitrine**
- Grid de produtos com destaque, ofertas e aviso de "esgotado"/"últimas unidades".
- Busca em tempo real (nome, marca, categoria, cor).
- Filtros por categoria, tamanho, faixa de preço e "somente em estoque".
- Ordenação (recentes, preço, nome).
- Página de produto (modal) com seleção de tamanho e cor.
- Sacola de compras com quantidade e **checkout via WhatsApp** (mensagem pronta com os itens).

**Painel admin** (`/admin/`)
- Cadastro, edição e exclusão de produtos.
- Gestão de estoque (edição direta na tabela, alerta de estoque baixo).
- Imagem por URL ou upload de arquivo.
- Configurações da loja (nome, slogan, WhatsApp, redes, contato, endereço, frete grátis) que alimentam a vitrine e o rodapé.
- Painel de indicadores (produtos, itens em estoque, estoque baixo, categorias).

> O que o admin salva aparece na vitrine na hora — inclusive com as duas abas abertas lado a lado.

## Para o designer (cores e fontes da marca)

**Edite apenas `css/tokens.css`.** Todas as cores e fontes do site saem dos tokens no topo do arquivo (`--brand-bg`, `--brand-accent`, `--font-display`, etc.). Troque esses valores pela identidade da La Vellune e o site inteiro — vitrine e painel — acompanha. Não é preciso caçar cor espalhada pelo CSS.

A logo hoje é textual (`La Vellune`). Para usar a logo em imagem, substitua o `.logo` no `index.html` e no `admin/index.html` por um `<img>`.

## Estrutura

```
index.html            vitrine
admin/index.html      painel administrativo
css/tokens.css        >>> cores e fontes da marca (editar aqui)
css/base.css          reset, tipografia, botões, componentes
css/store.css         estilos da vitrine
css/admin.css         estilos do painel
js/data.js            camada de dados (localStorage) — produtos, estoque, config
js/store.js           funcionalidade da vitrine (busca, filtros, carrinho)
js/admin.js           funcionalidade do painel (CRUD, estoque)
```

## Caminho para produção

Quando o cliente aprovar, trocar o `localStorage` por um backend real sem reescrever a interface: os métodos de `js/data.js` (`getProducts`, `saveProduct`, `setStock`, etc.) viram chamadas a uma API/Supabase, e `store.js`/`admin.js` continuam iguais. Autenticação de verdade entra no lugar do login de demonstração do painel.

---
Desenvolvido por LSPK Technology.
