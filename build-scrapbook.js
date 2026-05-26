const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, 'assets', 'scrapbook');
const OUTPUT = path.join(__dirname, 'pages', 'scrapbook.html');

const IMG_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
const CONTAINER_W = 860;
const PADDING = 24;
const COLS = 3;
const CELL_W = (CONTAINER_W - PADDING * 2) / COLS;
const IMG_W = 220;

function readImages(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => IMG_EXTS.has(path.extname(f).toLowerCase()))
    .sort();
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * arr.length);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateLayout(files) {
  const shuffled = shuffle([...files]);
  const layer1 = [];
  const layer2 = [];

  shuffled.forEach((f, i) => {
    if (i % 2 === 0) layer1.push(f);
    else layer2.push(f);
  });

  let maxBottom = PADDING;
  const layout = [];

  layer1.forEach((file, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = PADDING + col * CELL_W + rand(5, CELL_W - IMG_W - 5);
    const y = PADDING + row * 280 + rand(0, 40);
    const rot = rand(-3, 3);
    layout.push({ file, x, y, w: IMG_W, rot, layer: 1, z: 1 });
    maxBottom = Math.max(maxBottom, y + 320);
  });

  layer2.forEach((file, i) => {
    const col = i % (COLS - 1);
    const row = Math.floor(i / (COLS - 1));
    const x = PADDING + col * CELL_W + CELL_W / 2 + rand(5, CELL_W - IMG_W - 5);
    const y = PADDING + row * 280 + 140 + rand(-20, 20);
    const rot = rand(-6, 6);
    layout.push({ file, x, y, w: IMG_W, rot, layer: 2, z: 2 });
    maxBottom = Math.max(maxBottom, y + 260);
  });

  return { layout, height: maxBottom + PADDING };
}

function buildPage() {
  const files = readImages(ASSETS_DIR);
  const { layout, height } = generateLayout(files);

  const items = layout.map(img => {
    const src = `/assets/scrapbook/${img.file}`;
    const alt = img.file.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    return `      <img src="${src}" alt="${alt}" class="scrapbook-item layer-${img.layer}" style="left:${img.x.toFixed(1)}px;top:${img.y.toFixed(1)}px;width:${img.w.toFixed(1)}px;transform:rotate(${img.rot.toFixed(1)}deg)" loading="lazy">`;
  }).join('\n');

  const emptyMsg = files.length === 0
    ? `\n    <p class="scrapbook-empty">drop images into <code>assets/scrapbook/</code> and run <code>npm run scrapbook</code></p>\n`
    : '';

  const dragScript = files.length > 0 ? `
  <script>
    (function() {
      var container = document.querySelector('.scrapbook-container');
      if (!container) return;
      var items = container.querySelectorAll('.scrapbook-item');
      var dragTarget = null, offsetX, offsetY;

      function moveAt(clientX, clientY) {
        var rect = container.getBoundingClientRect();
        var x = clientX - rect.left - offsetX;
        var y = clientY - rect.top - offsetY;
        var maxX = rect.width - dragTarget.offsetWidth;
        var maxY = rect.height - dragTarget.offsetHeight;
        x = Math.max(0, Math.min(maxX, x));
        y = Math.max(0, Math.min(maxY, y));
        dragTarget.style.left = x + 'px';
        dragTarget.style.top = y + 'px';
      }

      function onStart(e) {
        dragTarget = e.currentTarget;
        var rect = container.getBoundingClientRect();
        var cx = e.clientX || e.touches[0].clientX;
        var cy = e.clientY || e.touches[0].clientY;
        var left = parseFloat(dragTarget.style.left) || 0;
        var top = parseFloat(dragTarget.style.top) || 0;
        offsetX = cx - rect.left - left;
        offsetY = cy - rect.top - top;
        dragTarget.style.zIndex = 999;
        dragTarget.style.cursor = 'grabbing';
        e.preventDefault();
      }

      function onMove(e) {
        if (!dragTarget) return;
        var cx = e.clientX || e.touches[0].clientX;
        var cy = e.clientY || e.touches[0].clientY;
        moveAt(cx, cy);
        e.preventDefault();
      }

      function onEnd() {
        if (dragTarget) {
          dragTarget.style.cursor = 'grab';
          dragTarget = null;
        }
      }

      items.forEach(function(img) {
        img.style.cursor = 'grab';
        img.addEventListener('mousedown', onStart);
        img.addEventListener('touchstart', onStart, { passive: false });
      });

      document.addEventListener('mousemove', onMove);
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('mouseup', onEnd);
      document.addEventListener('touchend', onEnd);
    })();
  </script>` : '';

  const page = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="/css/shared.css">
  <title>scrapbook - seafoam palace</title>
  <style>
    .scrapbook-page {
      max-width: ${CONTAINER_W + 40}px;
      margin: 40px auto;
    }

    .scrapbook-page h2 {
      font-size: 0.95rem;
      font-weight: normal;
      letter-spacing: 1px;
      margin-bottom: 12px;
    }

    .scrapbook-container {
      position: relative;
      width: ${CONTAINER_W}px;
      height: ${height}px;
      margin: 0 auto;
      user-select: none;
    }

    .scrapbook-item {
      position: absolute;
      border: 6px solid #fff;
      background: #fff;
      box-sizing: border-box;
      height: auto;
      touch-action: none;
    }

    .scrapbook-item.layer-1 { z-index: 1; }
    .scrapbook-item.layer-2 { z-index: 2; }

    body.dark-mode .scrapbook-item {
      border-color: #2a2a2a;
      background: #2a2a2a;
    }

    .scrapbook-empty {
      font-size: 0.85rem;
      color: #999;
      text-align: center;
      padding: 60px 0;
    }

    .scrapbook-empty code {
      font-family: inherit;
      background: #f0f0f0;
      padding: 1px 6px;
      border-radius: 3px;
    }

    @media (max-width: 940px) {
      .scrapbook-container {
        width: 100% !important;
        height: auto !important;
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: center;
        position: static;
        padding: 10px 0;
      }
      .scrapbook-item {
        position: static !important;
        width: calc(50% - 10px) !important;
        max-width: 280px !important;
        transform: none !important;
        border-width: 4px;
        margin: 0;
        cursor: default !important;
      }
    }

    @media (max-width: 500px) {
      .scrapbook-item {
        width: 100% !important;
        max-width: 100% !important;
      }
    }
  </style>
</head>
<body>
  <div id="site-nav"></div>
  <script src="/js/nav.js"></script>

  <div class="scrapbook-page">
    <h2>scrapbook</h2>
    ${emptyMsg}
    <div class="scrapbook-container">
${items}
    </div>
  </div>
  ${dragScript}
</body>
</html>`;

  fs.writeFileSync(OUTPUT, page);
  console.log(`scrapbook: ${files.length} images → ${OUTPUT}`);
}

buildPage();
