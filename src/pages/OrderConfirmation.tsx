import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Copy, 
  MapPin, 
  Clock, 
  Package, 
  QrCode,
  ArrowRight,
  Home,
  Star
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { VendingMachine } from '@/types/vending';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface OrderData {
  id: string;
  order_number: string;
  dispensing_code: string;
  dispensing_code_expires_at: string;
  status: string;
  total_amount: number;
  created_at: string;
  items?: any[];
}

interface LocationState {
  machine: VendingMachine;
  orderData: OrderData;
}

const OrderConfirmation: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [machine, setMachine] = useState<VendingMachine | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [loading, setLoading] = useState(true);

  const state = location.state as LocationState;

  useEffect(() => {
    if (state?.orderData && state?.machine) {
      setOrderData(state.orderData);
      setMachine(state.machine);
      setLoading(false);
    } else if (orderId) {
      fetchOrderData();
    } else {
      navigate('/');
    }
  }, [orderId, state, navigate]);

  useEffect(() => {
    if (orderData?.dispensing_code_expires_at) {
      const interval = setInterval(() => {
        updateTimeLeft();
      }, 1000);

      updateTimeLeft(); // Initial update

      return () => clearInterval(interval);
    }
  }, [orderData]);

  const fetchOrderData = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          vending_machines(*)
        `)
        .eq('id', orderId)
        .eq('user_id', user?.id)
        .single();

      if (error || !data) {
        toast({
          title: "Order Not Found",
          description: "The requested order could not be found.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setOrderData(data);
      setMachine(data.vending_machines);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast({
        title: "Error Loading Order",
        description: "Failed to load order details. Please try again.",
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const updateTimeLeft = () => {
    if (!orderData?.dispensing_code_expires_at) return;

    const now = new Date().getTime();
    const expiry = new Date(orderData.dispensing_code_expires_at).getTime();
    const timeDiff = expiry - now;

    if (timeDiff <= 0) {
      setIsExpired(true);
      setTimeLeft('00:00');
      return;
    }

    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    
    setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    setIsExpired(false);
  };

  const copyCodeToClipboard = () => {
    if (orderData?.dispensing_code) {
      navigator.clipboard.writeText(orderData.dispensing_code);
      toast({
        title: "Code Copied",
        description: "Dispensing code has been copied to clipboard",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  if (!orderData || !machine) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <p className="text-muted-foreground mb-6">The requested order could not be found.</p>
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
      
      {/* Success Header */}
      <div className="bg-green-50 border-b border-green-200">
        <div className="container mx-auto px-4 py-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl md:text-3xl font-bold text-green-800 mb-2">
            Payment Successful!
          </h1>
          <p className="text-green-700">
            Your order has been placed successfully. Use the code below to collect your items.
          </p>
        </div>
      </div>

      {/* Order Details */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          {/* Dispensing Code */}
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="text-center">Your Dispensing Code</CardTitle>
              <CardDescription className="text-center">
                Enter this code at the vending machine to collect your items
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="bg-primary/10 p-6 rounded-lg">
                <div className="text-4xl font-bold font-mono text-primary mb-2">
                  {orderData.dispensing_code}
                </div>
                <Button variant="outline" onClick={copyCodeToClipboard} className="mt-2">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </Button>
              </div>

              {!isExpired ? (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span>Code expires in: <strong className="text-orange-600">{timeLeft}</strong></span>
                </div>
              ) : (
                <div className="text-red-600 font-medium">
                  ⚠️ Dispensing code has expired. Please contact support.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Machine Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Machine Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{machine.name}</p>
                <p className="text-muted-foreground">{machine.location}</p>
                <div className="flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-mono">{machine.machine_code}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Order Number</p>
                  <p className="font-medium">{orderData.order_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Order Date</p>
                  <p className="font-medium">{formatDate(orderData.created_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Status</p>
                  <Badge variant="default">Paid</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Amount</p>
                  <p className="font-bold text-primary">₹{orderData.total_amount.toFixed(2)}</p>
                </div>
              </div>

              {orderData.items && orderData.items.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="font-medium">Items Ordered:</p>
                    {orderData.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.product?.name || 'Product'} × {item.quantity}</span>
                        <span>₹{item.total_price}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                How to Collect Your Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">1</div>
                  <p>Go to the vending machine at <strong>{machine.location}</strong></p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">2</div>
                  <p>Enter the dispensing code: <strong className="font-mono">{orderData.dispensing_code}</strong></p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">3</div>
                  <p>Collect your items from the designated slots</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">4</div>
                  <p>Remember to collect within 15 minutes of payment</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild className="flex-1">
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Return Home
              </Link>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link to={`/machine/${machine.machine_code}`}>
                <ArrowRight className="h-4 w-4 mr-2" />
                Shop Again
              </Link>
            </Button>
          </div>

          {/* Rate Experience */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                How was your experience?
              </p>
              <div className="flex justify-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-5 w-5 text-muted-foreground hover:text-yellow-500 cursor-pointer" />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Your feedback helps us improve our service
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default OrderConfirmation;