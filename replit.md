# TechStore — E-Commerce Platform

## Overview
TechStore is a full-featured front-end e-commerce platform for tech products, built with pure HTML, CSS, and Vanilla JavaScript. All data is stored in localStorage. The app is served via Python's built-in HTTP server on port 5000.

## Pages
- `index.html` — Login and registration
- `dashboard.html` — Main store with product grid, category sidebar, search, sort, recommendations carousel, and product comparison
- `produto.html` — Product detail page with reviews, favorites, and gallery
- `carrinho.html` — Shopping cart with CEP/shipping calculator, coupon system, credit card validator, and PIX/Boleto support
- `pedidos.html` — Order history with visual tracking timeline and refund requests
- `favoritos.html` — Wishlist/favorites page
- `perfil.html` — User profile with stats, edit name, change password, order history
- `admin.html` — Admin panel with analytics dashboard, user/product/order management
- `vender.html` — Seller product listing form

## Systems Implemented
- **Login/Cadastro** — Email/password auth via localStorage (`tech_users_v2`)
- **Carrinho** — Full cart with quantity controls, subtotal, checkout
- **Produtos** — 32 default tech products across 8 categories; sellers can add more
- **Pagamento** — PIX (5% OFF), Cartão de Crédito (up to 12x), Boleto Bancário
- **Pedidos** — Order history with status tracking
- **Entrega/Frete** — CEP-based shipping calculator with 3 options (Grátis, Expresso, Same Day)
- **Estoque** — Stock field on products (managed in vender.html)
- **Pesquisa e Filtros** — Search by name, filter by category sidebar, sort by price
- **Favoritos** — Heart button on all product cards; dedicated favorites page
- **Avaliações** — Star ratings and text reviews per product
- **Cupons** — TECH10, SAVE20, BEMVINDO, TECHSTORE20, BLACK50, FLASH5, FRETE0
- **Notificações** — Global toast system via `notifications.js` (`showToast(msg, type)`)
- **Painel do Usuário** — Profile page with stats, edit name, change password
- **Painel Admin** — User role management, product management, order overview, analytics dashboard
- **Segurança/Autenticação** — Role-based access (admin, seller, user); protected routes
- **Responsividade Mobile** — Responsive CSS with flex/grid layouts
- **Suporte/Chat** — Floating chat widget (`chat.js/css`) with bot responses and quick replies
- **Histórico de Compras** — Visible in pedidos.html and perfil.html
- **Rastreamento de Pedidos** — 5-step visual timeline in pedidos.html
- **Categorias** — Vertical sidebar with 8 tech categories
- **Recomendações** — Swipeable horizontal carousel on dashboard (based on last viewed product)
- **Analytics/Estatísticas** — Revenue by payment method, orders by status, top products, products by category (admin analytics tab)

## Key Data Keys (localStorage)
- `loggedEmail` — current session email
- `tech_users_v2` — all registered users
- `tech_products` — all products
- `tech_cart` — current cart
- `tech_orders` — all orders
- `tech_favs_<email>` — favorites per user
- `tech_reviews_<productId>` — reviews per product
- `produtoVisualizado` — last viewed product

## Color Scheme
- Primary red: `#e8001d`
- Background: `#04040a`
- Success green: `#00ff88`
- Cart blue: `#3483fa`
- Gold (coupons): `#c9a227`

## User Preferences
- Pure front-end only — no npm, no backend, no build step
- All data stored in localStorage
- Python HTTP server on port 5000
- Poppins font from Google Fonts
- Dark theme with red accent color (#e8001d)
