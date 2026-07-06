import type { Material, PracticeRecord } from "../types";
import { EmptyState } from "../components/EmptyState";
import { StatCard } from "../components/StatCard";
import { buildLearningStats } from "../lib/statistics";

function TrendBars({ values, label }: { values: { date: string; value: number }[]; label: string }) {
  if (values.length === 0) {
    return <EmptyState title="暂无趋势数据" text="完成几次练习后，这里会显示变化。" />;
  }
  return (
    <div className="trend-chart" aria-label={label}>
      {values.map((item) => (
        <div className="trend-bar" key={item.date}>
          <span style={{ height: `${Math.max(8, item.value)}%` }} />
          <small>{item.date.slice(5)}</small>
        </div>
      ))}
    </div>
  );
}

export function StatisticsPage({
  materials,
  practiceRecords,
}: {
  materials: Material[];
  practiceRecords: PracticeRecord[];
}) {
  const stats = buildLearningStats(materials, practiceRecords);
  const latestDimensions = stats.averageTrend.slice(-7);

  return (
    <div className="page-stack">
      <section className="page-title-row">
        <div>
          <h1>学习统计</h1>
          <p>练习记录删除后，这里的统计会自动同步更新。</p>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard label="连续练习" value={`${stats.streakDays} 天`} tone="teal" />
        <StatCard label="今日分钟" value={stats.todayMinutes} tone="blue" />
        <StatCard label="总跟读" value={stats.totalAttempts} tone="amber" />
        <StatCard label="本周均分" value={stats.weekAverageScore || "--"} tone="red" />
      </section>

      <section className="section-block">
        <div className="section-heading">
          <h2>今日 / 本周</h2>
        </div>
        <div className="score-strip">
          <span>今日练习句数 {stats.todaySentenceCount}</span>
          <span>本周练习次数 {stats.weekSentenceCount}</span>
          <span>收藏 {stats.favoritesCount}</span>
          <span>错题 {stats.mistakesCount}</span>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <h2>平均分趋势</h2>
        </div>
        <TrendBars
          label="平均分趋势"
          values={stats.averageTrend.map((item) => ({ date: item.date, value: item.averageScore }))}
        />
      </section>

      <section className="section-block">
        <div className="section-heading">
          <h2>发音进步曲线</h2>
        </div>
        <div className="dimension-trend">
          {latestDimensions.map((item) => (
            <article className="mini-trend-card" key={item.date}>
              <strong>{item.date.slice(5)}</strong>
              <span>准确 {item.dimensions.pronunciationAccuracy}</span>
              <span>流利 {item.dimensions.fluency}</span>
              <span>重音 {item.dimensions.stress}</span>
              <span>连读 {item.dimensions.linkingWeakForms}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <h2>最常错的单词</h2>
        </div>
        {stats.commonWrongWords.length ? (
          <div className="rank-list">
            {stats.commonWrongWords.map((item) => (
              <div className="rank-row" key={item.word}>
                <span>{item.word}</span>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="暂无错词统计" text="有识别文本后会自动计算。" />
        )}
      </section>

      <section className="section-block">
        <div className="section-heading">
          <h2>最薄弱的场景</h2>
        </div>
        {stats.weakestScenarios.length ? (
          <div className="rank-list">
            {stats.weakestScenarios.map((item) => (
              <div className="rank-row" key={item.scenario}>
                <span>{item.scenario}</span>
                <strong>{item.averageScore || "--"} / 低分 {item.lowScoreCount}</strong>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="暂无场景统计" text="练习更多场景后会显示薄弱项。" />
        )}
      </section>
    </div>
  );
}
