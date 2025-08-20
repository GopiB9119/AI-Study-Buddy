export type QuizQ = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  id?: string;
};

export type QuestionWithExplanation = {
  question: string;
  explanation: string;
  id?: string;
};

export type UniversalQuestion = {
  question: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  id?: string;
  type: 'mcq' | 'explanation' | 'interactive';
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
  userAnswer?: string;
  isCorrect?: boolean;
  timeSpent?: number;
};

export type StudySession = {
  id: string;
  topic: string;
  questions: UniversalQuestion[];
  score?: number;
  totalTime: number;
  completedAt: Date;
  mistakes: UniversalQuestion[];
};

export type UserProgress = {
  totalSessions: number;
  averageScore: number;
  weakAreas: string[];
  strongAreas: string[];
  studyStreak: number;
  totalStudyTime: number;
};
