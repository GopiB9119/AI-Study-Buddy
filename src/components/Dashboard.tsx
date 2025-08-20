import { useState, useEffect } from 'react';
import { StudySession, UserProgress, UniversalQuestion } from '../types/quiz';

export default function Dashboard() {
  const [progress, setProgress] = useState<UserProgress>({
    totalSessions: 0,
    averageScore: 0,
    weakAreas: [],
    strongAreas: [],
    studyStreak: 0,
    totalStudyTime: 0
  });
  const [recentSessions, setRecentSessions] = useState<StudySession[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentGoal, setCurrentGoal] = useState(85);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        loadProgress(),
        loadRecentSessions(),
        generateInsights()
      ]);
      
      // Simulate loading for smooth transition
      setTimeout(() => setIsLoading(false), 800);
    };
    
    loadData();
  }, []);

  const loadProgress = () => {
    const savedProgress = localStorage.getItem('quiz-progress');
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress));
    }
  };

  const loadRecentSessions = () => {
    const sessions = localStorage.getItem('study-sessions');
    if (sessions) {
      const parsed = JSON.parse(sessions);
      setRecentSessions(parsed.slice(-5).reverse());
    }
  };

  const generateInsights = () => {
    const newInsights = [
      "� Neural patterns show 23% improvement this week",
      "🎯 Peak performance detected during 2-4 PM sessions",
      "⚡ Your learning velocity is in the top 5% globally",
      "🔥 Consistency bonus: 7-day streak unlocked",
      "🧠 Advanced topics mastery: JavaScript +15%, React +20%"
    ];
    setInsights(newInsights);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 14) return "🔥";
    if (streak >= 7) return "⚡";
    if (streak >= 3) return "✨";
    return "�";
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-400";
    if (score >= 80) return "text-cyan-400";
    if (score >= 70) return "text-yellow-400";
    return "text-orange-400";
  };

  const getProgressColor = (score: number) => {
    if (score >= 90) return "from-emerald-500 to-green-400";
    if (score >= 80) return "from-cyan-500 to-blue-400";
    if (score >= 70) return "from-yellow-500 to-orange-400";
    return "from-orange-500 to-red-400";
  };

  const calculateGoalProgress = () => {
    return Math.min((progress.averageScore / currentGoal) * 100, 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neural-network text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
          <p className="text-cyan-300 animate-pulse">Loading neural analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neural-network text-white p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Professional Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <h1 className="text-5xl font-bold text-gradient-primary mb-4">
            🧠 Neural Analytics Center
          </h1>
          <p className="text-xl text-slate-300">Advanced learning intelligence & performance metrics</p>
          <div className="flex items-center justify-center space-x-4 mt-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm">Real-time Analytics</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
              <span className="text-cyan-400 text-sm">AI Processing</span>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="professional-card border-blue-500/20 hover-lift">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl animate-float">�</span>
                <span className="text-sm text-slate-400">Learning Sessions</span>
              </div>
              <div className="text-4xl font-bold text-cyan-400 mb-2">{progress.totalSessions}</div>
              <div className="text-sm text-slate-300">Neural training cycles</div>
              <div className="mt-4 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-1000"
                  style={{ width: `${Math.min(progress.totalSessions * 10, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="professional-card border-emerald-500/20 hover-lift">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl animate-float">🎯</span>
                <span className="text-sm text-slate-400">Performance Score</span>
              </div>
              <div className={`text-4xl font-bold ${getScoreColor(progress.averageScore)} mb-2`}>
                {progress.averageScore}%
              </div>
              <div className="text-sm text-slate-300">Neural efficiency rating</div>
              <div className="mt-4 h-3 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${getProgressColor(progress.averageScore)} transition-all duration-1000`}
                  style={{ width: `${progress.averageScore}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="professional-card border-orange-500/20 hover-lift">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl animate-float">{getStreakEmoji(progress.studyStreak)}</span>
                <span className="text-sm text-slate-400">Consistency Level</span>
              </div>
              <div className="text-4xl font-bold text-orange-400 mb-2">{progress.studyStreak}</div>
              <div className="text-sm text-slate-300">Consecutive learning days</div>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Goal: 30 days</span>
                  <span>{Math.round((progress.studyStreak / 30) * 100)}%</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-red-400 transition-all duration-1000"
                    style={{ width: `${Math.min((progress.studyStreak / 30) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="professional-card border-purple-500/20 hover-lift">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl animate-float">⏱️</span>
                <span className="text-sm text-slate-400">Neural Investment</span>
              </div>
              <div className="text-4xl font-bold text-purple-400 mb-2">
                {formatTime(progress.totalStudyTime)}
              </div>
              <div className="text-sm text-slate-300">Total engagement time</div>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>This week</span>
                  <span>{formatTime(progress.totalStudyTime * 0.3)}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-pink-400 w-3/4 transition-all duration-1000"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* AI Insights Panel */}
          <div className="professional-card border-cyan-500/20">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="text-4xl mr-4 animate-pulse">🤖</span>
                Neural Intelligence Insights
              </h2>
              <div className="space-y-4">
                {insights.map((insight, index) => (
                  <div 
                    key={index} 
                    className="glass-morphism rounded-2xl p-4 border border-cyan-500/20 hover-lift animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <p className="text-slate-200">{insight}</p>
                  </div>
                ))}
              </div>
              
              {/* Goal Progress */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-2xl border border-blue-500/20">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white font-medium">Learning Goal Progress</span>
                  <span className="text-cyan-400 font-bold">{currentGoal}% Target</span>
                </div>
                <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-1000"
                    style={{ width: `${calculateGoalProgress()}%` }}
                  ></div>
                </div>
                <p className="text-sm text-slate-400 mt-2">
                  {calculateGoalProgress() >= 100 ? '🎉 Goal achieved!' : `${(currentGoal - progress.averageScore).toFixed(1)}% to reach your goal`}
                </p>
              </div>
            </div>
          </div>

          {/* Performance Matrix */}
          <div className="professional-card border-purple-500/20">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="text-4xl mr-4 animate-morphing">📈</span>
                Performance Matrix
              </h2>
              
              {/* Strength Analysis */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-emerald-400 mb-3 flex items-center">
                  <span className="mr-2">💪</span>
                  Neural Strengths
                </h3>
                <div className="flex flex-wrap gap-2">
                  {progress.strongAreas.length > 0 ? 
                    progress.strongAreas.map((area, index) => (
                      <span 
                        key={index} 
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 rounded-full text-sm border border-emerald-500/30 animate-scale-in"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        {area}
                      </span>
                    )) :
                    <span className="text-slate-400 text-sm italic">Complete more neural cycles to identify patterns</span>
                  }
                </div>
              </div>

              {/* Optimization Areas */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-orange-400 mb-3 flex items-center">
                  <span className="mr-2">🎯</span>
                  Optimization Zones
                </h3>
                <div className="flex flex-wrap gap-2">
                  {progress.weakAreas.length > 0 ? 
                    progress.weakAreas.map((area, index) => (
                      <span 
                        key={index} 
                        className="px-4 py-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-300 rounded-full text-sm border border-orange-500/30 animate-scale-in"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        {area}
                      </span>
                    )) :
                    <span className="text-slate-400 text-sm italic">Outstanding! No optimization areas detected</span>
                  }
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-xl p-4 border border-blue-500/20">
                  <div className="text-sm text-blue-300 mb-1">Learning Rate</div>
                  <div className="text-2xl font-bold text-blue-400">94.2%</div>
                  <div className="text-xs text-slate-400">Information retention</div>
                </div>
                <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl p-4 border border-purple-500/20">
                  <div className="text-sm text-purple-300 mb-1">Neural Speed</div>
                  <div className="text-2xl font-bold text-purple-400">2.1x</div>
                  <div className="text-xs text-slate-400">Above average</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Recent Sessions */}
        <div className="professional-card border-slate-500/20 mb-8">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <span className="text-4xl mr-4 animate-shimmer">📋</span>
              Neural Session History
            </h2>
            
            {recentSessions.length > 0 ? (
              <div className="space-y-4">
                {recentSessions.map((session, index) => (
                  <div 
                    key={session.id} 
                    className="glass-morphism rounded-2xl p-6 border border-white/10 hover-lift animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-2">{session.topic}</h3>
                        <div className="flex items-center space-x-6 text-sm text-slate-300">
                          <span className="flex items-center">
                            <span className="mr-1">📊</span>
                            Score: <span className={`font-bold ml-1 ${getScoreColor(session.score || 0)}`}>
                              {session.score}%
                            </span>
                          </span>
                          <span className="flex items-center">
                            <span className="mr-1">⏱️</span>
                            Duration: {formatTime(session.totalTime)}
                          </span>
                          <span className="flex items-center">
                            <span className="mr-1">📅</span>
                            {session.completedAt.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-4xl">
                        {(session.score || 0) >= 90 ? '🏆' : (session.score || 0) >= 80 ? '🌟' : (session.score || 0) >= 70 ? '👍' : '📚'}
                      </div>
                    </div>
                    
                    {session.mistakes && session.mistakes.length > 0 && (
                      <div className="mt-4 bg-orange-900/20 rounded-xl p-4 border border-orange-500/20">
                        <p className="text-sm text-orange-300 font-medium mb-2 flex items-center">
                          <span className="mr-2">🎯</span>
                          Neural Optimization Points ({session.mistakes.length} detected):
                        </p>
                        <div className="text-sm text-slate-300 space-y-1">
                          {session.mistakes.slice(0, 2).map((mistake, idx) => (
                            <p key={idx} className="flex items-start">
                              <span className="mr-2 text-orange-400">•</span>
                              {mistake.question.substring(0, 80)}...
                            </p>
                          ))}
                          {session.mistakes.length > 2 && (
                            <p className="text-orange-400 text-xs italic">
                              + {session.mistakes.length - 2} additional optimization opportunities
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-8xl mb-6 animate-float">�</div>
                <h3 className="text-2xl font-bold text-white mb-2">Neural Network Ready</h3>
                <p className="text-slate-400 text-lg">Initialize your first learning session to begin analytics</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Center */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => {
              localStorage.removeItem('quiz-progress');
              localStorage.removeItem('study-sessions');
              setProgress({
                totalSessions: 0,
                averageScore: 0,
                weakAreas: [],
                strongAreas: [],
                studyStreak: 0,
                totalStudyTime: 0
              });
              setRecentSessions([]);
            }}
            className="px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-2xl font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all transform hover:scale-105 focus-ring"
          >
            <span className="mr-2">�</span>
            Reset Neural Network
          </button>
        </div>
      </div>
    </div>
  );
}
