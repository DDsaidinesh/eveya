export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  variants: {
    size: string;
    price: number;
    originalPrice?: number;
  }[];
  features: string[];
  image: string;
  isCombo?: boolean;
}

export const PRODUCTS: Product[] = [
  {
    id: 'leaf-pads',
    name: 'Eveya Leaf Pads',
    description: 'High Performance pads for regular usage with 4 wings design',
    category: 'Sanitary Pads',
    variants: [
      { size: '6 Pads', price: 120 },
      { size: '12 Pads', price: 220, originalPrice: 240 },
      { size: '20 Pads', price: 350, originalPrice: 400 },
      { size: '30 Pads', price: 500, originalPrice: 600 },
    ],
    features: [
      'Absorbency: 150-200ml',
      'Endurance: 8+ hours',
      'Breathable Multilayers with 4-wings design',
      'Free from Titanium Dioxide, Chlorine Bleach, Fragrances',
      'Super soft and ultra-light',
      'Ideal for everyday protection and heavy flow'
    ],
    image: new URL('../assets/leaf-pads.jpg', import.meta.url).href,
    isCombo: false
  },
  {
    id: 'active-flex',
    name: 'Eveya Active Flex Pads',
    description: 'Cramps reduction pads with graphene strip technology',
    category: 'Sanitary Pads',
    variants: [
      { size: '6 Pads', price: 130 },
      { size: '12 Pads', price: 240, originalPrice: 260 },
      { size: '20 Pads', price: 370, originalPrice: 420 },
      { size: '30 Pads', price: 520, originalPrice: 620 },
    ],
    features: [
      'Absorbency: 250ml',
      'Endurance: 10+ hours',
      'Reduces menstrual cramps and mood swings',
      'Graphene Strip technology',
      'Breathable Multilayers with 4-wing design',
      'Ideal for menstrual cramps and heavy flow'
    ],
    image: new URL('../assets/active-flex.jpg', import.meta.url).href,
    isCombo: false
  },
  {
    id: 'period-panties',
    name: 'Eveya Disposable Period Panties',
    description: 'All-in-one, 360° leak-proof protection for overnight and travel',
    category: 'Period Panties',
    variants: [
      { size: 'XL', price: 299 },
      { size: 'XXL', price: 299 },
    ],
    features: [
      'Absorbency: 500ml',
      'Endurance: 15+ hours',
      'Breathable Multilayers with 360-degree protection',
      'Chemical free with dual leak barriers protection',
      'Ideal for overnight, travel, and workplaces',
      'All-in-one secure protection through every move'
    ],
    image: new URL('../assets/leaf-pads.jpg', import.meta.url).href
  },
  {
    id: 'refill-pack',
    name: 'Eveya Refill Pack',
    description: 'Combination pack of Leaf and Active Flex pads',
    category: 'Combo Pack',
    variants: [
      { size: '40 Pads', price: 680, originalPrice: 800 },
    ],
    features: [
      '20x Leaf Pads + 20x Active Flex',
      'Best value for money',
      'Perfect for monthly needs',
      'Premium variety pack'
    ],
    image: new URL('../assets/active-flex.jpg', import.meta.url).href,
    isCombo: true
  }
];

export const getProductById = (id: string): Product | undefined => {
  return PRODUCTS.find(product => product.id === id);
};

export const getProductsByCategory = (category: string): Product[] => {
  return PRODUCTS.filter(product => product.category === category);
};