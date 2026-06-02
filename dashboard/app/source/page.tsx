'use client';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import CustomCursor from '../components/CustomCursor';

export default function SourcePage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <main className="min-h-screen bg-brand-dark text-brand-light font-sans flex flex-col items-center justify-center p-8 text-center">
        <CustomCursor />
        <h1 className="text-3xl font-serif mb-4 text-red-500">Access Denied</h1>
        <p className="text-[#888888] mb-8">You must be logged in to access the MANTIS source code repository.</p>
        <Link href="/" className="px-6 py-2 border border-brand-light/20 rounded hover:bg-white hover:text-black transition-colors">
          Return Home to Login
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-dark text-brand-light font-sans p-8 md:p-24">
      <CustomCursor />
      
      {/* Minimal Header */}
      <div className="absolute top-0 left-0 w-full p-8 md:p-12 flex justify-between items-center z-50">
        <Link href="/" className="text-2xl font-bold tracking-tighter uppercase font-sans hover:text-brand-orange transition-colors">MANTIS</Link>
        <span className="text-[10px] tracking-[0.2em] uppercase text-brand-light/40">Repository</span>
      </div>

      <div className="max-w-4xl mx-auto mt-16 fade-up">
        <h1 className="text-4xl font-serif mb-2">Source <span className="italic text-brand-orange">Code</span></h1>
        <p className="text-[#888888] mb-12 text-sm">Authorized Access: {user.email}</p>

        <div className="grid grid-cols-1 gap-6 text-sm">
          <div className="border border-brand-orange/20 bg-[#050505] p-8 rounded-lg hover:border-brand-orange transition-all hover:bg-[#0a0a0a]">
            <h3 className="font-bold text-white text-xl mb-2 flex items-center gap-3">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-brand-orange"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
              MANTIS Official Repository
            </h3>
            <p className="text-[#888888] mb-6 text-base">Access the complete MANTIS source code, middleware, and documentation on GitHub.</p>
            <a href="https://github.com/arpan-pramanik/MANTIS" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-brand-orange text-black px-6 py-3 rounded font-bold hover:bg-white transition-colors">
              View on GitHub &rarr;
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
