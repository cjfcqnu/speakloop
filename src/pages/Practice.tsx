import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Material, PracticeRecord, PracticeSettings, ReviewSchedule, ScoreBreakdown } from "../types";
import { AudioControls } from "../components/AudioControls";
import { DimensionScores } from "../components/DimensionScores";
import { EmptyState } from "../components/EmptyState";
import { Icon } from "../components/Icons";
import { PronunciationSentence } from "../components/PronunciationSentence";
import { PronunciationTips } from "../components/PronunciationTips";
import { useRecorder } from "../hooks/useRecorder";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { getLatestRecord, getMaterialRecords } from "../lib/mistakes";
import { updateReviewSchedule } from "../lib/review";
import { scorePractice } from "../lib/scoring";

type PracticeResult = {
  record?: PracticeRecord;
  breakdown: ScoreBreakdown;
  transcript: string;
};

function nextMaterialAfter(materials: Material[], materialId?: string): Material | undefined {
  if (!materialId || materials.length === 0) {
    return materials[0];
  }
  const index = materials.findIndex((material) => material.id === materialId);
  if (index < 0) {
    return materials[0];
  }
  return materials[(index + 1) % materials.length];
}

function autoAdvanceDelay({
  result,
  attemptCount,
  settings,
}: {
  result: PracticeResult;
  attemptCount: number;
  settings: PracticeSettings;
}): number | undefined {
  if (!result.record || result.breakdown.isEstimated) {
    return undefined;
  }
  if (result.breakdown.score >= settings.targetScore) {
    return settings.autoAdvanceDelaySeconds;
  }
  if (result.breakdown.score >= 80 && attemptCount >= 2) {
    return 1;
  }
  if (attemptCount >= settings.maxAttemptsPerSentence) {
    return settings.autoAdvanceDelaySeconds;
  }
  return undefined;
}

