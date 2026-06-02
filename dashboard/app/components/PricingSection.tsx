'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';

export default function PricingSection() {
  const sectionRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo('.price-card',
        { opacity: 0, y: 50 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 1, 
          stagger: 0.2, 
          ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' }
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 px-6 relative w-full bg-brand-dark border-t border-brand-light/10">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <h2 className="text-4xl md:text-5xl font-serif text-brand-light mb-4">Pricing <span className="italic text-brand-orange">Plans</span></h2>
        <p className="text-[#888888] text-sm max-w-xl text-center mb-16">Simple, transparent pricing for both open-source hobbyists and enterprise teams.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          {/* Free Tier */}
          <div className="price-card border border-brand-light/20 bg-[#050505] p-8 flex flex-col justify-between hover:border-brand-orange/50 transition-colors">
            <div>
              <h3 className="text-2xl font-serif text-brand-light mb-2">Manual Setup</h3>
              <div className="text-4xl font-mono text-brand-light mb-6">Free</div>
              <ul className="text-sm text-[#888888] space-y-3 mb-8">
                <li className="flex items-center gap-2"><span className="text-brand-orange">✓</span> Open-source core</li>
                <li className="flex items-center gap-2"><span className="text-brand-orange">✓</span> Self-hosted deployment</li>
                <li className="flex items-center gap-2"><span className="text-brand-orange">✓</span> Basic rate limiting</li>
                <li className="flex items-center gap-2 text-brand-light/40"><span className="text-brand-light/20">✗</span> No Dashboard Access</li>
                <li className="flex items-center gap-2 text-brand-light/40"><span className="text-brand-light/20">✗</span> No active threat updates</li>
                <li className="flex items-center gap-2 text-brand-light/40"><span className="text-brand-light/20">✗</span> Community support only</li>
              </ul>
            </div>
            <Link href="/implement" className="w-full text-center py-3 border border-brand-light/20 text-brand-light hover:bg-white hover:text-black transition-colors text-sm font-bold tracking-widest uppercase">
              Get Started
            </Link>
          </div>

          {/* Premium Tier */}
          <div className="price-card border border-brand-orange bg-[#050505] p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-brand-orange text-black text-[10px] font-bold px-3 py-1 uppercase tracking-widest">Recommended</div>
            <div>
              <h3 className="text-2xl font-serif text-brand-light mb-2">MANTIS Cloud API</h3>
              <div className="flex items-end gap-2 mb-6">
                <div className="text-4xl font-mono text-brand-orange">$49</div>
                <div className="text-sm text-[#888888] pb-1">/mo (or $499/yr)</div>
              </div>
              <ul className="text-sm text-[#888888] space-y-3 mb-8">
                <li className="flex items-center gap-2"><span className="text-brand-orange">✓</span> Full Dashboard Access</li>
                <li className="flex items-center gap-2"><span className="text-brand-orange">✓</span> Hosted on AWS Global Edge</li>
                <li className="flex items-center gap-2"><span className="text-brand-orange">✓</span> Active Threat Updates</li>
                <li className="flex items-center gap-2"><span className="text-brand-orange">✓</span> Organization Perks & Priority Support</li>
                <li className="flex items-center gap-2"><span className="text-brand-orange">✓</span> Exclusive Source Code Access</li>
              </ul>
            </div>
            <Link href="/implement" className="w-full text-center py-3 bg-brand-orange text-black hover:bg-white transition-colors text-sm font-bold tracking-widest uppercase">
              Subscribe Now
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
