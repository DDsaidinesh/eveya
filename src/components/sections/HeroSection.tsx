import heroProducts from '@/assets/hero-products.jpg';
import { ArrowRight, Shield, Heart, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HeroSection = () => {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center bg-gradient-subtle overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_hsl(var(--primary))_0%,_transparent_50%)]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center px-4 py-2 bg-primary-glow/20 border border-primary/20 rounded-full text-sm font-medium text-primary mb-6">
              <Heart className="h-4 w-4 mr-2" />
              Trusted by 50,000+ Women
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Access Feminine Care
              <span className="bg-gradient-primary bg-clip-text text-transparent block">
                Anytime, Anywhere
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              Find premium feminine hygiene products instantly through our convenient vending machines. 
              Discreet, accessible, and always available when you need them most.
            </p>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
                <Shield className="h-6 w-6 text-primary" />
                <span className="font-medium">8hr Protection</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
                <Leaf className="h-6 w-6 text-primary" />
                <span className="font-medium">100% Natural</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
                <Heart className="h-6 w-6 text-primary" />
                <span className="font-medium">Rash-Free</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg" variant="premium" className="group">
                Find Machines
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="elegant">
                How It Works
              </Button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative z-10 bg-card p-8 rounded-2xl shadow-elegant border">
              <img src={heroProducts} alt="Eveya Products" className="w-full h-auto rounded-lg" />
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-6 -right-6 bg-primary text-primary-foreground p-4 rounded-full shadow-glow animate-pulse">
              <Heart className="h-6 w-6" />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-accent text-accent-foreground p-3 rounded-full shadow-elegant">
              <Shield className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1200 120" className="w-full h-12 fill-background">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"></path>
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;