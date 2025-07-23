import { useState } from 'react';
import { Minus, Plus, X, ShoppingBag, CreditCard, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useCart } from '@/contexts/CartContext';
import RfidDiscountCard from './RfidDiscountCard';

interface CartDrawerProps {
  children: React.ReactNode;
}

const CartDrawer = ({ children }: CartDrawerProps) => {
  const { state, updateQuantity, removeFromCart, clearCart, finalTotal } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  const handleCheckout = () => {
    // Mock checkout process
    setTimeout(() => {
      clearCart();
      setIsOpen(false);
    }, 1000);
  };

  if (state.itemCount === 0) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          {children}
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Shopping Cart
            </SheetTitle>
            <SheetDescription>
              Your cart is currently empty
            </SheetDescription>
          </SheetHeader>
          
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground mb-6">
              Add some products to get started!
            </p>
            <Button onClick={() => setIsOpen(false)} variant="premium">
              Continue Shopping
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Shopping Cart
            </div>
            <Badge variant="secondary">{state.itemCount} items</Badge>
          </SheetTitle>
          <SheetDescription>
            Review your items and proceed to checkout
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-4">
            {state.items.map((item) => (
              <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-md"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{item.name}</h4>
                  <p className="text-xs text-muted-foreground">{item.variant.size}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-semibold text-primary">
                      ₹{item.variant.price}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => removeFromCart(item.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Separator className="my-6" />

          {/* RFID Discount Section */}
          <RfidDiscountCard />

          <Separator className="my-6" />

          {/* Order Summary */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>₹{state.total}</span>
            </div>
            {state.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>RFID Discount:</span>
                <span>-₹{state.discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>Shipping:</span>
              <span className="text-green-600">Free</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total:</span>
              <span className="text-primary">₹{finalTotal}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="space-y-3 pt-4 border-t">
          <Button
            onClick={handleCheckout}
            className="w-full"
            variant="premium"
            size="lg"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Proceed to Checkout
          </Button>
          <Button
            onClick={clearCart}
            variant="outline"
            className="w-full"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Cart
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;