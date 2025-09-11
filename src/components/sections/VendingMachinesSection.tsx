import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, QrCode, Package, ShoppingBag, Navigation } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { VendingMachine, MachineInventory } from '@/types/vending';
import { MachineCardSkeleton } from '@/components/ui/machine-card-skeleton';
import { getUserLocation, getDistance, formatDistance, UserLocation } from '@/utils/location';

interface MachineWithDistance extends VendingMachine {
  distance?: number;
}

const VendingMachinesSection = () => {
  const [machines, setMachines] = useState<MachineWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMachines();
    requestLocation();
  }, []);

  useEffect(() => {
    if (userLocation && machines.length > 0) {
      sortMachinesByDistance();
    }
  }, [userLocation, machines.length]);

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

  const requestLocation = async () => {
    setLocationLoading(true);
    try {
      const location = await getUserLocation();
      setUserLocation(location);
    } catch (error) {
      console.log('Location access denied or unavailable');
    }
    setLocationLoading(false);
  };

  const sortMachinesByDistance = () => {
    if (!userLocation) return;

    const machinesWithDistance = machines.map(machine => ({
      ...machine,
      distance: machine.latitude && machine.longitude 
        ? getDistance(userLocation.latitude, userLocation.longitude, Number(machine.latitude), Number(machine.longitude))
        : undefined
    }));

    // Sort by distance, putting machines without coordinates at the end
    machinesWithDistance.sort((a, b) => {
      if (a.distance === undefined) return 1;
      if (b.distance === undefined) return -1;
      return a.distance - b.distance;
    });

    setMachines(machinesWithDistance);
  };

  const handleSelectMachine = (machine: VendingMachine) => {
    navigate(`/machine/${machine.machine_code}`);
  };

  if (loading) {
    return (
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Finding Nearby Machines...
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <MachineCardSkeleton key={i} />
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
          <div className="flex items-center justify-center gap-3 mb-4">
            <h2 className="text-3xl md:text-4xl font-bold">
              Find Nearby Vending Machines
            </h2>
            {userLocation && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                Location enabled
              </Badge>
            )}
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {userLocation 
              ? "Machines sorted by distance from your location"
              : "Locate convenient vending machines near you for quick and easy access to feminine hygiene products anytime, anywhere."
            }
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
                        {machine.distance && (
                          <div className="flex items-center text-primary text-sm font-medium mt-1">
                            <Navigation className="w-3 h-3 mr-1" />
                            {formatDistance(machine.distance)} away
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={machine.status === 'active' ? 'default' : 'secondary'}>
                          {machine.status}
                        </Badge>
                        {machine.distance && machine.distance <= 1 && (
                          <Badge variant="outline" className="text-xs text-primary border-primary">
                            Nearby
                          </Badge>
                        )}
                      </div>
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

                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleSelectMachine(machine)}
                          className="flex-1"
                          variant="premium"
                        >
                          <ShoppingBag className="h-4 w-4 mr-2" />
                          Shop Here
                        </Button>
                        <Button 
                          onClick={() => handleSelectMachine(machine)}
                          variant="outline"
                          size="icon"
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80" asChild>
                <Link to="#vending-machines">
                  <MapPin className="h-5 w-5 mr-2" />
                  View All Machines
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default VendingMachinesSection;