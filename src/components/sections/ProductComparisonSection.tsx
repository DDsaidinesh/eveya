import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

const ProductComparisonSection = () => {
  const products = [
    {
      name: "Leaf Pads",
      absorbency: "150-200ml",
      endurance: "8+ Hrs",
      technology: "Breathable Multilayers, 4-wings design",
      idealFor: "Everyday protection, Heavy Flow",
      uniqueEdge: "Free from harmful chemicals, Super soft and ultra-light"
    },
    {
      name: "Active Flex Pads", 
      absorbency: "250ml",
      endurance: "10+ Hrs",
      technology: "Reduces Cramps, mood swings, Breathable Multilayers, 4-wing design",
      idealFor: "During Menstrual Cramps, Heavy Mood swings, Heavy Flow",
      uniqueEdge: "Graphene Strip technology, Cramp reduction"
    },
    {
      name: "Disposable Period Panties",
      absorbency: "500ml", 
      endurance: "15+ Hrs",
      technology: "Breathable Multilayers, 360-degree Protection",
      idealFor: "Over-night, Travel, Workplaces",
      uniqueEdge: "All-in-one protection, Dual leak barriers"
    }
  ];

  const features = [
    "Free from Titanium Dioxide",
    "Chlorine Bleach Free", 
    "No Fragrances",
    "Dye Free",
    "Paraben Free",
    "Phthalate Free"
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary-glow/20 text-primary border-primary/20">
              Product Summary
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Compare Our
              <span className="bg-gradient-primary bg-clip-text text-transparent"> Product Range</span>
            </h2>
          </div>

          {/* Product Comparison Table */}
          <div className="bg-card rounded-2xl overflow-hidden shadow-elegant mb-12">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-subtle">
                  <tr>
                    <th className="p-4 text-left font-bold text-foreground">Product</th>
                    <th className="p-4 text-left font-bold text-foreground">Absorbency</th>
                    <th className="p-4 text-left font-bold text-foreground">Endurance</th>
                    <th className="p-4 text-left font-bold text-foreground">Key Technology</th>
                    <th className="p-4 text-left font-bold text-foreground">Ideal For</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <tr key={product.name} className={index % 2 === 0 ? "bg-muted/30" : "bg-card"}>
                      <td className="p-4 font-semibold text-primary">{product.name}</td>
                      <td className="p-4 text-muted-foreground">{product.absorbency}</td>
                      <td className="p-4 text-muted-foreground">{product.endurance}</td>
                      <td className="p-4 text-muted-foreground text-sm">{product.technology}</td>
                      <td className="p-4 text-muted-foreground text-sm">{product.idealFor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Common Features */}
          <div className="bg-gradient-card rounded-2xl p-8 text-center">
            <h3 className="text-xl font-bold text-foreground mb-6">All Products Feature</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-muted-foreground">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4 italic">
              Super soft and ultra-light for your complete comfort and safety.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductComparisonSection;