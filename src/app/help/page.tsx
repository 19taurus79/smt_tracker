"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Dumbbell,
  Timer,
  TrendingUp,
  Smartphone,
  Layers,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Scale,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

export default function HelpPage() {
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState<
    "method" | "exercises" | "cycles" | "progression" | "app"
  >("method");

  const backLinkText =
    language === "en"
      ? "Back to Settings"
      : language === "ru"
      ? "Назад в Настройки"
      : "Назад до Налаштувань";

  const guideBadge =
    language === "en"
      ? "SMT Knowledge Base"
      : language === "ru"
      ? "База знаний СМТ"
      : "База знань СМТ";

  const guideTitle =
    language === "en"
      ? "SMT-1 Training Guide"
      : language === "ru"
      ? "Руководство по методике СМТ-1"
      : "Керівництво по методиці СМТ";

  const guideSubtitle =
    language === "en"
      ? "Heavy Duty Training (V. Goncharov): 30s rest intervals, 4 microcycles, supersets and auto-progression."
      : language === "ru"
      ? "Сверхмощный тренинг (В. Гончаров): правила 30-секундного отдыха, структура 4-х микроциклов, круговые суперсеты и авто-прогрессия весов."
      : "Надпотужний тренінг (В. Гончаров): протокол 30-секундного відпочинку, 4 мікроцикли, колові суперсети та авто-прогресія.";

  const tabs = [
    { id: "method", label: language === "en" ? "SMT Method" : language === "ru" ? "Методика СМТ" : "Методика СМТ", icon: Flame },
    { id: "exercises", label: language === "en" ? "Exercise List" : language === "ru" ? "Схема упражнений" : "Схема вправ", icon: Dumbbell },
    { id: "cycles", label: language === "en" ? "4 Microcycles" : language === "ru" ? "4 Микроцикла" : "4 Мікроцикли", icon: Layers },
    { id: "progression", label: language === "en" ? "Progression & Body" : language === "ru" ? "Прогрессия и Замеры" : "Прогресія та Заміри", icon: TrendingUp },
    { id: "app", label: language === "en" ? "App & PWA Guide" : language === "ru" ? "Гид по приложению" : "Гід по додатку", icon: Smartphone },
  ];

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-300">
      {/* Top Bar with back link */}
      <div className="flex items-center justify-between">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{backLinkText}</span>
        </Link>
        <span className="text-[11px] text-emerald-400 font-mono">SMT_GUIDE.md</span>
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-5 sm:p-6 shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400">
              <BookOpen className="h-3.5 w-3.5" />
              <span>{guideBadge}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {guideTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              {guideSubtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-white/10 bg-slate-900/40 p-1.5 rounded-xl overflow-x-auto gap-1 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === "method" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <Card className="border-white/10 bg-slate-900/60 p-4 sm:p-5 space-y-3">
              <CardTitle className="text-sm sm:text-base text-emerald-400 flex items-center gap-2">
                <Flame className="h-4 w-4" />
                <span>Философия и цели СМТ-1</span>
              </CardTitle>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                В отличие от традиционного бодибилдинга с паузами по 2–3 минуты, методика Владимира
                Гончарова делает ставку на <strong>сверхвысокую плотность силовой работы</strong>.
                Умеренный процент от 1ПМ (40–55%) при паузe ровно 30 секунд стимулирует глубочайшую
                капилляризацию мышц, сжигает подкожный жир и дает мощный выброс гормона роста.
              </p>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Card className="border-cyan-500/20 bg-cyan-950/15 p-4 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                  <Timer className="h-4 w-4" />
                  Отдых строго 30 секунд
                </div>
                <p className="text-xs text-slate-300">
                  Пауза между подходами одиночного упражнения и между раундами суперсета составляет
                  ровно 30 секунд. Не затягивайте паузу — лучше снизить вес снаряда, но сохранить
                  темп.
                </p>
              </Card>

              <Card className="border-emerald-500/20 bg-emerald-950/15 p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck className="h-4 w-4" />
                  Здоровье суставов
                </div>
                <p className="text-xs text-slate-300">
                  Благодаря работе в диапазоне 40–55% от 1ПМ суставно-связочный аппарат не
                  перегружается предельными весами, минимизируя риск травм и надрывов.
                </p>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "exercises" && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <Card className="border-white/10 bg-slate-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base">
                    Блок 1: Жим штанги лежа
                  </h3>
                  <span className="text-xs text-slate-400">Одиночный блок • 4 подхода</span>
                </div>
                <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
                  40% 1ПМ
                </Badge>
              </div>
              <p className="text-xs text-slate-300">
                Классический базовый жим. Выполняется 4 подхода по плану текущего микроцикла. Пауза
                между каждым подходом — 30 секунд.
              </p>
            </Card>

            <Card className="border-white/10 bg-slate-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base">
                    Блок 2: Жим лежа узким хватом
                  </h3>
                  <span className="text-xs text-slate-400">Одиночный блок • 4 подхода</span>
                </div>
                <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
                  40% 1ПМ
                </Badge>
              </div>
              <p className="text-xs text-slate-300">
                Акцент на трицепс и переднюю дельту. Хват на ширине плеч. 4 подхода по плану с
                паузами по 30 сек.
              </p>
            </Card>

            <Card className="border-purple-500/30 bg-purple-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-purple-300 text-sm sm:text-base">
                    Блок 3: Суперсет 1 (Спина + Бицепс)
                  </h3>
                  <span className="text-xs text-purple-400">4 Круга (Раунда)</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900/90 rounded-xl p-3 border border-white/5 space-y-1">
                  <span className="text-purple-400 font-bold text-[10px] uppercase">
                    Основное (40% 1ПМ)
                  </span>
                  <div className="text-white font-semibold">Подтягивания на перекладине</div>
                  <div className="text-slate-400 text-[11px]">10 повторений</div>
                </div>
                <div className="bg-slate-900/90 rounded-xl p-3 border border-white/5 space-y-1">
                  <span className="text-purple-400 font-bold text-[10px] uppercase">
                    Подсобка (30% 1ПМ)
                  </span>
                  <div className="text-white font-semibold">Штанга на бицепс стоя</div>
                  <div className="text-slate-400 text-[11px]">15 повторений</div>
                </div>
              </div>
              <p className="text-xs text-slate-300">
                Порядок выполнения: Подтягивания → отдых 30 сек → Бицепс → отдых 30 сек → следующий
                круг.
              </p>
            </Card>

            <Card className="border-cyan-500/30 bg-cyan-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-cyan-300 text-sm sm:text-base">
                    Блок 4: Суперсет 2 (Ноги + Плечи)
                  </h3>
                  <span className="text-xs text-cyan-400">4 Круга (Раунда)</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900/90 rounded-xl p-3 border border-white/5 space-y-1">
                  <span className="text-cyan-400 font-bold text-[10px] uppercase">
                    Основное (40% 1ПМ)
                  </span>
                  <div className="text-white font-semibold">Приседания со штангой</div>
                  <div className="text-slate-400 text-[11px]">10 повторений</div>
                </div>
                <div className="bg-slate-900/90 rounded-xl p-3 border border-white/5 space-y-1">
                  <span className="text-cyan-400 font-bold text-[10px] uppercase">
                    Подсобка (30% 1ПМ)
                  </span>
                  <div className="text-white font-semibold">Армейский жим штанги стоя</div>
                  <div className="text-slate-400 text-[11px]">15 повторений</div>
                </div>
              </div>
              <p className="text-xs text-slate-300">
                Порядок выполнения: Приседания → отдых 30 сек → Жим стоя → отдых 30 сек → следующий
                круг.
              </p>
            </Card>
          </div>
        )}

        {activeTab === "cycles" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-200">
            <Card className="border-white/10 bg-slate-900/60 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">МКЦ-1: Вкатывание</span>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  Тр 1 – 9
                </Badge>
              </div>
              <div className="text-xs space-y-1 text-slate-300">
                <div>• <strong>4 подхода по 10 повторений</strong></div>
                <div>• Основное: <strong>40% от 1ПМ</strong></div>
                <div>• Подсобка: <strong>30% (15 повторений)</strong></div>
                <p className="text-slate-400 text-[11px] pt-1">
                  Адаптация сердца, сосудов и капиллярной сети.
                </p>
              </div>
            </Card>

            <Card className="border-white/10 bg-slate-900/60 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">МКЦ-2: Набор плотности</span>
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                  Тр 10 – 18
                </Badge>
              </div>
              <div className="text-xs space-y-1 text-slate-300">
                <div>• <strong>4 подхода по 8 повторений</strong></div>
                <div>• Основное: <strong>45% от 1ПМ</strong></div>
                <div>• Подсобка: <strong>35% (12 повторений)</strong></div>
                <p className="text-slate-400 text-[11px] pt-1">
                  Увеличение жесткости мышц и рабочего веса.
                </p>
              </div>
            </Card>

            <Card className="border-white/10 bg-slate-900/60 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">МКЦ-3: Гипертрофия</span>
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                  Тр 19 – 27
                </Badge>
              </div>
              <div className="text-xs space-y-1 text-slate-300">
                <div>• <strong>4 подхода по 6 повторений</strong></div>
                <div>• Основное: <strong>50% от 1ПМ</strong></div>
                <div>• Подсобка: <strong>40% (10 повторений)</strong></div>
                <p className="text-slate-400 text-[11px] pt-1">
                  Интенсивный рост миофибрилл под нагрузкой.
                </p>
              </div>
            </Card>

            <Card className="border-white/10 bg-slate-900/60 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">МКЦ-4: Силовой пик</span>
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                  Тр 28 – 36
                </Badge>
              </div>
              <div className="text-xs space-y-1 text-slate-300">
                <div>• <strong>4 подхода по 4 повторения</strong></div>
                <div>• Основное: <strong>55% от 1ПМ</strong></div>
                <div>• Подсобка: <strong>45% (8 повторений)</strong></div>
                <p className="text-slate-400 text-[11px] pt-1">
                  Финальная точка программы: максимальная сила и выносливость.
                </p>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "progression" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <Card className="border-white/10 bg-slate-900/60 p-4 sm:p-5 space-y-3">
              <CardTitle className="text-sm sm:text-base text-emerald-400 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>Авто-прогрессия весов</span>
              </CardTitle>
              <div className="space-y-2 text-xs sm:text-sm text-slate-300">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Успех:</strong> Если выполнены абсолютно все повторения во всех
                    подходах, на следующую тренировку система добавляет <strong>+2.5 кг</strong> к
                    расчетному максимуму.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Срыв:</strong> При недоборе хотя бы 1 повторения прибавка отменяется.
                    Следующая тренировка проходит с тем же весом.
                  </span>
                </div>
              </div>
            </Card>

            <Card className="border-white/10 bg-slate-900/60 p-4 sm:p-5 space-y-3">
              <CardTitle className="text-sm sm:text-base text-cyan-400 flex items-center gap-2">
                <Scale className="h-4 w-4" />
                <span>Как отслеживать результаты</span>
              </CardTitle>
              <p className="text-xs sm:text-sm text-slate-300">
                Вес на весах может не падать, потому что мышечная масса плотнее жира. Главный
                ориентир — <strong>сантиметровая лента</strong>. Замеряйте талию, бицепс и грудь
                каждые 1–2 недели утром натощак в разделе <strong>Замеры</strong>.
              </p>
            </Card>
          </div>
        )}

        {activeTab === "app" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <Card className="border-white/10 bg-slate-900/60 p-4 sm:p-5 space-y-3">
              <CardTitle className="text-sm sm:text-base text-emerald-400 flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                <span>Установка приложения на телефон (PWA)</span>
              </CardTitle>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="bg-black/30 p-3 rounded-xl border border-white/5 space-y-1">
                  <strong className="text-white block">На iPhone (Safari):</strong>
                  <span>
                    Нажмите «Поделиться» (иконка со стрелочкой вверх) → выберите «На экран "Домой"».
                  </span>
                </div>
                <div className="bg-black/30 p-3 rounded-xl border border-white/5 space-y-1">
                  <strong className="text-white block">На Android (Chrome):</strong>
                  <span>
                    Нажмите меню «⋮» в верхнем углу → «Установить приложение».
                  </span>
                </div>
                <div className="bg-black/30 p-3 rounded-xl border border-white/5 space-y-1">
                  <strong className="text-white block">В Telegram:</strong>
                  <span>
                    Приложение работает как нативный Telegram Mini App с поддержкой вибрации
                    (Haptics).
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
