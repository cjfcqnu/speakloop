import type { Material } from "../types";
import { getPronunciationNotes } from "../lib/pronunciation";

function wordsFromPhrase(text: string): string[] {
  return text.toLowerCase().match(/[a-zA-Z']+/g) ?? [];
}

export function PronunciationSentence({ material, compact = false }: { material: Material; compact?: boolean }) {
  const notes = getPronunciationNotes(material);
  const stressWords = new Set(notes.stressWords.map((word) => word.toLowerCase()));
  const linkingWords = new Set(notes.linking.flatMap((item) => wordsFromPhrase(item.text)));
  const weakWords = new Set(notes.weakForms.flatMap((item) => wordsFromPhrase(item.text)));
  const difficultWords = new Set(notes.difficultSounds.flatMap((item) => wordsFromPhrase(item.text)));
  const parts = material.en.split(/(\s+)/);

  return (
    <p className={`sentence-en pronunciation-sentence ${compact ? "compact" : ""}`}>
      {parts.map((part, index) => {
        const word = part.toLowerCase().replace(/[^a-z']/g, "");
        if (!word) {
          return part;
        }
        const classes = [
          stressWords.has(word) ? "mark-stress" : "",
          linkingWords.has(word) ? "mark-linking" : "",
          weakWords.has(word) ? "mark-weak" : "",
          difficultWords.has(word) ? "mark-sound" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <span className={classes || undefined} key={`${part}-${index}`}>
            {part}
          </span>
        );
      })}
    </p>
  );
}
