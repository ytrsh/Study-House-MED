
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
  repetitionLevel: number; // 0, 1, 2, 3, 4, 5...
  lastReviewedAt?: number;
  nextReviewAt?: number; // Timestamp for when the task is due for study
}

export interface GeminiParsedTask {
  className: string;
  category?: string;
}

export interface DailyStat {
  date: string; // YYYY-MM-DD
  count: number;
}
