-- Drop existing tables that are no longer needed
DROP TABLE IF EXISTS rfid_transactions CASCADE;
DROP TABLE IF EXISTS rfid_cards CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;

-- Update existing orders table to match vending machine schema
ALTER TABLE orders DROP COLUMN IF EXISTS payment_status CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS delivery_address CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS order_items CASCADE;

-- Add vending machine specific columns to orders
ALTER TABLE orders ADD COLUMN machine_id UUID;
ALTER TABLE orders ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'dispensed', 'completed', 'failed', 'cancelled'));
ALTER TABLE orders ADD COLUMN payment_method TEXT;
ALTER TABLE orders ADD COLUMN payment_id TEXT;
ALTER TABLE orders ADD COLUMN dispensing_code TEXT;
ALTER TABLE orders ADD COLUMN dispensing_code_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN dispensed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create vending_machines table
CREATE TABLE vending_machines (
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

-- Create products table (focusing on feminine hygiene products)
CREATE TABLE products (
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
CREATE TABLE machine_inventory (
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
CREATE TABLE order_items (
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
CREATE TABLE user_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reviews table
CREATE TABLE reviews (
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

-- Create RLS policies for vending_machines (public read, admin write)
CREATE POLICY "Anyone can view vending machines" ON vending_machines FOR SELECT USING (true);

-- Create RLS policies for products (public read)
CREATE POLICY "Anyone can view products" ON products FOR SELECT USING (true);

-- Create RLS policies for machine_inventory (public read)
CREATE POLICY "Anyone can view machine inventory" ON machine_inventory FOR SELECT USING (true);

-- Create RLS policies for order_items
CREATE POLICY "Users can view their own order items" ON order_items FOR SELECT USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
);

CREATE POLICY "Users can insert their own order items" ON order_items FOR INSERT WITH CHECK (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
);

-- Create RLS policies for user_sessions
CREATE POLICY "Users can manage their own sessions" ON user_sessions FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for reviews
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert their own reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);

-- Add foreign key constraint to orders for machine_id
ALTER TABLE orders ADD CONSTRAINT fk_orders_machine_id FOREIGN KEY (machine_id) REFERENCES vending_machines(id);

-- Create indexes for performance
CREATE INDEX idx_vending_machines_status ON vending_machines(status);
CREATE INDEX idx_vending_machines_location ON vending_machines(latitude, longitude);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_machine_inventory_machine_id ON machine_inventory(machine_id);
CREATE INDEX idx_machine_inventory_product_id ON machine_inventory(product_id);
CREATE INDEX idx_orders_machine_id ON orders(machine_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_dispensing_code ON orders(dispensing_code);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_reviews_machine_id ON reviews(machine_id);

-- Add triggers for updated_at columns
CREATE TRIGGER update_vending_machines_updated_at
    BEFORE UPDATE ON vending_machines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_machine_inventory_updated_at
    BEFORE UPDATE ON machine_inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample feminine hygiene products
INSERT INTO products (name, description, price, category, image_url) VALUES
('Ultra Thin Pads - Regular', 'Comfortable ultra-thin pads for regular flow', 45.00, 'pads', '/api/placeholder/300/300'),
('Ultra Thin Pads - Heavy', 'Maximum absorption for heavy flow days', 55.00, 'pads', '/api/placeholder/300/300'),
('Overnight Pads', 'Extra-long protection for overnight comfort', 65.00, 'pads', '/api/placeholder/300/300'),
('Tampons - Regular', 'Comfortable tampons for regular flow', 85.00, 'tampons', '/api/placeholder/300/300'),
('Tampons - Super', 'High absorption tampons for heavy flow', 95.00, 'tampons', '/api/placeholder/300/300'),
('Menstrual Cup', 'Eco-friendly reusable menstrual cup', 350.00, 'cups', '/api/placeholder/300/300'),
('Panty Liners', 'Daily freshness and light protection', 35.00, 'liners', '/api/placeholder/300/300'),
('Intimate Wash', 'pH balanced intimate hygiene wash', 180.00, 'hygiene', '/api/placeholder/300/300');

-- Insert sample vending machines
INSERT INTO vending_machines (machine_code, name, location, latitude, longitude, qr_code) VALUES
('VM001', 'Central Mall - Ground Floor', 'Central Mall, Ground Floor, Near Food Court', 28.6139, 77.2090, 'QR_VM001_CENTRAL_MALL'),
('VM002', 'Metro Station - Platform 1', 'Rajiv Chowk Metro Station, Platform 1', 28.6328, 77.2197, 'QR_VM002_METRO_PLATFORM1'),
('VM003', 'University Campus - Library', 'Delhi University, Central Library Building', 28.6864, 77.2068, 'QR_VM003_DU_LIBRARY'),
('VM004', 'Hospital - Emergency Wing', 'AIIMS Hospital, Emergency Wing Lobby', 28.5672, 77.2100, 'QR_VM004_AIIMS_EMERGENCY'),
('VM005', 'Office Complex - Lobby', 'Cyber City Office Complex, Main Lobby', 28.4950, 77.0890, 'QR_VM005_CYBERCITY_LOBBY');

-- Insert sample inventory for machines
INSERT INTO machine_inventory (machine_id, product_id, slot_number, quantity_available, max_capacity) 
SELECT 
    vm.id as machine_id,
    p.id as product_id,
    CASE 
        WHEN p.category = 'pads' THEN 'A' || (ROW_NUMBER() OVER (PARTITION BY vm.id, p.category ORDER BY p.name))
        WHEN p.category = 'tampons' THEN 'B' || (ROW_NUMBER() OVER (PARTITION BY vm.id, p.category ORDER BY p.name))
        WHEN p.category = 'cups' THEN 'C1'
        WHEN p.category = 'liners' THEN 'D1'
        WHEN p.category = 'hygiene' THEN 'E1'
        ELSE 'F1'
    END as slot_number,
    FLOOR(RANDOM() * 8) + 2 as quantity_available, -- Random quantity between 2-10
    10 as max_capacity
FROM vending_machines vm
CROSS JOIN products p
WHERE p.is_active = true;