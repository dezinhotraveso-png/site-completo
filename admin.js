/* ---- CUSTOM CONFIRM MODAL ---- */
function customConfirm(title, msg, icon, onConfirm) {
    const modal = document.getElementById("confirmModal");
    document.getElementById("confirmTitle").innerText = title;
    document.getElementById("confirmMsg").innerText = msg;
    document.getElementById("confirmIcon").innerText = icon || "⚠️";
    modal.style.display = "flex";

    const okBtn = document.getElementById("confirmOk");
    const cancelBtn = document.getElementById("confirmCancel");

    function close() {
        modal.style.display = "none";
        okBtn.removeEventListener("click", handleOk);
        cancelBtn.removeEventListener("click", handleCancel);
    }
    function handleOk() { close(); onConfirm(); }
    function handleCancel() { close(); }

    okBtn.addEventListener("click", handleOk);
    cancelBtn.addEventListener("click", handleCancel);
    modal.addEventListener("click", function(e) { if (e.target === modal) handleCancel(); }, { once: true });
}

function getUsers() { return JSON.parse(localStorage.getItem("tech_users_v2")) || []; }
function saveUsers(users) { localStorage.setItem("tech_users_v2", JSON.stringify(users)); }
function getLoggedUser() {
    const email = localStorage.getItem("loggedEmail");
    if (!email) return null;
    if (email === "admin@tech.com") return { email, role: "admin", name: "Admin" };
    return getUsers().find(u => u.email === email) || null;
}

function initAdmin() {
    const user = getLoggedUser();
    if (!user) { window.location.href = "index.html"; return; }
    if (user.role !== "admin") {
        showToast("❌ Acesso restrito ao administrador.", "error");
        setTimeout(() => window.location.href = "dashboard.html", 1500);
        return;
    }
    loadStats();
    renderUsers();
}

function loadStats() {
    const users = getUsers();
    const products = JSON.parse(localStorage.getItem("tech_products")) || [];
    const orders = JSON.parse(localStorage.getItem("tech_orders")) || [];

    const revenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const pendingRefunds = orders.filter(o => o.status === "reembolso_solicitado").length;

    document.getElementById("statUsers").innerText = users.length;
    document.getElementById("statSellers").innerText = users.filter(u => u.role === "seller").length;
    document.getElementById("statProducts").innerText = products.length;
    document.getElementById("statOrders").innerText = orders.length;
    document.getElementById("statRevenue").innerText = "R$ " + revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    document.getElementById("statRefunds").innerText = pendingRefunds;

    const refundCard = document.querySelector(".stat-refunds");
    if (refundCard) {
        refundCard.style.borderColor = pendingRefunds > 0 ? "rgba(255,153,0,0.35)" : "rgba(255,255,255,0.06)";
        if (pendingRefunds > 0) refundCard.style.background = "rgba(255,153,0,0.04)";
    }
}

function showAdminTab(tab) {
    document.querySelectorAll(".admin-tab-content").forEach(el => el.style.display = "none");
    document.querySelectorAll(".admin-tab").forEach(el => el.classList.remove("active"));
    document.getElementById("tab-" + tab).style.display = "block";
    event.target.classList.add("active");

    if (tab === "users")      renderUsers();
    if (tab === "products")   renderProducts();
    if (tab === "orders")     renderOrders();
    if (tab === "analytics")  renderAnalytics();
    if (tab === "categories") renderCategories();
}

/* ---- USERS ---- */
function renderUsers() {
    const query = (document.getElementById("userSearch")?.value || "").toLowerCase();
    let users = getUsers();
    if (query) users = users.filter(u => u.email.toLowerCase().includes(query) || (u.name || "").toLowerCase().includes(query));

    const list = document.getElementById("usersList");
    if (users.length === 0) {
        list.innerHTML = `<div class="empty-state"><p>Nenhum usuário cadastrado ainda.<br><small>Os usuários aparecem aqui após se registrar.</small></p></div>`;
        return;
    }

    list.innerHTML = users.map(u => `
        <div class="user-row">
            <div class="user-avatar">${(u.name || u.email)[0].toUpperCase()}</div>
            <div class="user-info">
                <div class="user-name">${u.name || "—"}</div>
                <div class="user-email">${u.email}</div>
                <div class="user-meta">Cadastrado em: ${u.createdAt || "—"}</div>
            </div>
            <div class="user-role-area">
                <span class="role-pill ${u.role}">${roleName(u.role)}</span>
                <div class="user-actions">
                    ${u.role === "user" ? `<button class="btn-grant" onclick="setRole('${u.email}', 'seller')">🏪 Tornar Vendedor</button>` : ""}
                    ${u.role === "seller" ? `<button class="btn-revoke" onclick="setRole('${u.email}', 'user')">↩ Remover Permissão</button>` : ""}
                </div>
            </div>
        </div>
    `).join('');
}

