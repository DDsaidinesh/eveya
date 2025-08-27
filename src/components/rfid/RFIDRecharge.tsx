import React, { useState } from 'react';
import { CreditCard, Loader2, AlertCircle, CheckCircle, DollarSign, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CardData {
  id: string;
  cardNumber: string;
  billId: string;
  balance: number;
  status: string;
}

const RFIDRecharge = () => {
  const [cardNumber, setCardNumber] = useState('');
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rechargeAmount, setRechargeAmount] = useState('');
  const { user } = useAuth();

  const fetchCardData = async () => {
    if (!cardNumber.trim()) {
      setError('Please enter a card number');
      toast({
        title: "Card Number Required",
        description: "Please enter a valid card number to continue.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError('');
    setCardData(null);

    try {
      const { data, error } = await supabase.functions.invoke('rfid-operations', {
        body: { cardNumber: cardNumber.trim() },
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (error) {
        throw error;
      }

      if (data.verified) {
        setCardData({
          id: data.card.id,
          cardNumber: data.card.cardNumber,
          billId: data.card.billId,
          balance: data.card.balance,
          status: data.card.status
        });
        setError('');
        toast({
          title: "Card Found",
          description: `Card verified successfully! Current balance: ₹${data.card.balance}`,
        });
      } else {
        setError(data.message || 'Card not found');
        setCardData(null);
        toast({
          title: "Card Not Found",
          description: data.message || 'Card not found in our records.',
          variant: "destructive",
        });
      }
    } catch (err: any) {
      setError('Failed to verify card. ' + (err?.message || ''));
      setCardData(null);
      toast({
        title: "Verification Error",
        description: (err?.message || 'Failed to verify card. Please try again.'),
        variant: "destructive",
      });
      console.error('Verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecharge = async () => {
    if (!cardData || !rechargeAmount || parseFloat(rechargeAmount) <= 0) {
      setError('Please enter a valid recharge amount');
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid recharge amount greater than 0.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(rechargeAmount);
    if (amount < 10) {
      setError('Minimum recharge amount is ₹10');
      toast({
        title: "Minimum Amount",
        description: "Minimum recharge amount is ₹10.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('rfid-operations', {
        body: { 
          cardId: cardData.id,
          amount: amount,
          paymentMethod: 'online',
          paymentReference: `TXN_${Date.now()}`
        },
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        // Update local card data
        setCardData(prev => prev ? ({
          ...prev,
          balance: data.transaction.balanceAfter
        }) : null);
        setRechargeAmount('');
        setError('');
        toast({
          title: "Recharge Successful",
          description: `Successfully recharged ₹${amount}! New balance: ₹${data.transaction.balanceAfter}`,
        });
      } else {
        throw new Error('Recharge failed');
      }
    } catch (err: any) {
      setError('Failed to process recharge. ' + (err?.message || ''));
      toast({
        title: "Processing Error",
        description: (err?.message || 'Failed to process recharge. Please try again.'),
        variant: "destructive",
      });
      console.error('Recharge error:', err);
    } finally {
      setLoading(false);
    }
  };

  const issueNewCard = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to issue a new RFID card.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('rfid-operations', {
        body: {},
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        toast({
          title: "Card Issued Successfully",
          description: `New RFID card issued with number: ${data.card.cardNumber}`,
        });
        setCardNumber(data.card.cardNumber);
        setCardData({
          id: data.card.id,
          cardNumber: data.card.cardNumber,
          billId: data.card.billId,
          balance: data.card.balance,
          status: data.card.status
        });
      } else {
        throw new Error('Failed to issue card');
      }
    } catch (err: any) {
      toast({
        title: "Issue Failed",
        description: (err?.message || 'Failed to issue new card. Please try again.'),
        variant: "destructive",
      });
      console.error('Issue error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      fetchCardData();
    }
  };

  const quickAmounts = [100, 200, 500, 1000, 2000];

  return (
    <section id="rfid" className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">RFID Card Management</h2>
            <p className="text-xl text-muted-foreground">
              Secure, real-time card verification and recharge system
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Card Verification Section */}
            <Card className="shadow-lg">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                  <CreditCard className="h-6 w-6 text-primary" />
                  Verify Card
                </CardTitle>
                <CardDescription>
                  Enter your RFID card number to verify and view details
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="cardNumber" className="text-sm font-medium">
                    RFID Card Number
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="cardNumber"
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Enter your card number"
                      className="flex-1"
                      disabled={loading}
                    />
                    <Button
                      onClick={fetchCardData}
                      disabled={loading || !cardNumber.trim()}
                      className="min-w-[100px]"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        'Verify'
                      )}
                    </Button>
                  </div>
                </div>

                {/* New Card Option */}
                <div className="text-center pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-3">
                    Don't have an RFID card yet?
                  </p>
                  <Button
                    onClick={issueNewCard}
                    disabled={loading || !user}
                    variant="outline"
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {!user ? 'Sign In to Issue New Card' : 'Issue New RFID Card'}
                  </Button>
                </div>

                {/* Error Message */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Card Details and Recharge Section */}
            <div className="space-y-6">
              {/* Card Data Display */}
              {cardData && (
                <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Card Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Card Number:</span>
                        <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                          {cardData.cardNumber}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Bill ID:</span>
                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                          {cardData.billId}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Current Balance:</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          ₹{cardData.balance.toFixed(2)}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Status:</span>
                        <Badge 
                          variant={cardData.status === 'active' ? 'default' : 'destructive'}
                        >
                          {cardData.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recharge Section */}
              {cardData && cardData.status === 'active' && (
                <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-green-800 dark:text-green-300">
                      <DollarSign className="h-5 w-5" />
                      Recharge Card
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-sm font-medium">
                        Recharge Amount (Minimum ₹10)
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        value={rechargeAmount}
                        onChange={(e) => setRechargeAmount(e.target.value)}
                        placeholder="Enter amount"
                        min="10"
                        step="10"
                        disabled={loading}
                      />
                    </div>
                    
                    {/* Quick Amount Buttons */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Quick Select</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {quickAmounts.map(amount => (
                          <Button
                            key={amount}
                            variant="outline"
                            size="sm"
                            onClick={() => setRechargeAmount(amount.toString())}
                            disabled={loading}
                            className="text-xs"
                          >
                            ₹{amount}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    <Button
                      onClick={handleRecharge}
                      disabled={loading || !rechargeAmount || parseFloat(rechargeAmount) < 10}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `Recharge ₹${rechargeAmount || '0'}`
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Features */}
              <Card className="bg-card/50">
                <CardContent className="pt-6">
                  <div className="text-sm">
                    <p className="font-medium mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Features
                    </p>
                    <div className="space-y-2 text-muted-foreground">
                      <p>• Instant balance updates</p>
                      <p>• Secure database storage</p>
                      <p>• Real-time transaction tracking</p>
                      <p>• Multi-user support</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RFIDRecharge;