import type { Material, MistakeItem, MistakeStatus, PracticeRecord } from "../types";

function latestFirst(records: PracticeRecord[]): PracticeRecord[] {
  return [...records].sort((a, b) => b.date.localeCompare(a.date));
}

function getStatus(latestScore: number): MistakeStatus {
  if (latestScore < 70) {
    return "mistake";
  }
  if (latestScore < 85) {
    return "needsWork";
  }
  return "mastered";
}

function highScoreStreak(records: PracticeRecord[]): number {
  let streak = 0;
  for (const record of latestFirst(records)) {
    if (record.score >= 90) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

export function getMaterialRecords(materialId: string, records: PracticeRecord[]): PracticeRecord[] {
  return records.filter((record) => record.materialId === materialId);
}

export function getLatestRecord(materialId: string, records: PracticeRecord[]): PracticeRecord | undefined {
  return latestFirst(getMaterialRecords(materialId, records))[0];
}

export function deriveMistakeItems(materials: Material[], records: PracticeRecord[]): MistakeItem[] {
  return materials.flatMap((material) => {
    const materialRecords = getMaterialRecords(material.id, records);
    if (materialRecords.length === 0) {
      return [];
    }

    const ordered = latestFirst(materialRecords);
    const latest = ordered[0];
    const lowestScore = Math.min(...materialRecords.map((record) => record.score));
    const streak = highScoreStreak(materialRecords);
    const dismissedAfterLatestLow =
      material.mistakeDismissedAt &&
      latest.score < 85 &&
      new Date(material.mistakeDismissedAt).getTime() > new Date(latest.date).getTime();

    if (dismissedAfterLatestLow || streak >= 3) {
      return [];
    }

    if (latest.score < 85 || lowestScore < 70) {
      return [
        {
          material,
          latestScore: latest.score,
          lowestScore,
          practiceCount: materialRecords.length,
          highScoreStreak: streak,
          status: getStatus(latest.score),
        },
      ];
    }

    return [];
  });
}
