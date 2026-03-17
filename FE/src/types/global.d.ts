interface Window {
  global: Window;
}

// Shared quiz types
export interface Quiz {
  _id: string;
  title: string;
  description: string;
  ageGroups: string[];
  tags: string[];
  maxScore?: number;
  questionCount?: number;
  isActive?: boolean;
  createdAt?: string;
  [key: string]: unknown;
}

export interface QuestionOption {
  text: string;
  score: number;
}

export interface Question {
  _id: string;
  quizId: string;
  text: string;
  options: QuestionOption[];
  type: string;
  ageGroup: string;
  topic: string;
  difficulty: string;
  isActive?: boolean;
}
