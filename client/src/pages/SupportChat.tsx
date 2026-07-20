import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSocket } from '../contexts/SocketContext';
import { useAppSelector } from '../store/store';
import { ChatMessage as ChatMessageType } from '../types';
import api from '../services/api';
import { Send, User as UserIcon, ShieldAlert } from 'lucide-react';

const SupportChat: React.FC = () => {
  const socket = useSocket();
  const { user } = useAppSelector((state) => state.auth);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const roomId = `user_${user?.id}`;

  // Fetch past messages
  const { data: historicalMessages, isLoading } = useQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: async () => {
      const res = await api.get(`/support/messages/${roomId}`);
      return res.data.messages as ChatMessageType[];
    },
    enabled: !!user?.id,
  });

  // Sync historical messages to state
  useEffect(() => {
    if (historicalMessages) {
      setMessages(historicalMessages);
    }
  }, [historicalMessages]);

  // Setup Socket listeners for incoming messages
  useEffect(() => {
    if (!socket || !user?.id) return;

    socket.emit('join_room', { roomId });

    const handleNewMessage = (msg: ChatMessageType) => {
      if (msg.room === roomId) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on('receive_message', handleNewMessage);

    return () => {
      socket.off('receive_message', handleNewMessage);
    };
  }, [socket, user, roomId]);

  // Scroll to bottom on message update
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socket || !user?.id) return;

    socket.emit('send_message', {
      room: roomId,
      senderId: user.id,
      message: inputText.trim(),
    });

    setInputText('');
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 flex justify-center items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col h-[calc(100vh-10rem)] antialiased font-semibold">
      <div className="bg-card border border-border/40 rounded-3xl flex-1 flex flex-col overflow-hidden shadow-xs glassmorphism">
        {/* Header */}
        <div className="flex items-center justify-between bg-secondary/15 p-5 border-b border-border/40">
          <div className="flex items-center gap-3.5">
            <div className="h-9 w-9 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-xs select-none">
              SP
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-foreground uppercase tracking-wider">Support Desk</h2>
              <p className="text-[9px] text-muted-foreground font-semibold mt-0.5">Real-time Customer Agent Chat</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">Active Channels</span>
          </div>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-24 text-muted-foreground gap-3">
              <ShieldAlert className="h-8 w-8 text-foreground/80 stroke-[1.5]" />
              <div className="space-y-1">
                <p className="text-sm font-extrabold text-foreground uppercase tracking-wider">Start the conversation</p>
                <p className="text-xs font-medium">Submit a ticket or type your support query below.</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender?._id === user?.id;
              return (
                <div key={msg._id} className={`flex gap-3 max-w-[80%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                  {/* Sender Avatar */}
                  <div className="shrink-0 select-none">
                    {msg.sender?.avatarUrl ? (
                      <img src={msg.sender.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover border border-border/40" />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-secondary border border-border/60 text-[9px] flex items-center justify-center font-black">
                        {msg.sender?.name?.charAt(0).toUpperCase() || <UserIcon className="h-3.5 w-3.5" />}
                      </div>
                    )}
                  </div>

                  {/* Message Bubble */}
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
            })
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input area */}
        <form onSubmit={handleSendMessage} className="border-t border-border/40 p-4 flex gap-3 bg-secondary/15">
          <input
            type="text"
            placeholder="Type message here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 rounded-xl border border-border/60 bg-background/60 pl-4 pr-4 py-2.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 font-semibold"
          />
          <button
            type="submit"
            className="rounded-xl bg-foreground text-background p-3 hover:opacity-90 transition-all shadow-xs cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default SupportChat;
