-- First check what tables exist and their structure
-- Then add the machine inventory data

-- Create machine_inventory if it doesn't exist
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

-- Create order_items if it doesn't exist  
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

-- Enable RLS on these tables
ALTER TABLE machine_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Drop and create policies for machine_inventory
DROP POLICY IF EXISTS "Anyone can view machine inventory" ON machine_inventory;
CREATE POLICY "Anyone can view machine inventory" ON machine_inventory FOR SELECT USING (true);

-- Drop and create policies for order_items
DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;
CREATE POLICY "Users can view their own order items" ON order_items FOR SELECT USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert their own order items" ON order_items;
CREATE POLICY "Users can insert their own order items" ON order_items FOR INSERT WITH CHECK (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
);

-- Populate machine inventory with feminine hygiene products
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
WHERE p.is_active = true
ON CONFLICT (machine_id, slot_number) DO NOTHING;