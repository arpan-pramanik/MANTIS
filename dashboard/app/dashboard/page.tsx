import Header from "../components/Header";
import CustomCursor from "../components/CustomCursor";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-brand-dark text-brand-light overflow-x-hidden selection:bg-brand-orange selection:text-white font-sans">
      <CustomCursor />
      <Header />

      <section className="pt-48 px-6 md:px-12 max-w-7xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-serif mb-2">System <span className="italic text-brand-orange">Telemetry</span></h1>
        <p className="text-sm text-brand-light/60 mb-16 max-w-md">Real-time monitoring of your API gateway infrastructure.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          
          <div className="border-t border-brand-light/20 pt-6 group">
            <h3 className="text-[10px] tracking-[0.2em] uppercase text-brand-light/40 mb-2">Total Requests (24h)</h3>
            <div className="text-5xl font-mono group-hover:text-brand-orange transition-colors duration-300">1,245,892</div>
            <div className="text-xs text-brand-orange mt-2">+12.4% from yesterday</div>
          </div>

          <div className="border-t border-brand-light/20 pt-6 group">
            <h3 className="text-[10px] tracking-[0.2em] uppercase text-brand-light/40 mb-2">Threats Blocked</h3>
            <div className="text-5xl font-mono group-hover:text-brand-orange transition-colors duration-300">4,392</div>
            <div className="text-xs text-red-500 mt-2">-2.1% from yesterday</div>
          </div>

          <div className="border-t border-brand-light/20 pt-6 group">
            <h3 className="text-[10px] tracking-[0.2em] uppercase text-brand-light/40 mb-2">Avg Latency</h3>
            <div className="text-5xl font-mono group-hover:text-brand-orange transition-colors duration-300">24ms</div>
            <div className="text-xs text-brand-light/40 mt-2">Optimal range</div>
          </div>

        </div>

        <div className="w-full h-64 border border-brand-light/10 flex items-center justify-center">
          <span className="text-[10px] tracking-[0.2em] uppercase text-brand-light/40">Activity Chart (Awaiting Live Telemetry)</span>
        </div>

      </section>
    </main>
  );
}
