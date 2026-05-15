function getUsers() { return JSON.parse(localStorage.getItem("tech_users_v2")) || []; }
function saveUsers(u) { localStorage.setItem("tech_users_v2", JSON.stringify(u)); }

function getLoggedUser() {
    const email = localStorage.getItem("loggedEmail");
    if (!email) return null;
    if (email === "admin@tech.com") return { email, role: "admin", name: "Admin", createdAt: "Fundador" };
    return getUsers().find(u => u.email === email) || null;
}

function logout() { localStorage.removeItem('loggedEmail'); window.location.href = "index.html"; }

function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('tech_cart')) || [];
    const total = cart.reduce((s, i) => s + i.qty, 0);
    const badge = document.getElementById("cartBadge");
    if (badge) { badge.innerText = total; badge.style.display = total > 0 ? "flex" : "none"; }
}

function loadPerfil() {
    const user = getLoggedUser();
    if (!user) { window.location.href = "index.html"; return; }

    updateCartBadge();

    const initials = (user.name || user.email)[0].toUpperCase();
    document.getElementById("avatarCircle").innerText = initials;
    document.getElementById("profileName").innerText = user.name || user.email.split('@')[0];
    document.getElementById("profileEmail").innerText = user.email;
    document.getElementById("memberSince").innerText = user.createdAt || "—";

    const roleLabels = { admin: "⚙️ Admin", seller: "🏪 Vendedor", user: "👤 Usuário" };
    const badge = document.getElementById("profileRoleBadge");
    badge.innerText = roleLabels[user.role] || user.role;
    badge.className = "role-badge role-" + (user.role || "user");

    document.getElementById("editName").value = user.name || "";
    document.getElementById("editEmail").value = user.email;
    const roleNames = { admin: "Administrador", seller: "Vendedor", user: "Usuário" };
    document.getElementById("editRole").value = roleNames[user.role] || user.role;

    const orders = (JSON.parse(localStorage.getItem('tech_orders')) || []).filter(o => o.user === user.email);
    const favs = JSON.parse(localStorage.getItem('tech_favs_' + user.email)) || [];
    const spent = orders.reduce((s, o) => s + (o.total || 0), 0);

    document.getElementById("statOrders").innerText = orders.length;
    document.getElementById("statFavs").innerText = favs.length;
    document.getElementById("statSpent").innerText = "R$ " + spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

    loadProfileOrders(orders);
}

function loadProfileOrders(orders) {
    const list = document.getElementById("profileOrdersList");
    const empty = document.getElementById("profileOrdersEmpty");

    if (!orders.length) { empty.style.display = "block"; list.innerHTML = ""; return; }
    empty.style.display = "none";

    const statusMap = {
        processando: { label: "Processando", color: "#ffcc00" },
        entregue: { label: "Entregue", color: "#00ff88" },
        reembolso_solicitado: { label: "Reembolso Solicitado", color: "#ff9900" },
        reembolsado: { label: "Reembolsado", color: "#888" },
        cancelado: { label: "Cancelado", color: "#ff4466" }
    };

    list.innerHTML = orders.slice().reverse().slice(0, 10).map(o => {
        const st = statusMap[o.status] || statusMap.processando;
        const payLabels = { pix: "💠 PIX", credito: "💳 Cartão", boleto: "📄 Boleto" };
        return `
            <div class="mini-order">
                <div class="mini-order-top">
                    <span class="mini-order-id">Pedido #${o.id}</span>
                    <span class="mini-order-status" style="color:${st.color}">${st.label}</span>
                </div>
                <div class="mini-order-items">${o.items.map(i => i.name).join(', ')}</div>
                <div class="mini-order-foot">
                    <span>${o.date}</span>
                    <span>${payLabels[o.payment] || o.payment}</span>
                    <strong style="color:#00ff88">R$ ${o.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </div>
            </div>
        `;
    }).join('');
}

function showSection(sec) {
    document.querySelectorAll('.profile-section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.pnav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('section-' + sec).style.display = 'block';
    event.target.classList.add('active');
}

function saveInfo() {
    const email = localStorage.getItem("loggedEmail");
    if (email === "admin@tech.com") { showToast("Perfil admin não pode ser alterado.", "info"); return; }

    const newName = document.getElementById("editName").value.trim();
    if (!newName) { showToast("O nome não pode estar vazio.", "error"); return; }

    const users = getUsers();
    const u = users.find(x => x.email === email);
    if (!u) return;
    u.name = newName;
    saveUsers(users);

    document.getElementById("profileName").innerText = newName;
    document.getElementById("avatarCircle").innerText = newName[0].toUpperCase();
    showToast("Dados atualizados com sucesso!", "success");
}

function changePassword() {
    const email = localStorage.getItem("loggedEmail");
    if (email === "admin@tech.com") { showToast("Senha do admin não pode ser alterada aqui.", "info"); return; }

    const oldPw = document.getElementById("oldPassword").value;
    const newPw = document.getElementById("newPassword").value;
    const confirmPw = document.getElementById("confirmPassword").value;

    if (!oldPw || !newPw || !confirmPw) { showToast("Preencha todos os campos de senha.", "error"); return; }
    if (newPw.length < 6) { showToast("A nova senha deve ter ao menos 6 caracteres.", "error"); return; }
    if (newPw !== confirmPw) { showToast("As senhas não coincidem.", "error"); return; }

    const users = getUsers();
    const u = users.find(x => x.email === email);
    if (!u) return;
    if (u.password !== oldPw) { showToast("Senha atual incorreta.", "error"); return; }

    u.password = newPw;
    saveUsers(users);

    document.getElementById("oldPassword").value = "";
    document.getElementById("newPassword").value = "";
    document.getElementById("confirmPassword").value = "";
    showToast("Senha alterada com sucesso! 🔒", "success");
}
