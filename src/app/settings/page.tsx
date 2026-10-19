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
} from "lucide-react";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { useBodyStore } from "@/lib/store/useBodyStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { soundPlayer } from "@/lib/audio/sound";
import { triggerHaptic, isTelegramWebApp } from "@/lib/tma/telegram";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpModal } from "@/components/help/HelpModal";

export default function SettingsPage() {
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

      showToast("Резервная копия успешно экспортирована в JSON!");
      triggerHaptic("success");
    } catch (e) {
      console.error(e);
      showToast("Ошибка при экспорте данных.");
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

        showToast("Данные успешно импортированы!");
        triggerHaptic("success");
      } catch (err) {
        console.error(err);
        showToast("Ошибка: некорректный формат JSON-файла.");
      }
    };
    reader.readAsText(file);

    // Сбрасываем значение input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleTestSound = () => {
    soundPlayer.unlockAudio();
    soundPlayer.playRestComplete();
    triggerHaptic("success");
  };

  if (!mounted) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  const inTelegram = isTelegramWebApp();
  const tgUser = typeof window !== "undefined" ? window.Telegram?.WebApp?.initDataUnsafe?.user : null;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <Settings className="h-6 w-6 text-emerald-400" />
          <span>Настройки и Резервные копии</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Управление базой данных, параметрами таймера и интеграцией с Telegram
        </p>
      </div>

      {/* Toast Alert */}
      {notification && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Telegram Status Card */}
      <Card className="border-white/10 bg-slate-900/60 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0">
            <Info className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              {inTelegram ? "Telegram Mini App активен" : "Автономный режим (PWA / Браузер)"}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {inTelegram && tgUser
                ? `Пользователь: ${tgUser.first_name} ${tgUser.last_name || ""} (@${tgUser.username || "id" + tgUser.id})`
                : "Данные сохраняются локально в вашем браузере (Local-First)."}
            </p>
          </div>
        </div>
      </Card>

      {/* Workout Preferences */}
      <Card className="border-white/10 bg-slate-900/60 p-4 sm:p-5 space-y-4">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <Timer className="h-4 w-4 text-emerald-400" />
          <span>Параметры тренировки</span>
        </CardTitle>

        <div className="space-y-3">
          {/* Default Rest Timer */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Время отдыха по умолчанию в СМТ (сек)
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
              Шаг авто-прибавки веса (кг)
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
                  +{step} кг
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Sound & Haptics */}
      <Card className="border-white/10 bg-slate-900/60 p-4 sm:p-5 space-y-3">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-cyan-400" />
          <span>Звуки и Вибрация</span>
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
              <span>Звук: {soundEnabled ? "Вкл" : "Выкл"}</span>
            </Button>

            <Button
              variant={hapticsEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setHapticsEnabled(!hapticsEnabled)}
              className="text-xs font-semibold"
            >
              <Vibrate className="h-4 w-4 mr-1.5" />
              <span>Вибрация: {hapticsEnabled ? "Вкл" : "Выкл"}</span>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleTestSound}
            className="text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
          >
            Тест сигнала таймера
          </Button>
        </div>

        <div className="pt-1 border-t border-white/5 text-[11px] text-slate-400">
          <p>
            💡 <strong className="text-slate-300">На заметку (iPhone / iOS):</strong> звук веб-таймера воспроизводится только если боковой физический переключатель режима (Silent Switch) не находится в бесшумном положении (без оранжевой полоски).
          </p>
        </div>
      </Card>

      {/* PWA Installation Card */}
      <Card className="border-cyan-500/30 bg-gradient-to-br from-cyan-950/20 via-slate-900/60 to-slate-900/60 p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2 text-white">
            <Smartphone className="h-4 w-4 text-cyan-400" />
            <span>Установка на экран телефона (PWA)</span>
          </CardTitle>
          <span className="text-[10px] text-cyan-400 font-mono">Нативное приложение</span>
        </div>
        <p className="text-xs text-slate-300">
          Установите СМТ-1 Трекер как нативное приложение на рабочий стол вашего смартфона. Будет открываться во весь экран без адресной строки и работать автономно.
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const isIos = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
              if (isIos) {
                alert("На iPhone (Safari):\n1. Нажмите иконку «Поделиться» (квадрат со стрелкой вверх внизу экрана)\n2. Выберите «На экран Домой» (Add to Home Screen)\n3. Нажмите «Добавить»");
              } else {
                alert("На Android (Chrome):\n1. Нажмите меню «⋮» в правом верхнем углу\n2. Выберите «Установить приложение» или «Добавить на главный экран»");
              }
            }}
            className="text-xs font-bold border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10"
          >
            <Smartphone className="h-4 w-4 mr-1.5" />
            <span>Инструкция по установке на главный экран</span>
          </Button>
        </div>
      </Card>

      {/* Backup and Local-First JSON */}
      <Card className="border-white/10 bg-slate-900/60 p-4 sm:p-5 space-y-3">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <Download className="h-4 w-4 text-amber-400" />
          <span>Резервное копирование (JSON)</span>
        </CardTitle>
        <p className="text-xs text-slate-400">
          Сохраняйте ваши тренировки и историю замеров на устройство или восстанавливайте на любом
          другом телефоне или планшете.
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <Button
            variant="accent"
            size="sm"
            onClick={handleExportJSON}
            className="flex-1 font-bold"
          >
            <Download className="h-4 w-4 mr-2" />
            <span>Экспорт в JSON</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 font-semibold border-white/15 hover:bg-white/10"
          >
            <Upload className="h-4 w-4 mr-2" />
            <span>Импорт из JSON</span>
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

      {/* SMT Guide & Documentation */}
      <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-slate-900/60 to-slate-900/60 p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2 text-white">
            <BookOpen className="h-4 w-4 text-emerald-400" />
            <span>Справка и методика СМТ-1</span>
          </CardTitle>
          <span className="text-[10px] text-emerald-400 font-mono">SMT_GUIDE.md</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Полное руководство по системе Владимира Гончарова: правила 30-секундного отдыха, круговые суперсеты, таблица 4-х микроциклов, авто-прогрессия весов (+2.5 кг) и инструкция к приложению.
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <Button
            variant="accent"
            size="sm"
            onClick={() => setIsHelpModalOpen(true)}
            className="text-xs font-bold"
          >
            <BookOpen className="h-4 w-4 mr-1.5" />
            <span>Открыть интерактивную справку</span>
          </Button>

          <Link href="/help">
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-semibold w-full sm:w-auto border-white/15 hover:bg-white/10"
            >
              <span>Читать на отдельной странице</span>
            </Button>
          </Link>
        </div>
      </Card>

      {/* Demo & Data Management */}
      <Card className="border-white/10 bg-slate-900/60 p-4 sm:p-5 space-y-3">
        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-400" />
          <span>Демо-данные и сброс</span>
        </CardTitle>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadDemoData();
              loadDemoMeasurements();
              showToast("Демо-тренировки и замеры успешно загружены!");
            }}
            className="text-xs font-semibold hover:border-purple-500/40 hover:text-purple-300"
          >
            <Sparkles className="h-4 w-4 mr-1.5 text-purple-400" />
            <span>Загрузить готовые демо-данные</span>
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm("Вы уверены, что хотите сбросить все тренировки до начального состояния?")) {
                resetAllWorkouts();
                clearMeasurements();
                showToast("Все данные сброшены к чистой программе.");
              }
            }}
            className="text-xs font-semibold"
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            <span>Сбросить все тренировки и замеры</span>
          </Button>
        </div>
      </Card>

      {/* Help Modal */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </div>
  );
}
