import { useState } from 'react';
import { CreditCard, Zap, Check, DollarSign, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

const RfidSection = () => {
  const [cardNumber, setCardNumber] = useState('');
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cardInfo, setCardInfo] = useState<any>(null);

  const rechargeOptions = [100, 200, 500, 1000, 2000];

  const handleCardVerification = async () => {
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
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockCardInfo = {
        cardNumber,
        holderName: 'Sarah Johnson',
        balance: cardNumber.startsWith('1234') ? 500 : Math.floor(Math.random() * 1000) + 100,
        isActive: true,
        expiryDate: '12/2025'
      };
      
      setCardInfo(mockCardInfo);
      toast({
        title: "Card verified successfully",
        description: `Welcome back, ${mockCardInfo.holderName}!`,
      });
    } catch (error) {
      toast({
        title: "Verification failed",
        description: "Please check your card number and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecharge = async (amount: number) => {
    setIsLoading(true);
    try {
      // Mock payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newBalance = cardInfo.balance + amount;
      setCardInfo({ ...cardInfo, balance: newBalance });
      
      toast({
        title: "Recharge successful!",
        description: `₹${amount} has been added to your card. New balance: ₹${newBalance}`,
      });
    } catch (error) {
      toast({
        title: "Recharge failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="rfid" className="py-16 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-accent/20 text-accent border-accent/20">
            RFID Card
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Smart Card
            <span className="bg-gradient-primary bg-clip-text text-transparent"> Recharge System</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Recharge your RFID card and enjoy instant discounts on all purchases. 
            Fast, secure, and convenient payment solution.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Card Verification */}
            <Card className="bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Verify Your Card
                </CardTitle>
                <CardDescription>
                  Enter your RFID card number to check balance and recharge
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="card-number">RFID Card Number</Label>
                  <Input
                    id="card-number"
                    placeholder="Enter your card number"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                  />
                </div>
                
                <Button
                  onClick={handleCardVerification}
                  disabled={isLoading || !cardNumber.trim()}
                  className="w-full"
                  variant="premium"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Verify Card
                    </>
                  )}
                </Button>

                {cardInfo && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Check className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-800">Card Verified</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Holder:</span>
                        <span className="font-semibold">{cardInfo.holderName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Balance:</span>
                        <span className="font-semibold text-green-600">₹{cardInfo.balance}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recharge Options */}
            <Card className="bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Recharge
                </CardTitle>
                <CardDescription>
                  Choose an amount to add to your card balance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {rechargeOptions.map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      onClick={() => cardInfo ? handleRecharge(amount) : toast({
                        title: "Verify your card first",
                        description: "Please verify your card before recharging.",
                        variant: "destructive",
                      })}
                      disabled={!cardInfo || isLoading}
                      className="h-16 flex flex-col"
                    >
                      <DollarSign className="h-4 w-4 mb-1" />
                      <span className="font-semibold">₹{amount}</span>
                    </Button>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-amount">Custom Amount</Label>
                  <div className="flex gap-2">
                    <Input
                      id="custom-amount"
                      type="number"
                      placeholder="Enter amount"
                      value={rechargeAmount}
                      onChange={(e) => setRechargeAmount(e.target.value)}
                      min="50"
                      max="5000"
                    />
                    <Button
                      onClick={() => {
                        const amount = parseInt(rechargeAmount);
                        if (amount >= 50 && amount <= 5000) {
                          handleRecharge(amount);
                          setRechargeAmount('');
                        } else {
                          toast({
                            title: "Invalid amount",
                            description: "Amount must be between ₹50 and ₹5000.",
                            variant: "destructive",
                          });
                        }
                      }}
                      disabled={!cardInfo || !rechargeAmount || isLoading}
                      variant="premium"
                    >
                      Recharge
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Features */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Instant Discounts</h3>
              <p className="text-muted-foreground text-sm">
                Use your card balance for immediate discounts on purchases
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Secure Payments</h3>
              <p className="text-muted-foreground text-sm">
                All transactions are encrypted and secured for your safety
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">No Expiry</h3>
              <p className="text-muted-foreground text-sm">
                Your card balance never expires, use it anytime
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RfidSection;