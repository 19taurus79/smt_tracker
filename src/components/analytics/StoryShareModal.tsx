"use client";

import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { WorkoutSession } from "@/types/smt";
import { BodyMeasurement } from "@/types/body";
import { formatTime, formatDate } from "@/lib/utils";
import { Download, Sparkles, Check, Share2, Palette } from "lucide-react";

interface StoryShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workout: WorkoutSession | null;
  latestMeasurement?: BodyMeasurement;
}

type TemplateType = "neon" | "gold" | "glass";

export function StoryShareModal({
  open,
  onOpenChange,
  workout,
  latestMeasurement,
}: StoryShareModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>("neon");
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  if (!workout) return null;

  const durationStr = formatTime(workout.durationSeconds || 0);
  const tonnage = workout.tonnageKg || 0;
  const power = workout.powerKgPerMin || 0;
  const dateStr = workout.completedAt
    ? formatDate(workout.completedAt)
    : new Date().toLocaleDateString("ru-RU");

  // Collect exercises
  const exercisesSummary = workout.supersets
    .flatMap((ss) => ss.exercises)
    .slice(0, 4)
    .map((ex) => {
      const weight = ex.sets[0]?.actualWeight ?? ex.sets[0]?.targetWeight ?? 0;
      const reps = ex.sets[0]?.actualReps ?? ex.sets[0]?.targetReps ?? 10;
      return `${ex.name}: ${weight} кг × ${reps}`;
    });

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 1080;
    const height = 1920;
    canvas.width = width;
    canvas.height = height;

    if (selectedTemplate === "neon") {
      // 1. Neon Cyberpunk Emerald
      // Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, "#020617");
      bgGrad.addColorStop(0.5, "#061325");
      bgGrad.addColorStop(1, "#020617");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle ambient glow
      const glow1 = ctx.createRadialGradient(250, 400, 10, 250, 400, 500);
      glow1.addColorStop(0, "rgba(16, 185, 129, 0.15)");
      glow1.addColorStop(1, "rgba(16, 185, 129, 0)");
      ctx.fillStyle = glow1;
      ctx.fillRect(0, 0, width, height);

      // Header Badge
      ctx.fillStyle = "#0f172a";
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 4;
      roundRect(ctx, 80, 100, 360, 140, 28, true, true);

      ctx.fillStyle = "#10b981";
      ctx.font = "bold 52px system-ui, -apple-system, sans-serif";
      ctx.fillText("СМТ-1", 110, 170);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "600 28px system-ui, -apple-system, sans-serif";
      ctx.fillText(`ТРЕНИРОВКА #${workout.workoutNumber}`, 110, 215);

      // Top right info
      ctx.fillStyle = "#10b981";
      ctx.font = "bold 44px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`МКЦ-${workout.microcycle}`, 1000, 150);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "400 32px system-ui, -apple-system, sans-serif";
      ctx.fillText(`Неделя ${workout.week} • ${dateStr}`, 1000, 195);
      ctx.fillText(`Время: ${durationStr}`, 1000, 240);
      ctx.textAlign = "left";

      // Card 1: Tonnage
      drawMetricCard(
        ctx,
        80,
        340,
        920,
        340,
        "ОБЩИЙ ТОННАЖ",
        `${tonnage.toLocaleString("ru-RU")} КГ`,
        "#10b981",
        "rgba(16, 185, 129, 0.08)",
        "rgba(16, 185, 129, 0.4)"
      );

      // Card 2: Power Density
      drawMetricCard(
        ctx,
        80,
        720,
        920,
        340,
        "ПЛОТНОСТЬ И МОЩНОСТЬ",
        `${power} КГ/МИН`,
        "#38bdf8",
        "rgba(56, 189, 248, 0.08)",
        "rgba(56, 189, 248, 0.4)"
      );

      // Exercises Box
      ctx.fillStyle = "#090d16";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 3;
      roundRect(ctx, 80, 1100, 920, 520, 32, true, true);

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
      ctx.fillText("КЛЮЧЕВЫЕ ВЕСА В ПРОГРАММЕ:", 120, 1170);

      ctx.fillStyle = "#f8fafc";
      ctx.font = "600 34px system-ui, -apple-system, sans-serif";
      let yOffset = 1240;
      exercisesSummary.forEach((text) => {
        ctx.fillText(`• ${text}`, 120, yOffset);
        yOffset += 60;
      });

      if (latestMeasurement) {
        ctx.fillStyle = "#10b981";
        ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
        ctx.fillText(
          `Замеры: Вес ${latestMeasurement.weightKg} кг • Талия ${latestMeasurement.waistCm || "—"} см`,
          120,
          1560
        );
      }

      // Footer
      ctx.fillStyle = "#10b981";
      ctx.font = "900 48px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("СМТ-1 • СВЕРХМОЩНЫЙ ТРЕНИНГ", 540, 1780);
      ctx.fillStyle = "#64748b";
      ctx.font = "500 28px system-ui, -apple-system, sans-serif";
      ctx.fillText("30 секунд отдыха • Метаболический прогресс", 540, 1830);
      ctx.textAlign = "left";
    } else if (selectedTemplate === "gold") {
      // 2. Brutal Gold & Charcoal
      ctx.fillStyle = "#0b0c10";
      ctx.fillRect(0, 0, width, height);

      // Geometric lines
      ctx.strokeStyle = "rgba(245, 158, 11, 0.2)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(80, 80);
      ctx.lineTo(1000, 80);
      ctx.moveTo(80, 1840);
      ctx.lineTo(1000, 1840);
      ctx.stroke();

      // Header
      ctx.fillStyle = "#f59e0b";
      ctx.font = "900 68px system-ui, -apple-system, sans-serif";
      ctx.fillText("WORKOUT COMPLETE", 80, 180);

      ctx.fillStyle = "#f8fafc";
      ctx.font = "700 42px system-ui, -apple-system, sans-serif";
      ctx.fillText(`СМТ-1 / ТРЕНИРОВКА #${workout.workoutNumber}`, 80, 240);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "500 30px system-ui, -apple-system, sans-serif";
      ctx.fillText(`МКЦ-${workout.microcycle} • Время ${durationStr} • ${dateStr}`, 80, 290);

      // Gold Card 1
      drawMetricCard(
        ctx,
        80,
        360,
        920,
        360,
        "TOTAL TONNAGE",
        `${tonnage.toLocaleString("ru-RU")} KG`,
        "#f59e0b",
        "rgba(245, 158, 11, 0.05)",
        "#f59e0b"
      );

      // Gold Card 2
      drawMetricCard(
        ctx,
        80,
        760,
        920,
        360,
        "POWER & DENSITY",
        `${power} KG/MIN`,
        "#ffffff",
        "rgba(255, 255, 255, 0.05)",
        "rgba(255, 255, 255, 0.4)"
      );

      // Summary Card
      ctx.fillStyle = "#12141a";
      ctx.strokeStyle = "rgba(245, 158, 11, 0.3)";
      ctx.lineWidth = 3;
      roundRect(ctx, 80, 1160, 920, 480, 24, true, true);

      ctx.fillStyle = "#f59e0b";
      ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
      ctx.fillText("ПРОГРЕССИЯ И РАБОЧИЕ ВЕСА:", 120, 1230);

      ctx.fillStyle = "#ffffff";
      ctx.font = "600 34px system-ui, -apple-system, sans-serif";
      let yG = 1300;
      exercisesSummary.forEach((text) => {
        ctx.fillText(`• ${text}`, 120, yG);
        yG += 65;
      });

      // Footer
      ctx.fillStyle = "#f59e0b";
      ctx.font = "900 44px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("СВЕРХМОЩНЫЙ ТРЕНИНГ • 30S REST", 540, 1780);
      ctx.textAlign = "left";
    } else {
      // 3. Glassmorphism Gradient Recomp
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, "#0f172a");
      grad.addColorStop(0.5, "#1e1b4b");
      grad.addColorStop(1, "#020617");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Ambient circles
      const c1 = ctx.createRadialGradient(200, 600, 10, 200, 600, 450);
      c1.addColorStop(0, "rgba(56, 189, 248, 0.25)");
      c1.addColorStop(1, "rgba(56, 189, 248, 0)");
      ctx.fillStyle = c1;
      ctx.fillRect(0, 0, width, height);

      const c2 = ctx.createRadialGradient(880, 1100, 10, 880, 1100, 500);
      c2.addColorStop(0, "rgba(168, 85, 247, 0.25)");
      c2.addColorStop(1, "rgba(168, 85, 247, 0)");
      ctx.fillStyle = c2;
      ctx.fillRect(0, 0, width, height);

      // Header Glass
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 3;
      roundRect(ctx, 80, 100, 920, 180, 32, true, true);

      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 56px system-ui, -apple-system, sans-serif";
      ctx.fillText(`СМТ-1 • ТРЕНИРОВКА #${workout.workoutNumber}`, 120, 180);

      ctx.fillStyle = "#38bdf8";
      ctx.font = "600 32px system-ui, -apple-system, sans-serif";
      ctx.fillText(`МКЦ-${workout.microcycle} (Неделя ${workout.week}) • ${durationStr} • ${dateStr}`, 120, 235);

      // Twin Cards: Tonnage & Power
      drawMetricCard(
        ctx,
        80,
        320,
        440,
        380,
        "ТОННАЖ",
        `${tonnage.toLocaleString("ru-RU")}`,
        "#38bdf8",
        "rgba(255, 255, 255, 0.06)",
        "rgba(56, 189, 248, 0.4)",
        "КГ"
      );

      drawMetricCard(
        ctx,
        560,
        320,
        440,
        380,
        "МОЩНОСТЬ",
        `${power}`,
        "#a855f7",
        "rgba(255, 255, 255, 0.06)",
        "rgba(168, 85, 247, 0.4)",
        "КГ/МИН"
      );

      // Recomp Card
      if (latestMeasurement) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 3;
        roundRect(ctx, 80, 740, 920, 260, 32, true, true);

        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
        ctx.fillText("РЕКОМПОЗИЦИЯ ТЕЛА:", 120, 810);

        ctx.fillStyle = "#f8fafc";
        ctx.font = "800 48px system-ui, -apple-system, sans-serif";
        ctx.fillText(`Вес: ${latestMeasurement.weightKg} кг`, 120, 890);
        if (latestMeasurement.waistCm) {
          ctx.fillText(`Талия: ${latestMeasurement.waistCm} см`, 560, 890);
        }
      }

      // Exercises Box
      ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 3;
      roundRect(ctx, 80, 1040, 920, 560, 32, true, true);

      ctx.fillStyle = "#a855f7";
      ctx.font = "bold 34px system-ui, -apple-system, sans-serif";
      ctx.fillText("ВЫПОЛНЕННЫЕ ДВИЖЕНИЯ:", 120, 1120);

      ctx.fillStyle = "#f8fafc";
      ctx.font = "600 34px system-ui, -apple-system, sans-serif";
      let yGlass = 1190;
      exercisesSummary.forEach((text) => {
        ctx.fillText(`✓  ${text}`, 120, yGlass);
        yGlass += 68;
      });

      // Footer
      ctx.fillStyle = "#f8fafc";
      ctx.font = "800 44px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("СМТ-1 • РЕЗУЛЬТАТ", 540, 1780);
      ctx.textAlign = "left";
    }
  };

  useEffect(() => {
    if (open) {
      renderCanvas();
    }
  }, [open, selectedTemplate, workout]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsGenerating(true);
    setTimeout(() => {
      try {
        const link = document.createElement("a");
        link.download = `smt1_story_workout_${workout.workoutNumber}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      } catch (err) {
        console.error("Story download error", err);
      } finally {
        setIsGenerating(false);
      }
    }, 150);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle onClose={() => onOpenChange(false)}>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-pink-400" />
            <span>Карточка Stories для Instagram</span>
          </div>
        </DialogTitle>
        <DialogDescription>
          Выберите шаблон оформления и скачайте готовую Stories в высоком разрешении 1080×1920
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 my-2 max-h-[72vh] overflow-y-auto pr-1">
        {/* Template Selector */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setSelectedTemplate("neon")}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              selectedTemplate === "neon"
                ? "bg-emerald-500/15 border-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                : "bg-slate-900 border-white/10 text-slate-400 hover:text-white"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold block">Cyberpunk</span>
              {selectedTemplate === "neon" && <Check className="h-3.5 w-3.5 text-emerald-400" />}
            </div>
            <span className="text-[9px] text-slate-400 block">Неон & Изумруд</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTemplate("gold")}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              selectedTemplate === "gold"
                ? "bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/20"
                : "bg-slate-900 border-white/10 text-slate-400 hover:text-white"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold block">Brutal Gold</span>
              {selectedTemplate === "gold" && <Check className="h-3.5 w-3.5 text-amber-400" />}
            </div>
            <span className="text-[9px] text-slate-400 block">Премиум Золото</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedTemplate("glass")}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              selectedTemplate === "glass"
                ? "bg-purple-500/15 border-purple-500 text-white shadow-lg shadow-purple-500/20"
                : "bg-slate-900 border-white/10 text-slate-400 hover:text-white"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold block">Glassmorphism</span>
              {selectedTemplate === "glass" && <Check className="h-3.5 w-3.5 text-purple-400" />}
            </div>
            <span className="text-[9px] text-slate-400 block">Индиго & Замеры</span>
          </button>
        </div>

        {/* Live Canvas Preview (scaled down to fit screen cleanly) */}
        <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-950 border border-white/10">
          <div className="w-[200px] h-[355px] sm:w-[240px] sm:h-[426px] overflow-hidden rounded-xl shadow-2xl border border-white/20 relative">
            <canvas
              ref={canvasRef}
              className="w-full h-full object-contain pointer-events-none"
            />
          </div>
          <span className="text-[10px] text-slate-400 mt-2">
            Разрешение для экспорта: 1080 × 1920 px (9:16)
          </span>
        </div>
      </div>

      <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row gap-2 shrink-0">
        <Button
          variant="accent"
          size="lg"
          className="flex-1 font-bold text-xs sm:text-sm bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white hover:opacity-90 flex items-center justify-center gap-2"
          onClick={handleDownload}
          disabled={isGenerating}
        >
          <Download className="h-4 w-4 shrink-0" />
          <span>{isGenerating ? "Генерация..." : "Скачать для Instagram Stories"}</span>
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="font-semibold text-xs border-white/20"
          onClick={() => onOpenChange(false)}
        >
          Закрыть
        </Button>
      </div>
    </Dialog>
  );
}

// Helpers for canvas drawing
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill = true,
  stroke = false
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function drawMetricCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  value: string,
  valColor: string,
  bgColor: string,
  borderColor: string,
  unit?: string
) {
  ctx.fillStyle = bgColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 3;
  roundRect(ctx, x, y, w, h, 28, true, true);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "bold 30px system-ui, -apple-system, sans-serif";
  ctx.fillText(title, x + 40, y + 70);

  ctx.fillStyle = valColor;
  ctx.font = "900 100px system-ui, -apple-system, sans-serif";
  ctx.fillText(value, x + 40, y + 210);

  if (unit) {
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 36px system-ui, -apple-system, sans-serif";
    ctx.fillText(unit, x + 40, y + 280);
  }
}
