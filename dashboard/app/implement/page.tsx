'use client';
import Link from 'next/link';
import CustomCursor from "../components/CustomCursor";

export default function ImplementPage() {
  return (
    <main className="min-h-screen bg-brand-dark text-brand-light overflow-x-hidden selection:bg-brand-orange selection:text-white font-sans flex flex-col items-center justify-center relative py-24">
      <CustomCursor />
      
      {/* Minimal Header */}
      <div className="absolute top-0 left-0 w-full p-8 md:p-12 flex justify-between items-center z-50 mix-blend-difference">
        <Link href="/" className="text-2xl font-bold tracking-tighter uppercase font-sans hover:text-brand-orange transition-colors">MANTIS</Link>
        <span className="text-[10px] tracking-[0.2em] uppercase text-brand-light/40">Implementation</span>
      </div>

      <section className="w-full max-w-4xl px-6 relative z-10">
        <div className="flex flex-col fade-up">
           <h1 className="text-4xl font-serif mb-2">Manual <span className="italic text-brand-orange">Setup</span></h1>
           <p className="text-sm text-brand-light/60 mb-8 max-w-2xl">
             To integrate manually, clone our open source repository and deploy the core microservices to your own infrastructure.
           </p>
           <div className="border border-brand-light/20 p-6 overflow-x-auto bg-[#050505] rounded mb-8">
              <pre className="text-sm text-brand-light/70 font-mono">
{`git clone https://github.com/arpan-pramanik/MANTIS.git
cd MANTIS/core
npm install
npm run build
npm start`}
              </pre>
           </div>
        </div>
      </section>
    </main>
  );
}
