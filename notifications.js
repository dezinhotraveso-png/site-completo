(function() {
    const style = document.createElement('style');
    style.textContent = `
        #toast-container {
            position: fixed; bottom: 28px; right: 24px; z-index: 99999;
            display: flex; flex-direction: column; gap: 10px; pointer-events: none;
        }
        .toast {
            min-width: 280px; max-width: 360px;
            padding: 14px 18px; border-radius: 14px;
            display: flex; align-items: center; gap: 12px;
            font-family: 'Poppins', sans-serif; font-size: 14px; font-weight: 500;
            color: #fff; pointer-events: auto;
            animation: toastIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
            backdrop-filter: blur(12px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.5);
            cursor: pointer;
            transition: opacity 0.3s, transform 0.3s;
        }
        .toast.out { opacity: 0; transform: translateX(20px); }
        .toast-success { background: rgba(0,40,20,0.95); border: 1px solid rgba(0,255,136,0.3); }
        .toast-error   { background: rgba(40,0,8,0.95);  border: 1px solid rgba(232,0,29,0.4); }
        .toast-info    { background: rgba(0,20,50,0.95); border: 1px solid rgba(52,131,250,0.35); }
        .toast-warning { background: rgba(40,28,0,0.95); border: 1px solid rgba(255,165,0,0.35); }
        .toast-icon { font-size: 18px; flex-shrink: 0; }
        .toast-msg { flex: 1; line-height: 1.4; }
        .toast-close { opacity: 0.5; font-size: 16px; cursor: pointer; flex-shrink: 0; }
        .toast-close:hover { opacity: 1; }
        @keyframes toastIn {
            from { opacity: 0; transform: translateX(40px) scale(0.9); }
            to   { opacity: 1; transform: translateX(0) scale(1); }
        }
    `;
    document.head.appendChild(style);

    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };

    window.showToast = function(message, type = 'success', duration = 3500) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || '💬'}</span>
            <span class="toast-msg">${message}</span>
            <span class="toast-close" onclick="this.parentElement.remove()">✕</span>
        `;
        container.appendChild(toast);
        toast.onclick = () => dismiss(toast);
        setTimeout(() => dismiss(toast), duration);
    };

    function dismiss(toast) {
        if (!toast.parentElement) return;
        toast.classList.add('out');
        setTimeout(() => toast.remove(), 350);
    }
})();
