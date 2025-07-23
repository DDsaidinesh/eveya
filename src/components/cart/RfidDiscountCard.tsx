import { useState } from 'react';
import { CreditCard, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';

// Mock RFID API
const mockRfidAPI = {
  checkBalance: async (cardNumber: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock validation
    if (cardNumber.length < 8) {
      throw new Error('Invalid card number');
    }
    
    // Mock different card scenarios
    const balance = cardNumber.startsWith('1234') ? 500 : 
                   cardNumber.startsWith('5678') ? 150 : 
                   cardNumber.startsWith('9999') ? 0 : 
                   Math.floor(Math.random() * 1000) + 100;
    
    return {
      cardNumber,
      balance,
      holderName: 'Mock User',
      isActive: balance > 0
    };
  }
};

const RfidDiscountCard = () => {
  const { state, applyRfidDiscount, removeRfidDiscount } = useCart();
  const [cardNumber, setCardNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cardInfo, setCardInfo] = useState<any>(null);

  const handleVerifyCard = async () => {
    if (!cardNumber.trim()) {
      toast({
        title: "Card number required",
        description: "Please enter your RFID card number.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await mockRfidAPI.checkBalance(cardNumber);
      setCardInfo(result);
      
      if (result.balance >= state.total) {
        // Full discount
        applyRfidDiscount(cardNumber, state.total);
      } else if (result.balance > 0) {
        // Partial discount
        applyRfidDiscount(cardNumber, result.balance);
      } else {
        toast({
          title: "Insufficient balance",
          description: "Your RFID card has no balance available.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Card verification failed",
        description: error.message || "Please check your card number and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveDiscount = () => {
    removeRfidDiscount();
    setCardInfo(null);
    setCardNumber('');
  };

  if (state.rfidCardNumber) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <CardTitle className="text-sm text-green-800">RFID Discount Applied</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveDiscount}
              className="text-green-800 hover:text-green-900"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Card: ****{state.rfidCardNumber.slice(-4)}</span>
              <span className="font-semibold text-green-600">
                -₹{state.discountAmount}
              </span>
            </div>
            {cardInfo && (
              <div className="flex justify-between text-xs text-green-700">
                <span>Remaining balance:</span>
                <span>₹{cardInfo.balance - state.discountAmount}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <CreditCard className="h-4 w-4" />
          RFID Card Discount
        </CardTitle>
        <CardDescription className="text-xs">
          Use your RFID card balance to get instant discounts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="rfid-card" className="text-xs">RFID Card Number</Label>
          <Input
            id="rfid-card"
            placeholder="Enter your card number"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            className="text-sm"
          />
        </div>
        
        <Button
          onClick={handleVerifyCard}
          disabled={isLoading || !cardNumber.trim()}
          className="w-full"
          size="sm"
          variant="outline"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Apply Discount
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground">
          <p className="mb-1">Demo card numbers:</p>
          <p>• 1234xxxx (₹500 balance)</p>
          <p>• 5678xxxx (₹150 balance)</p>
          <p>• 9999xxxx (₹0 balance)</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RfidDiscountCard;