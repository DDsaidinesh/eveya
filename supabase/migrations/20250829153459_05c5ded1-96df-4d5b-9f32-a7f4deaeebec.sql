-- Create vending_machines table first
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

-- Enable RLS
ALTER TABLE vending_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view vending machines" ON vending_machines FOR SELECT USING (true);
CREATE POLICY "Anyone can view products" ON products FOR SELECT USING (true);

-- Insert sample data
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

INSERT INTO vending_machines (machine_code, name, location, latitude, longitude, qr_code) VALUES
('VM001', 'Central Mall - Ground Floor', 'Central Mall, Ground Floor, Near Food Court', 28.6139, 77.2090, 'QR_VM001_CENTRAL_MALL'),
('VM002', 'Metro Station - Platform 1', 'Rajiv Chowk Metro Station, Platform 1', 28.6328, 77.2197, 'QR_VM002_METRO_PLATFORM1'),
('VM003', 'University Campus - Library', 'Delhi University, Central Library Building', 28.6864, 77.2068, 'QR_VM003_DU_LIBRARY'),
('VM004', 'Hospital - Emergency Wing', 'AIIMS Hospital, Emergency Wing Lobby', 28.5672, 77.2100, 'QR_VM004_AIIMS_EMERGENCY'),
('VM005', 'Office Complex - Lobby', 'Cyber City Office Complex, Main Lobby', 28.4950, 77.0890, 'QR_VM005_CYBERCITY_LOBBY')
ON CONFLICT DO NOTHING;