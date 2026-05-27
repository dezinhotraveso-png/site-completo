const produtosPadrao = []; // Limpo — produtos serão criados pelo admin/vendedor

let products = [];
let activeCategory = "Todos";
let compareList = [];
let searchQuery = "";
let sortOrder = "default";

/* ---- HELPERS ---- */
function getUsers() { return JSON.parse(localStorage.getItem("tech_users_v2")) || []; }
function getLoggedUser() {
    const email = localStorage.getItem("loggedEmail");
    if (!email) return null;
    if (email === "admin@tech.com") return { email, role: "admin", name: "Admin" };
    return getUsers().find(u => u.email === email) || null;
}

/* ---- FAVORITES ---- */
function getFavorites() {
    const user = localStorage.getItem("loggedEmail");
    if (!user) return [];
    try { return JSON.parse(localStorage.getItem('tech_favs_' + user)) || []; } catch(e) { return []; }
}
function saveFavorites(favs) {
    const user = localStorage.getItem("loggedEmail");
    if (!user) return;
    localStorage.setItem('tech_favs_' + user, JSON.stringify(favs));
}
function isFavorite(id) { return getFavorites().some(p => p.id === id); }
function toggleFavorite(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    let favs = getFavorites();
    const existing = favs.findIndex(f => f.id === id);
    if (existing !== -1) {
        favs.splice(existing, 1);
        showToast(`${p.name} removido dos favoritos.`, "info", 2500);
    } else {
        favs.push(p);
        showToast(`${p.name} adicionado aos favoritos! ❤️`, "success", 2500);
    }
    saveFavorites(favs);
    updateFavsBadge();
    renderProducts();
    renderRecommendations();
}
function updateFavsBadge() {
    const favs = getFavorites();
    const el = document.getElementById("favsNavCount");
    if (!el) return;
    el.innerText = favs.length;
    el.style.display = favs.length > 0 ? "inline-flex" : "none";
}

/* ============================
   INIT
   ============================ */
function initDashboard() {
    const loggedUser = getLoggedUser();
    if (!loggedUser) { window.location.href = "index.html"; return; }

    const greeting = document.getElementById("userGreeting");
    if (greeting) greeting.innerText = `Olá, ${loggedUser.name || loggedUser.email.split('@')[0]} 👋`;

    const roleTag = document.getElementById("userRoleTag");
    const btnAdmin = document.getElementById("btnAdminPanel");
    const btnAdd = document.getElementById("btnAddProduct");
    const adminPanel = document.getElementById("adminPanel");

    if (loggedUser.role === "admin") {
        if (roleTag) { roleTag.innerText = "Admin"; roleTag.style.display = "inline-block"; }
        if (btnAdmin) btnAdmin.style.display = "inline-flex";
        const btnUpdates = document.getElementById("btnUpdates");
        if (btnUpdates) btnUpdates.style.display = "inline-flex";
        if (btnAdd) btnAdd.style.display = "inline-flex";
    } else if (loggedUser.role === "seller") {
        if (roleTag) { roleTag.innerText = "Vendedor"; roleTag.style.display = "inline-block"; }
        if (btnAdd) btnAdd.style.display = "inline-flex";
    }

    /* Load products — safe with try/catch */
    try {
        const raw = localStorage.getItem('tech_products');
        const saved = raw ? JSON.parse(raw) : [];
        products = Array.isArray(saved) ? saved : [];
    } catch(e) {
        products = [];
    }
    if (products.length === 0) {
        localStorage.setItem('tech_products', JSON.stringify([]));
    }

    renderProducts();
    renderRecommendations();
    updateCartBadge();
    updateFavsBadge();
}

function updateCartBadge() {
    try {
        const cart = JSON.parse(localStorage.getItem('tech_cart')) || [];
        const total = cart.reduce((sum, item) => sum + item.qty, 0);
        const badge = document.getElementById("cartBadge");
        if (!badge) return;
        badge.innerText = total;
        badge.style.display = total > 0 ? "inline-flex" : "none";
    } catch(e) {}
}

/* ============================
   CATEGORY DRAWER
   ============================ */
