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
  User,
  Globe,
  Share2,
  Crown,
  Link as LinkIcon,
  Unlink,
  ShieldCheck,
  Send,
  Copy,
  ArrowRightLeft,
  FileJson,
} from "lucide-react";
import { MASTER_COACH_USERNAME, isCoachAccount, generateTelegramLinkUrl } from "@/lib/auth/roles";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { useBodyStore } from "@/lib/store/useBodyStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { usePrepStore } from "@/lib/store/usePrepStore";
import { soundPlayer } from "@/lib/audio/sound";
import { triggerHaptic, isTelegramWebApp } from "@/lib/tma/telegram";
import { shareToTelegramCoach } from "@/lib/coach/telegramCoach";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
    linkedTelegramUser,
    linkTelegramAccount,
    unlinkTelegramAccount,
    userRole,
  } = useSettingsStore();

  const {
    prepWidgetDismissed,
    setPrepWidgetDismissed,
    resetPrepSessions,
    sessions: prepSessions,
  } = usePrepStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // 1. Direct login if opened inside Telegram TMA
    if (typeof window !== "undefined" && window.Telegram?.WebApp?.initDataUnsafe?.user) {
      const tgUser = window.Telegram.WebApp.initDataUnsafe.user;
      const isCoach = isCoachAccount(tgUser.username, tgUser.id);
      linkTelegramAccount({
        id: tgUser.id,
        firstName: tgUser.first_name,
        lastName: tgUser.last_name,
        username: tgUser.username,
        authDate: Date.now(),
        isCoach,
      });
      if (!isCoach) {
        setCoachTelegramUsername(MASTER_COACH_USERNAME);
      }
    }

    // 2. 1-click redirect from Telegram bot back into PWA
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tg_auth") === "1") {
        const id = Number(params.get("id"));
        const firstName = params.get("first_name") || "Атлет";
        const username = params.get("username") || undefined;
        if (id) {
          const isCoach = isCoachAccount(username, id);
          linkTelegramAccount({
            id,
            firstName,
            username,
            authDate: Date.now(),
            isCoach,
          });
          if (!isCoach) {
            setCoachTelegramUsername(MASTER_COACH_USERNAME);
          }
          showToast(
            language === "uk"
              ? "🎉 Telegram успішно підключено до вашого PWA!"
              : language === "en"
              ? "🎉 Telegram linked successfully to your PWA!"
              : "🎉 Telegram успешно подключен к вашему PWA!"
          );
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
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

  const [transferCodeModalOpen, setTransferCodeModalOpen] = useState(false);
  const [transferCodeText, setTransferCodeText] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyTransferCode = () => {
    try {
      const backupData = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        exercises,
        workouts,
        measurements,
      };
      const jsonStr = JSON.stringify(backupData);
      const b64 = btoa(unescape(encodeURIComponent(jsonStr)));
      navigator.clipboard.writeText(b64);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 3000);
      showToast(
        language === "uk"
          ? "📋 Код скопійовано! Відкрийте Telegram-трекер та натисніть «Вставити код»."
          : "📋 Код скопирован! Откройте Telegram-трекер и нажмите «Вставить код»."
      );
      triggerHaptic("success");
    } catch {
      showToast(t.common.error);
    }
  };

  const handleApplyTransferCode = () => {
    if (!transferCodeText.trim()) return;
    try {
      const jsonStr = decodeURIComponent(escape(atob(transferCodeText.trim())));
      const parsed = JSON.parse(jsonStr);
      if (parsed.workouts && Array.isArray(parsed.workouts)) {
        setWorkouts(parsed.workouts);
      }
      if (parsed.measurements && Array.isArray(parsed.measurements)) {
        setMeasurements(parsed.measurements);
      }
      setTransferCodeModalOpen(false);
      setTransferCodeText("");
      showToast(
        language === "uk"
          ? "🎉 Всі тренування та замери успішно перенесені в Telegram!"
          : "🎉 Все тренировки и замеры успешно перенесены в Telegram!"
      );
      triggerHaptic("success");
    } catch {
      showToast(
        language === "uk"
          ? "❌ Невірний код перенесення"
          : "❌ Неверный код переноса"
      );
    }
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

      {/* 4. Telegram Account & Coach Linking (RBAC) */}
      <Card
        className={`p-4 sm:p-5 space-y-4 transition-all ${
          userRole === "coach"
            ? "border-amber-500/40 bg-gradient-to-br from-amber-950/20 via-slate-900/60 to-slate-900/90 shadow-lg shadow-amber-500/5"
            : "border-cyan-500/30 bg-slate-900/60"
        }`}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2 text-white">
            {userRole === "coach" ? (
              <>
                <Crown className="h-4 w-4 text-amber-400" />
                <span className="text-amber-300">
                  {language === "uk"
                    ? "Панель Головного Тренера"
                    : language === "en"
                    ? "Master Coach Panel"
                    : "Панель Главного Тренера"}
                </span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4 text-cyan-400" />
                <span>{t.settings.coachIntegration}</span>
              </>
            )}
          </CardTitle>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              userRole === "coach"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : linkedTelegramUser
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "bg-slate-800 text-slate-400 border border-white/10"
            }`}
          >
            {userRole === "coach"
              ? "👑 COACH"
              : linkedTelegramUser
              ? "TRAINEE"
              : "PWA STANDALONE"}
          </span>
        </div>

        {/* Coach Mode Banner */}
        {userRole === "coach" ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/25 p-3.5 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <ShieldCheck className="h-4 w-4" />
              <span>
                {language === "uk"
                  ? `Ви авторизовані як Тренер (@${linkedTelegramUser?.username || MASTER_COACH_USERNAME})`
                  : language === "en"
                  ? `Authenticated as Master Coach (@${linkedTelegramUser?.username || MASTER_COACH_USERNAME})`
                  : `Вы авторизованы как Тренер (@${linkedTelegramUser?.username || MASTER_COACH_USERNAME})`}
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {language === "uk"
                ? "Усі звіти підопічних атлетів автоматично надсилаються у ваш особистий Telegram. Ви маєте повні права модерації результатів Челенджу."
                : language === "en"
                ? "All trainee workout reports are delivered directly to your Telegram. You hold full moderation rights for the SMT Challenge."
                : "Все отчеты подопечных атлетов автоматически отправляются в ваш личный Telegram. Вы обладаете полными правами модерации Челленджа."}
            </p>
          </div>
        ) : (
          /* Trainee or Guest Mode */
          <div className="space-y-3">
            {linkedTelegramUser ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-300">
                    {linkedTelegramUser.firstName.charAt(0)}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {linkedTelegramUser.firstName}
                    </span>
                    <span className="text-[11px] text-emerald-400 block">
                      {linkedTelegramUser.username ? `@${linkedTelegramUser.username}` : "Telegram ID: " + linkedTelegramUser.id}
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    unlinkTelegramAccount();
                    showToast(
                      language === "uk" ? "Telegram відв'язано" : "Telegram unlinked"
                    );
                  }}
                  className="text-[11px] h-7 border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                >
                  <Unlink className="h-3 w-3 mr-1" />
                  <span>{language === "uk" ? "Відв'язати" : "Unlink"}</span>
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3.5 space-y-2">
                <span className="text-xs font-bold text-cyan-300 block">
                  🏋️‍♂️ Telegram Mini App
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {language === "uk"
                    ? "Для повноцінної роботи, синхронізації та відправки звітів тренеру відкрийте трекер через офіційного бота."
                    : "Open the tracker via the official Telegram bot for full cloud sync and direct coach reporting."}
                </p>
                <Button
                  type="button"
                  variant="accent"
                  size="sm"
                  onClick={() => window.open("https://t.me/athletic_smt_bot", "_blank")}
                  className="w-full text-xs font-bold bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 hover:opacity-90 flex items-center justify-center gap-1.5"
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                  <span>
                    {language === "uk" ? "Відкрити в Telegram" : "Open in Telegram"}
                  </span>
                </Button>
              </div>
            )}

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
                  {language === "uk" ? "Персональний Тренер" : "Personal Coach"}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled={Boolean(linkedTelegramUser)}
                    value={linkedTelegramUser ? `@${MASTER_COACH_USERNAME}` : coachTelegramUsername}
                    onChange={(e) => setCoachTelegramUsername(e.target.value)}
                    placeholder={`@${MASTER_COACH_USERNAME}`}
                    className={`w-full rounded-xl border px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none ${
                      linkedTelegramUser
                        ? "bg-slate-900 border-white/10 text-slate-400 cursor-not-allowed"
                        : "bg-slate-950 border-white/10 focus:border-cyan-400"
                    }`}
                  />
                  {linkedTelegramUser && (
                    <span className="absolute right-2.5 top-2 text-[10px] text-emerald-400 font-semibold">
                      Закріплено
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

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

      {/* 7.5 Adaptation Prep Cycle Control */}
      <Card className="border-cyan-500/30 bg-slate-900/60 p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2 text-white">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span>
              {language === "uk"
                ? "Вводний цикл адаптації (6 тренувань)"
                : language === "en"
                ? "Prep Adaptation Cycle (6 sessions)"
                : "Вводный цикл адаптации (6 тренировок)"}
            </span>
          </CardTitle>
          <span className="text-[10px] text-cyan-400 font-mono">
            {prepSessions.filter((s) => s.completed).length}/6 {language === "uk" ? "пройдено" : "пройдено"}
          </span>
        </div>
        <p className="text-xs text-slate-400">
          {language === "uk"
            ? "Підготовка серця та судин до 30-секундних пауз СМТ-1. Якщо ви випадково приховали віджет на головній або бажаєте пройти адаптацію заново — керуйте цим тут."
            : "Подготовка сердца и сосудов к 30-секундным паузам СМТ-1. Если вы случайно скрыли виджет на главной или хотите пройти адаптацию заново — управляйте этим здесь."}
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          {prepWidgetDismissed ? (
            <Button
              variant="accent"
              size="sm"
              onClick={() => {
                setPrepWidgetDismissed(false);
                showToast(
                  language === "uk"
                    ? "Віджет адаптації повернуто на головну!"
                    : "Виджет адаптации возвращен на главную!"
                );
              }}
              className="text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400"
            >
              <Sparkles className="h-4 w-4 mr-1.5" />
              <span>
                {language === "uk"
                  ? "Показати віджет на головній"
                  : "Показать виджет на главной"}
              </span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPrepWidgetDismissed(true);
                showToast(
                  language === "uk"
                    ? "Віджет адаптації приховано з головної"
                    : "Виджет адаптации скрыт с главной"
                );
              }}
              className="text-xs font-semibold border-white/15"
            >
              <span>
                {language === "uk"
                  ? "Приховати віджет з головної"
                  : "Скрыть виджет с главной"}
              </span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (
                confirm(
                  language === "uk"
                    ? "Скинути всі 6 вводних тренувань і почати адаптацію спочатку?"
                    : "Сбросить все 6 вводных тренировок и начать адаптацию сначала?"
                )
              ) {
                resetPrepSessions();
                showToast(
                  language === "uk"
                    ? "Вводний цикл скинуто"
                    : "Вводный цикл сброшен"
                );
              }
            }}
            className="text-xs font-semibold text-slate-400 hover:text-white border-white/10"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            <span>
              {language === "uk" ? "Скинути адаптацію" : "Сбросить адаптацию"}
            </span>
          </Button>
        </div>
      </Card>

      {/* 8. Резервна копія та перенесення в Telegram */}
      <Card className="border-emerald-500/30 bg-slate-900/60 p-4 sm:p-5 space-y-3">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImportFile}
          accept=".json"
          className="hidden"
        />
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2 text-white">
            <ArrowRightLeft className="h-4 w-4 text-emerald-400" />
            <span>
              {language === "uk"
                ? "Резервна копія та перенесення в Telegram"
                : "Резервная копия и перенос в Telegram"}
            </span>
          </CardTitle>
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            Без втрати даних
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          {language === "uk"
            ? "Перенесіть усі проведені тренування із Safari у Telegram Mini App або збережіть файл резервної копії:"
            : "Перенесите все проведенные тренировки из Safari в Telegram Mini App или сохраните файл резервной копии:"}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {/* Способ 1: Код переноса (мгновенно для iPhone) */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyTransferCode}
            className="text-xs font-bold border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 flex items-center justify-center gap-1.5 py-2.5"
          >
            <Copy className="h-4 w-4 text-emerald-400" />
            <span>
              {copiedCode
                ? language === "uk"
                  ? "✓ Код скопійовано!"
                  : "✓ Код скопирован!"
                : language === "uk"
                ? "Скопіювати код перенесення"
                : "Скопировать код переноса"}
            </span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setTransferCodeModalOpen(true)}
            className="text-xs font-semibold border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 flex items-center justify-center gap-1.5 py-2.5"
          >
            <ArrowRightLeft className="h-4 w-4 text-cyan-400" />
            <span>
              {language === "uk" ? "Вставити код у Telegram" : "Вставить код в Telegram"}
            </span>
          </Button>

          {/* Способ 2: Файлы JSON */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportJSON}
            className="text-xs font-medium border-white/10 text-slate-300 hover:text-white flex items-center justify-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5 text-slate-400" />
            <span>{language === "uk" ? "Експорт файлу (.json)" : "Экспорт файла (.json)"}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-medium border-white/10 text-slate-300 hover:text-white flex items-center justify-center gap-1.5"
          >
            <Upload className="h-3.5 w-3.5 text-slate-400" />
            <span>{language === "uk" ? "Імпорт із файлу (.json)" : "Импорт из файла (.json)"}</span>
          </Button>
        </div>
      </Card>

      {/* 9. Demo & Reset */}
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

      {/* Transfer Code Modal */}
      <Dialog open={transferCodeModalOpen} onOpenChange={setTransferCodeModalOpen}>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-slate-900 p-5 space-y-4 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-emerald-400" />
                <span>
                  {language === "uk"
                    ? "Вставити код перенесення даних"
                    : "Вставить код переноса данных"}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400 leading-relaxed">
                {language === "uk"
                  ? "Вставте код, скопійований у Safari-версії трекера. Всі ваші тренування, робочі ваги та замери будуть миттєво перенесені в цей Telegram Mini App."
                  : "Вставьте код, скопированный в Safari-версии трекера. Все ваши тренировки, рабочие веса и замеры будут мгновенно перенесены в этот Telegram Mini App."}
              </DialogDescription>
            </DialogHeader>

            <textarea
              rows={4}
              value={transferCodeText}
              onChange={(e) => setTransferCodeText(e.target.value)}
              placeholder={
                language === "uk"
                  ? "Вставте код перенесення тут..."
                  : "Вставьте код переноса сюда..."
              }
              className="w-full rounded-xl border border-white/15 bg-slate-950 p-3 text-xs text-white placeholder:text-slate-500 font-mono focus:outline-none focus:border-emerald-500"
            />

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTransferCodeModalOpen(false)}
                className="flex-1 text-xs border-white/10"
              >
                <span>{t.common.cancel}</span>
              </Button>
              <Button
                size="sm"
                onClick={handleApplyTransferCode}
                className="flex-1 text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400"
              >
                <span>{language === "uk" ? "Застосувати" : "Применить"}</span>
              </Button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Help Modal */}
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
    </div>
  );
}
