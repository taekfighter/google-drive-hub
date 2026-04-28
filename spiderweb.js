(function(){
    const canvas = document.getElementById('spiderweb');
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    let W = 0, H = 0;
    let nodes = [], gridCols = 1, gridRows = 1, grid = [];
    let mouse = { x: -9999, y: -9999 };

    const N     = 100;    // node count — keeps animation smooth without taxing CPU
    const DIST  = 115;   // max line distance
    const MDIST = 150;   // mouse repel radius
    const CELL  = 115;   // spatial grid cell size (matches DIST)
    const FPS   = 30;
    const FRAME = 1000 / FPS;
    let lastT   = 0;
    let rafId   = null;

    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
        initNodes();
    }

    function initNodes() {
        const cols  = Math.max(1, Math.ceil(Math.sqrt(N * W / H)));
        const rows  = Math.max(1, Math.ceil(N / cols));
        const cellW = W / cols, cellH = H / rows;
        nodes = [];
        for (let r = 0; r < rows; r++)
            for (let c = 0; c < cols && nodes.length < N; c++)
                nodes.push({
                    x:  (c + Math.random()) * cellW,
                    y:  (r + Math.random()) * cellH,
                    vx: (Math.random() - .5) * .55,
                    vy: (Math.random() - .5) * .55,
                    pr: Math.random() * 1.2 + .8,
                    ph: Math.random() * Math.PI * 2,
                });
        buildGrid();
    }

    function buildGrid() {
        gridCols = Math.max(1, Math.ceil(W / CELL));
        gridRows = Math.max(1, Math.ceil(H / CELL));
        grid = Array.from({ length: gridCols * gridRows }, () => []);
        nodes.forEach((n, i) => {
            const gx = Math.min((n.x / CELL) | 0, gridCols - 1);
            const gy = Math.min((n.y / CELL) | 0, gridRows - 1);
            grid[gy * gridCols + gx].push(i);
        });
    }

    function neighbors(n) {
        const gx = Math.min((n.x / CELL) | 0, gridCols - 1);
        const gy = Math.min((n.y / CELL) | 0, gridRows - 1);
        const out = [];
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            const nx = gx + dx, ny = gy + dy;
            if (nx < 0 || ny < 0 || nx >= gridCols || ny >= gridRows) continue;
            for (const i of grid[ny * gridCols + nx]) out.push(i);
        }
        return out;
    }

    function draw(ts) {
        rafId = requestAnimationFrame(draw);
        if (ts - lastT < FRAME) return;
        lastT = ts;
        if (!W || !H) return;

        ctx.clearRect(0, 0, W, H);
        const rgb = '56,189,248';

        // Move nodes
        for (const n of nodes) {
            n.x += n.vx; n.y += n.vy; n.ph += .022;
            if (n.x < 0 || n.x > W) n.vx *= -1;
            if (n.y < 0 || n.y > H) n.vy *= -1;
            const md = Math.hypot(n.x - mouse.x, n.y - mouse.y);
            if (md < MDIST && md > 1) {
                const f = (MDIST - md) / MDIST * .5;
                n.x += (n.x - mouse.x) / md * f;
                n.y += (n.y - mouse.y) / md * f;
            }
        }
        buildGrid();

        // Draw lines
        const DIST2 = DIST * DIST;
        for (let ai = 0; ai < nodes.length; ai++) {
            const a = nodes[ai];
            for (const bi of neighbors(a)) {
                if (bi <= ai) continue;
                const b = nodes[bi];
                const dx = a.x - b.x, dy = a.y - b.y;
                const d2 = dx*dx + dy*dy;
                if (d2 >= DIST2) continue;
                const d = Math.sqrt(d2);
                const mi = Math.max(0, 1 - Math.min(
                    Math.hypot(a.x - mouse.x, a.y - mouse.y),
                    Math.hypot(b.x - mouse.x, b.y - mouse.y)) / MDIST);
                const alpha = ((1 - d / DIST) * .4 * (.15 + mi * .5)).toFixed(3);
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.strokeStyle = `rgba(${rgb},${alpha})`;
                ctx.lineWidth   = .4 + mi * .6;
                ctx.stroke();
            }
        }

        // Draw dots
        for (const n of nodes) {
            const mi = Math.max(0, 1 - Math.hypot(n.x - mouse.x, n.y - mouse.y) / MDIST);
            const p  = Math.sin(n.ph) * .5 + .5;
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.pr * (1 + p * .2 + mi * .4), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${rgb},${(.3 + p * .2 + mi * .35).toFixed(3)})`;
            ctx.fill();
        }
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 200);
    });
    window.addEventListener('mousemove', e => {
        mouse.x = e.clientX; mouse.y = e.clientY;
    }, { passive: true });

    resize();
    rafId = requestAnimationFrame(draw);

    // Pause when tab is hidden to prevent frame backlog
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(rafId);
            rafId = null;
        } else {
            lastT = 0;
            rafId = requestAnimationFrame(draw);
        }
    });
})();