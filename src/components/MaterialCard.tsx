import type { Material, PracticeRecord, ReviewSchedule } from "../types";
import { isDueToday } from "../lib/review";
import { AudioControls } from "./AudioControls";
import { Icon } from "./Icons";

export function MaterialCard({
  material,
  latestRecord,
  schedule,
  isMistake,
  onToggleFavorite,
  onPractice,
}: {
  material: Material;
  latestRecord?: PracticeRecord;
  schedule?: ReviewSchedule;
  isMistake?: boolean;
  onToggleFavorite: (materialId: string) => void;
  onPractice: (materialId: string) => void;
}) {
  const due = isDueToday(schedule);

  return (
    <article className="material-card">
      <div className="material-card-header">
        <div className="pill-row">
          <span className="pill">{material.scenario}</span>
          <span className={`pill difficulty difficulty-${material.difficulty.toLowerCase()}`}>{material.difficulty}</span>
          {due ? <span className="pill due">今日复习</span> : null}
          {isMistake ? <span className="pill danger">错题</span> : null}
        </div>
        <button
          className={`favorite-button ${material.isFavorite ? "active" : ""}`}
          onClick={() => onToggleFavorite(material.id)}
          type="button"
          aria-label={material.isFavorite ? "取消收藏" : "收藏"}
        >
          <Icon name="star" />
        </button>
      </div>
      <p className="sentence-en">{material.en}</p>
      <p className="sentence-zh">{material.zh}</p>
      <div className="tag-row">
        {material.tags.map((tag) => (
          <span key={tag}>#{tag}</span>
        ))}
      </div>
      <AudioControls text={material.en} compact />
      <div className="card-footer">
        <span>{latestRecord ? `最近得分 ${latestRecord.score}` : "还没有练习记录"}</span>
        <button className="primary-button" onClick={() => onPractice(material.id)} type="button">
          <Icon name="mic" />
          开始练习
        </button>
      </div>
    </article>
  );
}
