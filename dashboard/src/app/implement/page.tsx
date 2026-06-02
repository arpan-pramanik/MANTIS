'use client';
import { useState, useEffect } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import Link from 'next/link';

export default function ImplementPage() {
  const [step, setStep] = useState<'login' | 'terms' | 'integrate'>('login');
  const [clientId, setClientId] = useState('');

  useEffect(() => {
    // Next.js exposes environment variables with NEXT_PUBLIC_ prefix to the browser
    const envClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (envClientId) {
      setClientId(envClientId);
    } else {
      console.warn("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set in the environment.");
    }
  }, []);

  const handleLoginSuccess = (credentialResponse: any) => {
    console.log("Login Success");
    setStep('terms');
  };

  const handleLoginError = () => {
    console.error("Login Failed");
    alert("Login failed. Please try again.");
  };

  const acceptTerms = () => {
    setStep('integrate');
  };

  return (
    <div className="min-h-screen bg-mantis-900 text-zinc-300 flex flex-col items-center justify-center p-6 font-sans">
      
      {/* Navbar Minimal */}
      <div className="absolute top-0 w-full p-6 flex justify-between items-center max-w-7xl">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-sm bg-mantis-primary"></div>
          <span className="text-white font-bold tracking-tight">MANTIS</span>
        </Link>
        <span className="text-xs text-zinc-500 font-medium">Implementation Portal</span>
      </div>

      <div className="w-full max-w-2xl bg-mantis-800/50 border border-mantis-700 rounded-xl shadow-2xl p-8 md:p-12">
        
        {step === 'login' && (
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-lg bg-mantis-800 border border-mantis-700 flex items-center justify-center mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-mantis-primary"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Secure Gateway Access</h1>
            <p className="text-zinc-400 text-sm mb-8 max-w-md leading-relaxed">
              Authenticate via Google to access MANTIS SDK keys, integration snippets, and liability agreements.
            </p>
            
            {clientId ? (
              <GoogleOAuthProvider clientId={clientId}>
                <div className="bg-white p-1 rounded-md">
                  <GoogleLogin
                    onSuccess={handleLoginSuccess}
                    onError={handleLoginError}
                    theme="outline"
                    size="large"
                    shape="rectangular"
                  />
                </div>
              </GoogleOAuthProvider>
            ) : (
              <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-md text-red-400 text-sm">
                Configuration Error: Google Client ID is missing.
              </div>
            )}
          </div>
        )}

        {step === 'terms' && (
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-white mb-4">Terms & Liability Agreement</h1>
            <p className="text-zinc-400 text-sm mb-6">
              You must read and agree to the terms below before proceeding with the implementation.
            </p>
            
            <div className="w-full h-64 bg-mantis-900 border border-mantis-700 rounded-md p-4 overflow-y-auto mb-6 text-xs text-zinc-500 leading-relaxed font-mono">
              <p className="mb-4"><strong>MANTIS SOFTWARE INTEGRATION AGREEMENT</strong></p>
              <p className="mb-4">1. NO LIABILITY FOR DEVELOPER: By proceeding, you explicitly acknowledge and agree that the original developer(s) and provider(s) of the MANTIS software ("Provider") bear zero liability for any consequences arising from the use, implementation, or deployment of this software.</p>
              <p className="mb-4">2. USE AT YOUR OWN RISK: The MANTIS SDK and related services are provided "AS IS", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and non-infringement.</p>
              <p className="mb-4">3. FULL RESPONSIBILITY: You, the implementing party, assume full responsibility for any data loss, security breaches, system failures, or business interruptions that occur in connection with this integration.</p>
              <p className="mb-4">4. INDEMNIFICATION: You agree to indemnify, defend, and hold harmless the Provider from any claims, damages, losses, or expenses arising from your use of MANTIS.</p>
              <p>By clicking "I Agree", you legally bind yourself to these terms and release the Provider from all potential claims.</p>
            </div>

            <div className="flex justify-end gap-4">
              <button 
                onClick={() => setStep('login')}
                className="px-4 py-2 rounded-md border border-mantis-700 text-zinc-400 hover:text-white hover:bg-mantis-700 transition-colors text-sm font-medium"
              >
                Decline & Cancel
              </button>
              <button 
                onClick={acceptTerms}
                className="px-4 py-2 rounded-md bg-mantis-primary text-black hover:bg-mantis-primary/90 transition-colors text-sm font-semibold"
              >
                I Agree to the Terms
              </button>
            </div>
          </div>
        )}

        {step === 'integrate' && (
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-white mb-2">Integration Snippets</h1>
            <p className="text-zinc-400 text-sm mb-8">
              MANTIS has been authorized. Select a method to implement the security gateway into your system.
            </p>

            <div className="space-y-6">
              
              {/* Method 1 */}
              <div>
                <h3 className="text-white text-sm font-semibold mb-2">Method 1: Node.js / Express Middleware</h3>
                <div className="bg-mantis-900 border border-mantis-700 rounded-md p-4 overflow-x-auto">
                  <pre className="text-xs text-zinc-300 font-mono">
{`const { MantisGateway } = require('@mantis/sdk');

const mantis = new MantisGateway({
  apiKey: 'YOUR_MANTIS_API_KEY',
  strictMode: true
});

app.use(mantis.protect());`}
                  </pre>
                </div>
              </div>

              {/* Method 2 */}
              <div>
                <h3 className="text-white text-sm font-semibold mb-2">Method 2: Next.js Edge Middleware</h3>
                <div className="bg-mantis-900 border border-mantis-700 rounded-md p-4 overflow-x-auto">
                  <pre className="text-xs text-zinc-300 font-mono">
{`import { mantisEdge } from '@mantis/next';

export const middleware = mantisEdge({
  apiKey: process.env.MANTIS_API_KEY,
  blockThreshold: 90
});

export const config = {
  matcher: '/api/:path*',
};`}
                  </pre>
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-mantis-700/50 flex justify-between items-center">
                <span className="text-xs text-zinc-500">Agreement ID: MT-9982-AX (Accepted)</span>
                <Link href="/dashboard" className="text-sm text-mantis-primary hover:underline">
                  Go to Dashboard →
                </Link>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
