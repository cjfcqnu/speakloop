import type { Difficulty, ImportPreviewItem, Material } from "../types";
import { nowIso } from "./date";
import { createId } from "./id";

const DIFFICULTIES: Difficulty[] = ["B1", "B2", "C1", "C2"];

function parseDifficulty(value: string): Difficulty {
  const normalized = value.trim().toUpperCase();
  return DIFFICULTIES.includes(normalized as Difficulty) ? (normalized as Difficulty) : "B1";
}

function readField(block: string, label: string): string {
  const pattern = new RegExp(`^\\s*${label}\\s*[：:]\\s*(.*)$`, "im");
  const match = block.match(pattern);
  return match?.[1]?.trim() ?? "";
}

export function parseMaterialTxt(content: string): ImportPreviewItem[] {
  return content
    .split(/\n\s*\n/g)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const en = readField(block, "英文");
      const zh = readField(block, "中文");
      const scenario = readField(block, "场景") || "通用";
      const difficulty = parseDifficulty(readField(block, "难度"));
      const tags = readField(block, "标签")
        .split(/[，,]/g)
        .map((tag) => tag.trim())
        .filter(Boolean);

      return {
        id: createId("import"),
        zh,
        en,
        scenario,
        difficulty,
        tags,
        source: "TXT 导入",
        isValid: Boolean(en),
        error: en ? undefined : "英文为空，不能导入",
      };
    });
}

export function previewItemsToMaterials(items: ImportPreviewItem[]): Material[] {
  const timestamp = nowIso();

  return items
    .filter((item) => item.isValid)
    .map((item) => ({
      id: item.id,
      zh: item.zh,
      en: item.en,
      scenario: item.scenario || "通用",
      difficulty: item.difficulty || "B1",
      tags: item.tags,
      source: item.source,
      isFavorite: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    }));
}
