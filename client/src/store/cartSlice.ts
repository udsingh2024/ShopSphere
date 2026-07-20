import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product, CartItem } from '../types';

interface CartState {
  items: CartItem[];
  isCartOpen: boolean;
}

const loadCartFromStorage = (): CartItem[] => {
  try {
    const stored = localStorage.getItem('shopsphere_cart');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
};

const initialState: CartState = {
  items: loadCartFromStorage(),
  isCartOpen: false,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<{ product: Product; quantity: number }>) => {
      const { product, quantity } = action.payload;
      const existing = state.items.find((item) => item.product._id === product._id);

      if (existing) {
        existing.quantity += quantity;
      } else {
        state.items.push({ product, quantity });
      }

      localStorage.setItem('shopsphere_cart', JSON.stringify(state.items));
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.product._id !== action.payload);
      localStorage.setItem('shopsphere_cart', JSON.stringify(state.items));
    },
    updateQuantity: (state, action: PayloadAction<{ productId: string; quantity: number }>) => {
      const { productId, quantity } = action.payload;
      const existing = state.items.find((item) => item.product._id === productId);

      if (existing && quantity > 0) {
        existing.quantity = quantity;
      }

      localStorage.setItem('shopsphere_cart', JSON.stringify(state.items));
    },
    clearCart: (state) => {
      state.items = [];
      localStorage.removeItem('shopsphere_cart');
    },
    toggleCart: (state) => {
      state.isCartOpen = !state.isCartOpen;
    },
    setCartOpen: (state, action: PayloadAction<boolean>) => {
      state.isCartOpen = action.payload;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  toggleCart,
  setCartOpen,
} = cartSlice.actions;

export default cartSlice.reducer;
