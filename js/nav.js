(function () {
    // inject shared header + nav HTML
    const el = document.getElementById('site-nav');
    if (!el) return;

    el.outerHTML = `
    <button class="dark-mode-toggle" id="dark-mode-toggle">☾</button>
    <header>
        <h1 class="site-title">
            <span class="site-title-shadow" aria-hidden="true">ecalap maofaes</span>
            <span class="site-title-front">seafoam palace</span>
        </h1>
    </header>
    <nav>
        <a href="/index.html">home</a>
        <a href="/pages/writing.html">writing</a>
        <a href="/pages/garden.html">library</a>
        <a href="/pages/scrapbook.html">scrapbook</a>
        <a href="/pages/about.html">about</a>
    </nav>`;

    // mark active nav link
    const currentPath = window.location.pathname;
    document.querySelectorAll('nav a').forEach(link => {
        const linkPath = new URL(link.href).pathname;
        if (currentPath === linkPath ||
            (currentPath === '/' && linkPath === '/index.html') ||
            (currentPath.includes('/curios/') && linkPath === '/pages/curios.html') ||
            (currentPath.includes('/writing/') && linkPath === '/pages/writing.html')) {
            link.classList.add('active');
        }
    });

    // dark mode toggle
    const toggleBtn = document.getElementById('dark-mode-toggle');
    const isDarkMode = localStorage.getItem('darkMode') === 'true';

    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        toggleBtn.textContent = '☀';
    }

    toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const darkModeEnabled = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', darkModeEnabled);
        toggleBtn.textContent = darkModeEnabled ? '☀' : '☾';
    });

    // header hover wobble — shadow layer drifts further than the front layer
    const siteTitle = document.querySelector('.site-title');
    const titleFront = siteTitle?.querySelector('.site-title-front');
    const titleShadow = siteTitle?.querySelector('.site-title-shadow');

    if (siteTitle && titleFront && titleShadow) {
        siteTitle.addEventListener('mousemove', (e) => {
            const rect = siteTitle.getBoundingClientRect();
            const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
            const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
            titleFront.style.transform = `translate(${x * 5}px, ${y * 5}px)`;
            titleShadow.style.transform = `translate(${-x * 9}px, ${-y * 9}px)`;
        });

        siteTitle.addEventListener('mouseleave', () => {
            titleFront.style.transform = 'translate(0px, 0px)';
            titleShadow.style.transform = 'translate(0px, 0px)';
        });
    }
})();

//        <a href="/pages/notebook.html">notebook</a>