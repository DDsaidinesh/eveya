import { Badge } from '@/components/ui/badge';

const ProductTechnologySection = () => {
  const layers = [
    {
      name: "TOP SHEET",
      description: "Soft, breathable surface for comfort"
    },
    {
      name: "TRANSFER LAYER", 
      description: "Quick absorption and distribution"
    },
    {
      name: "ABSORBENT CORE",
      description: "Super absorbent polymer core"
    },
    {
      name: "BACK FILM",
      description: "Leak-proof protection barrier"
    }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary-glow/20 text-primary border-primary/20">
              Advanced Technology
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              4-Layer
              <span className="bg-gradient-primary bg-clip-text text-transparent"> Protection System</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">pH Balanced</div>
                <p className="text-sm text-muted-foreground">Prevents irritation</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">All Skin Types</div>
                <p className="text-sm text-muted-foreground">Universal compatibility</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">Advanced Tech</div>
                <p className="text-sm text-muted-foreground">Maximum protection</p>
              </div>
            </div>
          </div>

          {/* Technology Visualization */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Product Visualization */}
            <div className="relative">
              <div className="bg-gradient-to-br from-muted/30 to-muted/10 rounded-3xl p-8 h-96 flex items-center justify-center">
                <div className="relative w-64 h-32">
                  {/* Simplified pad visualization */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white to-gray-100 rounded-full shadow-soft"></div>
                  <div className="absolute inset-2 bg-gradient-to-r from-pink-50 to-purple-50 rounded-full"></div>
                  <div className="absolute inset-4 bg-gradient-to-r from-primary/10 to-primary-glow/10 rounded-full"></div>
                  
                  {/* Layer indicators */}
                  {layers.map((layer, index) => (
                    <div 
                      key={layer.name}
                      className="absolute w-3 h-3 bg-primary rounded-full"
                      style={{
                        right: `-${20 + index * 40}px`,
                        top: `${20 + index * 20}px`
                      }}
                    >
                      <div className="w-px h-8 bg-border absolute left-1/2 top-3 transform -translate-x-1/2"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Layer Details */}
            <div className="space-y-6">
              {layers.map((layer, index) => (
                <div key={layer.name} className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm mt-1">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground mb-1">{layer.name}</h3>
                    <p className="text-muted-foreground">{layer.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductTechnologySection;