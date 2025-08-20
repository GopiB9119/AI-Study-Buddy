import { useState, useEffect, useRef } from 'react';
import { Message } from '../types/message';
import { askAI } from '../services/api';

interface AILogoProps {
  isTyping?: boolean;
  size?: number;
  className?: string;
}

function AILogo({ isTyping = false, size = 24, className = '' }: AILogoProps) {
  const [eyeHeight, setEyeHeight] = useState(6);
  const [glowIntensity, setGlowIntensity] = useState(0.3);

  useEffect(() => {
    if (isTyping) {
      // More frequent blinking when typing
      const blinkInterval = setInterval(() => {
        setEyeHeight(1);
        setTimeout(() => setEyeHeight(6), 150);
      }, 1500);
      
      // Glow animation when typing
      const glowInterval = setInterval(() => {
        setGlowIntensity(prev => prev === 0.3 ? 0.7 : 0.3);
      }, 500);

      return () => {
        clearInterval(blinkInterval);
        clearInterval(glowInterval);
      };
    } else {
      // Normal blinking
      const blinkInterval = setInterval(() => {
        setEyeHeight(1);
        setTimeout(() => setEyeHeight(6), 150);
      }, 4000);
      return () => clearInterval(blinkInterval);
    }
  }, [isTyping]);

  return (
    <div className={`relative ${className}`} style={{ filter: `drop-shadow(0 0 10px rgba(168, 209, 63, ${glowIntensity}))` }}>
      <svg width={size} height={size} viewBox="0 0 56 56" fill="none" className="transition-all duration-300">
        <defs>
          <radialGradient id="bgGradient" cx="0.5" cy="0.5" r="0.8">
            <stop offset="20%" stopColor="#000000" />
            <stop offset="100%" stopColor="#1a1a1a" />
          </radialGradient>
          <radialGradient id="eyeGradient" cx="0.5" cy="0.5" r="0.7">
            <stop offset="0%" stopColor="#a8d13f" />
            <stop offset="100%" stopColor="#548500" />
          </radialGradient>
          <radialGradient id="whiteHighlight" cx="0.5" cy="0.5" r="0.6">
            <stop offset="30%" stopColor="white" stopOpacity="0.8" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="28" cy="28" r="28" fill="url(#bgGradient)" />
        
        <path
          d="M16 36V24.5C16 21.4624 18.4624 19 21.5 19H34.5C37.5376 19 40 21.4624 40 24.5V36"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <rect
          x="21"
          y={31 + (6 - eyeHeight)}
          width="4"
          height={eyeHeight}
          rx="1.5"
          fill="url(#eyeGradient)"
          stroke="white"
          strokeWidth="0.7"
        />
        <rect
          x="31"
          y={31 + (6 - eyeHeight)}
          width="4"
          height={eyeHeight}
          rx="1.5"
          fill="url(#eyeGradient)"
          stroke="white"
          strokeWidth="0.7"
        />

        <ellipse
          cx="23"
          cy={31 + (6 - eyeHeight) + 1.5}
          rx="1.2"
          ry="1"
          fill="url(#whiteHighlight)"
          pointerEvents="none"
        />
        <ellipse
          cx="33"
          cy={31 + (6 - eyeHeight) + 1.5}
          rx="1.2"
          ry="1"
          fill="url(#whiteHighlight)"
          pointerEvents="none"
        />
      </svg>
    </div>
  );
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I\'m your advanced AI study companion with neural learning capabilities. I\'m here to accelerate your learning journey! 🚀',
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [messageCount, setMessageCount] = useState(1);
  const [aiMood, setAiMood] = useState('😊');

  const quickActions = [
    { icon: "🧠", text: "Explain quantum concepts", category: "advanced" },
    { icon: "💡", text: "Generate creative study methods", category: "innovation" },
    { icon: "🎯", text: "Create personalized learning path", category: "planning" },
    { icon: "🔬", text: "Deep dive into complex topics", category: "analysis" },
    { icon: "🏆", text: "Challenge me with expert questions", category: "challenge" },
    { icon: "�", text: "Analyze my learning patterns", category: "analytics" }
  ];

  const aiMoods = ['😊', '🤗', '💭', '🎓', '⚡', '🌟', '🚀', '💡'];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingText]);

  useEffect(() => {
    // Change AI mood periodically
    const moodInterval = setInterval(() => {
      setAiMood(aiMoods[Math.floor(Math.random() * aiMoods.length)]);
    }, 5000);
    return () => clearInterval(moodInterval);
  }, []);

  const typeMessage = (text: string, callback?: () => void) => {
    setIsTyping(true);
    setTypingText('');
    let index = 0;
    
    const typeInterval = setInterval(() => {
      if (index < text.length) {
        setTypingText(prev => prev + text[index]);
        index++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);
        setTypingText('');
        callback?.();
      }
    }, 15);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setShowQuickActions(false);
    setMessageCount(prev => prev + 1);

    try {
      const response = await askAI(input.trim());
      
      typeMessage(response, () => {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response,
        };
        setMessages(prev => [...prev, aiMessage]);
        setLoading(false);
        setMessageCount(prev => prev + 1);
      });
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered a neural network disruption. Please try reconnecting! �',
      };
      setMessages(prev => [...prev, errorMessage]);
      setLoading(false);
      setIsTyping(false);
      setTypingText('');
    }
  };

  const handleQuickAction = (action: { icon: string; text: string; category: string }) => {
    setInput(action.text);
    setShowQuickActions(false);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Neural pathways reset! I\'m ready for a fresh learning session. What shall we explore today? 🧠✨',
      }
    ]);
    setShowQuickActions(true);
    setMessageCount(1);
  };

  const exportChat = () => {
    const chatData = {
      timestamp: new Date().toISOString(),
      messageCount: messageCount,
      messages: messages
    };
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-session-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen bg-neural-network text-white overflow-hidden">
      {/* Professional Header */}
      <div className="professional-card m-4 mb-0 border-cyan-500/20">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-4">
            <AILogo isTyping={isTyping} size={48} className="animate-float" />
            <div>
              <h1 className="text-2xl font-bold text-gradient-primary">Neural Study Companion</h1>
              <div className="flex items-center space-x-3 mt-1">
                <span className={`text-lg transition-all duration-500 ${isTyping ? 'animate-pulse' : ''}`}>
                  {isTyping ? '🧠' : aiMood}
                </span>
                <span className="text-sm text-cyan-300">
                  {isTyping ? 'Processing neural patterns...' : 'Advanced AI • Ready for deep learning'}
                </span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400">Online</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-center">
              <div className="text-lg font-bold text-cyan-400">{messageCount}</div>
              <div className="text-xs text-slate-400">Messages</div>
            </div>
            <button
              onClick={exportChat}
              className="p-3 hover:bg-white/10 rounded-xl transition-all duration-300 hover-lift"
              title="Export Chat"
            >
              <span className="text-xl">💾</span>
            </button>
            <button
              onClick={clearChat}
              className="p-3 hover:bg-white/10 rounded-xl transition-all duration-300 hover-lift"
              title="Reset Neural Network"
            >
              <span className="text-xl">�</span>
            </button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 pt-2 space-y-6">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div
              className={`max-w-[85%] p-6 rounded-3xl transition-all duration-300 hover-lift ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-xl shadow-cyan-500/25'
                  : 'professional-card text-white'
              }`}
            >
              <div className="flex items-start space-x-4">
                {message.role === 'assistant' && (
                  <AILogo size={32} className="flex-shrink-0 mt-1" />
                )}
                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-sm font-bold">👤</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="whitespace-pre-wrap leading-relaxed text-sm lg:text-base">
                    {message.content}
                  </p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                    <span className="text-xs text-white/60">
                      {new Date().toLocaleTimeString()}
                    </span>
                    {message.role === 'assistant' && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-green-400">Neural Network</span>
                        <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Enhanced Typing Animation */}
        {isTyping && (
          <div className="flex justify-start animate-fade-in-up">
            <div className="max-w-[85%] professional-card p-6 text-white">
              <div className="flex items-start space-x-4">
                <AILogo isTyping={true} size={32} className="flex-shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <p className="whitespace-pre-wrap leading-relaxed text-sm lg:text-base">
                    {typingText}
                    <span className="animate-pulse text-cyan-400">▌</span>
                  </p>
                  <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-white/10">
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse"></div>
                      <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse animation-delay-1000"></div>
                      <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse animation-delay-2000"></div>
                    </div>
                    <span className="text-xs text-cyan-400">Neural processing...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Loading */}
        {loading && !isTyping && (
          <div className="flex justify-start animate-fade-in-up">
            <div className="professional-card p-6 text-white">
              <div className="flex items-center space-x-4">
                <AILogo isTyping={true} size={32} />
                <div className="flex flex-col space-y-2">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce animation-delay-1000"></div>
                    <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce animation-delay-2000"></div>
                  </div>
                  <span className="text-sm text-cyan-300">Connecting to neural networks...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Quick Actions */}
      {showQuickActions && messages.length === 1 && (
        <div className="professional-card m-4 mt-0 border-purple-500/20">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gradient-primary mb-4">Neural Learning Pathways</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action)}
                  className="group p-4 text-left glass-morphism hover:bg-white/10 rounded-2xl border border-white/10 transition-all duration-300 hover-lift"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl group-hover:scale-110 transition-transform">{action.icon}</span>
                    <div>
                      <p className="text-white font-medium">{action.text}</p>
                      <p className="text-xs text-slate-400 capitalize">{action.category}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Professional Input Area */}
      <div className="professional-card m-4 mt-0 border-cyan-500/20">
        <div className="p-6">
          <div className="flex items-end space-x-4">
            <div className="flex-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Engage neural interface... Ask me anything about advanced learning concepts"
                className="w-full p-4 bg-white/5 border-2 border-white/10 rounded-2xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/25 transition-all resize-none text-white placeholder-slate-400"
                rows={Math.min(input.split('\n').length || 1, 4)}
                disabled={loading}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="p-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-cyan-500/25 transition-all transform hover:scale-105 focus-ring"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
              ) : (
                <span className="text-xl">🚀</span>
              )}
            </button>
          </div>
          
          <div className="flex items-center justify-between mt-4 text-xs text-slate-400">
            <div className="flex items-center space-x-4">
              <span>⚡ Powered by Advanced Neural Networks</span>
              <span>• Press Enter to transmit</span>
            </div>
            <span className={`${input.length > 1800 ? 'text-orange-400' : ''}`}>
              {input.length}/2000
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
