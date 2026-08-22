// ── homepage music player — YouTube audio, hidden video ─────────────────
// Add more tracks here as they come in.
(function () {
    const PLAYLIST = [

        {
            videoId: 'Ob_EDY9Eiis', title: 'WannaCry', artist: 'Ninajirachi & Porter Robinson'
        },
        {
            videoId: 'ahUZL4-MrG8', title: 'Unforgiving Girl ', artist: 'car seat headrest'
        },

        { videoId: 'fSRTHbtlLFc', title: 'The Rest is Noise', artist: 'Jamie xx' },
        { videoId: 'ru243ylmkYY', title: 'Disappear', artist: 'Stray Dogg' },
        { videoId: '5n4fcAR8zZ8', title: 'Headache - The Party that Never Ends' },
        { videoId: 'F4GZ6BbZMAU', title: 'When I Grow Up', artist: 'First Aid Kit' },
    ];

    const STORE_KEY = 'laguna-player';
    let yt = null;
    let idx = 0;
    let playing = false;
    let ticker = null;

    function load() {
        if (window.YT && window.YT.Player) { create(); return; }
        const s = document.createElement('script');
        s.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(s);
        window.onYouTubeIframeAPIReady = create;
    }

    function create() {
        if (!document.getElementById('yt-player')) return;
        yt = new YT.Player('yt-player', {
            height: '0', width: '0',
            videoId: PLAYLIST[idx].videoId,
            playerVars: { autoplay: 0, controls: 0, rel: 0, disablekb: 1 },
            events: { onReady: onReady, onStateChange: onState }
        });
    }

    function onReady() {
        const saved = loadSaved();
        if (saved && saved.i < PLAYLIST.length) {
            idx = saved.i;
            yt.loadVideoById({ videoId: PLAYLIST[idx].videoId, startSeconds: saved.t || 0 });
            yt.pauseVideo();
        }
        updateTrack();
        buildTrackList();
        setupAutoplayOnScroll();
    }

    function setupAutoplayOnScroll() {
        const el = document.getElementById('music-player');
        if (!el || !('IntersectionObserver' in window)) return;
        const obs = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    yt.playVideo();
                    obs.disconnect();
                }
            });
        }, { threshold: 0.5 });
        obs.observe(el);
    }

    function onState(e) {
        const S = YT.PlayerState;
        if (e.data === S.ENDED) { next(); return; }
        if (e.data === S.PLAYING) { playing = true; startTick(); setMarquee(true); }
        if (e.data === S.PAUSED) { playing = false; clearInterval(ticker); setMarquee(false); }
        updateBtn();
    }

    function setMarquee(on) {
        const inner = document.querySelector('#player-track .marquee-inner');
        if (inner) inner.classList.toggle('scrolling', on);
    }

    function startTick() {
        clearInterval(ticker);
        ticker = setInterval(() => {
            if (!yt || !yt.getDuration) return;
            const dur = yt.getDuration();
            const cur = yt.getCurrentTime();
            if (!dur) return;
            const fill = document.getElementById('progress-fill');
            if (fill) fill.style.width = (cur / dur * 100) + '%';
            save({ i: idx, t: cur });
        }, 1000);
    }

    function playIndex(i) {
        idx = (i + PLAYLIST.length) % PLAYLIST.length;
        if (yt) yt.loadVideoById(PLAYLIST[idx].videoId);
        updateTrack();
        highlightTrack();
    }

    function next() { playIndex(idx + 1); }

    function prev() {
        if (yt && yt.getCurrentTime() > 3) { yt.seekTo(0, true); return; }
        playIndex(idx - 1);
    }

    function toggle() {
        if (!yt) return;
        playing ? yt.pauseVideo() : yt.playVideo();
    }

    function play() {
        if (yt && !playing) yt.playVideo();
    }

    function scrub(e) {
        if (!yt || !yt.getDuration) return;
        const bar = e.currentTarget;
        const pct = Math.max(0, Math.min(1, e.offsetX / bar.offsetWidth));
        yt.seekTo(yt.getDuration() * pct, true);
    }

    function updateTrack() {
        const el = document.getElementById('player-track');
        if (!el) return;
        const t = PLAYLIST[idx];
        const label = t ? `${t.title} - ${t.artist}` : '—';

        el.innerHTML = '';
        const inner = document.createElement('span');
        inner.className = 'marquee-inner';
        inner.textContent = label;
        el.appendChild(inner);

        requestAnimationFrame(() => {
            const boxW = el.clientWidth;
            const textW = inner.scrollWidth;
            // always ticker: enters fully from the right, exits fully off the left, loops
            inner.style.setProperty('--start', boxW + 'px');
            inner.style.setProperty('--end', -textW + 'px');
            inner.style.animationDuration = Math.max(4, (boxW + textW) / 45) + 's';
        });
    }

    function measureGlyphWidth() {
        // .flower-front is display:block and fills its container regardless of
        // content, so measuring scrollWidth there just echoes the container's
        // width for short strings. Measure with an isolated, shrink-to-fit probe instead.
        const probe = document.createElement('span');
        probe.style.position = 'absolute';
        probe.style.visibility = 'hidden';
        probe.style.whiteSpace = 'nowrap';
        probe.style.fontFamily = "'Hibiscus', serif";
        probe.style.fontSize = '20px';
        probe.textContent = 'a';
        document.body.appendChild(probe);
        const width = probe.getBoundingClientRect().width;
        probe.remove();
        return width || 20;
    }

    async function buildFlowerStrip() {
        const front = document.querySelector('.flower-front');
        const shadow = document.querySelector('.flower-shadow');
        const box = document.querySelector('.player-flowerbox');
        if (!front || !shadow || !box) return;
        const chars = 'abcdefghijklmnopqrstuvwxyz';

        if (document.fonts && document.fonts.load) {
            try { await document.fonts.load("20px 'Hibiscus'"); } catch { }
        }

        const charWidth = measureGlyphWidth();
        const targetWidth = box.clientWidth * 0.99;
        const count = Math.max(10, Math.round(targetWidth / charWidth));

        let s = '';
        for (let i = 0; i < count; i++) s += chars[Math.floor(Math.random() * chars.length)];
        front.textContent = s;
        shadow.textContent = s;
    }

    function setupFlowerHover() {
        const box = document.querySelector('.player-flowerbox');
        const front = document.querySelector('.flower-front');
        const shadow = document.querySelector('.flower-shadow');
        if (!box || !front || !shadow) return;

        box.addEventListener('mousemove', (e) => {
            const rect = box.getBoundingClientRect();
            const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
            const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
            front.style.transform = `translate(${x * 5}px, ${y * 5}px)`;
            shadow.style.transform = `translate(${-x * 9}px, ${-y * 9}px)`;
        });

        box.addEventListener('mouseleave', () => {
            front.style.transform = 'translate(0px, 0px)';
            shadow.style.transform = 'translate(0px, 0px)';
        });
    }

    function updateBtn() {
        const btn = document.getElementById('play-btn');
        if (btn) btn.textContent = playing ? '⏸' : '▶';
    }

    function buildTrackList() {
        const el = document.getElementById('track-list');
        if (!el) return;
        el.innerHTML = '';
        PLAYLIST.forEach((t, i) => {
            const div = document.createElement('div');
            div.className = 'track-item';
            div.textContent = `${t.title} - ${t.artist}`;
            div.addEventListener('click', () => playIndex(i));
            el.appendChild(div);
        });
        highlightTrack();
    }

    function highlightTrack() {
        document.querySelectorAll('#track-list .track-item').forEach((el, i) => {
            el.classList.toggle('playing', i === idx);
        });
    }

    function save(state) { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch { } }
    function loadSaved() { try { return JSON.parse(localStorage.getItem(STORE_KEY)); } catch { return null; } }

    function init() {
        if (!document.getElementById('yt-player')) return;
        buildFlowerStrip();
        setupFlowerHover();
        window.addEventListener('resize', buildFlowerStrip);
        document.getElementById('play-btn')?.addEventListener('click', toggle);
        document.getElementById('next-btn')?.addEventListener('click', next);
        document.getElementById('prev-btn')?.addEventListener('click', prev);
        document.getElementById('player-progress')?.addEventListener('click', scrub);
        load();
    }

    document.addEventListener('DOMContentLoaded', init);

    window.LagunaPlayer = { play };
})();