function roleName(role) {
    return { user: "👤 Usuário", seller: "🏪 Vendedor", admin: "⚙️ Admin" }[role] || role;
}

function setRole(email, newRole) {
    const users = getUsers();
    const u = users.find(x => x.email === email);
    if (!u) return;
    u.role = newRole;
    saveUsers(users);
    showToast(`Papel de ${email} atualizado para ${roleName(newRole)}.`, "success");
    loadStats();
    renderUsers();
}

/* ---- PRODUCTS ---- */
function renderProducts() {
    const query = (document.getElementById("productSearch")?.value || "").toLowerCase();
    let products = JSON.parse(localStorage.getItem("tech_products")) || [];
    if (query) products = products.filter(p => p.name.toLowerCase().includes(query) || (p.category || "").toLowerCase().includes(query));

    const list = document.getElementById("productsList");
    const countEl = document.getElementById("productCount");
    if (countEl) countEl.innerText = `(${products.length})`;

    if (products.length === 0) {
        list.innerHTML = `<div class="empty-state"><p>📭 Nenhum produto cadastrado ainda.</p></div>`;
        return;
    }

    list.innerHTML = products.map(p => `
        <div class="product-row">
            <img src="${p.image}" alt="${p.name}" onerror="this.src='https://placehold.co/70x70/111/333?text=IMG'">
            <div class="product-info">
                <div class="product-name">${p.name}</div>
                <div class="product-meta">
                    <span class="cat-pill">${p.category || "Geral"}</span>
                    <span class="product-price">R$ ${Number(p.price).toLocaleString('pt-BR', {minimumFractionDigits:2})}</span>
                    <span class="stock-pill" style="background:${(p.stock||0)>0?'rgba(0,255,136,0.12)':'rgba(255,68,102,0.12)'};color:${(p.stock||0)>0?'#00ff88':'#ff4466'};padding:2px 8px;border-radius:6px;font-size:11px;">📦 ${p.stock || 0} em estoque</span>
                    ${p.sellerName ? `<span class="seller-tag">por ${p.sellerName}</span>` : ""}
                </div>
            </div>
            <div class="product-row-actions">
                <button class="btn-edit-product" onclick="adminOpenEdit(${p.id})">✏️ Editar</button>
                <button class="btn-delete-product" onclick="deleteProduct(${p.id})">🗑 Remover</button>
            </div>
        </div>
    `).join('');
}

function deleteAllProducts() {
    const countBefore = (JSON.parse(localStorage.getItem("tech_products")) || []).length;
    if (countBefore === 0) {
        showToast("Não há produtos para apagar.", "info");
        return;
    }
    customConfirm(
        "Apagar todos os produtos?",
        `Isso vai remover permanentemente todos os ${countBefore} produto${countBefore !== 1 ? 's' : ''} da loja. Esta ação não pode ser desfeita.`,
        "🗑️",
        function() {
            localStorage.setItem("tech_products", JSON.stringify([]));
            showToast("🗑 Todos os produtos foram removidos!", "info", 3500);
            loadStats();
            renderProducts();
            if (window.botNotify) {
                window.botNotify(`📋 <strong>Ação do Admin:</strong> ${countBefore} produto${countBefore !== 1 ? 's' : ''} apagado${countBefore !== 1 ? 's' : ''} da loja. O catálogo está vazio agora. Aguardando novos cadastros...`);
            }
        }
    );
}

function deleteProduct(id) {
    let products = JSON.parse(localStorage.getItem("tech_products")) || [];
    const product = products.find(p => p.id === id);
    const name = product?.name || "Produto";
    customConfirm(
        "Remover produto?",
        `"${name}" será removido permanentemente da loja.`,
        "🗑️",
        function() {
            products = products.filter(p => p.id !== id);
            localStorage.setItem("tech_products", JSON.stringify(products));
            showToast(`${name} removido com sucesso.`, "info");
            loadStats();
            renderProducts();
        }
    );
}

