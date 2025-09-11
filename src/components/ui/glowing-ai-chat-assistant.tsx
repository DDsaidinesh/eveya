import React, { useState, useRef, useEffect } from 'react';
import { Send, Info, Bot, X } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

const FloatingAiAssistant = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const maxChars = 2000;
  const chatRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isChatOpen && messages.length === 0) {
      // Add welcome message when chat opens for the first time
      const welcomeMessage: Message = {
        id: '1',
        text: "Hello! I'm your Eeveya Labs assistant. I can help you with product information, vending machine locations, orders, and any questions about our health and wellness products. How can I assist you today?",
        isBot: true,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isChatOpen, messages.length]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    setCharCount(value.length);
  };

  const getBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Simple keyword-based responses for Eeveya Labs
    if (lowerMessage.includes('product') || lowerMessage.includes('what do you sell')) {
      return "We offer a range of health and wellness products including Active Flex joint supplements and Leaf Pads wellness products. You can browse all our products on the main page or visit any of our vending machines.";
    }
    
    if (lowerMessage.includes('machine') || lowerMessage.includes('location') || lowerMessage.includes('where')) {
      return "Our vending machines are located in various convenient locations. You can find the nearest machine by checking our vending machines section on the dashboard. Each machine shows its current status and available products.";
    }
    
    if (lowerMessage.includes('order') || lowerMessage.includes('purchase') || lowerMessage.includes('buy')) {
      return "You can purchase products directly from our vending machines using PhonePe payment. Simply select your products, proceed to checkout, and complete the payment. You'll receive a dispensing code to collect your items.";
    }
    
    if (lowerMessage.includes('payment') || lowerMessage.includes('phonepe')) {
      return "We accept payments through PhonePe for secure and convenient transactions. The payment process is quick and you'll receive instant confirmation with your dispensing code.";
    }
    
    if (lowerMessage.includes('active flex')) {
      return "Active Flex is our premium joint health supplement designed to support flexibility and mobility. It's available in our vending machines and comes with detailed usage instructions.";
    }
    
    if (lowerMessage.includes('leaf pads')) {
      return "Leaf Pads are our innovative wellness products that provide natural health benefits. They're available in our vending machines with various formulations to suit different needs.";
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      return "I'm here to help! You can ask me about our products, vending machine locations, how to make purchases, payment methods, or any other questions about Eeveya Labs. What would you like to know?";
    }
    
    // Default response
    return "Thank you for your question! I can help you with information about our products, vending machines, orders, and more. Could you please be more specific about what you'd like to know?";
  };

  const handleSend = () => {
    if (message.trim()) {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: message,
        isBot: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      setMessage('');
      setCharCount(0);
      setIsTyping(true);
      
      // Simulate bot typing delay
      setTimeout(() => {
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: getBotResponse(message),
          isBot: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botResponse]);
        setIsTyping(false);
      }, 1000 + Math.random() * 1000); // 1-2 second delay
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Close chat when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
        // Check if the click is not on the floating button
        if (!(event.target as Element)?.closest('.floating-ai-button')) {
          setIsChatOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating 3D Glowing AI Logo */}
      <button 
        className={`floating-ai-button relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 transform ${
          isChatOpen ? 'rotate-90' : 'rotate-0'
        }`}
        onClick={() => setIsChatOpen(!isChatOpen)}
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)',
          boxShadow: '0 0 20px hsl(var(--primary) / 0.7), 0 0 40px hsl(var(--primary) / 0.5), 0 0 60px hsl(var(--primary) / 0.3)',
          border: '2px solid hsl(var(--border))',
        }}
      >
        {/* 3D effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent opacity-30"></div>
        
        {/* Inner glow */}
        <div className="absolute inset-0 rounded-full border-2 border-white/10"></div>
        
        {/* AI Icon */}
        <div className="relative z-10">
          {isChatOpen ? <X className="w-8 h-8 text-primary-foreground" /> : <Bot className="w-8 h-8 text-primary-foreground" />}
        </div>
        
        {/* Glowing animation */}
        <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-primary"></div>
      </button>

      {/* Chat Interface */}
      {isChatOpen && (
        <div 
          ref={chatRef}
          className="absolute bottom-20 right-0 w-96 max-w-[calc(100vw-2rem)] transition-all duration-300 origin-bottom-right animate-scale-in md:w-[500px]"
        >
          <div className="relative flex flex-col rounded-3xl bg-card border border-border shadow-2xl backdrop-blur-3xl overflow-hidden max-h-[600px]">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-4 pb-2 border-b border-border">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-medium text-muted-foreground">Eeveya Labs Assistant</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs font-medium bg-secondary text-secondary-foreground rounded-2xl">
                  AI
                </span>
                <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary border border-primary/20 rounded-2xl">
                  Online
                </span>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="p-1.5 rounded-full hover:bg-secondary transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-80">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-lg ${
                      msg.isBot
                        ? 'bg-secondary text-secondary-foreground'
                        : 'bg-primary text-primary-foreground'
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Section */}
            <div className="border-t border-border">
              <div className="relative overflow-hidden">
                <textarea
                  value={message}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  className="w-full px-4 py-3 bg-transparent border-none outline-none resize-none text-sm font-normal leading-relaxed text-foreground placeholder-muted-foreground"
                  placeholder="Ask about products, machines, orders..."
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                />
              </div>

              {/* Controls Section */}
              <div className="px-4 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Character Counter */}
                    <div className="text-xs font-medium text-muted-foreground">
                      <span>{charCount}</span>/<span>{maxChars}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Send Button */}
                    <button 
                      onClick={handleSend}
                      disabled={!message.trim()}
                      className="group relative p-2.5 bg-primary border-none rounded-lg cursor-pointer transition-all duration-300 text-primary-foreground shadow-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="flex items-center justify-center mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>Online</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes scale-in {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        .animate-scale-in {
          animation: scale-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        
        .floating-ai-button:hover {
          transform: scale(1.1) rotate(5deg);
        }
      `}</style>
    </div>
  );
};

export { FloatingAiAssistant };