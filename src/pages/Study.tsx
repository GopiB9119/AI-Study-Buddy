import { useState, useEffect } from 'react';
import Chat from '../components/Chat';
import Flashcards from '../components/Flashcards';
import AdvancedFlashcards from '../components/AdvancedFlashcards';
import Quiz from '../components/Quiz';
import Dashboard from '../components/Dashboard';
import Interview from '../pages/Interview';
import { ThemeProvider, useTheme, getThemeClasses } from '../contexts/ThemeContext';

type Tab = 'dashboard' | 'chat' | 'flashcards' | 'advanced-flashcards' | 'quiz' | 'interview' | 'analytics';

interface AILogoProps {
  isActive?: boolean;
  size?: number;
  showEmotions?: boolean;
  className?: string;
}

function AILogo({ isActive = false, size = 24, showEmotions = false, className = '' }: AILogoProps) {
  const [logoAnimClass, setLogoAnimClass] = useState('');
  const [eyeHeight, setEyeHeight] = useState(6);
  const [showBubble, setShowBubble] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const { actualTheme } = useTheme();
  
  const emotionalMessages = [
    "🤖 I'm here to accelerate your learning!",
    "✨ Ready to unlock your potential?",
    "🎯 Let's achieve mastery together!",
    "🚀 Your neural pathways are expanding!",
    "💡 Curiosity is your superpower!",
    "🌟 Every challenge makes you stronger!",
    "🔥 You're in the learning zone!",
    "🎉 Knowledge is your ultimate tool!"
  ];

  const handleLogoClick = () => {
    setLogoAnimClass('animate-bounce');
    setTimeout(() => setLogoAnimClass(''), 1000);
    
    if (showEmotions) {
      setShowBubble(true);
      setTypedText('');
      const message = emotionalMessages[currentMessageIndex];
      
      let i = 0;
      const typeInterval = setInterval(() => {
        if (i < message.length) {
          setTypedText(message.substring(0, i + 1));
          i++;
        } else {
          clearInterval(typeInterval);
          setTimeout(() => {
            setShowBubble(false);
            setCurrentMessageIndex((prev) => (prev + 1) % emotionalMessages.length);
          }, 3000);
        }
      }, 50);
    }
  };

  useEffect(() => {
    if (isActive) {
      const blinkInterval = setInterval(() => {
        setEyeHeight(1);
        setTimeout(() => setEyeHeight(6), 150);
      }, 3000);
      return () => clearInterval(blinkInterval);
    }
  }, [isActive]);

  return (
    <div className={`relative flex items-center ${className}`}>
      <span
        onClick={handleLogoClick}
        className={`relative flex items-center justify-center w-14 h-14 rounded-2xl ${
          actualTheme === 'dark' 
            ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-cyan-500/30 shadow-xl shadow-cyan-500/20' 
            : 'bg-gradient-to-br from-white to-slate-50 border-2 border-blue-500/30 shadow-xl shadow-blue-500/20'
        } cursor-pointer transition-all duration-300 hover:scale-110 hover:rotate-3 ${logoAnimClass}`}
        title="Click me for motivation! 🚀"
      >
        <svg width={size} height={size} viewBox="0 0 56 56" fill="none" className="logo-svg">
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
      </span>

      {showBubble && (
        <div className={`absolute left-16 top-0 ${
          actualTheme === 'dark'
            ? 'bg-gradient-to-r from-cyan-600 to-blue-600 border border-cyan-400/50'
            : 'bg-gradient-to-r from-blue-600 to-purple-600 border border-blue-400/50'
        } rounded-2xl px-4 py-3 text-white text-sm animate-pulse shadow-2xl max-w-xs backdrop-blur-sm z-50`}>
          <span className="font-medium">{typedText}</span>
          <div className={`absolute -left-2 top-4 w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent ${
            actualTheme === 'dark' ? 'border-r-8 border-r-cyan-600' : 'border-r-8 border-r-blue-600'
          }`}></div>
        </div>
      )}
    </div>
  );
}