/* ---- EDITAR PRODUTO (ADMIN) ---- */
function adminOpenEdit(id) {
    const products = JSON.parse(localStorage.getItem("tech_products")) || [];
    const p = products.find(x => x.id === id);
    if (!p) return;

    document.getElementById("adminEditId").value = id;
    document.getElementById("adminEditName").value = p.name;
    document.getElementById("adminEditPrice").value = p.price;
    document.getElementById("adminEditStock").value = p.stock ?? 1;
    document.getElementById("adminEditCondition").value = p.condition || "Novo";

    const cats = JSON.parse(localStorage.getItem("tech_categories")) || [
        {name:"Teclados",emoji:"⌨️"},{name:"Mouses",emoji:"🖱️"},
        {name:"Monitores",emoji:"🖥️"},{name:"Headsets",emoji:"🎧"},
        {name:"Smartwatches",emoji:"⌚"},{name:"Notebooks",emoji:"💻"},
        {name:"Periféricos",emoji:"🕹️"},{name:"Setups",emoji:"🎮"}
    ];
    document.getElementById("adminEditCategory").innerHTML =
        '<option value="">Selecione...</option>' +
        cats.map(c => `<option value="${c.name}"${c.name===p.category?' selected':''}>${c.emoji} ${c.name}</option>`).join('');

    const feats = Array.isArray(p.features) ? p.features.join('\n') : (p.features || '');
    document.getElementById("adminEditFeatures").value = feats;

    const imgs = (p.images && p.images.length > 0) ? p.images : (p.image ? [p.image] : ['']);
    document.getElementById("adminEditImages").value = imgs.join('\n');

    document.getElementById("adminEditModal").style.display = "flex";
    document.body.style.overflow = "hidden";
}

function adminCloseEdit() {
    document.getElementById("adminEditModal").style.display = "none";
    document.body.style.overflow = "";
}

function adminCloseEditOverlay(e) {
    if (e.target === document.getElementById("adminEditModal")) adminCloseEdit();
}

function adminSaveEdit(e) {
    e.preventDefault();
    const id       = parseInt(document.getElementById("adminEditId").value);
    const name     = document.getElementById("adminEditName").value.trim();
    const price    = parseFloat(document.getElementById("adminEditPrice").value);
    const category = document.getElementById("adminEditCategory").value;
    const condition= document.getElementById("adminEditCondition").value;
    const stock    = parseInt(document.getElementById("adminEditStock").value) || 0;
    const featRaw  = document.getElementById("adminEditFeatures").value.trim();
    const imgsRaw  = document.getElementById("adminEditImages").value.trim();

    if (!name)  { showToast("Informe o nome do produto.", "error"); return; }
    if (!price || price <= 0) { showToast("Informe um preço válido.", "error"); return; }
    if (!category) { showToast("Selecione uma categoria.", "error"); return; }

    const features = featRaw ? featRaw.split('\n').map(f => f.trim()).filter(Boolean) : [];
    const images   = imgsRaw ? imgsRaw.split('\n').map(u => u.trim()).filter(Boolean) : [];

    if (images.length === 0) { showToast("Adicione ao menos uma URL de foto.", "error"); return; }

    let products = JSON.parse(localStorage.getItem("tech_products")) || [];
    products = products.map(p => p.id !== id ? p : {
        ...p, name, price, category, condition, stock, features,
        image: images[0], images
    });
    localStorage.setItem("tech_products", JSON.stringify(products));

    adminCloseEdit();
    loadStats();
    renderProducts();
    showToast("✅ Produto atualizado com sucesso!", "success", 2500);
}

/* ---- ORDERS ---- */
function renderOrders() {
    const orders = JSON.parse(localStorage.getItem("tech_orders")) || [];
    const list = document.getElementById("ordersList");
    if (orders.length === 0) {
        list.innerHTML = `<div class="empty-state"><p>Nenhum pedido registrado ainda.</p></div>`;
        return;
    }

    const statusColors = {
        processando: "#ffcc00", entregue: "#00ff88",
        cancelado: "#ff4466", reembolso_solicitado: "#ff9900", reembolsado: "#888"
    };
    const statusLabels = {
        processando: "Processando", entregue: "Entregue",
        cancelado: "Cancelado", reembolso_solicitado: "Reembolso Solicitado", reembolsado: "Reembolsado"
    };
    const payLabels = { pix: "💠 PIX", credito: "💳 Cartão", boleto: "📄 Boleto" };

    list.innerHTML = orders.slice().reverse().map(o => `
        <div class="order-row">
            <div class="order-info">
                <div class="order-id">Pedido #${o.id}</div>
                <div class="order-meta">
                    <span>👤 ${o.user || "—"}</span>
                    <span>📅 ${o.date}</span>
                    <span>${payLabels[o.payment] || o.payment || "—"}</span>
                </div>
                <div class="order-items-text">${o.items.map(i => `${i.name} ×${i.qty}`).join(' · ')}</div>
            </div>
            <div class="order-right">
                <span class="order-status-badge" style="color:${statusColors[o.status] || '#888'}">${statusLabels[o.status] || o.status}</span>
                <div class="order-total-val">R$ ${Number(o.total).toLocaleString('pt-BR', {minimumFractionDigits:2})}</div>
            </div>
        </div>
    `).join('');
}

