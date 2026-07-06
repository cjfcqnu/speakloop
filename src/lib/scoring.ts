import type { ScoreBreakdown, ScoreDimensions } from "../types";

const WORD_REGEXP = /[a-zA-Z']+/g;
const WEAK_FORM_WORDS = new Set(["a", "an", "and", "of", "the", "to"]);
const LINKING_PHRASES = [
  "follow up",
  "check in",
  "work on",
  "set up",
  "get it",
  "got it",
  "this is",
  "that is",
  "an issue",
  "this issue",
  "need to",
  "like to",
  "have to",
  "has to",
  "going to",
  "want to",
];

export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(WORD_REGEXP) ?? []).map((word) => word.replace(/^'|'$/g, ""));
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function wordOverlapScore(referenceWords: string[], spokenWords: string[]): number {
  if (referenceWords.length === 0 || spokenWords.length === 0) {
    return 0;
  }

  const spokenCounts = new Map<string, number>();
  spokenWords.forEach((word) => spokenCounts.set(word, (spokenCounts.get(word) ?? 0) + 1));

  let matched = 0;
  referenceWords.forEach((word) => {
    const count = spokenCounts.get(word) ?? 0;
    if (count > 0) {
      matched += 1;
      spokenCounts.set(word, count - 1);
    }
  });

  return (matched / referenceWords.length) * 100;
}

function sequenceScore(referenceWords: string[], spokenWords: string[]): number {
  let cursor = 0;
  let orderedMatches = 0;

  referenceWords.forEach((word) => {
    const foundIndex = spokenWords.slice(cursor).findIndex((spoken) => spoken === word);
    if (foundIndex >= 0) {
      orderedMatches += 1;
      cursor += foundIndex + 1;
    }
  });

  return referenceWords.length ? (orderedMatches / referenceWords.length) * 100 : 0;
}

function diffWords(referenceWords: string[], spokenWords: string[]) {
  const spokenCounts = new Map<string, number>();
  spokenWords.forEach((word) => spokenCounts.set(word, (spokenCounts.get(word) ?? 0) + 1));

  const missingWords: string[] = [];
  referenceWords.forEach((word) => {
    const count = spokenCounts.get(word) ?? 0;
    if (count > 0) {
      spokenCounts.set(word, count - 1);
    } else if (!missingWords.includes(word)) {
      missingWords.push(word);
    }
  });

  const referenceCounts = new Map<string, number>();
  referenceWords.forEach((word) => referenceCounts.set(word, (referenceCounts.get(word) ?? 0) + 1));
  const extraWords: string[] = [];
  spokenWords.forEach((word) => {
    const count = referenceCounts.get(word) ?? 0;
    if (count > 0) {
      referenceCounts.set(word, count - 1);
    } else if (!extraWords.includes(word)) {
      extraWords.push(word);
    }
  });

  return { missingWords, extraWords, wrongWords: missingWords.slice(0, 8) };
}

function durationScores(referenceWords: string[], durationMs?: number) {
  if (!durationMs || referenceWords.length === 0) {
    return { fluency: 70, speed: 70, pause: 72 };
  }

  // Local heuristic only: workplace shadowing is usually around 125-150 wpm.
  const expectedMs = referenceWords.length * 445;
  const ratio = durationMs / expectedMs;
  const speedPenalty = Math.abs(1 - ratio) * 70;
  const speed = clampScore(100 - speedPenalty);
  const fluency = clampScore(100 - Math.abs(1 - ratio) * 50);
  const pause = clampScore(ratio > 1.55 ? 62 : ratio < 0.55 ? 68 : 88 - Math.abs(1 - ratio) * 20);
  return { fluency, speed, pause };
}

function linkingWeakFormsScore(referenceText: string, spokenWords: string[], completeness: number): number {
  const lower = referenceText.toLowerCase();
  const hasLinking = LINKING_PHRASES.some((phrase) => lower.includes(phrase));
  const weakFormCount = spokenWords.filter((word) => WEAK_FORM_WORDS.has(word)).length;
  const baseline = hasLinking ? 82 : 76;
  return clampScore(baseline + Math.min(12, weakFormCount * 2) + (completeness - 80) * 0.15);
}

function stressScore(referenceWords: string[], spokenWords: string[], completeness: number): number {
  const important = referenceWords.filter((word) => word.length > 5);
  if (important.length === 0) {
    return clampScore(76 + completeness * 0.18);
  }
  const importantCoverage = wordOverlapScore(important, spokenWords);
  return clampScore(importantCoverage * 0.7 + completeness * 0.3);
}

function intonationScore(ordered: number, fluency: number, pause: number): number {
  return clampScore(ordered * 0.45 + fluency * 0.35 + pause * 0.2);
}

