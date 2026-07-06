export type Difficulty = "B1" | "B2" | "C1" | "C2";

export type PronunciationNotes = {
  stressWords: string[];
  linking: { text: string; note: string }[];
  weakForms: { text: string; note: string }[];
  difficultSounds: { text: string; ipa?: string; note: string }[];
  pauses: { after: string; note: string }[];
};

export type Material = {
  id: string;
  zh: string;
  en: string;
  scenario: string;
  difficulty: Difficulty;
  tags: string[];
  source?: string;
  isFavorite: boolean;
  favoriteAddedAt?: string;
  mistakeDismissedAt?: string;
  pronunciationNotes?: PronunciationNotes;
  createdAt: string;
  updatedAt: string;
};

export type ScoreDimensions = {
  pronunciationAccuracy: number;
  fluency: number;
  speed: number;
  pause: number;
  completeness: number;
  stress: number;
  intonation: number;
  linkingWeakForms: number;
};

export type PracticeRecord = {
  id: string;
  materialId: string;
  date: string;
  score: number;
  accuracyScore?: number;
  fluencyScore?: number;
  completenessScore?: number;
  durationMs?: number;
  transcript?: string;
  audioBlobKey?: string;
  isReview?: boolean;
  pronunciationAccuracy?: number;
  fluency?: number;
  speed?: number;
  pause?: number;
  completeness?: number;
  stress?: number;
  intonation?: number;
  linkingWeakForms?: number;
  wrongWords?: string[];
  missingWords?: string[];
  extraWords?: string[];
  feedbackTips?: string[];
  isEstimatedScore?: boolean;
};

export type ReviewSchedule = {
  materialId: string;
  nextReviewDate: string;
  reviewLevel: number;
  lastReviewedAt?: string;
  lastScore?: number;
};

export type DailyReview = {
  date: string;
  practicedCount: number;
  learnedCount: number;
  reviewedCount: number;
  averageScore: number;
  weakMaterials: string[];
  favoriteAddedCount: number;
  summaryText: string;
  createdAt: string;
  highestMaterialId?: string;
  highestScore?: number;
  lowestMaterialId?: string;
  lowestScore?: number;
  mistakeMaterialIds?: string[];
  recommendedMaterialIds?: string[];
  viewedAt?: string;
  commonWrongWords?: string[];
  weakestScenario?: string;
  weakestDimension?: keyof ScoreDimensions;
  dimensionAverages?: Partial<ScoreDimensions>;
  isStale?: boolean;
  updatedAt?: string;
};

export type AudioBlobRecord = {
  key: string;
  blob: Blob;
  createdAt: string;
};

export type MaterialFilters = {
  query: string;
  scenario: string;
  difficulty: "" | Difficulty;
  tag: string;
  favoritesOnly: boolean;
  mistakesOnly: boolean;
  dueTodayOnly: boolean;
};

export type MistakeStatus = "mistake" | "needsWork" | "mastered";

export type MistakeItem = {
  material: Material;
  latestScore: number;
  lowestScore: number;
  practiceCount: number;
  highScoreStreak: number;
  status: MistakeStatus;
};

export type ScoreBreakdown = {
  score: number;
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  dimensions: ScoreDimensions;
  wrongWords: string[];
  missingWords: string[];
  extraWords: string[];
  feedbackTips: string[];
  isEstimated: boolean;
  suggestion: string;
};

export type PracticeSettings = {
  autoNextEnabled: boolean;
  targetScore: number;
  maxAttemptsPerSentence: number;
  autoAdvanceDelaySeconds: number;
};

export type ImportPreviewItem = {
  id: string;
  zh: string;
  en: string;
  scenario: string;
  difficulty: Difficulty;
  tags: string[];
  source: string;
  isValid: boolean;
  error?: string;
};

export type BrowserCapabilities = {
  speechSynthesis: boolean;
  mediaRecorder: boolean;
  speechRecognition: boolean;
  serviceWorker: boolean;
  indexedDb: boolean;
};
