'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import Link from 'next/link';

export default function Header() {
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Animate Header entrance
    const ctx = gsap.context(() => {
      gsap.to('.header-elem', { opacity: 1, y: 0, duration: 1, stagger: 0.2, ease: 'power3.out', delay: 1.2 });
    }, headerRef);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <header ref={headerRef} className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-8 py-6 mix-blend-difference text-[#EDEDED] font-sans text-sm tracking-widest uppercase pointer-events-none">
      <div className="flex items-center gap-4 header-elem opacity-0 translate-y-[-20px] pointer-events-auto">
        <Link href="/" className="text-2xl font-bold tracking-tighter">MANTIS</Link>
      </div>
      <nav className="header-elem opacity-0 translate-y-[-20px] pointer-events-auto">
        <ul className="flex items-center gap-8">
          <li><Link href="/implement" className="hover:text-brand-orange transition-colors">Implement</Link></li>
          <li><Link href="/source" className="hover:text-brand-orange transition-colors">Source Code</Link></li>
        </ul>
      </nav>
    </header>
  );
}
