import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Mic, HelpCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  links?: { label: string; url: string }[];
}

const FloatingAIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hi there! I'm your ShopSphere AI Assistant. I can recommend premium products, check order delivery statuses, or activate coupon code rewards. What are you looking for today?",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    if (!textToSend) setInputText('');

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Mock AI delay
    setTimeout(() => {
      let replyText = "I'm analyzing our product registry. You can browse our visual similarity search engine for instant image matching!";
      let links: { label: string; url: string }[] = [];

      const query = text.toLowerCase();
      if (query.includes('shoe') || query.includes('running') || query.includes('veloce')) {
        replyText = "I found the Veloce Running Shoes in our catalog! They feature mesh ventilation and carbon fiber heels.";
        links = [{ label: "View Veloce Running Shoes", url: "/product/60c72b2f9b1d8b2bad000021" }];
      } else if (query.includes('discount') || query.includes('coupon') || query.includes('promo')) {
        replyText = "Activate 10% off at checkout using coupon code: Sphere10! Simply enter it in your cart drawer.";
      } else if (query.includes('order') || query.includes('track') || query.includes('delivery')) {
        replyText = "To monitor shipping, navigate to your order history dashboard. Active orders display real-time timeline tracking.";
        links = [{ label: "Track My Orders", url: "/orders" }];
      } else if (query.includes('search') || query.includes('image') || query.includes('camera')) {
        replyText = "You can upload files directly to our computer vision engine to find lookalike products based on shape and color similarity!";
        links = [{ label: "AI Visual Search", url: "/visual-search" }];
      } else if (query.includes('hello') || query.includes('hi ')) {
        replyText = "Hello! Tell me what product characteristics or category departments you are looking for.";
      }

      const aiMsg: Message = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        links,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20 }}
            className="mb-4 w-[340px] sm:w-[380px] h-[480px] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col glassmorphism"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-violet-600 to-indigo-700 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-white/10 p-1.5">
                  <Sparkles className="h-5 w-5 text-yellow-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight">ShopSphere AI Assistant</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-semibold text-violet-100">Interactive Support Agent</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full hover:bg-white/10 p-1.5 transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 space-y-2 leading-relaxed shadow-sm ${
                      m.sender === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                        : 'bg-secondary/40 text-foreground border border-border rounded-tl-none'
                    }`}
                  >
                    <p>{m.text}</p>
                    {m.links && m.links.length > 0 && (
                      <div className="pt-1.5 space-y-1">
                        {m.links.map((link, idx) => (
                          <Link
                            key={idx}
                            to={link.url}
                            onClick={() => setIsOpen(false)}
                            className="block font-bold text-xs underline text-indigo-400 hover:text-indigo-300"
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-secondary/40 border border-border rounded-2xl rounded-tl-none px-4 py-3 flex gap-1 items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce delay-150" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce delay-300" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts */}
            <div className="px-4 py-2 border-t border-border bg-secondary/15 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
              <button
                onClick={() => handleSendMessage('Show me shoes')}
                className="rounded-full border border-border bg-card px-3 py-1 text-[10px] font-bold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Shoes
              </button>
              <button
                onClick={() => handleSendMessage('How to track delivery')}
                className="rounded-full border border-border bg-card px-3 py-1 text-[10px] font-bold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Track Shipping
              </button>
              <button
                onClick={() => handleSendMessage('Active discounts')}
                className="rounded-full border border-border bg-card px-3 py-1 text-[10px] font-bold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Discounts
              </button>
            </div>

            {/* Send Input */}
            <div className="p-3 border-t border-border bg-card flex gap-2 items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about orders, products, coupons..."
                className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              />
              <button
                onClick={() => handleSendMessage()}
                className="rounded-xl bg-primary p-2 text-primary-foreground hover:bg-primary/95 transition-all cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING ACTION TRIGGER */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-r from-violet-600 to-indigo-700 text-white shadow-xl shadow-indigo-500/30 cursor-pointer relative group border border-white/10"
      >
        <Sparkles className="h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
        <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-yellow-400 text-[8px] font-extrabold text-black uppercase animate-bounce">
          AI
        </span>
      </motion.button>
    </div>
  );
};

export default FloatingAIAssistant;
