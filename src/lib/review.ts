import type { ReviewSchedule } from "../types";
import { addDays, isOnOrBeforeToday, nowIso, toDateKey } from "./date";

const REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30];

export function isDueToday(schedule: ReviewSchedule | undefined): boolean {
  return Boolean(schedule && isOnOrBeforeToday(schedule.nextReviewDate));
}

export function updateReviewSchedule(
  materialId: string,
  score: number,
  previous?: ReviewSchedule,
): ReviewSchedule {
  const today = toDateKey();
  const previousLevel = previous?.reviewLevel ?? 0;
  const reviewLevel =
    score < 70 ? Math.max(1, previousLevel || 1) : Math.min(REVIEW_INTERVALS.length, previousLevel + 1);

  const intervalIndex = Math.max(0, reviewLevel - 1);
  const baseInterval = score < 70 ? 1 : REVIEW_INTERVALS[intervalIndex];
  const adjustedInterval = score >= 90 ? baseInterval + 1 : baseInterval;

  return {
    materialId,
    reviewLevel,
    nextReviewDate: addDays(today, adjustedInterval),
    lastReviewedAt: nowIso(),
    lastScore: score,
  };
}
