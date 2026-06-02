'use client';
import { useEffect, useRef } from 'react';

export default function FuroCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const isMobile = window.innerWidth <= 478;
    const isTablet = window.innerWidth <= 991 && window.innerWidth > 478;
    const isLowEnd = (navigator.hardwareConcurrency || 4) <= 4;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    const CONFIG = {
      sampleStep: isMobile ? 10 : isLowEnd ? 12 : 8,
      alphaThreshold: 100,
      crossSize: isMobile ? 1.2 : (isTablet ? 1.8 : 2.5),
      crossWidth: isMobile ? 0.6 : 1,
      driftRange: isMobile ? 8 : 14,
      finalOpacity: 0.45,
      particleColorRGB: '242, 243, 238',
      fadeInDuration: 2200,
      staggerRange: 1800,
      breathing: true,
      breathingAmplitude: 0.08,
      breathingSpeed: 0.0008,
      sampleBudgetPerFrame: 4,
      minVisibleOpacity: 0.02,
      hover: {
        enabled: !isTouchDevice && !isMobile,
        radius: 120,
        radiusSq: 120 * 120,
        outerRadiusSq: 250 * 250,
        switchProb: 0.08,
        cooldown: 250,
        restoreCooldown: 500,
        digits: ['0', '1'],
        digitFontSize: isMobile ? 5 : 7,
        digitOpacityBoost: 1.4,
      },
      gridCellSize: 50,
    };

    const SVG_STRING = `<svg width="1320" height="368" viewBox="0 0 1320 368" xmlns="http://www.w3.org/2000/svg">
  <text x="-10" y="320" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="360" fill="#fff" text-anchor="start" letter-spacing="-5">MANTIS</text>
</svg>`;

    let particles: any[] = [];
    let startTime: number | null = null;
    let allDoneTime: number | null = null;
    let isVisible = true;
    let isRunning = false;
    let mouseX = -9999;
    let mouseY = -9999;
    let mouseMoveScheduled = false;
    let pendingMouseX = -9999;
    let pendingMouseY = -9999;

    const spatialGrid = new Map();
    const nearbySet = new Set();
    const opacityBuckets = new Map();
    const digitDrawList: any[] = [];

    function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3); }

    function samplePixelsChunked() {
      return new Promise<any[]>((resolve) => {
        const img = new Image();
        const blob = new Blob([SVG_STRING], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        img.onload = function () {
          const w = canvas.clientWidth;
          const h = canvas.clientHeight;

          const off = document.createElement('canvas');
          off.width = w;
          off.height = h;
          const offCtx = off.getContext('2d');
          if (!offCtx) return;
          offCtx.drawImage(img, 0, 0, w, h);

          const data = offCtx.getImageData(0, 0, w, h).data;
          const samples: any[] = [];
          let y = 0;

          function processChunk() {
            const chunkStart = performance.now();
            while (y < h && (performance.now() - chunkStart) < CONFIG.sampleBudgetPerFrame) {
              for (let x = 0; x < w; x += CONFIG.sampleStep) {
                const idx = (Math.floor(y) * w + Math.floor(x)) * 4;
                const alpha = data[idx + 3];
                const brightness = data[idx];
                if (alpha > CONFIG.alphaThreshold && brightness > 200) {
                  samples.push({ x: x, y: y });
                }
              }
              y += CONFIG.sampleStep;
            }

            if (y < h) {
              requestAnimationFrame(processChunk);
            } else {
              URL.revokeObjectURL(url);
              resolve(samples);
            }
          }
          requestAnimationFrame(processChunk);
        };
        img.src = url;
      });
    }

    function createParticles(samples: any[]) {
      return samples.map((s) => ({
        targetX: s.x,
        targetY: s.y,
        offsetX: (Math.random() - 0.5) * CONFIG.driftRange * 2,
        offsetY: (Math.random() - 0.5) * CONFIG.driftRange * 2,
        delay: Math.random() * CONFIG.staggerRange,
        breathPhase: Math.random() * Math.PI * 2,
        char: '+',
        lastSwitch: 0,
        glowAmount: 0,
      }));
    }

    function buildSpatialGrid() {
      spatialGrid.clear();
      const cellSize = CONFIG.gridCellSize;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const gx = Math.floor(p.targetX / cellSize);
        const gy = Math.floor(p.targetY / cellSize);
        const key = gx * 10000 + gy;
        let cell = spatialGrid.get(key);
        if (!cell) {
          cell = [];
          spatialGrid.set(key, cell);
        }
        cell.push(p);
      }
    }

    function updateNearbyParticles() {
      nearbySet.clear();
      if (mouseX < 0) return;
      const cellSize = CONFIG.gridCellSize;
      const gx = Math.floor(mouseX / cellSize);
      const gy = Math.floor(mouseY / cellSize);
      const radius = Math.ceil(CONFIG.hover.radius / cellSize) + 1;
      
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          const key = (gx + dx) * 10000 + (gy + dy);
          const cell = spatialGrid.get(key);
          if (cell) {
            for (let i = 0; i < cell.length; i++) {
              nearbySet.add(cell[i]);
            }
          }
        }
      }
    }

    function animate(timestamp: number) {
      if (!isVisible) {
        isRunning = false;
        return;
      }
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      if(ctx) {
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      }
      
      if (CONFIG.hover.enabled) {
        updateNearbyParticles();
      }
      
      opacityBuckets.clear();
      digitDrawList.length = 0;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const localTime = elapsed - p.delay;

        if (localTime <= 0) continue;

        const progress = Math.min(localTime / CONFIG.fadeInDuration, 1);
        if (progress < 0.05) continue;
        
        const eased = easeOutCubic(progress);
        const x = p.targetX + p.offsetX * (1 - eased);
        const y = p.targetY + p.offsetY * (1 - eased);
        let opacity = CONFIG.finalOpacity * eased;
        const size = CONFIG.crossSize * eased;

        if (progress >= 1 && CONFIG.breathing) {
          if (!allDoneTime) allDoneTime = timestamp;
          const breath = Math.sin((timestamp - allDoneTime) * CONFIG.breathingSpeed + p.breathPhase);
          opacity = CONFIG.finalOpacity + breath * CONFIG.breathingAmplitude * CONFIG.finalOpacity;
        }
        
        if (CONFIG.hover.enabled && progress >= 1 && nearbySet.has(p)) {
          const dx = mouseX - p.targetX;
          const dy = mouseY - p.targetY;
          const distSq = dx * dx + dy * dy;
          
          if (distSq < CONFIG.hover.radiusSq && timestamp - p.lastSwitch > CONFIG.hover.cooldown) {
            const proximity = 1 - distSq / CONFIG.hover.radiusSq;
            const dynamicProb = CONFIG.hover.switchProb * proximity;
            if (p.char === '+' && Math.random() < dynamicProb) {
              p.char = CONFIG.hover.digits[Math.floor(Math.random() * CONFIG.hover.digits.length)];
              p.lastSwitch = timestamp;
              p.glowAmount = 1;
            }
          }
        }
        
        if (CONFIG.hover.enabled && p.char !== '+' && progress >= 1) {
          const dx = mouseX - p.targetX;
          const dy = mouseY - p.targetY;
          const distSq = dx * dx + dy * dy;
          if ((distSq > CONFIG.hover.outerRadiusSq || mouseX < 0) && timestamp - p.lastSwitch > CONFIG.hover.restoreCooldown) {
            if (Math.random() < 0.1) {
              p.char = '+';
              p.lastSwitch = timestamp;
            }
          }
        }
        
        if (p.glowAmount > 0) {
          p.glowAmount *= 0.95;
          if (p.glowAmount < 0.01) p.glowAmount = 0;
        }
        
        const finalOpacity = Math.min(1, opacity * (1 + p.glowAmount * (CONFIG.hover.digitOpacityBoost - 1)));
        if (finalOpacity < CONFIG.minVisibleOpacity) continue;
        
        if (p.char === '+') {
          const bucketKey = Math.round(finalOpacity * 50) / 50;
          let bucket = opacityBuckets.get(bucketKey);
          if (!bucket) {
            bucket = [];
            opacityBuckets.set(bucketKey, bucket);
          }
          bucket.push(x, y, size);
        } else {
          digitDrawList.push(x, y, finalOpacity, p.char);
        }
      }
      
      if(ctx) {
        ctx.lineWidth = CONFIG.crossWidth;
        ctx.lineCap = 'square';
        opacityBuckets.forEach((items, opacity) => {
          ctx.strokeStyle = `rgba(${CONFIG.particleColorRGB}, ${opacity})`;
          ctx.beginPath();
          for (let i = 0; i < items.length; i += 3) {
            const x = items[i];
            const y = items[i + 1];
            const size = items[i + 2];
            ctx.moveTo(x - size, y);
            ctx.lineTo(x + size, y);
            ctx.moveTo(x, y - size);
            ctx.lineTo(x, y + size);
          }
          ctx.stroke();
        });
        
        if (digitDrawList.length > 0) {
          ctx.font = `${CONFIG.hover.digitFontSize}px ui-monospace, "SF Mono", Monaco, monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          for (let i = 0; i < digitDrawList.length; i += 4) {
            const x = digitDrawList[i];
            const y = digitDrawList[i + 1];
            const op = digitDrawList[i + 2];
            const ch = digitDrawList[i + 3];
            if (ch === '1') {
              ctx.fillStyle = `rgba(16, 185, 129, ${op})`; // green
            } else if (ch === '0') {
              ctx.fillStyle = `rgba(110, 231, 183, ${op})`; // lighter green
            } else {
              ctx.fillStyle = `rgba(${CONFIG.particleColorRGB}, ${op})`;
            }
            ctx.fillText(ch, x, y);
          }
        }
      }

      rafId = requestAnimationFrame(animate);
    }

    function setupCanvas() {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx?.scale(dpr, dpr);
    }
    
    function setupMouseTracking() {
      if (!CONFIG.hover.enabled) return;
      window.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        pendingMouseX = e.clientX - rect.left;
        pendingMouseY = e.clientY - rect.top;
        if (!mouseMoveScheduled) {
          mouseMoveScheduled = true;
          requestAnimationFrame(() => {
            mouseX = pendingMouseX;
            mouseY = pendingMouseY;
            mouseMoveScheduled = false;
          });
        }
      }, { passive: true });
      
      document.addEventListener('mouseleave', () => {
        mouseX = -9999;
        mouseY = -9999;
      });
    }

    async function init() {
      setupCanvas();
      const samples = await samplePixelsChunked();
      const startAnimation = () => {
        particles = createParticles(samples);
        buildSpatialGrid();
        container?.classList.add('particles-ready');
        setupMouseTracking();
        const io = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            isVisible = entry.isIntersecting;
            if (isVisible && !isRunning) {
              isRunning = true;
              rafId = requestAnimationFrame(animate);
            }
          });
        }, { threshold: 0 });
        io.observe(canvas);
        isRunning = true;
        rafId = requestAnimationFrame(animate);
      };
      startAnimation();
    }

    setTimeout(init, 300);

    let resizeTimer: any;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        startTime = null;
        allDoneTime = null;
        if (rafId) cancelAnimationFrame(rafId);
        setupCanvas();
        samplePixelsChunked().then((samples) => {
          particles = createParticles(samples);
          particles.forEach((p) => { p.delay = 0; });
          buildSpatialGrid();
          if (isVisible) {
            isRunning = true;
            rafId = requestAnimationFrame(animate);
          }
        });
      }, 200);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div ref={containerRef} className="furo-particles absolute top-0 left-8 right-8 aspect-[1320/368] pointer-events-none z-10 hidden md:block" style={{ width: '100%', maxWidth: '80vw' }}>
      <svg className="furo-static absolute top-0 left-0 w-full h-full opacity-10 transition-opacity duration-500 ease-out" viewBox="0 0 1320 368" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
        <g fill="rgba(242, 243, 238, 0.08)">
          <text x="-10" y="320" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="360" text-anchor="start" letter-spacing="-5">MANTIS</text>
        </g>
      </svg>
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full block"></canvas>
    </div>
  );
}
