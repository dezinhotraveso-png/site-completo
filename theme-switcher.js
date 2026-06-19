(function () {
    const THEMES = [
        { id: 'brasil',   label: 'Brasil',        dot: 'dot-brasil',   icon: '🇧🇷' },
        { id: 'vermelho', label: 'Vermelho & Preto', dot: 'dot-vermelho', icon: '🔴' },
        { id: 'mono',     label: 'Preto & Branco', dot: 'dot-mono',    icon: '⚫' },
    ];

    function applyTheme(id) {
        document.documentElement.setAttribute('data-theme', id);
        localStorage.setItem('techstore_theme', id);
        document.querySelectorAll('.theme-opt').forEach(el => {
            el.classList.toggle('active', el.dataset.theme === id);
        });
    }

    function buildSwitcher() {
        const saved = localStorage.getItem('techstore_theme') || 'brasil';

        const wrapper = document.createElement('div');
        wrapper.className = 'theme-switcher';

        const opts = document.createElement('div');
        opts.className = 'theme-options';
        opts.id = 'themeOptions';

        THEMES.forEach(t => {
            const btn = document.createElement('button');
            btn.className = 'theme-opt' + (t.id === saved ? ' active' : '');
            btn.dataset.theme = t.id;
            btn.innerHTML = `<span class="theme-dot ${t.dot}"></span>${t.label}`;
            btn.addEventListener('click', () => {
                applyTheme(t.id);
                opts.classList.remove('open');
            });
            opts.appendChild(btn);
        });

        const toggle = document.createElement('button');
        toggle.className = 'theme-toggle-btn';
        toggle.title = 'Trocar tema';
        toggle.innerHTML = '🎨';
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            opts.classList.toggle('open');
        });

        document.addEventListener('click', () => opts.classList.remove('open'));

        wrapper.appendChild(opts);
        wrapper.appendChild(toggle);
        document.body.appendChild(wrapper);

        applyTheme(saved);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', buildSwitcher);
    } else {
        buildSwitcher();
    }
})();
