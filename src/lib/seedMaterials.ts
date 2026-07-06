import { sampleMaterials } from "../data/sampleMaterials";
import type { Material } from "../types";
import { nowIso } from "./date";
import { generatePronunciationNotes } from "./pronunciation";

type SeedMaterial = Omit<Material, "createdAt" | "updatedAt" | "isFavorite"> &
  Partial<Pick<Material, "createdAt" | "updatedAt" | "isFavorite">>;

export function normalizeEnglish(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

export function normalizeMaterial(raw: Partial<Material>, fallbackIndex = 0): Material {
  const timestamp = raw.createdAt ?? nowIso();
  const en = raw.en?.trim() ?? "";
  return {
    id: raw.id || `material-${fallbackIndex}-${Math.random().toString(36).slice(2)}`,
    zh: raw.zh?.trim() ?? "",
    en,
    scenario: raw.scenario?.trim() || "通用",
    difficulty: raw.difficulty ?? "B1",
    tags: Array.isArray(raw.tags) ? raw.tags.filter(Boolean) : [],
    source: raw.source,
    isFavorite: Boolean(raw.isFavorite),
    favoriteAddedAt: raw.favoriteAddedAt,
    mistakeDismissedAt: raw.mistakeDismissedAt,
    pronunciationNotes: raw.pronunciationNotes ?? generatePronunciationNotes(en),
    createdAt: timestamp,
    updatedAt: raw.updatedAt ?? timestamp,
  };
}

export async function loadSeedMaterials(): Promise<Material[]> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/seedMaterials.json`, { cache: "force-cache" });
    if (!response.ok) {
      throw new Error(`Seed materials request failed: ${response.status}`);
    }
    const rows = (await response.json()) as SeedMaterial[];
    return rows.map((row, index) => normalizeMaterial(row, index)).filter((material) => material.en);
  } catch (error) {
    console.info("Seed material file unavailable, using compact sample set.", error);
    return sampleMaterials.map((material, index) => normalizeMaterial(material, index));
  }
}

export function mergeMaterialsByEnglish(existing: Material[], incoming: Material[]) {
  const seen = new Set(existing.map((material) => normalizeEnglish(material.en)));
  const additions = incoming.filter((material) => {
    const key = normalizeEnglish(material.en);
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });

  return {
    additions,
    duplicateCount: incoming.length - additions.length,
  };
}

export function shouldAutoBackfillSeedMaterials(existing: Material[]): boolean {
  if (existing.length === 0 || existing.length > 30) {
    return false;
  }

  const sampleIds = new Set(sampleMaterials.map((material) => material.id));
  const sampleEnglish = new Set(sampleMaterials.map((material) => normalizeEnglish(material.en)));
  const sampleMatches = existing.filter((material) => {
    return sampleIds.has(material.id) || sampleEnglish.has(normalizeEnglish(material.en));
  }).length;

  // V1 users may already have the compact 10-row demo library in IndexedDB.
  // In that case we backfill the large v2 seed library once, while still
  // de-duping by English so user-created rows are preserved.
  return sampleMatches >= Math.min(8, existing.length);
}
