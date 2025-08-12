import React, { useState } from 'react';
import { CreditCard, Loader2, AlertCircle, CheckCircle, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface CardData {
  billId: string;
  cardHolderName: string;
  balance: number;
  status: string;
  lastUpdated: string;
}

const RFIDRecharge = () => {
  const [billId, setBillId] = useState('');
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rechargeAmount, setRechargeAmount] = useState('');
  
  // Google Apps Script Web App URL (v1 provided on 12 Aug 2025)
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby98GzhaEJJ02oHepm_B-zZyeesWhPWxFPFZApEaZtyT2Z466U-zOAvnVg01mywiCo/exec';
  // WhatsApp number in international format without '+' per wa.me requirement
  const WHATSAPP_NUMBER = '917013543557';

  const fetchCardData = async () => {
    if (!billId.trim()) {
      setError('Please enter a Bill ID');
      toast({
        title: "Bill ID Required",
        description: "Please enter a valid Bill ID to continue.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError('');
    setCardData(null);

    try {
      const url = `${GOOGLE_SCRIPT_URL}?action=getBillData&billId=${encodeURIComponent(billId.trim())}`;
      const response = await fetch(url, { cache: 'no-store', redirect: 'follow' });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server responded ${response.status}. ${text.slice(0, 200)}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Unexpected response from server. Expected JSON but got: ${text.slice(0, 200)}`);
      }

      const result = await response.json();

      if (result.success) {
        setCardData(result.data);
        setError('');
        toast({
          title: "Card Found",
          description: `Welcome back, ${result.data.cardHolderName}!`,
        });
      } else {
        setError(result.error || 'Bill ID not found');
        setCardData(null);
        toast({
          title: "Card Not Found",
          description: result.error || 'Bill ID not found in our records.',
          variant: "destructive",
        });
      }
    } catch (err: any) {
      setError('Failed to fetch data from Google Sheets. ' + (err?.message || ''));
      setCardData(null);
      toast({
        title: "Connection Error",
        description: (err?.message || 'Failed to fetch data. Please try again.'),
        variant: "destructive",
      });
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const redirectToWhatsApp = () => {
    if (!cardData) {
      toast({
        title: 'No card data',
        description: 'Please fetch a valid QR ID first.',
        variant: 'destructive',
      });
      return;
    }

    const message = `Hello, I want to pay now.\nQR ID: ${cardData.billId}\nName: ${cardData.cardHolderName}\nBalance: ₹${cardData.balance.toFixed(2)}\nStatus: ${cardData.status}`;
    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
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
      const newBalance = parseFloat(cardData.balance.toString()) + amount;
      const url = `${GOOGLE_SCRIPT_URL}?action=updateBalance&billId=${encodeURIComponent(billId)}&newBalance=${newBalance}`;
      const response = await fetch(url, { cache: 'no-store', redirect: 'follow' });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server responded ${response.status}. ${text.slice(0, 200)}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Unexpected response from server. Expected JSON but got: ${text.slice(0, 200)}`);
      }

      const result = await response.json();

      if (result.success) {
        // Update local card data
        setCardData(prev => prev ? ({
          ...prev,
          balance: newBalance,
          lastUpdated: new Date().toISOString().split('T')[0]
        }) : null);
        setRechargeAmount('');
        setError('');
        toast({
          title: "Recharge Successful",
          description: `Successfully recharged ₹${amount}! New balance: ₹${newBalance.toFixed(2)}`,
        });
      } else {
        setError(result.error || 'Failed to update balance');
        toast({
          title: "Recharge Failed",
          description: result.error || 'Failed to update balance. Please try again.',
          variant: "destructive",
        });
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      fetchCardData();
    }
  };

  const quickAmounts = [100, 200, 500, 1000, 2000];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="shadow-lg">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2 text-gray-800">
            <CreditCard className="h-6 w-6 text-blue-600" />
            RFID Card Recharge
          </CardTitle>
          <CardDescription>
            Recharge your RFID card with real-time Google Sheets integration
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Bill ID Input Section */}
          <div className="space-y-3">
            <Label htmlFor="billId" className="text-sm font-medium text-gray-700">
              Enter Bill ID / Card Number
            </Label>
            <div className="flex gap-2">
              <Input
                id="billId"
                type="text"
                value={billId}
                onChange={(e) => setBillId(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g. qr_NmwW1qnE2zq9HC"
                className="flex-1"
                disabled={loading}
              />
              <Button
                onClick={fetchCardData}
                disabled={loading || !billId.trim()}
                className="min-w-[100px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Fetch'
                )}
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Card Data Display */}
          {cardData && (
            <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Card Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Card Holder:</span>
                    <span className="font-medium text-sm">{cardData.cardHolderName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Bill ID:</span>
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                      {cardData.billId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Current Balance:</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      ₹{cardData.balance.toFixed(2)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Status:</span>
                    <Badge 
                      variant={cardData.status === 'active' ? 'default' : 'destructive'}
                      className={cardData.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {cardData.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between md:col-span-2">
                    <span className="text-gray-600 text-sm">Last Updated:</span>
                    <span className="text-sm text-gray-500">{cardData.lastUpdated}</span>
                  </div>
                </div>

                <Button onClick={redirectToWhatsApp} className="w-full mt-4" size="lg">
                  Pay Now on WhatsApp
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Recharge Section */}
          {cardData && cardData.status === 'active' && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                  <DollarSign className="h-5 w-5" />
                  Recharge Card
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
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
                  <Label className="text-sm font-medium text-gray-700">Quick Select</Label>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
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

          {/* Instructions */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">💡 <strong>Test Bill IDs:</strong></p>
                <div className="space-y-1 text-xs">
                  <p>• qr_NmwW1qnE2zq9HC</p>
                  <p>• qr_PELs4Qp9xBjOjw</p>
                  <p>• qr_NtdVoyPi7gLrCi</p>
                </div>
                <p className="text-xs mt-3 text-blue-600">
                  Replace GOOGLE_SCRIPT_URL with your actual Google Apps Script Web App URL
                </p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default RFIDRecharge;
