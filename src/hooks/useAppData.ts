import { useCallback, useEffect, useMemo, useState } from "react";
import { localDb } from "../lib/db";
import { nowIso, toDateKey, yesterdayKey } from "../lib/date";
import { createDailyReview } from "../lib/recap";
import { isDueToday, updateReviewSchedule } from "../lib/review";
import { createId } from "../lib/id";
import {
  loadSeedMaterials,
  mergeMaterialsByEnglish,
  normalizeMaterial,
  shouldAutoBackfillSeedMaterials,
} from "../lib/seedMaterials";
import { defaultPracticeSettings, loadPracticeSettings, savePracticeSettings } from "../lib/settings";
import type {
  AudioBlobRecord,
  DailyReview,
  Material,
  PracticeRecord,
  PracticeSettings,
  ReviewSchedule,
  ScoreBreakdown,
} from "../types";

const DATA_VERSION_KEY = "speakloop:data-version";
const SEED_BACKFILL_KEY = "speakloop:seed-materials-v2-backfilled";
const CURRENT_DATA_VERSION = "3";

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

function sortState(state: AppDataState): AppDataState {
  return {
    materials: state.materials.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    practiceRecords: state.practiceRecords.sort((a, b) => b.date.localeCompare(a.date)),
    reviewSchedules: state.reviewSchedules,
    dailyReviews: state.dailyReviews.sort((a, b) => b.date.localeCompare(a.date)),
  };
}

function migrateMaterial(material: Material, index: number): Material {
  return normalizeMaterial(material, index);
}

function migratePracticeRecord(record: PracticeRecord): PracticeRecord {
  const accuracy = record.pronunciationAccuracy ?? record.accuracyScore ?? record.score;
  const fluency = record.fluency ?? record.fluencyScore ?? record.score;
  const completeness = record.completeness ?? record.completenessScore ?? record.score;

  // Object-level migration only fills missing fields; it never clears or rewrites user data.
  return {
    ...record,
    pronunciationAccuracy: accuracy,
    fluency,
    speed: record.speed ?? fluency,
    pause: record.pause ?? fluency,
    completeness,
    stress: record.stress ?? accuracy,
    intonation: record.intonation ?? fluency,
    linkingWeakForms: record.linkingWeakForms ?? accuracy,
    wrongWords: record.wrongWords ?? record.missingWords ?? [],
    missingWords: record.missingWords ?? record.wrongWords ?? [],
    extraWords: record.extraWords ?? [],
    feedbackTips: record.feedbackTips ?? [],
    isEstimatedScore: Boolean(record.isEstimatedScore),
  };
}

async function rebuildDailyReviewForDate(
  dateKey: string,
  materials: Material[],
  records: PracticeRecord[],
): Promise<void> {
  const existing = await localDb.getDailyReview(dateKey);
  const rebuilt = createDailyReview(dateKey, materials, records);
  if (!rebuilt) {
    if (existing) {
      await localDb.deleteDailyReview(dateKey);
    }
    return;
  }
  await localDb.saveDailyReview({ ...rebuilt, viewedAt: existing?.viewedAt });
}

