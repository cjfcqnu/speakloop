import type { Material } from "../types";
import { getPronunciationNotes } from "../lib/pronunciation";

export function PronunciationTips({ material }: { material: Material }) {
  const notes = getPronunciationNotes(material);

  return (
    <div className="pronunciation-tips">
      <div>
        <h3>重读词</h3>
        <p>{notes.stressWords.length ? notes.stressWords.join(", ") : "按句意重读业务关键词。"}</p>
      </div>
      <div>
        <h3>连读位置</h3>
        {notes.linking.length ? (
          notes.linking.map((item) => (
            <p key={item.text}>
              <strong>{item.text}</strong>: {item.note}
            </p>
          ))
        ) : (
          <p>保持短语自然连贯，不要逐词断开。</p>
        )}
      </div>
      <div>
        <h3>弱读词</h3>
        {notes.weakForms.length ? (
          notes.weakForms.map((item) => (
            <p key={item.text}>
              <strong>{item.text}</strong>: {item.note}
            </p>
          ))
        ) : (
          <p>功能词保持轻短，重点放在业务关键词上。</p>
        )}
      </div>
      <div>
        <h3>易错音</h3>
        {notes.difficultSounds.length ? (
          notes.difficultSounds.map((item) => (
            <p key={item.text}>
              <strong>{item.text}</strong>
              {item.ipa ? ` ${item.ipa}` : ""}: {item.note}
            </p>
          ))
        ) : (
          <p>注意结尾辅音清晰，不要吞掉关键词。</p>
        )}
      </div>
      <div>
        <h3>停顿建议</h3>
        {notes.pauses.length ? (
          notes.pauses.map((item) => (
            <p key={item.after}>
              after <strong>{item.after}</strong>: {item.note}
            </p>
          ))
        ) : (
          <p>短句可一口气完成，长句按意义块轻微停顿。</p>
        )}
      </div>
    </div>
  );
}
