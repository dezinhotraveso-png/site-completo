# TechStore

A Portuguese-language e-commerce platform for tech products (keyboards, mice, monitors, etc.) with user auth, admin panel, cart, orders, and product reviews — all client-side using localStorage.

## Run & Operate

- `node server.js` — serve the static site on port 5000

## Stack

- Pure static HTML, CSS, JavaScript (ES6+)
- No build step — files served directly
- Data persistence: browser `localStorage`
- Server: lightweight Node.js HTTP server (`server.js`)

## Where things live

- `index.html` / `script.js` — login/register entry point
- `dashboard.html` / `dashboard.js` — main store with product listing, search, filters
- `admin.html` / `admin.js` — admin dashboard (stats, user/product/category management)
- `carrinho.html` / `carrinho.js` — cart and checkout
- `pedidos.html` / `pedidos.js` — order history
- `produto.html` / `produto.js` — product detail page
- `favoritos.html` / `favoritos.js` — favorites/wishlist
- `perfil.html` / `perfil.js` — user profile
- `vender.html` / `vender.js` — seller panel
- `styles.css` — global design system (dark mode, neon accents)

## Architecture decisions

- All data lives in `localStorage` with keys like `tech_users_v2`, `tech_products`, `tech_orders`
- Admin access: login with `admin@tech.com` and any password
- Multi-page app (MPA) — each feature is a separate HTML file
- No bundler or transpiler — vanilla JS served directly
- `server.js` is a minimal Node.js HTTP file server on port 5000

## Product

TechStore is a fully client-side e-commerce demo for tech products. Users can browse, search, and filter products; manage a cart and place orders; leave reviews; manage favorites; and chat. Admins can manage users, products, and categories.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- All data is ephemeral per browser/device (localStorage only — no real database)
- Clearing browser storage resets all data
