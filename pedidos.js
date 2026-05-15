let currentRefundOrderId = null;
const user = localStorage.getItem('loggedEmail');
const isAdmin = user === "admin@tech.com";

const motivoLabels = {
    produto_defeituoso: "Produto com defeito",
    nao_chegou: "Produto não chegou",
    produto_errado: "Produto errado entregue",
    arrependimento: "Desistência / Arrependimento",
    qualidade: "Qualidade abaixo do esperado",
    outro: "Outro motivo"
};

function logout() { localStorage.removeItem('loggedEmail'); window.location.href = "index.html"; }

function loadPedidos() {
    if (!user) { window.location.href = "index.html"; return; }

    if (isAdmin) {
        document.getElementById("adminView").style.display = "block";
        document.getElementById("headerSub").innerText = "Painel Admin — todos os pedidos";
        loadAdminRefunds();
    }

    const allOrders = JSON.parse(localStorage.getItem('tech_orders')) || [];
    const myOrders = isAdmin ? allOrders : allOrders.filter(o => o.user === user);

    const listEl = document.getElementById("ordersList");
    const emptyEl = document.getElementById("emptyOrders");

    if (myOrders.length === 0) { emptyEl.style.display = "block"; return; }
    emptyEl.style.display = "none";
    listEl.innerHTML = "";
    myOrders.slice().reverse().forEach(order => {
        listEl.innerHTML += buildOrderCard(order);
    });
}

/* --- TRACKING TIMELINE --- */
function getTrackingSteps(status) {
    const steps = [
        { label: "Pedido realizado", icon: "🛒" },
        { label: "Pagamento confirmado", icon: "💳" },
        { label: "Em preparação", icon: "📦" },
        { label: "Enviado", icon: "🚚" },
        { label: "Entregue", icon: "✅" }
    ];

    const progressMap = {
        processando: 2,
        entregue: 5,
        reembolso_solicitado: 5,
        reembolsado: 5,
        cancelado: 1
    };

    const activeSteps = progressMap[status] || 1;
    return { steps, activeSteps, cancelled: status === "cancelado" };
}

function buildTrackingTimeline(status) {
    const { steps, activeSteps, cancelled } = getTrackingSteps(status);

    const stepHtml = steps.map((step, i) => {
        const done = i < activeSteps;
        const current = i === activeSteps - 1;
        const cls = cancelled && i > 0 ? 'step-cancelled' : done ? (current ? 'step-current' : 'step-done') : 'step-pending';
        return `
            <div class="track-step ${cls}">
                <div class="track-dot">${done ? step.icon : ''}</div>
                <div class="track-label">${step.label}</div>
            </div>
        `;
    }).join('');

    const connectors = steps.slice(0, -1).map((_, i) => {
        const done = i < activeSteps - 1;
        const cls = cancelled && i > 0 ? 'connector-cancelled' : done ? 'connector-done' : 'connector-pending';
        return `<div class="track-connector ${cls}"></div>`;
    });

    let combined = '';
    const stepArr = stepHtml.split('\n').filter(s => s.trim().startsWith('<div class="track-step'));
    steps.forEach((_, i) => {
        combined += `<div class="track-step-wrap">
            <div class="track-dot ${i < activeSteps ? (cancelled && i > 0 ? 'dot-cancelled' : 'dot-done') : 'dot-pending'}">${i < activeSteps ? steps[i].icon : ''}</div>
            <div class="track-lbl ${i < activeSteps ? 'lbl-done' : 'lbl-pending'}">${steps[i].label}</div>
        </div>
        ${i < steps.length - 1 ? `<div class="track-line ${i < activeSteps - 1 ? (cancelled ? 'line-cancelled' : 'line-done') : 'line-pending'}"></div>` : ''}`;
    });

    return `<div class="tracking-timeline">${combined}</div>`;
}

