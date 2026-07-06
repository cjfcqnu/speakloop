import type { ScoreBreakdown } from "../types";

const WORD_REGEXP = /[a-zA-Z']+/g;

function tokenize(text: string): string[] {
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

function fluencyFromDuration(referenceWords: string[], durationMs?: number): number {
  if (!durationMs || referenceWords.length === 0) {
    return 70;
  }

  // A spoken workplace-English sentence is usually near 135 words per minute.
  // This estimate is intentionally simple so the MVP can work offline.
  const expectedMs = referenceWords.length * 445;
  const ratio = durationMs / expectedMs;
  const penalty = Math.abs(1 - ratio) * 55;
  return clampScore(100 - penalty);
}

function buildSuggestion(score: number): string {
  if (score < 70) {
    return "建议先慢速跟读，重点补齐关键词和句子结尾。";
  }
  if (score < 85) {
    return "整体完成了，可以再练一次，让语速和停顿更自然。";
  }
  if (score < 92) {
    return "表现不错，下一轮可以尝试 1.25x 影子跟读。";
  }
  return "很稳，可以加入间隔复习，保持表达肌肉记忆。";
}

export function scorePractice(referenceText: string, transcript: string, durationMs?: number): ScoreBreakdown {
  const referenceWords = tokenize(referenceText);
  const spokenWords = tokenize(transcript);

  if (spokenWords.length === 0) {
    const baseScore = 72;
    return {
      score: baseScore,
      accuracyScore: 65,
      fluencyScore: fluencyFromDuration(referenceWords, durationMs),
      completenessScore: 65,
      suggestion: "当前浏览器没有提供可用识别文本，已按完成练习给基础分。",
    };
  }

  const overlap = wordOverlapScore(referenceWords, spokenWords);
  const ordered = sequenceScore(referenceWords, spokenWords);
  const accuracyScore = clampScore(overlap * 0.65 + ordered * 0.35);
  const keyWords = referenceWords.filter((word) => word.length > 3);
  const completenessScore = clampScore(wordOverlapScore(keyWords.length ? keyWords : referenceWords, spokenWords));
  const fluencyScore = fluencyFromDuration(referenceWords, durationMs);
  const score = clampScore(accuracyScore * 0.5 + fluencyScore * 0.25 + completenessScore * 0.25);

  return {
    score,
    accuracyScore,
    fluencyScore,
    completenessScore,
    suggestion: buildSuggestion(score),
  };
}