/* ---- CATEGORIES ---- */
const DEFAULT_CATEGORIES = [
    { id: 1, name: "Teclados",     emoji: "⌨️" },
    { id: 2, name: "Mouses",       emoji: "🖱️" },
    { id: 3, name: "Monitores",    emoji: "🖥️" },
    { id: 4, name: "Headsets",     emoji: "🎧" },
    { id: 5, name: "Smartwatches", emoji: "⌚" },
    { id: 6, name: "Notebooks",    emoji: "💻" },
    { id: 7, name: "Periféricos",  emoji: "🕹️" },
    { id: 8, name: "Setups",       emoji: "🎮" },
];

function getCategories() {
    const stored = localStorage.getItem("tech_categories");
    if (!stored) { saveCategories(DEFAULT_CATEGORIES); return DEFAULT_CATEGORIES; }
    return JSON.parse(stored);
}
function saveCategories(cats) { localStorage.setItem("tech_categories", JSON.stringify(cats)); }

function countProductsInCat(name) {
    return (JSON.parse(localStorage.getItem("tech_products")) || []).filter(p => p.category === name).length;
}

function renderCategories() {
    const cats = getCategories();
    const list  = document.getElementById("catList");
    const count = document.getElementById("catCount");
    if (count) count.innerText = `(${cats.length})`;

    if (cats.length === 0) {
        list.innerHTML = `<div class="empty-state"><p>Nenhuma categoria cadastrada ainda.</p></div>`;
        return;
    }
    list.innerHTML = cats.map(c => {
        const n = countProductsInCat(c.name);
        return `
        <div class="cat-admin-row">
            <div class="cat-admin-emoji">${c.emoji}</div>
            <div class="cat-admin-info">
                <span class="cat-admin-name">${c.name}</span>
                <span class="cat-admin-count">${n} produto${n !== 1 ? 's' : ''}</span>
            </div>
            <button class="btn-delete-cat" onclick="deleteCategory(${c.id})" title="Excluir categoria">🗑</button>
        </div>`;
    }).join('');
}

function addCategory() {
    const nameInput  = document.getElementById("newCatName");
    const emojiInput = document.getElementById("newCatEmoji");
    const name  = nameInput.value.trim();
    const emoji = emojiInput.value.trim() || "📦";

    if (!name) { showToast("Digite o nome da categoria.", "warning"); nameInput.focus(); return; }

    const cats = getCategories();
    if (cats.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        showToast("Essa categoria já existe.", "warning"); return;
    }

    cats.push({ id: Date.now(), name, emoji });
    saveCategories(cats);
    nameInput.value  = "";
    emojiInput.value = "";
    renderCategories();
    showToast(`Categoria "${name}" criada! ✅`, "success");
}

function deleteCategory(id) {
    const cats = getCategories();
    const cat  = cats.find(c => c.id === id);
    if (!cat) return;
    const n = countProductsInCat(cat.name);
    customConfirm(
        `Excluir "${cat.name}"?`,
        n > 0
            ? `Essa categoria tem ${n} produto${n !== 1 ? 's' : ''}. Eles não serão excluídos, mas ficarão sem categoria.`
            : `A categoria "${cat.name}" será removida permanentemente.`,
        "🗑️",
        function() {
            saveCategories(cats.filter(c => c.id !== id));
            renderCategories();
            showToast(`Categoria "${cat.name}" removida.`, "info");
        }
    );
}

function resetDefaultCategories() {
    customConfirm(
        "Restaurar categorias padrão?",
        "Todas as categorias atuais serão substituídas pelas 8 categorias padrão da TechStore.",
        "🔄",
        function() {
            saveCategories(DEFAULT_CATEGORIES);
            renderCategories();
            showToast("Categorias restauradas para o padrão.", "success");
        }
    );
}

