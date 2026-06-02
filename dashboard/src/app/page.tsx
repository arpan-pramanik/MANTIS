'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const horizontalSectionRef = useRef<HTMLDivElement>(null);
  const horizontalContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    
    // Horizontal Scroll for "What sets us apart"
    const horizontalContent = horizontalContentRef.current;
    if (horizontalContent) {
      gsap.to(horizontalContent, {
        x: () => -(horizontalContent.scrollWidth - window.innerWidth),
        ease: "none",
        scrollTrigger: {
          trigger: horizontalSectionRef.current,
          start: "top top",
          end: () => `+=${horizontalContent.scrollWidth - window.innerWidth}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        }
      });
    }

    // Fade up texts
    const fadeElements = document.querySelectorAll('.fade-up');
    fadeElements.forEach((el) => {
      gsap.fromTo(el, 
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
          }
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <main ref={containerRef} className="bg-mantis-dark text-white min-h-screen font-sans selection:bg-mantis-accent">
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full p-6 md:p-12 flex justify-between items-center z-50 mix-blend-difference text-white">
        <div className="flex items-center gap-8">
          <span className="text-2xl md:text-3xl font-bold tracking-tighter uppercase font-sans">MANTIS</span>
          <span className="hidden md:inline text-xs tracking-widest text-white/50 font-sans">TOKYO 14:10</span>
        </div>
        <div className="flex items-center gap-6 md:gap-8 text-[10px] md:text-xs tracking-[0.2em] uppercase font-light font-sans">
          <Link href="/dashboard" className="hover:text-mantis-accent transition-colors">Dash</Link>
          <Link href="/implement" className="hover:text-mantis-accent transition-colors">Implement</Link>
          <Link href="/pricing" className="hover:text-mantis-accent transition-colors hidden md:inline">Pricing</Link>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-mantis-accent"></span>
            <Link href="/contact" className="hover:text-mantis-accent transition-colors">Contact</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[100vh] flex flex-col justify-center items-center px-6 md:px-12 pt-20 overflow-hidden bg-mantis-dark">
        {/* Massive masked text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full px-4 pointer-events-none">
          <h1 className="text-[20vw] leading-none font-bold text-center tracking-tighter uppercase bg-plus-pattern bg-clip-text text-transparent opacity-[0.85] select-none">
            MANTIS
          </h1>
        </div>
        
        {/* Editorial Text */}
        <div className="relative z-10 w-full max-w-7xl mx-auto flex justify-start items-end h-[60vh] md:h-[70vh]">
          <h2 className="text-4xl md:text-6xl lg:text-[5.5rem] font-serif leading-[1.1] max-w-4xl fade-up">
            API Security that <span className="italic text-mantis-accent">adapts</span> <br />
            in your infrastructure's voice.
          </h2>
        </div>
        <div className="relative z-10 w-full max-w-7xl mx-auto flex justify-end items-end h-[10vh] mt-12 md:mt-0">
          <p className="text-xs md:text-sm text-white/50 max-w-xs text-right font-sans font-light leading-relaxed fade-up">
            Behavioral analysis, heuristic design, and threat intelligence shaped as one.<br />
            So your backend operates as flawlessly as you do.
          </p>
        </div>
      </section>

      {/* Section 2: Light Transition */}
      <section className="relative min-h-[70vh] bg-mantis-light text-mantis-dark flex items-center justify-center px-6 py-32 overflow-hidden">
        {/* Crosshairs */}
        <div className="absolute top-12 left-12 text-mantis-dark/30 text-xs font-sans">+</div>
        <div className="absolute top-12 right-12 text-mantis-dark/30 text-xs font-sans">+</div>
        <div className="absolute bottom-12 left-12 text-mantis-dark/30 text-xs font-sans">+</div>
        <div className="absolute bottom-12 right-12 text-mantis-dark/30 text-xs font-sans">+</div>

        <h2 className="text-3xl md:text-6xl lg:text-7xl font-serif text-center max-w-5xl leading-[1.15] fade-up px-4">
          Your enterprise deserves protection that <span className="italic text-mantis-accent">matches</span> the scale of your ambition.
        </h2>
      </section>

      {/* Section 3: Horizontal Scroll Features */}
      <section ref={horizontalSectionRef} className="h-screen bg-mantis-dark overflow-hidden flex items-center">
        <div ref={horizontalContentRef} className="flex h-full items-center pl-6 md:pl-24 w-max">
          
          {/* Header block inside horizontal scroll */}
          <div className="w-[80vw] md:w-[35vw] flex-shrink-0 fade-up pr-12">
            <h3 className="text-[10px] tracking-[0.2em] uppercase text-white/50 mb-12 font-sans">What Sets Us Apart</h3>
            <p className="text-2xl md:text-4xl font-serif max-w-sm leading-tight text-white/90">The foundation of modern architectural security.</p>
          </div>

          {/* Feature 1 */}
          <div className="w-[85vw] md:w-[60vw] flex-shrink-0 flex flex-col xl:flex-row gap-8 xl:gap-16 border-t border-white/20 pt-12 mx-8 md:mx-12">
            <div className="xl:w-3/5">
              <h2 className="text-5xl md:text-7xl lg:text-8xl font-serif text-mantis-accent leading-tight">
                01 Built around <br/> your API
              </h2>
            </div>
            <div className="xl:w-2/5 xl:mt-6">
              <p className="text-sm md:text-[15px] text-white/70 font-sans leading-[1.8] max-w-md">
                Most gateways start with static rulesets or generic competitor analysis. We start with your schemas. Your endpoints, your traffic, your edge. So your security doesn't just look professional — it acts unmistakably like your own custom defense.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="w-[85vw] md:w-[60vw] flex-shrink-0 flex flex-col xl:flex-row gap-8 xl:gap-16 border-t border-white/20 pt-12 mx-8 md:mx-12">
            <div className="xl:w-3/5">
              <h2 className="text-5xl md:text-7xl lg:text-8xl font-serif text-mantis-accent leading-tight">
                02 Designed to <br/> keep working
              </h2>
            </div>
            <div className="xl:w-2/5 xl:mt-6">
              <p className="text-sm md:text-[15px] text-white/70 font-sans leading-[1.8] max-w-md">
                A robust proxy isn't enough. Every engine is built with ML strategy, behavioral research, and heuristic resilience from day one. Designed to win trust, mitigate anomalies, and keep your services strictly online.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="w-[85vw] md:w-[60vw] flex-shrink-0 flex flex-col xl:flex-row gap-8 xl:gap-16 border-t border-white/20 pt-12 mx-8 md:mx-12 pr-12 md:pr-24">
            <div className="xl:w-3/5">
              <h2 className="text-5xl md:text-7xl lg:text-8xl font-serif text-mantis-accent leading-tight">
                03 Native in <br/> both worlds
              </h2>
            </div>
            <div className="xl:w-2/5 xl:mt-6">
              <p className="text-sm md:text-[15px] text-white/70 font-sans leading-[1.8] max-w-md">
                Fluent in REST and GraphQL, trained in deeply nested architectures. We bridge the gap between simple static validation and complex dynamic threat mitigation effortlessly.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Section 4: The Method */}
      <section className="bg-mantis-dark pt-32 pb-48 px-6 md:px-24">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12 md:gap-24 fade-up">
          <div className="md:w-1/3">
            <h3 className="text-[10px] tracking-[0.2em] uppercase text-white/50 mb-4 font-sans">The Method</h3>
            <h2 className="text-3xl md:text-5xl font-serif text-white leading-tight">The Threat Mitigation Method</h2>
          </div>
          <div className="md:w-2/3 md:pt-12">
            <p className="text-sm md:text-base text-white/60 font-sans md:text-right max-w-md ml-auto leading-relaxed">
              A 4-phase process for turning your raw API traffic into a verified fortress that earns trust, generates resilience, and scales with you.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-32 space-y-24 md:space-y-32">
          
          {/* Step 1 */}
          <div className="flex flex-col md:flex-row gap-8 md:gap-12 border-t border-white/20 pt-12 fade-up">
            <div className="md:w-1/3">
              <h2 className="text-6xl md:text-[5.5rem] font-serif italic text-mantis-accent leading-none">01 Discover</h2>
            </div>
            <div className="md:w-2/3 md:pl-24">
              <h3 className="text-xl md:text-2xl font-bold mb-4 font-sans text-white">Infrastructure positioning & strategy</h3>
              <p className="text-white/60 font-sans text-sm md:text-[15px] leading-[1.8] mb-6 max-w-lg">
                Before we block anything, we go deep into how your services interact and who you serve. Through schema parsing, traffic analysis, and anomaly clustering, we define your baseline, your strict paths, and the exact signature that makes your traffic legitimate.
              </p>
              <p className="text-white/60 font-sans text-sm md:text-[15px]">
                <span className="text-white font-bold">Outcome:</span> A clear traffic foundation that every blocking decision can stand on.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col md:flex-row gap-8 md:gap-12 border-t border-white/20 pt-12 fade-up">
            <div className="md:w-1/3">
              <h2 className="text-6xl md:text-[5.5rem] font-serif italic text-mantis-accent leading-none">02 Define</h2>
            </div>
            <div className="md:w-2/3 md:pl-24">
              <h3 className="text-xl md:text-2xl font-bold mb-4 font-sans text-white">Heuristic rule generation</h3>
              <p className="text-white/60 font-sans text-sm md:text-[15px] leading-[1.8] mb-6 max-w-lg">
                We translate the discoveries from Phase 01 into highly performant, edge-ready middleware configurations. Every rule is shaped to minimize false positives while clamping down on unauthenticated lateral movement.
              </p>
              <p className="text-white/60 font-sans text-sm md:text-[15px]">
                <span className="text-white font-bold">Outcome:</span> A zero-trust gateway specifically tuned for your application logic.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-mantis-dark border-t border-white/10 py-12 px-6 md:px-24">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="text-xl md:text-2xl font-bold tracking-tighter uppercase font-sans text-white">MANTIS</span>
          <p className="text-[10px] uppercase tracking-widest text-white/30 font-sans">&copy; 2026 MANTIS Security. All rights reserved.</p>
        </div>
      </footer>

    </main>
  );
}
