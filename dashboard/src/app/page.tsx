import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center">
      
      {/* Navigation */}
      <nav className="w-full max-w-7xl px-6 py-4 flex items-center justify-between border-b border-mantis-700/50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-sm bg-mantis-primary"></div>
          <span className="text-white font-bold tracking-tight text-xl">MANTIS</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400 font-medium">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#security" className="hover:text-white transition-colors">Security</Link>
          <Link href="/implement" className="hover:text-white transition-colors">Documentation</Link>
        </div>
        <div>
          <Link 
            href="/implement" 
            className="text-sm font-medium bg-white text-black px-4 py-2 rounded-md hover:bg-zinc-200 transition-colors"
          >
            Start Integration
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="w-full max-w-7xl px-6 py-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-mantis-700 bg-mantis-800/50 text-xs text-zinc-300 font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-mantis-primary animate-pulse"></span>
          Enterprise API Security is now available
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-tight max-w-4xl mb-6">
          The ultimate defense for <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-300 to-zinc-600">modern API infrastructure.</span>
        </h1>
        
        <p className="text-lg text-zinc-400 max-w-2xl mb-10 leading-relaxed">
          MANTIS is an ultra-secure, zero-trust gateway designed to protect your data with military-grade encryption and real-time threat detection. No liability, full control.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link 
            href="/implement" 
            className="h-12 px-8 rounded-md bg-mantis-primary text-black font-semibold flex items-center justify-center hover:bg-mantis-primary/90 transition-colors"
          >
            Implement MANTIS
          </Link>
          <Link 
            href="/dashboard" 
            className="h-12 px-8 rounded-md bg-mantis-800 text-white font-semibold flex items-center justify-center border border-mantis-700 hover:bg-mantis-700 transition-colors"
          >
            View Dashboard
          </Link>
        </div>
      </main>

      {/* Features Grid */}
      <section id="features" className="w-full max-w-7xl px-6 py-24 border-t border-mantis-700/50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="p-6 rounded-xl border border-mantis-700 bg-mantis-800/20">
            <div className="w-10 h-10 rounded-lg bg-mantis-800 flex items-center justify-center border border-mantis-700 mb-4 text-mantis-primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Zero-Trust Architecture</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Every request is rigorously verified before hitting your underlying services. Nothing passes without cryptographic proof.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-mantis-700 bg-mantis-800/20">
            <div className="w-10 h-10 rounded-lg bg-mantis-800 flex items-center justify-center border border-mantis-700 mb-4 text-mantis-primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Liability Protection</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Implementation comes with strict legal safeguards. MANTIS is a robust tool, but developers maintain full responsibility for their integration.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-mantis-700 bg-mantis-800/20">
            <div className="w-10 h-10 rounded-lg bg-mantis-800 flex items-center justify-center border border-mantis-700 mb-4 text-mantis-primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Real-time Telemetry</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Monitor incoming requests, anomaly scores, and blockage rates instantly through our high-performance dashboard.
            </p>
          </div>

        </div>
      </section>
    </div>
  );
}