/* ---- ANALYTICS ---- */
function renderAnalytics() {
    const orders = JSON.parse(localStorage.getItem("tech_orders")) || [];
    const products = JSON.parse(localStorage.getItem("tech_products")) || [];

    /* Revenue by payment method */
    const revByPay = {};
    orders.forEach(o => {
        revByPay[o.payment] = (revByPay[o.payment] || 0) + (o.total || 0);
    });
    const payLabels = { pix: "💠 PIX", credito: "💳 Cartão", boleto: "📄 Boleto" };
    const payColors = { pix: "#00cc88", credito: "#3483fa", boleto: "#ff9900" };
    const maxRev = Math.max(...Object.values(revByPay), 1);
    document.getElementById("revenueByPayment").innerHTML = Object.keys(revByPay).length === 0
        ? `<p class="no-data">Nenhum pedido ainda.</p>`
        : Object.entries(revByPay).map(([k, v]) => `
            <div class="bar-row">
                <div class="bar-label">${payLabels[k] || k}</div>
                <div class="bar-track">
                    <div class="bar-fill" style="width:${(v/maxRev*100).toFixed(1)}%;background:${payColors[k] || '#555'}"></div>
                </div>
                <div class="bar-val">R$ ${v.toLocaleString('pt-BR', {minimumFractionDigits:2})}</div>
            </div>
        `).join('');

    /* Orders by status */
    const byStatus = {};
    orders.forEach(o => { byStatus[o.status] = (byStatus[o.status] || 0) + 1; });
    const statusLabels = { processando: "⏳ Processando", entregue: "✅ Entregue", cancelado: "❌ Cancelado", reembolso_solicitado: "🔄 Reembolso Pedido", reembolsado: "💸 Reembolsado" };
    const statusColors2 = { processando: "#ffcc00", entregue: "#00ff88", cancelado: "#ff4466", reembolso_solicitado: "#ff9900", reembolsado: "#888" };
    const maxSt = Math.max(...Object.values(byStatus), 1);
    document.getElementById("ordersByStatus").innerHTML = Object.keys(byStatus).length === 0
        ? `<p class="no-data">Nenhum pedido ainda.</p>`
        : Object.entries(byStatus).map(([k, v]) => `
            <div class="bar-row">
                <div class="bar-label">${statusLabels[k] || k}</div>
                <div class="bar-track">
                    <div class="bar-fill" style="width:${(v/maxSt*100).toFixed(1)}%;background:${statusColors2[k] || '#555'}"></div>
                </div>
                <div class="bar-val">${v} pedido${v !== 1 ? 's' : ''}</div>
            </div>
        `).join('');

    /* Products by category */
    const byCat = {};
    products.forEach(p => { byCat[p.category || 'Geral'] = (byCat[p.category || 'Geral'] || 0) + 1; });
    const sortedCats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    const maxCat = Math.max(...Object.values(byCat), 1);
    document.getElementById("productsByCategory").innerHTML = sortedCats.length === 0
        ? `<p class="no-data">Nenhum produto cadastrado.</p>`
        : sortedCats.map(([k, v]) => `
            <div class="bar-row">
                <div class="bar-label">${k}</div>
                <div class="bar-track">
                    <div class="bar-fill" style="width:${(v/maxCat*100).toFixed(1)}%;background:linear-gradient(90deg,#c0001a,#e8001d)"></div>
                </div>
                <div class="bar-val">${v} produto${v !== 1 ? 's' : ''}</div>
            </div>
        `).join('');

    /* Top products */
    const prodCount = {};
    orders.forEach(o => {
        o.items.forEach(i => {
            prodCount[i.name] = (prodCount[i.name] || 0) + (i.qty || 1);
        });
    });
    const topProds = Object.entries(prodCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxProd = Math.max(...topProds.map(x => x[1]), 1);
    const topProductsEl = document.getElementById("topProducts");
    if (!topProductsEl) return;
    topProductsEl.innerHTML = topProds.length === 0
        ? `<p class="no-data">Ainda não há produtos pedidos.</p>`
        : topProds.map(([name, qty], i) => `
            <div class="bar-row">
                <div class="bar-label">${['🥇','🥈','🥉','4°','5°'][i]} ${name.length > 22 ? name.substring(0, 22) + '…' : name}</div>
                <div class="bar-track">
                    <div class="bar-fill" style="width:${(qty/maxProd*100).toFixed(1)}%;background:linear-gradient(90deg,#7b2ff7,#5b0dd6)"></div>
                </div>
                <div class="bar-val">${qty} un.</div>
            </div>
        `).join('');
}
