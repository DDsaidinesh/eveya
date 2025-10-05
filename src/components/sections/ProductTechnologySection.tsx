import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

const ProductTechnologySection = () => {
  const [activeLayer, setActiveLayer] = useState<number | null>(null);
  
  const layers = [
    {
      name: "TOP SHEET",
      description: "Soft, breathable surface for comfort",
      feature: "Premium Cotton Feel",
      color: "from-pink-400/20 to-pink-600/20"
    },
    {
      name: "TRANSFER LAYER", 
      description: "Quick absorption and distribution",
      feature: "Lightning Fast",
      color: "from-blue-400/20 to-blue-600/20"
    },
    {
      name: "ABSORBENT CORE",
      description: "Super absorbent polymer core",
      feature: "10x Absorption",
      color: "from-purple-400/20 to-purple-600/20"
    },
    {
      name: "BACK FILM",
      description: "Leak-proof protection barrier",
      feature: "100% Secure",
      color: "from-emerald-400/20 to-emerald-600/20"
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

          {/* Interactive Technology Visualization */}
          <div className="relative overflow-hidden">
            {/* Background gradient animation */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-primary-glow/5 animate-pulse"></div>
            
            <div className="relative grid lg:grid-cols-2 gap-16 items-center">
              {/* Premium Product Visualization */}
              <div className="relative group">
                {/* Ambient glow effect */}
                <div className="absolute -inset-4 bg-gradient-primary opacity-20 blur-xl rounded-full group-hover:opacity-30 transition-all duration-700"></div>
                
                <div className="relative bg-gradient-card backdrop-blur-sm rounded-3xl p-12 border border-white/10 shadow-elegant hover:shadow-glow transition-all duration-500">
                  <div className="relative w-80 h-40 mx-auto">
                    {/* Dynamic pad layers with stacking effect */}
                    {layers.map((layer, index) => (
                      <div
                        key={layer.name}
                        className={`absolute transition-all duration-700 ease-out cursor-pointer group/layer ${
                          activeLayer === index ? 'scale-110 z-20' : 'hover:scale-105'
                        }`}
                        style={{
                          inset: `${index * 8}px`,
                          zIndex: layers.length - index
                        }}
                        onMouseEnter={() => setActiveLayer(index)}
                        onMouseLeave={() => setActiveLayer(null)}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-r ${layer.color} rounded-full shadow-soft transition-all duration-500 group-hover/layer:shadow-glow ${
                          activeLayer === index ? 'ring-2 ring-primary ring-opacity-50' : ''
                        }`}></div>
                        
                        {/* Layer indicator */}
                        <div 
                          className={`absolute w-4 h-4 bg-primary rounded-full shadow-lg transition-all duration-500 ${
                            activeLayer === index ? 'scale-125 shadow-glow' : ''
                          }`}
                          style={{
                            right: `-${30 + index * 50}px`,
                            top: `${15 + index * 25}px`
                          }}
                        >
                          <div className="absolute left-1/2 top-1/2 w-8 h-px bg-gradient-to-r from-primary to-transparent transform -translate-y-1/2"></div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary/20 rounded-full animate-ping"></div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Center core glow */}
                    <div className="absolute inset-1/2 w-2 h-2 -translate-x-1 -translate-y-1 bg-primary rounded-full shadow-glow animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Interactive Layer Details */}
              <div className="space-y-4">
                {layers.map((layer, index) => (
                  <div 
                    key={layer.name} 
                    className={`group/card relative p-6 rounded-2xl cursor-pointer transition-all duration-500 ${
                      activeLayer === index 
                        ? 'bg-gradient-card shadow-elegant scale-105 border border-primary/20' 
                        : 'bg-card/50 hover:bg-card hover:shadow-soft hover:scale-102'
                    }`}
                    onMouseEnter={() => setActiveLayer(index)}
                    onMouseLeave={() => setActiveLayer(null)}
                  >
                    {/* Animated background */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${layer.color} rounded-2xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-500`}></div>
                    
                    <div className="relative flex items-start gap-5">
                      <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-500 ${
                        activeLayer === index 
                          ? 'bg-primary text-primary-foreground shadow-glow scale-110' 
                          : 'bg-primary/10 text-primary group-hover/card:bg-primary group-hover/card:text-primary-foreground'
                      }`}>
                        {index + 1}
                        {activeLayer === index && (
                          <div className="absolute inset-0 bg-primary/20 rounded-xl animate-ping"></div>
                        )}
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className={`font-bold text-lg transition-colors duration-300 ${
                            activeLayer === index ? 'text-primary' : 'text-foreground'
                          }`}>
                            {layer.name}
                          </h3>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full transition-all duration-300 ${
                            activeLayer === index 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-primary/10 text-primary'
                          }`}>
                            {layer.feature}
                          </span>
                        </div>
                        <p className={`transition-colors duration-300 ${
                          activeLayer === index ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {layer.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Hover indicator */}
                    <div className={`absolute left-0 top-1/2 w-1 bg-primary rounded-r-full transition-all duration-300 ${
                      activeLayer === index ? 'h-8 -translate-y-4' : 'h-0 -translate-y-0'
                    }`}></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductTechnologySection;