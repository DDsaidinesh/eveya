import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  Wallet,
  QrCode,
  ShieldCheck,
  Timer,
  Package,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { VendingMachine } from '@/types/vending';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { 
  createPaymentOrder, 
  checkPaymentStatus, 
  PhonePeCheckout,
  CreateOrderRequest 
} from '@/services/paymentService';

interface VendingCartItem {
  product: any;
  quantity: number;
  slotNumber: string;
}

interface PaymentCheckoutProps {
  machine: VendingMachine;
  cartItems: VendingCartItem[];
  onBack: () => void;
  onPaymentSuccess: (orderData: any) => void;
}

type PaymentMethod = 'phonepe' | 'card' | 'upi' | 'wallet';

const PaymentCheckout: React.FC<PaymentCheckoutProps> = ({
  machine,
  cartItems,
  onBack,
  onPaymentSuccess
}) => {
  const { user, session } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('phonepe');
  const [processing, setProcessing] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [upiId, setUpiId] = useState('');
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [phonepeAvailable, setPhonepeAvailable] = useState(false);

  // Check if PhonePe is available
  useEffect(() => {
    const checkPhonePe = () => {
      setPhonepeAvailable(PhonePeCheckout.isAvailable());
    };

    // Check immediately
    checkPhonePe();

    // Also check after a short delay in case script is still loading
    const timeout = setTimeout(checkPhonePe, 1000);

    return () => clearTimeout(timeout);
  }, []);

  const getTotalAmount = () => {
    return cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

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
      expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes expiry

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id,
          machine_id: machine.id,
          order_number: orderNumber,
          total_amount: getTotalAmount(),
          status: 'paid',
          payment_method: paymentMethod,
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

  const processPayment = async () => {
    setProcessing(true);

    try {
      if (!user || !session?.access_token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to continue with payment",
          variant: "destructive",
        });
        return;
      }

      // Handle PhonePe payment
      if (paymentMethod === 'phonepe') {
        await handlePhonePePayment();
        return;
      }

      // Handle other payment methods (mock for now)
      await handleOtherPaymentMethods();

    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
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

    // Prepare order request
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
      redirect_url: `${window.location.origin}/vending-app`,
      expire_after: 1200, // 20 minutes
      meta_info: {
        udf1: `machine_${machine.machine_code}`,
        udf2: `user_${user!.id}`,
        udf3: `items_${cartItems.length}`
      }
    };

    try {
      // Create payment order with backend
      const paymentResponse = await createPaymentOrder(orderRequest, session!.access_token);
      setCurrentOrder(paymentResponse);

      if (!paymentResponse.redirect_url) {
        throw new Error("No payment URL received from server");
      }

      toast({
        title: "Opening Payment Gateway",
        description: "Please complete your payment in the PhonePe window",
      });

      // Open PhonePe PayPage in iframe
      PhonePeCheckout.openPayPage(
        paymentResponse.redirect_url,
        async (response: string) => {
          await handlePaymentCallback(response, paymentResponse.merchant_order_id);
        }
      );

    } catch (error) {
      throw error;
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
        // Check payment status
        const statusResponse = await checkPaymentStatus(merchantOrderId, session!.access_token);
        
        if (statusResponse.status === 'COMPLETED') {
          toast({
            title: "Payment Successful!",
            description: `Your order has been placed. Order ID: ${statusResponse.merchant_order_id}`,
          });

          // Create the order data for the success callback
          const orderData = {
            ...currentOrder,
            ...statusResponse,
            dispensing_code: currentOrder?.dispensing_code || `CODE-${Date.now().toString().slice(-6)}`,
            items: cartItems
          };

          onPaymentSuccess(orderData);
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

  const handleOtherPaymentMethods = async () => {
    // Mock implementation for other payment methods
    let paymentSuccess = false;

    switch (paymentMethod) {
      case 'card':
        if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv || !cardDetails.name) {
          toast({
            title: "Invalid Card Details",
            description: "Please fill in all card details",
            variant: "destructive",
          });
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
        paymentSuccess = true;
        break;

      case 'upi':
        if (!upiId) {
          toast({
            title: "Invalid UPI ID",
            description: "Please enter a valid UPI ID",
            variant: "destructive",
          });
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
        paymentSuccess = true;
        break;

      case 'wallet':
        await new Promise(resolve => setTimeout(resolve, 1500));
        paymentSuccess = true;
        break;
    }

    if (paymentSuccess) {
      const orderData = await createOrder(`mock_${paymentMethod}_${Date.now()}`);
      
      toast({
        title: "Payment Successful!",
        description: `Your order has been placed. Dispensing code: ${orderData.dispensing_code}`,
      });

      onPaymentSuccess(orderData);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b z-10 p-4">
        <div className="container mx-auto max-w-md">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="font-bold text-lg">Payment</h1>
              <p className="text-sm text-muted-foreground">
                Complete your order for {machine.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-md p-4 space-y-6">
        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cartItems.map((item) => (
              <div key={`${item.product.id}-${item.slotNumber}`} className="flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Slot {item.slotNumber} × {item.quantity}
                  </p>
                </div>
                <p className="font-medium">₹{(item.product.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
            
            <Separator />
            
            <div className="flex justify-between items-center font-semibold">
              <span>Total ({getTotalItems()} items):</span>
              <span className="text-primary text-lg">₹{getTotalAmount().toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Method</CardTitle>
            <CardDescription>Choose your preferred payment option</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}
              className="space-y-4"
            >
              {/* PhonePe Payment */}
              <div className="flex items-center space-x-2 p-3 border rounded-lg bg-purple-50 border-purple-200">
                <RadioGroupItem value="phonepe" id="phonepe" />
                <Label htmlFor="phonepe" className="flex items-center gap-3 flex-1 cursor-pointer">
                  <div className="w-5 h-5 bg-purple-600 rounded flex items-center justify-center text-white text-xs font-bold">P</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">PhonePe</p>
                      {phonepeAvailable ? (
                        <Badge variant="secondary" className="text-xs">Recommended</Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">Unavailable</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">UPI, Cards, Net Banking & Wallets</p>
                  </div>
                </Label>
              </div>

              {/* Credit/Debit Card */}
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex items-center gap-3 flex-1 cursor-pointer">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">Credit/Debit Card</p>
                      <Badge variant="outline" className="text-xs">Mock</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Visa, Mastercard, Rupay</p>
                  </div>
                </Label>
              </div>

              {/* UPI */}
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="upi" id="upi" />
                <Label htmlFor="upi" className="flex items-center gap-3 flex-1 cursor-pointer">
                  <QrCode className="h-5 w-5 text-purple-600" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">UPI</p>
                      <Badge variant="outline" className="text-xs">Mock</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">PhonePe, GooglePay, Paytm</p>
                  </div>
                </Label>
              </div>

              {/* Digital Wallet */}
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="wallet" id="wallet" />
                <Label htmlFor="wallet" className="flex items-center gap-3 flex-1 cursor-pointer">
                  <Wallet className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">Digital Wallet</p>
                      <Badge variant="outline" className="text-xs">Mock</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Paytm, Amazon Pay</p>
                  </div>
                </Label>
              </div>


            </RadioGroup>
          </CardContent>
        </Card>

        {/* Payment Details Form */}
        {paymentMethod === 'card' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Card Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="card-number">Card Number</Label>
                <Input
                  id="card-number"
                  placeholder="1234 5678 9012 3456"
                  value={cardDetails.number}
                  onChange={(e) => setCardDetails(prev => ({ ...prev, number: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    value={cardDetails.expiry}
                    onChange={(e) => setCardDetails(prev => ({ ...prev, expiry: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    type="password"
                    value={cardDetails.cvv}
                    onChange={(e) => setCardDetails(prev => ({ ...prev, cvv: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardholder-name">Cardholder Name</Label>
                <Input
                  id="cardholder-name"
                  placeholder="John Doe"
                  value={cardDetails.name}
                  onChange={(e) => setCardDetails(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {paymentMethod === 'upi' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">UPI Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="upi-id">UPI ID</Label>
                <Input
                  id="upi-id"
                  placeholder="yourname@paytm"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        )}



        {/* Security Info */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Secure Payment</p>
                <p className="text-sm text-green-600">
                  Your payment information is encrypted and secure
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timer Warning */}
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Timer className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">Complete Payment Soon</p>
                <p className="text-sm text-orange-600">
                  Your cart will expire in 10 minutes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pay Button */}
        <Button
          onClick={processPayment}
          disabled={processing}
          size="lg"
          className="w-full"
        >
          {processing ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Processing Payment...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Pay ₹{getTotalAmount().toFixed(2)}
            </div>
          )}
        </Button>
      </div>
    </div>
  );
};

export default PaymentCheckout;
