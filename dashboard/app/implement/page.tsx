'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import CustomCursor from "../components/CustomCursor";
import { useAuth } from "../context/AuthContext";
import { GoogleLogin } from '@react-oauth/google';
import TermsModal from '../components/TermsModal';
import Script from 'next/script';

declare global {
  interface Window {
    Paddle?: any;
  }
}

export default function ImplementPage() {
  const [step, setStep] = useState<'login' | 'terms' | 'integrate'>('login');
  const { user, login } = useAuth();

  const PADDLE_ENVIRONMENT = process.env.NEXT_PUBLIC_PADDLE_ENV || 'sandbox';
  const PADDLE_CLIENT_TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || 'test_token';
  const PADDLE_MONTHLY_PRICE_ID = process.env.NEXT_PUBLIC_PADDLE_MONTHLY_PRICE_ID || 'pri_monthly_123';
  const PADDLE_ANNUAL_PRICE_ID = process.env.NEXT_PUBLIC_PADDLE_ANNUAL_PRICE_ID || 'pri_annual_123';

  const [activeKey, setActiveKey] = useState<string>('YOUR_MANTIS_API_KEY');
  const [method, setMethod] = useState<'curl' | 'node' | 'python'>('node');

  const [selectedPlan, setSelectedPlan] = useState<'manual' | 'api' | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('annually');
  const [manualTermsAccepted, setManualTermsAccepted] = useState(false);
  const [apiTermsAccepted, setApiTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState<'manual' | 'api' | null>(null);

  // If user is already logged in, skip the login step automatically
  useEffect(() => {
    if (user && step === 'login') {
      setStep('integrate');
      if (user.isSubscribed) {
        setSelectedPlan('api');
      }
    }
    
    // Fetch the user's active API keys to embed in the snippets
    if (user && step === 'integrate') {
      if (user.isSubscribed && !selectedPlan) {
        setSelectedPlan('api');
      }
      fetch('/api/keys', {
        headers: { 'x-user-email': user.email }
      })
        .then(res => res.json())
        .then(data => {
          if (data.keys && data.keys.length > 0) {
            setActiveKey(data.keys[0].partialKey.replace('...', '')); 
          }
        });
    }
  }, [user, step, selectedPlan]);

  const handleLoginSuccess = (credentialResponse: any) => {
    login(credentialResponse);
  };

  const handleLoginError = () => {
    alert("Login failed. Please try again.");
  };

  const handlePaddleCheckout = () => {
    if (!apiTermsAccepted) {
      alert("Please accept the Terms and Agreement to continue.");
      return;
    }
    
    if (!window.Paddle) {
       alert("Payment Gateway is still initializing. Please wait a moment and try again.");
       return;
    }

    window.Paddle.Checkout.open({
      items: [
        {
          priceId: billingCycle === 'monthly' ? PADDLE_MONTHLY_PRICE_ID : PADDLE_ANNUAL_PRICE_ID,
          quantity: 1
        }
      ],
      customData: {
        email: user?.email
      },
      successCallback: (data: any) => {
        console.log("Checkout successful", data);
        setSelectedPlan('api');
      }
    });
  };

  return (
    <main className="min-h-screen bg-brand-dark text-brand-light overflow-x-hidden selection:bg-brand-orange selection:text-white font-sans flex flex-col items-center justify-center relative py-24">
      <CustomCursor />
      <Script src="https://cdn.paddle.com/paddle/v2/paddle.js" onLoad={() => {
        if (window.Paddle) {
          window.Paddle.Environment.set(PADDLE_ENVIRONMENT);
          window.Paddle.Initialize({ token: PADDLE_CLIENT_TOKEN });
        }
      }} />
      
      {/* Minimal Header */}
      <div className="absolute top-0 left-0 w-full p-8 md:p-12 flex justify-between items-center z-50 mix-blend-difference">
        <Link href="/" className="text-2xl font-bold tracking-tighter uppercase font-sans hover:text-brand-orange transition-colors">MANTIS</Link>
        <span className="text-[10px] tracking-[0.2em] uppercase text-brand-light/40">Implementation</span>
      </div>

      <section className="w-full max-w-4xl px-6 relative z-10">
        {step === 'login' && !user && (
          <div className="flex flex-col text-left fade-up">
            <h1 className="text-4xl md:text-5xl font-serif mb-4">Secure <span className="italic text-brand-orange">Gateway</span></h1>
            <p className="text-sm text-brand-light/60 mb-12 max-w-md leading-relaxed">
              Authenticate via Google to access MANTIS SDK keys, integration snippets, and liability agreements.
            </p>
            
            <div className="border-t border-brand-light/20 pt-8">
              <div className="inline-block p-1 bg-brand-light rounded-md">
                <GoogleLogin
                  onSuccess={handleLoginSuccess}
                  onError={handleLoginError}
                  theme="outline"
                  size="large"
                />
              </div>
            </div>
          </div>
        )}



        {step === 'integrate' && !selectedPlan && (
          <div className="flex flex-col fade-up">
            <h1 className="text-4xl font-serif mb-2">Choose Integration <span className="italic text-brand-orange">Plan</span></h1>
            <p className="text-sm text-brand-light/60 mb-8 max-w-2xl">
              Select how you want to integrate MANTIS into your infrastructure.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-brand-light/20 bg-[#050505] p-8 flex flex-col justify-between hover:border-brand-orange/50 transition-colors">
                <div>
                  <h3 className="text-2xl font-serif mb-2">Manual Setup</h3>
                  <div className="text-3xl font-mono mb-1">Free</div>
                  <div className="text-[10px] text-transparent mb-4">Spacer</div>
                  <ul className="text-sm text-[#888888] space-y-2 mb-8">
                    <li>✓ Open-source core</li>
                    <li>✓ Self-hosted deployment</li>
                    <li>✓ Basic rate limiting</li>
                    <li>✗ No Dashboard Access</li>
                    <li>✗ No active threat updates</li>
                    <li>✗ Community support only</li>
                  </ul>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <input type="checkbox" id="manual-terms" checked={manualTermsAccepted} onChange={(e) => setManualTermsAccepted(e.target.checked)} className="accent-brand-orange cursor-pointer w-4 h-4" />
                    <label htmlFor="manual-terms" className="text-xs text-[#888888] cursor-pointer">I accept the <button onClick={(e) => {e.preventDefault(); setShowTermsModal('manual');}} className="text-brand-orange hover:underline">Terms and Agreement</button></label>
                  </div>
                  <button onClick={() => {
                    if (manualTermsAccepted) setSelectedPlan('manual');
                    else alert("Please accept the Terms and Agreement to continue.");
                  }} className="w-full py-3 border border-brand-light/20 hover:bg-white hover:text-black transition-colors text-sm font-bold tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed">
                    View Instructions
                  </button>
                </div>
              </div>

              <div className="border border-brand-orange bg-[#050505] p-8 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-brand-orange text-black text-[10px] font-bold px-3 py-1 uppercase tracking-widest">Recommended</div>
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-2xl font-serif">MANTIS Cloud API</h3>
                    <div className="flex bg-[#111] rounded-full p-1 border border-brand-light/10 mt-1">
                      <button onClick={() => setBillingCycle('monthly')} className={`text-[9px] uppercase tracking-wider px-3 py-1 rounded-full transition-colors ${billingCycle === 'monthly' ? 'bg-brand-light/10 text-white' : 'text-brand-light/40 hover:text-white'}`}>Monthly</button>
                      <button onClick={() => setBillingCycle('annually')} className={`text-[9px] uppercase tracking-wider px-3 py-1 rounded-full transition-colors ${billingCycle === 'annually' ? 'bg-brand-orange text-black font-bold' : 'text-brand-light/40 hover:text-white'}`}>Annually</button>
                    </div>
                  </div>
                  <div className="text-3xl font-mono text-brand-orange mb-1">
                    {billingCycle === 'monthly' ? '$49' : '$499'}
                    <span className="text-sm text-[#888888]">{billingCycle === 'monthly' ? '/mo' : '/yr'}</span>
                  </div>
                  {billingCycle === 'annually' ? (
                    <div className="text-[10px] text-brand-orange mb-4 font-bold tracking-wider uppercase">Save ~15%</div>
                  ) : (
                    <div className="text-[10px] text-transparent mb-4 tracking-wider uppercase">Spacer</div>
                  )}
                  <ul className="text-sm text-[#888888] space-y-2 mb-8">
                    <li>✓ Full Dashboard Access</li>
                    <li>✓ Hosted on AWS Global Edge</li>
                    <li>✓ Active Threat Updates</li>
                    <li>✓ Organization Perks & Priority Support</li>
                    <li>✓ Exclusive Source Code Access</li>
                  </ul>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <input type="checkbox" id="api-terms" checked={apiTermsAccepted} onChange={(e) => setApiTermsAccepted(e.target.checked)} className="accent-brand-orange cursor-pointer w-4 h-4" />
                    <label htmlFor="api-terms" className="text-xs text-[#888888] cursor-pointer">I accept the <button onClick={(e) => {e.preventDefault(); setShowTermsModal('api');}} className="text-brand-orange hover:underline">Terms and Agreement</button></label>
                  </div>
                  <button onClick={handlePaddleCheckout} className="w-full py-3 bg-brand-orange text-black hover:bg-white transition-colors text-sm font-bold tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'integrate' && selectedPlan === 'manual' && (
          <div className="flex flex-col fade-up">
             <div className="mb-6">
               <button onClick={() => setSelectedPlan(null)} className="text-xs text-brand-light/40 hover:text-white">← Back to Plans</button>
             </div>
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
        )}

        {step === 'integrate' && selectedPlan === 'api' && (
          <div className="flex flex-col fade-up">
            <div className="mb-6">
               <button onClick={() => setSelectedPlan(null)} className="text-xs text-brand-light/40 hover:text-white">← Back to Plans</button>
            </div>
            <h1 className="text-4xl font-serif mb-2">Integration <span className="italic text-brand-orange">Code</span></h1>
            <p className="text-sm text-brand-light/60 mb-8">
              Subscription verified. Select your framework to secure your endpoints. 
              <br/>
              <span className="text-xs text-[#888888] mt-2 block">Note: Substitute '{activeKey}' with your full secret key from the Dashboard.</span>
            </p>

            <div className="flex gap-4 mb-6 border-b border-brand-light/20 pb-4">
              <button onClick={() => setMethod('node')} className={`text-sm font-bold transition-colors ${method === 'node' ? 'text-brand-orange' : 'text-brand-light/40 hover:text-white'}`}>Node.js / Express</button>
              <button onClick={() => setMethod('python')} className={`text-sm font-bold transition-colors ${method === 'python' ? 'text-brand-orange' : 'text-brand-light/40 hover:text-white'}`}>Python (Requests)</button>
              <button onClick={() => setMethod('curl')} className={`text-sm font-bold transition-colors ${method === 'curl' ? 'text-brand-orange' : 'text-brand-light/40 hover:text-white'}`}>cURL (REST API)</button>
            </div>

            <div className="space-y-8">
              {method === 'node' && (
                <div className="border border-brand-light/20 p-6 overflow-x-auto bg-[#050505] rounded">
                  <pre className="text-sm text-brand-light/70 font-mono">
{`const { MantisGateway } = require('@mantis/sdk');

const mantis = new MantisGateway({
  apiKey: process.env.MANTIS_API_KEY || '${activeKey}',
  strictMode: true
});

// Protect all routes globally
app.use(mantis.protect());

app.get('/api/sensitive-data', (req, res) => {
  res.json({ secret: 'Protected by MANTIS' });
});`}
                  </pre>
                </div>
              )}

              {method === 'python' && (
                <div className="border border-brand-light/20 p-6 overflow-x-auto bg-[#050505] rounded">
                  <pre className="text-sm text-brand-light/70 font-mono">
{`import requests

url = "https://api.mantis.network/v1/verify"

headers = {
    "Authorization": "Bearer ${activeKey}",
    "Content-Type": "application/json"
}

payload = {
    "action": "validate_request",
    "client_ip": "192.168.1.1"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`}
                  </pre>
                </div>
              )}

              {method === 'curl' && (
                <div className="border border-brand-light/20 p-6 overflow-x-auto bg-[#050505] rounded">
                  <pre className="text-sm text-brand-light/70 font-mono">
{`curl -X POST "https://api.mantis.network/v1/verify" \\
     -H "Authorization: Bearer ${activeKey}" \\
     -H "Content-Type: application/json" \\
     -d '{
       "action": "validate_request",
       "client_ip": "192.168.1.1"
     }'`}
                  </pre>
                </div>
              )}
              
              <div className="flex items-center gap-4 pt-4">
                <Link href="/dashboard" className="inline-block text-xs font-bold uppercase bg-brand-orange text-black px-6 py-3 rounded hover:bg-white transition-colors">
                  Go to Dashboard →
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>

      <TermsModal type={showTermsModal} onClose={() => setShowTermsModal(null)} />
    </main>
  );
}
