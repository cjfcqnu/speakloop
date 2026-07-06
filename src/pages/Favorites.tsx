import type { Material, PracticeRecord, ReviewSchedule } from "../types";
import { EmptyState } from "../components/EmptyState";
import { MaterialCard } from "../components/MaterialCard";
import { deriveMistakeItems, getLatestRecord } from "../lib/mistakes";

export function FavoritesPage({
  materials,
  practiceRecords,
  reviewSchedules,
  navigate,
  toggleFavorite,
}: {
  materials: Material[];
  practiceRecords: PracticeRecord[];
  reviewSchedules: ReviewSchedule[];
  navigate: (path: string) => void;
  toggleFavorite: (materialId: string) => void;
}) {
  const favorites = materials.filter((material) => material.isFavorite);
  const mistakeIds = new Set(deriveMistakeItems(materials, practiceRecords).map((item) => item.material.id));
  const scheduleMap = new Map(reviewSchedules.map((schedule) => [schedule.materialId, schedule]));

  return (
    <div className="page-stack">
      <section className="page-title-row">
        <div>
          <h1>收藏夹</h1>
          <p>{favorites.length} 条高频句</p>
        </div>
      </section>
      {favorites.length ? (
        <section className="material-list">
          {favorites.map((material) => (
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
        <EmptyState title="还没有收藏" text="在素材卡片右上角点击星标即可收藏。" />
      )}
    </div>
  );
}
