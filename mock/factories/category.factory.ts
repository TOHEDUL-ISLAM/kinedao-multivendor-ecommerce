import type { Category } from '@/types'

// ============================================
// Category Factory - Static Seed Data
// ============================================

// Extended interface for the AliExpress-style menu
export interface ExtendedCategory extends Category {
  recommended?: Array<{
    id: string
    name: string
    imageUrl: string
  }>
  sections?: Array<{
    title: string
    items: Array<{ id: string; name: string; slug: string }>
  }>
}

export const CATEGORIES: Array<ExtendedCategory> = [
  {
    id: 'electronics',
    name: 'Electronics',
    slug: 'electronics',
    icon: 'Smartphone',
    imageUrl:
      'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=200&h=200&fit=crop&auto=format',
    subcategories: [
      { id: 'mobile-phones', name: 'Mobile Phones', slug: 'mobile-phones' },
      { id: 'laptops', name: 'Laptops', slug: 'laptops' },
      { id: 'audio', name: 'Audio & Headphones', slug: 'audio' },
    ],
    // New Rich Data for Mega Menu
    recommended: [
      {
        id: 'iphone-15',
        name: 'New iPhone 15',
        imageUrl:
          'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=100&h=100&fit=crop',
      },
      {
        id: 'gaming-laptop',
        name: 'Gaming Laptops',
        imageUrl:
          'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=100&h=100&fit=crop',
      },
      {
        id: 'wireless-audio',
        name: 'Wireless Audio',
        imageUrl:
          'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=100&h=100&fit=crop',
      },
      {
        id: 'smart-watch',
        name: 'Smart Watches',
        imageUrl:
          'https://images.unsplash.com/photo-1544117519-31a4b71922bb?w=100&h=100&fit=crop',
      },
      {
        id: 'camera',
        name: 'Cameras',
        imageUrl:
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=100&h=100&fit=crop',
      },
      {
        id: 'vr-headset',
        name: 'VR Headsets',
        imageUrl:
          'https://images.unsplash.com/photo-1622979135225-d2ba269fb1bd?w=100&h=100&fit=crop', // Updated: Working VR headset image
      },
    ],
    sections: [
      {
        title: 'Mobile Phones',
        items: [
          { id: 'apple', name: 'Apple', slug: 'apple' },
          { id: 'samsung', name: 'Samsung', slug: 'samsung' },
          { id: 'xiaomi', name: 'Xiaomi', slug: 'xiaomi' },
          { id: 'realme', name: 'Realme', slug: 'realme' },
        ],
      },
      {
        title: 'Laptops & Computers',
        items: [
          { id: 'macbook', name: 'MacBook', slug: 'macbook' },
          { id: 'gaming', name: 'Gaming Laptops', slug: 'gaming-laptops' },
          { id: 'monitors', name: 'Monitors', slug: 'monitors' },
        ],
      },
    ],
  },
  {
    id: 'fashion',
    name: 'Fashion',
    slug: 'fashion',
    icon: 'Shirt',
    imageUrl:
      'https://images.unsplash.com/photo-1445205170230-053b83016050?w=200&h=200&fit=crop&auto=format',
    subcategories: [
      { id: 'mens', name: "Men's Fashion", slug: 'mens' },
      { id: 'womens', name: "Women's Fashion", slug: 'womens' },
    ],
    recommended: [
      {
        id: 'summer-coll',
        name: 'Summer Collection',
        imageUrl:
          'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=100&h=100&fit=crop',
      },
      {
        id: 'sneakers',
        name: 'Trending Sneakers',
        imageUrl:
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=100&fit=crop',
      },
      {
        id: 'watches',
        name: 'Luxury Watches',
        imageUrl:
          'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=100&h=100&fit=crop',
      },
      {
        id: 'handbags',
        name: 'Designer Bags',
        imageUrl:
          'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=100&h=100&fit=crop',
      },
      {
        id: 'sunglasses',
        name: 'Sunglasses',
        imageUrl:
          'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=100&h=100&fit=crop',
      },
    ],
    sections: [
      {
        title: "Women's Clothing",
        items: [
          { id: 'dresses', name: 'Dresses', slug: 'dresses' },
          { id: 'tops', name: 'Tops & Tees', slug: 'tops' },
          { id: 'sarees', name: 'Sarees', slug: 'sarees' },
          { id: 'salwar', name: 'Salwar Kameez', slug: 'salwar' },
        ],
      },
      {
        title: "Men's Clothing",
        items: [
          { id: 'shirts', name: 'Casual Shirts', slug: 'shirts' },
          { id: 't-shirts', name: 'T-Shirts', slug: 't-shirts' },
          { id: 'jeans', name: 'Jeans & Denim', slug: 'jeans' },
          { id: 'panjabi', name: 'Panjabi', slug: 'panjabi' },
        ],
      },
      {
        title: 'Accessories',
        items: [
          { id: 'watches', name: 'Watches', slug: 'watches' },
          { id: 'sunglasses', name: 'Sunglasses', slug: 'sunglasses' },
          { id: 'jewelry', name: 'Jewelry', slug: 'jewelry' },
        ],
      },
    ],
  },
  {
    id: 'home',
    name: 'Home & Living',
    slug: 'home-living',
    icon: 'Home',
    imageUrl:
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop&auto=format',
    subcategories: [],
    recommended: [
      {
        id: 'decor-new',
        name: 'Modern Decor',
        imageUrl:
          'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=100&h=100&fit=crop',
      },
      {
        id: 'kitchen-gadgets',
        name: 'Smart Kitchen',
        imageUrl:
          'https://images.unsplash.com/photo-1556910103-1c02745a30bf?w=100&h=100&fit=crop',
      },
      {
        id: 'bedding',
        name: 'Bedding Sets',
        imageUrl:
          'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=100&h=100&fit=crop',
      },
      {
        id: 'lighting',
        name: 'Lighting',
        imageUrl:
          'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=100&h=100&fit=crop', // Updated: Modern lamp
      },
      {
        id: 'plants',
        name: 'Indoor Plants',
        imageUrl:
          'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=100&h=100&fit=crop',
      },
    ],
    sections: [
      {
        title: 'Furniture',
        items: [
          { id: 'living-room', name: 'Living Room', slug: 'living-room' },
          { id: 'bedroom', name: 'Bedroom Furniture', slug: 'bedroom' },
          { id: 'office', name: 'Office Furniture', slug: 'office' },
        ],
      },
      {
        title: 'Kitchen & Dining',
        items: [
          { id: 'cookware', name: 'Cookware', slug: 'cookware' },
          { id: 'tableware', name: 'Tableware', slug: 'tableware' },
          { id: 'appliances', name: 'Small Appliances', slug: 'appliances' },
        ],
      },
    ],
  },
  {
    id: 'beauty',
    name: 'Beauty & Health',
    slug: 'beauty-health',
    icon: 'Sparkles',
    imageUrl:
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&h=200&fit=crop&auto=format',
    subcategories: [],
    recommended: [
      {
        id: 'k-beauty',
        name: 'K-Beauty',
        imageUrl:
          'https://images.unsplash.com/photo-1601049541289-9b3b7d8d7444?w=100&h=100&fit=crop', // Updated: Skincare bottles
      },
      {
        id: 'lipstick',
        name: 'Lipsticks',
        imageUrl:
          'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=100&h=100&fit=crop',
      },
      {
        id: 'perfume',
        name: 'Perfumes',
        imageUrl:
          'https://images.unsplash.com/photo-1541643600914-78b084683601?w=100&h=100&fit=crop',
      },
      {
        id: 'serums',
        name: 'Serums',
        imageUrl:
          'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=100&h=100&fit=crop',
      },
      {
        id: 'palettes',
        name: 'Makeup Sets',
        imageUrl:
          'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=100&h=100&fit=crop',
      },
    ],
    sections: [
      {
        title: 'Skincare',
        items: [
          { id: 'moisturizers', name: 'Moisturizers', slug: 'moisturizers' },
          { id: 'serums', name: 'Serums', slug: 'serums' },
          { id: 'sunscreens', name: 'Sunscreens', slug: 'sunscreens' },
        ],
      },
      {
        title: 'Makeup',
        items: [
          { id: 'lips', name: 'Lipstick', slug: 'lips' },
          { id: 'face', name: 'Foundation', slug: 'face' },
          { id: 'eyes', name: 'Eye Makeup', slug: 'eyes' },
        ],
      },
    ],
  },
  {
    id: 'books',
    name: 'Books & Stationery',
    slug: 'books-stationery',
    icon: 'BookOpen',
    imageUrl:
      'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=200&h=200&fit=crop&auto=format',
    subcategories: [],
    recommended: [
      {
        id: 'bestsellers',
        name: 'Best Sellers',
        imageUrl:
          'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=100&h=100&fit=crop',
      },
      {
        id: 'stationery',
        name: 'Stationery',
        imageUrl:
          'https://images.unsplash.com/photo-1542435503-956c469947f6?w=100&h=100&fit=crop',
      },
      {
        id: 'art-supplies',
        name: 'Art Supplies',
        imageUrl:
          'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=100&h=100&fit=crop',
      },
      {
        id: 'notebooks',
        name: 'Notebooks',
        imageUrl:
          'https://images.unsplash.com/photo-1544816155-12df9643f363?w=100&h=100&fit=crop', // Updated: Notebook flatlay
      },
      {
        id: 'ereaders',
        name: 'E-Readers',
        imageUrl:
          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&h=100&fit=crop',
      },
    ],
    sections: [
      {
        title: 'Books',
        items: [
          { id: 'fiction', name: 'Fiction', slug: 'fiction' },
          { id: 'academic', name: 'Academic', slug: 'academic' },
          { id: 'religious', name: 'Religious', slug: 'religious' },
        ],
      },
    ],
  },
  {
    id: 'sports',
    name: 'Sports & Outdoors',
    slug: 'sports-outdoors',
    icon: 'Dumbbell',
    imageUrl:
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&h=200&fit=crop&auto=format',
    subcategories: [],
    recommended: [
      {
        id: 'yoga',
        name: 'Yoga Mats',
        imageUrl:
          'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=100&h=100&fit=crop', // Updated: Yoga mat roll
      },
      {
        id: 'dumbbells',
        name: 'Weights',
        imageUrl:
          'https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=100&h=100&fit=crop',
      },
      {
        id: 'running',
        name: 'Running Shoes',
        imageUrl:
          'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=100&h=100&fit=crop',
      },
      {
        id: 'football',
        name: 'Football',
        imageUrl:
          'https://images.unsplash.com/photo-1614632537423-1e6c2e7e0aab?w=100&h=100&fit=crop',
      },
      {
        id: 'cricket',
        name: 'Cricket Gear',
        imageUrl:
          'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=100&h=100&fit=crop',
      },
    ],
    sections: [
      {
        title: 'Fitness',
        items: [
          { id: 'gym', name: 'Gym Equipment', slug: 'gym' },
          { id: 'yoga', name: 'Yoga', slug: 'yoga' },
        ],
      },
      {
        title: 'Team Sports',
        items: [
          { id: 'cricket', name: 'Cricket', slug: 'cricket' },
          { id: 'football', name: 'Football', slug: 'football' },
        ],
      },
    ],
  },
  {
    id: 'grocery',
    name: 'Grocery',
    slug: 'grocery',
    icon: 'ShoppingBasket',
    imageUrl:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&h=200&fit=crop&auto=format',
    subcategories: [],
    recommended: [
      {
        id: 'fresh-fruits',
        name: 'Fresh Fruits',
        imageUrl:
          'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=100&h=100&fit=crop',
      },
      {
        id: 'spices',
        name: 'Spices',
        imageUrl:
          'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=100&h=100&fit=crop',
      },
      {
        id: 'oils',
        name: 'Cooking Oils',
        imageUrl:
          'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=100&h=100&fit=crop', // Updated: Oil bottle
      },
      {
        id: 'snacks',
        name: 'Snacks',
        imageUrl:
          'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=100&h=100&fit=crop', // Updated: Chips bowl
      },
      {
        id: 'beverages',
        name: 'Beverages',
        imageUrl:
          'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=100&h=100&fit=crop',
      },
    ],
    sections: [
      {
        title: 'Cooking Essentials',
        items: [
          { id: 'rice', name: 'Rice', slug: 'rice' },
          { id: 'oil', name: 'Oil', slug: 'oil' },
          { id: 'spices', name: 'Spices', slug: 'spices' },
        ],
      },
    ],
  },
  {
    id: 'baby',
    name: 'Baby & Kids',
    slug: 'baby-kids',
    icon: 'Baby',
    imageUrl:
      'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=200&h=200&fit=crop&auto=format',
    subcategories: [],
    recommended: [
      {
        id: 'toys',
        name: 'Toys',
        imageUrl:
          'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=100&h=100&fit=crop',
      },
      {
        id: 'diapers',
        name: 'Diapers',
        imageUrl:
          'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=100&h=100&fit=crop',
      },
      {
        id: 'strollers',
        name: 'Strollers',
        imageUrl:
          'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=100&h=100&fit=crop',
      },
      {
        id: 'baby-clothes',
        name: 'Baby Clothes',
        imageUrl:
          'https://images.unsplash.com/photo-1522771753035-4a50354b6063?w=100&h=100&fit=crop',
      },
      {
        id: 'feeding',
        name: 'Feeding',
        imageUrl:
          'https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?w=100&h=100&fit=crop',
      },
    ],
    sections: [
      {
        title: 'Baby Care',
        items: [
          { id: 'diapers', name: 'Diapers', slug: 'diapers' },
          { id: 'food', name: 'Baby Food', slug: 'food' },
        ],
      },
    ],
  },
  {
    id: 'automotive',
    name: 'Automotive',
    slug: 'automotive',
    icon: 'Car',
    imageUrl:
      'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=200&h=200&fit=crop&auto=format',
    subcategories: [],
    recommended: [
      {
        id: 'car-accessories',
        name: 'Car Accessories',
        imageUrl:
          'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=100&h=100&fit=crop', // Updated: Car interior
      },
      {
        id: 'cleaning',
        name: 'Cleaning Kits',
        imageUrl:
          'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=100&h=100&fit=crop',
      },
      {
        id: 'helmets',
        name: 'Helmets',
        imageUrl:
          'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=100&h=100&fit=crop',
      },
      {
        id: 'tools',
        name: 'Tools',
        imageUrl:
          'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=100&h=100&fit=crop',
      },
      {
        id: 'tires',
        name: 'Tires',
        imageUrl:
          'https://images.unsplash.com/photo-1582235940562-5b9150cc392c?w=100&h=100&fit=crop', // Updated: Tires stack
      },
    ],
    sections: [
      {
        title: 'Car Care',
        items: [
          { id: 'cleaning', name: 'Cleaning Kits', slug: 'cleaning' },
          { id: 'accessories', name: 'Accessories', slug: 'accessories' },
        ],
      },
    ],
  },
  {
    id: 'digital',
    name: 'Digital Products',
    slug: 'digital-products',
    icon: 'Download',
    imageUrl:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=200&fit=crop&auto=format',
    subcategories: [],
    recommended: [
      {
        id: 'software',
        name: 'Software',
        imageUrl:
          'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=100&h=100&fit=crop',
      },
      {
        id: 'ebooks',
        name: 'E-Books',
        imageUrl:
          'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=100&h=100&fit=crop',
      },
      {
        id: 'gift-cards',
        name: 'Gift Cards',
        imageUrl:
          'https://images.unsplash.com/photo-1634731093238-6850d1e8338e?w=100&h=100&fit=crop', // Updated: Gift card abstract
      },
      {
        id: 'music',
        name: 'Music',
        imageUrl:
          'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=100&h=100&fit=crop',
      },
      {
        id: 'games',
        name: 'Game Keys',
        imageUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&h=100&fit=crop',
      },
    ],
    sections: [
      {
        title: 'Software',
        items: [
          { id: 'antivirus', name: 'Antivirus', slug: 'antivirus' },
          { id: 'productivity', name: 'Productivity', slug: 'productivity' },
        ],
      },
    ],
  },
]

export function getCategories(): Array<ExtendedCategory> {
  return CATEGORIES
}

export function getCategoryById(id: string): ExtendedCategory | undefined {
  return CATEGORIES.find((cat) => cat.id === id)
}

export function getCategoryBySlug(slug: string): ExtendedCategory | undefined {
  return CATEGORIES.find((cat) => cat.slug === slug)
}
