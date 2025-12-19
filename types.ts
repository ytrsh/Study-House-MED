
export interface TodoTask {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: number;
  isUrgent?: boolean;
  isQuestion?: boolean;
  source: 'manual' | 'ai' | 'drive';
  category?: string;
  createdAt: number;
  // Spaced Repetition Fields
  repetitionLevel: number; // 0 (New) -> 5 (Mastered)
  lastReviewedAt?: number;
  nextReviewAt?: number; // Calculated or manual timestamp for review
  manualDate?: string; // YYYY-MM-DD for user overrides in Plan
}

export interface GeminiParsedTask {
  className: string;
  category?: string;
}

export interface StudyPlanConfig {
  startDate: string; // YYYY-MM-DD
  targetEndDate: string; // YYYY-MM-DD
}
