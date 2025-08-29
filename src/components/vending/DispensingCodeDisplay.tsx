import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  Clock,
  Package,
  QrCode,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  Star,
  Home,
  Copy,
  Timer
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { VendingMachine } from '@/types/vending';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface VendingOrderData {
  id: string;
  order_number: string;
  dispensing_code: string;
  dispensing_code_expires_at: string;
  status: string;
  total_amount: number;
  created_at: string;
  items?: Array<{
    product: any;
    quantity: number;
    slotNumber: string;
  }>;
}

interface DispensingCodeDisplayProps {
  machine: VendingMachine;
  orderData: VendingOrderData;
  onComplete: () => void;
  onReviewOrder?: (orderData: VendingOrderData) => void;
}

const DispensingCodeDisplay: React.FC<DispensingCodeDisplayProps> = ({
  machine,
  orderData,
  onComplete,
  onReviewOrder
}) => {
  const [currentStatus, setCurrentStatus] = useState(orderData.status);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Calculate time left
    const expiryTime = new Date(orderData.dispensing_code_expires_at).getTime();
    const now = Date.now();
    const difference = expiryTime - now;

    if (difference <= 0) {
      setIsExpired(true);
    } else {
      setTimeLeft(Math.floor(difference / 1000));
    }
  }, [orderData.dispensing_code_expires_at]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (timeLeft > 0 && !isExpired) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timeLeft, isExpired]);

  useEffect(() => {
    // Poll for status updates
    const pollInterval = setInterval(() => {
      if (currentStatus === 'paid' && !isExpired) {
        checkOrderStatus();
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [currentStatus, isExpired]);

  const checkOrderStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('status, dispensed_at')
        .eq('id', orderData.id)
        .single();

      if (error) throw error;

      if (data.status !== currentStatus) {
        setCurrentStatus(data.status);
        
        if (data.status === 'dispensed') {
          toast({
            title: "Products Dispensed!",
            description: "Your products have been dispensed from the machine",
          });
        } else if (data.status === 'completed') {
          toast({
            title: "Order Complete",
            description: "Thank you for using our vending machine!",
          });
        }
      }
    } catch (error) {
      console.error('Error checking order status:', error);
    }
  };

  const refreshStatus = async () => {
    setIsRefreshing(true);
    await checkOrderStatus();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(orderData.dispensing_code).then(() => {
      toast({
        title: "Code Copied",
        description: "Dispensing code copied to clipboard",
      });
    }).catch(() => {
      toast({
        title: "Copy Failed",
        description: "Could not copy code to clipboard",
        variant: "destructive",
      });
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusInfo = () => {
    switch (currentStatus) {
      case 'paid':
        return {
          icon: Clock,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          text: 'Payment Successful',
          description: 'Enter the code on the machine to get your products'
        };
      case 'dispensed':
        return {
          icon: Package,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          text: 'Products Dispensed',
          description: 'Your products are ready for collection'
        };
      case 'completed':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          text: 'Order Complete',
          description: 'Thank you for your purchase!'
        };
      default:
        return {
          icon: AlertTriangle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          text: 'Order Failed',
          description: 'There was an issue with your order'
        };
    }
  };

  const status = getStatusInfo();
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
        <div className="container mx-auto max-w-md text-center">
          <StatusIcon className={cn("h-12 w-12 mx-auto mb-4", "text-white")} />
          <h1 className="text-2xl font-bold mb-2">{status.text}</h1>
          <p className="text-primary-foreground/90">{status.description}</p>
        </div>
      </div>

      <div className="container mx-auto max-w-md p-4 -mt-4 space-y-6">
        {/* Dispensing Code Card */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Your Dispensing Code</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshStatus}
                disabled={isRefreshing}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              </Button>
            </div>
            <CardDescription>
              Enter this code on the vending machine to get your products
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Dispensing Code */}
            <div className="text-center">
              <div className="bg-muted/50 rounded-lg p-6 border-2 border-dashed border-primary/20">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <QrCode className="h-8 w-8 text-primary" />
                  <div className="text-3xl font-mono font-bold tracking-wider text-primary">
                    {orderData.dispensing_code}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyCodeToClipboard}
                  className="text-xs"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy Code
                </Button>
              </div>
            </div>

            {/* Timer */}
            {!isExpired && timeLeft > 0 && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Timer className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Code expires in:</span>
                </div>
                <div className={cn(
                  "text-2xl font-bold",
                  timeLeft < 300 ? "text-red-600" : "text-orange-600"
                )}>
                  {formatTime(timeLeft)}
                </div>
              </div>
            )}

            {/* Expired Warning */}
            {isExpired && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6 text-center">
                  <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-red-800 font-medium">Code Expired</p>
                  <p className="text-red-600 text-sm">
                    Please contact support for assistance
                  </p>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Machine Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Machine Location</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{machine.name}</span>
                <Badge variant="outline">{machine.machine_code}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{machine.location}</p>
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Order Number:</span>
              <span className="font-mono text-sm">{orderData.order_number}</span>
            </div>
            
            {orderData.items && (
              <>
                <Separator />
                {orderData.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-muted-foreground">
                        Slot {item.slotNumber} × {item.quantity}
                      </p>
                    </div>
                    <span className="font-medium">
                      ₹{(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </>
            )}
            
            <Separator />
            
            <div className="flex justify-between items-center font-semibold">
              <span>Total Amount:</span>
              <span className="text-primary text-lg">₹{orderData.total_amount.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span>Payment Time:</span>
              <span>{new Date(orderData.created_at).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              How to collect your products:
            </h3>
            <ol className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center font-bold">1</span>
                Go to the vending machine at {machine.location}
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center font-bold">2</span>
                Look for the "Enter Code" or "Dispense" option on the screen
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center font-bold">3</span>
                Enter the dispensing code: <span className="font-mono font-bold">{orderData.dispensing_code}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center font-bold">4</span>
                Collect your products from the dispensing slot
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          {currentStatus === 'completed' && onReviewOrder && (
            <Button
              onClick={() => onReviewOrder(orderData)}
              variant="outline"
              className="w-full"
            >
              <Star className="h-4 w-4 mr-2" />
              Rate Your Experience
            </Button>
          )}
          
          <Button
            onClick={onComplete}
            className="w-full"
            size="lg"
          >
            <Home className="h-4 w-4 mr-2" />
            Return to Home
          </Button>
        </div>

        {/* Status Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium">Payment Successful</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(orderData.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-5 w-5 rounded-full flex items-center justify-center",
                  currentStatus === 'dispensed' || currentStatus === 'completed'
                    ? "bg-green-600 text-white"
                    : "bg-muted text-muted-foreground"
                )}>
                  <Package className="h-3 w-3" />
                </div>
                <div className="flex-1">
                  <p className={cn(
                    "font-medium",
                    currentStatus === 'dispensed' || currentStatus === 'completed'
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}>
                    Products Dispensed
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {currentStatus === 'dispensed' || currentStatus === 'completed'
                      ? "Products ready for collection"
                      : "Waiting for dispensing code"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-5 w-5 rounded-full flex items-center justify-center",
                  currentStatus === 'completed'
                    ? "bg-green-600 text-white"
                    : "bg-muted text-muted-foreground"
                )}>
                  <CheckCircle className="h-3 w-3" />
                </div>
                <div className="flex-1">
                  <p className={cn(
                    "font-medium",
                    currentStatus === 'completed'
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}>
                    Order Complete
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {currentStatus === 'completed'
                      ? "Thank you for your purchase!"
                      : "Products collected"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DispensingCodeDisplay;
