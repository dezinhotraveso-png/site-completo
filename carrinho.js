let cart = [];
let appliedCoupon = null;
let selectedFrete = null;
let selectedShipping = "techstore"; // techstore (gratis) ou correios (mais caro)

/* ============================
   COUPONS
   ============================ */
const COUPONS = {
    "BRASIL2026":  { type: "percent", value: 10, label: "10% OFF 🇧🇷⚽" },
    "TECH10":      { type: "percent", value: 10, label: "10% OFF" },
    "SAVE20":      { type: "percent", value: 20, label: "20% OFF" },
    "BEMVINDO":    { type: "percent", value: 15, label: "15% OFF" },
    "TECHSTORE20": { type: "percent", value: 20, label: "20% OFF" },
    "BLACK50":     { type: "percent", value: 50, label: "50% OFF" },
    "FLASH5":      { type: "fixed",   value: 50, label: "R$ 50 OFF" },
    "FRETE0":      { type: "fixed",   value: 30, label: "R$ 30 OFF" },
};

function applyCoupon() {
    const code = document.getElementById("couponInput").value.trim().toUpperCase();
    if (!code) { showCouponMsg("Digite um código de cupom.", "error"); return; }
    if (appliedCoupon) { showCouponMsg("Já existe um cupom aplicado. Remova-o primeiro.", "error"); return; }
    const coupon = COUPONS[code];
    if (!coupon) { showCouponMsg("❌ Cupom inválido ou expirado.", "error"); return; }
    appliedCoupon = { code, ...coupon };
    document.getElementById("couponInput").disabled = true;
    document.getElementById("couponLabel").innerText = code;
    showCouponMsg(`✅ Cupom <strong>${code}</strong> aplicado — ${coupon.label}! <button onclick="removeCoupon()" class="btn-remove-coupon">Remover</button>`, "success");
    showToast(`Cupom ${code} aplicado! ${coupon.label} 🏷️`, "success");
    updateSummary();
}

function removeCoupon() {
    appliedCoupon = null;
    document.getElementById("couponInput").value = "";
    document.getElementById("couponInput").disabled = false;
    document.getElementById("couponMsg").innerHTML = "";
    document.getElementById("discountRow").style.display = "none";
    updateSummary();
    showToast("Cupom removido.", "info");
}

function showCouponMsg(msg, type) {
    const el = document.getElementById("couponMsg");
    el.innerHTML = msg;
    el.className = "coupon-msg " + type;
}

function getCouponDiscount(subtotal) {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === "percent") return subtotal * (appliedCoupon.value / 100);
    return Math.min(appliedCoupon.value, subtotal);
}

/* ============================
   CEP / FRETE
   ============================ */
function formatCEP(input) {
    let val = input.value.replace(/\D/g, '').substring(0, 8);
    if (val.length > 5) val = val.substring(0, 5) + '-' + val.substring(5);
    input.value = val;
}

