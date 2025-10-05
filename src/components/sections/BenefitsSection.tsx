import { Badge } from '@/components/ui/badge';
import { Leaf, Shield, Heart, Star, Wind, Droplets } from 'lucide-react';

const BenefitsSection = () => {
  const benefits = [
    {
      icon: Wind,
      title: "Breathable Layers",
      subtitle: "No Bad Odor",
      description: "Cool & Fresh, Sweat-Free"
    },
    {
      icon: Droplets,
      title: "Ultra-Thin & Light Weight",
      subtitle: "Wear It. Forget It.",
      description: "Feather-Light, Slim Fit"
    },
    {
      icon: Shield,
      title: "Leak Proof Barriers", 
      subtitle: "No Spills",
      description: "No Drips, No Stress"
    },
    {
      icon: Leaf,
      title: "Chemical & Toxins Free",
      subtitle: "Hormone Safe",
      description: "Health Safe, No Risk Chemicals"
    },
    {
      icon: Star,
      title: "Absorbs 10x its Weight",
      subtitle: "Fast Absorbing", 
      description: "Locks Wetness, Dry Feel"
    },
    {
      icon: Heart,
      title: "Super Soft & Comfortable",
      subtitle: "Gentle on Skin",
      description: "Infection Free, Rash Free"
    }
  ];

  return (
    <section className="py-16 bg-gradient-subtle">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary-glow/20 text-primary border-primary/20">
              Why Choose Eveya?
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              What Sets Us
              <span className="bg-gradient-primary bg-clip-text text-transparent"> Apart?</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The most skin-friendly pad ever designed with advanced technology and premium materials.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <div 
                  key={benefit.title}
                  className="bg-card rounded-2xl p-6 hover:shadow-elegant transition-all duration-300 hover:scale-[1.02] group"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  
                  <h3 className="font-bold text-lg text-foreground mb-2">{benefit.title}</h3>
                  <p className="text-primary font-semibold mb-2">{benefit.subtitle}</p>
                  <p className="text-muted-foreground text-sm">{benefit.description}</p>
                </div>
              );
            })}
          </div>

          {/* Additional Info */}
          <div className="mt-12 text-center">
            <div className="bg-card rounded-2xl p-8 max-w-3xl mx-auto">
              <h3 className="text-xl font-bold text-foreground mb-4">Free From Harmful Chemicals</h3>
              <p className="text-muted-foreground">
                Our products are free from Titanium Dioxide, Chlorine Bleach, Fragrances, Dyes, 
                Parabens and Phthalates. Super soft and ultra-light for your complete comfort and safety.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;