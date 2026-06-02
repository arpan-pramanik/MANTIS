import { useEffect } from 'react';

export default function TermsModal({ 
  type, 
  onClose 
}: { 
  type: 'manual' | 'api' | null, 
  onClose: () => void 
}) {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-[#0a0a0a] border border-brand-light/10 p-8 max-w-2xl w-full shadow-2xl flex flex-col max-h-[85vh]">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-brand-light/40 hover:text-white transition-colors"
        >
          ✕
        </button>

        <h2 className="text-2xl font-serif mb-6 text-brand-light">
          {type === 'manual' ? 'Free Tier Agreement' : 'Enterprise Service Agreement'}
        </h2>

        <div className="overflow-y-auto pr-4 text-sm text-brand-light/60 space-y-6 font-mono leading-relaxed custom-scrollbar">
          
          {type === 'manual' ? (
            <>
              <p className="text-brand-orange mb-2 uppercase tracking-widest font-bold">MANTIS SOFTWARE INTEGRATION AGREEMENT</p>
              
              <div>
                <h3 className="text-white mb-1">1. NO LIABILITY</h3>
                <p>The MANTIS developer bears zero liability for any consequences, damages, or losses arising from the use, deployment, or modification of this open-source software.</p>
              </div>

              <div>
                <h3 className="text-white mb-1">2. AT YOUR OWN RISK</h3>
                <p>The software is provided strictly "AS IS", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability or fitness for a particular purpose.</p>
              </div>

              <div>
                <h3 className="text-white mb-1">3. FULL RESPONSIBILITY</h3>
                <p>By proceeding, you assume full and sole responsibility for any data loss, system compromises, or security breaches connected with this self-hosted integration.</p>
              </div>

              <div className="pt-4 border-t border-brand-light/10">
                <h3 className="text-white mb-1">Refund Policy</h3>
                <p>Not applicable for free, open-source tiers. For general policies, visit <a href="https://terms.arpanpramanik.in/refund-policy" target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline">terms.arpanpramanik.in/refund-policy</a>.</p>
              </div>

              <div>
                <h3 className="text-white mb-1">Privacy Policy</h3>
                <p>We do not collect telemetry, diagnostic data, or personal information from self-hosted manual deployments. You maintain complete sovereignty over your data.</p>
              </div>
            </>
          ) : (
            <>
              <p className="text-brand-orange mb-2 uppercase tracking-widest font-bold">MANTIS CLOUD ENTERPRISE AGREEMENT</p>
              
              <div>
                <h3 className="text-white mb-1">1. EXCLUSIVE SUPPORT COMMITMENT</h3>
                <p>As a valued Premium partner, you receive exclusive, prioritized access to our core development team. We commit to dedicating our available bandwidth specifically to your critical inquiries, ensuring that whenever our engineers are online and available, your architectural and security needs are immediately addressed.</p>
              </div>

              <div>
                <h3 className="text-white mb-1">2. BESPOKE SECURITY PATCHING & INDEMNIFICATION</h3>
                <p>Security is our utmost priority. Upon your organization reporting a confirmed vulnerability, we will rapidly provision custom, expedited patches explicitly tailored for your infrastructure. While we provide this cutting-edge, proactive protective service to drastically minimize your threat surface, you acknowledge that deploying any networked system inherently carries risks. Therefore, you agree that the developer remains fully indemnified, held harmless, and assumes absolutely no legal or financial liability for any breaches, data loss, or systemic failures.</p>
              </div>

              <div className="pt-4 border-t border-brand-light/10">
                <h3 className="text-white mb-1">Refund Policy</h3>
                <p>We pride ourselves on a seamless, client-first billing experience. For complete details regarding our money-back guarantees, pro-rated exceptions, and billing dispute resolution, please review our comprehensive policy at <a href="https://terms.arpanpramanik.in/refund-policy" target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline">terms.arpanpramanik.in/refund-policy</a>.</p>
              </div>

              <div>
                <h3 className="text-white mb-1">Privacy Policy</h3>
                <p>Your proprietary data remains strictly yours. To ensure the absolute stability, uptime, and optimized performance of your Enterprise Gateway, we process only minimal, anonymized telemetry. We do not sell or expose your operational data to third parties.</p>
              </div>
            </>
          )}

        </div>

        <div className="mt-8 pt-6 border-t border-brand-light/10 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-brand-light/10 hover:bg-brand-light/20 text-white text-xs font-bold tracking-widest uppercase transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
