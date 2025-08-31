import { useState } from 'react';
import { ShoppingCart, Heart, Star, Eye, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Product } from '@/data/products';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import QuickPurchaseModal from './QuickPurchaseModal';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
  const [showQuickPurchase, setShowQuickPurchase] = useState(false);
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const isLiked = isInWishlist(product.id);

  const handleAddToCart = () => {
    addToCart(product, selectedVariant);
  };

  const handleQuickPurchase = () => {
    setShowQuickPurchase(true);
  };

  const handleToggleWishlist = () => {
    if (isLiked) {
      removeFromWishlist(product.id);
    } else {
      const wishlistItem = {
        id: product.id,
        name: product.name,
        price: selectedVariant.price,
        image: product.image,
        category: product.category,
      };
      addToWishlist(wishlistItem);
    }
  };

  const savings = selectedVariant.originalPrice 
    ? selectedVariant.originalPrice - selectedVariant.price 
    : 0;

  return (
    <Card className="group overflow-hidden hover:shadow-elegant transition-all duration-300 hover:scale-[1.02] bg-gradient-card">
      <div className="relative">
        {/* Product Image */}
        <div className="aspect-square overflow-hidden bg-muted cursor-pointer">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          
          {/* Quick View Overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Button variant="secondary" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Quick View
            </Button>
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {savings > 0 && (
            <Badge className="bg-destructive text-destructive-foreground">
              Save ₹{savings}
            </Badge>
          )}
          {product.isCombo && (
            <Badge className="bg-accent text-accent-foreground">
              Combo Pack
            </Badge>
          )}
        </div>

        {/* Wishlist Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={handleToggleWishlist}
        >
          <Heart className={`h-4 w-4 transition-colors ${isLiked ? 'fill-primary text-primary' : ''}`} />
        </Button>
      </div>

      <CardContent className="p-6">
        {/* Product Info */}
        <div className="mb-4">
          <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-smooth">
            {product.name}
          </h3>
          <p className="text-muted-foreground text-sm mb-3">
            {product.description}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="text-sm text-muted-foreground ml-2">(4.8)</span>
          </div>
        </div>

        {/* Variant Selection */}
        <div className="mb-4">
          <label className="text-sm font-medium mb-2 block">Size:</label>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((variant) => (
              <Button
                key={variant.size}
                variant={selectedVariant.size === variant.size ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedVariant(variant)}
                className="text-xs"
              >
                {variant.size}
              </Button>
            ))}
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">
              ₹{selectedVariant.price}
            </span>
            {selectedVariant.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                ₹{selectedVariant.originalPrice}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={handleAddToCart}
            variant="outline"
            className="flex-1"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
          <Button 
            onClick={handleQuickPurchase}
            variant="premium"
            className="flex-1"
          >
            <Zap className="h-4 w-4 mr-2" />
            Buy Now
          </Button>
        </div>
      </CardContent>

      <QuickPurchaseModal 
        open={showQuickPurchase}
        onOpenChange={setShowQuickPurchase}
        product={product}
      />
    </Card>
  );
};

export default ProductCard;