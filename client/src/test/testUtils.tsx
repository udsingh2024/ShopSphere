import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import authReducer from '../store/authSlice';
import themeReducer from '../store/themeSlice';
import cartReducer from '../store/cartSlice';

export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState = {},
    store = configureStore({
      reducer: {
        auth: authReducer,
        theme: themeReducer,
        cart: cartReducer,
      },
      preloadedState,
    }),
    route = '/',
  } = {}
) {
  window.history.pushState({}, 'Test page', route);

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return {
    ...render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            {ui}
          </BrowserRouter>
        </QueryClientProvider>
      </Provider>
    ),
    store,
  };
}
