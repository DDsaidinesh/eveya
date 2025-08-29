import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/sections/HeroSection';
import VendingMachinesSection from '@/components/sections/VendingMachinesSection';
import ProductsSection from '@/components/sections/ProductsSection';
import AboutSection from '@/components/sections/AboutSection';
import ProductTechnologySection from '@/components/sections/ProductTechnologySection';
import BenefitsSection from '@/components/sections/BenefitsSection';
import ProductComparisonSection from '@/components/sections/ProductComparisonSection';
import ContactSection from '@/components/sections/ContactSection';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <VendingMachinesSection />
        <AboutSection />
        <ProductTechnologySection />
        <ProductsSection />
        <BenefitsSection />
        <ProductComparisonSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
