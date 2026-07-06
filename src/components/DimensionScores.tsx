import type { ScoreDimensions } from "../types";
import { dimensionsFromRecord } from "../lib/scoring";

const LABELS: { key: keyof ScoreDimensions; label: string }[] = [
  { key: "pronunciationAccuracy", label: "发音准确" },
  { key: "fluency", label: "流利度" },
  { key: "speed", label: "语速" },
  { key: "pause", label: "停顿" },
  { key: "completeness", label: "完整度" },
  { key: "stress", label: "重音" },
  { key: "intonation", label: "语调" },
  { key: "linkingWeakForms", label: "连读/弱读" },
];

export function DimensionScores({ dimensions }: { dimensions: ScoreDimensions }) {
  return (
    <div className="dimension-grid">
      {LABELS.map(({ key, label }) => (
        <div className="dimension-item" key={key}>
          <div>
            <span>{label}</span>
            <strong>{dimensions[key]}</strong>
          </div>
          <div className="mini-bar" aria-hidden="true">
            <span style={{ width: `${dimensions[key]}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RecordDimensionScores({ record }: { record: { score: number } & Partial<ScoreDimensions> }) {
  return <DimensionScores dimensions={dimensionsFromRecord(record)} />;
}
