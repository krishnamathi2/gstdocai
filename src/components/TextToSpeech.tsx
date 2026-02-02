"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface TextToSpeechProps {
  text: string;
  language: string;
}

// Map language names to BCP 47 language codes for speech synthesis
const LANGUAGE_CODES: Record<string, string> = {
  English: "en-IN",
  Hindi: "hi-IN",
  Tamil: "ta-IN",
  Telugu: "te-IN",
  Kannada: "kn-IN",
  Malayalam: "ml-IN",
  Marathi: "mr-IN",
  Gujarati: "gu-IN",
  Bengali: "bn-IN",
  Punjabi: "pa-IN",
};

export default function TextToSpeech({ text, language }: TextToSpeechProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [progress, setProgress] = useState(0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if speech synthesis is supported and load voices
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    if (!("speechSynthesis" in window)) {
      setIsSupported(false);
      return;
    }

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Stop when text changes
  useEffect(() => {
    handleStop();
  }, [text]);

  const handlePlay = useCallback(() => {
    if (!text || !isSupported) return;

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    const langCode = LANGUAGE_CODES[language] || "en-IN";
    utterance.lang = langCode;

    // Find voice for the language
    const langPrefix = langCode.split("-")[0];
    let voice = voices.find((v) => v.lang === langCode);
    if (!voice) voice = voices.find((v) => v.lang.startsWith(langPrefix));
    if (!voice) voice = voices.find((v) => v.lang === "en-IN");
    if (!voice) voice = voices.find((v) => v.lang.startsWith("en"));
    
    if (voice) {
      utterance.voice = voice;
    }

    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onboundary = (event) => {
      if (event.name === "word") {
        setProgress((event.charIndex / text.length) * 100);
      }
    };

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(0);
    };

    utterance.onerror = (event) => {
      if (event.error !== "interrupted") {
        console.error("Speech error:", event.error);
      }
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(0);
    };

    // Chrome bug fix
    const resumeInfinity = () => {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    };
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    progressIntervalRef.current = setInterval(resumeInfinity, 10000);

    window.speechSynthesis.speak(utterance);
  }, [text, language, isPaused, isSupported, voices]);

  const handlePause = useCallback(() => {
    if (!isPlaying) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
  }, [isPlaying]);

  const handleStop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
  }, []);

  if (!isSupported) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {isPlaying ? (
        <button
          onClick={handlePause}
          className="flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-1.5 text-sm text-amber-400 transition-colors hover:bg-amber-500/20"
          title="Pause"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
          Pause
        </button>
      ) : (
        <button
          onClick={handlePlay}
          className="flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-slate-700 hover:border-emerald-500/50"
          title={isPaused ? "Resume" : "Listen to letter"}
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          {isPaused ? "Resume" : "Listen"}
        </button>
      )}

      {(isPlaying || isPaused) && (
        <button
          onClick={handleStop}
          className="flex items-center gap-2 rounded-lg border border-red-500/50 px-3 py-1.5 text-sm text-red-400 transition-colors hover:bg-red-500/10"
          title="Stop"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h12v12H6z" />
          </svg>
          Stop
        </button>
      )}

      {(isPlaying || isPaused) && (
        <div className="flex items-center gap-2 ml-2">
          <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {isPlaying && (
        <div className="flex items-center gap-1 ml-2">
          <span className="w-1 h-3 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
          <span className="w-1 h-4 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
          <span className="w-1 h-2 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
          <span className="w-1 h-4 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: "450ms" }} />
        </div>
      )}
    </div>
  );
}
