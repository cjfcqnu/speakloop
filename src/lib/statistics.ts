import type { Material, PracticeRecord, ScoreDimensions } from "../types";
import { toDateKey } from "./date";
import { deriveMistakeItems } from "./mistakes";
import { dimensionsFromRecord, tokenize } from "./scoring";

type DateScore = {
  date: string;
  averageScore: number;
  count: number;
  dimensions: ScoreDimensions;
};

export type LearningStats = {
  streakDays: number;
  todayMinutes: number;
  totalAttempts: number;
  todaySentenceCount: number;
  weekSentenceCount: number;
  weekAverageScore: number;
  favoritesCount: number;
  mistakesCount: number;
  averageTrend: DateScore[];
  commonWrongWords: { word: string; count: number }[];
  weakestScenarios: { scenario: string; averageScore: number; lowScoreCount: number }[];
};

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function startOfDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysAgo(days: number): Date {
  const date = startOfDate(new Date());
  date.setDate(date.getDate() - days);
  return date;
}

function recordsOnDate(records: PracticeRecord[], dateKey: string): PracticeRecord[] {
  return records.filter((record) => toDateKey(new Date(record.date)) === dateKey);
}

function collectDateTrend(records: PracticeRecord[]): DateScore[] {
  const groups = new Map<string, PracticeRecord[]>();
  records.forEach((record) => {
    const key = toDateKey(new Date(record.date));
    groups.set(key, [...(groups.get(key) ?? []), record]);
  });

  return Array.from(groups.entries())
    .map(([date, dayRecords]) => {
      const dims = dayRecords.map(dimensionsFromRecord);
      return {
        date,
        count: dayRecords.length,
        averageScore: average(dayRecords.map((record) => record.score)),
        dimensions: {
          pronunciationAccuracy: average(dims.map((item) => item.pronunciationAccuracy)),
          fluency: average(dims.map((item) => item.fluency)),
          speed: average(dims.map((item) => item.speed)),
          pause: average(dims.map((item) => item.pause)),
          completeness: average(dims.map((item) => item.completeness)),
          stress: average(dims.map((item) => item.stress)),
          intonation: average(dims.map((item) => item.intonation)),
          linkingWeakForms: average(dims.map((item) => item.linkingWeakForms)),
        },
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14);
}

function calculateStreak(records: PracticeRecord[]): number {
  const practicedDates = new Set(records.map((record) => toDateKey(new Date(record.date))));
  let streak = 0;
  for (let dayOffset = 0; dayOffset < 365; dayOffset += 1) {
    const key = toDateKey(daysAgo(dayOffset));
    if (!practicedDates.has(key)) {
      break;
    }
    streak += 1;
  }
  return streak;
}

export function collectWrongWords(records: PracticeRecord[], limit = 8): { word: string; count: number }[] {
  const counts = new Map<string, number>();
  records.forEach((record) => {
    (record.wrongWords ?? record.missingWords ?? []).forEach((word) => {
      const normalized = word.toLowerCase();
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    });
  });
  return Array.from(counts.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
    .slice(0, limit);
}

function inferWrongWordsFromDiff(materials: Material[], records: PracticeRecord[], limit = 8) {
  const materialMap = new Map(materials.map((material) => [material.id, material]));
  const counts = new Map<string, number>();

  records.forEach((record) => {
    if (record.wrongWords?.length || !record.transcript) {
      return;
    }
    const material = materialMap.get(record.materialId);
    if (!material) {
      return;
    }
    const reference = tokenize(material.en);
    const spoken = new Set(tokenize(record.transcript));
    reference
      .filter((word) => word.length > 3 && !spoken.has(word))
      .forEach((word) => counts.set(word, (counts.get(word) ?? 0) + 1));
  });

  return Array.from(counts.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
    .slice(0, limit);
}

function weakestScenarios(materials: Material[], records: PracticeRecord[]) {
  const materialMap = new Map(materials.map((material) => [material.id, material]));
  const groups = new Map<string, PracticeRecord[]>();

  records.forEach((record) => {
    const scenario = materialMap.get(record.materialId)?.scenario;
    if (!scenario) {
      return;
    }
    groups.set(scenario, [...(groups.get(scenario) ?? []), record]);
  });

  return Array.from(groups.entries())
    .map(([scenario, scenarioRecords]) => ({
      scenario,
      averageScore: average(scenarioRecords.map((record) => record.score)),
      lowScoreCount: scenarioRecords.filter((record) => record.score < 70).length,
    }))
    .sort((a, b) => b.lowScoreCount - a.lowScoreCount || a.averageScore - b.averageScore)
    .slice(0, 5);
}

export function buildLearningStats(materials: Material[], records: PracticeRecord[]): LearningStats {
  const todayKey = toDateKey(new Date());
  const weekStart = daysAgo(6).getTime();
  const todayRecords = recordsOnDate(records, todayKey);
  const weekRecords = records.filter((record) => new Date(record.date).getTime() >= weekStart);
  const explicitWrongWords = collectWrongWords(records);

  return {
    streakDays: calculateStreak(records),
    todayMinutes: Math.round(todayRecords.reduce((sum, record) => sum + (record.durationMs ?? 0), 0) / 60000),
    totalAttempts: records.length,
    todaySentenceCount: new Set(todayRecords.map((record) => record.materialId)).size,
    weekSentenceCount: weekRecords.length,
    weekAverageScore: average(weekRecords.map((record) => record.score)),
    favoritesCount: materials.filter((material) => material.isFavorite).length,
    mistakesCount: deriveMistakeItems(materials, records).length,
    averageTrend: collectDateTrend(records),
    commonWrongWords: explicitWrongWords.length ? explicitWrongWords : inferWrongWordsFromDiff(materials, records),
    weakestScenarios: weakestScenarios(materials, records),
  };
}
