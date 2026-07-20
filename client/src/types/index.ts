export interface UserAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin' | 'seller';
  avatar?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  isVerified?: boolean;
  phone?: string;
  address?: UserAddress;
  createdAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  parentCategory?: string | Category | null;
}

export interface ProductImage {
  url: string;
  publicId: string;
}

export interface Product {
  _id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  discountPrice: number;
  inventory: number;
  images: ProductImage[];
  category: Category;
  tags: string[];
  ratings: {
    average: number;
    count: number;
  };
  isActive: boolean;
  similarityScore?: number; // visual search match strength
  visualEmbedding?: number[];
  imageEmbeddings?: number[];
  aiDescription?: string;
  dominantColors?: string[];
  productTags?: string[];
  visualKeywords?: string[];
  imageHash?: string;
  lastIndexed?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  product: Product;
  quantity: number;
  priceAtPurchase: number;
  _id: string;
}

export interface Order {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  } | string;
  items: OrderItem[];
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentInfo: {
    id: string;
    status: 'paid' | 'pending' | 'failed' | 'refunded';
    method: 'stripe' | 'paypal' | 'cod';
  };
  financials: {
    subtotal: number;
    shippingFee: number;
    tax: number;
    total: number;
  };
  orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  _id: string;
  room: string;
  sender: {
    _id: string;
    name: string;
    avatarUrl?: string;
    role: 'customer' | 'admin' | 'seller';
  };
  message: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
