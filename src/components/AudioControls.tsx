import { useState } from "react";
import { useSpeechPlayer } from "../hooks/useSpeechPlayer";
import { Icon } from "./Icons";

const RATES = [0.75, 1, 1.25];

export function AudioControls({ text, compact = false }: { text: string; compact?: boolean }) {
  const [rate, setRate] = useState(1);
  const player = useSpeechPlayer(text, rate);

  if (!player.isSupported) {
    return <p className="compat-note">当前浏览器不支持 SpeechSynthesis，无法播放系统朗读。</p>;
  }

  return (
    <div className={`audio-controls ${compact ? "audio-controls-compact" : ""}`}>
      <div className="button-row">
        <button className="icon-button primary" onClick={player.play} type="button" title="播放">
          <Icon name="play" />
          <span>播放</span>
        </button>
        <button className="icon-button" onClick={player.pauseOrResume} disabled={!player.isSpeaking} type="button" title="暂停或继续">
          <Icon name="pause" />
          <span>{player.isPaused ? "继续" : "暂停"}</span>
        </button>
        <button className="icon-button" onClick={player.play} type="button" title="重新播放">
          <Icon name="repeat" />
          <span>重播</span>
        </button>
      </div>
      <div className="segmented" aria-label="朗读语速">
        {RATES.map((item) => (
          <button
            key={item}
            className={item === rate ? "active" : ""}
            onClick={() => setRate(item)}
            type="button"
          >
            {item}x
          </button>
        ))}
      </div>
    </div>
  );
}