function openCatDrawer() {
    document.getElementById("catDrawer").classList.add("open");
    document.getElementById("catOverlay").classList.add("show");
    document.body.style.overflow = "hidden";
}
function closeCatDrawer() {
    document.getElementById("catDrawer").classList.remove("open");
    document.getElementById("catOverlay").classList.remove("show");
    document.body.style.overflow = "";
}

/* ============================
   RECOMMENDATIONS CAROUSEL
   ============================ */
function renderRecommendations() {
    const track = document.getElementById("recsTrack");
    if (!track || products.length === 0) return;

    const lastViewed = (() => { try { return JSON.parse(localStorage.getItem('produtoVisualizado')); } catch(e) { return null; } })();

    let pool;
    if (lastViewed) {
        const sameCat = products.filter(p => p.category === lastViewed.category && p.id !== lastViewed.id);
        const other = products.filter(p => p.category !== lastViewed.category);
        pool = [...sameCat, ...other];
    } else {
        pool = [...products].sort(() => Math.random() - 0.5);
    }

    const recs = pool.slice(0, 12);
    track.innerHTML = recs.map(p => {
        const fav = isFavorite(p.id);
        return `
            <div class="rec-card">
                <button class="rec-heart ${fav ? 'active' : ''}" onclick="toggleFavorite(${p.id})" title="${fav ? 'Remover dos favoritos' : 'Favoritar'}">
                    ${fav ? '❤️' : '🤍'}
                </button>
                <img src="${p.image}" alt="${p.name}" onclick="verProduto(${p.id})" onerror="this.src='https://placehold.co/200x140/0d0d14/333?text=IMG'">
                <div class="rec-info" onclick="verProduto(${p.id})">
                    <span class="rec-cat">${p.category}</span>
                    <h4>${p.name}</h4>
                    <span class="rec-price">R$ ${p.price.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span>
                </div>
                <button class="rec-cart-btn" onclick="addToCartQuick(${p.id})">🛒 Adicionar</button>
            </div>
        `;
    }).join('');
}

function scrollRecs(dir) {
    const track = document.getElementById("recsTrack");
    if (track) track.scrollBy({ left: dir * 440, behavior: 'smooth' });
}

function addToCartQuick(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    const stock = p.stock || 0;
    if (stock <= 0) { showToast("🔴 Produto esgotado!", "error", 2500); return; }
    try {
        const cart = JSON.parse(localStorage.getItem('tech_cart')) || [];
        const existing = cart.find(item => item.id === p.id);
        if (existing) {
            if (existing.qty + 1 > stock) { showToast(`📦 Só temos ${stock} unidades em estoque.`, "error", 2500); return; }
            existing.qty += 1;
        }
        else { cart.push({ id: p.id, name: p.name, price: p.price, image: p.image, qty: 1 }); }
        localStorage.setItem('tech_cart', JSON.stringify(cart));
    } catch(e) {}
    updateCartBadge();
    showToast(`${p.name} adicionado ao carrinho! 🛒`, "success", 2500);
}

/* ============================
   SEARCH / SORT / CATEGORY
   ============================ */
