import type { DailyReview, Material, PracticeRecord, ScoreDimensions } from "../types";
import { isSameDate, nowIso, toDateKey } from "./date";
import { deriveMistakeItems, getMaterialRecords } from "./mistakes";
import { collectWrongWords } from "./statistics";
import { dimensionsFromRecord } from "./scoring";

const DIMENSION_LABELS: Record<keyof ScoreDimensions, string> = {
  pronunciationAccuracy: "pronunciation accuracy",
  fluency: "fluency",
  speed: "speed",
  pause: "pause control",
  completeness: "completeness",
  stress: "stress",
  intonation: "intonation",
  linkingWeakForms: "linking and weak forms",
};

function recordsForDate(records: PracticeRecord[], dateKey: string): PracticeRecord[] {
  return records.filter((record) => isSameDate(record.date, dateKey));
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function firstPracticeDate(materialId: string, records: PracticeRecord[]): string | undefined {
  return getMaterialRecords(materialId, records)
    .map((record) => toDateKey(new Date(record.date)))
    .sort()[0];
}

function dimensionAverages(records: PracticeRecord[]): ScoreDimensions {
  const dimensions = records.map(dimensionsFromRecord);
  return {
    pronunciationAccuracy: average(dimensions.map((item) => item.pronunciationAccuracy)),
    fluency: average(dimensions.map((item) => item.fluency)),
    speed: average(dimensions.map((item) => item.speed)),
    pause: average(dimensions.map((item) => item.pause)),
    completeness: average(dimensions.map((item) => item.completeness)),
    stress: average(dimensions.map((item) => item.stress)),
    intonation: average(dimensions.map((item) => item.intonation)),
    linkingWeakForms: average(dimensions.map((item) => item.linkingWeakForms)),
  };
}

function weakestDimension(dimensions: ScoreDimensions): keyof ScoreDimensions {
  return (Object.entries(dimensions) as [keyof ScoreDimensions, number][]).sort((a, b) => a[1] - b[1])[0][0];
}

function weakestScenario(materials: Material[], records: PracticeRecord[]): string | undefined {
  const materialMap = new Map(materials.map((material) => [material.id, material]));
  const groups = new Map<string, PracticeRecord[]>();

  records.forEach((record) => {
    const scenario = materialMap.get(record.materialId)?.scenario;
    if (scenario) {
      groups.set(scenario, [...(groups.get(scenario) ?? []), record]);
    }
  });

  return Array.from(groups.entries())
    .map(([scenario, scenarioRecords]) => ({
      scenario,
      averageScore: average(scenarioRecords.map((record) => record.score)),
      lowScoreCount: scenarioRecords.filter((record) => record.score < 70).length,
    }))
    .sort((a, b) => b.lowScoreCount - a.lowScoreCount || a.averageScore - b.averageScore)[0]?.scenario;
}

export function createDailyReview(
  dateKey: string,
  materials: Material[],
  records: PracticeRecord[],
): DailyReview | undefined {
  const dayRecords = recordsForDate(records, dateKey);
  if (dayRecords.length === 0) {
    return undefined;
  }

  const uniqueMaterialIds = Array.from(new Set(dayRecords.map((record) => record.materialId)));
  const learnedCount = uniqueMaterialIds.filter((materialId) => firstPracticeDate(materialId, records) === dateKey).length;
  const reviewedCount = dayRecords.filter((record) => record.isReview).length;
  const averageScore = average(dayRecords.map((record) => record.score));
  const sortedByScore = [...dayRecords].sort((a, b) => a.score - b.score);
  const lowest = sortedByScore[0];
  const highest = sortedByScore[sortedByScore.length - 1];
  const mistakeMaterialIds = Array.from(new Set(dayRecords.filter((record) => record.score < 70).map((record) => record.materialId)));
  const weakMaterials = Array.from(
    new Set(dayRecords.filter((record) => record.score < 85).map((record) => record.materialId)),
  );
  const favoriteAddedCount = materials.filter((material) => isSameDate(material.favoriteAddedAt, dateKey)).length;
  const mistakeItems = deriveMistakeItems(materials, records);
  const recommendedMaterialIds = Array.from(
    new Set([...mistakeMaterialIds, ...mistakeItems.slice(0, 4).map((item) => item.material.id), ...weakMaterials]),
  ).slice(0, 6);
  const dimensions = dimensionAverages(dayRecords);
  const weakestDimensionKey = weakestDimension(dimensions);
  const commonWrongWords = collectWrongWords(dayRecords, 6).map((item) => item.word);
  const weakScenario = weakestScenario(materials, dayRecords);
  const scenarioText = weakScenario ?? "workplace communication";
  const wrongWordText = commonWrongWords.length ? commonWrongWords.slice(0, 3).join(", ") : "key words";

  return {
    date: dateKey,
    practicedCount: dayRecords.length,
    learnedCount,
    reviewedCount,
    averageScore,
    weakMaterials,
    favoriteAddedCount,
    highestMaterialId: highest.materialId,
    highestScore: highest.score,
    lowestMaterialId: lowest.materialId,
    lowestScore: lowest.score,
    mistakeMaterialIds,
    recommendedMaterialIds,
    commonWrongWords,
    weakestScenario: weakScenario,
    weakestDimension: weakestDimensionKey,
    dimensionAverages: dimensions,
    summaryText: `Yesterday you practiced ${dayRecords.length} sentences with an average score of ${averageScore}. The weakest area was ${DIMENSION_LABELS[weakestDimensionKey]}, and the most unstable words were ${wrongWordText}. Today, start with ${scenarioText} and then review the suggested weak sentences.`,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}
