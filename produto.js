let currentProduct = null;
let qty = 1;
let selectedStars = 0;

function getLoggedUser() {
    const email = localStorage.getItem("loggedEmail");
    if (!email) return null;
    if (email === "admin@tech.com") return { email, role: "admin", name: "Admin" };
    const users = JSON.parse(localStorage.getItem("tech_users_v2")) || [];
    return users.find(u => u.email === email) || null;
}

/* ---- FAVORITES ---- */
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
function updateFavBtn() {
    const btn = document.getElementById("favToggleBtn");
    if (!btn || !currentProduct) return;
    const favs = getFavorites();
    const isFav = favs.some(f => f.id === currentProduct.id);
    btn.innerHTML = isFav ? '❤️ Nos Favoritos' : '🤍 Adicionar aos Favoritos';
    btn.className = 'fav-toggle-btn' + (isFav ? ' active' : '');
}
function toggleFavorite() {
    if (!currentProduct) return;
    let favs = getFavorites();
    const idx = favs.findIndex(f => f.id === currentProduct.id);
    if (idx !== -1) {
        favs.splice(idx, 1);
        showToast(`${currentProduct.title} removido dos favoritos.`, "info", 2500);
    } else {
        favs.push({
            id: currentProduct.id,
            name: currentProduct.title,
            price: currentProduct.price,
            image: currentProduct.images[0],
            category: currentProduct.category || 'Geral'
        });
        showToast(`${currentProduct.title} adicionado aos favoritos! ❤️`, "success", 2500);
    }
    saveFavorites(favs);
    updateFavBtn();
}

/* ---- LOAD PRODUCT ---- */
function loadProduct() {
    const produtoSalvo = JSON.parse(localStorage.getItem('produtoVisualizado'));

    currentProduct = {
        id: produtoSalvo ? produtoSalvo.id : 99,
        title: produtoSalvo ? produtoSalvo.name : "Console PlayStation 5 Slim",
        price: produtoSalvo ? produtoSalvo.price : 3799.90,
        category: produtoSalvo ? (produtoSalvo.category || 'Geral') : 'Geral',
        stock: produtoSalvo ? (produtoSalvo.stock || 0) : 0,
        condition: produtoSalvo ? (produtoSalvo.condition || 'Novo') : 'Novo',
        images: produtoSalvo
            ? (Array.isArray(produtoSalvo.images) && produtoSalvo.images.length > 0
                ? produtoSalvo.images
                : [produtoSalvo.image])
            : ["https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=500&auto=format&fit=crop"],
        features: produtoSalvo && produtoSalvo.features ? produtoSalvo.features : [
            "Produto original de alta qualidade",
            "Garantia de 1 ano com o fabricante",
            "Envio imediato via DreamStore Envios",
            "Satisfação 100% garantida"
        ]
    };

    document.getElementById("pTitle").innerText = currentProduct.title;
    document.getElementById("pPrice").innerText = currentProduct.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    document.title = `DreamStore | ${currentProduct.title}`;

    const stockEl = document.getElementById("pStock");
    if (stockEl) {
        const s = currentProduct.stock || 0;
        stockEl.innerHTML = s > 0
            ? `<span style="color:#00ff88;">📦 ${s} em estoque</span>`
            : `<span style="color:#ff4466;">🔴 Esgotado</span>`;
    }
    const condEl = document.getElementById("pCondition");
    if (condEl) condEl.innerText = currentProduct.condition || "Novo";

    const thumbContainer = document.getElementById("thumbContainer");
    const mainImg = document.getElementById("mainImg");
    thumbContainer.innerHTML = "";
    mainImg.src = currentProduct.images[0];
    mainImg.onerror = () => { mainImg.src = "https://placehold.co/400x300/111/333?text=Produto"; };

    currentProduct.images.forEach((imgSrc, index) => {
        const img = document.createElement("img");
        img.src = imgSrc;
        if (index === 0) img.classList.add("active");
        img.onerror = () => { img.src = "https://placehold.co/60x60/1a1a1a/333?text=IMG"; };
        img.onclick = () => {
            mainImg.src = imgSrc;
            document.querySelectorAll(".thumbnails img").forEach(t => t.classList.remove("active"));
            img.classList.add("active");
        };
        thumbContainer.appendChild(img);
    });

    const featuresList = document.getElementById("featuresList");
    featuresList.innerHTML = "";
    currentProduct.features.forEach(f => {
        const li = document.createElement("li");
        li.innerText = f;
        featuresList.appendChild(li);
    });

    updateFavBtn();
    renderReviews();
    updateCartBadge();
}

