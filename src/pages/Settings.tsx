import type { BrowserCapabilities, DailyReview, Material, PracticeRecord, ReviewSchedule } from "../types";

function CapabilityRow({ label, ok, note }: { label: string; ok: boolean; note: string }) {
  return (
    <div className="capability-row">
      <span>{label}</span>
      <strong className={ok ? "success-text" : "error-text"}>{ok ? "可用" : "不可用"}</strong>
      <small>{note}</small>
    </div>
  );
}

export function SettingsPage({
  capabilities,
  materials,
  practiceRecords,
  reviewSchedules,
  dailyReviews,
}: {
  capabilities: BrowserCapabilities;
  materials: Material[];
  practiceRecords: PracticeRecord[];
  reviewSchedules: ReviewSchedule[];
  dailyReviews: DailyReview[];
}) {
  return (
    <div className="page-stack">
      <section className="page-title-row">
        <div>
          <h1>设置</h1>
          <p>本应用不使用后端，所有数据保存在当前浏览器本地。</p>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <h2>浏览器能力</h2>
        </div>
        <div className="capability-list">
          <CapabilityRow label="系统朗读" ok={capabilities.speechSynthesis} note="用于播放英文原句。" />
          <CapabilityRow label="网页录音" ok={capabilities.mediaRecorder} note="用于保存自己的跟读音频。" />
          <CapabilityRow label="语音识别" ok={capabilities.speechRecognition} note="不可用时会按完成练习给基础分。" />
          <CapabilityRow label="Service Worker" ok={capabilities.serviceWorker} note="用于缓存 App Shell 离线打开。" />
          <CapabilityRow label="IndexedDB" ok={capabilities.indexedDb} note="不可用时退回 localStorage。" />
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <h2>本地数据</h2>
        </div>
        <div className="score-strip">
          <span>素材 {materials.length}</span>
          <span>练习 {practiceRecords.length}</span>
          <span>复习计划 {reviewSchedules.length}</span>
          <span>复盘 {dailyReviews.length}</span>
        </div>
      </section>

      <section className="settings-note">
        <h2>iPhone 使用提示</h2>
        <p>用 Safari 打开局域网地址后，点击分享按钮，选择“添加到主屏幕”。首次在线打开后，基础页面会被缓存；录音、语音识别和系统朗读仍取决于 iOS Safari 的权限和支持情况。</p>
      </section>
    </div>
  );
}
