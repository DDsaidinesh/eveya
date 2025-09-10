-- Add missing columns to existing orders table for PhonePe integration
DO $$
BEGIN
    -- Add merchant_order_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'merchant_order_id') THEN
        ALTER TABLE orders ADD COLUMN merchant_order_id TEXT UNIQUE;
    END IF;
    
    -- Add machine_code column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'machine_code') THEN
        ALTER TABLE orders ADD COLUMN machine_code TEXT;
    END IF;
    
    -- Add total_items column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'total_items') THEN
        ALTER TABLE orders ADD COLUMN total_items INTEGER DEFAULT 0;
    END IF;
    
    -- Add expires_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'expires_at') THEN
        ALTER TABLE orders ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create payment_tokens table for PhonePe OAuth tokens
CREATE TABLE IF NOT EXISTS payment_tokens (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    access_token TEXT NOT NULL,
    encrypted_access_token TEXT,
    token_type TEXT NOT NULL DEFAULT 'O-Bearer',
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    session_expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments table for PhonePe transactions
CREATE TABLE IF NOT EXISTS payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    phonepe_order_id TEXT,
    phonepe_transaction_id TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED')),
    payment_method TEXT,
    redirect_url TEXT,
    phonepe_response TEXT,
    error_message TEXT,
    utr TEXT,
    upi_transaction_id TEXT,
    vpa TEXT,
    masked_account_number TEXT,
    account_type TEXT,
    account_holder_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    paid_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_merchant_order_id ON orders(merchant_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_phonepe_order_id ON payments(phonepe_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payment_tokens_expires_at ON payment_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_payment_tokens_is_active ON payment_tokens(is_active);

-- Enable RLS on new tables
ALTER TABLE payment_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payments table
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = payments.order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage payments" ON payments
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Create RLS policies for payment_tokens table (service role only)
CREATE POLICY "Service role can manage payment tokens" ON payment_tokens
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Update trigger for payments table
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();






