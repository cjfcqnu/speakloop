import type { Material, PracticeRecord, ReviewSchedule } from "../types";
import { isDueToday } from "../lib/review";
import { AudioControls } from "./AudioControls";
import { Icon } from "./Icons";
import { PronunciationSentence } from "./PronunciationSentence";

export function MaterialCard({
  material,
  latestRecord,
  practiceRecords = [],
  schedule,
  isMistake,
  onToggleFavorite,
  onPractice,
}: {
  material: Material;
  latestRecord?: PracticeRecord;
  practiceRecords?: PracticeRecord[];
  schedule?: ReviewSchedule;
  isMistake?: boolean;
  onToggleFavorite: (materialId: string) => void;
  onPractice: (materialId: string) => void;
}) {
  const due = isDueToday(schedule);
  const materialRecords = practiceRecords.filter((record) => record.materialId === material.id);
  const bestScore = materialRecords.length ? Math.max(...materialRecords.map((record) => record.score)) : undefined;

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
      <PronunciationSentence material={material} compact />
      <p className="sentence-zh">{material.zh}</p>
      <div className="tag-row">
        {material.tags.map((tag) => (
          <span key={tag}>#{tag}</span>
        ))}
      </div>
      <AudioControls text={material.en} compact />
      <div className="score-strip">
        <span>{latestRecord ? `最近 ${latestRecord.score}` : "还没有练习记录"}</span>
        <span>最高 {bestScore ?? "--"}</span>
        <span>练习 {materialRecords.length}</span>
      </div>
      <div className="card-footer">
        <span>{due ? `下次复习 ${schedule?.nextReviewDate}` : "自由练习，不设每日上限"}</span>
        <button className="primary-button" onClick={() => onPractice(material.id)} type="button">
          <Icon name="mic" />
          开始练习
        </button>
      </div>
    </article>
  );
}
