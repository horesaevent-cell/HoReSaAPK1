export type AiCoachMode =
  | 'ideas'
  | 'goals'
  | 'project'
  | 'reflection'
  | 'evaluation';

export type AiCoachSender = 'user' | 'assistant';

export interface AiCoachGoal {
  id: string;
  title: string;
  targetDate?: string;
  progress: number; // 0 à 100
  criterion: string;
}

export interface AiCoachMessage {
  id: string;
  sender: AiCoachSender;
  content: string;
  mode: AiCoachMode;
  reflectionQuestion?: string;
  createdAt: string;
}

export interface AiCoachPrivacyConsent {
  allowJournalAnalysis: boolean;
  updatedAt?: string;
}

export interface AiCoachRequestPayload {
  prompt: string;
  mode: AiCoachMode;
  goals: AiCoachGoal[];
  privacyConsent: AiCoachPrivacyConsent;
  journalExcerpts?: string[];
  history: Pick<AiCoachMessage, 'sender' | 'content' | 'mode'>[];
}

export interface AiCoachResponsePayload {
  reply: string;
  reflectionQuestion: string;
  suggestedNextStep: string;
  evaluatedScore?: number;
  usedJournalData: boolean;
  source: 'fastapi' | 'local-fallback';
}