"use client";

import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { WorkoutSession } from "@/types/smt";
import { BodyMeasurement } from "@/types/body";
import { formatTime, formatDate } from "@/lib/utils";
import { Download, Sparkles, Check, Zap, Trophy, Flame, Activity, Award, Dumbbell } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { getLocalizedExerciseName } from "@/lib/i18n/exercises";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { calculateAthleticScore } from "@/lib/scoring/athleticScore";

interface StoryShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workout: WorkoutSession | null;
  latestMeasurement?: BodyMeasurement;
}

export type StoryTemplateType = "power" | "recomp" | "progress" | "density" | "minimal" | "challenge";

export function StoryShareModal({
  open,
  onOpenChange,
  workout,
  latestMeasurement,
}: StoryShareModalProps) {
  const { t, language } = useTranslation();
  const { storyBotUsername, gender, userAge } = useSettingsStore();
  const { workouts } = useWorkoutStore();
  const [selectedTemplate, setSelectedTemplate] = useState<StoryTemplateType>("power");
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  if (!workout) return null;

  const durationStr = formatTime(workout.durationSeconds || 0);
  const tonnage = workout.tonnageKg || 0;
  const power = workout.powerKgPerMin || 0;
  
  // Format date according to locale
  const localeStr = language === "uk" ? "uk-UA" : language === "en" ? "en-US" : "ru-RU";
  const dateStr = workout.completedAt
    ? new Date(workout.completedAt).toLocaleDateString(localeStr, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString(localeStr);

  // Athletic Score calculation
  const athleteWeight = latestMeasurement?.weightKg || 80;
  const athleticScore = calculateAthleticScore({
    tonnageKg: tonnage,
    durationSeconds: workout.durationSeconds || 45 * 60,
    bodyWeightKg: athleteWeight,
    gender: gender || "male",
    age: userAge || 28,
  });

  // Localized tier title
  const tierTitle =
    athleticScore.tierKey === "titan"
      ? t.scoring.tierTitan
      : athleticScore.tierKey === "iron_pro"
      ? t.scoring.tierIronPro
      : athleticScore.tierKey === "power_master"
      ? t.scoring.tierPowerMaster
      : t.scoring.tierActive;

  // Extract key exercises (Top 3)
  const exercisesSummary = workout.supersets
    .flatMap((ss) => ss.exercises)
    .slice(0, 4)
    .map((ex) => {
      const weight = ex.sets[0]?.actualWeight ?? ex.sets[0]?.targetWeight ?? 0;
      const reps = ex.sets[0]?.actualReps ?? ex.sets[0]?.targetReps ?? 10;
      const totalSets = ex.sets.filter((s) => s.completed).length || ex.sets.length;
      return {
        name: getLocalizedExerciseName(ex.exerciseId || ex.name, language, false),
        detail: `${weight} ${t.common.kg} × ${reps} ${t.common.reps} (${totalSets} ${t.common.sets})`,
        weight,
        reps,
      };
    });

  // Calculate comparison with previous microcycle if available
  const prevWorkout = workouts.find((w) => w.workoutNumber === workout.workoutNumber - 9);
  const prevTonnage = prevWorkout?.tonnageKg || (tonnage > 0 ? Math.round(tonnage * 0.92) : 0);
  const tonnageDelta = tonnage - prevTonnage;
  const tonnagePercent = prevTonnage > 0 ? Math.round((tonnageDelta / prevTonnage) * 100) : 8;

  // Total completed sets in this session
  const totalCompletedSets = workout.supersets
    .flatMap((s) => s.exercises)
    .flatMap((e) => e.sets)
    .filter((s) => s.completed).length || 24;

  const botHandle = storyBotUsername || "@smt_workout_bot";

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 1080;
    const height = 1920;
    canvas.width = width;
    canvas.height = height;

    const labels = t.story.labels;

    // --- TEMPLATE 1: POWER & SETS (Neon Emerald Cyberpunk) ---
    if (selectedTemplate === "power") {
      // Background gradient
      const bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, "#020617");
      bg.addColorStop(0.5, "#061524");
      bg.addColorStop(1, "#020617");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Ambient radial glow
      const glow = ctx.createRadialGradient(250, 420, 10, 250, 420, 550);
      glow.addColorStop(0, "rgba(16, 185, 129, 0.2)");
      glow.addColorStop(1, "rgba(16, 185, 129, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      // Header Block
      drawHeaderBlock(
        ctx,
        labels.powerWorkout,
        `${labels.workoutNumber}${workout.workoutNumber} • ${labels.microcycle}${workout.microcycle}`,
        `${t.common.week} ${workout.week} • ${dateStr}`,
        "#10b981",
        "#0f172a"
      );

      // Athletic Score Hero Badge
      drawScoreBadge(
        ctx,
        80,
        280,
        920,
        150,
        athleticScore.score,
        tierTitle,
        labels.athleticScore,
        "#10b981",
        "rgba(16, 185, 129, 0.12)",
        "rgba(16, 185, 129, 0.4)"
      );

      // Twin Core Metrics: Tonnage & Density
      drawMetricCard(
        ctx,
        80,
        460,
        445,
        260,
        labels.totalTonnage,
        `${tonnage.toLocaleString()}`,
        t.common.kg,
        "#10b981",
        "rgba(16, 185, 129, 0.08)",
        "rgba(16, 185, 129, 0.3)"
      );

      drawMetricCard(
        ctx,
        555,
        460,
        445,
        260,
        labels.powerAndDensity,
        `${power}`,
        `${t.common.kg}/${t.common.min}`,
        "#38bdf8",
        "rgba(56, 189, 248, 0.08)",
        "rgba(56, 189, 248, 0.3)"
      );

      // Time + Rest Info Card
      ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 2;
      roundRect(ctx, 80, 750, 920, 100, 20, true, true);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "600 28px system-ui, -apple-system, sans-serif";
      ctx.fillText(`⏱  ${t.common.time}: ${durationStr}    |    ⚡  ${labels.restBetweenSets}`, 120, 812);

      // Exercises Box (Top Heavy Sets)
      ctx.fillStyle = "#090d16";
      ctx.strokeStyle = "rgba(16, 185, 129, 0.25)";
      ctx.lineWidth = 3;
      roundRect(ctx, 80, 880, 920, 680, 28, true, true);

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 34px system-ui, -apple-system, sans-serif";
      ctx.fillText(labels.keyWeights, 120, 955);

      let yPos = 1030;
      exercisesSummary.forEach((ex) => {
        ctx.fillStyle = "#f8fafc";
        ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
        ctx.fillText(`• ${ex.name}`, 120, yPos);

        ctx.fillStyle = "#10b981";
        ctx.font = "600 28px system-ui, -apple-system, sans-serif";
        ctx.fillText(`   ${ex.detail}`, 120, yPos + 44);

        yPos += 105;
      });

      // Bottom Viral Banner
      drawPromoBanner(ctx, botHandle, labels.joinTelegramBot, "#10b981");
    }

    // --- TEMPLATE 2: RECOMPOSITION (Frosted Glass & Gradient) ---
    else if (selectedTemplate === "recomp") {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, "#0b0f19");
      grad.addColorStop(0.4, "#1e1b4b");
      grad.addColorStop(1, "#090d16");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Ambient glows
      const c1 = ctx.createRadialGradient(250, 500, 10, 250, 500, 500);
      c1.addColorStop(0, "rgba(56, 189, 248, 0.25)");
      c1.addColorStop(1, "rgba(56, 189, 248, 0)");
      ctx.fillStyle = c1;
      ctx.fillRect(0, 0, width, height);

      const c2 = ctx.createRadialGradient(850, 1100, 10, 850, 1100, 500);
      c2.addColorStop(0, "rgba(168, 85, 247, 0.25)");
      c2.addColorStop(1, "rgba(168, 85, 247, 0)");
      ctx.fillStyle = c2;
      ctx.fillRect(0, 0, width, height);

      // Header Block
      drawHeaderBlock(
        ctx,
        labels.powerWorkout,
        `${labels.workoutNumber}${workout.workoutNumber} • ${labels.microcycle}${workout.microcycle}`,
        `${dateStr} • ${durationStr}`,
        "#38bdf8",
        "rgba(255, 255, 255, 0.08)"
      );

      // Score
      drawScoreBadge(
        ctx,
        80,
        280,
        920,
        150,
        athleticScore.score,
        tierTitle,
        labels.athleticScore,
        "#38bdf8",
        "rgba(56, 189, 248, 0.12)",
        "rgba(56, 189, 248, 0.35)"
      );

      // Recomp Highlights Card
      ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 3;
      roundRect(ctx, 80, 460, 920, 360, 28, true, true);

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 34px system-ui, -apple-system, sans-serif";
      ctx.fillText(labels.bodyRecomp, 120, 530);

      // Metrics in Recomp
      ctx.fillStyle = "#f8fafc";
      ctx.font = "900 68px system-ui, -apple-system, sans-serif";
      ctx.fillText(`${athleteWeight} ${t.common.kg}`, 120, 630);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "600 28px system-ui, -apple-system, sans-serif";
      ctx.fillText(labels.weight, 120, 675);

      if (latestMeasurement?.waistCm) {
        ctx.fillStyle = "#38bdf8";
        ctx.font = "900 68px system-ui, -apple-system, sans-serif";
        ctx.fillText(`${latestMeasurement.waistCm} ${t.common.cm}`, 560, 630);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "600 28px system-ui, -apple-system, sans-serif";
        ctx.fillText(labels.waist, 560, 675);
      }

      ctx.fillStyle = "#a855f7";
      ctx.font = "600 30px system-ui, -apple-system, sans-serif";
      ctx.fillText(`✨  ${t.body.recompSummary}: ${t.body.fatLoss} & ${t.body.muscleGain}`, 120, 760);

      // Tonnage & Density Twin
      drawMetricCard(
        ctx,
        80,
        850,
        445,
        280,
        labels.totalTonnage,
        `${tonnage.toLocaleString()}`,
        t.common.kg,
        "#38bdf8",
        "rgba(255, 255, 255, 0.05)",
        "rgba(56, 189, 248, 0.3)"
      );

      drawMetricCard(
        ctx,
        555,
        850,
        445,
        280,
        labels.powerAndDensity,
        `${power}`,
        `${t.common.kg}/${t.common.min}`,
        "#a855f7",
        "rgba(255, 255, 255, 0.05)",
        "rgba(168, 85, 247, 0.3)"
      );

      // Exercises Box
      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = 2;
      roundRect(ctx, 80, 1160, 920, 400, 24, true, true);

      ctx.fillStyle = "#a855f7";
      ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
      ctx.fillText(labels.setsAndReps, 120, 1230);

      let yR = 1295;
      exercisesSummary.slice(0, 3).forEach((ex) => {
        ctx.fillStyle = "#ffffff";
        ctx.font = "600 30px system-ui, -apple-system, sans-serif";
        ctx.fillText(`✓  ${ex.name}: ${ex.detail}`, 120, yR);
        yR += 60;
      });

      // Bottom Viral Banner
      drawPromoBanner(ctx, botHandle, labels.joinTelegramBot, "#38bdf8");
    }

    // --- TEMPLATE 3: PROGRESS & PR (Brutal Gold / Amber) ---
    else if (selectedTemplate === "progress") {
      ctx.fillStyle = "#0c0d12";
      ctx.fillRect(0, 0, width, height);

      // Geometric accent lines
      ctx.strokeStyle = "rgba(245, 158, 11, 0.25)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(80, 80);
      ctx.lineTo(1000, 80);
      ctx.moveTo(80, 1840);
      ctx.lineTo(1000, 1840);
      ctx.stroke();

      // Header Block
      drawHeaderBlock(
        ctx,
        labels.powerWorkout,
        `${labels.workoutCompleted} • #${workout.workoutNumber}`,
        `${labels.microcycle}${workout.microcycle} • ${t.common.week} ${workout.week} • ${dateStr}`,
        "#f59e0b",
        "#14161f"
      );

      // Athletic Score
      drawScoreBadge(
        ctx,
        80,
        280,
        920,
        150,
        athleticScore.score,
        tierTitle,
        labels.athleticScore,
        "#f59e0b",
        "rgba(245, 158, 11, 0.1)",
        "rgba(245, 158, 11, 0.4)"
      );

      // Gold Hero Card: Growth vs Previous Cycle
      ctx.fillStyle = "#161922";
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 4;
      roundRect(ctx, 80, 460, 920, 340, 28, true, true);

      ctx.fillStyle = "#f59e0b";
      ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
      ctx.fillText(`🏆  ${labels.progressVsLast}`, 120, 530);

      ctx.fillStyle = "#ffffff";
      ctx.font = "900 84px system-ui, -apple-system, sans-serif";
      ctx.fillText(`+${tonnageDelta > 0 ? tonnageDelta.toLocaleString() : "850"} ${t.common.kg}`, 120, 640);

      ctx.fillStyle = "#10b981";
      ctx.font = "bold 34px system-ui, -apple-system, sans-serif";
      ctx.fillText(`▲ +${tonnagePercent}%  |  ${labels.newPrRecord}`, 120, 720);

      // Core Metrics Twin
      drawMetricCard(
        ctx,
        80,
        830,
        445,
        280,
        labels.totalTonnage,
        `${tonnage.toLocaleString()}`,
        t.common.kg,
        "#f59e0b",
        "#12141c",
        "rgba(245, 158, 11, 0.3)"
      );

      drawMetricCard(
        ctx,
        555,
        830,
        445,
        280,
        labels.powerAndDensity,
        `${power}`,
        `${t.common.kg}/${t.common.min}`,
        "#ffffff",
        "#12141c",
        "rgba(255, 255, 255, 0.2)"
      );

      // Summary Box
      ctx.fillStyle = "#12141c";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 2;
      roundRect(ctx, 80, 1140, 920, 420, 24, true, true);

      ctx.fillStyle = "#f59e0b";
      ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
      ctx.fillText(labels.keyWeights, 120, 1210);

      let yP = 1275;
      exercisesSummary.slice(0, 3).forEach((ex) => {
        ctx.fillStyle = "#f8fafc";
        ctx.font = "600 30px system-ui, -apple-system, sans-serif";
        ctx.fillText(`⚡  ${ex.name}: ${ex.detail}`, 120, yP);
        yP += 65;
      });

      // Bottom Viral Banner
      drawPromoBanner(ctx, botHandle, labels.joinTelegramBot, "#f59e0b");
    }

    // --- TEMPLATE 4: DENSITY & GRIT (Crimson Dark Neon) ---
    else if (selectedTemplate === "density") {
      const bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, "#0a060a");
      bg.addColorStop(0.5, "#1f0914");
      bg.addColorStop(1, "#0a060a");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Crimson glow
      const glow = ctx.createRadialGradient(250, 450, 10, 250, 450, 500);
      glow.addColorStop(0, "rgba(244, 63, 94, 0.2)");
      glow.addColorStop(1, "rgba(244, 63, 94, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      drawHeaderBlock(
        ctx,
        labels.powerWorkout,
        `${labels.tempoAndBurn} • #${workout.workoutNumber}`,
        `${dateStr} • ${durationStr}`,
        "#f43f5e",
        "#180913"
      );

      drawScoreBadge(
        ctx,
        80,
        280,
        920,
        150,
        athleticScore.score,
        tierTitle,
        labels.athleticScore,
        "#f43f5e",
        "rgba(244, 63, 94, 0.12)",
        "rgba(244, 63, 94, 0.4)"
      );

      // Intensity Hero: Density
      drawMetricCard(
        ctx,
        80,
        460,
        920,
        340,
        labels.powerAndDensity,
        `${power} ${t.common.kg}/${t.common.min}`,
        `⏱  ${labels.restBetweenSets}  |  ${totalCompletedSets} ${t.common.sets}`,
        "#f43f5e",
        "rgba(244, 63, 94, 0.08)",
        "rgba(244, 63, 94, 0.4)"
      );

      // Twin Tonnage & Sets
      drawMetricCard(
        ctx,
        80,
        830,
        445,
        280,
        labels.totalTonnage,
        `${tonnage.toLocaleString()}`,
        t.common.kg,
        "#ffffff",
        "#140b12",
        "rgba(255, 255, 255, 0.2)"
      );

      drawMetricCard(
        ctx,
        555,
        830,
        445,
        280,
        labels.totalSetsCount,
        `${totalCompletedSets}`,
        labels.restBetweenSets,
        "#fb7185",
        "#140b12",
        "rgba(251, 113, 133, 0.3)"
      );

      // Exercises Box
      ctx.fillStyle = "#140b12";
      ctx.strokeStyle = "rgba(244, 63, 94, 0.25)";
      ctx.lineWidth = 2;
      roundRect(ctx, 80, 1140, 920, 420, 24, true, true);

      ctx.fillStyle = "#fb7185";
      ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
      ctx.fillText(labels.keyWeights, 120, 1210);

      let yD = 1275;
      exercisesSummary.slice(0, 3).forEach((ex) => {
        ctx.fillStyle = "#f8fafc";
        ctx.font = "600 30px system-ui, -apple-system, sans-serif";
        ctx.fillText(`🔥  ${ex.name}: ${ex.detail}`, 120, yD);
        yD += 65;
      });

      drawPromoBanner(ctx, botHandle, labels.joinTelegramBot, "#f43f5e");
    }

    // --- TEMPLATE 5: MINIMALIST / PHOTO POSTER (Deep Charcoal / Transparent Feel) ---
    else if (selectedTemplate === "minimal") {
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, width, height);

      // Giant subtle backdrop score
      ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
      ctx.font = "900 480px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${athleticScore.score}`, 540, 980);
      ctx.textAlign = "left";

      // Top minimalist header
      ctx.fillStyle = "#a1a1aa";
      ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
      ctx.fillText(labels.powerWorkout, 100, 140);

      ctx.fillStyle = "#ffffff";
      ctx.font = "900 68px system-ui, -apple-system, sans-serif";
      ctx.fillText(`${labels.workoutNumber}${workout.workoutNumber} / ${labels.microcycle}${workout.microcycle}`, 100, 215);

      ctx.fillStyle = "#71717a";
      ctx.font = "500 28px system-ui, -apple-system, sans-serif";
      ctx.fillText(`${dateStr} • ${durationStr}`, 100, 260);

      // Hero Score Card
      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 3;
      roundRect(ctx, 100, 340, 880, 480, 32, true, true);

      ctx.fillStyle = "#a1a1aa";
      ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
      ctx.fillText(labels.athleticScore, 150, 420);

      ctx.fillStyle = "#ffffff";
      ctx.font = "900 160px system-ui, -apple-system, sans-serif";
      ctx.fillText(`${athleticScore.score}`, 150, 590);

      ctx.fillStyle = "#10b981";
      ctx.font = "bold 44px system-ui, -apple-system, sans-serif";
      ctx.fillText(`• ${tierTitle}`, 460, 560);

      ctx.fillStyle = "#71717a";
      ctx.font = "600 30px system-ui, -apple-system, sans-serif";
      ctx.fillText(`${t.scoring.relativeTonnage}: ${athleticScore.relativeTonnage}x bodyweight`, 150, 680);

      // Clean Bottom Stats Row
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 2;
      roundRect(ctx, 100, 860, 880, 320, 28, true, true);

      ctx.fillStyle = "#ffffff";
      ctx.font = "900 58px system-ui, -apple-system, sans-serif";
      ctx.fillText(`${tonnage.toLocaleString()} ${t.common.kg}`, 150, 960);
      ctx.fillStyle = "#71717a";
      ctx.font = "bold 26px system-ui, -apple-system, sans-serif";
      ctx.fillText(labels.totalTonnage, 150, 1005);

      ctx.fillStyle = "#ffffff";
      ctx.font = "900 58px system-ui, -apple-system, sans-serif";
      ctx.fillText(`${power} ${t.common.kg}/${t.common.min}`, 150, 1100);
      ctx.fillStyle = "#71717a";
      ctx.font = "bold 26px system-ui, -apple-system, sans-serif";
      ctx.fillText(labels.powerAndDensity, 150, 1145);

      // Clean minimal invite
      drawPromoBanner(ctx, botHandle, labels.joinTelegramBot, "#ffffff");
    }

    // --- TEMPLATE 6: CHALLENGE & DUEL (Electric Violet & Cyan) ---
    else if (selectedTemplate === "challenge") {
      const bg = ctx.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, "#080616");
      bg.addColorStop(0.5, "#180c36");
      bg.addColorStop(1, "#050914");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Dual color glows
      const g1 = ctx.createRadialGradient(250, 400, 10, 250, 400, 450);
      g1.addColorStop(0, "rgba(168, 85, 247, 0.3)");
      g1.addColorStop(1, "rgba(168, 85, 247, 0)");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, width, height);

      const g2 = ctx.createRadialGradient(850, 800, 10, 850, 800, 500);
      g2.addColorStop(0, "rgba(6, 182, 212, 0.25)");
      g2.addColorStop(1, "rgba(6, 182, 212, 0)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, width, height);

      // Header
      drawHeaderBlock(
        ctx,
        labels.challengeSubtitle,
        `${labels.powerWorkout} • #${workout.workoutNumber}`,
        `${dateStr} • ${durationStr}`,
        "#06b6d4",
        "#140e2b"
      );

      // Giant Challenge Headline
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 68px system-ui, -apple-system, sans-serif";
      ctx.fillText(labels.challengeTitle, 80, 360);

      // Hero Duel Card
      ctx.fillStyle = "rgba(168, 85, 247, 0.12)";
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 4;
      roundRect(ctx, 80, 420, 920, 420, 32, true, true);

      ctx.fillStyle = "#c084fc";
      ctx.font = "bold 34px system-ui, -apple-system, sans-serif";
      ctx.fillText(`⚡  ${labels.athleticScore}:`, 120, 490);

      ctx.fillStyle = "#ffffff";
      ctx.font = "900 130px system-ui, -apple-system, sans-serif";
      ctx.fillText(`${athleticScore.score}`, 120, 630);

      ctx.fillStyle = "#06b6d4";
      ctx.font = "bold 44px system-ui, -apple-system, sans-serif";
      ctx.fillText(`/ 100`, 360, 630);

      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 38px system-ui, -apple-system, sans-serif";
      ctx.fillText(`Рівень: ${tierTitle}`, 120, 720);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "600 28px system-ui, -apple-system, sans-serif";
      ctx.fillText(`Результат: ${tonnage.toLocaleString()} кг за ${durationStr} (30с відпочинок)`, 120, 780);

      // Duel Targets: Tonnage + Density
      drawMetricCard(
        ctx,
        80,
        880,
        445,
        280,
        labels.totalTonnage,
        `${tonnage.toLocaleString()}`,
        t.common.kg,
        "#06b6d4",
        "rgba(6, 182, 212, 0.08)",
        "rgba(6, 182, 212, 0.4)"
      );

      drawMetricCard(
        ctx,
        555,
        880,
        445,
        280,
        labels.powerAndDensity,
        `${power}`,
        `${t.common.kg}/${t.common.min}`,
        "#c084fc",
        "rgba(168, 85, 247, 0.08)",
        "rgba(168, 85, 247, 0.4)"
      );

      // Challenge Box Callout
      ctx.fillStyle = "#120b22";
      ctx.strokeStyle = "rgba(6, 182, 212, 0.35)";
      ctx.lineWidth = 3;
      roundRect(ctx, 80, 1200, 920, 360, 28, true, true);

      ctx.fillStyle = "#06b6d4";
      ctx.font = "bold 36px system-ui, -apple-system, sans-serif";
      ctx.fillText("🥊  ВИКЛИК ПРИЙНЯТО?", 120, 1280);

      ctx.fillStyle = "#ffffff";
      ctx.font = "600 32px system-ui, -apple-system, sans-serif";
      ctx.fillText("Чи подужаєш підняти 150 власних ваг", 120, 1350);
      ctx.fillText("за 45 хвилин з відпочинком 30 секунд?", 120, 1400);

      ctx.fillStyle = "#c084fc";
      ctx.font = "bold 30px system-ui, -apple-system, sans-serif";
      ctx.fillText("Спробуй у нашому безкоштовному трекері!", 120, 1480);

      drawPromoBanner(ctx, botHandle, labels.joinTelegramBot, "#06b6d4");
    }
  };

  useEffect(() => {
    if (open) {
      renderCanvas();
    }
  }, [open, selectedTemplate, workout, language, athleticScore.score]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsGenerating(true);
    setTimeout(() => {
      try {
        const link = document.createElement("a");
        link.download = `smt_story_w${workout.workoutNumber}_${selectedTemplate}_${language}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      } catch (err) {
        console.error("Story download error", err);
      } finally {
        setIsGenerating(false);
      }
    }, 150);
  };

  const templateOptions: { id: StoryTemplateType; name: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: "power",
      name: t.story.templates.power.name,
      desc: t.story.templates.power.desc,
      icon: <Dumbbell className="h-4 w-4 text-emerald-400" />,
    },
    {
      id: "recomp",
      name: t.story.templates.recomp.name,
      desc: t.story.templates.recomp.desc,
      icon: <Activity className="h-4 w-4 text-cyan-400" />,
    },
    {
      id: "progress",
      name: t.story.templates.progress.name,
      desc: t.story.templates.progress.desc,
      icon: <Trophy className="h-4 w-4 text-amber-400" />,
    },
    {
      id: "density",
      name: t.story.templates.density.name,
      desc: t.story.templates.density.desc,
      icon: <Flame className="h-4 w-4 text-rose-400" />,
    },
    {
      id: "minimal",
      name: t.story.templates.minimal.name,
      desc: t.story.templates.minimal.desc,
      icon: <Award className="h-4 w-4 text-slate-300" />,
    },
    {
      id: "challenge",
      name: t.story.templates.challenge.name,
      desc: t.story.templates.challenge.desc,
      icon: <Zap className="h-4 w-4 text-purple-400" />,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle onClose={() => onOpenChange(false)}>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-pink-400" />
            <span>{t.story.modalTitle}</span>
          </div>
        </DialogTitle>
        <DialogDescription>{t.story.modalDesc}</DialogDescription>
      </DialogHeader>

      <div className="space-y-4 my-2 max-h-[72vh] overflow-y-auto pr-1">
        {/* 6 Specialized Templates Selector Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {templateOptions.map((tmpl) => {
            const isSelected = selectedTemplate === tmpl.id;
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => setSelectedTemplate(tmpl.id)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "bg-emerald-500/15 border-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    : "bg-slate-900 border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    {tmpl.icon}
                    <span className="text-[11px] font-bold block">{tmpl.name}</span>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                </div>
                <span className="text-[9px] text-slate-400 block leading-tight">{tmpl.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Live Canvas Preview */}
        <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-950 border border-white/10">
          <div className="w-[200px] h-[355px] sm:w-[240px] sm:h-[426px] overflow-hidden rounded-xl shadow-2xl border border-white/20 relative">
            <canvas ref={canvasRef} className="w-full h-full object-contain pointer-events-none" />
          </div>
          <span className="text-[10px] text-slate-400 mt-2">{t.story.exportResolution}</span>
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
          <span>{isGenerating ? t.story.generating : t.story.downloadButton}</span>
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="font-semibold text-xs border-white/20"
          onClick={() => onOpenChange(false)}
        >
          {t.story.closeButton}
        </Button>
      </div>
    </Dialog>
  );
}

// --- Canvas Drawing Helpers ---

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

function drawHeaderBlock(
  ctx: CanvasRenderingContext2D,
  badgeText: string,
  title: string,
  meta: string,
  accentColor: string,
  bgColor: string
) {
  // Badge
  ctx.fillStyle = bgColor;
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 3;
  roundRect(ctx, 80, 80, 480, 140, 24, true, true);

  ctx.fillStyle = accentColor;
  ctx.font = "bold 38px system-ui, -apple-system, sans-serif";
  ctx.fillText(badgeText, 110, 140);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "600 28px system-ui, -apple-system, sans-serif";
  ctx.fillText(title, 110, 185);

  // Top right meta
  ctx.fillStyle = "#94a3b8";
  ctx.font = "500 30px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(meta, 1000, 150);
  ctx.textAlign = "left";
}

function drawScoreBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  score: number,
  tier: string,
  label: string,
  accentColor: string,
  bgColor: string,
  borderColor: string
) {
  ctx.fillStyle = bgColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 3;
  roundRect(ctx, x, y, w, h, 28, true, true);

  ctx.fillStyle = accentColor;
  ctx.font = "900 76px system-ui, -apple-system, sans-serif";
  ctx.fillText(`⚡ ${score}`, x + 40, y + 100);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
  ctx.fillText("/ 100", x + 260, y + 95);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 34px system-ui, -apple-system, sans-serif";
  ctx.fillText(tier, x + 380, y + 95);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "600 24px system-ui, -apple-system, sans-serif";
  ctx.fillText(label, x + 380, y + 50);
}

function drawMetricCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  value: string,
  unit: string,
  valColor: string,
  bgColor: string,
  borderColor: string
) {
  ctx.fillStyle = bgColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 3;
  roundRect(ctx, x, y, w, h, 24, true, true);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "bold 26px system-ui, -apple-system, sans-serif";
  ctx.fillText(title, x + 35, y + 60);

  ctx.fillStyle = valColor;
  ctx.font = "900 76px system-ui, -apple-system, sans-serif";
  ctx.fillText(value, x + 35, y + 160);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "600 28px system-ui, -apple-system, sans-serif";
  ctx.fillText(unit, x + 35, y + 220);
}

function drawPromoBanner(
  ctx: CanvasRenderingContext2D,
  botUsername: string,
  inviteText: string,
  accentColor: string
) {
  const y = 1660;
  ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 3;
  roundRect(ctx, 80, y, 920, 160, 24, true, true);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(inviteText, 540, y + 65);

  ctx.fillStyle = accentColor;
  ctx.font = "900 44px system-ui, -apple-system, sans-serif";
  ctx.fillText(botUsername, 540, y + 125);
  ctx.textAlign = "left";
}
