import type { Material, PracticeRecord, ReviewSchedule } from "../types";
import { EmptyState } from "../components/EmptyState";
import { MaterialCard } from "../components/MaterialCard";
import { deriveMistakeItems, getLatestRecord } from "../lib/mistakes";
import { isDueToday } from "../lib/review";

export function ReviewPage({
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
  const scheduleMap = new Map(reviewSchedules.map((schedule) => [schedule.materialId, schedule]));
  const mistakeIds = new Set(deriveMistakeItems(materials, practiceRecords).map((item) => item.material.id));
  const dueMaterials = materials.filter((material) => isDueToday(scheduleMap.get(material.id)));

  return (
    <div className="page-stack">
      <section className="page-title-row">
        <div>
          <h1>今日复习</h1>
          <p>今日建议先复习 {dueMaterials.length} 句，不限制继续学习。</p>
        </div>
      </section>
      {dueMaterials.length ? (
        <section className="material-list">
          {dueMaterials.map((material) => (
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
        <EmptyState title="今天暂无待复习" text="你仍然可以自由进入素材库继续练习新句子。" />
      )}
    </div>
  );
}
