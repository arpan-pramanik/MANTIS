'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      // Fade in footer content
      gsap.fromTo(textRef.current, 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: footerRef.current, start: 'top 90%' } }
      );
    }, footerRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer ref={footerRef} className="relative w-full border-t border-white/10 bg-black text-[#888888] pt-12 pb-8 px-8">
      <div ref={textRef} className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start">
          <Link href="/" className="text-xl font-bold tracking-tighter text-[#EDEDED] mb-2 uppercase">MANTIS</Link>
          <p className="text-xs">Enterprise API Security Infrastructure.</p>
        </div>

        <div className="flex items-center gap-6 text-xs font-sans tracking-widest uppercase">
          <Link href="/implement" className="hover:text-brand-orange transition-colors">Implement</Link>
          <Link href="/source" className="hover:text-brand-orange transition-colors">Source</Link>
          <Link href="/dashboard" className="hover:text-brand-orange transition-colors">Dashboard</Link>
        </div>

        <div className="text-xs font-sans tracking-widest uppercase flex flex-col items-center md:items-end gap-2">
          <p className="mb-2">@ 2026 ARPAN VENTURES</p>
          <div className="flex gap-4 flex-wrap justify-center md:justify-end">
            <Link href="/terms" className="hover:text-[#EDEDED] transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-[#EDEDED] transition-colors">Privacy Policy</Link>
            <a href="https://terms.arpanpramanik.in/refund-policy" target="_blank" rel="noopener noreferrer" className="hover:text-[#EDEDED] transition-colors">Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
