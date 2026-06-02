'use client';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });

  // Custom Cursor Tracking
  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', moveCursor);
    return () => window.removeEventListener('mousemove', moveCursor);
  }, []);

  // GSAP Animations
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const fadeElements = document.querySelectorAll('.fade-up');
    fadeElements.forEach((el) => {
      gsap.fromTo(el, 
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
          }
        }
      );
    });
    return () => { ScrollTrigger.getAll().forEach(t => t.kill()); };
  }, []);

  // Canvas Particle Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight * 0.7; // 70vh hero
    canvas.width = width;
    canvas.height = height;

    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;

    // Draw MANTIS text to sample
    offCtx.fillStyle = 'white';
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    
    // Scale text based on screen size
    const fontSize = width < 768 ? width * 0.25 : width * 0.2;
    offCtx.font = `900 ${fontSize}px 'Inter', 'Arial Black', sans-serif`;
    offCtx.fillText('MANTIS', width / 2, height / 2);

    const imgData = offCtx.getImageData(0, 0, width, height).data;
    const particles: any[] = [];
    
    const step = width < 768 ? 10 : 14; 
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const idx = (y * width + x) * 4;
        const alpha = imgData[idx + 3];
        if (alpha > 128) {
          particles.push({
            targetX: x,
            targetY: y,
            x: x + (Math.random() - 0.5) * 40,
            y: y + (Math.random() - 0.5) * 40,
            char: '+',
            phase: Math.random() * Math.PI * 2,
            opacity: 0,
            delay: Math.random() * 1500
          });
        }
      }
    }

    let mouseX = -9999;
    let mouseY = -9999;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', () => { mouseX = -9999; mouseY = -9999; });

    let startTime = Date.now();
    let rafId: number;

    function animate() {
      ctx!.clearRect(0, 0, width, height);
      const now = Date.now();
      const elapsed = now - startTime;

      ctx!.font = '10px monospace';
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';

      particles.forEach(p => {
        if (elapsed > p.delay) {
          const progress = Math.min((elapsed - p.delay) / 800, 1);
          const easeProgress = 1 - Math.pow(1 - progress, 3); // cubic ease out
          
          let baseOpacity = easeProgress * 0.45; 
          baseOpacity += Math.sin(now * 0.0015 + p.phase) * 0.15; // breathing
          
          p.x += (p.targetX - p.x) * 0.08;
          p.y += (p.targetY - p.y) * 0.08;
          
          const dx = mouseX - p.targetX;
          const dy = mouseY - p.targetY;
          const distSq = dx*dx + dy*dy;
          
          if (distSq < 12000) { 
            const proximity = 1 - distSq / 12000;
            ctx!.fillStyle = `rgba(204, 255, 0, ${proximity})`; // Lime Green hover
            // Furo glitch effect: sometimes change character on hover
            if (Math.random() < 0.1) p.char = Math.random() > 0.5 ? '0' : '1';
          } else {
            ctx!.fillStyle = `rgba(242, 243, 238, ${Math.max(0, baseOpacity)})`;
            if (Math.random() < 0.05) p.char = '+'; // restore
          }
          
          ctx!.fillText(p.char, p.x, p.y);
        }
      });
      rafId = requestAnimationFrame(animate);
    }
    animate();

    const handleResize = () => {
       // A full robust implementation would recalculate particles on resize. 
       // For this UI demo, we simply adjust bounds if needed, but a page reload is standard for canvas typography shifts.
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafId);
    }
  }, []);

  return (
    <main className="bg-mantis-dark text-white min-h-screen font-sans">
      
      {/* Custom Cursor */}
      <div 
        className="fixed top-0 left-0 pointer-events-none z-[9999] bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full flex items-center gap-2 text-[10px] font-sans font-medium tracking-widest uppercase text-white transition-opacity duration-300 hidden md:flex"
        style={{ 
          transform: `translate3d(${cursorPos.x + 15}px, ${cursorPos.y + 15}px, 0)`,
          opacity: cursorPos.x === -100 ? 0 : 1
        }}
      >
        <span className="text-mantis-accent text-lg leading-none mt-[-2px]">•</span> SCROLL
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full p-8 md:p-12 flex justify-between items-center z-50 mix-blend-difference">
        <div className="flex items-center gap-8">
          {/* Furo style logo: clean sans */}
          <Link href="/" className="text-2xl font-bold tracking-tighter uppercase font-sans">MANTIS</Link>
          <span className="hidden md:inline text-xs tracking-widest text-white/50 font-sans">TOKYO 14:10</span>
        </div>
        <div className="flex items-center gap-6 md:gap-10 text-[11px] tracking-[0.15em] uppercase font-sans text-white/90">
          <Link href="/dashboard" className="hover:text-mantis-accent transition-colors">WORK</Link>
          <Link href="/implement" className="hover:text-mantis-accent transition-colors">METHOD</Link>
          <Link href="/pricing" className="hover:text-mantis-accent transition-colors hidden md:inline">PRICING</Link>
          <div className="flex items-center gap-2">
            <span className="text-mantis-accent text-lg leading-none mt-[-2px]">•</span>
            <Link href="/contact" className="hover:text-white transition-colors">CONTACT</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-[80vh] flex flex-col justify-end items-start px-6 md:px-12 pb-24 overflow-hidden bg-mantis-dark">
        {/* Particle Canvas */}
        <div className="absolute top-0 left-0 w-full h-[70vh] pointer-events-auto">
          <canvas ref={canvasRef} className="w-full h-full block" />
        </div>
        
        {/* Editorial Text (Bottom Left) */}
        <div className="relative z-10 w-full max-w-7xl mx-auto flex justify-between items-end">
          <div className="fade-up">
            <h2 className="text-4xl md:text-6xl lg:text-[5rem] font-serif leading-[1.1] max-w-3xl">
              Websites that <span className="italic text-mantis-accent font-display">speak</span> <br />
              in your brand's voice.
            </h2>
          </div>
          <div className="hidden md:block fade-up pb-2">
            <p className="text-[13px] text-white/50 font-sans leading-relaxed max-w-[280px]">
              Brand, design, and code shaped as one. <br />
              So your online presence works as hard as you do.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Light Transition */}
      <section className="relative min-h-[60vh] bg-mantis-light text-mantis-dark flex items-center justify-center px-6 py-32">
        {/* Furo Crosshairs */}
        <div className="absolute top-12 left-12 text-mantis-dark/30 text-xs font-sans">+</div>
        <div className="absolute top-12 right-12 text-mantis-dark/30 text-xs font-sans">+</div>
        <div className="absolute bottom-12 left-12 text-mantis-dark/30 text-xs font-sans">+</div>
        <div className="absolute bottom-12 right-12 text-mantis-dark/30 text-xs font-sans">+</div>

        <h2 className="text-3xl md:text-5xl lg:text-[4rem] font-serif text-center max-w-4xl leading-[1.15] fade-up px-4">
          Your brand deserves a website that <span className="italic text-mantis-accent font-display">matches</span> the work behind it.
        </h2>
      </section>

      {/* Section 3: Vertical Staggered Features */}
      <section className="bg-mantis-dark py-32 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          
          <div className="fade-up mb-24">
            <h3 className="text-[10px] tracking-[0.2em] uppercase text-white/40 font-sans">What Sets Us Apart</h3>
          </div>

          <div className="space-y-0">
            {/* Feature 1 */}
            <div className="flex flex-col md:flex-row gap-8 md:gap-16 border-t border-white/10 py-16 fade-up group">
              <div className="md:w-3/5">
                <h2 className="text-5xl md:text-7xl font-display text-mantis-accent group-hover:text-white transition-colors duration-500">
                  01 Built around your brand
                </h2>
              </div>
              <div className="md:w-2/5 md:pt-4">
                <p className="text-[14px] text-white/60 font-sans leading-[1.8] max-w-md">
                  Most studios start with templates or competitor analysis. We start with you. Your positioning, your voice, your edge. So your website doesn't just look professional — it looks unmistakably like you.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col md:flex-row gap-8 md:gap-16 border-t border-white/10 py-16 fade-up group">
              <div className="md:w-3/5">
                <h2 className="text-5xl md:text-7xl font-display text-mantis-accent group-hover:text-white transition-colors duration-500">
                  02 Designed to keep working
                </h2>
              </div>
              <div className="md:w-2/5 md:pt-4">
                <p className="text-[14px] text-white/60 font-sans leading-[1.8] max-w-md">
                  A beautiful website isn't enough. Every site is built with strategy, user research, and SEO from day one. Designed to win trust, generate leads, and keep converting long after launch.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col md:flex-row gap-8 md:gap-16 border-t border-white/10 py-16 fade-up group border-b">
              <div className="md:w-3/5">
                <h2 className="text-5xl md:text-7xl font-display text-mantis-accent group-hover:text-white transition-colors duration-500">
                  03 Native in both worlds
                </h2>
              </div>
              <div className="md:w-2/5 md:pt-4">
                <p className="text-[14px] text-white/60 font-sans leading-[1.8] max-w-md">
                  Fluent in English and Chinese, trained in Western aesthetics and Asian market dynamics. We bridge the gap for cross-border brands expanding globally or entering new territories.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Section 4: The Method */}
      <section className="bg-mantis-dark pb-48 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12 md:gap-24 fade-up">
          <div className="md:w-1/2">
            <h3 className="text-[10px] tracking-[0.2em] uppercase text-white/40 mb-4 font-sans">The Method</h3>
            <h2 className="text-3xl md:text-5xl font-serif text-white leading-tight">The Brand Translation Method</h2>
          </div>
          <div className="md:w-1/2 md:pt-12">
            <p className="text-[14px] text-white/60 font-sans md:text-right max-w-sm ml-auto leading-relaxed">
              A 4-phase process for turning your brand into a website that earns trust, generates leads, and grows with you.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-32 space-y-0">
          
          {/* Step 1 */}
          <div className="flex flex-col md:flex-row gap-8 md:gap-12 py-16 fade-up">
            <div className="md:w-1/3">
              <h2 className="text-6xl md:text-[6rem] font-display italic text-mantis-accent leading-none">01 Discover</h2>
              <div className="w-full h-px bg-white/10 mt-8 mb-8 md:hidden"></div>
            </div>
            <div className="md:w-2/3 md:pl-24">
              <div className="w-full h-px bg-white/10 hidden md:block mb-8"></div>
              <h3 className="text-xl font-bold mb-4 font-sans text-white tracking-tight">Brand positioning & strategy</h3>
              <p className="text-white/60 font-sans text-[14px] leading-[1.8] mb-6 max-w-lg">
                Before we design anything, we go deep into who you are and who you serve. Through founder interviews, market research, and audience analysis, we define your positioning, your voice, and the story that makes you worth choosing.
              </p>
              <p className="text-white/60 font-sans text-[14px]">
                <span className="text-white font-bold">Outcome:</span> A clear brand foundation that every design decision can stand on.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col md:flex-row gap-8 md:gap-12 py-16 fade-up">
            <div className="md:w-1/3">
              <h2 className="text-6xl md:text-[6rem] font-display italic text-mantis-accent leading-none">02 Define</h2>
            </div>
            <div className="md:w-2/3 md:pl-24">
              <h3 className="text-xl font-bold mb-4 font-sans text-white tracking-tight">UX & Content architecture</h3>
              <p className="text-white/60 font-sans text-[14px] leading-[1.8] mb-6 max-w-lg">
                We translate the discoveries from Phase 01 into highly converting wireframes and content structures. Every page is mapped out to guide your visitors exactly where they need to go, minimizing friction and maximizing engagement.
              </p>
              <p className="text-white/60 font-sans text-[14px]">
                <span className="text-white font-bold">Outcome:</span> A strategic blueprint specifically tuned for your business goals.
              </p>
            </div>
          </div>

        </div>
      </section>

    </main>
  );
}
