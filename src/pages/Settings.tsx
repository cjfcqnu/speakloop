import { useState } from "react";
import type { BrowserCapabilities, DailyReview, Material, PracticeRecord, PracticeSettings, ReviewSchedule } from "../types";

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
  appSettings,
  updatePracticeSettings,
  importSeedMaterials,
}: {
  capabilities: BrowserCapabilities;
  materials: Material[];
  practiceRecords: PracticeRecord[];
  reviewSchedules: ReviewSchedule[];
  dailyReviews: DailyReview[];
  appSettings: PracticeSettings;
  updatePracticeSettings: (settings: PracticeSettings) => void;
  importSeedMaterials: () => Promise<{ importedCount: number; duplicateCount: number; totalSeedCount: number }>;
}) {
  const [importMessage, setImportMessage] = useState("");

  const update = (patch: Partial<PracticeSettings>) => {
    updatePracticeSettings({ ...appSettings, ...patch });
  };

  const handleSeedImport = async () => {
    setImportMessage("正在导入内置素材...");
    const result = await importSeedMaterials();
    setImportMessage(
      `内置素材 ${result.totalSeedCount} 条，新增 ${result.importedCount} 条，跳过重复 ${result.duplicateCount} 条。`,
    );
  };

  return (
    <div className="page-stack">
      <section className="page-title-row">
        <div>
          <h1>设置</h1>
          <p>所有数据保存在当前浏览器本地，不使用后端服务。</p>
        </div>
      </section>

      <section className="section-block settings-panel">
        <div className="section-heading">
          <h2>自动下一句</h2>
        </div>
        <label className="setting-row">
          <span>自动下一句</span>
          <input
            type="checkbox"
            checked={appSettings.autoNextEnabled}
            onChange={(event) => update({ autoNextEnabled: event.target.checked })}
          />
        </label>
        <label className="setting-row">
          <span>达标分数</span>
          <input
            type="number"
            min={70}
            max={100}
            value={appSettings.targetScore}
            onChange={(event) => update({ targetScore: Number(event.target.value) })}
          />
        </label>
        <label className="setting-row">
          <span>最多练习次数</span>
          <input
            type="number"
            min={1}
            max={8}
            value={appSettings.maxAttemptsPerSentence}
            onChange={(event) => update({ maxAttemptsPerSentence: Number(event.target.value) })}
          />
        </label>
        <label className="setting-row">
          <span>跳转延迟秒数</span>
          <input
            type="number"
            min={1}
            max={5}
            value={appSettings.autoAdvanceDelaySeconds}
            onChange={(event) => update({ autoAdvanceDelaySeconds: Number(event.target.value) })}
          />
        </label>
      </section>

      <section className="section-block settings-panel">
        <div className="section-heading">
          <h2>内置素材</h2>
        </div>
        <p className="compat-note">首次打开且本地没有素材时会自动导入。已有素材时不会重复导入，可手动补充。</p>
        <button className="secondary-button" onClick={() => void handleSeedImport()} type="button">
          重新导入示例素材
        </button>
        {importMessage ? <p className="success-text">{importMessage}</p> : null}
      </section>

      <section className="section-block">
        <div className="section-heading">
          <h2>浏览器能力</h2>
        </div>
        <div className="capability-list">
          <CapabilityRow label="系统朗读" ok={capabilities.speechSynthesis} note="用于播放英文原句。" />
          <CapabilityRow label="网页录音" ok={capabilities.mediaRecorder} note="用于保存自己的跟读音频。" />
          <CapabilityRow label="语音识别" ok={capabilities.speechRecognition} note="不可用时会显示估算分。" />
          <CapabilityRow label="Service Worker" ok={capabilities.serviceWorker} note="用于缓存 App Shell 离线打开。" />
          <CapabilityRow label="IndexedDB" ok={capabilities.indexedDb} note="不可用时回退到 localStorage。" />
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
        <p>
          用 Safari 打开 GitHub Pages 或局域网地址后，点击分享按钮选择“添加到主屏幕”。录音、语音识别和系统朗读仍取决于 iOS
          Safari 的权限和支持情况。
        </p>
      </section>
    </div>
  );
}
