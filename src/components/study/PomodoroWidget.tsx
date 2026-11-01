"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { logStudySession } from "@/server/actions/study";
import { useToast } from "@/context/ToastContext";

const SUBJECT_OPTIONS = [
  "Matematik",
  "Türkçe",
  "Fizik",
  "Kimya",
  "Biyoloji",
  "Geometri",
  "Tarih",
  "Coğrafya",
  "Felsefe",
  "Edebiyat",
  "Genel Deneme",
];

interface PomodoroWidgetProps {
  onSessionLogged?: () => void;
}

export default function PomodoroWidget({ onSessionLogged }: PomodoroWidgetProps) {
  const { showToast } = useToast();

  const [mode, setMode] = useState<"focus" | "shortBreak" | "longFocus">("focus");
  const [selectedSubject, setSelectedSubject] = useState(SUBJECT_OPTIONS[0]);
  const [questionCount, setQuestionCount] = useState<number | "">("");

  // Durations in seconds: focus = 25m, shortBreak = 5m, longFocus = 50m
  const durations = {
    focus: 25 * 60,
    shortBreak: 5 * 60,
    longFocus: 50 * 60,
  };

  const [timeLeft, setTimeLeft] = useState(durations.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Switch duration when mode changes
  const switchMode = (newMode: "focus" | "shortBreak" | "longFocus") => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(durations[newMode]);
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            showToast("Odaklanma seansı tamamlandı! Harika iş 🚀", "success");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, showToast]);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(durations[mode]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSaveSession = async () => {
    const elapsedSeconds = durations[mode] - timeLeft;
    const minutes = Math.max(1, Math.round(elapsedSeconds / 60));

    setSaving(true);
    const res = await logStudySession({
      subject: selectedSubject,
      durationMinutes: minutes,
      questionCount: Number(questionCount) || 0,
      notes: `${mode === "longFocus" ? "Derin Odaklanma" : "Pomodoro"} seansı`,
    });
    setSaving(false);

    if (res.success) {
      showToast(`${minutes} dk ${selectedSubject} çalışması kaydedildi!`, "success");
      setQuestionCount("");
      resetTimer();
      onSessionLogged?.();
    } else {
      showToast(res.error || "Kayıt yapılamadı.", "error");
    }
  };

  const progressPercent = ((durations[mode] - timeLeft) / durations[mode]) * 100;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6  flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-[#2F6BFF]/10 text-[#2F6BFF]">
            <Clock size={18} />
          </span>
          <div>
            <h3 className="font-bold text-[var(--text)] text-sm sm:text-base">Odaklan & Çalış</h3>
            <p className="text-xs text-[var(--text-muted)]">Pomodoro sayacı ile çalışma süreni kaydet</p>
          </div>
        </div>

        {/* Mode selector pills */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-semibold">
          <button
            onClick={() => switchMode("focus")}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              mode === "focus"
                ? "bg-[#2F6BFF] text-white shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            25 dk
          </button>
          <button
            onClick={() => switchMode("longFocus")}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              mode === "longFocus"
                ? "bg-[#2F6BFF] text-white shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            50 dk
          </button>
          <button
            onClick={() => switchMode("shortBreak")}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              mode === "shortBreak"
                ? "bg-[#FFB020] text-[#0F2A5C] shadow-xs font-bold"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            5 dk Mola
          </button>
        </div>
      </div>

      {/* Timer Display */}
      <div className="flex flex-col items-center justify-center my-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
        <div className="text-4xl sm:text-5xl font-semibold text-[var(--text)] tracking-tight font-mono">
          {formatTime(timeLeft)}
        </div>

        {/* Progress line */}
        <div className="w-48 h-1.5 bg-[var(--surface-3)] rounded-full mt-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              mode === "shortBreak" ? "bg-[#FFB020]" : "bg-[#2F6BFF]"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all shadow-md cursor-pointer ${
              isRunning
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-[#2F6BFF] hover:bg-[#4A80FF]"
            }`}
          >
            {isRunning ? (
              <>
                <Pause size={16} /> Duraklat
              </>
            ) : (
              <>
                <Play size={16} /> Başlat
              </>
            )}
          </button>

          <button
            onClick={resetTimer}
            aria-label="Sıfırla"
            className="p-2.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-3)] transition-colors cursor-pointer"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Inputs and Save */}
      <div className="space-y-3 pt-2">
        <div className="grid grid-cols-2 gap-2">
          {/* Subject dropdown */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">
              Ders
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[#2F6BFF]"
            >
              {SUBJECT_OPTIONS.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Question count input */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">
              Çözülen Soru
            </label>
            <input
              type="number"
              min="0"
              placeholder="0 soru"
              value={questionCount}
              onChange={(e) =>
                setQuestionCount(e.target.value === "" ? "" : parseInt(e.target.value) || 0)
              }
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[#2F6BFF]"
            />
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSaveSession}
          disabled={saving || timeLeft === durations[mode]}
          className="w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <CheckCircle2 size={15} className="text-[#0E7A3E]" />
          <span>{saving ? "Kaydediliyor..." : "Çalışma Seansını Günlüğe Ekle"}</span>
        </button>
      </div>
    </div>
  );
}
