import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../../contexts/SocketContext';
import { useAppSelector } from '../../store/store';
import { ChatMessage as ChatMessageType } from '../../types';
import api from '../../services/api';
import { Send, User as UserIcon, MessageSquare, ShieldAlert } from 'lucide-react';

interface Conversation {
  room: string;
  latestMessage: string;
  lastUpdatedAt: string;
  customer: {
    name: string;
    email: string;
    avatarUrl?: string;
  } | null;
}

const AdminSupportChat: React.FC = () => {
  const queryClient = useQueryClient();
  const socket = useSocket();
  const { user } = useAppSelector((state) => state.auth);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch all ongoing conversations
  const { data: conversationsData } = useQuery({
    queryKey: ['admin-conversations'],
    queryFn: async () => {
      const res = await api.get('/support/conversations');
      return res.data.conversations as Conversation[];
    },
  });

  const conversations = conversationsData || [];

  // Fetch messages for selected room
  const { data: historicalMessages, refetch: refetchMessages } = useQuery({
    queryKey: ['admin-room-messages', selectedRoom],
    queryFn: async () => {
      if (!selectedRoom) return [];
      const res = await api.get(`/support/messages/${selectedRoom}`);
      return res.data.messages as ChatMessageType[];
    },
    enabled: !!selectedRoom,
  });

  // Sync messages
  useEffect(() => {
    if (historicalMessages) {
      setMessages(historicalMessages);
    }
  }, [historicalMessages]);

  // Socket listener for new messages
  useEffect(() => {
    if (!socket) return;

    // Join admin broadcast room on load
    socket.emit('join_room', { roomId: 'admin_room' });

    const handleNewMessage = (msg: ChatMessageType) => {
      // If we are currently looking at this room, append message in real-time
      if (selectedRoom && msg.room === selectedRoom) {
        setMessages((prev) => [...prev, msg]);
      }
      // Re-query conversations sidebar list to show latest text snippet
      queryClient.invalidateQueries({ queryKey: ['admin-conversations'] });
    };

    const handleAdminNotification = ({ room }: { room: string; message: ChatMessageType }) => {
      // Invalidate conversation query to list new customer ticket
      queryClient.invalidateQueries({ queryKey: ['admin-conversations'] });
    };

    socket.on('receive_message', handleNewMessage);
    socket.on('receive_admin_notification', handleAdminNotification);

    return () => {
      socket.off('receive_message', handleNewMessage);
      socket.off('receive_admin_notification', handleAdminNotification);
    };
  }, [socket, selectedRoom, queryClient]);

  // Join selected room when selectedRoom changes
  useEffect(() => {
    if (socket && selectedRoom) {
      socket.emit('join_room', { roomId: selectedRoom });
    }
  }, [socket, selectedRoom]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socket || !selectedRoom || !user?.id) return;

    socket.emit('send_message', {
      room: selectedRoom,
      senderId: user.id,
      message: inputText.trim(),
    });

    setInputText('');
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] border border-border/40 rounded-3xl bg-card overflow-hidden shadow-xs text-xs antialiased font-semibold glassmorphism">
      {/* SIDEBAR - CONVERSATIONS LIST */}
      <div className="w-80 border-r border-border/40 flex flex-col bg-card">
        <div className="p-4 border-b border-border/40 bg-secondary/10 font-black flex items-center gap-2 uppercase tracking-wider text-foreground">
          <MessageSquare className="h-4 w-4 text-foreground/80" />
          <span>Active Assists ({conversations.length})</span>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-border/30 scrollbar-none">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground font-medium">No customer sessions logged.</div>
          ) : (
            conversations.map((conv) => {
              const isSelected = selectedRoom === conv.room;
              return (
                <button
                  key={conv.room}
                  onClick={() => setSelectedRoom(conv.room)}
                  className={`w-full flex items-start gap-3.5 p-4 text-left hover:bg-secondary/25 transition-all cursor-pointer ${
                    isSelected ? 'bg-secondary/40 border-l-2 border-foreground' : ''
                  }`}
                >
                  <div className="h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center font-bold shrink-0 shadow-2xs">
                    {conv.customer?.name.charAt(0).toUpperCase() || 'C'}
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-foreground truncate uppercase text-[10px]">
                        {conv.customer?.name || 'Customer'}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-[9px] truncate font-medium">{conv.customer?.email}</p>
                    <p className="text-foreground font-semibold text-[10px] truncate mt-1.5">{conv.latestMessage}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* CHAT DISPLAY PANEL */}
      <div className="flex-1 flex flex-col bg-secondary/5">
        {selectedRoom ? (
          <>
            {/* Messages box */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
              {messages.map((msg) => {
                const isMe = msg.sender?.role === 'admin';
                return (
                  <div key={msg._id} className={`flex gap-3 max-w-[80%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                    <div className="shrink-0 select-none">
                      <div className="h-7 w-7 rounded-full bg-secondary border border-border/40 text-[9px] flex items-center justify-center font-black">
                        {msg.sender?.name?.charAt(0).toUpperCase() || <UserIcon className="h-3.5 w-3.5" />}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className={`rounded-2xl px-4 py-2.5 text-xs font-semibold leading-relaxed border ${
                        isMe 
                          ? 'bg-foreground text-background border-foreground rounded-tr-none' 
                          : 'bg-card text-foreground border-border/60 rounded-tl-none shadow-2xs'
                      }`}>
                        <p>{msg.message}</p>
                      </div>
                      <p className={`text-[8px] text-muted-foreground/80 font-mono font-bold ${isMe ? 'text-right' : ''}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            {/* Input field */}
            <form onSubmit={handleSendMessage} className="border-t border-border/40 p-4 flex gap-3 bg-card">
              <input
                type="text"
                placeholder="Reply to customer..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 rounded-xl border border-border/60 bg-background/50 pl-4 pr-4 py-2.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 font-semibold"
              />
              <button
                type="submit"
                className="rounded-xl bg-foreground text-background px-4 py-2.5 font-bold hover:opacity-90 transition-all shadow-xs cursor-pointer text-xs flex items-center gap-1"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send</span>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground gap-4">
            <ShieldAlert className="h-9 w-9 text-foreground/80 animate-pulse stroke-[1.5]" />
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-foreground uppercase tracking-wider">No Chat Selected</h3>
              <p className="text-xs font-medium">Select a customer session from the list to begin live assistance.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSupportChat;
