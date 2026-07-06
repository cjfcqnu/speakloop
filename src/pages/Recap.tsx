import type { DailyReview, Material } from "../types";
import { EmptyState } from "../components/EmptyState";
import { Icon } from "../components/Icons";
import { formatDateLabel } from "../lib/date";

function findMaterial(materials: Material[], id?: string): Material | undefined {
  return id ? materials.find((material) => material.id === id) : undefined;
}

export function RecapPage({
  date,
  dailyReviews,
  materials,
  navigate,
  markDailyReviewViewed,
}: {
  date?: string;
  dailyReviews: DailyReview[];
  materials: Material[];
  navigate: (path: string) => void;
  markDailyReviewViewed: (date: string) => void;
}) {
  const selected = dailyReviews.find((review) => review.date === date) ?? dailyReviews[0];
  const highest = findMaterial(materials, selected?.highestMaterialId);
  const lowest = findMaterial(materials, selected?.lowestMaterialId);
  const weakMaterials = (selected?.weakMaterials ?? []).map((id) => findMaterial(materials, id)).filter(Boolean) as Material[];
  const recommended = (selected?.recommendedMaterialIds ?? [])
    .map((id) => findMaterial(materials, id))
    .filter(Boolean) as Material[];

  return (
    <div className="page-stack">
      <section className="page-title-row">
        <div>
          <h1>学习复盘</h1>
          <p>第二天先看薄弱句子，再自由继续练习。</p>
        </div>
      </section>

      {!selected ? (
        <EmptyState title="暂无复盘" text="有了昨天的练习记录后，App 会自动生成昨日复盘。" />
      ) : (
        <>
          <section className={`recap-detail ${selected.viewedAt ? "" : "pending"}`}>
            <div className="section-heading">
              <div>
                <h2>{formatDateLabel(selected.date)}</h2>
                <span>{selected.viewedAt ? "已查看" : "待查看"}</span>
              </div>
              <button className="secondary-button" onClick={() => markDailyReviewViewed(selected.date)} type="button">
                <Icon name="check" />
                标记已查看
              </button>
            </div>
            <div className="stats-grid">
              <div className="stat-card tone-teal">
                <span>练习句数</span>
                <strong>{selected.practicedCount}</strong>
              </div>
              <div className="stat-card tone-blue">
                <span>新学句子</span>
                <strong>{selected.learnedCount}</strong>
              </div>
              <div className="stat-card tone-amber">
                <span>复习句子</span>
                <strong>{selected.reviewedCount}</strong>
              </div>
              <div className="stat-card tone-red">
                <span>平均得分</span>
                <strong>{selected.averageScore}</strong>
              </div>
            </div>
            <p className="recap-summary">{selected.summaryText}</p>
            <div className="score-strip">
              <span>最高 {selected.highestScore ?? "--"}：{highest?.scenario ?? "未知"}</span>
              <span>最低 {selected.lowestScore ?? "--"}：{lowest?.scenario ?? "未知"}</span>
              <span>新增收藏 {selected.favoriteAddedCount}</span>
            </div>
          </section>

          <section className="section-block">
            <div className="section-heading">
              <h2>建议今天重点复习</h2>
            </div>
            {recommended.length ? (
              <div className="choice-list">
                {recommended.map((material) => (
                  <button className="choice-card" key={material.id} onClick={() => navigate(`/practice/${material.id}`)} type="button">
                    <span className="pill">{material.scenario}</span>
                    <strong>{material.en}</strong>
                    <small>{material.zh}</small>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState title="没有明显薄弱句子" text="可以从素材库继续自由练习。" />
            )}
          </section>

          <section className="section-block">
            <div className="section-heading">
              <h2>进入错题本的句子</h2>
            </div>
            {weakMaterials.length ? (
              <div className="record-list">
                {weakMaterials.map((material) => (
                  <button className="record-row" key={material.id} onClick={() => navigate(`/practice/${material.id}`)} type="button">
                    <span>{material.en}</span>
                    <strong>练</strong>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState title="没有低分句子" text="保持影子跟读节奏即可。" />
            )}
          </section>
        </>
      )}

      <section className="section-block">
        <div className="section-heading">
          <h2>历史复盘</h2>
        </div>
        {dailyReviews.length ? (
          <div className="record-list">
            {dailyReviews.map((review) => (
              <button
                className={`record-row ${selected?.date === review.date ? "active" : ""}`}
                key={review.date}
                onClick={() => navigate(`/recap/${review.date}`)}
                type="button"
              >
                <span>{formatDateLabel(review.date)}</span>
                <strong>{review.averageScore}</strong>
              </button>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
