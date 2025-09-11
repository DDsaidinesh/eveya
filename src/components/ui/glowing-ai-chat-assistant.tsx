import React, { useState, useRef, useEffect } from 'react';
import { Send, Info, Bot, X, AlertCircle, LogIn, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chatApi, ChatApiError } from '@/services/chatApi';
import { sessionManager, SessionData } from '@/utils/sessionManager';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface ChatState {
  sessionId: string | null;
  isConnected: boolean;
  hasError: boolean;
  errorMessage: string;
}

// Custom link component for markdown
const MarkdownLink = ({ href, children }: { href?: string; children: React.ReactNode }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (href?.startsWith('/')) {
      // Internal navigation
      window.location.href = href;
    } else if (href?.startsWith('http')) {
      // External links
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <a 
      href={href} 
      onClick={handleClick}
      className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
      target={href?.startsWith('http') ? '_blank' : '_self'}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  );
};

// Custom markdown components
const markdownComponents = {
  a: MarkdownLink,
  h1: ({ children }: { children: React.ReactNode }) => (
    <h1 className="text-lg font-bold mb-2 text-foreground">{children}</h1>
  ),
  h2: ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-md font-semibold mb-2 text-foreground">{children}</h2>
  ),
  h3: ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-sm font-semibold mb-1 text-foreground">{children}</h3>
  ),
  p: ({ children }: { children: React.ReactNode }) => (
    <p className="mb-2 text-sm leading-relaxed">{children}</p>
  ),
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
  ),
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
  ),
  li: ({ children }: { children: React.ReactNode }) => (
    <li className="text-sm">{children}</li>
  ),
  strong: ({ children }: { children: React.ReactNode }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }: { children: React.ReactNode }) => (
    <em className="italic">{children}</em>
  ),
  code: ({ children }: { children: React.ReactNode }) => (
    <code className="bg-secondary px-1 py-0.5 rounded text-xs font-mono">{children}</code>
  ),
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote className="border-l-4 border-primary pl-3 py-1 bg-secondary/50 rounded-r mb-2">
      {children}
    </blockquote>
  ),
};

