"use client";

import React, { useState } from "react";
import {
  HelpCircle,
  X,
  BookOpen,
  Dumbbell,
  Timer,
  TrendingUp,
  Smartphone,
  Layers,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  ShieldCheck,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState<
    "method" | "exercises" | "cycles" | "progression" | "app"
  >("method");

  if (!isOpen) return null;

  const modalTitle =
    language === "en"
      ? "SMT Method & Reference"
      : language === "ru"
      ? "Справка и Методика СМТ-1"
      : "Довідка та Методика СМТ";

  const modalSubtitle =
    language === "en"
      ? "Complete guide to Mike Kazakov (Steelfactor) system and tracker features"
      : language === "ru"
      ? "Полное руководство по системе Майка Казакова (Steelfactor) и функциям приложения"
      : "Повний посібник із системи Майка Казакова (Steelfactor) та функцій додатку";

  const tabs = [
    {
      id: "method",
      label: language === "en" ? "SMT Method" : language === "ru" ? "Методика СМТ" : "Методика СМТ",
      icon: Flame,
    },
    {
      id: "exercises",
      label: language === "en" ? "Exercises" : language === "ru" ? "Упражнения" : "Вправи",
      icon: Dumbbell,
    },
    {
      id: "cycles",
      label: language === "en" ? "4 Microcycles" : language === "ru" ? "4 Микроцикла" : "4 Мікроцикли",
      icon: Layers,
    },
    {
      id: "progression",
      label:
        language === "en"
          ? "Progression & Body"
          : language === "ru"
          ? "Прогрессия и Замеры"
          : "Прогресія та Заміри",
      icon: TrendingUp,
    },
    {
      id: "app",
      label: language === "en" ? "App & PWA" : language === "ru" ? "Приложение и PWA" : "Додаток та PWA",
      icon: Smartphone,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl border border-white/15 bg-slate-950 text-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 sm:px-6 py-3.5 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-slate-950 font-black">
              <BookOpen className="h-5 w-5 text-slate-950" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                {modalTitle}
              </h2>
              <p className="text-[11px] text-slate-400">
                {modalSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-slate-900/40 px-3 py-2 overflow-x-auto gap-1 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
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

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          {/* TAB 1: МЕТОДИКА СМТ */}
          {activeTab === "method" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
                <h3 className="font-bold text-sm sm:text-base text-emerald-400 flex items-center gap-2 mb-2">
                  <Flame className="h-4 w-4" />
                  Суть Сверхмощного тренинга (Майк Казаков / Steelfactor)
                </h3>
                <p className="text-slate-300">
                  <strong>СМТ (Сверхмощный тренинг)</strong> — высокоплотная силовая методика,
                  направленная на одновременную рекомпозицию тела (сжигание подкожного жира при росте
                  жесткости и плотности мышц), мощную капилляризацию и развитие силовой выносливости.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Card className="border-white/10 bg-slate-900/50 p-3.5 space-y-1.5">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                    <Timer className="h-4 w-4" />
                    Отдых строго 30 секунд
                  </div>
                  <p className="text-xs text-slate-400">
                    Между подходами и кругами пауза ровно 30 сек. Это не позволяет лактату
                    полностью рассеяться и вызывает максимальный анаболический гормональный отклик
                    (выброс соматотропина).
                  </p>
                </Card>

                <Card className="border-white/10 bg-slate-900/50 p-3.5 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                    <ShieldCheck className="h-4 w-4" />
                    Безопасные веса (40–55%)
                  </div>
                  <p className="text-xs text-slate-400">
                    Веса рассчитываются от разового максимума (1ПМ). Умеренный тоннаж защищает
                    суставы и сухожилия, переводя стимул в глубокую мышечную накачку и выносливость.
                  </p>
                </Card>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4 space-y-2">
                <h4 className="font-bold text-white text-xs sm:text-sm">
                  Почему нельзя отдыхать дольше 30 секунд?
                </h4>
                <p className="text-xs text-slate-400">
                  Если вы делаете перерыв 2–3 минуты, как в пауэрлифтинге, тренировка перестает
                  быть СМТ и превращается в обычный силовой тренинг. Главное в СМТ —{" "}
                  <strong className="text-white">непрерывность и плотность</strong>. Если не
                  хватает сил — лучше снизить вес на 2.5–5 кг, но сохранить темп в 30 секунд!
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: УПРАЖНЕНИЯ И СУПЕРСЕТЫ */}
          {activeTab === "exercises" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Комплекс упражнений в СМТ-1 остается неизменным на протяжении всех 36 тренировок!
                Это формирует безупречный двигательный навык и стабильную силовую прогрессию.
              </p>

              <div className="space-y-3">
                {/* Block 1 */}
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Блок 1: Жим штанги лежа</span>
                    <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
                      Одиночный блок • 4 подхода
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400">
                    Базовый грудной жим. 4 подхода по плану микроцикла (10/8/6/4 повт) с весом 40–55%
                    от 1ПМ. Отдых между подходами: ровно 30 сек.
                  </p>
                </div>

                {/* Block 2 */}
                <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Блок 2: Жим узким хватом</span>
                    <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
                      Одиночный блок • 4 подхода
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400">
                    Акцент на трицепс и переднюю дельту. 4 подхода по плану микроцикла с паузами
                    30 сек.
                  </p>
                </div>

                {/* Block 3 */}
                <div className="rounded-xl border border-purple-500/25 bg-purple-950/15 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-300">
                      Блок 3: Суперсет 1 (Спина + Бицепс)
                    </span>
                    <Badge variant="outline" className="text-purple-400 border-purple-500/30">
                      4 Круга
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-900/80 rounded-lg p-2 border border-white/5">
                      <span className="text-slate-400 block text-[10px] font-bold">ОСНОВНОЕ (40%)</span>
                      <strong className="text-white">Подтягивания</strong>
                      <div className="text-slate-400 text-[11px]">10 повт • Вес 40% 1ПМ</div>
                    </div>
                    <div className="bg-slate-900/80 rounded-lg p-2 border border-white/5">
                      <span className="text-slate-400 block text-[10px] font-bold">ПОДСОБКА (30%)</span>
                      <strong className="text-white">Штанга на бицепс</strong>
                      <div className="text-slate-400 text-[11px]">15 повт • Вес 30% 1ПМ</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Порядок: Подтягивания (10) → отдых 30с → Бицепс (15) → отдых 30с → следующий круг.
                  </p>
                </div>

                {/* Block 4 */}
                <div className="rounded-xl border border-cyan-500/25 bg-cyan-950/15 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300">
                      Блок 4: Суперсет 2 (Ноги + Плечи)
                    </span>
                    <Badge variant="outline" className="text-cyan-400 border-cyan-500/30">
                      4 Круга
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-900/80 rounded-lg p-2 border border-white/5">
                      <span className="text-slate-400 block text-[10px] font-bold">ОСНОВНОЕ (40%)</span>
                      <strong className="text-white">Приседания со штангой</strong>
                      <div className="text-slate-400 text-[11px]">10 повт • Вес 40% 1ПМ</div>
                    </div>
                    <div className="bg-slate-900/80 rounded-lg p-2 border border-white/5">
                      <span className="text-slate-400 block text-[10px] font-bold">ПОДСОБКА (30%)</span>
                      <strong className="text-white">Армейский жим стоя</strong>
                      <div className="text-slate-400 text-[11px]">15 повт • Вес 30% 1ПМ</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Аналогично первому суперсету: 4 круга с раздельными весами и отдыхом 30 сек.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 4 МИКРОЦИКЛА */}
          {activeTab === "cycles" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Программа рассчитана на 12 недель (36 тренировок при режиме 3 раза в неделю:
                Пн-Ср-Пт). Она делится на 4 прогрессирующих микроцикла:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">МКЦ-1: Вкатывание</span>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      Тр 1 – 9
                    </Badge>
                  </div>
                  <div className="text-xs space-y-1 text-slate-300">
                    <div>• <strong>4 подхода по 10 повторений</strong></div>
                    <div>• Основное: <strong>40% от 1ПМ</strong></div>
                    <div>• Подсобка: <strong>30% (15 повт)</strong></div>
                    <div className="text-[11px] text-slate-400 pt-1">
                      Адаптация ССС, капилляризация, наработка дыхания и темпа.
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">МКЦ-2: Набор плотности</span>
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                      Тр 10 – 18
                    </Badge>
                  </div>
                  <div className="text-xs space-y-1 text-slate-300">
                    <div>• <strong>4 подхода по 8 повторений</strong></div>
                    <div>• Основное: <strong>45% от 1ПМ</strong></div>
                    <div>• Подсобка: <strong>35% (12 повт)</strong></div>
                    <div className="text-[11px] text-slate-400 pt-1">
                      Рост плотности мышечного волокна, повышение рабочего веса.
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">МКЦ-3: Гипертрофия</span>
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                      Тр 19 – 27
                    </Badge>
                  </div>
                  <div className="text-xs space-y-1 text-slate-300">
                    <div>• <strong>4 подхода по 6 повторений</strong></div>
                    <div>• Основное: <strong>50% от 1ПМ</strong></div>
                    <div>• Подсобка: <strong>40% (10 повт)</strong></div>
                    <div className="text-[11px] text-slate-400 pt-1">
                      Мощная миофибриллярная гипертрофия на фоне сокращенного отдыха.
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">МКЦ-4: Силовой пик</span>
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                      Тр 28 – 36
                    </Badge>
                  </div>
                  <div className="text-xs space-y-1 text-slate-300">
                    <div>• <strong>4 подхода по 4 повторения</strong></div>
                    <div>• Основное: <strong>55% от 1ПМ</strong></div>
                    <div>• Подсобка: <strong>45% (8 повт)</strong></div>
                    <div className="text-[11px] text-slate-400 pt-1">
                      Финал программы, максимальная жесткость мускулов и пиковая выносливость.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ПРОГРЕССИЯ И ЗАМЕРЫ */}
          {activeTab === "progression" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 space-y-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  Автоприбавка +2.5 кг
                </h4>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Успех:</strong> Если во всех 4 подходах каждого упражнения выполнено
                      заданное количество повторений, на следующую тренировку расчетный 1ПМ
                      автоматически вырастет на <strong>+2.5 кг</strong> (настраивается в Опциях).
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Срыв:</strong> Если вы сделали хотя бы в одном подходе меньше повторений
                      (например, 8 из 10), вес не растет. Следующая тренировка проводится с теми же
                      весами.
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Scale className="h-4 w-4 text-cyan-400" />
                  Контроль тела (Замеры)
                </h4>
                <p className="text-xs text-slate-400">
                  На СМТ вес на весах может стоять на месте из-за одновременного сжигания жира и роста
                  мышечной ткани. Поэтому главный показатель — сантиметровая лента!
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
                  <div className="bg-black/40 rounded-lg p-2 border border-white/5">
                    <span className="text-slate-400 block text-[10px]">Критерий успеха</span>
                    <strong className="text-emerald-400">Талия уменьшается</strong>
                  </div>
                  <div className="bg-black/40 rounded-lg p-2 border border-white/5">
                    <span className="text-slate-400 block text-[10px]">Критерий успеха</span>
                    <strong className="text-cyan-400">Бицепс / грудь растут</strong>
                  </div>
                  <div className="bg-black/40 rounded-lg p-2 border border-white/5">
                    <span className="text-slate-400 block text-[10px]">Частота</span>
                    <strong className="text-white">1 раз в 1-2 недели</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ПРИЛОЖЕНИЕ И PWA */}
          {activeTab === "app" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-emerald-400" />
                  Установка как приложение (PWA)
                </h4>
                <p className="text-xs text-slate-400">
                  Приложение работает во весь экран без браузерных панелей даже без интернета:
                </p>
                <div className="space-y-2 text-xs pt-1">
                  <div className="bg-black/40 p-2.5 rounded-lg border border-white/5">
                    <strong className="text-white block mb-0.5">📱 На iPhone (iOS Safari):</strong>
                    Нажмите иконку <strong>«Поделиться»</strong> (квадрат со стрелкой вверх) →
                    выберите <strong>«На экран "Домой"»</strong> → нажмите «Добавить».
                  </div>
                  <div className="bg-black/40 p-2.5 rounded-lg border border-white/5">
                    <strong className="text-white block mb-0.5">🤖 На Android (Google Chrome):</strong>
                    Нажмите меню <strong>«⋮»</strong> в правом верхнем углу → выберите{" "}
                    <strong>«Установить приложение»</strong>.
                  </div>
                  <div className="bg-black/40 p-2.5 rounded-lg border border-white/5">
                    <strong className="text-white block mb-0.5">✈️ Telegram Mini App:</strong>
                    Внутри Telegram цвета адаптируются под вашу тему, а при отметке подходов работает
                    нативная тактильная отдача (вибрация TMA Haptics).
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 space-y-2">
                <h4 className="font-bold text-white text-sm">
                  Резервное копирование и сохранность данных
                </h4>
                <p className="text-xs text-slate-400">
                  Все данные хранятся на вашем устройстве (Local-First). В разделе{" "}
                  <strong className="text-white">Опции</strong> вы можете в любой момент нажать{" "}
                  <strong className="text-emerald-400">«Экспорт в JSON»</strong>, чтобы сохранить файл
                  бэкапа или перенести весь прогресс на новый телефон.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-white/10 px-4 sm:px-6 py-3 bg-slate-900/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Подробный файл справки доступен в корне: <code className="text-emerald-400">SMT_GUIDE.md</code>
          </span>
          <Button
            size="sm"
            onClick={onClose}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
          >
            Понятно
          </Button>
        </div>
      </div>
    </div>
  );
}
