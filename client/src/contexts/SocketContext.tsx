import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppSelector } from '../store/store';
import { getAccessToken } from '../services/api';

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'https://shopsphere-1-9nmq.onrender.com';
    const newSocket = io(socketUrl, {
      withCredentials: true,
      autoConnect: false, // Let auth state control connection dynamically
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    if (isAuthenticated && user) {
      // Attach the dynamic access token on connection handshake
      socket.auth = { token: getAccessToken() };
      socket.connect();

      const handleConnect = () => {
        // Join user specific message channel
        socket.emit('join_room', { roomId: `user_${user.id}` });

        // If admin, subscribe to admin system alerts channel
        if (user.role === 'admin') {
          socket.emit('join_room', { roomId: 'admin_room' });
        }
      };

      socket.on('connect', handleConnect);

      if (socket.connected) {
        handleConnect();
      }

      return () => {
        socket.off('connect', handleConnect);
        socket.disconnect();
      };
    } else {
      socket.disconnect();
    }
  }, [socket, user, isAuthenticated]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
export default SocketContext;
