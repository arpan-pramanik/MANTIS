import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-mantis-700/50 bg-mantis-900 hidden md:block">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-sm bg-mantis-primary"></div>
            <span className="text-white font-bold tracking-tight text-xl">MANTIS</span>
          </Link>
        </div>
        <div className="px-4 py-2">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-2">Overview</div>
          <nav className="space-y-1">
            <a href="#" className="flex items-center px-2 py-2 text-sm font-medium rounded-md bg-mantis-800 text-white">
              Metrics
            </a>
            <a href="#" className="flex items-center px-2 py-2 text-sm font-medium rounded-md text-zinc-400 hover:bg-mantis-800 hover:text-white">
              Logs
            </a>
            <a href="#" className="flex items-center px-2 py-2 text-sm font-medium rounded-md text-zinc-400 hover:bg-mantis-800 hover:text-white">
              Settings
            </a>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="h-16 border-b border-mantis-700/50 flex items-center px-6 justify-between bg-mantis-900/50 backdrop-blur-sm">
          <h1 className="text-lg font-semibold text-white">Metrics</h1>
          <div className="flex items-center gap-4">
            <div className="text-xs text-zinc-400">Environment: <span className="text-white font-medium">Production</span></div>
            <div className="w-8 h-8 rounded-full bg-mantis-800 border border-mantis-700"></div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6 md:p-8 flex-1 overflow-y-auto">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            
            <div className="p-6 rounded-xl border border-mantis-700 bg-mantis-800/20 flex flex-col">
              <span className="text-zinc-400 text-sm font-medium mb-2">Total Requests (24h)</span>
              <span className="text-3xl font-bold text-white mb-1">1,245,892</span>
              <span className="text-xs text-mantis-primary">+12.4% from yesterday</span>
            </div>

            <div className="p-6 rounded-xl border border-mantis-700 bg-mantis-800/20 flex flex-col">
              <span className="text-zinc-400 text-sm font-medium mb-2">Threats Blocked</span>
              <span className="text-3xl font-bold text-white mb-1">4,392</span>
              <span className="text-xs text-red-400">-2.1% from yesterday</span>
            </div>

            <div className="p-6 rounded-xl border border-mantis-700 bg-mantis-800/20 flex flex-col">
              <span className="text-zinc-400 text-sm font-medium mb-2">Avg Latency</span>
              <span className="text-3xl font-bold text-white mb-1">24ms</span>
              <span className="text-xs text-zinc-500">Stable</span>
            </div>

          </div>

          {/* Activity Chart Placeholder */}
          <div className="w-full h-72 rounded-xl border border-mantis-700 bg-mantis-800/20 flex items-center justify-center mb-8">
            <span className="text-zinc-500 text-sm font-medium">Activity Chart (Awaiting Live Telemetry)</span>
          </div>

        </div>
      </main>
    </div>
  );
}
