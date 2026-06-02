'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import FuroCanvas from './FuroCanvas';

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(textRef.current?.children || [], { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, stagger: 0.2, ease: 'power3.out', delay: 0.8 });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="relative min-h-screen flex flex-col justify-center px-8 pt-32 pb-24">
      <div className="flex-1 flex flex-col justify-center">
        <div className="relative w-full h-[150px] md:h-[350px] mb-8">
           <FuroCanvas />
        </div>
        <div ref={textRef} className="mt-8 md:mt-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-medium font-serif leading-tight tracking-tight">
              Enterprise security that <span className="text-brand-orange italic font-serif">protects</span><br />
              your API infrastructure.
            </h2>
          </div>
          <div className="max-w-sm text-[#888888] text-sm md:text-base leading-relaxed">
            <p>Zero-trust architecture. Real-time threat detection.</p>
            <p>So your systems stay secure, automatically.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
