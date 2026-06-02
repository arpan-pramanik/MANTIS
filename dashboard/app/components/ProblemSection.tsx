'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function ProblemSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: sectionRef.current, start: 'top 70%', end: 'bottom 20%', toggleActions: 'play none none reverse' } });
      tl.fromTo(headingRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' })
        .fromTo(textRef.current?.children || [], { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, ease: 'power3.out' }, "-=0.5");
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center px-8 py-24 bg-brand-dark text-white">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="relative">
          <h2 ref={headingRef} className="text-4xl md:text-5xl lg:text-6xl font-serif font-medium leading-tight mb-16 z-10 relative">
            Your API powers your entire business.<br />Your infrastructure doesn't reflect it.
          </h2>
        </div>
        <div ref={textRef} className="space-y-8 text-[#888888] text-base md:text-lg max-w-md ml-auto">
          <p>You've spent years building your endpoints. Writing business logic. Scaling your application.</p>
          <p>But your API is exposed, unmonitored, and vulnerable to malicious traffic. Every attacker notices it before you do.</p>
          <p>You know you need an API gateway. But shipping features always comes first. And you haven't found a solution that integrates seamlessly with your stack.</p>
          <p>So years of engineering get undone by a single DDoS attack or data breach. And you'll never know how much malicious traffic quietly bypassed your system.</p>
        </div>
      </div>
    </section>
  );
}
