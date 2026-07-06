import type { Material, PronunciationNotes } from "../types";

const LINKING_RULES = [
  { text: "follow up", note: "Link the final /w/ feeling into up; keep it smooth." },
  { text: "check in", note: "Link check and in without a hard break." },
  { text: "work on", note: "Let the final /k/ connect lightly into on." },
  { text: "set up", note: "Connect set and up; avoid adding an extra vowel." },
  { text: "get it", note: "Link get it; the /t/ can sound light in natural speech." },
  { text: "got it", note: "Say got it as one short chunk." },
  { text: "this is", note: "Link this is; keep the /s/ clear." },
  { text: "that is", note: "Link that is; do not pause between the words." },
  { text: "an issue", note: "Link an issue smoothly." },
  { text: "this issue", note: "Connect this and issue with a light /s/ transition." },
  { text: "going to", note: "In fast speech this can reduce toward gonna, but keep it clear in interviews." },
  { text: "want to", note: "Can reduce toward wanna in casual speech; keep want to clear for work settings." },
  { text: "need to", note: "The /d/ can connect lightly into to." },
  { text: "have to", note: "Often sounds like /haf tə/." },
  { text: "has to", note: "Often sounds like /has tə/." },
  { text: "like to", note: "Can be weak on to; avoid a long pause." },
];

const WEAK_FORM_RULES = [
  { text: "to", note: "Weak form often sounds like /tə/ unless it is emphasized." },
  { text: "the", note: "Use /ðə/ before consonants and /ði/ before vowel sounds." },
  { text: "a", note: "Weak form often sounds like /ə/." },
  { text: "an", note: "Keep it short and link it to the next word." },
  { text: "of", note: "Often reduces toward /əv/ in connected speech." },
  { text: "and", note: "Often reduces toward /ən/ or /ənd/." },
];

const DIFFICULT_SOUND_RULES = [
  { text: "issue", ipa: "/ˈɪʃuː/ or /ˈɪsjuː/", note: "Both pronunciations are common; keep the first vowel short." },
  { text: "priority", ipa: "/praɪˈɔːrəti/", note: "Stress the second syllable: pri-OR-i-ty." },
  { text: "requirement", ipa: "/rɪˈkwaɪərmənt/", note: "Stress quire; do not swallow the final -ment." },
  { text: "architecture", ipa: "/ˈɑːrkɪtektʃər/", note: "Stress the first syllable." },
  { text: "integration", ipa: "/ˌɪntɪˈɡreɪʃən/", note: "Stress gray." },
  { text: "stakeholder", ipa: "/ˈsteɪkhoʊldər/", note: "Keep stake clear and strong." },
  { text: "visibility", ipa: "/ˌvɪzəˈbɪləti/", note: "Stress bil." },
  { text: "feasible", ipa: "/ˈfiːzəbəl/", note: "Stress fee." },
  { text: "configuration", ipa: "/kənˌfɪɡjəˈreɪʃən/", note: "Stress ray." },
  { text: "escalate", ipa: "/ˈeskəleɪt/", note: "Stress the first syllable." },
];

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "be",
  "can",
  "for",
  "i",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "so",
  "the",
  "to",
  "we",
  "will",
  "with",
]);

function includesPhrase(text: string, phrase: string): boolean {
  return text.toLowerCase().includes(phrase.toLowerCase());
}

function unique<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = keyFn(item).toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function pickStressWords(sentence: string): string[] {
  const words = sentence.match(/[A-Za-z][A-Za-z'-]*/g) ?? [];
  return unique(
    words
      .map((word) => word.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, ""))
      .filter((word) => word.length > 4 && !STOP_WORDS.has(word.toLowerCase()))
      .slice(0, 5),
    (word) => word,
  );
}

function buildPauses(sentence: string): PronunciationNotes["pauses"] {
  const commaIndex = sentence.indexOf(",");
  if (commaIndex > 8) {
    const beforeComma = sentence.slice(0, commaIndex).trim();
    const anchor = beforeComma.split(/\s+/).slice(-2).join(" ");
    return [{ after: anchor, note: "Add a short pause here, then continue with the second thought." }];
  }

  const words = sentence.match(/[A-Za-z][A-Za-z'-]*/g) ?? [];
  if (words.length > 12) {
    const anchor = words.slice(Math.floor(words.length / 2) - 1, Math.floor(words.length / 2) + 1).join(" ");
    return [{ after: anchor, note: "Use a light mid-sentence pause to keep the rhythm natural." }];
  }

  return [];
}

export function generatePronunciationNotes(sentence: string): PronunciationNotes {
  const linking = LINKING_RULES.filter((rule) => includesPhrase(sentence, rule.text));
  const weakForms = WEAK_FORM_RULES.filter((rule) => new RegExp(`\\b${rule.text}\\b`, "i").test(sentence));
  const difficultSounds = DIFFICULT_SOUND_RULES.filter((rule) => includesPhrase(sentence, rule.text));

  return {
    stressWords: pickStressWords(sentence),
    linking: unique(linking, (item) => item.text),
    weakForms: unique(weakForms.slice(0, 4), (item) => item.text),
    difficultSounds: unique(difficultSounds, (item) => item.text),
    pauses: buildPauses(sentence),
  };
}

export function getPronunciationNotes(material: Material): PronunciationNotes {
  const generated = generatePronunciationNotes(material.en);
  const existing = material.pronunciationNotes;
  if (!existing) {
    return generated;
  }

  return {
    stressWords: existing.stressWords?.length ? existing.stressWords : generated.stressWords,
    linking: existing.linking?.length ? existing.linking : generated.linking,
    weakForms: existing.weakForms?.length ? existing.weakForms : generated.weakForms,
    difficultSounds: existing.difficultSounds?.length ? existing.difficultSounds : generated.difficultSounds,
    pauses: existing.pauses?.length ? existing.pauses : generated.pauses,
  };
}

export function getPronunciationTipCount(material: Material): number {
  const notes = getPronunciationNotes(material);
  return (
    notes.stressWords.length +
    notes.linking.length +
    notes.weakForms.length +
    notes.difficultSounds.length +
    notes.pauses.length
  );
}
