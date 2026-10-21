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
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n";
import { getHelpContent } from "@/lib/i18n/helpContent";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const { language } = useTranslation();
  const content = getHelpContent(language);

  const [activeTab, setActiveTab] = useState<
    "method" | "prep" | "exercises" | "cycles" | "progression" | "app"
  >("method");

  if (!isOpen) return null;

  const tabIcons: Record<string, any> = {
    method: Flame,
    prep: Sparkles,
    exercises: Dumbbell,
    cycles: Layers,
    progression: TrendingUp,
    app: Smartphone,
  };

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
                {content.modalTitle}
              </h2>
              <p className="text-xs text-slate-400 hidden sm:block">
                {content.modalSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-slate-900/40 p-1.5 overflow-x-auto gap-1 scrollbar-none">
          {content.tabs.map((tab) => {
            const Icon = tabIcons[tab.id] || BookOpen;
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
              {/* Critical Safety Warning Banner */}
              {content.method.warningTitle && (
                <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 space-y-2">
                  <h3 className="font-bold text-sm sm:text-base text-amber-400 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                    {content.method.warningTitle}
                  </h3>
                  <p className="text-xs sm:text-sm text-amber-200/90 leading-relaxed">
                    {content.method.warningDesc}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10 text-xs mt-1"
                    onClick={() => setActiveTab("prep")}
                  >
                    <span>Перейти до Підготовчого циклу</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                </div>
              )}

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
                <h3 className="font-bold text-sm sm:text-base text-emerald-400 flex items-center gap-2 mb-2">
                  <Flame className="h-4 w-4" />
                  {content.method.heroTitle}
                </h3>
                <p className="text-slate-300 leading-relaxed">{content.method.heroDesc}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Card className="border-white/10 bg-slate-900/50 p-3.5 space-y-1.5">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                    <Timer className="h-4 w-4" />
                    {content.method.restTitle}
                  </div>
                  <p className="text-xs text-slate-400">{content.method.restDesc}</p>
                </Card>

                <Card className="border-white/10 bg-slate-900/50 p-3.5 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                    <ShieldCheck className="h-4 w-4" />
                    {content.method.safetyTitle}
                  </div>
                  <p className="text-xs text-slate-400">{content.method.safetyDesc}</p>
                </Card>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4 space-y-2">
                <h4 className="font-bold text-white text-xs sm:text-sm">{content.method.rulesTitle}</h4>
                <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                  {content.method.rules.map((rule, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: ПІДГОТОВЧИЙ ЦИКЛ (1-2 ТИЖНІ) */}
          {activeTab === "prep" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm sm:text-base text-cyan-400 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    {content.prep.title}
                  </h3>
                  <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                    {content.prep.badge}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {content.prep.desc}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4 space-y-1.5">
                <h4 className="font-bold text-white text-xs sm:text-sm">{content.prep.whyTitle}</h4>
                <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                  {content.prep.whyDesc}
                </p>
              </div>

              {/* 3 Exercises Scheme */}
              <div className="space-y-2">
                <h4 className="font-bold text-white text-xs sm:text-sm">{content.prep.schemeTitle}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {content.prep.exercises.map((ex, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-white/10 bg-slate-900/60 p-3.5 space-y-2"
                    >
                      <div className="font-bold text-white text-xs leading-snug">{ex.name}</div>
                      <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 text-[10px]">
                        {ex.scheme}
                      </Badge>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{ex.notes}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rest Progression Table */}
              <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 space-y-3">
                <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                  <Timer className="h-4 w-4 text-cyan-400" />
                  {content.prep.restProgressionTitle}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {content.prep.restProgression.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950/60 rounded-xl p-3 border border-white/5 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">{item.workout}</span>
                        <span className="font-black text-cyan-400">{item.rest}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calculation Guide */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-2">
                <h4 className="font-bold text-white text-xs sm:text-sm">{content.prep.calcTitle}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{content.prep.calcDesc}</p>
              </div>
            </div>
          )}

          {/* TAB 3: УПРАЖНЕНИЯ И СУПЕРСЕТЫ */}
          {activeTab === "exercises" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">{content.exercises.intro}</p>

              <div className="space-y-3">
                {content.exercises.blocks.map((block, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl border p-3.5 space-y-2 ${
                      block.isSuperset
                        ? "border-purple-500/25 bg-purple-950/15"
                        : "border-white/10 bg-slate-900/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-bold ${block.isSuperset ? "text-purple-300" : "text-white"}`}>
                        {block.title}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          block.isSuperset
                            ? "text-purple-400 border-purple-500/30"
                            : "text-emerald-400 border-emerald-500/30"
                        }
                      >
                        {block.badge}
                      </Badge>
                    </div>

                    {block.desc && <p className="text-xs text-slate-400">{block.desc}</p>}

                    {block.exercises && (
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        {block.exercises.map((ex, exIdx) => (
                          <div
                            key={exIdx}
                            className="bg-slate-900/80 rounded-lg p-2 border border-white/5"
                          >
                            <span className="text-slate-400 block text-[10px] font-bold">
                              {ex.category}
                            </span>
                            <strong className="text-white block mt-0.5">{ex.name}</strong>
                            <div className="text-slate-400 text-[11px] mt-0.5">{ex.details}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {block.footerNote && (
                      <p className="text-[11px] text-slate-400 pt-0.5">{block.footerNote}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Substitutions & Equivalence Guide */}
              <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 space-y-3 mt-4">
                <h4 className="font-bold text-white text-xs sm:text-sm text-amber-300">
                  {content.exercises.substitutionsTitle}
                </h4>
                <p className="text-xs text-slate-400">{content.exercises.substitutionsIntro}</p>

                <div className="space-y-2.5">
                  {content.exercises.substitutions.map((sub, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg bg-slate-950/70 border border-white/5 p-3 space-y-1 text-xs"
                    >
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span className="text-slate-400">Вправа:</span>
                        <span>{sub.original}</span>
                      </div>
                      <div className="text-cyan-300 font-medium">
                        ⇄ <span className="text-slate-300">{sub.alternatives}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 italic pt-0.5">
                        Чому підходить: {sub.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* How to Configure in App */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/15 p-4 space-y-1.5">
                <h4 className="font-bold text-emerald-400 text-xs sm:text-sm">
                  {content.exercises.calcHowToTitle}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {content.exercises.calcHowToDesc}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: 4 МИКРОЦИКЛА */}
          {activeTab === "cycles" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">{content.cycles.intro}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {content.cycles.items.map((cycle, idx) => {
                  const badgeColors = [
                    "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
                    "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
                    "bg-purple-500/20 text-purple-400 border-purple-500/30",
                    "bg-amber-500/20 text-amber-400 border-amber-500/30",
                  ];
                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-white/10 bg-slate-900/60 p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{cycle.title}</span>
                        <Badge className={badgeColors[idx % badgeColors.length]}>{cycle.badge}</Badge>
                      </div>
                      <div className="text-xs space-y-1 text-slate-300">
                        <div>
                          • <strong>{cycle.reps}</strong>
                        </div>
                        <div>
                          • <strong>{cycle.mainWeight}</strong>
                        </div>
                        <div>
                          • <strong>{cycle.accessoryWeight}</strong>
                        </div>
                        <div className="text-[11px] text-slate-400 pt-1 leading-relaxed">
                          {cycle.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: ПРОГРЕССИЯ И ЗАМЕРЫ */}
          {activeTab === "progression" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 space-y-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  {content.progression.autoIncrementTitle}
                </h4>
                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-emerald-300">{content.progression.successTitle}</strong>{" "}
                      {content.progression.successDesc}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-amber-300">{content.progression.failTitle}</strong>{" "}
                      {content.progression.failDesc}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Scale className="h-4 w-4 text-cyan-400" />
                  {content.progression.bodyTitle}
                </h4>
                <p className="text-xs text-slate-400">{content.progression.bodyDesc}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                  {content.progression.criteria.map((cr, idx) => (
                    <div key={idx} className="bg-black/40 rounded-lg p-2.5 border border-white/5">
                      <span className="text-slate-400 block text-[10px]">{cr.label}</span>
                      <strong className={`${cr.colorClass} block mt-0.5`}>{cr.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ПРИЛОЖЕНИЕ И PWA */}
          {activeTab === "app" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 space-y-2.5">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-emerald-400" />
                  {content.app.pwaTitle}
                </h4>
                <p className="text-xs text-slate-400">{content.app.pwaDesc}</p>
                <div className="space-y-2 text-xs pt-1">
                  <div className="bg-black/40 p-2.5 rounded-lg border border-white/5">
                    <strong className="text-white block mb-0.5">{content.app.iosTitle}</strong>
                    <span className="text-slate-300">{content.app.iosDesc}</span>
                  </div>
                  <div className="bg-black/40 p-2.5 rounded-lg border border-white/5">
                    <strong className="text-white block mb-0.5">{content.app.androidTitle}</strong>
                    <span className="text-slate-300">{content.app.androidDesc}</span>
                  </div>
                  <div className="bg-black/40 p-2.5 rounded-lg border border-white/5">
                    <strong className="text-white block mb-0.5">{content.app.tmaTitle}</strong>
                    <span className="text-slate-300">{content.app.tmaDesc}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 space-y-2">
                <h4 className="font-bold text-white text-sm">{content.app.backupTitle}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{content.app.backupDesc}</p>
              </div>

              <div className="rounded-xl border border-cyan-500/25 bg-cyan-950/20 p-4 space-y-2">
                <h4 className="font-bold text-cyan-300 text-sm">{content.app.coachTitle}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{content.app.coachDesc}</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-white/10 px-4 sm:px-6 py-3 bg-slate-900/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 truncate max-w-[280px] sm:max-w-none">
            {content.footer.guideNotice}
          </span>
          <Button
            size="sm"
            onClick={onClose}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shrink-0"
          >
            {content.footer.closeBtn}
          </Button>
        </div>
      </div>
    </div>
  );
}
