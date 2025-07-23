import { useState } from 'react';
import { Filter, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ProductCard from '@/components/product/ProductCard';
import { PRODUCTS } from '@/data/products';

const ProductsSection = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categories = ['All', 'Sanitary Pads', 'Period Panties', 'Combo Pack'];

  const filteredProducts = selectedCategory === 'All' 
    ? PRODUCTS 
    : PRODUCTS.filter(product => product.category === selectedCategory);

  const handleAddToCart = (productId: string, variant: any) => {
    // This function is no longer needed as ProductCard handles it internally
    console.log('Product card will handle cart operations internally');
  };

  return (
    <section id="products" className="py-16 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary-glow/20 text-primary border-primary/20">
            Our Products
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Discover Our
            <span className="bg-gradient-primary bg-clip-text text-transparent"> Premium Collection</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Every product is carefully crafted with premium materials and innovative technology 
            for your comfort and protection.
          </p>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="transition-smooth"
              >
                {category}
              </Button>
            ))}
          </div>

          {/* View Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-muted' : ''}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-muted' : ''}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {/* Products Grid */}
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1'
        }`}>
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>

        {/* Load More */}
        {filteredProducts.length > 8 && (
          <div className="text-center mt-12">
            <Button variant="elegant" size="lg">
              Load More Products
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductsSection;