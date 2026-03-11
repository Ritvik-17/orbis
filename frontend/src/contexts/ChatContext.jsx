import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    let newSocket;
    if (isAuthenticated) {
      newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:4000', {
        withCredentials: true,
      });

      newSocket.on('connect', () => {
        console.log('Socket.IO Connected:', newSocket.id);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket.IO Disconnected');
      });

      setSocket(newSocket);
    }

    return () => {
      if (newSocket) newSocket.close();
    };
  }, [isAuthenticated]);

  const joinConversation = (conversationId) => {
    if (socket) {
      socket.emit('conversation:join', conversationId);
    }
  };

  const leaveConversation = (conversationId) => {
    if (socket) {
      socket.emit('conversation:leave', conversationId);
    }
  };

  return (
    <ChatContext.Provider value={{ socket, joinConversation, leaveConversation }}>
      {children}
    </ChatContext.Provider>
  );
};
