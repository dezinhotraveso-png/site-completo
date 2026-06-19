(function () {
    const THEMES = [
        { id: 'vermelho', label: 'Vermelho & Preto', dot: 'dot-vermelho', icon: '🔴' },
        { id: 'verde',    label: 'Verde & Preto',    dot: 'dot-verde',    icon: '🟢' },
        { id: 'azul',     label: 'Azul & Preto',     dot: 'dot-azul',     icon: '🔵' },
    ];

    const VALID_IDS = THEMES.map(t => t.id);

    function applyTheme(id) {
        document.documentElement.setAttribute('data-theme', id);
        localStorage.setItem('dreamstore_theme', id);
        document.querySelectorAll('.theme-opt').forEach(el => {
            el.classList.toggle('active', el.dataset.theme === id);
        });
    }

    function buildSwitcher() {
        const saved = localStorage.getItem('dreamstore_theme');
        const initial = VALID_IDS.includes(saved) ? saved : 'vermelho';

        const wrapper = document.createElement('div');
        wrapper.className = 'theme-switcher';

        const opts = document.createElement('div');
        opts.className = 'theme-options';
        opts.id = 'themeOptions';

        THEMES.forEach(t => {
            const btn = document.createElement('button');
            btn.className = 'theme-opt' + (t.id === initial ? ' active' : '');
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

        applyTheme(initial);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', buildSwitcher);
    } else {
        buildSwitcher();
    }
})();
