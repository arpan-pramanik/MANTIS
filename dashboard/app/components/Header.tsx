'use client';
import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';

export default function Header() {
  const [time, setTime] = useState('');
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(`MILAN ${now.toLocaleTimeString('en-GB', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit', hour12: false })}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    
    // Animate Header entrance
    const ctx = gsap.context(() => {
      gsap.to('.header-elem', { opacity: 1, y: 0, duration: 1, stagger: 0.2, ease: 'power3.out', delay: 1.2 });
    }, headerRef);

    return () => {
      clearInterval(interval);
      ctx.revert();
    };
  }, []);

  return (
    <header ref={headerRef} className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-8 py-6 mix-blend-difference text-[#EDEDED] font-sans text-sm tracking-widest uppercase pointer-events-none">
      <div className="flex items-center gap-4 header-elem opacity-0 translate-y-[-20px] pointer-events-auto">
        <span className="text-2xl font-bold tracking-tighter">FURO</span>
        <span className="text-[#888888]">{time}</span>
      </div>
      <nav className="header-elem opacity-0 translate-y-[-20px] pointer-events-auto">
        <ul className="flex items-center gap-8">
          <li><a href="#work" className="hover:text-brand-orange transition-colors">Work</a></li>
          <li><a href="#method" className="hover:text-brand-orange transition-colors">Method</a></li>
          <li><a href="#pricing" className="hover:text-brand-orange transition-colors">Pricing</a></li>
          <li className="flex items-center gap-2 text-brand-orange">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-orange inline-block"></span>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          </li>
        </ul>
      </nav>
    </header>
  );
}
