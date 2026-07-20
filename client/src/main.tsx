import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import store from './store/store.ts';
import { SocketProvider } from './contexts/SocketContext.tsx';
import './index.css';

// Initialize React Query client with enterprise caching defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // Data stays fresh for 5 mins
      gcTime: 15 * 60 * 1000,   // Keep inactive queries in memory for 15 mins
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </SocketProvider>
      </QueryClientProvider>
    </Provider>
  </StrictMode>
);
