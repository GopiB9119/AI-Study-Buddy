import { useState, useEffect, useRef } from 'react';
import { UniversalQuestion, StudySession } from '../types/quiz';
import { generateQuiz, generateCompanyQuestions } from '../services/api';

export default function Interview() {
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState<UniversalQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [mode, setMode] = useState<'general' | 'deep-dive' | 'adaptive'>('general');
  const [loading, setLoading] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});
  const [sessionTime, setSessionTime] = useState(0);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [currentlyReading, setCurrentlyReading] = useState(false);
  const sessionStartRef = useRef<Date | null>(null);

  // Timer for session tracking
  useEffect(() => {
    let interval: number;
    if (sessionStarted && sessionStartRef.current) {
      interval = setInterval(() => {
        setSessionTime(Math.floor((Date.now() - sessionStartRef.current!.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionStarted]);

  // Voice synthesis
  const speakText = (text: string) => {
    if (!isVoiceEnabled || currentlyReading) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.onstart = () => setCurrentlyReading(true);
    utterance.onend = () => setCurrentlyReading(false);
    speechSynthesis.speak(utterance);
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    sessionStartRef.current = new Date();

    try {
      let result: UniversalQuestion[] = [];
      
      if (mode === 'general') {
        const quizData = await generateQuiz(topic.trim());
        result = quizData.map(q => ({
          ...q,
          type: 'mcq' as const,
          difficulty: 'medium' as const,
          category: topic.trim()
        }));
      } else if (mode === 'deep-dive') {
        const explanationData = await generateCompanyQuestions(topic.trim());
        result = explanationData.map(q => ({
          ...q,
          type: 'explanation' as const,
          difficulty: 'hard' as const,
          category: topic.trim()
        }));
      } else {
        // Adaptive mode - mix of both
        const [quizData, explanationData] = await Promise.all([
          generateQuiz(topic.trim()),
          generateCompanyQuestions(topic.trim())
        ]);
        
        const quizQuestions = quizData.slice(0, 5).map(q => ({
          ...q,
          type: 'mcq' as const,
          difficulty: 'medium' as const,
          category: topic.trim()
        }));
        
        const explanationQuestions = explanationData.slice(0, 3).map(q => ({
          ...q,
          type: 'explanation' as const,
          difficulty: 'hard' as const,
          category: topic.trim()
        }));
        
        result = [...quizQuestions, ...explanationQuestions].sort(() => Math.random() - 0.5);
      }
      
      setQuestions(result);
      setSessionStarted(true);
      setCurrentQuestion(0);
      setUserAnswers({});
      setShowExplanation({});
    } catch (error) {
      console.error('Error generating questions:', error);
    }
    
    setLoading(false);
  };

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    setUserAnswers(prev => ({ ...prev, [questionIndex]: answer }));
    
    // Auto-advance for MCQs after 1 second
    if (questions[questionIndex]?.type === 'mcq') {
      setTimeout(() => {
        setShowExplanation(prev => ({ ...prev, [questionIndex]: true }));
      }, 1000);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      if (isVoiceEnabled) {
        setTimeout(() => speakText(questions[currentQuestion + 1]?.question || ''), 500);
      }
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateScore = () => {
    const mcqQuestions = questions.filter(q => q.type === 'mcq');
    const correctAnswers = mcqQuestions.filter((q, index) => 
      userAnswers[index] === q.correctAnswer
    ).length;
    return mcqQuestions.length > 0 ? Math.round((correctAnswers / mcqQuestions.length) * 100) : 0;
  };

  const resetSession = () => {
    setSessionStarted(false);
    setQuestions([]);
    setCurrentQuestion(0);
    setUserAnswers({});
    setShowExplanation({});
    setSessionTime(0);
    sessionStartRef.current = null;
  };

  if (!sessionStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              🎯 AI Interview Companion
            </h1>
            <p className="text-gray-600 text-lg">Master any topic with AI-powered adaptive learning</p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  📚 What would you like to study today?
                </label>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-lg"
                  placeholder="e.g., React Hooks, Machine Learning, Data Structures..."
                  onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  🎮 Choose your learning mode
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setMode('general')}
                    className={`p-4 rounded-2xl border-2 transition-all text-left ${
                      mode === 'general' 
                        ? 'border-blue-500 bg-blue-50 shadow-lg' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">🎯</div>
                    <div className="font-semibold">Quick Quiz</div>
                    <div className="text-sm text-gray-600">Multiple choice questions</div>
                  </button>
                  
                  <button
                    onClick={() => setMode('deep-dive')}
                    className={`p-4 rounded-2xl border-2 transition-all text-left ${
                      mode === 'deep-dive' 
                        ? 'border-purple-500 bg-purple-50 shadow-lg' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">🔍</div>
                    <div className="font-semibold">Deep Dive</div>
                    <div className="text-sm text-gray-600">Detailed explanations</div>
                  </button>
                  
                  <button
                    onClick={() => setMode('adaptive')}
                    className={`p-4 rounded-2xl border-2 transition-all text-left ${
                      mode === 'adaptive' 
                        ? 'border-green-500 bg-green-50 shadow-lg' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">🧠</div>
                    <div className="font-semibold">Adaptive</div>
                    <div className="text-sm text-gray-600">Mixed learning styles</div>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      isVoiceEnabled 
                        ? 'border-green-500 bg-green-50 text-green-600' 
                        : 'border-gray-200 text-gray-400'
                    }`}
                  >
                    {isVoiceEnabled ? '🔊' : '🔇'}
                  </button>
                  <span className="text-sm text-gray-600">Voice Assistant</span>
                </div>
                
                <button
                  onClick={handleGenerate}
                  disabled={!topic.trim() || loading}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all transform hover:scale-105"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Generating...</span>
                    </div>
                  ) : (
                    '🚀 Start Learning'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">📖 {topic}</h1>
              <p className="text-gray-600">
                Question {currentQuestion + 1} of {questions.length} • Score: {calculateScore()}%
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{formatTime(sessionTime)}</div>
              <button
                onClick={resetSession}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                🏠 New Session
              </button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        {currentQ && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6 border border-gray-100">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                    {currentQ.type === 'mcq' ? '📝 Multiple Choice' : '💡 Explanation'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    currentQ.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                    currentQ.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {currentQ.difficulty?.toUpperCase()}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-gray-800 leading-relaxed">
                  {currentQ.question}
                </h2>
              </div>
              {isVoiceEnabled && (
                <button
                  onClick={() => speakText(currentQ.question)}
                  disabled={currentlyReading}
                  className="p-3 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-all disabled:opacity-50"
                >
                  {currentlyReading ? '⏸️' : '🔊'}
                </button>
              )}
            </div>

            {/* MCQ Options */}
            {currentQ.type === 'mcq' && currentQ.options && (
              <div className="space-y-3 mb-6">
                {currentQ.options.map((option, index) => {
                  const isSelected = userAnswers[currentQuestion] === option;
                  const isCorrect = option === currentQ.correctAnswer;
                  const showResult = showExplanation[currentQuestion];
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(currentQuestion, option)}
                      disabled={showResult}
                      className={`w-full p-4 text-left rounded-2xl border-2 transition-all ${
                        showResult
                          ? isCorrect
                            ? 'border-green-500 bg-green-50 text-green-800'
                            : isSelected
                            ? 'border-red-500 bg-red-50 text-red-800'
                            : 'border-gray-200 text-gray-600'
                          : isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                          showResult && isCorrect
                            ? 'bg-green-500 text-white'
                            : showResult && isSelected && !isCorrect
                            ? 'bg-red-500 text-white'
                            : isSelected
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className="flex-1">{option}</span>
                        {showResult && isCorrect && <span className="text-green-500">✓</span>}
                        {showResult && isSelected && !isCorrect && <span className="text-red-500">✗</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Explanation */}
            {((currentQ.type === 'explanation') || showExplanation[currentQuestion]) && currentQ.explanation && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Explanation</h3>
                    <p className="text-gray-700 leading-relaxed">{currentQ.explanation}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevQuestion}
            disabled={currentQuestion === 0}
            className="px-6 py-3 bg-gray-100 text-gray-600 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-all"
          >
            ← Previous
          </button>
          
          <div className="flex space-x-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentQuestion
                    ? 'bg-blue-500'
                    : userAnswers[index]
                    ? 'bg-green-400'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          <button
            onClick={nextQuestion}
            disabled={currentQuestion === questions.length - 1}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-all"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