export function PracticePage({
  materialId,
  materials,
  practiceRecords,
  reviewSchedules,
  appSettings,
  navigate,
  savePractice,
}: {
  materialId?: string;
  materials: Material[];
  practiceRecords: PracticeRecord[];
  reviewSchedules: ReviewSchedule[];
  appSettings: PracticeSettings;
  navigate: (path: string) => void;
  savePractice: (input: {
    material: Material;
    breakdown: ScoreBreakdown;
    transcript?: string;
    durationMs?: number;
    audioBlob?: Blob | null;
  }) => Promise<PracticeRecord | undefined>;
}) {
  const material = materials.find((item) => item.id === materialId);
  const nextMaterial = nextMaterialAfter(materials, materialId);
  const recorder = useRecorder();
  const recognition = useSpeechRecognition();
  const [result, setResult] = useState<PracticeResult | null>(null);
  const [saveError, setSaveError] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [autoForCurrent, setAutoForCurrent] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const savedRef = useRef(false);

  useEffect(() => {
    savedRef.current = false;
    setResult(null);
    setSaveError("");
    setCountdown(null);
    setAutoForCurrent(true);
    recorder.reset();
    recognition.reset();
  }, [materialId]);

  useEffect(() => {
    if (!recorder.audioBlob) {
      setAudioUrl("");
      return;
    }

    const url = URL.createObjectURL(recorder.audioBlob);
    setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [recorder.audioBlob]);

  const latestRecord = material ? getLatestRecord(material.id, practiceRecords) : undefined;
  const materialRecords = material ? getMaterialRecords(material.id, practiceRecords) : [];
  const bestScore = materialRecords.length ? Math.max(...materialRecords.map((record) => record.score)) : undefined;
  const schedule = material ? reviewSchedules.find((item) => item.materialId === material.id) : undefined;

  const practiceOptions = useMemo(() => {
    if (materials.length === 0) {
      return [];
    }
    const practicedIds = new Set(practiceRecords.map((record) => record.materialId));
    return [
      ...materials.filter((item) => !practicedIds.has(item.id)).slice(0, 3),
      ...materials.filter((item) => practicedIds.has(item.id)).slice(0, 3),
    ].slice(0, 5);
  }, [materials, practiceRecords]);

  const saveCurrentPractice = useCallback(
    async (forceManual = false) => {
      if (!material || savedRef.current) {
        return;
      }

      savedRef.current = true;
      setSaveError("");
      const transcript = forceManual ? "" : recognition.transcript;
      const breakdown = scorePractice(material.en, transcript, recorder.durationMs);

      try {
        const record = await savePractice({
          material,
          breakdown,
          transcript,
          durationMs: recorder.durationMs,
          audioBlob: recorder.audioBlob,
        });
        setResult({ record, breakdown, transcript });
      } catch (err) {
        savedRef.current = false;
        setSaveError(err instanceof Error ? err.message : "保存练习记录失败。");
      }
    },
    [material, recognition.transcript, recorder.audioBlob, recorder.durationMs, savePractice],
  );

  useEffect(() => {
    if (recorder.status === "stopped" && recorder.audioBlob && !savedRef.current) {
      const timer = window.setTimeout(() => void saveCurrentPractice(false), 450);
      return () => window.clearTimeout(timer);
    }
  }, [recorder.audioBlob, recorder.status, saveCurrentPractice]);

  const attemptCountAfterResult = materialRecords.length + (result?.record ? 1 : 0);
  const autoDelay =
    result && appSettings.autoNextEnabled && autoForCurrent && nextMaterial
      ? autoAdvanceDelay({ result, attemptCount: attemptCountAfterResult, settings: appSettings })
      : undefined;

  useEffect(() => {
    if (!autoDelay || !nextMaterial || !result) {
      setCountdown(null);
      return;
    }

    setCountdown(autoDelay);
    const intervalId = window.setInterval(() => {
      setCountdown((value) => (value && value > 1 ? value - 1 : value));
    }, 1000);
    const timeoutId = window.setTimeout(() => {
      navigate(`/practice/${nextMaterial.id}`);
    }, autoDelay * 1000);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [autoDelay, navigate, nextMaterial, result]);

  const startPractice = async () => {
    savedRef.current = false;
    setResult(null);
    setCountdown(null);
    setSaveError("");
    recorder.reset();
    recognition.reset();
    if (recognition.isSupported) {
      recognition.start();
    }
    await recorder.start();
  };

  const stopPractice = () => {
    recognition.stop();
    recorder.stop();
  };

  const practiceAgain = () => {
    savedRef.current = false;
    setResult(null);
    setCountdown(null);
    recorder.reset();
    recognition.reset();
  };

  if (!materialId) {
    return (
      <div className="page-stack">
        <section className="page-title-row">
          <div>
            <h1>开始练习</h1>
            <p>选择一句素材进行影子跟读和录音评分。</p>
          </div>
        </section>
        {practiceOptions.length ? (
          <section className="choice-list">
            {practiceOptions.map((item) => (
              <button className="choice-card" key={item.id} onClick={() => navigate(`/practice/${item.id}`)} type="button">
                <span className="pill">{item.scenario}</span>
                <strong>{item.en}</strong>
                <small>{item.zh}</small>
              </button>
            ))}
          </section>
        ) : (
          <EmptyState title="还没有素材" text="先导入 TXT 或重新导入内置示例素材。" />
        )}
      </div>
    );
  }

  if (!material) {
    return (
      <div className="page-stack">
        <EmptyState title="找不到这条素材" text="它可能已被删除，或还没有同步到本地。" />
        <button className="primary-button" onClick={() => navigate("/materials")} type="button">
          返回素材库
        </button>
      </div>
    );
  }

  const nextSchedule = result ? updateReviewSchedule(material.id, result.breakdown.score, schedule) : undefined;

  return (
    <div className="page-stack">
      <section className="practice-card">
        <div className="material-card-header">
          <div className="pill-row">
            <span className="pill">{material.scenario}</span>
            <span className={`pill difficulty difficulty-${material.difficulty.toLowerCase()}`}>{material.difficulty}</span>
          </div>
          <button
            className={`secondary-button compact-button ${autoForCurrent ? "active-soft" : ""}`}
            onClick={() => setAutoForCurrent((value) => !value)}
            type="button"
          >
            自动下句 {autoForCurrent ? "开" : "关"}
          </button>
        </div>
        <PronunciationSentence material={material} />
        <p>{material.zh}</p>
        <AudioControls text={material.en} />
      </section>

      <section className="section-block">
        <div className="section-heading">
          <h2>录音跟读</h2>
          <span>{recorder.status === "recording" ? "录音中" : "本地保存"}</span>
        </div>

        {recorder.status === "unsupported" ? (
          <div className="compat-box">
            <strong>当前浏览器不支持 MediaRecorder。</strong>
            <p>你仍然可以播放原句并手动标记完成，系统会给本地估算分，不会阻断练习流程。</p>
            <button className="primary-button" onClick={() => void saveCurrentPractice(true)} type="button">
              <Icon name="check" />
              手动标记已完成
            </button>
          </div>
        ) : (
          <div className="recorder-panel">
            <div className="button-row">
              <button
                className="primary-button"
                disabled={recorder.status === "recording" || recorder.status === "requesting"}
                onClick={() => void startPractice()}
                type="button"
              >
                <Icon name="mic" />
                开始跟读
              </button>
              <button
                className="secondary-button"
                disabled={recorder.status !== "recording"}
                onClick={stopPractice}
                type="button"
              >
                停止录音
              </button>
            </div>
            <p className="status-line">
              状态：
              {recorder.status === "requesting"
                ? "请求麦克风权限"
                : recorder.status === "recording"
                  ? "正在录音，请跟读英文句子"
                  : recorder.status === "stopped"
                    ? "录音完成，已生成练习记录"
                    : "准备就绪"}
            </p>
            {recognition.isSupported ? (
              <p className="status-line">识别文本：{recognition.transcript || "等待识别结果..."}</p>
            ) : (
              <p className="compat-note">当前浏览器不支持 SpeechRecognition，会按录音时长和完成状态给估算分。</p>
            )}
            {recognition.error ? <p className="error-text">{recognition.error}</p> : null}
            {recorder.error ? <p className="error-text">{recorder.error}</p> : null}
            {audioUrl ? (
              <audio className="audio-playback" controls src={audioUrl}>
                <track kind="captions" />
              </audio>
            ) : null}
          </div>
        )}
      </section>

      {result ? (
        <section className={`score-card ${result.breakdown.score < 70 ? "low-score" : ""}`}>
          <div className="score-ring">
            <span>总分</span>
            <strong>{result.breakdown.score}</strong>
          </div>
          <div className="score-detail">
            {result.breakdown.isEstimated ? <p className="compat-note">估算分：当前浏览器没有提供可靠识别文本。</p> : null}
            <DimensionScores dimensions={result.breakdown.dimensions} />
            <p>{result.breakdown.suggestion}</p>
            <div className="button-row">
              <AudioControls text={material.en} compact />
              {audioUrl ? (
                <audio className="audio-playback compact-audio" controls src={audioUrl}>
                  <track kind="captions" />
                </audio>
              ) : (
                <span className="compat-note">本次录音不可回放。</span>
              )}
            </div>
            <dl className="comparison-list">
              <dt>识别文本</dt>
              <dd>{result.transcript || "无识别文本，已使用本地估算分。"}</dd>
              <dt>错误/缺失词</dt>
              <dd>{result.breakdown.wrongWords.length ? result.breakdown.wrongWords.join(", ") : "未发现明显缺失关键词。"}</dd>
              <dt>原文</dt>
              <dd>{material.en}</dd>
            </dl>
            <div className="feedback-list">
              {result.breakdown.feedbackTips.map((tip) => (
                <p key={tip}>{tip}</p>
              ))}
            </div>
            <p className={result.breakdown.score < 70 ? "error-text" : "success-text"}>
              {result.breakdown.score < 70 ? "已自动进入错题本。" : "本次练习已保存到本地。"}
            </p>
            {nextSchedule ? <p className="status-line">下次建议复习：{nextSchedule.nextReviewDate}</p> : null}
            {countdown ? <p className="success-box">即将进入下一句 {countdown}s</p> : null}
            <div className="button-row">
              <button className="secondary-button" onClick={practiceAgain} type="button">
                <Icon name="rotate" />
                再练一遍
              </button>
              {nextMaterial ? (
                <button className="primary-button" onClick={() => navigate(`/practice/${nextMaterial.id}`)} type="button">
                  <Icon name="arrowRight" />
                  下一句
                </button>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {saveError ? <p className="error-text">{saveError}</p> : null}

      <section className="section-block">
        <div className="section-heading">
          <h2>发音提示</h2>
        </div>
        <PronunciationTips material={material} />
      </section>

      <section className="section-block">
        <div className="section-heading">
          <h2>历史表现</h2>
        </div>
        <div className="score-strip">
          <span>最近得分 {latestRecord?.score ?? "--"}</span>
          <span>历史最高 {bestScore ?? "--"}</span>
          <span>练习次数 {materialRecords.length}</span>
          <span>复习等级 {schedule?.reviewLevel ?? 0}</span>
          <span>下次 {schedule?.nextReviewDate ?? "练习后生成"}</span>
        </div>
      </section>
    </div>
  );
}