function calcFrete() {
    const cep = document.getElementById("cepInput").value.replace(/\D/g, '');
    const msgEl = document.getElementById("cepMsg");
    const optEl = document.getElementById("freteOptions");

    if (cep.length !== 8) {
        msgEl.innerHTML = `<span style="color:#ff4466;">Digite um CEP válido com 8 dígitos.</span>`;
        optEl.innerHTML = "";
        return;
    }

    msgEl.innerHTML = `<span style="color:#555;">Calculando...</span>`;
    optEl.innerHTML = "";

    setTimeout(() => {
        const prefix = parseInt(cep[0]);
        let region, economyDays, expressDays, expressCost, sameDayCost;

        if (prefix <= 2) {
            region = "São Paulo / Rio de Janeiro";
            economyDays = "5 a 8 dias úteis"; expressDays = "2 a 3 dias úteis";
            expressCost = 19.90; sameDayCost = 39.90;
        } else if (prefix <= 5) {
            region = "Sul e Sudeste";
            economyDays = "7 a 10 dias úteis"; expressDays = "3 a 5 dias úteis";
            expressCost = 24.90; sameDayCost = 49.90;
        } else {
            region = "Norte, Nordeste e Centro-Oeste";
            economyDays = "10 a 15 dias úteis"; expressDays = "5 a 7 dias úteis";
            expressCost = 29.90; sameDayCost = 59.90;
        }

        msgEl.innerHTML = `<span style="color:#555;font-size:12px;">📍 ${region}</span>`;

        const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
        const freeAbove = 299;

        const correiosCost = selectedShipping === "correios" ? (expressCost + 12.50) : 0;
        const correiosLabel = selectedShipping === "correios" ? "Correios (Sedex)" : "Frete Grátis";

        optEl.innerHTML = `
            <div class="frete-option" onclick="selectFreteOption('gratis', 0)" id="frete-gratis">
                <div class="frete-opt-radio"><div class="frete-radio-inner"></div></div>
                <div class="frete-opt-info">
                    <span class="frete-opt-name">🚚 ${correiosLabel}</span>
                    <span class="frete-opt-days">${economyDays}</span>
                </div>
                <span class="frete-opt-price ${subtotal >= freeAbove && selectedShipping === 'techstore' ? 'free' : 'cond'}">
                    ${selectedShipping === 'correios' ? ('R$ ' + correiosCost.toFixed(2).replace('.', ',')) : (subtotal >= freeAbove ? 'GRÁTIS' : `Grátis acima de R$ ${freeAbove},00`)}
                </span>
            </div>
            <div class="frete-option" onclick="selectFreteOption('expresso', ${expressCost})" id="frete-expresso">
                <div class="frete-opt-radio"><div class="frete-radio-inner"></div></div>
                <div class="frete-opt-info">
                    <span class="frete-opt-name">⚡ Expresso</span>
                    <span class="frete-opt-days">${expressDays}</span>
                </div>
                <span class="frete-opt-price">R$ ${expressCost.toFixed(2).replace('.', ',')}</span>
            </div>
            <div class="frete-option" onclick="selectFreteOption('same', ${sameDayCost})" id="frete-same">
                <div class="frete-opt-radio"><div class="frete-radio-inner"></div></div>
                <div class="frete-opt-info">
                    <span class="frete-opt-name">🏎️ Same Day (hoje)</span>
                    <span class="frete-opt-days">Disponível apenas para capitais</span>
                </div>
                <span class="frete-opt-price">R$ ${sameDayCost.toFixed(2).replace('.', ',')}</span>
            </div>
        `;

        selectFreteOption('gratis', selectedShipping === 'correios' ? correiosCost : 0);
    }, 700);
}

function selectFreteOption(type, cost) {
    document.querySelectorAll('.frete-option').forEach(el => el.classList.remove('selected'));
    const el = document.getElementById('frete-' + type);
    if (el) el.classList.add('selected');
    selectedFrete = { type, cost };
    updateSummary();
}

/* ============================
   CART
   ============================ */
function loadCart() {
    cart = JSON.parse(localStorage.getItem('tech_cart')) || [];
    renderCart();
}

function renderCart() {
    const itemsEl = document.getElementById("cartItems");
    const emptyEl = document.getElementById("emptyCart");
    const layoutEl = document.querySelector(".cart-layout");

    if (cart.length === 0) {
        emptyEl.style.display = "block";
        layoutEl.style.display = "none";
        return;
    }

    emptyEl.style.display = "none";
    layoutEl.style.display = "grid";
    itemsEl.innerHTML = "";

    const allProducts = JSON.parse(localStorage.getItem('tech_products')) || [];
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.qty;
        const product = allProducts.find(p => p.id === item.id);
        const stock = product ? (product.stock || 0) : 0;
        const stockHtml = stock > 0 ? `<span style="color:#00ff88;font-size:12px;">\ud83d\udce6 ${stock} em estoque</span>` : `<span style="color:#ff4466;font-size:12px;">\ud83d\udd34 Esgotado</span>`;
        itemsEl.innerHTML += `
            <div class="cart-card">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-info">
                    <h3>${item.name}</h3>
                    <p class="item-price">R$ ${item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p class="item-total">Subtotal: R$ ${itemTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    ${stockHtml}
                </div>
                <div class="cart-actions">
                    <div class="qty-controls">
                        <button class="qty-btn" onclick="changeQty(${index}, -1)">−</button>
                        <span class="qty-value">${item.qty}</span>
                        <button class="qty-btn" onclick="changeQty(${index}, 1)">+</button>
                    </div>
                    <button class="remove-btn" onclick="removeItem(${index})">🗑️ Remover</button>
                </div>
            </div>
        `;
    });

    updateSummary();
}

function changeQty(index, delta) {
    const item = cart[index];
    const allProducts = JSON.parse(localStorage.getItem('tech_products')) || [];
    const product = allProducts.find(p => p.id === item.id);
    const stock = product ? (product.stock || 0) : 0;
    const newQty = item.qty + delta;
    if (newQty > stock) { showToast(`\ud83d\udce6 S\u00f3 temos ${stock} unidades em estoque.`, "error", 2500); return; }
    cart[index].qty = Math.max(1, newQty);
    saveCart(); renderCart();
}

function removeItem(index) {
    const name = cart[index].name;
    cart.splice(index, 1);
    saveCart(); renderCart();
    showToast(`${name} removido do carrinho.`, "info");
}

