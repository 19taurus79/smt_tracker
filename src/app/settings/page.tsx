"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Settings,
  Download,
  Upload,
  Volume2,
  Vibrate,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Info,
  Timer,
  Scale,
  BookOpen,
  Smartphone,
  Sun,
  Send,
  User,
  Globe,
  Share2,
} from "lucide-react";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { useBodyStore } from "@/lib/store/useBodyStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { soundPlayer } from "@/lib/audio/sound";
import { triggerHaptic, isTelegramWebApp } from "@/lib/tma/telegram";
import { shareToTelegramCoach } from "@/lib/coach/telegramCoach";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpModal } from "@/components/help/HelpModal";
import { useTranslation } from "@/lib/i18n";
import { AppLanguage } from "@/types/body";

export default function SettingsPage() {
  const { t, language, setLanguage } = useTranslation();
  const { workouts, exercises, setWorkouts, loadDemoData, resetAllWorkouts } =
    useWorkoutStore();
  const { measurements, setMeasurements, clearMeasurements, loadDemoMeasurements } =
    useBodyStore();
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const {
    defaultRestSeconds,
    setDefaultRestSeconds,
    weightIncrementKg,
    setWeightIncrementKg,
    soundEnabled,
    setSoundEnabled,
    hapticsEnabled,
    setHapticsEnabled,
    showForecastInAnalytics,
    setShowForecastInAnalytics,
    keepScreenAwake,
    setKeepScreenAwake,
    coachTelegramUsername,
    setCoachTelegramUsername,
    traineeName,
    setTraineeName,
    gender,
    setGender,
    userAge,
    setUserAge,
    storyBotUsername,
    setStoryBotUsername,
  } = useSettingsStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Экспорт данных в JSON
  const handleExportJSON = () => {
    try {
      const backupData = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        exercises,
        workouts,
        measurements,
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `smt_backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(t.common.success);
      triggerHaptic("success");
    } catch (e) {
      console.error(e);
      showToast(t.common.error);
    }
  };

  // Импорт данных из JSON
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (parsed.workouts && Array.isArray(parsed.workouts)) {
          setWorkouts(parsed.workouts);
        }
        if (parsed.measurements && Array.isArray(parsed.measurements)) {
          setMeasurements(parsed.measurements);
        }

        showToast(t.common.success);
        triggerHaptic("success");
      } catch (err) {
        console.error("Ошибка при разборе JSON:", err);
        showToast(t.common.error);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTestSound = () => {
    soundPlayer.playBeep(880, 0.15);
    setTimeout(() => soundPlayer.playBeep(1760, 0.4), 180);
    triggerHaptic("success");
    showToast(t.settings.soundTestSuccess);
  };

  const inTelegram = mounted ? isTelegramWebApp() : false;
  const tgUser = mounted && typeof window !== "undefined" ? (window as any).Telegram?.WebApp?.initDataUnsafe?.user : null;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <Settings className="h-6 w-6 text-emerald-400" />
          <span>{t.settings.title}</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">{t.settings.subtitle}</p>
      </div>

      {/* Toast Alert */}
      {notification && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* 1. Language Selector Card */}
      <Card className="border-emerald-500/30 bg-slate-900/60 p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2 text-white">
            <Globe className="h-4 w-4 text-emerald-400" />
            <span>{t.settings.language}</span>
          </CardTitle>
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
            {language}
          </span>
        </div>
        <p className="text-xs text-slate-400">{t.settings.languageDesc}</p>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={() => setLanguage("uk")}
            className={`py-2.5 px-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
              language === "uk"
                ? "bg-emerald-500/20 border-emerald-500 text-white shadow-lg shadow-emerald-500/20 font-bold"
                : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <span className="text-base">🇺🇦</span>
            <span className="text-xs">{t.settings.langUk}</span>
          </button>

          <button
            type="button"
            onClick={() => setLanguage("en")}
            className={`py-2.5 px-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
              language === "en"
                ? "bg-emerald-500/20 border-emerald-500 text-white shadow-lg shadow-emerald-500/20 font-bold"
                : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <span className="text-base">🇬🇧</span>
            <span className="text-xs">{t.settings.langEn}</span>
          </button>

          <button
            type="button"
            onClick={() => setLanguage("ru")}
            className={`py-2.5 px-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
              language === "ru"
                ? "bg-emerald-500/20 border-emerald-500 text-white shadow-lg shadow-emerald-500/20 font-bold"
                : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <span className="text-base">🇷🇺</span>
            <span className="text-xs">{t.settings.langRu}</span>
          </button>
        </div>
      </Card>

      {/* 2. Athlete Profile (for Athletic Score) */}
      <Card className="border-white/10 bg-slate-900/60 p-4 sm:p-5 space-y-3">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2 text-white">
          <User className="h-4 w-4 text-cyan-400" />
          <span>{t.settings.athleteProfile}</span>
        </CardTitle>
        <p className="text-xs text-slate-400">
          {t.settings.athleteProfileDesc}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              {t.settings.gender}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setGender("male")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  gender === "male"
                    ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                    : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {t.settings.genderMale}
              </button>
              <button
                type="button"
                onClick={() => setGender("female")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  gender === "female"
                    ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                    : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {t.settings.genderFemale}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              {t.settings.userAge}
            </label>
            <input
              type="number"
              min={14}
              max={90}
              value={userAge || 28}
              onChange={(e) => setUserAge(Number(e.target.value))}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>
      </Card>

      {/* 3. Workout Preferences */}
      <Card className="border-white/10 bg-slate-900/60 p-4 sm:p-5 space-y-4">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <Timer className="h-4 w-4 text-emerald-400" />
          <span>{t.settings.trainingParams}</span>
        </CardTitle>

        <div className="space-y-3">
          {/* Default Rest Timer */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              {t.settings.defaultRest} ({t.common.sec})
            </label>
            <div className="flex gap-2">
              {[15, 30, 45, 60, 90].map((sec) => (
                <button
                  key={sec}
                  onClick={() => setDefaultRestSeconds(sec)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    defaultRestSeconds === sec
                      ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                      : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {sec}с
                </button>
              ))}
            </div>
          </div>

          {/* Weight Increment */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              {t.settings.weightIncrement} ({t.common.kg})
            </label>
            <div className="flex gap-2">
              {[1.25, 2.5, 5.0].map((step) => (
                <button
                  key={step}
                  onClick={() => setWeightIncrementKg(step)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    weightIncrementKg === step
                      ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                      : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  +{step} {t.common.kg}
                </button>
              ))}
            </div>
          </div>

          {/* Forecast in Analytics Toggle */}
          <div className="pt-2 border-t border-white/5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-slate-300 block">
                  {t.analytics.toggleForecast}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  {t.analytics.forecastEnabled}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowForecastInAnalytics(!showForecastInAnalytics)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shrink-0 ${
                  showForecastInAnalytics
                    ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20"
                    : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
                }`}
              >
                {showForecastInAnalytics ? t.common.confirm : t.common.cancel}
              </button>
            </div>
          </div>

          {/* Keep Screen Awake (Wake Lock) */}
          <div className="pt-2 border-t border-white/5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-slate-300 block">
                  {t.settings.screenWakeLock}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  {t.settings.screenWakeLockDesc}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setKeepScreenAwake(!keepScreenAwake)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shrink-0 ${
                  keepScreenAwake
                    ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20"
                    : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
                }`}
              >
                {keepScreenAwake ? t.common.confirm : t.common.cancel}
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* 4. Telegram Coach & Story Bot Settings */}
      <Card className="border-cyan-500/30 bg-slate-900/60 p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2 text-white">
            <Send className="h-4 w-4 text-cyan-400" />
            <span>{t.settings.coachIntegration}</span>
          </CardTitle>
          <span className="text-[10px] text-cyan-400 font-mono">1-Click</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              {t.settings.traineeName}
            </label>
            <input
              type="text"
              value={traineeName}
              onChange={(e) => setTraineeName(e.target.value)}
              placeholder="Наприклад: Олександр"
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              {t.settings.coachUsername}
            </label>
            <input
              type="text"
              value={coachTelegramUsername}
              onChange={(e) => setCoachTelegramUsername(e.target.value)}
              placeholder="@coach_username"
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Story Bot / Channel Username */}
        <div className="pt-2 border-t border-white/5">
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            {t.settings.storyBotUsername}
          </label>
          <input
            type="text"
            value={storyBotUsername || ""}
            onChange={(e) => setStoryBotUsername(e.target.value)}
            placeholder="@smt_workout_bot"
            className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
          />
          <span className="text-[10px] text-slate-400 block mt-1">
            {t.settings.storyBotUsernameDesc}
          </span>
        </div>
      </Card>

      {/* 5. Sound & Haptics */}
      <Card className="border-white/10 bg-slate-900/60 p-4 sm:p-5 space-y-3">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-cyan-400" />
          <span>{t.settings.audioAndHaptics}</span>
        </CardTitle>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              variant={soundEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-xs font-semibold"
            >
              <Volume2 className="h-4 w-4 mr-1.5" />
              <span>{t.settings.soundEffects}: {soundEnabled ? t.common.confirm : t.common.cancel}</span>
            </Button>

            <Button
              variant={hapticsEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setHapticsEnabled(!hapticsEnabled)}
              className="text-xs font-semibold"
            >
              <Vibrate className="h-4 w-4 mr-1.5" />
              <span>{t.settings.hapticFeedback}: {hapticsEnabled ? t.common.confirm : t.common.cancel}</span>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleTestSound}
            className="text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
          >
            {t.settings.testSound}
          </Button>
        </div>
      </Card>

      {/* 6. Backup and JSON */}
      <Card className="border-white/10 bg-slate-900/60 p-4 sm:p-5 space-y-3">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <Download className="h-4 w-4 text-amber-400" />
          <span>{t.settings.backupAndData}</span>
        </CardTitle>
        <p className="text-xs text-slate-400">
          {t.settings.backupDesc}
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <Button variant="accent" size="sm" onClick={handleExportJSON} className="flex-1 font-bold">
            <Download className="h-4 w-4 mr-2" />
            <span>{t.settings.exportJson}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 font-semibold border-white/15 hover:bg-white/10"
          >
            <Upload className="h-4 w-4 mr-2" />
            <span>{t.settings.importJson}</span>
          </Button>
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleImportFile}
            className="hidden"
          />
        </div>
      </Card>

      {/* 7. SMT Guide */}
      <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-slate-900/60 to-slate-900/60 p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2 text-white">
            <BookOpen className="h-4 w-4 text-emerald-400" />
            <span>{t.settings.guideSectionTitle}</span>
          </CardTitle>
          <span className="text-[10px] text-emerald-400 font-mono">GUIDE.md</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <Button
            variant="accent"
            size="sm"
            onClick={() => setIsHelpModalOpen(true)}
            className="text-xs font-bold"
          >
            <BookOpen className="h-4 w-4 mr-1.5" />
            <span>{t.settings.guideOpenInteractive}</span>
          </Button>

          <Link href="/help">
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-semibold w-full sm:w-auto border-white/15 hover:bg-white/10"
            >
              <span>{t.settings.guideReadSeparate}</span>
            </Button>
          </Link>
        </div>
      </Card>

      {/* 8. Demo & Reset */}
      <Card className="border-white/10 bg-slate-900/60 p-4 sm:p-5 space-y-3">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-400" />
          <span>{t.settings.loadDemo}</span>
        </CardTitle>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadDemoData();
              loadDemoMeasurements();
              showToast(t.settings.demoLoadedToast);
            }}
            className="text-xs font-semibold hover:border-purple-500/40 hover:text-purple-300"
          >
            <Sparkles className="h-4 w-4 mr-1.5 text-purple-400" />
            <span>{t.settings.loadDemo}</span>
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm(t.settings.resetConfirm)) {
                resetAllWorkouts();
                clearMeasurements();
                showToast(t.settings.resetSuccessToast);
              }
            }}
            className="text-xs font-semibold"
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            <span>{t.settings.resetWorkouts}</span>
          </Button>
        </div>
      </Card>

      {/* Help Modal */}
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
    </div>
  );
}