function buildSuggestion(score: number, missingWords: string[], isEstimated: boolean): string {
  if (isEstimated) {
    return "当前分数为本地估算分。建议重点看下方发音提示，再录一遍获得更稳定的对比。";
  }
  if (score < 70) {
    return `建议先慢速跟读，补齐 ${missingWords.slice(0, 3).join(", ") || "关键词"}，再追求语速。`;
  }
  if (score < 85) {
    return "整体完成了，可以再练一次，让停顿、连读和弱读更自然。";
  }
  if (score < 92) {
    return "表现不错，下一轮可以关注重音和语调，让表达更像真实会议发言。";
  }
  return "很稳，可以进入下一句，并把这句加入间隔复习保持肌肉记忆。";
}

function calculateTotal(dimensions: ScoreDimensions): number {
  return clampScore(
    dimensions.pronunciationAccuracy * 0.3 +
      dimensions.fluency * 0.15 +
      dimensions.speed * 0.1 +
      dimensions.pause * 0.1 +
      dimensions.completeness * 0.15 +
      dimensions.stress * 0.1 +
      dimensions.intonation * 0.05 +
      dimensions.linkingWeakForms * 0.05,
  );
}

export function scorePractice(referenceText: string, transcript: string, durationMs?: number): ScoreBreakdown {
  const referenceWords = tokenize(referenceText);
  const spokenWords = tokenize(transcript);
  const isEstimated = spokenWords.length === 0;
  const duration = durationScores(referenceWords, durationMs);

  if (isEstimated) {
    const dimensions: ScoreDimensions = {
      pronunciationAccuracy: 62,
      fluency: duration.fluency,
      speed: duration.speed,
      pause: duration.pause,
      completeness: 62,
      stress: 60,
      intonation: 66,
      linkingWeakForms: 64,
    };
    return {
      score: calculateTotal(dimensions),
      accuracyScore: dimensions.pronunciationAccuracy,
      fluencyScore: dimensions.fluency,
      completenessScore: dimensions.completeness,
      dimensions,
      wrongWords: [],
      missingWords: [],
      extraWords: [],
      feedbackTips: [
        "No reliable speech transcript was available, so this is an estimated local score.",
        "Replay the original sentence and compare your rhythm before recording again.",
      ],
      isEstimated: true,
      suggestion: buildSuggestion(calculateTotal(dimensions), [], true),
    };
  }

  const overlap = wordOverlapScore(referenceWords, spokenWords);
  const ordered = sequenceScore(referenceWords, spokenWords);
  const { missingWords, extraWords, wrongWords } = diffWords(referenceWords, spokenWords);
  const keyWords = referenceWords.filter((word) => word.length > 3);
  const completeness = clampScore(wordOverlapScore(keyWords.length ? keyWords : referenceWords, spokenWords));
  const pronunciationAccuracy = clampScore(overlap * 0.6 + ordered * 0.4);
  const stress = stressScore(referenceWords, spokenWords, completeness);
  const linkingWeakForms = linkingWeakFormsScore(referenceText, spokenWords, completeness);
  const intonation = intonationScore(ordered, duration.fluency, duration.pause);
  const dimensions: ScoreDimensions = {
    pronunciationAccuracy,
    fluency: duration.fluency,
    speed: duration.speed,
    pause: duration.pause,
    completeness,
    stress,
    intonation,
    linkingWeakForms,
  };
  const score = calculateTotal(dimensions);

  return {
    score,
    accuracyScore: pronunciationAccuracy,
    fluencyScore: duration.fluency,
    completenessScore: completeness,
    dimensions,
    wrongWords,
    missingWords,
    extraWords,
    feedbackTips: [
      wrongWords.length ? `Missing or unstable words: ${wrongWords.slice(0, 5).join(", ")}.` : "Main words were covered.",
      duration.speed < 72 ? "Speed looks unstable; try one slower shadowing pass." : "Speed is within a usable range.",
      linkingWeakForms < 78 ? "Watch linking and weak forms in short function words." : "Linking and weak forms look acceptable.",
    ],
    isEstimated: false,
    suggestion: buildSuggestion(score, missingWords, false),
  };
}

export function dimensionsFromRecord(record: { score: number } & Partial<ScoreDimensions>): ScoreDimensions {
  const fallback = clampScore(record.score);
  return {
    pronunciationAccuracy: record.pronunciationAccuracy ?? fallback,
    fluency: record.fluency ?? fallback,
    speed: record.speed ?? fallback,
    pause: record.pause ?? fallback,
    completeness: record.completeness ?? fallback,
    stress: record.stress ?? fallback,
    intonation: record.intonation ?? fallback,
    linkingWeakForms: record.linkingWeakForms ?? fallback,
  };
}
