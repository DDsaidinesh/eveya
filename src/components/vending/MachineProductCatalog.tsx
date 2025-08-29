import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Package, ShoppingCart, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { VendingMachine, Product, MachineInventory } from '@/types/vending';
import { toast } from '@/components/ui/use-toast';

interface ProductWithInventory extends Product {
  inventory: MachineInventory;
}

interface VendingCartItem {
  product: ProductWithInventory;
  quantity: number;
  slotNumber: string;
}

interface MachineProductCatalogProps {
  machine: VendingMachine;
  onBack: () => void;
  onProceedToCheckout: (items: VendingCartItem[]) => void;
}

const MachineProductCatalog: React.FC<MachineProductCatalogProps> = ({
  machine,
  onBack,
  onProceedToCheckout
}) => {
  const [products, setProducts] = useState<ProductWithInventory[]>([]);
  const [cartItems, setCartItems] = useState<VendingCartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMachineInventory();
  }, [machine.id]);

  const fetchMachineInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('machine_inventory')
        .select(`
          *,
          product:products(*)
        `)
        .eq('machine_id', machine.id)
        .gt('quantity_available', 0)
        .order('slot_number');

      if (error) throw error;

      const productsWithInventory = data.map(inventory => ({
        ...inventory.product,
        inventory
      })) as ProductWithInventory[];

      setProducts(productsWithInventory);
    } catch (error) {
      console.error('Error fetching machine inventory:', error);
      toast({
        title: "Error",
        description: "Failed to load machine products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: ProductWithInventory) => {
    const existingItem = cartItems.find(item => item.product.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.inventory.quantity_available) {
        toast({
          title: "Out of Stock",
          description: `Only ${product.inventory.quantity_available} items available`,
          variant: "destructive",
        });
        return;
      }
      
      setCartItems(items =>
        items.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCartItems(items => [
        ...items,
        {
          product,
          quantity: 1,
          slotNumber: product.inventory.slot_number
        }
      ]);
    }

    toast({
      title: "Added to Cart",
      description: `${product.name} added to your order`,
    });
  };

  const removeFromCart = (productId: string) => {
    const existingItem = cartItems.find(item => item.product.id === productId);
    
    if (!existingItem) return;
    
    if (existingItem.quantity === 1) {
      setCartItems(items => items.filter(item => item.product.id !== productId));
    } else {
      setCartItems(items =>
        items.map(item =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
      );
    }

    toast({
      title: "Removed from Cart",
      description: `${existingItem.product.name} quantity reduced`,
    });
  };

  const getTotalAmount = () => {
    return cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getItemQuantityInCart = (productId: string) => {
    return cartItems.find(item => item.product.id === productId)?.quantity || 0;
  };

  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Cart Empty",
        description: "Please add items to your cart first",
        variant: "destructive",
      });
      return;
    }

    onProceedToCheckout(cartItems);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-md">
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b z-10 p-4">
        <div className="container mx-auto max-w-md">
          <div className="flex items-center gap-3 mb-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="font-bold text-lg">{machine.name}</h1>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {machine.location}
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              {machine.machine_code}
            </Badge>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="container mx-auto max-w-md p-4">
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-1">Available Products</h2>
            <p className="text-sm text-muted-foreground">
              Select products to add to your cart
            </p>
          </div>

          {products.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No Products Available</h3>
                <p className="text-muted-foreground">
                  This machine is currently out of stock
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {products.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex">
                      {/* Product Image */}
                      <div className="w-24 h-24 bg-muted flex items-center justify-center">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      
                      {/* Product Details */}
                      <div className="flex-1 p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="font-medium text-sm leading-tight">
                              {product.name}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {product.description}
                            </p>
                          </div>
                          <div className="text-right ml-2">
                            <p className="font-bold text-primary text-lg">
                              ₹{product.price}
                            </p>
                            <Badge variant="outline" className="text-xs capitalize">
                              {product.category}
                            </Badge>
                          </div>
                        </div>

                        {/* Inventory Status */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              {product.inventory.quantity_available > 5 ? (
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              ) : (
                                <AlertCircle className="h-3 w-3 text-orange-500" />
                              )}
                              <span className="text-xs">
                                {product.inventory.quantity_available > 5 ? 'In Stock' : 
                                 `Only ${product.inventory.quantity_available} left`}
                              </span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              Slot {product.inventory.slot_number}
                            </Badge>
                          </div>

                          {/* Add to Cart Controls */}
                          <div className="flex items-center gap-2">
                            {getItemQuantityInCart(product.id) === 0 ? (
                              <Button
                                size="sm"
                                onClick={() => addToCart(product)}
                                disabled={product.inventory.quantity_available === 0}
                              >
                                Add
                              </Button>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeFromCart(product.id)}
                                >
                                  -
                                </Button>
                                <span className="text-sm font-medium px-2">
                                  {getItemQuantityInCart(product.id)}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => addToCart(product)}
                                  disabled={getItemQuantityInCart(product.id) >= product.inventory.quantity_available}
                                >
                                  +
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Cart Summary */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-20">
          <div className="container mx-auto max-w-md">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium">
                  {getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''} in cart
                </p>
                <p className="text-lg font-bold text-primary">
                  Total: ₹{getTotalAmount().toFixed(2)}
                </p>
              </div>
              <Button
                onClick={handleProceedToCheckout}
                size="lg"
                className="px-8"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Checkout
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MachineProductCatalog;
