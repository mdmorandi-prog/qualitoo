import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import ModulesSection from "@/components/landing/ModulesSection";
import InnovationsSection from "@/components/landing/InnovationsSection";
import HighlightsSection from "@/components/landing/HighlightsSection";
import FaqSection from "@/components/landing/FaqSection";
import CtaSection from "@/components/landing/CtaSection";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <HeroSection />
      <HowItWorksSection />
      <ModulesSection />
      <InnovationsSection />
      <HighlightsSection />
      <FaqSection />
      <CtaSection />
      <Footer />
    </div>
  );
};

export default Index;
