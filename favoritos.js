function getLoggedUser() {
    const email = localStorage.getItem("loggedEmail");
    if (!email) return null;
    if (email === "admin@tech.com") return { email, role: "admin", name: "Admin" };
    const users = JSON.parse(localStorage.getItem("tech_users_v2")) || [];
    return users.find(u => u.email === email) || null;
}

function getFavorites() {
    const user = localStorage.getItem("loggedEmail");
    if (!user) return [];
    return JSON.parse(localStorage.getItem('tech_favs_' + user)) || [];
}

function saveFavorites(favs) {
    const user = localStorage.getItem("loggedEmail");
    if (!user) return;
    localStorage.setItem('tech_favs_' + user, JSON.stringify(favs));
}

function removeFavorite(id) {
    const favs = getFavorites().filter(p => p.id !== id);
    saveFavorites(favs);
    loadFavoritos();
    showToast("Produto removido dos favoritos.", "info");
}

function clearAllFavs() {
    if (!confirm("Remover todos os favoritos?")) return;
    saveFavorites([]);
    loadFavoritos();
    showToast("Todos os favoritos foram removidos.", "info");
}

function addToCart(product) {
    const cart = JSON.parse(localStorage.getItem('tech_cart')) || [];
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, qty: 1 });
    }
    localStorage.setItem('tech_cart', JSON.stringify(cart));
    updateCartBadge();
    showToast(`${product.name} adicionado ao carrinho! 🛒`, "success");
}

function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('tech_cart')) || [];
    const total = cart.reduce((sum, item) => sum + item.qty, 0);
    const badge = document.getElementById("cartBadge");
    if (badge) {
        badge.innerText = total;
        badge.style.display = total > 0 ? "flex" : "none";
    }
}

function logout() {
    localStorage.removeItem('loggedEmail');
    window.location.href = "index.html";
}

function loadFavoritos() {
    const user = getLoggedUser();
    if (!user) { window.location.href = "index.html"; return; }

    updateCartBadge();

    const favs = getFavorites();
    const grid = document.getElementById("favGrid");
    const emptyEl = document.getElementById("emptyFavs");
    const clearBtn = document.getElementById("btnClearFavs");
    const subtitle = document.getElementById("favSubtitle");

    if (favs.length === 0) {
        grid.innerHTML = "";
        emptyEl.style.display = "block";
        clearBtn.style.display = "none";
        subtitle.innerText = "Seus produtos salvos aparecem aqui";
        return;
    }

    emptyEl.style.display = "none";
    clearBtn.style.display = "inline-flex";
    subtitle.innerText = `${favs.length} produto${favs.length !== 1 ? 's' : ''} salvos`;

    grid.innerHTML = favs.map(p => `
        <div class="fav-card">
            <button class="fav-remove-btn" onclick="removeFavorite(${p.id})" title="Remover dos favoritos">❤️</button>
            <div class="fav-cat-badge">${p.category || 'Geral'}</div>
            <img src="${p.image}" alt="${p.name}" onerror="this.src='https://placehold.co/280x200/0d0d14/333?text=Imagem'" onclick="verProduto(${JSON.stringify(p).replace(/"/g, '&quot;')})">
            <h3 onclick="verProduto(${JSON.stringify(p).replace(/"/g, '&quot;')})">${p.name}</h3>
            <span class="fav-price">R$ ${Number(p.price).toLocaleString('pt-BR', {minimumFractionDigits:2})}</span>
            <div class="fav-actions">
                <button class="btn-add-cart" onclick='addToCart(${JSON.stringify(p)})'>🛒 Adicionar ao Carrinho</button>
                <button class="btn-view" onclick='verProduto(${JSON.stringify(p).replace(/'/g, "\\'")} )'>Ver Produto</button>
            </div>
        </div>
    `).join('');
}

function verProduto(p) {
    localStorage.setItem('produtoVisualizado', JSON.stringify(p));
    window.location.href = "produto.html";
}
