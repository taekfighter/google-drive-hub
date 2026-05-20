(function(){
    const canvas = document.getElementById('spiderweb');
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    let W = 0, H = 0;
    let nodes = [], gridCols = 1, gridRows = 1, grid = [];
    let mouse = { x: -9999, y: -9999 };

    const N     = 90;
    const DIST  = 130;
    const MDIST = 160;
    const CELL  = 130;
    const FPS   = 60;
    const FRAME = 1000 / FPS;
    let lastT   = 0;
    let rafId   = null;
    let hue     = 0;   // global hue that slowly cycles

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
                    x:      (c + Math.random()) * cellW,
                    y:      (r + Math.random()) * cellH,
                    vx:     (Math.random() - .5) * .7,
                    vy:     (Math.random() - .5) * .7,
                    pr:     Math.random() * 1.8 + .6,
                    ph:     Math.random() * Math.PI * 2,
                    pulse:  Math.random() * Math.PI * 2,
                    hueOff: Math.random() * 60 - 30,   // each node shifts hue ±30°
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
            const idx = gy * gridCols + gx;
            if (grid[idx]) {  // Safety check
                grid[idx].push(i);
            }
        });
    }

    function neighbors(n) {
        const gx = Math.min((n.x / CELL) | 0, gridCols - 1);
        const gy = Math.min((n.y / CELL) | 0, gridRows - 1);
        const out = [];
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            const nx = gx + dx, ny = gy + dy;
            if (nx < 0 || ny < 0 || nx >= gridCols || ny >= gridRows) continue;
            const idx = ny * gridCols + nx;
            if (grid[idx]) {  // Safety check
                for (const i of grid[idx]) out.push(i);
            }
        }
        return out;
    }

    function hslStr(h, s, l, a) {
        return 'hsla(' + (h | 0) + ',' + s + '%,' + l + '%,' + a.toFixed(3) + ')';
    }

    function draw(ts) {
        rafId = requestAnimationFrame(draw);
        if (ts - lastT < FRAME) return;
        const dt = Math.min((ts - lastT) / 16, 3);
        lastT = ts;
        if (!W || !H) return;

        // Slowly cycle the global hue
        hue = (hue + 0.12 * dt) % 360;

        ctx.clearRect(0, 0, W, H);

        // Move nodes
        for (const n of nodes) {
            n.x += n.vx * dt;
            n.y += n.vy * dt;
            n.ph    += .018 * dt;
            n.pulse += .04  * dt;
            if (n.x < 0 || n.x > W) n.vx *= -1;
            if (n.y < 0 || n.y > H) n.vy *= -1;
            const md = Math.hypot(n.x - mouse.x, n.y - mouse.y);
            if (md < MDIST && md > 1) {
                const f = (MDIST - md) / MDIST * .6;
                n.x += (n.x - mouse.x) / md * f * dt;
                n.y += (n.y - mouse.y) / md * f * dt;
            }
        }
        buildGrid();

        const DIST2 = DIST * DIST;

        // Draw lines — gradient between each pair's hues
        for (let ai = 0; ai < nodes.length; ai++) {
            const a = nodes[ai];
            for (const bi of neighbors(a)) {
                if (bi <= ai) continue;
                const b = nodes[bi];
                const dx = a.x - b.x, dy = a.y - b.y;
                const d2 = dx * dx + dy * dy;
                if (d2 >= DIST2) continue;
                const d   = Math.sqrt(d2);
                const t   = 1 - d / DIST;

                const mda = Math.hypot(a.x - mouse.x, a.y - mouse.y);
                const mdb = Math.hypot(b.x - mouse.x, b.y - mouse.y);
                const mi  = Math.max(0, 1 - Math.min(mda, mdb) / MDIST);

                const baseAlpha = t * .38 * (.18 + mi * .6);
                const lineWidth = .4 + t * 1.4 + mi * 1.4;

                const ha = (hue + a.hueOff + 200) % 360;
                const hb = (hue + b.hueOff + 200) % 360;

                // Color gradient from node A to node B
                const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
                grad.addColorStop(0, hslStr(ha, 90, 70, baseAlpha));
                grad.addColorStop(1, hslStr(hb, 90, 70, baseAlpha));

                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.strokeStyle = grad;
                ctx.lineWidth   = lineWidth;
                ctx.stroke();
            }
        }

        // Draw nodes — three-layer glow
        for (const n of nodes) {
            const mi    = Math.max(0, 1 - Math.hypot(n.x - mouse.x, n.y - mouse.y) / MDIST);
            const p     = Math.sin(n.ph)    * .5 + .5;
            const pulse = Math.sin(n.pulse) * .5 + .5;
            const nh    = (hue + n.hueOff + 200) % 360;
            const r     = n.pr * (1 + p * .3 + mi * .8);

            // Outer halo — only brightens near mouse
            if (mi > .05) {
                ctx.beginPath();
                ctx.arc(n.x, n.y, r * 3.5, 0, Math.PI * 2);
                ctx.fillStyle = hslStr(nh, 100, 65, mi * .09);
                ctx.fill();
            }

            // Mid glow
            ctx.beginPath();
            ctx.arc(n.x, n.y, r * 1.9, 0, Math.PI * 2);
            ctx.fillStyle = hslStr(nh, 90, 65, .08 + pulse * .06 + mi * .14);
            ctx.fill();

            // Core dot
            ctx.beginPath();
            ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
            ctx.fillStyle = hslStr(nh, 95, 80, .45 + p * .28 + mi * .3);
            ctx.fill();
        }


    }

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 200);
    });
    window.addEventListener('mousemove', e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    }, { passive: true });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(rafId);
            rafId = null;
        } else {
            lastT = 0;
            rafId = requestAnimationFrame(draw);
        }
    });

    resize();
    rafId = requestAnimationFrame(draw);
})();