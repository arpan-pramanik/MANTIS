import Header from "./components/Header";
import Hero from "./components/Hero";
import ProblemSection from "./components/ProblemSection";
import StatementSection from "./components/StatementSection";
import Footer from "./components/Footer";
import CustomCursor from "./components/CustomCursor";
import PricingSection from "./components/PricingSection";

export default function Home() {
  return (
    <main className="min-h-screen bg-brand-dark overflow-x-hidden selection:bg-brand-orange selection:text-white">
      <CustomCursor />
      <Header />
      <Hero />
      <ProblemSection />
      <StatementSection />
      <PricingSection />
      <Footer />
    </main>
  );
}