function searchProducts() {
    const input = document.getElementById("searchInput");
    searchQuery = input.value.trim().toLowerCase();
    document.getElementById("searchClear").style.display = searchQuery ? "flex" : "none";
    renderProducts();
}
function clearSearch() {
    document.getElementById("searchInput").value = "";
    searchQuery = "";
    document.getElementById("searchClear").style.display = "none";
    document.getElementById("searchInfo").innerHTML = "";
    renderProducts();
}
function setSort(order) {
    sortOrder = order;
    document.querySelectorAll(".sort-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.sort === order));
    renderProducts();
}
function setCategory(cat) {
    activeCategory = cat;
    searchQuery = "";
    const inp = document.getElementById("searchInput");
    if (inp) inp.value = "";
    document.getElementById("searchClear").style.display = "none";
    document.getElementById("searchInfo").innerHTML = "";

    /* Update drawer buttons */
    document.querySelectorAll(".cat-drawer-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.cat === cat));

    /* Update hamburger label */
    const catLabels = {
        Todos: "Todas as categorias", Teclados: "⌨️ Teclados", Mouses: "🖱️ Mouses",
        Monitores: "🖥️ Monitores", Headsets: "🎧 Headsets", Smartwatches: "⌚ Smartwatches",
        Notebooks: "💻 Notebooks", "Periféricos": "🕹️ Periféricos", Setups: "🖥️ Setups"
    };
    const labelEl = document.getElementById("activeCatLabel");
    if (labelEl) labelEl.innerText = catLabels[cat] || cat;

    closeCatDrawer();
    renderProducts();
}

/* ============================
   RENDER PRODUCTS
   ============================ */
function getProductAvg(productId) {
    try {
        const reviews = JSON.parse(localStorage.getItem('tech_reviews_' + productId)) || [];
        if (!reviews.length) return null;
        return { avg: (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1), count: reviews.length };
    } catch(e) { return null; }
}

function renderProducts() {
    const grid = document.getElementById("productGrid");
    if (!grid) return;

    let filtered = activeCategory === "Todos" ? [...products] : products.filter(p => p.category === activeCategory);

    if (searchQuery) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery));
        const infoEl = document.getElementById("searchInfo");
        if (infoEl) {
            infoEl.innerHTML = filtered.length === 0
                ? `<span class="search-no-result">Nenhum produto encontrado para "<strong>${searchQuery}</strong>"</span>`
                : `<span class="search-result-count"><strong>${filtered.length}</strong> resultado${filtered.length !== 1 ? 's' : ''} para "<strong>${searchQuery}</strong>"</span>`;
        }
    }

    if (sortOrder === "asc") filtered.sort((a, b) => a.price - b.price);
    else if (sortOrder === "desc") filtered.sort((a, b) => b.price - a.price);

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="empty-cat"><p>${searchQuery ? 'Nenhum produto encontrado.' : 'Nenhum produto nessa categoria ainda.'}</p></div>`;
        return;
    }

    grid.innerHTML = "";
    filtered.forEach(p => {
        const rating = getProductAvg(p.id);
        const ratingHtml = rating
            ? `<div class="card-avg">${'★'.repeat(Math.round(rating.avg))}${'☆'.repeat(5 - Math.round(rating.avg))} <span>(${rating.count})</span></div>`
            : `<div class="card-avg no-rating">Sem avaliações</div>`;
        const fav = isFavorite(p.id);
        const inCompare = compareList.some(c => c.id === p.id);

        const card = document.createElement("div");
        card.className = `product-card ${inCompare ? 'in-compare' : ''}`;
        card.id = `pcard-${p.id}`;
        card.innerHTML = `
            <div class="card-category-badge">${p.category || 'Geral'}</div>
            <button class="card-heart-btn ${fav ? 'active' : ''}" onclick="toggleFavorite(${p.id})" title="${fav ? 'Remover dos favoritos' : 'Favoritar'}">
                ${fav ? '❤️' : '🤍'}
            </button>
            <div onclick="verProduto(${p.id})" style="cursor:pointer">
                <img src="${p.image}" alt="${p.name}" onerror="this.src='https://placehold.co/280x200/0d0d14/333?text=Imagem'">
                <h3>${p.name}</h3>
            </div>
            ${ratingHtml}
            <span class="price">R$ ${p.price.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span>
            <span class="stock-badge">${(p.stock || 0) > 0 ? `<span style="color:#00ff88;font-size:11px;">📦 ${p.stock} em estoque</span>` : `<span style="color:#ff4466;font-size:11px;">🔴 Esgotado</span>`}</span>
            <div class="card-btns">
                <button class="btn-buy" onclick="verProduto(${p.id})">👁 Ver Produto</button>
                <button class="btn-compare-add ${inCompare ? 'added' : ''}" onclick="toggleCompare(${p.id})">
                    ${inCompare ? '✓ Comparando' : '⚖️ Comparar'}
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

/* ---- Navigate to product ---- */
function verProduto(id) {
    const p = products.find(x => x.id === id);
    if (!p) { showToast("Produto não encontrado.", "error"); return; }
    try { localStorage.setItem('produtoVisualizado', JSON.stringify(p)); } catch(e) {}
    window.location.href = "produto.html";
}

function logout() { localStorage.removeItem('loggedEmail'); window.location.href = "index.html"; }

function addProduct() {
    const name  = document.getElementById("pName").value.trim();
    const price = parseFloat(document.getElementById("pPrice").value);
    const image = document.getElementById("pImage").value.trim();
    const cat   = document.getElementById("pCategory").value;
    if (!name || !price || !image || cat === "Todos") {
        showToast("Preencha todos os campos e selecione uma categoria.", "error"); return;
    }
    products.push({ id: Date.now(), name, price, image, category: cat });
    localStorage.setItem('tech_products', JSON.stringify(products));
    renderProducts();
    document.getElementById("pName").value = "";
    document.getElementById("pPrice").value = "";
    document.getElementById("pImage").value = "";
    showToast(`${name} adicionado à loja! ✅`, "success");
}

/* ============================
   COMPARISON
   ============================ */
function toggleCompare(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    const idx = compareList.findIndex(c => c.id === id);
    if (idx !== -1) { compareList.splice(idx, 1); }
    else {
        if (compareList.length >= 4) { showToast("Máximo de 4 produtos para comparar!", "warning"); return; }
        compareList.push(p);
    }
    updateTray();
    renderProducts();
}
function updateTray() {
    const tray = document.getElementById("compareTray");
    const btnNow = document.getElementById("btnCompareNow");
    if (!tray) return;
    if (compareList.length === 0) { tray.style.display = "none"; return; }
    tray.style.display = "block";
    document.getElementById("trayCount").innerText = `${compareList.length}/4`;
    if (btnNow) btnNow.disabled = compareList.length < 2;
    for (let i = 0; i < 4; i++) {
        const slot = document.getElementById("slot" + i);
        if (!slot) continue;
        if (compareList[i]) {
            const cp = compareList[i];
            slot.className = "tray-slot filled";
            slot.innerHTML = `
                <img src="${cp.image}" alt="${cp.name}" onerror="this.src='https://placehold.co/44x44/1a1a1a/333?text=IMG'">
                <span class="tray-slot-name">${cp.name}</span>
                <button class="tray-slot-remove" onclick="removeFromTray(${cp.id})">✕</button>
            `;
        } else {
            slot.className = "tray-slot empty";
            slot.innerHTML = "<span>+ Adicionar</span>";
        }
    }
}
function removeFromTray(id) { compareList = compareList.filter(c => c.id !== id); updateTray(); renderProducts(); }
function clearTray() { compareList = []; updateTray(); renderProducts(); }
function openComparison() {
    if (compareList.length < 2) return;
    const grid = document.getElementById("compareGrid");
    grid.style.gridTemplateColumns = `repeat(${compareList.length}, 1fr)`;
    grid.innerHTML = compareList.map(p => {
        const rating = getProductAvg(p.id);
        const rHtml = rating ? `${rating.avg} ⭐ (${rating.count})` : "Sem avaliações";
        return `
            <div class="compare-col">
                <div class="compare-cat-badge">${p.category}</div>
                <img src="${p.image}" alt="${p.name}" onerror="this.src='https://placehold.co/200x160/0d0d14/333?text=IMG'">
                <h3>${p.name}</h3>
                <div class="compare-price">R$ ${p.price.toLocaleString('pt-BR', {minimumFractionDigits:2})}</div>
                <div class="compare-rating">${rHtml}</div>
                <div class="compare-row"><div class="compare-row-label">Frete</div><div class="compare-row-val" style="color:#00ff88">🚚 Grátis</div></div>
                <div class="compare-row"><div class="compare-row-label">Parcelamento</div><div class="compare-row-val">10x sem juros</div></div>
                <div class="compare-row"><div class="compare-row-label">PIX Desconto</div><div class="compare-row-val" style="color:#00ff88">R$ ${(p.price*0.05).toLocaleString('pt-BR',{minimumFractionDigits:2})} OFF</div></div>
                <button class="btn-compare-buy" onclick="verProduto(${p.id})">Ver Produto</button>
            </div>
        `;
    }).join('');
    document.getElementById("compareModal").classList.add("active");
}
function closeComparison() { document.getElementById("compareModal").classList.remove("active"); }

window.onclick = function(e) {
    if (e.target === document.getElementById("compareModal")) closeComparison();
};
