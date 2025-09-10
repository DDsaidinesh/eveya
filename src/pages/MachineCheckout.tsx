import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShieldCheck, Timer, Smartphone, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { VendingMachine } from '@/types/vending';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { 
  createPaymentOrder, 
  checkPaymentStatus, 
  PhonePeCheckout,
  CreateOrderRequest 
} from '@/services/paymentService';

interface CartItem {
  product: any;
  quantity: number;
  slotNumber: string;
}

interface LocationState {
  machine: VendingMachine;
  cartItems: CartItem[];
  totalAmount: number;
  totalItems: number;
}

const MachineCheckout: React.FC = () => {
  const { machineCode } = useParams<{ machineCode: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, session } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [phonepeAvailable, setPhonepeAvailable] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);

  const state = location.state as LocationState;
  const { machine, cartItems, totalAmount, totalItems } = state || {};

  useEffect(() => {
    // Redirect if no state provided
    if (!state || !machine || !cartItems) {
      navigate(`/machine/${machineCode}`);
      return;
    }

    // Check PhonePe availability
    const checkPhonePe = () => {
      setPhonepeAvailable(PhonePeCheckout.isAvailable());
    };

    checkPhonePe();
    const timeout = setTimeout(checkPhonePe, 1000);
    return () => clearTimeout(timeout);
  }, [state, machine, cartItems, machineCode, navigate]);

  const generateOrderNumber = () => {
    return `ORD-${machine.machine_code}-${Date.now().toString().slice(-6)}`;
  };

  const generateDispensingCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createOrder = async (paymentId: string) => {
    try {
      const orderNumber = generateOrderNumber();
      const dispensingCode = generateDispensingCode();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id,
          machine_id: machine.id,
          order_number: orderNumber,
          total_amount: totalAmount,
          status: 'paid',
          payment_method: 'phonepe',
          payment_id: paymentId,
          dispensing_code: dispensingCode,
          dispensing_code_expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        slot_number: item.slotNumber,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update machine inventory
      for (const item of cartItems) {
        const { error: inventoryError } = await supabase
          .from('machine_inventory')
          .update({
            quantity_available: item.product.inventory.quantity_available - item.quantity
          })
          .eq('machine_id', machine.id)
          .eq('product_id', item.product.id);

        if (inventoryError) console.error('Inventory update error:', inventoryError);
      }

      return { ...order, items: orderItems };
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  const handlePhonePePayment = async () => {
    if (!phonepeAvailable) {
      toast({
        title: "PhonePe Unavailable",
        description: "PhonePe payment service is not available. Please try again later.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    try {
      const orderRequest: CreateOrderRequest = {
        user_id: user!.id,
        machine_id: machine.id,
        machine_code: machine.machine_code,
        items: cartItems.map(item => ({
          product_id: item.product.id,
          product_name: item.product.name,
          product_price: item.product.price,
          quantity: item.quantity,
          slot_number: item.slotNumber
        })),
        redirect_url: `${window.location.origin}/machine/${machineCode}`,
        expire_after: 1200,
        meta_info: {
          udf1: `machine_${machine.machine_code}`,
          udf2: `user_${user!.id}`,
          udf3: `items_${cartItems.length}`
        }
      };

      const paymentResponse = await createPaymentOrder(orderRequest, session!.access_token);
      setCurrentOrder(paymentResponse);

      if (!paymentResponse.redirect_url) {
        throw new Error("No payment URL received from server");
      }

      toast({
        title: "Opening Payment Gateway",
        description: "Please complete your payment in the PhonePe window",
      });

      PhonePeCheckout.openPayPage(
        paymentResponse.redirect_url,
        async (response: string) => {
          await handlePaymentCallback(response, paymentResponse.merchant_order_id);
        }
      );

    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
      setProcessing(false);
    }
  };

  const handlePaymentCallback = async (response: string, merchantOrderId: string) => {
    if (response === 'USER_CANCEL') {
      toast({
        title: "Payment Cancelled",
        description: "You cancelled the payment. You can try again.",
        variant: "destructive",
      });
      setProcessing(false);
      return;
    }

    if (response === 'CONCLUDED') {
      toast({
        title: "Verifying Payment",
        description: "Please wait while we verify your payment...",
      });

      try {
        const statusResponse = await checkPaymentStatus(merchantOrderId, session!.access_token);
        
        if (statusResponse.status === 'COMPLETED') {
          toast({
            title: "Payment Successful!",
            description: `Your order has been placed successfully.`,
          });

          // Navigate to order confirmation
          navigate(`/order-confirmation/${statusResponse.order_id || currentOrder?.order_id}`, {
            state: {
              machine,
              orderData: {
                ...currentOrder,
                ...statusResponse,
                total_amount: totalAmount, // Use the correct total amount from checkout
                items: cartItems
              }
            }
          });
        } else if (statusResponse.status === 'FAILED') {
          toast({
            title: "Payment Failed",
            description: statusResponse.error_message || "Payment was not successful. Please try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Payment Pending",
            description: "Your payment is being processed. Please wait...",
          });
        }
      } catch (error) {
        console.error('Status check error:', error);
        toast({
          title: "Verification Failed",
          description: "Unable to verify payment status. Please contact support if amount was deducted.",
          variant: "destructive",
        });
      }
    }

    setProcessing(false);
  };

  // Redirect if required data is missing
  if (!state || !machine || !cartItems || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Checkout Session</h1>
          <p className="text-muted-foreground mb-6">Please start from the machine page.</p>
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
      
      {/* Checkout Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/machine/${machineCode}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Machine
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Checkout</h1>
              <div className="flex items-center gap-2 text-muted-foreground mt-2">
                <MapPin className="h-4 w-4" />
                <span>{machine.name} - {machine.location}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cartItems.map((item) => (
                <div key={`${item.product.id}-${item.slotNumber}`} className="flex justify-between items-center">
                  <div className="flex-1">
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Slot {item.slotNumber} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium">₹{(item.product.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
              
              <Separator />
              
              <div className="flex justify-between items-center font-semibold text-lg">
                <span>Total ({totalItems} items)</span>
                <span className="text-primary">₹{totalAmount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>Secure payment powered by PhonePe</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-lg bg-purple-50 border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center text-white font-bold">
                    P
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">PhonePe</p>
                      {phonepeAvailable ? (
                        <Badge variant="secondary">Available</Badge>
                      ) : (
                        <Badge variant="destructive">Unavailable</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">UPI, Cards, Net Banking & Wallets</p>
                  </div>
                  <Smartphone className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <span>Your payment is secured with 256-bit SSL encryption</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Timer className="h-4 w-4 text-orange-600" />
                <span>Dispensing code expires in 15 minutes after payment</span>
              </div>
            </CardContent>
          </Card>

          {/* Pay Button */}
          <Button 
            onClick={handlePhonePePayment}
            disabled={processing || !phonepeAvailable}
            className="w-full h-12 text-lg"
            size="lg"
          >
            {processing ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing Payment...
              </div>
            ) : (
              `Pay ₹${totalAmount.toFixed(2)} with PhonePe`
            )}
          </Button>

          {!phonepeAvailable && (
            <p className="text-center text-sm text-muted-foreground">
              PhonePe payment service is currently unavailable. Please try again later.
            </p>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default MachineCheckout;