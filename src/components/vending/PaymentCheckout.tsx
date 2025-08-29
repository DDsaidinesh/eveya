import React, { useState } from 'react';
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
  Package
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { VendingMachine } from '@/types/vending';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

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

type PaymentMethod = 'card' | 'upi' | 'wallet';

const PaymentCheckout: React.FC<PaymentCheckoutProps> = ({
  machine,
  cartItems,
  onBack,
  onPaymentSuccess
}) => {
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [processing, setProcessing] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [upiId, setUpiId] = useState('');

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
      // Simulate payment processing based on method
      let paymentId = '';
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
          // Simulate card payment
          await new Promise(resolve => setTimeout(resolve, 2000));
          paymentId = `card_${Date.now()}`;
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
          // Simulate UPI payment
          await new Promise(resolve => setTimeout(resolve, 2000));
          paymentId = `upi_${Date.now()}`;
          paymentSuccess = true;
          break;

        case 'wallet':
          // Simulate wallet payment
          await new Promise(resolve => setTimeout(resolve, 1500));
          paymentId = `wallet_${Date.now()}`;
          paymentSuccess = true;
          break;
      }

      if (paymentSuccess) {
        const orderData = await createOrder(paymentId);
        
        toast({
          title: "Payment Successful!",
          description: `Your order has been placed. Dispensing code: ${orderData.dispensing_code}`,
        });

        onPaymentSuccess(orderData);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: "Please try again or use a different payment method",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
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
              {/* Credit/Debit Card */}
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex items-center gap-3 flex-1 cursor-pointer">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Credit/Debit Card</p>
                    <p className="text-sm text-muted-foreground">Visa, Mastercard, Rupay</p>
                  </div>
                </Label>
              </div>

              {/* UPI */}
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="upi" id="upi" />
                <Label htmlFor="upi" className="flex items-center gap-3 flex-1 cursor-pointer">
                  <QrCode className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium">UPI</p>
                    <p className="text-sm text-muted-foreground">PhonePe, GooglePay, Paytm</p>
                  </div>
                </Label>
              </div>

              {/* Digital Wallet */}
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="wallet" id="wallet" />
                <Label htmlFor="wallet" className="flex items-center gap-3 flex-1 cursor-pointer">
                  <Wallet className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Digital Wallet</p>
                    <p className="text-sm text-muted-foreground">Paytm, PhonePe Wallet</p>
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
