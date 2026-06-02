'use client';
import { useState, useEffect } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import Link from 'next/link';
import CustomCursor from "../components/CustomCursor";

export default function ImplementPage() {
  const [step, setStep] = useState<'login' | 'terms' | 'integrate'>('login');
  const [clientId, setClientId] = useState('');

  useEffect(() => {
    const envClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (envClientId) {
      setClientId(envClientId);
    }
  }, []);

  const handleLoginSuccess = (credentialResponse: any) => {
    setStep('terms');
  };

  const handleLoginError = () => {
    alert("Login failed. Please try again.");
  };

  return (
    <main className="min-h-screen bg-brand-dark text-brand-light overflow-x-hidden selection:bg-brand-orange selection:text-white font-sans flex flex-col items-center justify-center relative">
      <CustomCursor />
      
      {/* Minimal Header */}
      <div className="absolute top-0 left-0 w-full p-8 md:p-12 flex justify-between items-center z-50 mix-blend-difference">
        <Link href="/" className="text-2xl font-bold tracking-tighter uppercase font-sans">MANTIS</Link>
        <span className="text-[10px] tracking-[0.2em] uppercase text-brand-light/40">Implementation</span>
      </div>

      <section className="w-full max-w-2xl px-6 relative z-10">
        {step === 'login' && (
          <div className="flex flex-col text-left fade-up">
            <h1 className="text-4xl md:text-5xl font-serif mb-4">Secure <span className="italic text-brand-orange">Gateway</span></h1>
            <p className="text-sm text-brand-light/60 mb-12 max-w-md leading-relaxed">
              Authenticate via Google to access MANTIS SDK keys, integration snippets, and liability agreements.
            </p>
            
            <div className="border-t border-brand-light/20 pt-8">
              {clientId ? (
                <GoogleOAuthProvider clientId={clientId}>
                  <div className="inline-block p-1 bg-brand-light rounded-md">
                    <GoogleLogin
                      onSuccess={handleLoginSuccess}
                      onError={handleLoginError}
                      theme="outline"
                      size="large"
                    />
                  </div>
                </GoogleOAuthProvider>
              ) : (
                <div className="p-4 border border-red-500/50 text-red-400 text-sm">
                  System Error: Missing OAuth Credentials.
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'terms' && (
          <div className="flex flex-col fade-up">
            <h1 className="text-3xl font-serif mb-2">Terms & Liability</h1>
            <p className="text-sm text-brand-light/60 mb-8">
              Review and accept to proceed.
            </p>
            
            <div className="w-full h-64 border border-brand-light/20 bg-brand-dark p-6 overflow-y-auto mb-8 text-xs text-brand-light/50 leading-relaxed font-mono">
              <p className="mb-4 text-brand-orange">MANTIS SOFTWARE INTEGRATION AGREEMENT</p>
              <p className="mb-4">1. NO LIABILITY: The MANTIS developer bears zero liability for any consequences arising from the use of this software.</p>
              <p className="mb-4">2. AT YOUR OWN RISK: Provided "AS IS", without warranty of any kind.</p>
              <p className="mb-4">3. FULL RESPONSIBILITY: You assume full responsibility for data loss or security breaches connected with this integration.</p>
              <p>By clicking "I Agree", you legally bind yourself to these terms.</p>
            </div>

            <div className="flex justify-end gap-6 text-[10px] tracking-[0.2em] uppercase font-bold">
              <button onClick={() => setStep('login')} className="text-brand-light/40 hover:text-white transition-colors">
                Decline
              </button>
              <button onClick={() => setStep('integrate')} className="text-brand-orange hover:text-white transition-colors">
                I Agree
              </button>
            </div>
          </div>
        )}

        {step === 'integrate' && (
          <div className="flex flex-col fade-up">
            <h1 className="text-3xl font-serif mb-2">Integration <span className="italic text-brand-orange">Code</span></h1>
            <p className="text-sm text-brand-light/60 mb-8">
              Authorization complete. Select your framework.
            </p>

            <div className="space-y-8">
              <div>
                <h3 className="text-[10px] tracking-[0.2em] uppercase text-brand-orange mb-4">Express Middleware</h3>
                <div className="border border-brand-light/20 p-6 overflow-x-auto bg-[#050505]">
                  <pre className="text-xs text-brand-light/70 font-mono">
{`const { MantisGateway } = require('@mantis/sdk');

const mantis = new MantisGateway({
  apiKey: 'YOUR_MANTIS_API_KEY',
  strictMode: true
});

app.use(mantis.protect());`}
                  </pre>
                </div>
              </div>
              
              <Link href="/dashboard" className="inline-block text-[10px] tracking-[0.2em] uppercase text-brand-light/40 hover:text-brand-orange transition-colors">
                Return to Dashboard →
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