function ThemeToggle() {
  const { theme, actualTheme, toggleTheme } = useTheme();
  const themeClasses = getThemeClasses(actualTheme);

  const getThemeIcon = () => {
    if (theme === 'light') return '☀️';
    if (theme === 'dark') return '🌙';
    return '🌓'; // auto
  };

  const getThemeLabel = () => {
    if (theme === 'light') return 'Light';
    if (theme === 'dark') return 'Dark';
    return 'Auto';
  };

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${themeClasses.hoverBg} ${themeClasses.borderPrimary} border ${themeClasses.textSecondary} hover:scale-105`}
      title={`Current: ${getThemeLabel()} (click to cycle)`}
    >
      <span className="text-xl">{getThemeIcon()}</span>
      <span className="text-sm font-medium">{getThemeLabel()}</span>
    </button>
  );
}

function StudyContent() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [user, setUser] = useState({ name: 'Alex', streak: 7, points: 3850, level: 'Expert' });
  const [notifications, setNotifications] = useState<string[]>([
    '🎯 Welcome to the future of learning!'
  ]);
  const [isOnline, setIsOnline] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { actualTheme } = useTheme();
  const themeClasses = getThemeClasses(actualTheme);

  useEffect(() => {
    const savedProgress = localStorage.getItem('quiz-progress');
    if (savedProgress) {
      const progress = JSON.parse(savedProgress);
      if (progress.studyStreak > 0) {
        setNotifications(prev => [...prev, `🔥 You're on a ${progress.studyStreak}-day study streak!`]);
      }
    }

    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(timeInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const clearNotifications = () => {
    setNotifications([]);
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return '🌅 Good Morning';
    if (hour < 17) return '☀️ Good Afternoon';
    if (hour < 21) return '🌆 Good Evening';
    return '🌙 Good Night';
  };

  const tabConfig = [
    {
      id: 'dashboard' as Tab,
      icon: '📊',
      title: 'Command Center',
      subtitle: 'Analytics & Insights',
      description: 'Real-time performance metrics'
    },
    {
      id: 'chat' as Tab,
      icon: '🤖',
      title: 'AI Mentor',
      subtitle: 'Intelligent Conversations',
      description: 'Your personal learning assistant'
    },
    {
      id: 'advanced-flashcards' as Tab,
      icon: '🃏',
      title: 'Neural Cards',
      subtitle: 'Adaptive Memory System',
      description: 'Science-backed retention'
    },
    {
      id: 'quiz' as Tab,
      icon: '🧠',
      title: 'Quantum Quiz',
      subtitle: 'AI-Powered Assessment',
      description: 'Personalized difficulty scaling'
    },
    {
      id: 'interview' as Tab,
      icon: '🎯',
      title: 'Interview Simulator',
      subtitle: 'Elite Preparation',
      description: 'Fortune 500 question bank'
    },
  ];

  return (
    <div className={`flex h-screen ${themeClasses.bgPrimary} ${themeClasses.textPrimary} overflow-hidden relative`}>
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className={`absolute top-20 left-20 w-72 h-72 ${actualTheme === 'dark' ? 'bg-cyan-600' : 'bg-blue-600'} rounded-full mix-blend-multiply filter blur-xl animate-pulse`}></div>
        <div className={`absolute top-40 right-20 w-72 h-72 ${actualTheme === 'dark' ? 'bg-purple-600' : 'bg-purple-600'} rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000`}></div>
        <div className={`absolute bottom-20 left-40 w-72 h-72 ${actualTheme === 'dark' ? 'bg-blue-600' : 'bg-indigo-600'} rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000`}></div>
      </div>

      {/* Professional Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-80'} ${themeClasses.sidebarBg} ${themeClasses.sidebarBorder} border-r flex flex-col ${themeClasses.cardShadow} transition-all duration-500 ease-in-out relative z-10`}>
        
        {/* Header Section */}
        <div className={`p-6 ${themeClasses.borderPrimary} border-b`}>
          <div className="flex items-center justify-between mb-6">
            <AILogo isActive={tab === 'chat'} size={sidebarCollapsed ? 28 : 32} showEmotions={!sidebarCollapsed} />
            {!sidebarCollapsed && (
              <div className="flex-1 ml-4">
                <h1 className={`text-2xl font-bold ${actualTheme === 'dark' ? 'text-gradient-primary' : 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'}`}>
                  StudyGenius Pro
                </h1>
                <p className={`${themeClasses.textMuted} text-sm`}>Next-Gen AI Learning Platform</p>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`p-2 ${themeClasses.hoverBg} rounded-xl transition-all duration-300 ${themeClasses.textSecondary} hover:scale-105`}
            >
              <span className="text-xl">{sidebarCollapsed ? '→' : '←'}</span>
            </button>
          </div>
          
          {!sidebarCollapsed && (
            <>
              {/* Time & Status */}
              <div className={`${themeClasses.bgTertiary} rounded-2xl p-4 mb-4 ${themeClasses.borderPrimary} border`}>
                <div className="flex items-center justify-between text-sm">
                  <span className={themeClasses.textSecondary}>{getGreeting()}</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`}></div>
                    <span className={themeClasses.textMuted}>{currentTime.toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              {/* Enhanced User Profile */}
              <div className={`${themeClasses.cardBg} ${themeClasses.cardBorder} border rounded-2xl p-5`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 bg-gradient-to-r ${themeClasses.gradientPrimary} rounded-full flex items-center justify-center text-xl font-bold text-white`}>
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className={`font-bold ${themeClasses.textPrimary}`}>{user.name}</p>
                      <p className={`text-xs ${themeClasses.textAccent}`}>{user.level} Learner</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-3 py-1 rounded-full font-bold">
                      PREMIUM ✨
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className={`${themeClasses.bgTertiary} rounded-xl p-3 text-center ${themeClasses.borderPrimary} border`}>
                    <div className="text-orange-400 text-lg mb-1">🔥</div>
                    <div className={`font-bold ${themeClasses.textPrimary}`}>{user.streak}</div>
                    <div className={`text-xs ${themeClasses.textMuted}`}>Day Streak</div>
                  </div>
                  <div className={`${themeClasses.bgTertiary} rounded-xl p-3 text-center ${themeClasses.borderPrimary} border`}>
                    <div className="text-yellow-400 text-lg mb-1">⭐</div>
                    <div className={`font-bold ${themeClasses.textPrimary}`}>{user.points.toLocaleString()}</div>
                    <div className={`text-xs ${themeClasses.textMuted}`}>XP Points</div>
                  </div>
                </div>
              </div>

              {/* Theme Toggle */}
              <div className="mt-4">
                <ThemeToggle />
              </div>
            </>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-3 overflow-y-auto">
          {tabConfig.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`group w-full text-left rounded-2xl transition-all duration-300 transform hover:scale-105 ${
                tab === item.id
                  ? `bg-gradient-to-r ${themeClasses.gradientPrimary} text-white shadow-lg ${actualTheme === 'dark' ? 'shadow-cyan-500/25' : 'shadow-blue-500/25'}`
                  : themeClasses.hoverBg
              }`}
            >
              <div className={`flex items-center space-x-4 p-4 ${sidebarCollapsed ? 'justify-center' : ''}`}>
                <span className="text-2xl">{item.icon}</span>
                {!sidebarCollapsed && (
                  <div className="flex-1">
                    <div className={`font-bold transition-colors ${tab === item.id ? 'text-white' : themeClasses.textPrimary}`}>
                      {item.title}
                    </div>
                    <div className={`text-xs transition-colors ${tab === item.id ? 'text-white/80' : themeClasses.textMuted}`}>
                      {item.subtitle}
                    </div>
                    <div className={`text-xs mt-1 transition-colors ${tab === item.id ? 'text-white/60' : themeClasses.textMuted}`}>
                      {item.description}
                    </div>
                  </div>
                )}
                {!sidebarCollapsed && tab === item.id && (
                  <div className="w-2 h-8 bg-white rounded-full opacity-80"></div>
                )}
              </div>
            </button>
          ))}
        </nav>

        {/* Footer */}
        {!sidebarCollapsed && (
          <div className={`p-4 ${themeClasses.borderPrimary} border-t`}>
            <div className={`${actualTheme === 'dark' ? 'bg-gradient-to-r from-emerald-900/30 to-cyan-900/30 border-emerald-500/20' : 'bg-gradient-to-r from-emerald-50 to-cyan-50 border-emerald-200'} rounded-xl p-3 border`}>
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-emerald-400">⚡</span>
                <span className={themeClasses.textSecondary}>AI Engine Status:</span>
                <span className="text-emerald-400 font-medium">Online</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Premium Top Bar */}
        {notifications.length > 0 && (
          <div className={`bg-gradient-to-r ${themeClasses.gradientPrimary} backdrop-blur-sm ${themeClasses.borderAccent} border-b shadow-xl`}>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <span className="text-2xl">🎉</span>
                </div>
                <div>
                  {notifications.map((notification, index) => (
                    <p key={index} className="text-white font-medium">{notification}</p>
                  ))}
                  <p className="text-white/80 text-sm">Your learning journey continues...</p>
                </div>
              </div>
              <button
                onClick={clearNotifications}
                className="p-3 hover:bg-white/20 rounded-xl transition-all duration-300 backdrop-blur-sm hover:scale-105"
              >
                <span className="text-white text-xl">✕</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Container */}
        <div className={`flex-1 overflow-auto ${themeClasses.bgPrimary} backdrop-blur-sm`}>
          {tab === 'dashboard' && <Dashboard />}
          {tab === 'chat' && <Chat />}
          {tab === 'flashcards' && <Flashcards />}
          {tab === 'advanced-flashcards' && <AdvancedFlashcards />}
          {tab === 'quiz' && <Quiz />}
          {tab === 'interview' && <Interview />}
        </div>
      </main>
    </div>
  );
}

export default function Study() {
  return (
    <ThemeProvider>
      <StudyContent />
    </ThemeProvider>
  );
}