const FloatingAiAssistant = () => {
  const { user, session, loading } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [chatState, setChatState] = useState<ChatState>({
    sessionId: null,
    isConnected: false,
    hasError: false,
    errorMessage: ''
  });
  const maxChars = 2000;
  const chatRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Use authenticated user ID if available, otherwise fall back to session manager
  const userId = user?.id || sessionManager.getOrCreateUserId();
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat session when opened
  useEffect(() => {
    if (isChatOpen && !chatState.sessionId && messages.length === 0) {
      // Check if user is logged in
      if (!user && !loading) {
        // Require login - no API calls without authentication
        setShowLoginPrompt(true);
        const loginPromptMessage: Message = {
          id: '0',
          text: "## Welcome to Eveya! 🌸\n\nHello! I'm your **Eveya assistant**, here to help you discover our premium women's hygiene products.\n\n**Please log in to access:**\n- 🩸 Personalized product recommendations\n- 📍 Real-time vending machine inventory\n- 📦 Order tracking and history\n- 💳 RFID card benefits and savings\n\n*Secure conversations require authentication for your privacy and safety.*",
          isBot: true,
          timestamp: new Date()
        };
        setMessages([loginPromptMessage]);
      } else if (user) {
        // Only initialize if user is authenticated
        initializeChat();
      }
    }
  }, [isChatOpen, user, loading]);

  // Re-initialize chat when user logs in/out
  useEffect(() => {
    if (isChatOpen && chatState.sessionId) {
      // If user status changed, reinitialize with new user context
      const currentUserId = user?.id || sessionManager.getOrCreateUserId();
      if (currentUserId !== userId) {
        handleClearChat();
        setTimeout(() => initializeChat(), 100);
      }
    }
  }, [user?.id]);

  // Auto-retry connection if there's an error
  useEffect(() => {
    if (chatState.hasError && isChatOpen) {
      const retryTimer = setTimeout(() => {
        initializeChat();
      }, 5000); // Retry after 5 seconds
      
      return () => clearTimeout(retryTimer);
    }
  }, [chatState.hasError, isChatOpen]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    setCharCount(value.length);
  };

  // Handle login redirect
  const handleLoginRedirect = () => {
    setIsChatOpen(false);
    // Navigate to login page - you can customize this based on your routing
    window.location.href = '/auth';
  };

  // Handle guest continue - removed since we require login
  const handleContinueAsGuest = () => {
    // No longer allow guest access
    handleLoginRedirect();
  };

  // Initialize chat session
  const initializeChat = async () => {
    try {
      setChatState(prev => ({ ...prev, hasError: false, errorMessage: '' }));
      
      // Check for existing session first
      const existingSession = sessionManager.getCurrent();
      
      if (existingSession && existingSession.isValid) {
        // Restore existing session
        setChatState(prev => ({
          ...prev,
          sessionId: existingSession.sessionId,
          isConnected: true
        }));
        
        // Load chat history
        try {
          const history = await chatApi.getHistory(existingSession.sessionId);
          const historyMessages: Message[] = history.messages.map(msg => ({
            id: msg.id,
            text: msg.content,
            isBot: msg.role === 'assistant',
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(historyMessages);
        } catch (error) {
          console.warn('Failed to load chat history, starting fresh session');
          await startNewSession();
        }
      } else {
        // Start new session
        await startNewSession();
      }
    } catch (error) {
      handleChatError(error);
    }
  };

  // Start a new chat session
  const startNewSession = async () => {
    try {
      const currentUserId = user?.id || sessionManager.getOrCreateUserId();
      const response = await chatApi.startSession(currentUserId);
      
      setChatState({
        sessionId: response.session_id,
        isConnected: true,
        hasError: false,
        errorMessage: ''
      });
      
      // Create session data for local storage
      sessionManager.create(currentUserId);
      
      // Add welcome message with user-specific content
      const welcomeText = user 
        ? `Hello ${user.email?.split('@')[0]}! ${response.message}` 
        : response.message;
        
      const welcomeMessage: Message = {
        id: '1',
        text: welcomeText,
        isBot: true,
        timestamp: new Date(response.timestamp)
      };
      setMessages([welcomeMessage]);
      
    } catch (error) {
      handleChatError(error);
    }
  };

  // Handle chat errors
  const handleChatError = (error: any) => {
    console.error('Chat error:', error);
    
    let errorMessage = 'Unable to connect to chat service. Please try again.';
    
    if (error instanceof ChatApiError) {
      errorMessage = error.message;
      
      // If session expired, clear it
      if (error.statusCode === 404) {
        sessionManager.clear();
        setChatState(prev => ({ ...prev, sessionId: null }));
      }
    }
    
    setChatState(prev => ({
      ...prev,
      isConnected: false,
      hasError: true,
      errorMessage
    }));
    
    // Add error message to chat
    const errorMsg: Message = {
      id: Date.now().toString(),
      text: errorMessage,
      isBot: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, errorMsg]);
  };

  // Send message to AI
  const handleSend = async () => {
    if (!message.trim() || !chatState.sessionId || isTyping) {
      return;
    }

    const userMessageText = message.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      text: userMessageText,
      isBot: false,
      timestamp: new Date()
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setCharCount(0);
    setIsTyping(true);

    try {
      // Update session activity
      sessionManager.updateActivity(chatState.sessionId);
      
      // Send to API with current user ID
      const currentUserId = user?.id || sessionManager.getOrCreateUserId();
      const response = await chatApi.sendMessage(
        chatState.sessionId,
        userMessageText,
        currentUserId
      );

      // Add AI response
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response.response,
        isBot: true,
        timestamp: new Date(response.timestamp)
      };
      
      setMessages(prev => [...prev, botResponse]);
      
      // Clear any previous errors
      if (chatState.hasError) {
        setChatState(prev => ({ ...prev, hasError: false, errorMessage: '' }));
      }
      
    } catch (error) {
      handleChatError(error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isTyping) {
      e.preventDefault();
      handleSend();
    }
  };

  // Retry connection
  const handleRetry = () => {
    initializeChat();
  };

  // Clear chat and start fresh
  const handleClearChat = () => {
    sessionManager.clear();
    setMessages([]);
    setShowLoginPrompt(false);
    setChatState({
      sessionId: null,
      isConnected: false,
      hasError: false,
      errorMessage: ''
    });
    if (isChatOpen) {
      // Check if user is logged in for initialization
      if (!user && !loading) {
        setShowLoginPrompt(true);
        const loginPromptMessage: Message = {
          id: '0',
          text: "Hello! I'm your AI assistant. For the best experience and to access personalized features, please log in to your account. You can still chat with me as a guest with limited functionality.",
          isBot: true,
          timestamp: new Date()
        };
        setMessages([loginPromptMessage]);
      } else {
        initializeChat();
      }
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
                <div className={`w-2 h-2 rounded-full ${
                  chatState.hasError 
                    ? 'bg-red-500 animate-pulse' 
                    : chatState.isConnected 
                    ? 'bg-green-500 animate-pulse' 
                    : 'bg-yellow-500 animate-pulse'
                }`}></div>
                <span className="text-xs font-medium text-muted-foreground">Eeveya Labs Assistant</span>
                {user && (
                  <div className="flex items-center gap-1 ml-2">
                    <User className="w-3 h-3 text-primary" />
                    <span className="text-xs font-medium text-primary">
                      {user.email?.split('@')[0]}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs font-medium bg-secondary text-secondary-foreground rounded-2xl">
                  AI
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-2xl border ${
                  user 
                    ? 'bg-green-50 text-green-600 border-green-200'
                    : 'bg-blue-50 text-blue-600 border-blue-200'
                }`}>
                  {user ? 'Authenticated' : 'Guest'}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-2xl border ${
                  chatState.hasError
                    ? 'bg-red-50 text-red-600 border-red-200'
                    : chatState.isConnected
                    ? 'bg-green-50 text-green-600 border-green-200'
                    : 'bg-yellow-50 text-yellow-600 border-yellow-200'
                }`}>
                  {chatState.hasError ? 'Error' : chatState.isConnected ? 'Online' : 'Connecting...'}
                </span>
                {chatState.hasError && (
                  <button
                    onClick={handleRetry}
                    className="p-1.5 rounded-full hover:bg-secondary transition-colors"
                    title="Retry connection"
                  >
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  </button>
                )}
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
                    {msg.isBot ? (
                      <div className="text-sm">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={markdownComponents}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm">{msg.text}</p>
                    )}
                    <p className="text-xs opacity-70 mt-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              
              {/* Login Prompt */}
              {showLoginPrompt && !user && (
                <div className="flex justify-center">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-[90%]">
                    <div className="flex items-center gap-2 mb-3">
                      <LogIn className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Login Required</span>
                    </div>
                    <p className="text-sm text-blue-700 mb-3">
                      Please log in to access the AI assistant and enjoy personalized recommendations, order tracking, and secure conversations.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleLoginRedirect}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <LogIn className="w-4 h-4" />
                        Log In to Continue
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
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
                  disabled={showLoginPrompt}
                  className="w-full px-4 py-3 bg-transparent border-none outline-none resize-none text-sm font-normal leading-relaxed text-foreground placeholder-muted-foreground disabled:opacity-50"
                  placeholder={
                    showLoginPrompt 
                      ? "Please log in to start chatting..."
                      : user
                      ? "Ask about your orders, products, machines..."
                      : "Please log in to start chatting..."
                  }
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
                      disabled={!message.trim() || !chatState.isConnected || isTyping || showLoginPrompt}
                      className="group relative p-2.5 bg-primary border-none rounded-lg cursor-pointer transition-all duration-300 text-primary-foreground shadow-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={
                        showLoginPrompt 
                          ? 'Please log in to start chatting'
                          : !chatState.isConnected 
                          ? 'Connecting to chat service...' 
                          : 'Send message'
                      }
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        chatState.hasError 
                          ? 'bg-red-500' 
                          : chatState.isConnected 
                          ? 'bg-green-500' 
                          : 'bg-yellow-500'
                      }`}></div>
                      <span>
                        {chatState.hasError 
                          ? 'Connection Error' 
                          : chatState.isConnected 
                          ? 'Connected' 
                          : 'Connecting...'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        user ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span>{user ? 'Authenticated' : 'Login Required'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!user && !showLoginPrompt && (
                      <button
                        onClick={handleLoginRedirect}
                        className="text-xs text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                        title="Login required to chat"
                      >
                        <LogIn className="w-3 h-3" />
                        Login Required
                      </button>
                    )}
                    {chatState.sessionId && (
                      <button
                        onClick={handleClearChat}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        title="Start new conversation"
                      >
                        New Chat
                      </button>
                    )}
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