import type { BrowserCapabilities } from "../types";
import { hasIndexedDb } from "./db";

export function getBrowserCapabilities(): BrowserCapabilities {
  return {
    speechSynthesis: typeof window !== "undefined" && "speechSynthesis" in window,
    mediaRecorder: typeof window !== "undefined" && "MediaRecorder" in window && Boolean(navigator.mediaDevices),
    speechRecognition:
      typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
    serviceWorker: typeof navigator !== "undefined" && "serviceWorker" in navigator,
    indexedDb: hasIndexedDb(),
  };
}
