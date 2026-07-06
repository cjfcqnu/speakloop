import type { PracticeSettings } from "../types";

const SETTINGS_KEY = "speakloop:practice-settings:v2";

export const defaultPracticeSettings: PracticeSettings = {
  autoNextEnabled: true,
  targetScore: 90,
  maxAttemptsPerSentence: 3,
  autoAdvanceDelaySeconds: 2,
};

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.round(parsed)));
}

export function loadPracticeSettings(): PracticeSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<PracticeSettings>) : {};
    return {
      autoNextEnabled:
        typeof parsed.autoNextEnabled === "boolean"
          ? parsed.autoNextEnabled
          : defaultPracticeSettings.autoNextEnabled,
      targetScore: clampNumber(parsed.targetScore, defaultPracticeSettings.targetScore, 70, 100),
      maxAttemptsPerSentence: clampNumber(
        parsed.maxAttemptsPerSentence,
        defaultPracticeSettings.maxAttemptsPerSentence,
        1,
        8,
      ),
      autoAdvanceDelaySeconds: clampNumber(
        parsed.autoAdvanceDelaySeconds,
        defaultPracticeSettings.autoAdvanceDelaySeconds,
        1,
        5,
      ),
    };
  } catch {
    return defaultPracticeSettings;
  }
}

export function savePracticeSettings(settings: PracticeSettings): PracticeSettings {
  const next = {
    autoNextEnabled: settings.autoNextEnabled,
    targetScore: clampNumber(settings.targetScore, defaultPracticeSettings.targetScore, 70, 100),
    maxAttemptsPerSentence: clampNumber(
      settings.maxAttemptsPerSentence,
      defaultPracticeSettings.maxAttemptsPerSentence,
      1,
      8,
    ),
    autoAdvanceDelaySeconds: clampNumber(
      settings.autoAdvanceDelaySeconds,
      defaultPracticeSettings.autoAdvanceDelaySeconds,
      1,
      5,
    ),
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  return next;
}
