import type { Material, PracticeRecord } from "../types";
import { EmptyState } from "../components/EmptyState";
import { Icon } from "../components/Icons";
import { deriveMistakeItems } from "../lib/mistakes";

function statusText(status: string): string {
  if (status === "mistake") {
    return "错题";
  }
  if (status === "needsWork") {
    return "需要加强";
  }
  return "基本掌握";
}

export function MistakesPage({
  materials,
  practiceRecords,
  navigate,
  dismissMistake,
}: {
  materials: Material[];
  practiceRecords: PracticeRecord[];
  navigate: (path: string) => void;
  dismissMistake: (materialId: string) => void;
}) {
  const mistakes = deriveMistakeItems(materials, practiceRecords);

  return (
    <div className="page-stack">
      <section className="page-title-row">
        <div>
          <h1>错题本</h1>
          <p>低于 70 分自动进入，连续 3 次 90+ 会自动移出。</p>
        </div>
      </section>
      {mistakes.length ? (
        <section className="mistake-list">
          {mistakes.map((item) => (
            <article className="mistake-card" key={item.material.id}>
              <div className="material-card-header">
                <span className={`pill ${item.status === "mistake" ? "danger" : ""}`}>{statusText(item.status)}</span>
                <span className="pill">练习 {item.practiceCount} 次</span>
              </div>
              <p className="sentence-en">{item.material.en}</p>
              <p className="sentence-zh">{item.material.zh}</p>
              <div className="score-strip">
                <span>最近 {item.latestScore}</span>
                <span>最低 {item.lowestScore}</span>
                <span>90+ 连续 {item.highScoreStreak}</span>
              </div>
              <div className="button-row">
                <button className="primary-button" onClick={() => navigate(`/practice/${item.material.id}`)} type="button">
                  <Icon name="mic" />
                  重新练习
                </button>
                <button className="secondary-button" onClick={() => dismissMistake(item.material.id)} type="button">
                  移出错题本
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState title="错题本是空的" text="低分句子会自动出现在这里，方便第二天先复习。" />
      )}
    </div>
  );
}