export function useAppData() {
  const [state, setState] = useState<AppDataState>(initialState);
  const [appSettings, setAppSettings] = useState<PracticeSettings>(() => {
    if (typeof window === "undefined") {
      return defaultPracticeSettings;
    }
    return loadPracticeSettings();
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      let materials = await localDb.getMaterials();
      if (materials.length === 0) {
        materials = await loadSeedMaterials();
        await localDb.saveMaterials(materials);
        if (materials.length >= 1000) {
          localStorage.setItem(SEED_BACKFILL_KEY, "true");
        }
      } else {
        const migrated = materials.map(migrateMaterial);
        if (JSON.stringify(migrated) !== JSON.stringify(materials)) {
          await localDb.saveMaterials(migrated);
          materials = migrated;
        }

        if (!localStorage.getItem(SEED_BACKFILL_KEY) && shouldAutoBackfillSeedMaterials(materials)) {
          const seedMaterials = await loadSeedMaterials();
          if (seedMaterials.length >= 1000) {
            const { additions } = mergeMaterialsByEnglish(materials, seedMaterials);
            if (additions.length) {
              await localDb.saveMaterials(additions);
              materials = [...materials, ...additions];
            }
            localStorage.setItem(SEED_BACKFILL_KEY, "true");
          }
        }
      }

      let practiceRecords = (await localDb.getPracticeRecords()).map(migratePracticeRecord);
      if (JSON.stringify(practiceRecords) !== JSON.stringify(await localDb.getPracticeRecords())) {
        await Promise.all(practiceRecords.map((record) => localDb.savePracticeRecord(record)));
      }

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

      localStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
      setAppSettings(loadPracticeSettings());
      setState(sortState({ materials, practiceRecords, reviewSchedules, dailyReviews }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read local SpeakLoop data.");
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
      await localDb.saveMaterials(materials.map(migrateMaterial));
      await load();
    },
    [load],
  );

  const importSeedMaterials = useCallback(async () => {
    const seedMaterials = await loadSeedMaterials();
    const current = await localDb.getMaterials();
    const { additions, duplicateCount } = mergeMaterialsByEnglish(current.map(migrateMaterial), seedMaterials);
    if (additions.length) {
      await localDb.saveMaterials(additions);
      await load();
    }
    return { importedCount: additions.length, duplicateCount, totalSeedCount: seedMaterials.length };
  }, [load]);

  const updateMaterial = useCallback(
    async (material: Material) => {
      await localDb.saveMaterial({ ...migrateMaterial(material, 0), updatedAt: nowIso() });
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
        try {
          await localDb.saveAudioBlob({ key: audioBlobKey, blob: audioBlob, createdAt: nowIso() });
        } catch (err) {
          console.info("Audio blob storage failed; practice record will still be saved.", err);
        }
      }

      const record: PracticeRecord = {
        id: createId("practice"),
        materialId: material.id,
        date: nowIso(),
        score: breakdown.score,
        accuracyScore: breakdown.accuracyScore,
        fluencyScore: breakdown.fluencyScore,
        completenessScore: breakdown.completenessScore,
        pronunciationAccuracy: breakdown.dimensions.pronunciationAccuracy,
        fluency: breakdown.dimensions.fluency,
        speed: breakdown.dimensions.speed,
        pause: breakdown.dimensions.pause,
        completeness: breakdown.dimensions.completeness,
        stress: breakdown.dimensions.stress,
        intonation: breakdown.dimensions.intonation,
        linkingWeakForms: breakdown.dimensions.linkingWeakForms,
        wrongWords: breakdown.wrongWords,
        missingWords: breakdown.missingWords,
        extraWords: breakdown.extraWords,
        feedbackTips: breakdown.feedbackTips,
        isEstimatedScore: breakdown.isEstimated,
        durationMs,
        transcript,
        audioBlobKey,
        isReview: isDueToday(previousSchedule),
      };

      const nextSchedule = updateReviewSchedule(material.id, breakdown.score, previousSchedule);
      await localDb.savePracticeRecord(record);
      await localDb.saveReviewSchedule(nextSchedule);
      await rebuildDailyReviewForDate(toDateKey(new Date(record.date)), state.materials, [...state.practiceRecords, record]);
      await load();
      return record;
    },
    [load, scheduleMap, state.materials, state.practiceRecords],
  );

  const deletePracticeRecord = useCallback(
    async (recordId: string) => {
      const record = state.practiceRecords.find((item) => item.id === recordId);
      if (!record) {
        return;
      }
      await localDb.deletePracticeRecord(record.id);
      if (record.audioBlobKey) {
        await localDb.deleteAudioBlob(record.audioBlobKey);
      }
      const nextRecords = state.practiceRecords.filter((item) => item.id !== recordId);
      await rebuildDailyReviewForDate(toDateKey(new Date(record.date)), state.materials, nextRecords);
      await load();
    },
    [load, state.materials, state.practiceRecords],
  );

  const getAudioBlob = useCallback(async (key: string): Promise<AudioBlobRecord | undefined> => {
    return localDb.getAudioBlob(key);
  }, []);

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

  const updatePracticeSettings = useCallback((next: PracticeSettings) => {
    setAppSettings(savePracticeSettings(next));
  }, []);

  return {
    ...state,
    appSettings,
    isLoading,
    error,
    scheduleMap,
    refresh: load,
    saveMaterials,
    importSeedMaterials,
    updateMaterial,
    toggleFavorite,
    dismissMistake,
    savePractice,
    deletePracticeRecord,
    getAudioBlob,
    markDailyReviewViewed,
    updatePracticeSettings,
  };
}
