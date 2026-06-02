'use client';
import { useEffect, useState } from "react";
import Header from "../components/Header";
import CustomCursor from "../components/CustomCursor";
import { useAuth } from "../context/AuthContext";
import Link from 'next/link';

type ApiKey = {
  id: string;
  name: string;
  partialKey: string;
  createdAt: string;
};

type TelemetryStats = {
  requests: number;
  threats: number;
  latency: number | string;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const [stats, setStats] = useState<TelemetryStats>({ requests: 0, threats: 0, latency: '--' });
  const [isRefreshingStats, setIsRefreshingStats] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    // Initial fetch of keys
    fetch('/api/keys', {
      headers: { 'x-user-email': user.email }
    })
      .then(res => res.json())
      .then(data => {
        if (data.keys) setKeys(data.keys);
        setLoading(false);
      });
      
    // Initial fetch of stats
    refreshStats(user.email);
  }, [user]);

  const refreshStats = async (email?: string) => {
    const userEmail = email || user?.email;
    if (!userEmail) return;
    setIsRefreshingStats(true);
    try {
      const res = await fetch('/api/telemetry', {
        headers: { 'x-user-email': userEmail }
      });
      const data = await res.json();
      if (!data.error) {
        setStats({
          requests: data.requests,
          threats: data.threats,
          latency: data.latency
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshingStats(false);
    }
  };

  const generateKey = async () => {
    if (!user) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'x-user-email': user.email }
      });
      const data = await res.json();
      if (data.rawKey) {
        setRawKey(data.rawKey);
        setKeys(prev => [data, ...prev]);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const revokeKey = async (id: string) => {
    if (!user) return;
    setRevokingId(id);
    try {
      await fetch(`/api/keys/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-email': user.email }
      });
      setKeys(prev => prev.filter(k => k.id !== id));
    } finally {
      setRevokingId(null);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-brand-dark flex items-center justify-center text-white">Loading...</div>;
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-brand-dark text-brand-light font-sans flex flex-col items-center justify-center p-8 text-center">
        <CustomCursor />
        <h1 className="text-3xl font-serif mb-4 text-red-500">Access Denied</h1>
        <p className="text-[#888888] mb-8">You must be logged in to view your dashboard.</p>
        <Link href="/" className="px-6 py-2 border border-brand-light/20 rounded hover:bg-white hover:text-black transition-colors">
          Return Home to Login
        </Link>
      </main>
    );
  }

  if (!user.isSubscribed) {
    return (
      <main className="min-h-screen bg-brand-dark text-brand-light font-sans flex flex-col items-center justify-center p-8 text-center">
        <CustomCursor />
        <h1 className="text-3xl font-serif mb-4 text-brand-orange">Subscription Required</h1>
        <p className="text-[#888888] mb-8">You need an active MANTIS Cloud Enterprise subscription to access the dashboard.</p>
        <Link href="/implement" className="px-6 py-2 bg-brand-orange text-black font-bold uppercase tracking-widest rounded hover:bg-white transition-colors">
          Upgrade Now
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-dark text-brand-light overflow-x-hidden selection:bg-brand-orange selection:text-white font-sans">
      <CustomCursor />
      <Header />

      <section className="pt-32 px-6 md:px-12 max-w-7xl mx-auto pb-24">
        <h1 className="text-4xl font-serif mb-2">Welcome, <span className="italic text-brand-orange">{user.name.split(' ')[0]}</span></h1>
        <p className="text-sm text-brand-light/60 mb-12">Authorized Account: {user.email}</p>

        {/* Telemetry Section */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">System Telemetry</h2>
          <button 
            onClick={() => refreshStats()} 
            disabled={isRefreshingStats}
            className="flex items-center gap-2 px-3 py-1 text-xs border border-brand-light/20 rounded hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            {isRefreshingStats ? (
              <>
                <svg className="animate-spin h-3 w-3 text-brand-orange" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              </>
            ) : (
              '↻ Refresh Data'
            )}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 relative">
          {keys.length === 0 && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-brand-dark/80 backdrop-blur-sm border border-brand-light/10 rounded-lg">
              <p className="text-brand-light/60 text-sm">Awaiting API traffic...</p>
            </div>
          )}
          <div className="border-t border-brand-light/20 pt-6 group">
            <h3 className="text-[10px] tracking-[0.2em] uppercase text-brand-light/40 mb-2">Total Requests (24h)</h3>
            <div className="text-4xl font-mono group-hover:text-brand-orange transition-colors duration-300">
              {stats.requests.toLocaleString()}
            </div>
            <div className="text-xs text-brand-orange mt-2">
              {keys.length > 0 ? '+12.4% from yesterday' : 'No active traffic'}
            </div>
          </div>
          <div className="border-t border-brand-light/20 pt-6 group">
            <h3 className="text-[10px] tracking-[0.2em] uppercase text-brand-light/40 mb-2">Threats Blocked</h3>
            <div className="text-4xl font-mono group-hover:text-brand-orange transition-colors duration-300">
              {stats.threats.toLocaleString()}
            </div>
            <div className="text-xs text-red-500 mt-2">
              {keys.length > 0 ? '-2.1% from yesterday' : 'Secure'}
            </div>
          </div>
          <div className="border-t border-brand-light/20 pt-6 group">
            <h3 className="text-[10px] tracking-[0.2em] uppercase text-brand-light/40 mb-2">Avg Latency</h3>
            <div className="text-4xl font-mono group-hover:text-brand-orange transition-colors duration-300">
              {typeof stats.latency === 'number' ? `${stats.latency}ms` : stats.latency}
            </div>
            <div className="text-xs text-brand-light/40 mt-2">
              {keys.length > 0 ? 'Optimal range' : 'Awaiting traffic'}
            </div>
          </div>
        </div>

        {/* Developer Settings */}
        <h2 className="text-xl font-bold mb-4">API Keys</h2>
        <div className="border border-brand-light/10 bg-[#050505] rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-[#888888] max-w-md">Use these keys to authenticate your application with the MANTIS network. Keep your secret keys safe.</p>
            <button 
              onClick={generateKey} 
              disabled={isGenerating}
              className="bg-brand-orange text-black px-4 py-2 font-bold text-sm rounded hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : '+ Generate New Key'}
            </button>
          </div>

          {rawKey && (
            <div className="mb-6 p-4 border border-brand-orange/50 bg-brand-orange/10 rounded">
              <h3 className="text-brand-orange font-bold mb-2">Save this key now!</h3>
              <p className="text-sm text-white mb-2">This is the only time it will be shown.</p>
              <code className="block p-3 bg-black border border-brand-light/20 rounded font-mono text-brand-orange select-all">
                {rawKey}
              </code>
            </div>
          )}

          {keys.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-brand-light/20 rounded">
              <p className="text-[#888888] text-sm">No API keys generated yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-brand-light/10 text-brand-light/40">
                    <th className="py-3 px-4 font-normal">NAME</th>
                    <th className="py-3 px-4 font-normal">KEY</th>
                    <th className="py-3 px-4 font-normal">CREATED</th>
                    <th className="py-3 px-4 font-normal text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map(key => (
                    <tr key={key.id} className="border-b border-brand-light/10 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4 font-medium text-white">{key.name}</td>
                      <td className="py-4 px-4 font-mono text-[#888888]">{key.partialKey}</td>
                      <td className="py-4 px-4 text-[#888888]">{new Date(key.createdAt).toLocaleDateString()}</td>
                      <td className="py-4 px-4 text-right">
                        <button 
                          onClick={() => revokeKey(key.id)} 
                          disabled={revokingId === key.id}
                          className="text-red-500 hover:text-red-400 disabled:opacity-50 flex items-center justify-end gap-2 ml-auto"
                        >
                          {revokingId === key.id ? (
                            <>
                              <svg className="animate-spin h-3 w-3 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Revoking...
                            </>
                          ) : 'Revoke'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
