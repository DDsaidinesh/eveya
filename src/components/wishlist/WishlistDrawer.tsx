import { Heart, ShoppingCart, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';

interface WishlistDrawerProps {
  children: React.ReactNode;
}

const WishlistDrawer = ({ children }: WishlistDrawerProps) => {
  const { items, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleMoveToCart = (item: any) => {
    // Create a mock product object for cart
    const mockProduct = {
      id: item.id,
      name: item.name,
      image: item.image,
      category: item.category
    };
    const mockVariant = {
      size: 'Standard',
      price: item.price
    };
    
    addToCart(mockProduct, mockVariant);
    removeFromWishlist(item.id);
  };

  if (items.length === 0) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          {children}
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Wishlist
            </SheetTitle>
            <SheetDescription>
              Your wishlist is currently empty
            </SheetDescription>
          </SheetHeader>
          
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <Heart className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Your wishlist is empty</h3>
            <p className="text-muted-foreground mb-6">
              Save your favorite products for later!
            </p>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Wishlist
            </div>
            <Badge variant="secondary">{items.length} items</Badge>
          </SheetTitle>
          <SheetDescription>
            Your saved products
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-md"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{item.name}</h4>
                  <p className="text-xs text-muted-foreground">{item.category}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-semibold text-primary">
                      ₹{item.price}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMoveToCart(item)}
                      >
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        Add to Cart
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromWishlist(item.id)}
                        className="text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t">
          <Button
            onClick={clearWishlist}
            variant="outline"
            className="w-full"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Wishlist
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default WishlistDrawer;