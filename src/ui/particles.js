// HTML5 Canvas Particle Systems & Physics
let stardustCtx = null;
let stardustParticles = [];
let stardustAnimId = null;

let jarCtx = null;
let jarParticles = [];
let jarAnimId = null;

export function initStardustBackground(canvasId, themePreference) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    stardustCtx = canvas.getContext('2d');
    
    const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Seed particles
    stardustParticles = [];
    for (let i = 0; i < 40; i++) {
        stardustParticles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 1,
            alpha: Math.random() * 0.5 + 0.1,
            speed: Math.random() * 0.15 + 0.05
        });
    }
    
    if (stardustAnimId) cancelAnimationFrame(stardustAnimId);
    
    function loop() {
        if (!stardustCtx) return;
        stardustCtx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Solar clock checks
        const hour = new Date().getHours();
        const isMorning = themePreference === 'morning' || 
                         (themePreference === 'auto' && hour < 17 && hour >= 5);
        
        stardustCtx.fillStyle = isMorning ? "rgba(217, 119, 6, 0.4)" : "rgba(197, 168, 128, 0.5)";
        
        stardustParticles.forEach(p => {
            stardustCtx.beginPath();
            stardustCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            stardustCtx.globalAlpha = p.alpha;
            stardustCtx.fill();
            
            p.y -= p.speed;
            if (p.y < 0) {
                p.y = canvas.height;
                p.x = Math.random() * canvas.width;
            }
        });
        stardustAnimId = requestAnimationFrame(loop);
    }
    loop();
}

export function triggerReflectionDissolve(canvasId, text, jarX, jarY, onComplete) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    jarCtx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    
    // Render text to offscreen canvas to extract pixel coordinates
    jarCtx.fillStyle = "#ffffff";
    jarCtx.font = "16px sans-serif";
    jarCtx.fillText(text.slice(0, 30), 20, 100);
    
    const imgData = jarCtx.getImageData(0, 0, canvas.width, canvas.height);
    jarCtx.clearRect(0, 0, canvas.width, canvas.height);
    
    jarParticles = [];
    const density = 4;
    for (let y = 0; y < canvas.height; y += density) {
        for (let x = 0; x < canvas.width; x += density) {
            const idx = (y * canvas.width + x) * 4;
            if (imgData.data[idx + 3] > 128) {
                jarParticles.push({
                    x: x,
                    y: y,
                    vx: (Math.random() - 0.5) * 1.0,
                    vy: -0.5 - Math.random() * 1.5,
                    alpha: 1.0,
                    size: Math.random() * 2 + 1.5
                });
            }
        }
    }
    
    if (jarAnimId) cancelAnimationFrame(jarAnimId);
    
    function animate() {
        if (!jarCtx) return;
        jarCtx.clearRect(0, 0, canvas.width, canvas.height);
        jarCtx.fillStyle = "rgba(197, 168, 128, 0.9)";
        
        let alive = false;
        jarParticles.forEach(p => {
            if (p.alpha <= 0.01) return;
            alive = true;
            
            jarCtx.beginPath();
            jarCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            jarCtx.globalAlpha = p.alpha;
            jarCtx.fill();
            
            // Physics rules
            p.vy += 0.15; // Gravity
            p.x += p.vx;
            p.y += p.vy;
            
            // Horizontal attraction drift
            const ax = (jarX - p.x) * 0.005;
            p.vx += ax;
            
            // Opacity decay
            p.alpha *= (0.95 + Math.random() * 0.03);
        });
        
        if (alive) {
            jarAnimId = requestAnimationFrame(animate);
        } else {
            if (onComplete) onComplete();
        }
    }
    animate();
}

/**
 * Visual Sparkling Dissolution for Vita Mode (2-tile match on board)
 */
export function triggerTileSparkleDissolve(el) {
    if (!el || typeof document === 'undefined') return;
    const parent = el.parentElement;
    if (!parent) return;

    try {
        const ghost = el.cloneNode(true);
        ghost.id = '';
        ghost.className = (el.className || '') + ' tile-dissolving-sparkle';
        ghost.style.position = 'absolute';
        ghost.style.left = `${el.offsetLeft}px`;
        ghost.style.top = `${el.offsetTop}px`;
        ghost.style.width = el.style.width || `${el.offsetWidth}px`;
        ghost.style.height = el.style.height || `${el.offsetHeight}px`;
        ghost.style.zIndex = '999';
        ghost.style.pointerEvents = 'none';

        parent.appendChild(ghost);
        spawnSparkBurst(ghost, parent);

        setTimeout(() => {
            if (ghost.parentElement) {
                ghost.parentElement.removeChild(ghost);
            }
        }, 420);
    } catch (e) {
        // Safe fallback in minimal environments
    }
}

/**
 * Kinetic Starlight Convergence: 2 matching tiles fly to midpoint, collide with ceramic smash, and dissolve into stardust
 */
