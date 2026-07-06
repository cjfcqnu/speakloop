import type { DailyReview, Material, PracticeRecord } from "../types";
import { isSameDate, nowIso, toDateKey } from "./date";
import { deriveMistakeItems, getMaterialRecords } from "./mistakes";

function recordsForDate(records: PracticeRecord[], dateKey: string): PracticeRecord[] {
  return records.filter((record) => isSameDate(record.date, dateKey));
}

function average(records: PracticeRecord[]): number {
  if (records.length === 0) {
    return 0;
  }
  return Math.round(records.reduce((sum, record) => sum + record.score, 0) / records.length);
}

function firstPracticeDate(materialId: string, records: PracticeRecord[]): string | undefined {
  return getMaterialRecords(materialId, records)
    .map((record) => toDateKey(new Date(record.date)))
    .sort()[0];
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
  const averageScore = average(dayRecords);
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
  const weakScenarios = materials
    .filter((material) => recommendedMaterialIds.includes(material.id))
    .map((material) => material.scenario);
  const scenarioText = Array.from(new Set(weakScenarios)).slice(0, 2).join("和") || "重点表达";

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
    summaryText: `昨天你共练习 ${dayRecords.length} 句，平均分 ${averageScore}。${
      mistakeMaterialIds.length
        ? `有 ${mistakeMaterialIds.length} 句低于 70 分，建议今天先复习${scenarioText}类表达。`
        : "整体完成度不错，可以继续用影子跟读巩固自然度。"
    }你昨天收藏了 ${favoriteAddedCount} 个高频句，可以安排在今天反复跟读。`,
    createdAt: nowIso(),
  };
}
