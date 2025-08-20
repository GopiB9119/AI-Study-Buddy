import { useState, useEffect } from 'react';
import { UniversalQuestion, StudySession, UserProgress } from '../types/quiz';
import { generateQuiz, askAI } from '../services/api';
import { useTheme, getThemeClasses } from '../contexts/ThemeContext';

export default function Quiz() {
  const { actualTheme } = useTheme();
  const themeClasses = getThemeClasses(actualTheme);
  
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState<UniversalQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [timePerQuestion] = useState(30);
  const [timeLeft, setTimeLeft] = useState(timePerQuestion);
  const [timerActive, setTimerActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [mistakes, setMistakes] = useState<UniversalQuestion[]>([]);
  const [progress, setProgress] = useState<UserProgress>({
    totalSessions: 0,
    averageScore: 0,
    weakAreas: [],
    strongAreas: [],
    studyStreak: 0,
    totalStudyTime: 0
  });

  // Timer effect
  useEffect(() => {
    let interval: number;
    if (timerActive && timeLeft > 0 && !finished) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmit(true); // Auto-submit when time runs out
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, finished]);

  // Load progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem('quiz-progress');
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress));
    }
  }, []);

  const startQuiz = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setSessionStartTime(new Date());
    
    try {
      const qs = await generateQuiz(topic.trim());
      const enhancedQuestions = qs.slice(0, questionCount).map((q, index) => ({
        ...q,
        type: 'mcq' as const,
        difficulty,
        category: topic.trim(),
        id: `quiz-${index}-${Date.now()}`
      }));
      
      setQuestions(enhancedQuestions);
      setCurrent(0);
      setSelected(null);
      setUserAnswers({});
      setShowExplanation(false);
      setScore(0);
      setFinished(false);
      setTimeLeft(timePerQuestion);
      setTimerActive(true);
      setMistakes([]);
    } catch (error) {
      console.error('Error generating quiz:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (timeOut = false) => {
    if (!questions[current]) return;
    
    const currentQuestion = questions[current];
    const answer = timeOut ? '' : selected;
    const isCorrect = answer === currentQuestion.correctAnswer;
    
    // Record the answer
    setUserAnswers(prev => ({ ...prev, [current]: answer || 'No answer' }));
    
    // Update question with user's answer
    const updatedQuestion = {
      ...currentQuestion,
      userAnswer: answer || 'No answer',
      isCorrect
    };
    
    if (isCorrect) {
      setScore(s => s + 1);
    } else {
      setMistakes(prev => [...prev, updatedQuestion]);
    }
    
    setShowExplanation(true);
    setTimerActive(false);
    
    // Get AI analysis for wrong answers
    if (!isCorrect && currentQuestion.explanation) {
      try {
        const analysisPrompt = `The user answered "${answer || 'No answer'}" to the question "${currentQuestion.question}". The correct answer is "${currentQuestion.correctAnswer}". The explanation is: "${currentQuestion.explanation}". Provide a helpful learning tip to help them understand this concept better.`;
        const analysis = await askAI(analysisPrompt);
        setAiAnalysis(analysis);
      } catch (error) {
        setAiAnalysis('Keep studying! This concept can be tricky, but practice makes perfect.');
      }
    } else {
      setAiAnalysis('Great job! You understood this concept well.');
    }
  };

  const nextQuestion = () => {
    if (current + 1 < questions.length) {
      setCurrent(c => c + 1);
      setSelected(null);
      setShowExplanation(false);
      setTimeLeft(timePerQuestion);
      setTimerActive(true);
      setAiAnalysis('');
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    setFinished(true);
    setTimerActive(false);
    
    // Save session data
    if (sessionStartTime) {
      const sessionTime = Math.floor((Date.now() - sessionStartTime.getTime()) / 1000);
      const session: StudySession = {
        id: Date.now().toString(),
        topic: topic.trim(),
        questions,
        score: Math.round((score / questions.length) * 100),
        totalTime: sessionTime,
        completedAt: new Date(),
        mistakes
      };
      
      // Update progress
      const newProgress = {
        ...progress,
        totalSessions: progress.totalSessions + 1,
        averageScore: Math.round(((progress.averageScore * progress.totalSessions) + (session.score || 0)) / (progress.totalSessions + 1)),
        totalStudyTime: progress.totalStudyTime + sessionTime,
        weakAreas: mistakes.map(m => m.category || topic.trim()).filter((v, i, a) => a.indexOf(v) === i),
        strongAreas: score > questions.length / 2 ? [topic.trim()] : progress.strongAreas                         
    
      };
      
      setProgress(newProgress);
      localStorage.setItem('quiz-progress', JSON.stringify(newProgress));
    }
  };

  const resetQuiz = () => {
    setQuestions([]);
    setFinished(false);
    setSelected(null);
    setUserAnswers({});
    setShowExplanation(false);
    setScore(0);
    setCurrent(0);
    setTimerActive(false);
    setMistakes([]);
    setAiAnalysis('');
    setSessionStartTime(null);
  };

  const formatTime = (seconds: number) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const getScoreColor = () => {
    const percentage = (score / questions.length) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressPercentage = () => {
    return ((current + 1) / questions.length) * 100;
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${themeClasses.bgPrimary}`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-16 w-16 border-4 ${actualTheme === 'dark' ? 'border-cyan-500 border-t-transparent' : 'border-blue-500 border-t-transparent'} mx-auto mb-4`}></div>
          <p className={`text-xl ${themeClasses.textSecondary}`}>🤖 Preparing your personalized quiz...</p>
          <p className={`text-sm ${themeClasses.textMuted} mt-2`}>Our AI is crafting the perfect questions for you</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClasses.bgPrimary} p-6 relative overflow-hidden`}>
      {/* Professional Background Effects */}
      <div className="absolute inset-0 opacity-10">
        <div className={`absolute top-20 left-20 w-96 h-96 ${actualTheme === 'dark' ? 'bg-cyan-600' : 'bg-blue-600'} rounded-full filter blur-3xl animate-float`}></div>
        <div className={`absolute bottom-20 right-20 w-72 h-72 ${actualTheme === 'dark' ? 'bg-purple-600' : 'bg-purple-600'} rounded-full filter blur-3xl animate-float-delay`}></div>
        <div className={`absolute top-1/2 left-1/2 w-80 h-80 ${actualTheme === 'dark' ? 'bg-blue-600' : 'bg-indigo-600'} rounded-full filter blur-3xl animate-pulse-slow`}></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {!questions.length && !finished && (
          <div className="text-center mb-8">
            <h1 className={`text-5xl font-bold mb-4 ${actualTheme === 'dark' ? 'text-gradient-primary' : 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'}`}>
              🧠 Quantum Quiz Arena
            </h1>
            <p className={`${themeClasses.textSecondary} text-xl`}>
              🚀 Test your knowledge with AI-powered adaptive questions
            </p>
            <p className={`${themeClasses.textMuted} text-lg mt-2`}>
              ✨ Personalized difficulty • 🎯 Smart analytics • 🔥 Real-time feedback
            </p>
          </div>
        )}

        {/* Enhanced Quiz Setup */}
        {!questions.length && !finished && (
          <div className={`${themeClasses.cardBg} ${themeClasses.cardBorder} border rounded-3xl ${themeClasses.cardShadow} p-8 backdrop-blur-xl`}>
            <div className="space-y-8">
              <div>
                <label className={`block text-sm font-bold ${themeClasses.textPrimary} mb-4 flex items-center`}>
                  <span className="text-2xl mr-3">📚</span>
                  What would you like to master today?
                </label>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className={`w-full p-5 border-2 ${themeClasses.borderPrimary} rounded-2xl ${themeClasses.bgSecondary} ${themeClasses.textPrimary} focus:border-blue-500 focus:ring-4 ${actualTheme === 'dark' ? 'focus:ring-cyan-500/20' : 'focus:ring-blue-500/20'} transition-all text-lg placeholder-gray-400`}
                  placeholder="e.g., JavaScript Fundamentals, Python Data Structures, Machine Learning..."
                  onKeyPress={(e) => e.key === 'Enter' && startQuiz()}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`${themeClasses.bgTertiary} rounded-2xl p-6 ${themeClasses.borderPrimary} border`}>
                  <label className={`block text-sm font-bold ${themeClasses.textPrimary} mb-4 flex items-center`}>
                    <span className="text-xl mr-2">🎯</span>
                    Challenge Level
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                    className={`w-full p-4 border-2 ${themeClasses.borderPrimary} rounded-xl ${themeClasses.bgSecondary} ${themeClasses.textPrimary} focus:border-blue-500 transition-all`}
                  >
                    <option value="easy">🟢 Easy - Build Confidence</option>
                    <option value="medium">🟡 Medium - Balanced Challenge</option>
                    <option value="hard">🔴 Hard - Expert Mode</option>
                  </select>
                </div>

                <div className={`${themeClasses.bgTertiary} rounded-2xl p-6 ${themeClasses.borderPrimary} border`}>
                  <label className={`block text-sm font-bold ${themeClasses.textPrimary} mb-4 flex items-center`}>
                    <span className="text-xl mr-2">📊</span>
                    Questions Count
                  </label>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className={`w-full p-4 border-2 ${themeClasses.borderPrimary} rounded-xl ${themeClasses.bgSecondary} ${themeClasses.textPrimary} focus:border-blue-500 transition-all`}
                  >
                    <option value={5}>⚡ 5 Questions - Quick Test</option>
                    <option value={10}>🔥 10 Questions - Standard</option>
                    <option value={15}>💪 15 Questions - Extended</option>
                    <option value={20}>🚀 20 Questions - Marathon</option>
                  </select>
                </div>

                <div className={`${themeClasses.bgTertiary} rounded-2xl p-6 ${themeClasses.borderPrimary} border`}>
                  <label className={`block text-sm font-bold ${themeClasses.textPrimary} mb-4 flex items-center`}>
                    <span className="text-xl mr-2">⏱️</span>
                    Time Challenge
                  </label>
                  <div className={`p-4 border-2 ${themeClasses.borderPrimary} rounded-xl ${themeClasses.bgSecondary} ${themeClasses.textSecondary} text-center`}>
                    <span className="text-2xl font-bold">{timePerQuestion}</span>
                    <span className="text-sm ml-1">seconds per question</span>
                  </div>
                </div>
              </div>

              {/* Enhanced Progress Stats */}
              {progress.totalSessions > 0 && (
                <div className={`bg-gradient-to-r ${actualTheme === 'dark' ? 'from-cyan-900/20 to-blue-900/20 border-cyan-500/20' : 'from-blue-50 to-purple-50 border-blue-200'} rounded-2xl p-6 border backdrop-blur-sm`}>
                  <h3 className={`font-bold ${themeClasses.textPrimary} mb-6 flex items-center text-lg`}>
                    <span className="text-2xl mr-3">📈</span>
                    Your Learning Journey
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${actualTheme === 'dark' ? 'text-cyan-400' : 'text-blue-600'} mb-2`}>
                        {progress.totalSessions}
                      </div>
                      <div className={`text-sm ${themeClasses.textMuted}`}>Sessions Completed</div>
                      <div className="text-xs text-blue-500 mt-1">🎯 Knowledge Building</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${actualTheme === 'dark' ? 'text-emerald-400' : 'text-green-600'} mb-2`}>
                        {progress.averageScore}%
                      </div>
                      <div className={`text-sm ${themeClasses.textMuted}`}>Average Score</div>
                      <div className="text-xs text-green-500 mt-1">🏆 Performance Metric</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${actualTheme === 'dark' ? 'text-purple-400' : 'text-purple-600'} mb-2`}>
                        {Math.floor(progress.totalStudyTime / 60)}m
                      </div>
                      <div className={`text-sm ${themeClasses.textMuted}`}>Study Time</div>
                      <div className="text-xs text-purple-500 mt-1">⏰ Time Invested</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${actualTheme === 'dark' ? 'text-orange-400' : 'text-orange-600'} mb-2`}>
                        {progress.studyStreak}
                      </div>
                      <div className={`text-sm ${themeClasses.textMuted}`}>Streak Days</div>
                      <div className="text-xs text-orange-500 mt-1">🔥 Consistency Power</div>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={startQuiz}
                disabled={!topic.trim()}
                className={`w-full py-5 bg-gradient-to-r ${themeClasses.gradientPrimary} text-white rounded-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-2xl transition-all transform hover:scale-105 text-xl ${actualTheme === 'dark' ? 'shadow-cyan-500/25' : 'shadow-blue-500/25'} relative overflow-hidden group`}
              >
                <span className="relative z-10 flex items-center justify-center">
                  <span className="text-2xl mr-3">🚀</span>
                  Launch Quiz Experience
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Quiz Interface */}
        {questions.length > 0 && !finished && (
          <>
            {/* Professional Progress Header */}
            <div className={`${themeClasses.cardBg} ${themeClasses.cardBorder} border rounded-2xl ${themeClasses.cardShadow} p-6 mb-6 backdrop-blur-xl`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className={`text-3xl font-bold ${themeClasses.textPrimary} flex items-center`}>
                    <span className="text-3xl mr-3">📖</span>
                    {topic}
                  </h1>
                  <p className={`${themeClasses.textSecondary} text-lg mt-2`}>
                    Question {current + 1} of {questions.length} • Score: {score}/{questions.length}
                  </p>
                  <div className="flex items-center space-x-4 mt-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      difficulty === 'easy' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                      difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                      'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {difficulty === 'easy' ? '🟢 EASY' : difficulty === 'medium' ? '🟡 MEDIUM' : '🔴 HARD'}
                    </span>
                    <span className={`px-3 py-1 ${actualTheme === 'dark' ? 'bg-cyan-900/30 text-cyan-300 border border-cyan-500/30' : 'bg-blue-100 text-blue-800 border border-blue-200'} rounded-full text-sm font-bold`}>
                      📝 MULTIPLE CHOICE
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-4xl font-bold mb-2 ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : actualTheme === 'dark' ? 'text-cyan-400' : 'text-blue-600'}`}>
                    {formatTime(timeLeft)}
                  </div>
                  <div className={`text-sm ${themeClasses.textMuted}`}>Time Remaining</div>
                  <div className={`w-20 h-2 ${themeClasses.bgTertiary} rounded-full mt-2 overflow-hidden`}>
                    <div 
                      className={`h-full transition-all duration-1000 ${timeLeft <= 10 ? 'bg-red-500' : actualTheme === 'dark' ? 'bg-cyan-500' : 'bg-blue-500'}`}
                      style={{ width: `${(timeLeft / timePerQuestion) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Progress Bar */}
              <div className={`w-full ${themeClasses.bgTertiary} rounded-full h-4 p-1`}>
                <div 
                  className={`bg-gradient-to-r ${themeClasses.gradientPrimary} h-full rounded-full transition-all duration-700 flex items-center justify-end pr-2 relative overflow-hidden`}
                  style={{ width: `${getProgressPercentage()}%` }}
                >
                  <span className="text-xs text-white font-bold">{Math.round(getProgressPercentage())}%</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                </div>
              </div>
            </div>

            {/* Enhanced Question Card */}
            <div className={`${themeClasses.cardBg} ${themeClasses.cardBorder} border rounded-3xl ${themeClasses.cardShadow} p-8 mb-6 backdrop-blur-xl relative overflow-hidden`}>
              {/* Decorative corner elements */}
              <div className={`absolute top-0 right-0 w-32 h-32 ${actualTheme === 'dark' ? 'bg-cyan-500/10' : 'bg-blue-500/10'} rounded-full -translate-y-16 translate-x-16`}></div>
              <div className={`absolute bottom-0 left-0 w-24 h-24 ${actualTheme === 'dark' ? 'bg-purple-500/10' : 'bg-purple-500/10'} rounded-full translate-y-12 -translate-x-12`}></div>
              
              <div className="relative z-10">
                <div className="mb-8">
                  <h2 className={`text-2xl font-bold ${themeClasses.textPrimary} leading-relaxed flex items-start`}>
                    <span className={`text-3xl mr-4 mt-1 p-3 rounded-2xl ${actualTheme === 'dark' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-blue-500/20 text-blue-600'}`}>
                      Q{current + 1}
                    </span>
                    <span className="flex-1 pt-3">
                      {questions[current]?.question}
                    </span>
                  </h2>
                </div>

                {/* Enhanced Options */}
                <div className="space-y-4 mb-8">
                  {questions[current]?.options?.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => setSelected(option)}
                      disabled={showExplanation}
                      className={`w-full p-6 text-left rounded-2xl border-2 transition-all duration-300 transform hover:scale-[1.02] ${
                        showExplanation
                          ? option === questions[current]?.correctAnswer
                            ? `border-emerald-500 ${actualTheme === 'dark' ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-50 text-emerald-800'} shadow-lg shadow-emerald-500/20`
                            : selected === option
                            ? `border-red-500 ${actualTheme === 'dark' ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-800'} shadow-lg shadow-red-500/20`
                            : `${themeClasses.borderPrimary} ${themeClasses.textMuted}`
                          : selected === option
                          ? `border-blue-500 ${actualTheme === 'dark' ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-800'} shadow-lg shadow-blue-500/20`
                          : `${themeClasses.borderPrimary} hover:border-blue-400 ${themeClasses.hoverBg}`
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <span className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold transition-all ${
                          showExplanation && option === questions[current]?.correctAnswer
                            ? 'bg-emerald-500 text-white shadow-lg'
                            : showExplanation && selected === option && option !== questions[current]?.correctAnswer
                            ? 'bg-red-500 text-white shadow-lg'
                            : selected === option
                            ? 'bg-blue-500 text-white shadow-lg'
                            : `${themeClasses.bgTertiary} ${themeClasses.textSecondary}`
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className="flex-1 text-lg">{option}</span>
                        <div className="flex items-center space-x-2">
                          {showExplanation && option === questions[current]?.correctAnswer && (
                            <span className="text-emerald-500 text-2xl animate-bounce">✓</span>
                          )}
                          {showExplanation && selected === option && option !== questions[current]?.correctAnswer && (
                            <span className="text-red-500 text-2xl animate-pulse">✗</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Enhanced Submit Button */}
                {!showExplanation && (
                  <button
                    onClick={() => handleSubmit()}
                    disabled={!selected}
                    className={`w-full py-5 bg-gradient-to-r ${themeClasses.gradientPrimary} text-white rounded-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-2xl transition-all transform hover:scale-105 text-xl relative overflow-hidden group`}
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      <span className="text-2xl mr-3">🎯</span>
                      Submit Answer
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  </button>
                )}

                {/* Enhanced Explanation & AI Analysis */}
                {showExplanation && (
                  <div className="space-y-6">
                    {questions[current]?.explanation && (
                      <div className={`bg-gradient-to-r ${actualTheme === 'dark' ? 'from-blue-900/20 to-purple-900/20 border-blue-500/30' : 'from-blue-50 to-purple-50 border-blue-200'} rounded-2xl p-6 border backdrop-blur-sm`}>
                        <h3 className={`font-bold ${themeClasses.textPrimary} mb-4 flex items-center text-lg`}>
                          <span className="text-2xl mr-3">💡</span>
                          Knowledge Insight
                        </h3>
                        <p className={`${themeClasses.textSecondary} leading-relaxed text-lg`}>{questions[current].explanation}</p>
                      </div>
                    )}

                    {aiAnalysis && (
                      <div className={`bg-gradient-to-r ${actualTheme === 'dark' ? 'from-emerald-900/20 to-cyan-900/20 border-emerald-500/30' : 'from-emerald-50 to-cyan-50 border-emerald-200'} rounded-2xl p-6 border backdrop-blur-sm`}>
                        <h3 className={`font-bold ${themeClasses.textPrimary} mb-4 flex items-center text-lg`}>
                          <span className="text-2xl mr-3">🤖</span>
                          AI Learning Assistant
                        </h3>
                        <p className={`${themeClasses.textSecondary} leading-relaxed text-lg`}>{aiAnalysis}</p>
                      </div>
                    )}

                    <button
                      onClick={nextQuestion}
                      className={`w-full py-5 bg-gradient-to-r ${actualTheme === 'dark' ? 'from-emerald-600 to-cyan-600' : 'from-emerald-600 to-blue-600'} text-white rounded-2xl font-bold hover:shadow-2xl transition-all transform hover:scale-105 text-xl relative overflow-hidden group`}
                    >
                      <span className="relative z-10 flex items-center justify-center">
                        <span className="text-2xl mr-3">
                          {current + 1 < questions.length ? '➡️' : '🏁'}
                        </span>
                        {current + 1 < questions.length ? 'Next Question' : 'Complete Quiz'}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Enhanced Results */}
        {finished && (
          <div className={`${themeClasses.cardBg} ${themeClasses.cardBorder} border rounded-3xl ${themeClasses.cardShadow} p-8 backdrop-blur-xl relative overflow-hidden`}>
            {/* Celebration decorations */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className={`absolute top-10 left-10 w-32 h-32 ${actualTheme === 'dark' ? 'bg-cyan-500' : 'bg-blue-500'} rounded-full animate-pulse`}></div>
              <div className={`absolute top-20 right-20 w-24 h-24 ${actualTheme === 'dark' ? 'bg-purple-500' : 'bg-purple-500'} rounded-full animate-pulse animation-delay-1000`}></div>
              <div className={`absolute bottom-10 left-1/2 w-28 h-28 ${actualTheme === 'dark' ? 'bg-emerald-500' : 'bg-emerald-500'} rounded-full animate-pulse animation-delay-2000`}></div>
            </div>
            
            <div className="text-center mb-10 relative z-10">
              <h1 className={`text-5xl font-bold mb-6 ${themeClasses.textPrimary}`}>
                🎉 Quiz Mastery Achieved!
              </h1>
              <div className={`text-7xl font-bold mb-4 ${getScoreColor()}`}>
                {Math.round((score / questions.length) * 100)}%
              </div>
              <p className={`text-2xl ${themeClasses.textSecondary} mb-2`}>
                You conquered {score} out of {questions.length} questions
              </p>
              <p className={`text-lg ${themeClasses.textMuted}`}>
                {score === questions.length ? "🌟 Perfect Score! You're a knowledge champion!" :
                 score >= questions.length * 0.8 ? "🔥 Excellent work! You're really mastering this!" :
                 score >= questions.length * 0.6 ? "💪 Good job! Keep building on this foundation!" :
                 "📚 Great effort! Every step forward is progress!"}
              </p>
            </div>

            {/* Enhanced Performance Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className={`${themeClasses.bgTertiary} ${themeClasses.borderPrimary} border rounded-2xl p-6`}>
                <h3 className={`font-bold ${themeClasses.textPrimary} mb-6 flex items-center text-xl`}>
                  <span className="text-2xl mr-3">📊</span>
                  Performance Breakdown
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className={themeClasses.textSecondary}>Correct Answers:</span>
                    <span className={`font-bold text-emerald-500 text-lg flex items-center`}>
                      <span className="mr-2">✅</span>
                      {score}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={themeClasses.textSecondary}>Incorrect Answers:</span>
                    <span className={`font-bold text-red-500 text-lg flex items-center`}>
                      <span className="mr-2">❌</span>
                      {questions.length - score}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={themeClasses.textSecondary}>Accuracy Rate:</span>
                    <span className={`font-bold ${getScoreColor()} text-lg`}>
                      {Math.round((score / questions.length) * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={themeClasses.textSecondary}>Difficulty Level:</span>
                    <span className={`font-bold ${themeClasses.textPrimary} text-lg capitalize`}>
                      {difficulty}
                    </span>
                  </div>
                </div>
              </div>

              <div className={`${themeClasses.bgTertiary} ${themeClasses.borderPrimary} border rounded-2xl p-6`}>
                <h3 className={`font-bold ${themeClasses.textPrimary} mb-6 flex items-center text-xl`}>
                  <span className="text-2xl mr-3">🎯</span>
                  Growth Recommendations
                </h3>
                <div className="space-y-4">
                  {mistakes.length > 0 ? (
                    <div>
                      <p className={`text-sm ${themeClasses.textMuted} mb-3`}>🔍 Areas for improvement:</p>
                      <ul className="space-y-2">
                        {mistakes.slice(0, 4).map((mistake, index) => (
                          <li key={index} className={`text-orange-500 text-sm flex items-center`}>
                            <span className="mr-2">📌</span>
                            Review {mistake.category || topic} concepts
                          </li>
                        ))}
                      </ul>
                      <p className={`text-xs ${themeClasses.textMuted} mt-4 italic`}>
                        💡 Focus on these topics in your next study session
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-emerald-500 text-lg font-semibold mb-2">Perfect Mastery! 🌟</p>
                      <p className={`text-sm ${themeClasses.textMuted}`}>
                        You've demonstrated complete understanding of this topic. 
                        Consider advancing to a higher difficulty level!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={resetQuiz}
                className={`flex-1 sm:flex-none px-8 py-4 bg-gradient-to-r ${themeClasses.gradientPrimary} text-white rounded-2xl font-bold hover:shadow-2xl transition-all transform hover:scale-105 text-lg relative overflow-hidden group`}
              >
                <span className="relative z-10 flex items-center justify-center">
                  <span className="text-2xl mr-3">🔄</span>
                  New Challenge
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>
              <button
                onClick={() => window.location.href = '/study'}
                className={`flex-1 sm:flex-none px-8 py-4 bg-gradient-to-r ${actualTheme === 'dark' ? 'from-emerald-600 to-cyan-600' : 'from-emerald-600 to-blue-600'} text-white rounded-2xl font-bold hover:shadow-2xl transition-all transform hover:scale-105 text-lg relative overflow-hidden group`}
              >
                <span className="relative z-10 flex items-center justify-center">
                  <span className="text-2xl mr-3">📚</span>
                  Continue Learning
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
