import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, QrCode, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { VendingMachine, MachineInventory } from '@/types/vending';

const VendingMachinesSection = () => {
  const [machines, setMachines] = useState<VendingMachine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      const { data, error } = await supabase
        .from('vending_machines')
        .select('*')
        .eq('status', 'active')
        .limit(6);

      if (error) throw error;
      setMachines(data || []);
    } catch (error) {
      console.error('Error fetching machines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewMachine = (machineId: string) => {
    // Navigate to vending app
    window.location.href = '/vending';
  };

  if (loading) {
    return (
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Finding Nearby Machines...
            </h2>
            <div className="animate-pulse grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="vending-machines" className="py-20 px-4 bg-muted/50">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Find Nearby Vending Machines
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Locate convenient vending machines near you for quick and easy access to 
            feminine hygiene products anytime, anywhere.
          </p>
        </div>

        {machines.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Machines Available</h3>
            <p className="text-muted-foreground">
              We're expanding our network. Check back soon!
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
              {machines.map((machine) => (
                <Card key={machine.id} className="group hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {machine.name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="h-4 w-4" />
                          {machine.location}
                        </CardDescription>
                      </div>
                      <Badge variant={machine.status === 'active' ? 'default' : 'secondary'}>
                        {machine.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <QrCode className="h-4 w-4" />
                        <span>Code: {machine.machine_code}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="h-4 w-4 text-green-600" />
                        <span className="text-green-600 font-medium">Products Available</span>
                      </div>

                      <Button 
                        onClick={() => handleViewMachine(machine.id)}
                        className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                        variant="outline"
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        Scan QR Code
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Link to="/vending">
                <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80">
                  <MapPin className="h-5 w-5 mr-2" />
                  Start Vending App
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default VendingMachinesSection;