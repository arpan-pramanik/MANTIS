'use client';
import { useState, useEffect } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import Link from 'next/link';
import gsap from 'gsap';

export default function ImplementPage() {
  const [step, setStep] = useState<'login' | 'terms' | 'integration'>('login');
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    // Fade in transitions between steps
    gsap.fromTo('.step-container', 
      { opacity: 0, y: 20 }, 
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
    );
  }, [step]);

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
      <main className="min-h-screen bg-[#05070a] text-[#f0f4ff] font-sans flex flex-col items-center justify-center p-8 relative">
        
        {/* Simple Navbar */}
        <nav className="fixed top-0 left-0 w-full p-8 flex justify-between z-50 opacity-80">
          <Link href="/" className="font-bold tracking-[0.2em] uppercase text-sm hover:text-[#eab308] transition-colors">
            ← Back to Home
          </Link>
          <div className="font-mono text-xs tracking-widest text-[#eab308]">SECURE_PORTAL</div>
        </nav>

        <div className="max-w-3xl w-full">
          
          {step === 'login' && (
            <div className="step-container text-center space-y-8 flex flex-col items-center">
              <h1 className="text-4xl md:text-6xl font-medium tracking-tight">Access Implementation Guide</h1>
              <p className="text-lg opacity-60 font-light max-w-lg mx-auto">
                Authenticate with your enterprise Google account to access the MANTIS integration portal and SDK configurations.
              </p>
              <div className="bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-md">
                <GoogleLogin
                  onSuccess={() => setStep('terms')}
                  onError={() => console.log('Login Failed')}
                  theme="filled_black"
                  size="large"
                  text="continue_with"
                  shape="pill"
                />
              </div>
            </div>
          )}

          {step === 'terms' && (
            <div className="step-container space-y-8">
              <h1 className="text-3xl font-medium tracking-tight text-[#eab308]">Terms and Agreements</h1>
              
              <div className="bg-[#111827] border border-white/10 rounded-lg p-6 h-64 overflow-y-auto font-mono text-xs leading-relaxed opacity-80">
                <p className="mb-4 font-bold text-white uppercase">Disclaimer of Liability</p>
                <p className="mb-4">
                  By proceeding with the implementation of MANTIS (Mitigation of API-based Nuisances using Threat Intelligence System), you (the "User", "Company", or "Entity") explicitly acknowledge and agree that the software is provided "AS IS", without warranty of any kind, express or implied.
                </p>
                <p className="mb-4">
                  The developer, creator, and affiliated parties assume absolutely no liability for any downtime, data loss, security breaches, financial damages, or operational disruptions resulting from the use, configuration, or integration of this software.
                </p>
                <p className="mb-4">
                  Implementation is entirely at your own risk. The developer cannot be held responsible for any direct, indirect, incidental, special, exemplary, or consequential damages (including, but not limited to, procurement of substitute goods or services; loss of use, data, or profits; or business interruption) however caused and on any theory of liability, whether in contract, strict liability, or tort (including negligence or otherwise) arising in any way out of the use of this software, even if advised of the possibility of such damage.
                </p>
                <p>
                  By clicking "I Agree" below, you legally waive all rights to hold the developer accountable for any outcomes related to MANTIS.
                </p>
              </div>

              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-lg border border-white/10">
                <input 
                  type="checkbox" 
                  id="agree" 
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-5 h-5 accent-[#eab308] cursor-pointer"
                />
                <label htmlFor="agree" className="text-sm cursor-pointer select-none">
                  I have read and unconditionally agree to the Terms and Agreements. I acknowledge the developer is not responsible for any issues.
                </label>
              </div>

              <div className="flex justify-end">
                <button 
                  disabled={!agreed}
                  onClick={() => setStep('integration')}
                  className={`px-8 py-3 rounded-full text-sm font-bold tracking-[0.2em] uppercase transition-all duration-300 ${
                    agreed 
                      ? 'bg-[#eab308] text-black hover:bg-white cursor-pointer shadow-[0_0_20px_rgba(234,179,8,0.3)]' 
                      : 'bg-white/10 text-white/30 cursor-not-allowed'
                  }`}
                >
                  Proceed
                </button>
              </div>
            </div>
          )}

          {step === 'integration' && (
            <div className="step-container space-y-12">
              <div>
                <h1 className="text-4xl font-medium tracking-tight mb-4">MANTIS Integration</h1>
                <p className="opacity-60 text-sm">Follow the methods below to add MANTIS protection to your infrastructure.</p>
              </div>

              <div className="grid gap-8">
                
                {/* Method 1 */}
                <div className="bg-[#111827] border border-white/10 rounded-xl p-8">
                  <h3 className="text-xl font-medium mb-2 text-[#00ffaa]">Method 1: Express.js Middleware</h3>
                  <p className="text-sm opacity-60 mb-6">Drop-in middleware for Node.js API backends.</p>
                  <pre className="bg-[#0a0e1a] p-4 rounded-lg overflow-x-auto text-xs font-mono border border-white/5 text-[#a8b2d1]">
                    <code>
{`const express = require('express');
const mantis = require('@mantis/node-sdk');

const app = express();

// Initialize MANTIS connection
mantis.init({
  endpoint: 'https://your-mantis-gateway.com',
  apiKey: process.env.MANTIS_API_KEY
});

// Apply global protection
app.use(mantis.protect({
  blockMode: true,
  logOnly: false
}));

app.post('/api/data', (req, res) => {
  res.json({ success: true, message: 'Protected Data' });
});`}
                    </code>
                  </pre>
                </div>

                {/* Method 2 */}
                <div className="bg-[#111827] border border-white/10 rounded-xl p-8">
                  <h3 className="text-xl font-medium mb-2 text-[#7c3aed]">Method 2: REST API Polling</h3>
                  <p className="text-sm opacity-60 mb-6">Forward logs and receive dynamic blocklists via standard HTTP requests.</p>
                  <pre className="bg-[#0a0e1a] p-4 rounded-lg overflow-x-auto text-xs font-mono border border-white/5 text-[#a8b2d1]">
                    <code>
{`// Add Data to MANTIS Threat Engine
curl -X POST https://your-mantis-gateway.com/api/v1/ingest \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "ip": "192.168.1.100",
    "path": "/api/login",
    "method": "POST",
    "payload_signature": "detected_sqli_pattern"
  }'

// Retrieve Active Blocklist
curl -X GET https://your-mantis-gateway.com/api/v1/blocklist \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                    </code>
                  </pre>
                </div>

              </div>

              <div className="pt-8 border-t border-white/10 text-center">
                 <Link href="/dashboard" className="text-sm text-[#eab308] hover:text-white transition-colors tracking-widest uppercase">
                   Open Threat Operations Center →
                 </Link>
              </div>

            </div>
          )}

        </div>
      </main>
    </GoogleOAuthProvider>
  );
}
