import type { DailyReview, Material, PracticeRecord, ReviewSchedule } from "../types";
import { EmptyState } from "../components/EmptyState";
import { Icon } from "../components/Icons";
import { MaterialCard } from "../components/MaterialCard";
import { StatCard } from "../components/StatCard";
import { formatDateLabel, yesterdayKey } from "../lib/date";
import { deriveMistakeItems, getLatestRecord } from "../lib/mistakes";
import { isDueToday } from "../lib/review";

export function Dashboard({
  materials,
  practiceRecords,
  reviewSchedules,
  dailyReviews,
  navigate,
  toggleFavorite,
}: {
  materials: Material[];
  practiceRecords: PracticeRecord[];
  reviewSchedules: ReviewSchedule[];
  dailyReviews: DailyReview[];
  navigate: (path: string) => void;
  toggleFavorite: (materialId: string) => void;
}) {
  const dueSchedules = reviewSchedules.filter(isDueToday);
  const mistakes = deriveMistakeItems(materials, practiceRecords);
  const favoritesCount = materials.filter((material) => material.isFavorite).length;
  const recentRecords = practiceRecords.slice(0, 5);
  const recentAverage = recentRecords.length
    ? Math.round(recentRecords.reduce((sum, record) => sum + record.score, 0) / recentRecords.length)
    : "--";
  const yesterdayReview = dailyReviews.find((review) => review.date === yesterdayKey());
  const recommended =
    materials.find((material) => dueSchedules.some((schedule) => schedule.materialId === material.id)) ??
    materials.find((material) => !getLatestRecord(material.id, practiceRecords)) ??
    materials[0];

  return (
    <div className="page-stack">
      <section className="dashboard-hero">
        <div>
          <h1>SpeakLoop</h1>
          <p>自由练习职场英语、CRM 表达和面试回答。</p>
        </div>
        <button className="primary-button" onClick={() => navigate("/materials")} type="button">
          <Icon name="library" />
          进入素材库
        </button>
      </section>

      <section className="stats-grid">
        <StatCard label="今日待复习" value={dueSchedules.length} tone="teal" />
        <StatCard label="最近平均分" value={recentAverage} tone="blue" />
        <StatCard label="已收藏" value={favoritesCount} tone="amber" />
        <StatCard label="错题" value={mistakes.length} tone="red" />
      </section>

      {yesterdayReview ? (
        <section className={`recap-banner ${yesterdayReview.viewedAt ? "" : "pending"}`}>
          <div>
            <span>{formatDateLabel(yesterdayReview.date)} 复盘</span>
            <strong>
              {yesterdayReview.practicedCount} 句，平均 {yesterdayReview.averageScore} 分
            </strong>
            <p>{yesterdayReview.summaryText}</p>
          </div>
          <button className="secondary-button" onClick={() => navigate(`/recap/${yesterdayReview.date}`)} type="button">
            查看复盘
          </button>
        </section>
      ) : (
        <section className="recap-banner">
          <div>
            <span>昨日复盘</span>
            <strong>今天开始练习后，明天会自动生成复盘。</strong>
            <p>复盘不会限制学习，只会提醒你先看薄弱句子。</p>
          </div>
        </section>
      )}

      <section className="shortcut-grid" aria-label="快捷入口">
        <button onClick={() => navigate("/import")} type="button">
          <Icon name="upload" />
          导入素材
        </button>
        <button onClick={() => navigate("/review")} type="button">
          <Icon name="calendar" />
          今日复习
        </button>
        <button onClick={() => navigate("/mistakes")} type="button">
          <Icon name="alert" />
          错题本
        </button>
        <button onClick={() => navigate("/favorites")} type="button">
          <Icon name="star" />
          收藏夹
        </button>
      </section>

      {recommended ? (
        <section className="section-block">
          <div className="section-heading">
            <h2>推荐继续练习</h2>
            <button className="text-button" onClick={() => navigate("/materials")} type="button">
              查看全部
            </button>
          </div>
          <MaterialCard
            material={recommended}
            latestRecord={getLatestRecord(recommended.id, practiceRecords)}
            schedule={reviewSchedules.find((schedule) => schedule.materialId === recommended.id)}
            isMistake={mistakes.some((item) => item.material.id === recommended.id)}
            onToggleFavorite={toggleFavorite}
            onPractice={(id) => navigate(`/practice/${id}`)}
          />
        </section>
      ) : null}

      <section className="section-block">
        <div className="section-heading">
          <h2>最近练习</h2>
        </div>
        {recentRecords.length ? (
          <div className="record-list">
            {recentRecords.map((record) => {
              const material = materials.find((item) => item.id === record.materialId);
              return (
                <button
                  key={record.id}
                  className="record-row"
                  onClick={() => navigate(`/practice/${record.materialId}`)}
                  type="button"
                >
                  <span>{material?.en ?? "素材已删除"}</span>
                  <strong>{record.score}</strong>
                </button>
              );
            })}
          </div>
        ) : (
          <EmptyState title="还没有练习记录" text="先从素材库或导入页面开始第一句。" />
        )}
      </section>
    </div>
  );
}
