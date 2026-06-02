import CustomCursor from "../components/CustomCursor";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function TermsPage() {
  return (
    <main className="min-h-screen flex flex-col bg-brand-dark overflow-x-hidden selection:bg-brand-orange selection:text-white pt-32">
      <CustomCursor />
      <Header />
      <div className="flex-1 max-w-3xl w-full mx-auto px-6 text-brand-light">
        <h1 className="text-4xl font-serif mb-8">Terms of <span className="italic text-brand-orange">Service</span></h1>
        
        <div className="space-y-8 font-mono text-sm text-brand-light/70 leading-relaxed pb-24">
          <section>
            <h2 className="text-xl text-white font-serif mb-2">1. NO LIABILITY</h2>
            <p>The MANTIS developer bears zero liability for any consequences, damages, or losses arising from the use, deployment, or modification of this open-source software.</p>
          </section>

          <section>
            <h2 className="text-xl text-white font-serif mb-2">2. AT YOUR OWN RISK</h2>
            <p>The software is provided strictly "AS IS", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability or fitness for a particular purpose.</p>
          </section>

          <section>
            <h2 className="text-xl text-white font-serif mb-2">3. FULL RESPONSIBILITY</h2>
            <p>By proceeding, you assume full and sole responsibility for any data loss, system compromises, or security breaches connected with this self-hosted integration.</p>
          </section>

          <section>
            <h2 className="text-xl text-white font-serif mb-2">4. ENTERPRISE EXCLUSIVE SUPPORT COMMITMENT</h2>
            <p>As a valued Premium partner, you receive exclusive, prioritized access to our core development team. We commit to dedicating our available bandwidth specifically to your critical inquiries, ensuring that whenever our engineers are online and available, your architectural and security needs are immediately addressed.</p>
          </section>

          <section>
            <h2 className="text-xl text-white font-serif mb-2">5. BESPOKE SECURITY PATCHING & INDEMNIFICATION</h2>
            <p>Security is our utmost priority. Upon your organization reporting a confirmed vulnerability, we will rapidly provision custom, expedited patches explicitly tailored for your infrastructure. While we provide this cutting-edge, proactive protective service to drastically minimize your threat surface, you acknowledge that deploying any networked system inherently carries risks. Therefore, you agree that the developer remains fully indemnified, held harmless, and assumes absolutely no legal or financial liability for any breaches, data loss, or systemic failures.</p>
          </section>
        </div>
      </div>
      <div className="mt-auto">
        <Footer />
      </div>
    </main>
  );
}
