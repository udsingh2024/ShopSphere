import { describe, test, expect, beforeEach } from 'vitest';
import cartReducer, {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  toggleCart,
  setCartOpen,
} from '../store/cartSlice';
import { Product } from '../types';

const mockProduct: Product = {
  _id: 'prod123',
  title: 'Luxury Leather Bag',
  slug: 'luxury-leather-bag',
  description: 'Handmade luxury leather bag.',
  price: 250,
  discountPrice: 220,
  inventory: 15,
  images: [{ url: 'http://img.jpg', publicId: 'img1' }],
  category: { _id: 'cat123', name: 'Accessories', slug: 'accessories' },
  tags: ['leather', 'bag'],
  ratings: { average: 4.8, count: 24 },
  visualEmbedding: [0.1, 0.2, 0.3],
  imageEmbeddings: [0.1, 0.2],
  aiDescription: 'AI index description.',
  dominantColors: ['#000000'],
  productTags: ['bag'],
  visualKeywords: ['bag'],
  imageHash: 'hash123',
  lastIndexed: new Date().toISOString(),
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('Cart Redux Slice', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('should return the initial state', () => {
    const state = cartReducer(undefined, { type: 'unknown' });
    expect(state.items).toEqual([]);
    expect(state.isCartOpen).toBe(false);
  });

  test('should handle addToCart', () => {
    let state = cartReducer(undefined, addToCart({ product: mockProduct, quantity: 2 }));
    expect(state.items).toHaveLength(1);
    expect(state.items[0].product._id).toBe('prod123');
    expect(state.items[0].quantity).toBe(2);

    // Adding same product again should increment quantity
    state = cartReducer(state, addToCart({ product: mockProduct, quantity: 1 }));
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(3);
  });

  test('should handle removeFromCart', () => {
    const initialState = {
      items: [{ product: mockProduct, quantity: 1 }],
      isCartOpen: false,
    };
    const state = cartReducer(initialState, removeFromCart('prod123'));
    expect(state.items).toHaveLength(0);
  });

  test('should handle updateQuantity', () => {
    const initialState = {
      items: [{ product: mockProduct, quantity: 1 }],
      isCartOpen: false,
    };
    const state = cartReducer(initialState, updateQuantity({ productId: 'prod123', quantity: 5 }));
    expect(state.items[0].quantity).toBe(5);
  });

  test('should handle clearCart', () => {
    const initialState = {
      items: [{ product: mockProduct, quantity: 1 }],
      isCartOpen: false,
    };
    const state = cartReducer(initialState, clearCart());
    expect(state.items).toHaveLength(0);
  });

  test('should handle toggleCart and setCartOpen', () => {
    let state = cartReducer(undefined, toggleCart());
    expect(state.isCartOpen).toBe(true);

    state = cartReducer(state, setCartOpen(false));
    expect(state.isCartOpen).toBe(false);
  });
});
