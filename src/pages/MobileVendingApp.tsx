import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { VendingMachine } from '@/types/vending';
import { Navigate } from 'react-router-dom';
import QRScanner from '@/components/vending/QRScanner';
import MachineProductCatalog from '@/components/vending/MachineProductCatalog';
import PaymentCheckout from '@/components/vending/PaymentCheckout';
import DispensingCodeDisplay from '@/components/vending/DispensingCodeDisplay';
import OrderReview from '@/components/vending/OrderReview';

type FlowStep = 
  | 'scan_qr' 
  | 'select_products' 
  | 'checkout' 
  | 'dispensing' 
  | 'review';

interface VendingCartItem {
  product: any;
  quantity: number;
  slotNumber: string;
}

interface VendingOrderData {
  id: string;
  order_number: string;
  dispensing_code: string;
  dispensing_code_expires_at: string;
  status: string;
  total_amount: number;
  created_at: string;
  items?: VendingCartItem[];
}

const MobileVendingApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentStep, setCurrentStep] = useState<FlowStep>('scan_qr');
  const [selectedMachine, setSelectedMachine] = useState<VendingMachine | null>(null);
  const [cartItems, setCartItems] = useState<VendingCartItem[]>([]);
  const [orderData, setOrderData] = useState<VendingOrderData | null>(null);

  // Redirect to auth if not logged in
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleMachineSelected = (machine: VendingMachine) => {
    setSelectedMachine(machine);
    setCurrentStep('select_products');
  };

  const handleProceedToCheckout = (items: VendingCartItem[]) => {
    setCartItems(items);
    setCurrentStep('checkout');
  };

  const handlePaymentSuccess = (order: any) => {
    setOrderData({
      ...order,
      items: cartItems
    });
    setCurrentStep('dispensing');
  };

  const handleDispensingComplete = () => {
    setCurrentStep('review');
  };

  const handleReviewOrder = (order: VendingOrderData) => {
    setCurrentStep('review');
  };

  const handleFlowComplete = () => {
    // Reset the entire flow
    setCurrentStep('scan_qr');
    setSelectedMachine(null);
    setCartItems([]);
    setOrderData(null);
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'select_products':
        setCurrentStep('scan_qr');
        setSelectedMachine(null);
        break;
      case 'checkout':
        setCurrentStep('select_products');
        setCartItems([]);
        break;
      case 'dispensing':
        // Usually shouldn't allow going back from dispensing
        break;
      case 'review':
        setCurrentStep('dispensing');
        break;
    }
  };

  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'scan_qr':
        return (
          <QRScanner
            onMachineSelected={handleMachineSelected}
          />
        );

      case 'select_products':
        return selectedMachine ? (
          <MachineProductCatalog
            machine={selectedMachine}
            onBack={handleBack}
            onProceedToCheckout={handleProceedToCheckout}
          />
        ) : null;

      case 'checkout':
        return selectedMachine ? (
          <PaymentCheckout
            machine={selectedMachine}
            cartItems={cartItems}
            onBack={handleBack}
            onPaymentSuccess={handlePaymentSuccess}
          />
        ) : null;

      case 'dispensing':
        return selectedMachine && orderData ? (
          <DispensingCodeDisplay
            machine={selectedMachine}
            orderData={orderData}
            onComplete={handleDispensingComplete}
            onReviewOrder={handleReviewOrder}
          />
        ) : null;

      case 'review':
        return selectedMachine && orderData ? (
          <OrderReview
            machine={selectedMachine}
            orderData={orderData}
            onBack={() => setCurrentStep('dispensing')}
            onComplete={handleFlowComplete}
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderCurrentStep()}
    </div>
  );
};

export default MobileVendingApp;
