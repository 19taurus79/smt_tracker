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
import { getHelpContent } from "@/lib/i18n/helpContent";

export default function HelpPage() {
  const { language } = useTranslation();
  const content = getHelpContent(language);

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

  const tabIcons: Record<string, any> = {
    method: Flame,
    exercises: Dumbbell,
    cycles: Layers,
    progression: TrendingUp,
    app: Smartphone,
  };

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
              {content.modalTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              {content.modalSubtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-white/10 bg-slate-900/40 p-1.5 rounded-xl overflow-x-auto gap-1 scrollbar-none">
        {content.tabs.map((tab) => {
          const Icon = tabIcons[tab.id] || BookOpen;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: SMT Method */}
      {activeTab === "method" && (
        <div className="space-y-4">
          <Card className="border-emerald-500/30 bg-emerald-950/20 p-5">
            <h3 className="font-bold text-base text-emerald-400 flex items-center gap-2 mb-2">
              <Flame className="h-5 w-5" />
              {content.method.heroTitle}
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">{content.method.heroDesc}</p>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <Card className="border-white/10 bg-slate-900/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                <Timer className="h-4 w-4" />
                {content.method.restTitle}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{content.method.restDesc}</p>
            </Card>

            <Card className="border-white/10 bg-slate-900/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4" />
                {content.method.safetyTitle}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{content.method.safetyDesc}</p>
            </Card>
          </div>

          <Card className="border-white/10 bg-slate-900/40 p-5 space-y-3">
            <h4 className="font-bold text-white text-sm">{content.method.rulesTitle}</h4>
            <ul className="text-xs sm:text-sm text-slate-300 space-y-2 list-disc list-inside leading-relaxed">
              {content.method.rules.map((rule, idx) => (
                <li key={idx}>{rule}</li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {/* Tab 2: Exercises */}
      {activeTab === "exercises" && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">{content.exercises.intro}</p>

          <div className="space-y-3">
            {content.exercises.blocks.map((block, idx) => (
              <Card
                key={idx}
                className={`p-4 space-y-2.5 ${
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    {block.exercises.map((ex, exIdx) => (
                      <div
                        key={exIdx}
                        className="bg-slate-900/80 rounded-xl p-3 border border-white/5"
                      >
                        <span className="text-slate-400 block text-[10px] font-bold">
                          {ex.category}
                        </span>
                        <strong className="text-white block mt-0.5 text-sm">{ex.name}</strong>
                        <div className="text-slate-400 text-xs mt-0.5">{ex.details}</div>
                      </div>
                    ))}
                  </div>
                )}

                {block.footerNote && (
                  <p className="text-[11px] text-slate-400 pt-0.5">{block.footerNote}</p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Cycles */}
      {activeTab === "cycles" && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">{content.cycles.intro}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {content.cycles.items.map((cycle, idx) => {
              const badgeColors = [
                "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
                "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
                "bg-purple-500/20 text-purple-400 border-purple-500/30",
                "bg-amber-500/20 text-amber-400 border-amber-500/30",
              ];
              return (
                <Card
                  key={idx}
                  className="border-white/10 bg-slate-900/60 p-4 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-base">{cycle.title}</span>
                    <Badge className={badgeColors[idx % badgeColors.length]}>{cycle.badge}</Badge>
                  </div>
                  <div className="text-xs space-y-1.5 text-slate-300">
                    <div>
                      • <strong>{cycle.reps}</strong>
                    </div>
                    <div>
                      • <strong>{cycle.mainWeight}</strong>
                    </div>
                    <div>
                      • <strong>{cycle.accessoryWeight}</strong>
                    </div>
                    <div className="text-xs text-slate-400 pt-1 leading-relaxed">
                      {cycle.desc}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Progression & Body */}
      {activeTab === "progression" && (
        <div className="space-y-4">
          <Card className="border-white/10 bg-slate-900/50 p-5 space-y-3">
            <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              {content.progression.autoIncrementTitle}
            </h4>
            <div className="space-y-2.5 text-xs sm:text-sm text-slate-300">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-emerald-300">{content.progression.successTitle}</strong>{" "}
                  {content.progression.successDesc}
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-amber-300">{content.progression.failTitle}</strong>{" "}
                  {content.progression.failDesc}
                </span>
              </div>
            </div>
          </Card>

          <Card className="border-white/10 bg-slate-900/50 p-5 space-y-3">
            <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
              <Scale className="h-5 w-5 text-cyan-400" />
              {content.progression.bodyTitle}
            </h4>
            <p className="text-xs sm:text-sm text-slate-400">{content.progression.bodyDesc}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
              {content.progression.criteria.map((cr, idx) => (
                <div key={idx} className="bg-black/40 rounded-xl p-3 border border-white/5">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                    {cr.label}
                  </span>
                  <strong className={`${cr.colorClass} block mt-1 text-sm`}>{cr.value}</strong>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 5: App & PWA */}
      {activeTab === "app" && (
        <div className="space-y-4">
          <Card className="border-white/10 bg-slate-900/60 p-5 space-y-3">
            <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-emerald-400" />
              {content.app.pwaTitle}
            </h4>
            <p className="text-xs sm:text-sm text-slate-400">{content.app.pwaDesc}</p>
            <div className="space-y-2.5 text-xs sm:text-sm pt-1">
              <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                <strong className="text-white block mb-1">{content.app.iosTitle}</strong>
                <span className="text-slate-300">{content.app.iosDesc}</span>
              </div>
              <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                <strong className="text-white block mb-1">{content.app.androidTitle}</strong>
                <span className="text-slate-300">{content.app.androidDesc}</span>
              </div>
              <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                <strong className="text-white block mb-1">{content.app.tmaTitle}</strong>
                <span className="text-slate-300">{content.app.tmaDesc}</span>
              </div>
            </div>
          </Card>

          <Card className="border-white/10 bg-slate-900/60 p-5 space-y-2">
            <h4 className="font-bold text-white text-sm sm:text-base">{content.app.backupTitle}</h4>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{content.app.backupDesc}</p>
          </Card>

          <Card className="border-cyan-500/25 bg-cyan-950/20 p-5 space-y-2">
            <h4 className="font-bold text-cyan-300 text-sm sm:text-base">{content.app.coachTitle}</h4>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{content.app.coachDesc}</p>
          </Card>
        </div>
      )}
    </div>
  );
}
