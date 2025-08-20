import { useState, useEffect } from 'react';
import { generateFlashcards } from '../services/api';
import { Flashcard } from '../types/flashcard';

export default function AdvancedFlashcards() {
  const [topic, setTopic] = useState('');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [studyMode, setStudyMode] = useState<'standard' | 'spaced' | 'shuffle'>('standard');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [mastered, setMastered] = useState<Set<string>>(new Set());
  const [difficult, setDifficult] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState({ studied: 0, total: 0 });
  const [autoPlay, setAutoPlay] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  useEffect(() => {
    let interval: number;
    if (autoPlay && flashcards.length > 0 && !showAnswer) {
      interval = setInterval(() => {
        nextCard();
      }, 5000); // Auto-advance every 5 seconds
    }
    return () => clearInterval(interval);
  }, [autoPlay, flashcards.length, showAnswer, currentIndex]);

  const generateCards = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setSessionStartTime(new Date());
    
    try {
      const cards = await generateFlashcards(topic.trim());
      const enhancedCards = cards.map((card, index) => ({
        ...card,
        difficulty,
        category: topic.trim(),
        id: `flashcard-${index}-${Date.now()}`
      }));
      
      setFlashcards(enhancedCards);
      setCurrentIndex(0);
      setShowAnswer(false);
      setMastered(new Set());
      setDifficult(new Set());
      setProgress({ studied: 0, total: enhancedCards.length });
      
      if (studyMode === 'shuffle') {
        shuffleCards(enhancedCards);
      }
    } catch (error) {
      console.error('Error generating flashcards:', error);
    }
    setLoading(false);
  };

  const shuffleCards = (cards: Flashcard[]) => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
  };

  const speakText = (text: string) => {
    if (!voiceEnabled) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
  };

  const flipCard = () => {
    setShowAnswer(!showAnswer);
    if (!showAnswer && voiceEnabled) {
      setTimeout(() => speakText(flashcards[currentIndex]?.answer || ''), 100);
    }
  };

  const nextCard = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
      updateProgress();
    } else if (studyMode === 'spaced') {
      // Restart with difficult cards
      const difficultCards = flashcards.filter(card => difficult.has(card.id || ''));
      if (difficultCards.length > 0) {
        setFlashcards(difficultCards);
        setCurrentIndex(0);
        setShowAnswer(false);
      }
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setShowAnswer(false);
    }
  };

  const markCard = (type: 'mastered' | 'difficult') => {
    const cardId = flashcards[currentIndex]?.id;
    if (!cardId) return;

    if (type === 'mastered') {
      setMastered(prev => new Set([...prev, cardId]));
      setDifficult(prev => {
        const newSet = new Set(prev);
        newSet.delete(cardId);
        return newSet;
      });
    } else {
      setDifficult(prev => new Set([...prev, cardId]));
      setMastered(prev => {
        const newSet = new Set(prev);
        newSet.delete(cardId);
        return newSet;
      });
    }
    
    setTimeout(() => nextCard(), 500);
  };

  const updateProgress = () => {
    setProgress(prev => ({
      ...prev,
      studied: Math.min(prev.studied + 1, prev.total)
    }));
  };

  const resetSession = () => {
    setFlashcards([]);
    setCurrentIndex(0);
    setShowAnswer(false);
    setMastered(new Set());
    setDifficult(new Set());
    setProgress({ studied: 0, total: 0 });
    setSessionStartTime(null);
  };

  const exportFlashcards = () => {
    if (flashcards.length === 0) return;
    
    const exportData = {
      topic,
      difficulty,
      cards: flashcards,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flashcards-${topic.replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getProgressPercentage = () => {
    return flashcards.length > 0 ? (progress.studied / progress.total) * 100 : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Creating your personalized flashcards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {!flashcards.length && (
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
              🃏 Smart Flashcards
            </h1>
            <p className="text-gray-600 text-lg">Master any topic with AI-powered adaptive flashcards</p>
          </div>
        )}

        {/* Setup Interface */}
        {!flashcards.length && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  📚 Flashcard Topic
                </label>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all text-lg"
                  placeholder="e.g., Spanish Vocabulary, Chemistry Formulas..."
                  onKeyPress={(e) => e.key === 'Enter' && generateCards()}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">🎮 Study Mode</label>
                  <select
                    value={studyMode}
                    onChange={(e) => setStudyMode(e.target.value as 'standard' | 'spaced' | 'shuffle')}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-green-500 transition-all"
                  >
                    <option value="standard">Standard</option>
                    <option value="spaced">Spaced Repetition</option>
                    <option value="shuffle">Shuffled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">🎯 Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-green-500 transition-all"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">⚙️ Features</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={voiceEnabled}
                        onChange={(e) => setVoiceEnabled(e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm">🔊 Voice</span>
                    </label>
                  </div>
                </div>
              </div>

              <button
                onClick={generateCards}
                disabled={!topic.trim()}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all transform hover:scale-105 text-lg"
              >
                🚀 Generate Flashcards
              </button>
            </div>
          </div>
        )}

        {/* Flashcard Interface */}
        {flashcards.length > 0 && (
          <>
            {/* Progress Header */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">🃏 {topic}</h1>
                  <p className="text-gray-600">
                    Card {currentIndex + 1} of {flashcards.length} • 
                    Mastered: {mastered.size} • Difficult: {difficult.size}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setAutoPlay(!autoPlay)}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      autoPlay ? 'border-green-500 bg-green-50 text-green-600' : 'border-gray-200 text-gray-400'
                    }`}
                  >
                    {autoPlay ? '⏸️' : '▶️'}
                  </button>
                  <button
                    onClick={exportFlashcards}
                    className="p-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                  >
                    📤
                  </button>
                  <button
                    onClick={resetSession}
                    className="p-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                  >
                    🏠
                  </button>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
            </div>

            {/* Flashcard */}
            <div className="perspective-1000 mb-6">
              <div 
                className={`relative w-full h-96 transition-transform duration-700 transform-style-preserve-3d cursor-pointer ${
                  showAnswer ? 'rotate-y-180' : ''
                }`}
                onClick={flipCard}
              >
                {/* Front of card */}
                <div className="absolute inset-0 w-full h-full backface-hidden">
                  <div className="bg-white rounded-3xl shadow-2xl p-8 h-full border border-gray-100 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-4">❓</div>
                      <h2 className="text-2xl font-semibold text-gray-800 leading-relaxed">
                        {flashcards[currentIndex]?.question}
                      </h2>
                      <p className="text-sm text-gray-500 mt-4">Click to reveal answer</p>
                    </div>
                  </div>
                </div>

                {/* Back of card */}
                <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-3xl shadow-2xl p-8 h-full border border-gray-100 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-4">💡</div>
                      <h2 className="text-2xl font-semibold leading-relaxed">
                        {flashcards[currentIndex]?.answer}
                      </h2>
                      {voiceEnabled && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            speakText(flashcards[currentIndex]?.answer || '');
                          }}
                          className="mt-4 p-2 bg-white bg-opacity-20 rounded-xl hover:bg-opacity-30 transition-all"
                        >
                          🔊 Play Audio
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Actions */}
            {showAnswer && (
              <div className="flex justify-center space-x-4 mb-6">
                <button
                  onClick={() => markCard('difficult')}
                  className="px-6 py-3 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-all transform hover:scale-105"
                >
                  😓 Still Learning
                </button>
                <button
                  onClick={() => markCard('mastered')}
                  className="px-6 py-3 bg-green-500 text-white rounded-2xl hover:bg-green-600 transition-all transform hover:scale-105"
                >
                  ✅ Got It!
                </button>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={prevCard}
                disabled={currentIndex === 0}
                className="px-6 py-3 bg-gray-100 text-gray-600 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-all"
              >
                ← Previous
              </button>
              
              <div className="flex space-x-2">
                {flashcards.map((_, index) => {
                  const cardId = flashcards[index]?.id || '';
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentIndex(index);
                        setShowAnswer(false);
                      }}
                      className={`w-3 h-3 rounded-full transition-all ${
                        index === currentIndex
                          ? 'bg-blue-500'
                          : mastered.has(cardId)
                          ? 'bg-green-400'
                          : difficult.has(cardId)
                          ? 'bg-red-400'
                          : 'bg-gray-300'
                      }`}
                    />
                  );
                })}
              </div>
              
              <button
                onClick={nextCard}
                disabled={currentIndex === flashcards.length - 1 && studyMode !== 'spaced'}
                className="px-6 py-3 bg-blue-600 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-all"
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>

      {/* CSS for 3D flip animation */}
      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
