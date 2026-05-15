(function() {
    const html = `
        <div class="chat-bubble" id="chatBubble">
            <div class="chat-window" id="chatWindow">
                <div class="chat-header">
                    <div class="chat-avatar">🤖</div>
                    <div class="chat-header-info">
                        <h4>Suporte TechStore</h4>
                        <p>🟢 Online agora</p>
                    </div>
                    <button class="chat-close-btn" onclick="toggleChat()">✕</button>
                </div>
                <div class="chat-messages" id="chatMessages"></div>
                <div class="chat-quick-replies" id="quickReplies"></div>
                <div class="chat-input-area">
                    <input type="text" id="chatInput" placeholder="Digite sua mensagem..." onkeydown="if(event.key==='Enter')sendChat()">
                    <button class="chat-send-btn" onclick="sendChat()">➤</button>
                </div>
            </div>
            <button class="chat-toggle-btn" onclick="toggleChat()" title="Suporte">
                💬
                <span class="chat-unread-dot" id="chatDot"></span>
            </button>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);

    const responses = {
        default: ["Olá! Como posso te ajudar hoje? 😊", "Claro, estou aqui para ajudar!", "Deixa eu verificar isso para você..."],
        prazo: ["Os prazos de entrega são de 3 a 7 dias úteis para capitais e 5 a 12 dias para interior. ✈️", "Pedidos com PIX são processados mais rápido!"],
        frete: ["O frete é **grátis** para todo o Brasil na TechStore! 🚚", "Não cobramos frete em nenhum pedido."],
        reembolso: ["Para solicitar reembolso, vá em Meus Pedidos e clique em 'Solicitar Reembolso'. 📋", "Reembolsos são aprovados em até 5 dias úteis."],
        pagamento: ["Aceitamos PIX (5% OFF), Cartão de Crédito em até 12x e Boleto Bancário. 💳", "O PIX é a opção com maior desconto!"],
        produto: ["Todos os produtos têm garantia de 1 ano. ✅", "Nossos produtos são originais e de alta qualidade!"],
        cupom: ["Temos cupons disponíveis! Tente: TECH10, BEMVINDO, ou TECHSTORE20 no carrinho. 🏷️"],
        cancelar: ["Para cancelar um pedido em processamento, vá em Meus Pedidos e solicite reembolso. 📦"],
        oi: ["Olá! Seja bem-vindo à TechStore! 👋 Em que posso ajudar?", "Oi! Estou aqui para ajudar. O que você precisa?"],
    };

    const quickOpts = ["Prazo de entrega", "Frete grátis?", "Reembolso", "Formas de pagamento", "Cupons de desconto"];

    let open = false;
    let firstOpen = true;

    window.toggleChat = function() {
        open = !open;
        const win = document.getElementById('chatWindow');
        win.classList.toggle('open', open);
        document.getElementById('chatDot').style.display = open ? 'none' : '';

        if (open && firstOpen) {
            firstOpen = false;
            setTimeout(() => botMessage("Olá! 👋 Sou o assistente da **TechStore**. Como posso te ajudar?"), 300);
            setTimeout(() => showQuickReplies(), 900);
        }
    };

    function showQuickReplies() {
        const el = document.getElementById('quickReplies');
        el.innerHTML = quickOpts.map(q =>
            `<button class="quick-reply" onclick="handleQuick('${q}')">${q}</button>`
        ).join('');
    }

    function handleQuick(text) {
        userMessage(text);
        document.getElementById('quickReplies').innerHTML = '';
        handleResponse(text.toLowerCase());
    }

    window.sendChat = function() {
        const input = document.getElementById('chatInput');
        const text = input.value.trim();
        if (!text) return;
        input.value = '';
        userMessage(text);
        document.getElementById('quickReplies').innerHTML = '';
        handleResponse(text.toLowerCase());
    };

    function handleResponse(text) {
        showTyping();
        setTimeout(() => {
            removeTyping();
            let reply = responses.default[Math.floor(Math.random() * responses.default.length)];
            for (const [key, msgs] of Object.entries(responses)) {
                if (key !== 'default' && text.includes(key)) {
                    reply = msgs[Math.floor(Math.random() * msgs.length)];
                    break;
                }
            }
            botMessage(reply);
            if (Math.random() > 0.5) setTimeout(showQuickReplies, 500);
        }, 1000 + Math.random() * 800);
    }

    function botMessage(text) {
        addMessage(text, 'bot');
    }
    function userMessage(text) {
        addMessage(text, 'user');
    }

    function addMessage(text, type) {
        const msgs = document.getElementById('chatMessages');
        const div = document.createElement('div');
        div.className = `chat-msg ${type}`;
        div.innerHTML = type === 'bot'
            ? `<div class="chat-msg-avatar">🤖</div><div class="chat-msg-bubble">${text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>`
            : `<div class="chat-msg-bubble">${text}</div>`;
        msgs.appendChild(div);
        msgs.scrollTop = msgs.scrollHeight;
    }

    function showTyping() {
        const msgs = document.getElementById('chatMessages');
        const div = document.createElement('div');
        div.className = 'chat-msg bot';
        div.id = 'typingIndicator';
        div.innerHTML = `<div class="chat-msg-avatar">🤖</div><div class="chat-typing"><span></span><span></span><span></span></div>`;
        msgs.appendChild(div);
        msgs.scrollTop = msgs.scrollHeight;
    }
    function removeTyping() {
        const el = document.getElementById('typingIndicator');
        if (el) el.remove();
    }
})();
