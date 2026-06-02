'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    if (!wrapperRef.current || !containerRef.current) return;

    const sections = gsap.utils.toArray('.horizontal-panel');

    const tween = gsap.to(sections, {
      xPercent: -100 * (sections.length - 1),
      ease: "none",
      scrollTrigger: {
        trigger: wrapperRef.current,
        pin: true,
        scrub: 1,
        snap: 1 / (sections.length - 1),
        end: () => "+=" + containerRef.current?.offsetWidth,
      }
    });

    // Custom text reveal animations
    gsap.fromTo('.reveal-text', 
      { y: 100, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: "power4.out", delay: 0.5 }
    );

    return () => {
      tween.kill();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <main className="bg-[#0a0e1a] text-[#f0f4ff]">
      
      {/* Navbar overlay */}
      <nav className="fixed top-0 left-0 w-full p-8 flex justify-between z-50 pointer-events-none mix-blend-difference">
        <div className="font-bold tracking-[0.2em] uppercase text-sm">[M_25]</div>
        <div className="font-medium tracking-widest text-xs opacity-70">MANTIS STUDIO®</div>
        <div className="flex gap-4 font-mono text-xs opacity-50">
          <span>[X]</span>
          <span>[IG]</span>
          <span>[LI]</span>
        </div>
      </nav>

      {/* Main GSAP Horizontal Scroll Wrapper */}
      <div ref={wrapperRef} className="overflow-hidden h-screen w-full relative">
        <div ref={containerRef} className="flex w-[400vw] h-screen will-change-transform">
          
          {/* Panel 1: Hero */}
          <div className="horizontal-panel w-screen h-screen flex flex-col justify-center items-center relative px-20">
            <div className="absolute top-[20%] text-[#f59e0b] font-serif italic text-4xl opacity-80 reveal-text" style={{ fontFamily: 'Georgia, serif' }}>
              Advanced Protection In
            </div>
            <h1 className="text-[14vw] font-bold leading-[0.8] tracking-tighter text-[#eab308] mix-blend-screen uppercase drop-shadow-[0_0_30px_rgba(234,179,8,0.2)] reveal-text mt-8">
              TWENTY<br/>TWENTY<br/>FIVE
            </h1>
            <p className="text-xl mt-12 max-w-2xl text-center font-light opacity-80 reveal-text font-mono tracking-widest uppercase">
              Enterprise API Gateway & Threat Engine
            </p>
            <div className="absolute bottom-12 right-12 animate-pulse opacity-60 text-right">
              <p className="text-sm font-bold tracking-widest text-[#eab308]">[SCROLL]</p>
              <p className="text-xs mt-1">This way <span className="ml-2">→</span></p>
              <p className="text-xs opacity-50">To see the protection we built.</p>
            </div>
          </div>

          {/* Panel 2: Architecture */}
          <div className="horizontal-panel w-screen h-screen flex flex-col items-start justify-center px-32 relative">
             <div className="font-mono text-xs tracking-widest mb-4 opacity-50">[ARCHITECTURE] [NODE_PYTHON]</div>
             <h2 className="text-6xl md:text-8xl font-medium tracking-tight mb-8 leading-tight max-w-4xl text-[#f0f4ff]">
               An exploration of <span className="italic font-serif opacity-80">defense</span> through a precise, technical aesthetic.
             </h2>
             <div className="mt-8 flex gap-4">
                <div className="px-4 py-2 border border-white/10 rounded-full text-xs font-mono">INLINE VALIDATION</div>
                <div className="px-4 py-2 border border-white/10 rounded-full text-xs font-mono">ASYNC HEURISTICS</div>
             </div>
          </div>

          {/* Panel 3: Stats Showcase */}
          <div className="horizontal-panel w-screen h-screen flex items-center justify-between px-32 bg-[#05070a]">
            <div className="w-1/2">
              <div className="font-mono text-xs tracking-widest mb-4 opacity-50">[CAPABILITIES] [ML_POWERED]</div>
              <h2 className="text-5xl md:text-7xl font-medium tracking-tight leading-tight mb-8">
                Uncompromising security without adding latency.
              </h2>
            </div>
            <div className="w-1/2 flex justify-end">
               <div className="relative w-[500px] h-[600px] bg-[#111827] rounded-xl overflow-hidden border border-white/5 shadow-2xl p-12 flex flex-col justify-center">
                  <h3 className="text-9xl font-black text-[#eab308]">47</h3>
                  <p className="text-sm uppercase tracking-widest mt-4 opacity-60 font-mono">Tested Attack Vectors Neutered</p>
                  
                  <h3 className="text-9xl font-black text-white mt-12">0<span className="text-4xl">ms</span></h3>
                  <p className="text-sm uppercase tracking-widest mt-4 opacity-60 font-mono">Added Latency Overhead</p>
               </div>
            </div>
          </div>

          {/* Panel 4: Call to Action */}
          <div className="horizontal-panel w-screen h-screen flex flex-col justify-center items-center px-20 relative">
            <h2 className="text-[10vw] font-bold text-center leading-[0.8] tracking-tighter mb-16 text-[#eab308]">
              IMPLEMENT<br/>MANTIS
            </h2>
            <div className="flex gap-8 z-10 pointer-events-auto">
              <Link href="/dashboard" className="px-10 py-5 bg-white/5 backdrop-blur-md border border-white/10 text-white hover:bg-white hover:text-black transition-all duration-500 rounded-full text-sm font-bold tracking-[0.2em] uppercase">
                View Live TOC
              </Link>
              <Link href="/implement" className="px-10 py-5 bg-[#eab308] text-black hover:bg-white transition-all duration-500 rounded-full text-sm font-bold tracking-[0.2em] uppercase shadow-[0_0_40px_rgba(234,179,8,0.4)]">
                Start Integration
              </Link>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
