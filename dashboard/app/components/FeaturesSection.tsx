'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const features = [
  { num: "01", title: "Built around your brand", desc: "Most studios start with templates or competitor analysis. We start with you. Your positioning, your voice, your edge. So your website doesn't just look professional — it looks unmistakably like you." },
  { num: "02", title: "Designed to keep working", desc: "A beautiful website isn't enough. Every site is built with strategy, user research, and SEO from day one. Designed to win trust, generate leads, and keep your business growing." },
  { num: "03", title: "Native in both worlds", desc: "Fluent in English and Chinese, trained in Western design sensibilities but deeply understanding of global markets. We bridge the gap seamlessly." }
];

export default function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const linesRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate lines expanding
      linesRef.current.forEach((line, i) => {
        if (!line) return;
        gsap.to(line, {
          width: '100%',
          duration: 1.5,
          ease: 'power3.inOut',
          scrollTrigger: { trigger: line, start: 'top 90%' }
        });
      });

      // Animate items fading in
      itemsRef.current.forEach((item, i) => {
        if (!item) return;
        gsap.fromTo(item, { opacity: 0, x: -50 }, { opacity: 1, x: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: item, start: 'top 85%' } });
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative min-h-screen px-8 py-32 bg-brand-dark text-white border-t border-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="mb-24">
          <p className="text-xs uppercase tracking-widest text-[#888888]">What Sets Us Apart</p>
        </div>
        <div className="flex flex-col relative border-t border-gray-800">
          <div ref={el => { linesRef.current[0] = el; }} className="absolute top-0 left-0 h-px bg-white/20" style={{ width: 0 }} />
          {features.map((feat, index) => (
            <div key={index} ref={el => { itemsRef.current[index] = el; }} className="group flex flex-col lg:flex-row items-start lg:items-center py-16 relative" data-cursor="Learn More">
              <div className="w-full lg:w-2/3 flex items-baseline gap-6 mb-8 lg:mb-0 transition-transform duration-500 group-hover:translate-x-4">
                <span className="text-5xl md:text-6xl lg:text-7xl font-serif text-brand-orange">{feat.num}</span>
                <h3 className="text-4xl md:text-5xl lg:text-6xl font-serif text-brand-orange">{feat.title}</h3>
              </div>
              <div className="w-full lg:w-1/3 pl-0 lg:pl-12 text-[#888888] text-base md:text-lg leading-relaxed">
                <p>{feat.desc}</p>
              </div>
              {/* Divider line below each item */}
              <div ref={el => { linesRef.current[index + 1] = el; }} className="absolute bottom-0 left-0 h-px bg-white/20" style={{ width: 0 }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
