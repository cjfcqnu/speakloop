import { useCallback, useRef, useState } from "react";

export function useSpeechRecognition() {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState("");
  const Recognition = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : undefined;
  const isSupported = Boolean(Recognition);

  const reset = useCallback(() => {
    setTranscript("");
    setError("");
  }, []);

  const start = useCallback(() => {
    if (!Recognition) {
      setError("当前浏览器不支持语音识别。");
      return;
    }

    try {
      const recognition = new Recognition();
      recognition.lang = "en-US";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event) => {
        let text = "";
        for (let index = 0; index < event.results.length; index += 1) {
          text += event.results[index][0].transcript;
        }
        setTranscript(text.trim());
      };
      recognition.onerror = () => {
        setError("语音识别暂时不可用，练习仍会按完成记录保存。");
      };
      recognition.onend = () => setIsListening(false);
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
      setError("");
    } catch {
      setIsListening(false);
      setError("语音识别启动失败，可能需要在 Safari 设置中允许语音识别。");
    }
  }, [Recognition]);

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      recognitionRef.current?.abort();
    } finally {
      setIsListening(false);
    }
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    error,
    start,
    stop,
    reset,
  };
}
