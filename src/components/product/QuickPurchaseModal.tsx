import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, ShoppingCart, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Product } from '@/data/products';
import { VendingMachine } from '@/types/vending';

interface QuickPurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
}

const QuickPurchaseModal = ({ open, onOpenChange, product }: QuickPurchaseModalProps) => {
  const [machines, setMachines] = useState<VendingMachine[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<VendingMachine | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      fetchNearbyMachines();
    }
  }, [open]);

  const fetchNearbyMachines = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vending_machines')
        .select('*')
        .eq('status', 'active')
        .limit(5);

      if (error) throw error;
      setMachines(data || []);
    } catch (error) {
      console.error('Error fetching machines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMachine = (machine: VendingMachine) => {
    setSelectedMachine(machine);
  };

  const handleProceedToPurchase = () => {
    if (selectedMachine) {
      // Navigate to machine-specific page
      navigate(`/machine/${selectedMachine.machine_code}`);
      onOpenChange(false);
    }
  };

  const handleQuickAuth = () => {
    onOpenChange(false);
    navigate('/auth');
  };

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign In Required</DialogTitle>
            <DialogDescription>
              Please sign in to purchase products from our vending machines.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-sm text-muted-foreground">{product.description}</p>
                <p className="text-lg font-bold text-primary">₹{product.variants[0].price}</p>
              </div>
            </div>
            <Button onClick={handleQuickAuth} className="w-full">
              Sign In to Purchase
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quick Purchase</DialogTitle>
          <DialogDescription>
            Select a nearby vending machine to purchase {product.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Summary */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="w-16 h-16 bg-background rounded-lg overflow-hidden">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{product.name}</h3>
              <p className="text-sm text-muted-foreground">{product.description}</p>
              <p className="text-lg font-bold text-primary">₹{product.variants[0].price}</p>
            </div>
          </div>

          {/* Machine Selection */}
          <div>
            <h4 className="font-medium mb-4">Select a Vending Machine</h4>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : machines.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No machines available nearby</p>
                <Button variant="outline" onClick={fetchNearbyMachines} className="mt-4">
                  Refresh
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {machines.map((machine) => (
                  <Card 
                    key={machine.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedMachine?.id === machine.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleSelectMachine(machine)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{machine.name}</h3>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <MapPin className="h-4 w-4" />
                            {machine.location}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Code: {machine.machine_code}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={machine.status === 'active' ? 'default' : 'secondary'}>
                            {machine.status}
                          </Badge>
                          {selectedMachine?.id === machine.id && (
                            <Badge variant="outline" className="text-primary border-primary">
                              Selected
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleProceedToPurchase}
              disabled={!selectedMachine}
              className="flex-1"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Proceed to Purchase
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickPurchaseModal;