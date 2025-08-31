import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Package } from 'lucide-react';
import { VendingMachine, Product, MachineInventory } from '@/types/vending';
import { useToast } from '@/hooks/use-toast';

interface MachineInventoryDialogProps {
  machine: VendingMachine;
  trigger: React.ReactNode;
}

export const MachineInventoryDialog = ({ machine, trigger }: MachineInventoryDialogProps) => {
  const [open, setOpen] = useState(false);
  const [inventory, setInventory] = useState<(MachineInventory & { product?: Product })[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchInventory();
      fetchProducts();
    }
  }, [open, machine.id]);

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('machine_inventory')
        .select(`
          *,
          product:products(*)
        `)
        .eq('machine_id', machine.id)
        .order('slot_number');

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast({ 
        title: 'Error fetching inventory', 
        description: 'Please try again.',
        variant: 'destructive' 
      });
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const updateInventory = async (inventoryId: string, quantity: number) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('machine_inventory')
        .update({ quantity_available: quantity })
        .eq('id', inventoryId);

      if (error) throw error;
      toast({ title: 'Inventory updated successfully' });
      fetchInventory();
    } catch (error) {
      console.error('Error updating inventory:', error);
      toast({ 
        title: 'Error updating inventory', 
        description: 'Please try again.',
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const addProductToSlot = async (productId: string, slotNumber: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('machine_inventory')
        .insert([{
          machine_id: machine.id,
          product_id: productId,
          slot_number: slotNumber,
          quantity_available: 0,
          max_capacity: 10
        }]);

      if (error) throw error;
      toast({ title: 'Product added to slot successfully' });
      fetchInventory();
    } catch (error) {
      console.error('Error adding product to slot:', error);
      toast({ 
        title: 'Error adding product to slot', 
        description: 'Please try again.',
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Management - {machine.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Inventory */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Current Inventory</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {inventory.map((item) => (
                <Card key={item.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-sm">{item.product?.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">Slot {item.slot_number}</p>
                      </div>
                      <Badge variant={item.quantity_available > 0 ? 'default' : 'secondary'}>
                        {item.quantity_available}/{item.max_capacity}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`qty-${item.id}`} className="text-xs">Quantity:</Label>
                        <Input
                          id={`qty-${item.id}`}
                          type="number"
                          min="0"
                          max={item.max_capacity}
                          defaultValue={item.quantity_available}
                          className="h-8 w-20"
                          onBlur={(e) => {
                            const newQty = parseInt(e.target.value) || 0;
                            if (newQty !== item.quantity_available) {
                              updateInventory(item.id, newQty);
                            }
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Price: ₹{item.product?.price}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Add New Product to Slot */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Add Product to New Slot</h3>
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label htmlFor="slot-number">Slot Number</Label>
                    <Input
                      id="slot-number"
                      placeholder="A1, B2, etc."
                      className="mt-1"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="product-select">Product</Label>
                    <select
                      id="product-select"
                      className="mt-1 w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                    >
                      <option value="">Select a product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} - ₹{product.price}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    onClick={() => {
                      const slotInput = document.getElementById('slot-number') as HTMLInputElement;
                      const productSelect = document.getElementById('product-select') as HTMLSelectElement;
                      
                      if (slotInput.value && productSelect.value) {
                        addProductToSlot(productSelect.value, slotInput.value);
                        slotInput.value = '';
                        productSelect.value = '';
                      } else {
                        toast({ 
                          title: 'Please fill all fields', 
                          variant: 'destructive' 
                        });
                      }
                    }}
                    disabled={loading}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Slot
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};