/* ---- CART ---- */
function changeQty(delta) {
    const stock = currentProduct ? (currentProduct.stock || 0) : 0;
    qty = Math.max(1, Math.min(qty + delta, stock));
    document.getElementById("qtyValue").innerText = qty;
}

function addToCart() {
    if (!currentProduct) return;
    const cart = JSON.parse(localStorage.getItem('tech_cart')) || [];
    const existing = cart.find(item => item.id === currentProduct.id);
    const currentQty = existing ? existing.qty : 0;
    const stock = currentProduct.stock || 0;

    if (stock <= 0) {
        showToast("🔴 Produto esgotado! Não há unidades disponíveis.", "error", 3000);
        return;
    }
    if (currentQty + qty > stock) {
        showToast(`📦 Só temos ${stock} unidades em estoque. Você já tem ${currentQty} no carrinho.`, "error", 3000);
        return;
    }

    if (existing) { existing.qty += qty; }
    else {
        cart.push({ id: currentProduct.id, name: currentProduct.title, price: currentProduct.price, image: currentProduct.images[0], qty });
    }
    localStorage.setItem('tech_cart', JSON.stringify(cart));
    updateCartBadge();
    showToast(`${qty} × ${currentProduct.title} adicionado ao carrinho! 🛒`, "success", 2500);
}

function buyNow() { addToCart(); window.location.href = "carrinho.html"; }

function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('tech_cart')) || [];
    const total = cart.reduce((sum, item) => sum + item.qty, 0);
    const badge = document.getElementById("cartBadge");
    badge.innerText = total;
    badge.style.display = total > 0 ? "flex" : "none";
}

/* ============================
   REVIEWS SYSTEM
   ============================ */
function getStorageKey() { return 'tech_reviews_' + currentProduct.id; }

function renderReviews() {
    const reviews = JSON.parse(localStorage.getItem(getStorageKey())) || [];
    const listEl = document.getElementById("reviewsList");
    const avgEl = document.getElementById("avgRating");

    if (reviews.length === 0) {
        listEl.innerHTML = `<p style="color:#444;font-size:14px;padding:10px 0;">Ainda não há avaliações. Seja o primeiro!</p>`;
        avgEl.innerHTML = "";
        return;
    }

    const avg = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
    const fullStars = Math.round(avg);

    avgEl.innerHTML = `
        <div class="avg-stars">${'★'.repeat(fullStars)}${'☆'.repeat(5 - fullStars)}</div>
        <span class="avg-num">${avg}</span>
        <span class="avg-count">(${reviews.length} avaliação${reviews.length > 1 ? 'ões' : ''})</span>
    `;

    listEl.innerHTML = reviews.slice().reverse().map(r => `
        <div class="review-item">
            <div class="review-meta">
                <span class="review-author">${r.name || "Usuário Anônimo"}</span>
                <span class="review-date">${r.date}</span>
            </div>
            <div class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
            <p class="review-text">"${r.text}"</p>
        </div>
    `).join('');
}

function selectStar(val) {
    selectedStars = val;
    const labels = ["", "Ruim 😞", "Regular 😐", "Bom 🙂", "Ótimo 😊", "Excelente! 🤩"];
    document.getElementById("starLabel").innerText = labels[val];
    document.querySelectorAll(".star-opt").forEach((el, i) => {
        el.classList.toggle("active", i < val);
    });
}

function submitReview() {
    const text = document.getElementById("reviewText").value.trim();
    const name = document.getElementById("reviewName").value.trim();

    if (!selectedStars) {
        showToast("Selecione uma nota (estrelas) antes de enviar.", "error");
        return;
    }
    if (!text) {
        showToast("Escreva algo na sua avaliação.", "error");
        return;
    }

    const reviews = JSON.parse(localStorage.getItem(getStorageKey())) || [];
    reviews.push({
        rating: selectedStars,
        text,
        name: name || "Usuário Anônimo",
        date: new Date().toLocaleDateString('pt-BR')
    });
    localStorage.setItem(getStorageKey(), JSON.stringify(reviews));

    document.getElementById("reviewText").value = "";
    document.getElementById("reviewName").value = "";
    selectedStars = 0;
    document.querySelectorAll(".star-opt").forEach(el => el.classList.remove("active"));
    document.getElementById("starLabel").innerText = "Selecione uma nota";

    showToast("Avaliação publicada! Obrigado pelo feedback. ⭐", "success", 3500);
    renderReviews();
}

window.onload = loadProduct;
