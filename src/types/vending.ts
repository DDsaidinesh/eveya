export interface VendingMachine {
  id: string;
  machine_code: string;
  name: string;
  location: string;
  latitude?: number;
  longitude?: number;
  qr_code?: string;
  status: string; // Changed from union type to string to match DB
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MachineInventory {
  id: string;
  machine_id: string;
  product_id: string;
  slot_number: string;
  quantity_available: number;
  max_capacity: number;
  updated_at: string;
  product?: Product;
}

export interface Order {
  id: string;
  order_number: string;
  user_id?: string;
  machine_id?: string;
  total_amount: number;
  status: string; // Changed from union type to string to match DB
  payment_method?: string;
  payment_id?: string;
  dispensing_code?: string;
  dispensing_code_expires_at?: string;
  dispensed_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  slot_number: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  dispensed: boolean;
  product?: Product;
}

export interface Review {
  id: string;
  user_id: string;
  machine_id: string;
  order_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}