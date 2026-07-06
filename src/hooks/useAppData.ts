import { useCallback, useEffect, useMemo, useState } from "react";
import { sampleMaterials } from "../data/sampleMaterials";
import { localDb } from "../lib/db";
import { nowIso, yesterdayKey } from "../lib/date";
import { createDailyReview } from "../lib/recap";
import { isDueToday, updateReviewSchedule } from "../lib/review";
import { createId } from "../lib/id";
import type { DailyReview, Material, PracticeRecord, ReviewSchedule, ScoreBreakdown } from "../types";

type AppDataState = {
  materials: Material[];
  practiceRecords: PracticeRecord[];
  reviewSchedules: ReviewSchedule[];
  dailyReviews: DailyReview[];
};

type SavePracticeInput = {
  material: Material;
  breakdown: ScoreBreakdown;
  transcript?: string;
  durationMs?: number;
  audioBlob?: Blob | null;
};

const initialState: AppDataState = {
  materials: [],
  practiceRecords: [],
  reviewSchedules: [],
  dailyReviews: [],
};

export function useAppData() {
  const [state, setState] = useState<AppDataState>(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      let materials = await localDb.getMaterials();
      if (materials.length === 0) {
        await localDb.saveMaterials(sampleMaterials);
        materials = sampleMaterials;
      }

      const practiceRecords = await localDb.getPracticeRecords();
      const reviewSchedules = await localDb.getReviewSchedules();
      let dailyReviews = await localDb.getDailyReviews();
      const yesterday = yesterdayKey();
      const hasYesterdayRecords = practiceRecords.some((record) => record.date.startsWith(yesterday));
      const hasYesterdayReview = dailyReviews.some((review) => review.date === yesterday);

      if (hasYesterdayRecords && !hasYesterdayReview) {
        const review = createDailyReview(yesterday, materials, practiceRecords);
        if (review) {
          await localDb.saveDailyReview(review);
          dailyReviews = await localDb.getDailyReviews();
        }
      }

      setState({
        materials: materials.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        practiceRecords: practiceRecords.sort((a, b) => b.date.localeCompare(a.date)),
        reviewSchedules,
        dailyReviews: dailyReviews.sort((a, b) => b.date.localeCompare(a.date)),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "读取本地数据失败。");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const scheduleMap = useMemo(() => {
    return new Map(state.reviewSchedules.map((schedule) => [schedule.materialId, schedule]));
  }, [state.reviewSchedules]);

  const saveMaterials = useCallback(
    async (materials: Material[]) => {
      await localDb.saveMaterials(materials);
      await load();
    },
    [load],
  );

  const updateMaterial = useCallback(
    async (material: Material) => {
      await localDb.saveMaterial({ ...material, updatedAt: nowIso() });
      await load();
    },
    [load],
  );

  const toggleFavorite = useCallback(
    async (materialId: string) => {
      const material = state.materials.find((item) => item.id === materialId);
      if (!material) {
        return;
      }
      const isFavorite = !material.isFavorite;
      await updateMaterial({
        ...material,
        isFavorite,
        favoriteAddedAt: isFavorite ? nowIso() : material.favoriteAddedAt,
      });
    },
    [state.materials, updateMaterial],
  );

  const dismissMistake = useCallback(
    async (materialId: string) => {
      const material = state.materials.find((item) => item.id === materialId);
      if (!material) {
        return;
      }
      await updateMaterial({ ...material, mistakeDismissedAt: nowIso() });
    },
    [state.materials, updateMaterial],
  );

  const savePractice = useCallback(
    async ({ material, breakdown, transcript, durationMs, audioBlob }: SavePracticeInput) => {
      const previousSchedule = scheduleMap.get(material.id);
      const audioBlobKey = audioBlob ? createId("audio") : undefined;
      if (audioBlob && audioBlobKey) {
        await localDb.saveAudioBlob({ key: audioBlobKey, blob: audioBlob, createdAt: nowIso() });
      }

      const record: PracticeRecord = {
        id: createId("practice"),
        materialId: material.id,
        date: nowIso(),
        score: breakdown.score,
        accuracyScore: breakdown.accuracyScore,
        fluencyScore: breakdown.fluencyScore,
        completenessScore: breakdown.completenessScore,
        durationMs,
        transcript,
        audioBlobKey,
        isReview: isDueToday(previousSchedule),
      };

      const nextSchedule = updateReviewSchedule(material.id, breakdown.score, previousSchedule);
      await localDb.savePracticeRecord(record);
      await localDb.saveReviewSchedule(nextSchedule);
      await load();
      return record;
    },
    [load, scheduleMap],
  );

  const markDailyReviewViewed = useCallback(
    async (date: string) => {
      const review = state.dailyReviews.find((item) => item.date === date);
      if (!review) {
        return;
      }
      await localDb.saveDailyReview({ ...review, viewedAt: nowIso() });
      await load();
    },
    [load, state.dailyReviews],
  );

  return {
    ...state,
    isLoading,
    error,
    scheduleMap,
    refresh: load,
    saveMaterials,
    updateMaterial,
    toggleFavorite,
    dismissMistake,
    savePractice,
    markDailyReviewViewed,
  };
}