function clearCart() {
    if (cart.length === 0) return;
    if (confirm("Tem certeza que deseja esvaziar o carrinho?")) {
        cart = [];
        saveCart(); renderCart();
        showToast("Carrinho esvaziado.", "info");
    }
}

function saveCart() { localStorage.setItem('tech_cart', JSON.stringify(cart)); }

function updateSummary() {
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const discount = getCouponDiscount(subtotal);
    const afterDiscount = subtotal - discount;
    const freteCost = selectedFrete ? selectedFrete.cost : 0;

    document.getElementById("totalQty").innerText = totalQty;
    document.getElementById("subtotal").innerText = `R$ ${subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    const discountRow = document.getElementById("discountRow");
    if (discount > 0) {
        discountRow.style.display = "flex";
        document.getElementById("discountValue").innerText = `- R$ ${discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    } else {
        discountRow.style.display = "none";
    }

    const freteRow = document.getElementById("freteRow");
    if (freteCost > 0) {
        freteRow.style.display = "flex";
        document.getElementById("freteValue").innerText = `+ R$ ${freteCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        document.getElementById("freteLabel").innerText = `R$ ${freteCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        document.getElementById("freteLabel").className = "";
    } else {
        freteRow.style.display = "none";
        document.getElementById("freteLabel").innerText = "GRÁTIS";
        document.getElementById("freteLabel").className = "free";
    }

    const shipExtraRow = document.getElementById("shipExtraRow");
    if (shipExtraRow) {
        if (selectedShipping === 'correios') {
            shipExtraRow.style.display = "flex";
            document.getElementById("shipExtraValue").innerText = `+ R$ 12,50`;
        } else {
            shipExtraRow.style.display = "none";
        }
    }

    const currentMethod = document.querySelector('input[name="pay"]:checked')?.value || "pix";
    const baseTotal = afterDiscount + freteCost;
    const total = currentMethod === "pix" ? baseTotal * 0.95 : baseTotal;
    document.getElementById("totalPrice").innerText = `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    const pixValue = baseTotal * 0.95;
    const saved = baseTotal - pixValue + discount;
    const pixEl = document.getElementById("pixDiscount");
    pixEl.innerHTML = `💠 No PIX: <strong>R$ ${pixValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> (economia de R$ ${saved.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`;

    updateInstallments();
}

function selectPay(method) {
    document.getElementById(method).checked = true;
    document.getElementById("pixInfo").style.display = method === "pix" ? "block" : "none";
    document.getElementById("cardInfo").style.display = method === "credito" ? "block" : "none";
    document.getElementById("boletoInfo").style.display = method === "boleto" ? "block" : "none";
    updateSummary();
}

function selectShipping(method) {
    selectedShipping = method;
    document.getElementById('shipTech').checked = (method === 'techstore');
    document.getElementById('shipCorreios').checked = (method === 'correios');
    // Recalcular frete se CEP já digitado
    const cep = document.getElementById("cepInput").value.replace(/\D/g, '');
    if (cep.length === 8) { calcFrete(); }
    updateSummary();
}

/* CARD FUNCTIONS */
function formatCardNumber(input) {
    let val = input.value.replace(/\D/g, '').substring(0, 16);
    input.value = val.match(/.{1,4}/g)?.join(' ') || val;
    const display = document.getElementById("cardNumberDisplay");
    const padded = val.padEnd(16, '•');
    display.innerText = padded.match(/.{1,4}/g).join(' ');
    detectBrand(val);
}
function detectBrand(num) {
    const brandEl = document.getElementById("cardBrand");
    if (/^4/.test(num)) brandEl.innerText = "VISA";
    else if (/^5[1-5]/.test(num)) brandEl.innerText = "MC";
    else if (/^3[47]/.test(num)) brandEl.innerText = "AMEX";
    else if (/^6/.test(num)) brandEl.innerText = "ELO";
    else brandEl.innerText = "💳";
}
function updateHolder(input) { document.getElementById("cardHolderDisplay").innerText = (input.value.toUpperCase() || "SEU NOME").substring(0, 22); }
function formatExpiry(input) {
    let val = input.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 3) val = val.substring(0, 2) + '/' + val.substring(2);
    input.value = val;
    document.getElementById("cardExpiryDisplay").innerText = val || "MM/AA";
}
function updateCVV(input) { input.value = input.value.replace(/\D/g, ''); document.getElementById("cvvDisplay").innerText = input.value || "•••"; }
function showBack() { document.getElementById("cardFront").style.display = "none"; document.getElementById("cardBack").style.display = "flex"; }
function showFront() { document.getElementById("cardFront").style.display = "flex"; document.getElementById("cardBack").style.display = "none"; }

function updateInstallments() {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const sel = document.getElementById("installments");
    if (!sel) return;
    const n = parseInt(sel.value);
    const info = document.getElementById("installmentInfo");
    if (n <= 10) {
        info.innerHTML = `${n}x de <strong>R$ ${(subtotal / n).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> sem juros`;
    } else {
        const taxa = 0.0199;
        const total = subtotal * Math.pow(1 + taxa, n);
        const parcela = total / n;
        info.innerHTML = `${n}x de <strong>R$ ${parcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> com juros<br><small style="color:#888">Total: R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</small>`;
    }
}

/* ============================
   CHECKOUT
   ============================ */
function checkout() {
    if (cart.length === 0) return;

    const user = localStorage.getItem('loggedEmail');
    if (!user) {
        showToast("Faça login para finalizar a compra!", "warning");
        setTimeout(() => window.location.href = "index.html", 1500);
        return;
    }

    const method = document.querySelector('input[name="pay"]:checked').value;

    if (method === "credito") {
        const number = document.getElementById("cardNumber").value.replace(/\s/g, '');
        const holder = document.getElementById("cardHolder").value.trim();
        const expiry = document.getElementById("cardExpiry").value.trim();
        const cvv = document.getElementById("cardCVV").value.trim();

        if (number.length < 16) { showError("Número do cartão inválido."); return; }
        if (holder.length < 3) { showError("Informe o nome do titular."); return; }
        if (expiry.length < 5) { showError("Data de validade inválida."); return; }
        if (cvv.length < 3) { showError("CVV inválido."); return; }

        const [mes, ano] = expiry.split('/');
        const expDate = new Date(2000 + parseInt(ano), parseInt(mes) - 1, 1);
        if (expDate < new Date()) { showError("Cartão vencido."); return; }
    }

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const freteCost = selectedFrete ? selectedFrete.cost : 0;
    let total = subtotal + freteCost;
    let extraInfo = "";

    if (appliedCoupon) {
        const disc = getCouponDiscount(subtotal);
        total = total - disc;
    }

    if (method === "pix") {
        total = total * 0.95;
        extraInfo = "Você economizou com o desconto PIX!";
    } else if (method === "credito") {
        const n = parseInt(document.getElementById("installments").value);
        if (n <= 10) {
            extraInfo = `Parcelado em ${n}x de R$ ${(total / n).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} sem juros.`;
        } else {
            const taxa = 0.0199;
            total = total * Math.pow(1 + taxa, n);
            extraInfo = `Parcelado em ${n}x com juros.`;
        }
    } else if (method === "boleto") {
        extraInfo = "O boleto vence em 3 dias úteis.";
    }

    const labels = { pix: "PIX (5% OFF)", credito: "Cartão de Crédito", boleto: "Boleto Bancário" };
    const shippingLabel = selectedShipping === 'correios' ? " (Correios)" : " (DreamStore Envios)";
    saveOrder(user, method, total, selectedShipping);

    document.getElementById("successMsg").innerHTML = `
        Pagamento via <strong>${labels[method]}</strong> confirmado!<br>
        Entrega: <strong>${selectedShipping === 'correios' ? '📮 Correios' : '🚚 DreamStore Envios'}</strong><br>
        Total: <strong>R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong><br>
        <small style="color:#aaa">${extraInfo}</small><br><br>
        Seus produtos chegam em breve. 🚀<br>
        <small style="color:#555">Acompanhe em <a href="pedidos.html" style="color:#3483fa">Meus Pedidos</a></small>
    `;

    cart = [];
    saveCart();
    document.getElementById("successModal").classList.add("active");
}

function saveOrder(user, method, total, shippingMethod) {
    const allOrders = JSON.parse(localStorage.getItem('tech_orders')) || [];
    const orderId = "TC" + Date.now().toString().slice(-6);
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR') + " às " + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    allOrders.push({ id: orderId, user, date: dateStr, items: cart.map(item => ({ ...item })), total, payment: method, shipping: shippingMethod || "techstore", status: "processando" });
    localStorage.setItem('tech_orders', JSON.stringify(allOrders));

    // Deduzir estoque
    const products = JSON.parse(localStorage.getItem('tech_products')) || [];
    cart.forEach(item => {
        const p = products.find(x => x.id === item.id);
        if (p) { p.stock = Math.max(0, (p.stock || 0) - item.qty); }
    });
    localStorage.setItem('tech_products', JSON.stringify(products));
}

function showError(msg) {
    const btn = document.getElementById("checkoutBtn");
    const orig = btn.innerText;
    btn.innerText = "⚠️ " + msg;
    btn.style.background = "#8b0010";
    showToast(msg, "error");
    setTimeout(() => { btn.innerText = orig; btn.style.background = ""; }, 3000);
}
