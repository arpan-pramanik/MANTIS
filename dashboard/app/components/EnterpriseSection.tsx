'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function EnterpriseSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    
    const ctx = gsap.context(() => {
      gsap.fromTo('.ent-elem', 
        { opacity: 0, y: 50 },
        {
          opacity: 1, 
          y: 0,
          duration: 1,
          stagger: 0.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
          }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-32 px-8 bg-[#050505] text-[#EDEDED] font-sans relative border-t border-brand-light/10">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-16 items-center">
        <div className="flex-1 ent-elem">
          <h2 className="text-5xl md:text-6xl font-serif mb-6 leading-tight">MANTIS <br/><span className="italic text-brand-orange">Enterprise</span></h2>
          <p className="text-brand-light/60 text-lg mb-8 max-w-lg leading-relaxed">
            Need a fully managed, serverless deployment with advanced threat intelligence, an admin dashboard, and automated AWS provisioning?
          </p>
          <a href="mailto:developer@example.com?subject=MANTIS Enterprise Inquiry" className="inline-block py-4 px-8 border border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-black transition-colors font-bold tracking-widest uppercase text-sm">
            Contact Developer
          </a>
        </div>
        
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
           <div className="border border-brand-light/20 p-6 bg-black ent-elem hover:border-brand-orange/50 transition-colors">
              <h3 className="text-xl font-serif mb-2 text-white">Serverless Edge</h3>
              <p className="text-sm text-[#888888]">Zero infrastructure management. Deploy directly to AWS Lambda & API Gateway.</p>
           </div>
           <div className="border border-brand-light/20 p-6 bg-black ent-elem hover:border-brand-orange/50 transition-colors">
              <h3 className="text-xl font-serif mb-2 text-white">Threat Network</h3>
              <p className="text-sm text-[#888888]">Continuous real-time threat signature updates pushed to your endpoints.</p>
           </div>
           <div className="border border-brand-light/20 p-6 bg-black ent-elem hover:border-brand-orange/50 transition-colors">
              <h3 className="text-xl font-serif mb-2 text-white">Admin Dashboard</h3>
              <p className="text-sm text-[#888888]">Manage API keys, monitor system telemetry, and view detailed metrics.</p>
           </div>
           <div className="border border-brand-light/20 p-6 bg-black ent-elem hover:border-brand-orange/50 transition-colors">
              <h3 className="text-xl font-serif mb-2 text-white">Priority Support</h3>
              <p className="text-sm text-[#888888]">Direct access to core developers and priority bug fixes and updates.</p>
           </div>
        </div>
      </div>
    </section>
  );
}
