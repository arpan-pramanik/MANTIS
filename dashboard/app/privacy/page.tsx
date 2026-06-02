import CustomCursor from "../components/CustomCursor";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-brand-dark overflow-x-hidden selection:bg-brand-orange selection:text-white pt-32 pb-24">
      <CustomCursor />
      <Header />
      <div className="max-w-3xl mx-auto px-6 text-brand-light">
        <h1 className="text-4xl font-serif mb-8">Privacy <span className="italic text-brand-orange">Policy</span></h1>
        
        <div className="space-y-8 font-mono text-sm text-brand-light/70 leading-relaxed">
          <section>
            <h2 className="text-xl text-white font-serif mb-2">1. OPEN SOURCE TIERS</h2>
            <p>We do not collect telemetry, diagnostic data, or personal information from self-hosted manual deployments. You maintain complete sovereignty over your data.</p>
          </section>

          <section>
            <h2 className="text-xl text-white font-serif mb-2">2. CLOUD ENTERPRISE</h2>
            <p>Your proprietary data remains strictly yours. To ensure the absolute stability, uptime, and optimized performance of your Enterprise Gateway, we process only minimal, anonymized telemetry. We do not sell or expose your operational data to third parties.</p>
          </section>

          <section>
            <h2 className="text-xl text-white font-serif mb-2">3. THIRD-PARTY SERVICES</h2>
            <p>We use Paddle as our Merchant of Record for processing payments. Paddle securely handles your payment information. We do not store your credit card details directly on our servers.</p>
          </section>
        </div>
      </div>
      <div className="mt-24">
        <Footer />
      </div>
    </main>
  );
}
