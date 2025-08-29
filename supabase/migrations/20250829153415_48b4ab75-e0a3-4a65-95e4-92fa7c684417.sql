-- Drop existing tables that are no longer needed
DROP TABLE IF EXISTS rfid_transactions CASCADE;
DROP TABLE IF EXISTS rfid_cards CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;

-- Clean up orders table first
ALTER TABLE orders DROP COLUMN IF EXISTS payment_status CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS delivery_address CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS order_items CASCADE;

-- Add missing columns to orders (skip machine_id if it exists)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'status') THEN
        ALTER TABLE orders ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'dispensed', 'completed', 'failed', 'cancelled'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_method') THEN
        ALTER TABLE orders ADD COLUMN payment_method TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_id') THEN
        ALTER TABLE orders ADD COLUMN payment_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'dispensing_code') THEN
        ALTER TABLE orders ADD COLUMN dispensing_code TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'dispensing_code_expires_at') THEN
        ALTER TABLE orders ADD COLUMN dispensing_code_expires_at TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'dispensed_at') THEN
        ALTER TABLE orders ADD COLUMN dispensed_at TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'updated_at') THEN
        ALTER TABLE orders ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
END $$;

-- Create vending_machines table
CREATE TABLE IF NOT EXISTS vending_machines (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    machine_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    qr_code TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'offline')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create machine_inventory table
CREATE TABLE IF NOT EXISTS machine_inventory (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    machine_id UUID NOT NULL REFERENCES vending_machines(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    slot_number TEXT NOT NULL,
    quantity_available INTEGER NOT NULL DEFAULT 0,
    max_capacity INTEGER NOT NULL DEFAULT 10,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(machine_id, slot_number)
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    slot_number TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    dispensed BOOLEAN DEFAULT false
);

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(id),
    machine_id UUID NOT NULL REFERENCES vending_machines(id),
    order_id UUID NOT NULL REFERENCES orders(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, order_id)
);

-- Enable RLS on all new tables
ALTER TABLE vending_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and create new ones
DROP POLICY IF EXISTS "Anyone can view vending machines" ON vending_machines;
CREATE POLICY "Anyone can view vending machines" ON vending_machines FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view products" ON products;
CREATE POLICY "Anyone can view products" ON products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view machine inventory" ON machine_inventory;
CREATE POLICY "Anyone can view machine inventory" ON machine_inventory FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;
CREATE POLICY "Users can view their own order items" ON order_items FOR SELECT USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert their own order items" ON order_items;
CREATE POLICY "Users can insert their own order items" ON order_items FOR INSERT WITH CHECK (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can manage their own sessions" ON user_sessions;
CREATE POLICY "Users can manage their own sessions" ON user_sessions FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own reviews" ON reviews;
CREATE POLICY "Users can insert their own reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
CREATE POLICY "Users can update their own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);

-- Add foreign key constraint to orders for machine_id if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_orders_machine_id') THEN
        ALTER TABLE orders ADD CONSTRAINT fk_orders_machine_id FOREIGN KEY (machine_id) REFERENCES vending_machines(id);
    END IF;
END $$;

-- Insert sample feminine hygiene products
INSERT INTO products (name, description, price, category, image_url) VALUES
('Ultra Thin Pads - Regular', 'Comfortable ultra-thin pads for regular flow', 45.00, 'pads', '/api/placeholder/300/300'),
('Ultra Thin Pads - Heavy', 'Maximum absorption for heavy flow days', 55.00, 'pads', '/api/placeholder/300/300'),
('Overnight Pads', 'Extra-long protection for overnight comfort', 65.00, 'pads', '/api/placeholder/300/300'),
('Tampons - Regular', 'Comfortable tampons for regular flow', 85.00, 'tampons', '/api/placeholder/300/300'),
('Tampons - Super', 'High absorption tampons for heavy flow', 95.00, 'tampons', '/api/placeholder/300/300'),
('Menstrual Cup', 'Eco-friendly reusable menstrual cup', 350.00, 'cups', '/api/placeholder/300/300'),
('Panty Liners', 'Daily freshness and light protection', 35.00, 'liners', '/api/placeholder/300/300'),
('Intimate Wash', 'pH balanced intimate hygiene wash', 180.00, 'hygiene', '/api/placeholder/300/300')
ON CONFLICT DO NOTHING;

-- Insert sample vending machines
INSERT INTO vending_machines (machine_code, name, location, latitude, longitude, qr_code) VALUES
('VM001', 'Central Mall - Ground Floor', 'Central Mall, Ground Floor, Near Food Court', 28.6139, 77.2090, 'QR_VM001_CENTRAL_MALL'),
('VM002', 'Metro Station - Platform 1', 'Rajiv Chowk Metro Station, Platform 1', 28.6328, 77.2197, 'QR_VM002_METRO_PLATFORM1'),
('VM003', 'University Campus - Library', 'Delhi University, Central Library Building', 28.6864, 77.2068, 'QR_VM003_DU_LIBRARY'),
('VM004', 'Hospital - Emergency Wing', 'AIIMS Hospital, Emergency Wing Lobby', 28.5672, 77.2100, 'QR_VM004_AIIMS_EMERGENCY'),
('VM005', 'Office Complex - Lobby', 'Cyber City Office Complex, Main Lobby', 28.4950, 77.0890, 'QR_VM005_CYBERCITY_LOBBY')
ON CONFLICT DO NOTHING;