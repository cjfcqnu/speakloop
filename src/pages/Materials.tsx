import { useMemo, useState } from "react";
import type { Material, MaterialFilters, PracticeRecord, ReviewSchedule } from "../types";
import { EmptyState } from "../components/EmptyState";
import { Icon } from "../components/Icons";
import { MaterialCard } from "../components/MaterialCard";
import { deriveMistakeItems, getLatestRecord } from "../lib/mistakes";
import { isDueToday } from "../lib/review";

const defaultFilters: MaterialFilters = {
  query: "",
  scenario: "",
  difficulty: "",
  tag: "",
  favoritesOnly: false,
  mistakesOnly: false,
  dueTodayOnly: false,
};

export function MaterialsPage({
  materials,
  practiceRecords,
  reviewSchedules,
  navigate,
  toggleFavorite,
  initialFilters,
  title = "素材库",
}: {
  materials: Material[];
  practiceRecords: PracticeRecord[];
  reviewSchedules: ReviewSchedule[];
  navigate: (path: string) => void;
  toggleFavorite: (materialId: string) => void;
  initialFilters?: Partial<MaterialFilters>;
  title?: string;
}) {
  const [filters, setFilters] = useState<MaterialFilters>({ ...defaultFilters, ...initialFilters });
  const mistakes = useMemo(() => deriveMistakeItems(materials, practiceRecords), [materials, practiceRecords]);
  const mistakeIds = new Set(mistakes.map((item) => item.material.id));
  const scheduleMap = new Map(reviewSchedules.map((schedule) => [schedule.materialId, schedule]));
  const scenarios = Array.from(new Set(materials.map((material) => material.scenario))).sort();
  const tags = Array.from(new Set(materials.flatMap((material) => material.tags))).sort();

  const filteredMaterials = materials.filter((material) => {
    const schedule = scheduleMap.get(material.id);
    const query = filters.query.trim().toLowerCase();
    const matchesQuery =
      !query || material.en.toLowerCase().includes(query) || material.zh.toLowerCase().includes(query);

    return (
      matchesQuery &&
      (!filters.scenario || material.scenario === filters.scenario) &&
      (!filters.difficulty || material.difficulty === filters.difficulty) &&
      (!filters.tag || material.tags.includes(filters.tag)) &&
      (!filters.favoritesOnly || material.isFavorite) &&
      (!filters.mistakesOnly || mistakeIds.has(material.id)) &&
      (!filters.dueTodayOnly || isDueToday(schedule))
    );
  });

  return (
    <div className="page-stack">
      <section className="page-title-row">
        <div>
          <h1>{title}</h1>
          <p>{filteredMaterials.length} / {materials.length} 条素材</p>
        </div>
        <button className="primary-button" onClick={() => navigate("/import")} type="button">
          <Icon name="upload" />
          导入
        </button>
      </section>

      <section className="filter-panel">
        <label className="search-box">
          <Icon name="search" />
          <input
            value={filters.query}
            onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
            placeholder="搜索中文或英文"
          />
        </label>
        <div className="filter-grid">
          <select value={filters.scenario} onChange={(event) => setFilters((prev) => ({ ...prev, scenario: event.target.value }))}>
            <option value="">全部场景</option>
            {scenarios.map((scenario) => (
              <option key={scenario} value={scenario}>
                {scenario}
              </option>
            ))}
          </select>
          <select
            value={filters.difficulty}
            onChange={(event) => setFilters((prev) => ({ ...prev, difficulty: event.target.value as MaterialFilters["difficulty"] }))}
          >
            <option value="">全部难度</option>
            <option value="B1">B1 基础职场表达</option>
            <option value="B2">B2 复杂工作沟通</option>
            <option value="C1">C1 面试/汇报/抽象表达</option>
            <option value="C2">C2 预留</option>
          </select>
          <select value={filters.tag} onChange={(event) => setFilters((prev) => ({ ...prev, tag: event.target.value }))}>
            <option value="">全部标签</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>
                #{tag}
              </option>
            ))}
          </select>
        </div>
        <div className="toggle-row">
          <label>
            <input
              type="checkbox"
              checked={filters.favoritesOnly}
              onChange={(event) => setFilters((prev) => ({ ...prev, favoritesOnly: event.target.checked }))}
            />
            只看收藏
          </label>
          <label>
            <input
              type="checkbox"
              checked={filters.mistakesOnly}
              onChange={(event) => setFilters((prev) => ({ ...prev, mistakesOnly: event.target.checked }))}
            />
            只看错题
          </label>
          <label>
            <input
              type="checkbox"
              checked={filters.dueTodayOnly}
              onChange={(event) => setFilters((prev) => ({ ...prev, dueTodayOnly: event.target.checked }))}
            />
            今日待复习
          </label>
        </div>
      </section>

      {filteredMaterials.length ? (
        <section className="material-list">
          {filteredMaterials.map((material) => (
            <MaterialCard
              key={material.id}
              material={material}
              latestRecord={getLatestRecord(material.id, practiceRecords)}
              practiceRecords={practiceRecords}
              schedule={scheduleMap.get(material.id)}
              isMistake={mistakeIds.has(material.id)}
              onToggleFavorite={toggleFavorite}
              onPractice={(id) => navigate(`/practice/${id}`)}
            />
          ))}
        </section>
      ) : (
        <EmptyState title="没有匹配素材" text="换一个筛选条件，或先导入新的 TXT 素材。" />
      )}
    </div>
  );
}
