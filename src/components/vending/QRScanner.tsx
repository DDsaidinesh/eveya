import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QrCode, Camera, MapPin, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { VendingMachine } from '@/types/vending';
import { toast } from '@/components/ui/use-toast';

interface QRScannerProps {
  onMachineSelected: (machine: VendingMachine) => void;
  onBack?: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onMachineSelected, onBack }) => {
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [nearbyMachines, setNearbyMachines] = useState<VendingMachine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNearbyMachines();
  }, []);

  const fetchNearbyMachines = async () => {
    try {
      const { data, error } = await supabase
        .from('vending_machines')
        .select('*')
        .eq('status', 'active')
        .limit(8);

      if (error) throw error;
      setNearbyMachines(data as VendingMachine[]);
    } catch (error) {
      console.error('Error fetching machines:', error);
      toast({
        title: "Error",
        description: "Failed to load nearby machines",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (code: string) => {
    try {
      setScanning(true);
      
      // Find machine by QR code or machine code
      const { data, error } = await supabase
        .from('vending_machines')
        .select('*')
        .or(`qr_code.eq.${code},machine_code.eq.${code}`)
        .eq('status', 'active')
        .single();

      if (error || !data) {
        toast({
          title: "Machine Not Found",
          description: "Please check the code and try again",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Machine Found!",
        description: `Connected to ${data.name}`,
      });

      onMachineSelected(data as VendingMachine);
    } catch (error) {
      console.error('Error finding machine:', error);
      toast({
        title: "Error",
        description: "Failed to connect to machine",
        variant: "destructive",
      });
    } finally {
      setScanning(false);
    }
  };

  const handleMachineSelect = (machine: VendingMachine) => {
    toast({
      title: "Machine Selected",
      description: `Connected to ${machine.name}`,
    });
    onMachineSelected(machine);
  };

  // Mock QR scanning - in real app, this would use camera
  const startQRScan = () => {
    setScanning(true);
    toast({
      title: "QR Scanner",
      description: "Point your camera at the QR code on the machine",
    });
    
    // Simulate QR scan with first available machine for demo
    setTimeout(() => {
      if (nearbyMachines.length > 0) {
        handleMachineSelect(nearbyMachines[0]);
      }
      setScanning(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Select Vending Machine</h1>
          <p className="text-muted-foreground">
            Scan QR code or enter machine ID to get started
          </p>
        </div>

        {/* QR Scanner Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Scan QR Code
            </CardTitle>
            <CardDescription>
              Point your camera at the QR code on the vending machine
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={startQRScan}
              disabled={scanning}
              className="w-full h-16 text-lg"
              size="lg"
            >
              {scanning ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Scanning...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Camera className="h-6 w-6" />
                  Start QR Scan
                </div>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Manual Entry Card */}
        <Card>
          <CardHeader>
            <CardTitle>Enter Machine Code</CardTitle>
            <CardDescription>
              Manually enter the machine ID if QR scan isn't working
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="machine-code">Machine Code</Label>
              <Input
                id="machine-code"
                placeholder="e.g., VM001"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              />
            </div>
            <Button
              onClick={() => handleCodeSubmit(manualCode)}
              disabled={!manualCode || scanning}
              className="w-full"
            >
              Connect to Machine
            </Button>
          </CardContent>
        </Card>

        {/* Nearby Machines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Nearby Machines
            </CardTitle>
            <CardDescription>
              Select from available machines near you
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded"></div>
                ))}
              </div>
            ) : nearbyMachines.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No machines available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {nearbyMachines.map((machine) => (
                  <div
                    key={machine.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleMachineSelect(machine)}
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{machine.name}</h3>
                      <p className="text-xs text-muted-foreground">{machine.location}</p>
                      <p className="text-xs font-mono text-primary">{machine.machine_code}</p>
                    </div>
                    <Button size="sm" variant="outline">
                      Select
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {onBack && (
          <Button variant="outline" onClick={onBack} className="w-full">
            Back
          </Button>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