function buildOrderCard(order) {
    const statusMap = {
        entregue: { label: "Entregue", cls: "status-entregue" },
        processando: { label: "Processando", cls: "status-processando" },
        reembolso_solicitado: { label: "Reembolso Solicitado", cls: "status-reembolso_solicitado" },
        reembolsado: { label: "Reembolsado", cls: "status-reembolsado" },
        cancelado: { label: "Cancelado", cls: "status-cancelado" }
    };

    const st = statusMap[order.status] || statusMap.processando;
    const payLabels = { pix: "💠 PIX", credito: "💳 Cartão de Crédito", boleto: "📄 Boleto" };
    const canRefund = order.status === "entregue" || order.status === "processando";
    const refundLabel = canRefund ? "Solicitar Reembolso" : (order.status === "reembolso_solicitado" ? "Reembolso Pendente" : "Reembolso");

    const itemsHtml = order.items.map(item => `
        <div class="order-item">
            <img src="${item.image}" alt="${item.name}" onerror="this.src='https://placehold.co/60x60/0d0d14/666?text=IMG'">
            <div class="order-item-info">
                <h4>${item.name}</h4>
                <p>Qtd: ${item.qty}</p>
            </div>
            <span class="order-item-price">R$ ${(item.price * item.qty).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
    `).join('');

    const timeline = buildTrackingTimeline(order.status);

    return `
        <div class="order-card" id="order-${order.id}">
            <div class="order-header">
                <div>
                    <div class="order-id">Pedido <strong>#${order.id}</strong></div>
                    <div class="order-date">${order.date}</div>
                </div>
                <span class="order-status ${st.cls}">${st.label}</span>
            </div>
            ${timeline}
            <div class="order-items">${itemsHtml}</div>
            <div class="order-footer">
                <div>
                    <div class="order-total">Total: <strong>R$ ${order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></div>
                    <div class="order-payment">${payLabels[order.payment] || order.payment}</div>
                </div>
                <div class="order-actions">
                    <button class="btn-refund" onclick="openRefund('${order.id}')" ${!canRefund ? 'disabled' : ''}>${refundLabel}</button>
                </div>
            </div>
        </div>
    `;
}

function loadAdminRefunds() {
    const allOrders = JSON.parse(localStorage.getItem('tech_orders')) || [];
    const refundOrders = allOrders.filter(o => o.status === "reembolso_solicitado");
    const container = document.getElementById("allRefundRequests");

    if (refundOrders.length === 0) {
        container.innerHTML = `<p style="color:#555;font-size:14px;padding:10px 0;">Nenhuma solicitação de reembolso pendente.</p>`;
        return;
    }

    container.innerHTML = "";
    refundOrders.forEach(order => {
        const payLabels = { pix: "PIX", credito: "Cartão de Crédito", boleto: "Boleto" };
        container.innerHTML += `
            <div class="refund-req-card">
                <div class="refund-req-header">
                    <h3>Pedido #${order.id}</h3>
                    <span class="order-status status-reembolso_solicitado">Pendente</span>
                </div>
                <div class="refund-req-user">👤 ${order.user} — R$ ${order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} via ${payLabels[order.payment] || order.payment}</div>
                <div class="refund-req-reason">📋 Motivo: <strong>${motivoLabels[order.refundReason] || order.refundReason}</strong></div>
                ${order.refundDesc ? `<div class="refund-req-desc">"${order.refundDesc}"</div>` : ''}
                <div class="admin-actions">
                    <button class="btn-approve" onclick="adminDecide('${order.id}', 'reembolsado')">✅ Aprovar Reembolso</button>
                    <button class="btn-deny" onclick="adminDecide('${order.id}', 'cancelado')">❌ Recusar</button>
                </div>
            </div>
        `;
    });
}

function adminDecide(orderId, newStatus) {
    const allOrders = JSON.parse(localStorage.getItem('tech_orders')) || [];
    const order = allOrders.find(o => o.id === orderId);
    if (order) { order.status = newStatus; localStorage.setItem('tech_orders', JSON.stringify(allOrders)); }
    const msg = newStatus === "reembolsado" ? "Reembolso aprovado!" : "Reembolso recusado.";
    showToast(msg, newStatus === "reembolsado" ? "success" : "info");
    loadPedidos();
    loadAdminRefunds();
}

function openRefund(orderId) {
    const allOrders = JSON.parse(localStorage.getItem('tech_orders')) || [];
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    currentRefundOrderId = orderId;
    document.getElementById("refundOrderInfo").innerHTML = `
        <div class="refund-order-preview">
            <span>Pedido <strong>#${order.id}</strong></span>
            <span>Total: <strong>R$ ${order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
            <span>Data: ${order.date}</span>
        </div>
    `;
    document.getElementById("refundReason").value = "";
    document.getElementById("refundDesc").value = "";
    document.getElementById("refundModal").classList.add("active");
}

function closeRefund() { document.getElementById("refundModal").classList.remove("active"); currentRefundOrderId = null; }

function submitRefund() {
    const reason = document.getElementById("refundReason").value;
    if (!reason) {
        showToast("Selecione um motivo para o reembolso.", "error");
        return;
    }
    const desc = document.getElementById("refundDesc").value;
    const allOrders = JSON.parse(localStorage.getItem('tech_orders')) || [];
    const order = allOrders.find(o => o.id === currentRefundOrderId);
    if (order) {
        order.status = "reembolso_solicitado";
        order.refundReason = reason;
        order.refundDesc = desc;
        order.refundDate = new Date().toLocaleDateString('pt-BR');
        localStorage.setItem('tech_orders', JSON.stringify(allOrders));
    }
    closeRefund();
    document.getElementById("refundSuccessModal").classList.add("active");
}

function closeRefundSuccess() {
    document.getElementById("refundSuccessModal").classList.remove("active");
    loadPedidos();
}
