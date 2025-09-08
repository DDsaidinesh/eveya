import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, MapPin, Package, Plus, Minus, ShoppingCart, QrCode } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { VendingMachine, Product, MachineInventory } from '@/types/vending';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface ProductWithInventory extends Product {
  inventory: MachineInventory;
}

interface CartItem {
  product: ProductWithInventory;
  quantity: number;
  slotNumber: string;
}

const MachinePage: React.FC = () => {
  const { machineCode } = useParams<{ machineCode: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [machine, setMachine] = useState<VendingMachine | null>(null);
  const [products, setProducts] = useState<ProductWithInventory[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (machineCode) {
      fetchMachineData();
    }
  }, [machineCode]);

  const fetchMachineData = async () => {
    try {
      // Fetch machine details
      const { data: machineData, error: machineError } = await supabase
        .from('vending_machines')
        .select('*')
        .eq('machine_code', machineCode)
        .eq('status', 'active')
        .single();

      if (machineError || !machineData) {
        toast({
          title: "Machine Not Found",
          description: "The requested vending machine could not be found.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setMachine(machineData as VendingMachine);

      // Fetch machine inventory with product details
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('machine_inventory')
        .select(`
          *,
          product:products(*)
        `)
        .eq('machine_id', machineData.id)
        .gt('quantity_available', 0);

      if (inventoryError) throw inventoryError;

      const productsWithInventory = inventoryData?.map(inv => ({
        ...inv.product,
        inventory: inv
      })) as ProductWithInventory[];

      setProducts(productsWithInventory || []);

    } catch (error) {
      console.error('Error fetching machine data:', error);
      toast({
        title: "Error Loading Machine",
        description: "Failed to load machine details. Please try again.",
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
          title: "Stock Limit Reached",
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
      setCartItems(items => [...items, {
        product,
        quantity: 1,
        slotNumber: product.inventory.slot_number
      }]);
    }
  };

  const removeFromCart = (productId: string) => {
    const existingItem = cartItems.find(item => item.product.id === productId);
    
    if (existingItem && existingItem.quantity > 1) {
      setCartItems(items => 
        items.map(item => 
          item.product.id === productId 
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
      );
    } else {
      setCartItems(items => items.filter(item => item.product.id !== productId));
    }
  };

  const getItemQuantityInCart = (productId: string) => {
    return cartItems.find(item => item.product.id === productId)?.quantity || 0;
  };

  const getTotalAmount = () => {
    return cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const handleCheckout = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to proceed with checkout",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before checkout",
        variant: "destructive",
      });
      return;
    }

    // Navigate to checkout page
    navigate(`/checkout/${machineCode}`, { 
      state: { 
        machine, 
        cartItems,
        totalAmount: getTotalAmount(),
        totalItems: getTotalItems()
      } 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Machine Not Found</h1>
          <p className="text-muted-foreground mb-6">The requested vending machine could not be found.</p>
          <Button asChild>
            <Link to="/">Return Home</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Machine Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{machine.name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground mt-2">
                <MapPin className="h-4 w-4" />
                <span>{machine.location}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <QrCode className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-mono">{machine.machine_code}</span>
                <Badge variant={machine.status === 'active' ? 'default' : 'secondary'}>
                  {machine.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="container mx-auto px-4 py-8">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Products Available</h2>
            <p className="text-muted-foreground">
              This machine is currently out of stock. Please try another machine.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-4">
            {/* Products Grid */}
            <div className="lg:col-span-3">
              <h2 className="text-xl font-semibold mb-6">Available Products</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => {
                  const quantityInCart = getItemQuantityInCart(product.id);
                  const isOutOfStock = product.inventory.quantity_available === 0;
                  const isMaxQuantity = quantityInCart >= product.inventory.quantity_available;

                  return (
                    <Card key={product.id} className="group hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center">
                          <Package className="h-12 w-12 text-muted-foreground" />
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="font-semibold text-sm">{product.name}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {product.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-primary">₹{product.price}</span>
                            <Badge variant="outline" className="text-xs">
                              Slot {product.inventory.slot_number}
                            </Badge>
                          </div>
                          
                          <div className="text-xs text-muted-foreground">
                            Stock: {product.inventory.quantity_available} available
                          </div>

                          {quantityInCart > 0 ? (
                            <div className="flex items-center justify-between bg-muted rounded-lg p-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeFromCart(product.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="font-medium text-sm">{quantityInCart}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => addToCart(product)}
                                disabled={isMaxQuantity}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              onClick={() => addToCart(product)}
                              disabled={isOutOfStock}
                              className="w-full"
                              size="sm"
                            >
                              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Cart Sidebar */}
            {cartItems.length > 0 && (
              <div className="lg:col-span-1">
                <div className="sticky top-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        Your Cart
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        {cartItems.map((item) => (
                          <div key={item.product.id} className="flex justify-between items-center text-sm">
                            <div className="flex-1">
                              <p className="font-medium">{item.product.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Slot {item.slotNumber} × {item.quantity}
                              </p>
                            </div>
                            <p className="font-medium">₹{(item.product.price * item.quantity).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                      
                      <Separator />
                      
                      <div className="flex justify-between font-semibold">
                        <span>Total ({getTotalItems()} items)</span>
                        <span className="text-primary">₹{getTotalAmount().toFixed(2)}</span>
                      </div>
                      
                      <Button onClick={handleCheckout} className="w-full">
                        Proceed to Checkout
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default MachinePage;