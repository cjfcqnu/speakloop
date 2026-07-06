import { useEffect, useState } from "react";
import type { AudioBlobRecord, Material, PracticeRecord } from "../types";
import { AudioControls } from "../components/AudioControls";
import { EmptyState } from "../components/EmptyState";
import { Icon } from "../components/Icons";
import { PronunciationSentence } from "../components/PronunciationSentence";
import { PronunciationTips } from "../components/PronunciationTips";
import { RecordDimensionScores } from "../components/DimensionScores";
import { getMaterialRecords } from "../lib/mistakes";

export function RecordDetailPage({
  recordId,
  materials,
  practiceRecords,
  navigate,
  getAudioBlob,
  deletePracticeRecord,
}: {
  recordId?: string;
  materials: Material[];
  practiceRecords: PracticeRecord[];
  navigate: (path: string) => void;
  getAudioBlob: (key: string) => Promise<AudioBlobRecord | undefined>;
  deletePracticeRecord: (recordId: string) => Promise<void>;
}) {
  const record = practiceRecords.find((item) => item.id === recordId);
  const material = materials.find((item) => item.id === record?.materialId);
  const [audioUrl, setAudioUrl] = useState("");
  const [audioMessage, setAudioMessage] = useState("");

  useEffect(() => {
    let revokedUrl = "";
    async function loadAudio() {
      setAudioUrl("");
      setAudioMessage("");
      if (!record?.audioBlobKey) {
        setAudioMessage("这条记录没有保存录音 Blob。");
        return;
      }
      const row = await getAudioBlob(record.audioBlobKey);
      if (!row?.blob) {
        setAudioMessage("没有找到这条记录的录音文件。");
        return;
      }
      revokedUrl = URL.createObjectURL(row.blob);
      setAudioUrl(revokedUrl);
    }
    void loadAudio();
    return () => {
      if (revokedUrl) {
        URL.revokeObjectURL(revokedUrl);
      }
    };
  }, [getAudioBlob, record?.audioBlobKey]);

  if (!record || !material) {
    return (
      <div className="page-stack">
        <EmptyState title="找不到练习记录" text="这条记录可能已经被删除。" />
        <button className="primary-button" onClick={() => navigate("/")} type="button">
          返回首页
        </button>
      </div>
    );
  }

  const materialRecords = getMaterialRecords(material.id, practiceRecords);
  const bestScore = materialRecords.length ? Math.max(...materialRecords.map((item) => item.score)) : record.score;
  const latest = [...materialRecords].sort((a, b) => b.date.localeCompare(a.date))[0];

  const handleDelete = async () => {
    const first = window.confirm("确定要删除这条练习记录吗？删除后相关统计和复盘会重新计算。");
    if (!first) {
      return;
    }
    const second = window.confirm("请再次确认：录音 Blob 也会一起删除，无法恢复。");
    if (!second) {
      return;
    }
    await deletePracticeRecord(record.id);
    navigate("/");
  };

  return (
    <div className="page-stack">
      <section className="page-title-row">
        <div>
          <h1>练习记录详情</h1>
          <p>{new Date(record.date).toLocaleString()}</p>
        </div>
        <button className="secondary-button" onClick={() => navigate(`/practice/${material.id}`)} type="button">
          再练
        </button>
      </section>

      <section className="practice-card">
        <div className="pill-row">
          <span className="pill">{material.scenario}</span>
          <span className={`pill difficulty difficulty-${material.difficulty.toLowerCase()}`}>{material.difficulty}</span>
          {material.tags.map((tag) => (
            <span className="pill" key={tag}>
              #{tag}
            </span>
          ))}
        </div>
        <PronunciationSentence material={material} />
        <p>{material.zh}</p>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <h2>原音 / 我的录音</h2>
        </div>
        <AudioControls text={material.en} />
        {audioUrl ? (
          <audio className="audio-playback" controls src={audioUrl}>
            <track kind="captions" />
          </audio>
        ) : (
          <p className="compat-note">{audioMessage}</p>
        )}
      </section>

      <section className="score-card">
        <div className="score-ring">
          <span>总分</span>
          <strong>{record.score}</strong>
        </div>
        <div className="score-detail">
          {record.isEstimatedScore ? <p className="compat-note">估算分：当时没有可靠语音识别文本。</p> : null}
          <RecordDimensionScores record={record} />
          <dl className="comparison-list">
            <dt>识别文本</dt>
            <dd>{record.transcript || "无识别文本。"}</dd>
            <dt>错误/缺失词</dt>
            <dd>{record.wrongWords?.length ? record.wrongWords.join(", ") : "未记录明显错词。"}</dd>
            <dt>本次录音时长</dt>
            <dd>{record.durationMs ? `${Math.round(record.durationMs / 1000)} 秒` : "--"}</dd>
          </dl>
          <div className="score-strip">
            <span>历史最高 {bestScore}</span>
            <span>历史练习 {materialRecords.length}</span>
            <span>最近一次 {latest ? new Date(latest.date).toLocaleDateString() : "--"}</span>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <h2>发音建议</h2>
        </div>
        <PronunciationTips material={material} />
        {record.feedbackTips?.length ? (
          <div className="feedback-list">
            {record.feedbackTips.map((tip) => (
              <p key={tip}>{tip}</p>
            ))}
          </div>
        ) : null}
      </section>

      <section className="danger-zone">
        <h2>删除记录</h2>
        <p>如果这条记录是录音故障或误操作，可以删除。删除后平均分、错题状态、统计和复盘会重新计算。</p>
        <button className="secondary-button danger-button" onClick={() => void handleDelete()} type="button">
          <Icon name="trash" />
          删除这条练习记录
        </button>
      </section>
    </div>
  );
}