export function triggerTileConvergenceSmash(el1, el2) {
    if (!el1 || !el2 || typeof document === 'undefined') return;
    const parent = el1.parentElement;
    if (!parent) return;

    try {
        const x1 = el1.offsetLeft;
        const y1 = el1.offsetTop;
        const x2 = el2.offsetLeft;
        const y2 = el2.offsetTop;

        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;

        const dx1 = mx - x1;
        const dy1 = my - y1;
        const dx2 = mx - x2;
        const dy2 = my - y2;

        // Ghost 1
        const ghost1 = el1.cloneNode(true);
        ghost1.id = '';
        ghost1.className = (el1.className || '') + ' tile-converging-smash';
        ghost1.style.position = 'absolute';
        ghost1.style.left = `${x1}px`;
        ghost1.style.top = `${y1}px`;
        ghost1.style.width = el1.style.width || `${el1.offsetWidth}px`;
        ghost1.style.height = el1.style.height || `${el1.offsetHeight}px`;
        ghost1.style.setProperty('--target-x', `${Math.round(dx1)}px`);
        ghost1.style.setProperty('--target-y', `${Math.round(dy1)}px`);
        ghost1.style.zIndex = '1001';
        ghost1.style.pointerEvents = 'none';

        // Ghost 2
        const ghost2 = el2.cloneNode(true);
        ghost2.id = '';
        ghost2.className = (el2.className || '') + ' tile-converging-smash';
        ghost2.style.position = 'absolute';
        ghost2.style.left = `${x2}px`;
        ghost2.style.top = `${y2}px`;
        ghost2.style.width = el2.style.width || `${el2.offsetWidth}px`;
        ghost2.style.height = el2.style.height || `${el2.offsetHeight}px`;
        ghost2.style.setProperty('--target-x', `${Math.round(dx2)}px`);
        ghost2.style.setProperty('--target-y', `${Math.round(dy2)}px`);
        ghost2.style.zIndex = '1002';
        ghost2.style.pointerEvents = 'none';

        parent.appendChild(ghost1);
        parent.appendChild(ghost2);

        // At midpoint impact (~170ms)
        setTimeout(() => {
            const midDummy = {
                getBoundingClientRect: () => {
                    const pRect = parent.getBoundingClientRect();
                    const w = el1.offsetWidth || 68;
                    const h = el1.offsetHeight || 88;
                    return {
                        left: pRect.left + mx,
                        top: pRect.top + my,
                        width: w,
                        height: h
                    };
                }
            };
            spawnSparkBurst(midDummy, parent, 12);

            // Micro board nudge on collision
            if (parent.classList) {
                parent.classList.add('board-micro-impact');
                setTimeout(() => {
                    if (parent.classList) parent.classList.remove('board-micro-impact');
                }, 180);
            }
        }, 170);

        // Cleanup ghosts
        setTimeout(() => {
            if (ghost1.parentElement) ghost1.parentElement.removeChild(ghost1);
            if (ghost2.parentElement) ghost2.parentElement.removeChild(ghost2);
        }, 420);
    } catch(e) {
        // Safe fallback
    }
}

/**
 * Visual Sparkling Dissolution for Tile Club Mode (3-tile match in tray)
 */
export function triggerTrayTriadSparkle(matchedFloraId) {
    if (typeof document === 'undefined') return;
    const trayEl = document.getElementById('tray-container');
    if (!trayEl) return;

    try {
        const slots = trayEl.querySelectorAll('.tray-slot');
        slots.forEach(slot => {
            const tile = slot.querySelector('.tray-tile');
            if (tile) {
                slot.classList.add('tray-slot-triad-sparkle');
                spawnSparkBurst(slot, trayEl);
                setTimeout(() => {
                    slot.classList.remove('tray-slot-triad-sparkle');
                }, 420);
            }
        });
    } catch (e) {
        // Safe fallback
    }
}

function spawnSparkBurst(targetEl, container, count = 8) {
    if (!targetEl || !container || typeof document === 'undefined') return;
    try {
        const targetRect = targetEl.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const cx = (targetRect.left - containerRect.left) + targetRect.width / 2;
        const cy = (targetRect.top - containerRect.top) + targetRect.height / 2;

        const sparkCount = count || 8;
        for (let i = 0; i < sparkCount; i++) {
            const angle = (i / sparkCount) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
            const distance = 20 + Math.random() * 28;
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance - 6;
            const rot = Math.round((Math.random() - 0.5) * 60);

            const spark = document.createElement('span');
            if (i % 2 === 0) {
                spark.className = 'celestial-spark-particle';
                spark.innerText = '✨';
                spark.style.fontSize = `${10 + Math.random() * 6}px`;
            } else {
                spark.className = 'celestial-spark-dot';
                const dotSize = 4 + Math.random() * 4;
                spark.style.width = `${dotSize}px`;
                spark.style.height = `${dotSize}px`;
            }

            spark.style.left = `${cx}px`;
            spark.style.top = `${cy}px`;
            spark.style.setProperty('--dx', `${Math.round(dx)}px`);
            spark.style.setProperty('--dy', `${Math.round(dy)}px`);
            spark.style.setProperty('--rot', `${rot}deg`);

            container.appendChild(spark);

            setTimeout(() => {
                if (spark.parentElement) {
                    spark.parentElement.removeChild(spark);
                }
            }, 460);
        }
    } catch (e) {
        // Safe fallback
    }
}

