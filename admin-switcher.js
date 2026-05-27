(function() {
    const email = localStorage.getItem("loggedEmail");
    if (!email) return;
    const isAdmin = email === "admin@tech.com" ||
        (function() {
            try {
                const users = JSON.parse(localStorage.getItem("tech_users_v2")) || [];
                const u = users.find(x => x.email === email);
                return u && u.role === "admin";
            } catch(e) { return false; }
        })();
    if (!isAdmin) return;

    const page = window.location.pathname.split('/').pop() || 'index.html';
    const isAdminPage = page === 'admin.html';

    const bar = document.createElement('div');
    bar.id = 'adminSwitcherBar';
    bar.innerHTML = isAdminPage
        ? `<div class="asb-inner">
               <span class="asb-mode asb-mode-admin">⚙️ Modo Admin</span>
               <span class="asb-divider">|</span>
               <button class="asb-btn asb-btn-buyer" onclick="window.location.href='dashboard.html'">
                   👤 Ver como Comprador
               </button>
           </div>`
        : `<div class="asb-inner">
               <span class="asb-mode asb-mode-buyer">👤 Modo Comprador</span>
               <span class="asb-divider">|</span>
               <button class="asb-btn asb-btn-admin" onclick="window.location.href='admin.html'">
                   ⚙️ Ir para Admin
               </button>
           </div>`;

    const style = document.createElement('style');
    style.textContent = `
        #adminSwitcherBar {
            position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
            z-index: 8888; animation: asbSlideUp 0.4s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes asbSlideUp {
            from { opacity: 0; transform: translateX(-50%) translateY(20px); }
            to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .asb-inner {
            display: flex; align-items: center; gap: 12px;
            background: rgba(10,10,20,0.92); backdrop-filter: blur(16px);
            border: 1px solid rgba(255,255,255,0.12); border-radius: 50px;
            padding: 10px 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.6);
            white-space: nowrap;
        }
        .asb-mode { font-size: 13px; font-weight: 700; }
        .asb-mode-admin { color: #ff6677; }
        .asb-mode-buyer { color: #00cc88; }
        .asb-divider { color: rgba(255,255,255,0.15); font-size: 16px; }
        .asb-btn {
            padding: 7px 16px; border-radius: 50px; border: none;
            font-size: 13px; font-weight: 700; cursor: pointer;
            font-family: 'Poppins', sans-serif; transition: 0.2s;
        }
        .asb-btn-admin {
            background: linear-gradient(135deg, #aa0000, #e8001d);
            color: #fff; box-shadow: 0 3px 12px rgba(232,0,29,0.35);
        }
        .asb-btn-admin:hover { filter: brightness(1.15); transform: translateY(-1px); }
        .asb-btn-buyer {
            background: linear-gradient(135deg, #006644, #00cc88);
            color: #fff; box-shadow: 0 3px 12px rgba(0,204,136,0.3);
        }
        .asb-btn-buyer:hover { filter: brightness(1.12); transform: translateY(-1px); }
    `;

    document.head.appendChild(style);
    document.body.appendChild(bar);
})();
