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
  Cloud,
  RefreshCw,
} from "lucide-react";
import { MASTER_COACH_USERNAME, isCoachAccount, generateTelegramLinkUrl } from "@/lib/auth/roles";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { useBodyStore } from "@/lib/store/useBodyStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { usePrepStore } from "@/lib/store/usePrepStore";
import { soundPlayer } from "@/lib/audio/sound";
import { triggerHaptic, isTelegramWebApp } from "@/lib/tma/telegram";
import { syncAllStoresWithCloud, isCloudStorageAvailable } from "@/lib/tma/cloudStorage";
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
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(b64).then(() => {
          setCopiedCode(true);
          setTimeout(() => setCopiedCode(false), 3000);
          showToast(
            language === "uk"
              ? "📋 Код скопійовано! Відкрийте Telegram-трекер та натисніть «Вставити код»."
              : "📋 Код скопирован! Откройте Telegram-трекер и нажмите «Вставить код»."
          );
          triggerHaptic("success");
        }).catch(() => {
          prompt(
            language === "uk"
              ? "Скопіюйте цей код перенесення:"
              : "Скопируйте этот код переноса:",
            b64
          );
        });
      } else {
        prompt(
          language === "uk"
            ? "Скопіюйте цей код перенесення:"
            : "Скопируйте этот код переноса:",
          b64
        );
      }
    } catch {
      showToast(t.common.error);
    }
  };

  const handleApplyTransferCode = () => {
    const raw = transferCodeText.trim();
    if (!raw) return;
    try {
      let jsonStr = "";
      const cleaned = raw.replace(/\s+/g, "");
      try {
        jsonStr = decodeURIComponent(escape(atob(cleaned)));
      } catch {
        jsonStr = raw;
      }
      const parsed = JSON.parse(jsonStr);
      if (parsed.workouts && Array.isArray(parsed.workouts)) {
        setWorkouts(parsed.workouts);
      }
      if (parsed.measurements && Array.isArray(parsed.measurements)) {
        setMeasurements(parsed.measurements);
      }

      // Immediately notify coach and register athlete in server roster!
      const totalW = parsed.workouts?.length || 0;
      const latestW = parsed.workouts && parsed.workouts.length > 0 ? parsed.workouts[0] : null;
      const latestM = parsed.measurements && parsed.measurements.length > 0 ? parsed.measurements[0] : null;
      const totalTonnage = parsed.workouts?.reduce((acc: number, w: { tonnageKg?: number }) => acc + (w.tonnageKg || 0), 0) || 0;

      if (typeof window !== "undefined") {
        const tgUser = (window.Telegram?.WebApp as any)?.initDataUnsafe?.user;
        const effectiveUser = linkedTelegramUser || tgUser;
        if (effectiveUser) {
          const athleteDisplayName = traineeName || effectiveUser.first_name || (effectiveUser as any).firstName || "Атлет";
          import("@/lib/tma/sync").then(({ syncTraineeTransfer }) => {
            syncTraineeTransfer({
              name: athleteDisplayName,
              username: effectiveUser.username || "",
              telegramUserId: effectiveUser.id,
              totalWorkouts: totalW,
              currentMicrocycle: latestW?.microcycle || 1,
              weightKg: latestM?.weightKg || 80,
              totalTonnageKg: totalTonnage,
            }).catch(() => {});
          });
        }
      }

      setTransferCodeModalOpen(false);
      setTransferCodeText("");
      showToast(
        language === "uk"
          ? "🎉 Всі тренування та замери успішно перенесені в Telegram!"
          : "🎉 Все тренировки и замеры успешно перенесены в Telegram!"
      );
      triggerHaptic("success");
    } catch (e) {
      console.error("Transfer code error:", e);
      showToast(
        language === "uk"
          ? "❌ Невірний код перенесення"
          : "❌ Неверный код переноса"
      );
    }
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setTransferCodeText(text.trim());
          triggerHaptic("selection");
        }
      }
    } catch (err) {
      console.warn("Clipboard read not allowed:", err);
    }
  };

  const handleTestSound = () => {
    soundPlayer.playBeep(880, 0.15);
    setTimeout(() => soundPlayer.playBeep(1760, 0.4), 180);
    triggerHaptic("success");
    showToast(t.settings.soundTestSuccess);
  };

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResultText, setSyncResultText] = useState<string | null>(null);

  const handleManualCloudSync = async () => {
    setIsSyncing(true);
    setSyncResultText(null);
    triggerHaptic("selection");
    try {
      const res = await syncAllStoresWithCloud({ forceUpload: workouts.filter((w) => w.status === "completed").length > 0 });
      triggerHaptic("success");
      setSyncResultText(res.message);
      showToast(res.message);
    } catch (e: any) {
      setSyncResultText(
        language === "uk"
          ? `⚠️ Помилка синхронізації: ${e?.message || "Невідомо"}`
          : `⚠️ Ошибка синхронизации: ${e?.message || "Неизвестно"}`
      );
      triggerHaptic("warning");
    } finally {
      setIsSyncing(false);
    }
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
              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-300 block">
                  {t.analytics.toggleForecast}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5 leading-tight">
                  {t.analytics.forecastEnabled}
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={showForecastInAnalytics}
                onClick={() => {
                  setShowForecastInAnalytics(!showForecastInAnalytics);
                  triggerHaptic("selection");
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  showForecastInAnalytics ? "bg-emerald-500 shadow-md shadow-emerald-500/30" : "bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    showForecastInAnalytics ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Keep Screen Awake (Wake Lock) */}
          <div className="pt-2 border-t border-white/5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-300 block">
                  {t.settings.screenWakeLock}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5 leading-tight">
                  {t.settings.screenWakeLockDesc}
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={keepScreenAwake}
                onClick={() => {
                  setKeepScreenAwake(!keepScreenAwake);
                  triggerHaptic("selection");
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  keepScreenAwake ? "bg-emerald-500 shadow-md shadow-emerald-500/30" : "bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    keepScreenAwake ? "translate-x-5" : "translate-x-0"
                  }`}
                />
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
      <Card className="border-white/10 bg-slate-900/60 p-4 sm:p-5 space-y-4">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-cyan-400" />
          <span>{t.settings.audioAndHaptics}</span>
        </CardTitle>

        <div className="space-y-3 divide-y divide-white/5">
          {/* Sound Effects Row */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0 text-cyan-400">
                <Volume2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-semibold text-white block truncate">
                  {t.settings.soundEffects}
                </span>
                <span className="text-[11px] text-slate-400 block leading-tight">
                  {language === "uk"
                    ? "Звукові сигнали таймера відпочинку"
                    : language === "en"
                    ? "Rest timer beep notifications"
                    : "Звуковые сигналы таймера отдыха"}
                </span>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={soundEnabled}
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                triggerHaptic("selection");
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                soundEnabled ? "bg-emerald-500 shadow-md shadow-emerald-500/30" : "bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  soundEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Haptics Row */}
          <div className="flex items-center justify-between gap-3 pt-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0 text-purple-400">
                <Vibrate className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-semibold text-white block truncate">
                  {t.settings.hapticFeedback}
                </span>
                <span className="text-[11px] text-slate-400 block leading-tight">
                  {language === "uk"
                    ? "Тактильний відгук на кнопки та таймер"
                    : language === "en"
                    ? "Haptic vibration on taps and timer"
                    : "Тактильный отклик на кнопки и таймер"}
                </span>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={hapticsEnabled}
              onClick={() => {
                setHapticsEnabled(!hapticsEnabled);
                triggerHaptic("selection");
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                hapticsEnabled ? "bg-emerald-500 shadow-md shadow-emerald-500/30" : "bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  hapticsEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Test Sound Button */}
          <div className="pt-3 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestSound}
              className="w-full sm:w-auto h-9 text-xs text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-300 font-semibold flex items-center justify-center gap-2"
            >
              <Volume2 className="h-3.5 w-3.5" />
              <span>{t.settings.testSound}</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* 5.5. Telegram CloudStorage Cross-Device Sync */}
      <Card className="border-cyan-500/30 bg-gradient-to-br from-cyan-950/25 via-slate-900/60 to-slate-900/60 p-4 sm:p-5 space-y-3 shadow-lg shadow-cyan-500/5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2 text-white">
            <Cloud className="h-4 w-4 text-cyan-400" />
            <span>
              {language === "uk"
                ? "Хмарна синхронізація Telegram"
                : language === "en"
                ? "Telegram Cloud Sync"
                : "Облачная синхронизация Telegram"}
            </span>
          </CardTitle>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              isCloudStorageAvailable()
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                : "bg-slate-800 text-slate-400 border-white/10"
            }`}
          >
            {isCloudStorageAvailable() ? "🟢 CLOUD SYNC" : "📱 LOCAL"}
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          {language === "uk"
            ? "Автоматична синхронізація ваших тренувань, 1ПМ та замірів між мобільним телефоном та десктопом під вашим акаунтом Telegram."
            : language === "en"
            ? "Automatic synchronization of workouts, 1RM, and body measurements between mobile and desktop."
            : "Автоматическая синхронизация ваших тренировок, 1ПМ и замеров между мобильным телефоном и десктопом под вашим аккаунтом Telegram."}
        </p>

        {syncResultText && (
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/40 p-2.5 text-xs text-cyan-200">
            {syncResultText}
          </div>
        )}

        <div className="pt-1 flex flex-col sm:flex-row items-center gap-3">
          <Button
            variant="accent"
            size="sm"
            onClick={handleManualCloudSync}
            disabled={isSyncing}
            className="w-full sm:w-auto h-9 font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span>
              {isSyncing
                ? (language === "uk" ? "Синхронізація..." : "Синхронизация...")
                : (language === "uk" ? "🔄 Синхронізувати зараз" : "🔄 Синхронизировать сейчас")}
            </span>
          </Button>

          <span className="text-[11px] text-slate-400 text-center sm:text-left">
            {language === "uk"
              ? "Виконано тренувань у системі: " + workouts.filter((w) => w.status === "completed").length
              : "Выполнено тренировок в системе: " + workouts.filter((w) => w.status === "completed").length}
          </span>
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
      <Dialog open={transferCodeModalOpen} onOpenChange={setTransferCodeModalOpen} className="max-w-md p-4 sm:p-5">
        <DialogHeader className="shrink-0 mb-2">
          <DialogTitle
            onClose={() => setTransferCodeModalOpen(false)}
            className="text-base font-bold text-white flex items-center gap-2"
          >
            <ArrowRightLeft className="h-5 w-5 text-emerald-400" />
            <span>
              {language === "uk"
                ? "Вставити код перенесення даних"
                : "Вставить код переноса данных"}
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400 leading-relaxed mt-1">
            {language === "uk"
              ? "Вставте код, скопійований у Safari-версії трекера. Всі ваші тренування, робочі ваги та замери будуть миттєво перенесені в цей Telegram Mini App."
              : "Вставьте код, скопированный в Safari-версии трекера. Все ваши тренировки, рабочие веса и замеры будут мгновенно перенесены в этот Telegram Mini App."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-2">
          <textarea
            rows={4}
            value={transferCodeText}
            onChange={(e) => setTransferCodeText(e.target.value)}
            placeholder={
              language === "uk"
                ? "Вставте код перенесення тут..."
                : "Вставьте код переноса сюда..."
            }
            className="w-full rounded-xl border border-white/15 bg-slate-950 p-3 text-xs text-white placeholder:text-slate-500 font-mono break-all focus:outline-none focus:border-emerald-500 resize-none"
          />

          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePasteClipboard}
              className="text-xs text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10 flex items-center gap-1.5"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>{language === "uk" ? "Вставити з буфера" : "Вставить из буфера"}</span>
            </Button>

            <span className="text-[10px] text-slate-400 font-mono">
              {transferCodeText.length > 0 ? `${transferCodeText.length} симв.` : ""}
            </span>
          </div>

          <div className="flex gap-2 pt-2 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTransferCodeModalOpen(false)}
              className="flex-1 text-xs border-white/10"
            >
              <span>{t.common.cancel}</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApplyTransferCode}
              disabled={!transferCodeText.trim()}
              className="flex-1 text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
            >
              <span>{language === "uk" ? "Застосувати" : "Применить"}</span>
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Help Modal */}
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
    </div>
  );
}
