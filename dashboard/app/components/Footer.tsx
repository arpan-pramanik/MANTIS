'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const btnRef = useRef<HTMLAnchorElement>(null);
  const watermarkRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      // Stagger the text lines up
      gsap.fromTo(textRef.current, 
        { opacity: 0, y: 50 }, 
        { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: footerRef.current, start: 'top 75%' } }
      );
      
      // Button fade in
      gsap.fromTo(btnRef.current, 
        { opacity: 0, scale: 0.9 }, 
        { opacity: 1, scale: 1, duration: 0.8, delay: 0.5, ease: 'back.out(1.7)', scrollTrigger: { trigger: footerRef.current, start: 'top 75%' } }
      );

      // Massive watermark slide up
      gsap.fromTo(watermarkRef.current, 
        { opacity: 0, y: 150 }, 
        { opacity: 1, y: 0, duration: 1.5, ease: 'power2.out', scrollTrigger: { trigger: footerRef.current, start: 'top 50%' } }
      );
    }, footerRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer ref={footerRef} className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#f2f3ee] to-[#ffc4b0] text-[#222222] pt-24 pb-8 px-8 min-h-screen">
      <div className="max-w-4xl mx-auto flex flex-col items-center text-center z-10 mt-16">
        <h2 ref={textRef} className="text-5xl md:text-7xl lg:text-[7rem] font-serif leading-[0.9] text-brand-orange tracking-tight mb-12">
          Build The<br />
          Website<br />
          Your Brand<br />
          <span className="italic">Deserves</span>
        </h2>
        
        <a ref={btnRef} href="#contact" data-cursor="Contact Us" className="inline-flex items-center gap-2 border border-[#222222]/20 rounded-full px-6 py-3 text-sm font-medium hover:bg-[#222222] hover:text-white transition-colors duration-300">
          <span className="text-brand-orange text-lg leading-none">•</span> Book A 30-Minute Call
        </a>
      </div>

      <div className="w-full flex justify-center items-end mt-auto pointer-events-none select-none z-0">
        <h1 ref={watermarkRef} className="text-[25vw] leading-[0.75] font-bold tracking-tighter text-brand-orange/20 mix-blend-multiply">
          FURO
        </h1>
      </div>

      <div className="w-full flex flex-col md:flex-row justify-between items-center text-xs font-sans tracking-widest text-[#222222]/60 mt-12 z-10 relative">
        <p>@ 2026 FURO WEB STUDIO</p>
        <p>MILAN 12:57</p>
        <a href="#privacy" className="hover:text-[#222222] transition-colors">PRIVACY POLICY</a>
      </div>
    </footer>
  );
}
