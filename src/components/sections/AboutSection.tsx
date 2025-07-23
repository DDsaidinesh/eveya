import { Badge } from '@/components/ui/badge';

const AboutSection = () => {
  return (
    <section id="about" className="py-16 bg-gradient-subtle">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary-glow/20 text-primary border-primary/20">
              About Eveya
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Transforming Women's
              <span className="bg-gradient-primary bg-clip-text text-transparent"> Hygiene Experience</span>
            </h2>
          </div>

          {/* Key Points */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                <div className="w-8 h-8 bg-white rounded-full"></div>
              </div>
              <h3 className="font-bold text-xl text-foreground mb-2">Care & Innovation</h3>
              <p className="text-muted-foreground">Femi-tech solutions rooted in empathy</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                <div className="w-8 h-8 bg-white rounded-full"></div>
              </div>
              <h3 className="font-bold text-xl text-foreground mb-2">Premium Quality</h3>
              <p className="text-muted-foreground">Advanced functionality meets comfort</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                <div className="w-8 h-8 bg-white rounded-full"></div>
              </div>
              <h3 className="font-bold text-xl text-foreground mb-2">Empowerment</h3>
              <p className="text-muted-foreground">Supporting confidence & well-being</p>
            </div>
          </div>

          {/* Promise Section */}
          <div className="bg-gradient-card rounded-2xl p-8 text-center mb-16">
            <h3 className="text-2xl font-bold text-primary mb-4">Our Promise</h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Quality isn't a luxury—it's the foundation every product deserves. 
              We believe in setting benchmarks, not following them.
            </p>
          </div>

          {/* Vision & Mission */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-card rounded-2xl p-8 hover:shadow-elegant transition-all duration-300">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <div className="w-6 h-6 bg-gradient-primary rounded-full"></div>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-4">Our Vision</h3>
              <p className="text-muted-foreground">
                Redefining user experiences by delivering meaningful value that elevates every form of life.
              </p>
            </div>
            
            <div className="bg-card rounded-2xl p-8 hover:shadow-elegant transition-all duration-300">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <div className="w-6 h-6 bg-gradient-primary rounded-full"></div>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-4">Our Mission</h3>
              <p className="text-muted-foreground">
                Our goal is to elevate expectations and ensure that what consumers pay reflects 
                the value they receive. Because when standards rise, experiences improve.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;