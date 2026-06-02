'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function StatementSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const plusRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(textRef.current, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1.5, ease: 'power3.out', scrollTrigger: { trigger: sectionRef.current, start: 'top 60%' } });
      gsap.fromTo(plusRefs.current, { opacity: 0, scale: 0, rotation: -90 }, { opacity: 1, scale: 1, rotation: 0, duration: 1, stagger: 0.1, ease: 'back.out(1.5)', scrollTrigger: { trigger: sectionRef.current, start: 'top 60%' } });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center justify-center px-8 py-24 bg-brand-light text-brand-dark overflow-hidden">
      <div ref={el => { plusRefs.current[0] = el }} className="absolute top-24 left-1/2 transform -translate-x-1/2 text-gray-400 font-mono">+</div>
      <div ref={el => { plusRefs.current[1] = el }} className="absolute bottom-24 left-1/2 transform -translate-x-1/2 text-gray-400 font-mono">+</div>
      <div ref={el => { plusRefs.current[2] = el }} className="absolute top-1/2 left-24 transform -translate-y-1/2 text-gray-400 font-mono">+</div>
      <div ref={el => { plusRefs.current[3] = el }} className="absolute top-1/2 right-24 transform -translate-y-1/2 text-gray-400 font-mono">+</div>
      <div className="max-w-4xl mx-auto text-center z-10">
        <h2 ref={textRef} className="text-5xl md:text-6xl lg:text-7xl font-serif font-medium leading-[1.1] tracking-tight">
          Your brand deserves a website<br />
          that <span className="text-brand-orange italic font-serif">matches</span> the work behind it.
        </h2>
      </div>
    </section>
  );
}
