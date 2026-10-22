"use client";

import React, { useState, useRef, useEffect } from "react";
import QRCode from "qrcode";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { WorkoutSession } from "@/types/smt";
import { BodyMeasurement, AppLanguage } from "@/types/body";
import { formatTime, formatDate } from "@/lib/utils";
import { Download, Sparkles, Check, Zap, Trophy, Flame, Activity, Award, Dumbbell, Share2, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { getLocalizedExerciseName } from "@/lib/i18n/exercises";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { useWorkoutStore } from "@/lib/store/useWorkoutStore";
import { calculateAthleticScore } from "@/lib/scoring/athleticScore";
import { triggerHaptic } from "@/lib/tma/telegram";

export interface PrepStoryData {
  prepSessionNumber: number;
  targetRestSeconds: number;
  isGraduation?: boolean;
  completedSetsCount?: number;
  totalSetsCount?: number;
  suggestedWeights?: {
    bench: number;
    closeGrip: number;
    pull: number;
    biceps: number;
    squat: number;
    ohp: number;
  };
}

interface StoryShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workout: WorkoutSession | null;
  latestMeasurement?: BodyMeasurement;
  prepData?: PrepStoryData;
  initialTemplate?: StoryTemplateType;
}

export type StoryTemplateType =
  | "power"
  | "recomp"
  | "progress"
  | "density"
  | "minimal"
  | "challenge"
  | "prep_step"
  | "prep_grad";

export function StoryShareModal({
  open,
  onOpenChange,
  workout,
  latestMeasurement,
  prepData,
  initialTemplate,
}: StoryShareModalProps) {
  const { t, language } = useTranslation();
  const { storyBotUsername, gender, userAge } = useSettingsStore();
  const { workouts } = useWorkoutStore();
  const [selectedTemplate, setSelectedTemplate] = useState<StoryTemplateType>(
    initialTemplate || (prepData?.isGraduation ? "prep_grad" : prepData ? "prep_step" : "power")
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishingChallenge, setIsPublishingChallenge] = useState(false);
  const [publishedChallenge, setPublishedChallenge] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (open) {
      if (initialTemplate) {
        setSelectedTemplate(initialTemplate);
      } else if (prepData?.isGraduation) {
        setSelectedTemplate("prep_grad");
      } else if (prepData) {
        setSelectedTemplate("prep_step");
      }
    }
  }, [open, initialTemplate, prepData]);

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

  const handlePublishChallenge = async () => {
    if (isPublishingChallenge || publishedChallenge || !workout) return;
    setIsPublishingChallenge(true);
    try {
      const res = await fetch("/api/challenge/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workoutNumber: workout.workoutNumber || 1,
          microcycle: workout.microcycle || 1,
          durationSeconds: workout.durationSeconds || 0,
          tonnageKg: workout.tonnageKg || 0,
          powerKgPerMin: workout.powerKgPerMin || 0,
          athleticScore: {
            score: athleticScore.score,
            tier: athleticScore.tierKey,
            tierLabel: tierTitle,
          },
          athleteName: window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name || "",
          athleteUsername: window.Telegram?.WebApp?.initDataUnsafe?.user?.username || "",
          notes: workout.notes || "",
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setPublishedChallenge(true);
      }
    } catch (e) {
      console.error("Failed to publish challenge:", e);
    } finally {
      setIsPublishingChallenge(false);
    }
  };

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

  const botHandle =
    storyBotUsername && !storyBotUsername.includes("smt_workout_bot")
      ? storyBotUsername
      : "@athletic_smt_bot";

  const renderCanvas = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 1080;
    const height = 1920;
    canvas.width = width;
    canvas.height = height;

    const labels = t.story.labels;

    // --- QR Code generation ---
    // Build deep-link to bot with start param = username for tracking
    const tgUser = typeof window !== "undefined"
      ? (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.username || ""
      : "";
    const cleanBotName = botHandle.startsWith("@") ? botHandle.slice(1) : botHandle;
    const qrUrl = tgUser
      ? `https://t.me/${cleanBotName}?start=ref_${tgUser}`
      : `https://t.me/${cleanBotName}`;

    let qrImg: HTMLImageElement | null = null;
    try {
      const qrDataUrl = await QRCode.toDataURL(qrUrl, {
        width: 300,
        margin: 1,
        color: { dark: "#ffffff", light: "#00000000" },
        errorCorrectionLevel: "M",
      });
      qrImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = qrDataUrl;
      });
    } catch (e) {
      console.warn("QR generation failed:", e);
    }

    // --- TEMPLATE 1: POWER & SETS (Neon Emerald Cyberpunk) ---
    if (selectedTemplate === "power") {
      const bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, "#020617");
      bg.addColorStop(0.5, "#061524");
      bg.addColorStop(1, "#020617");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Ambient radial glow
      const glow = ctx.createRadialGradient(250, 380, 10, 250, 380, 550);
      glow.addColorStop(0, "rgba(16, 185, 129, 0.2)");
      glow.addColorStop(1, "rgba(16, 185, 129, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      // Header Block (y = 60, h = 140)
      drawHeaderBlock(
        ctx,
        labels.powerWorkout,
        `${labels.workoutNumber}${workout.workoutNumber} • ${labels.microcycle}${workout.microcycle}`,
        `${t.common.week} ${workout.week} • ${dateStr}`,
        "#10b981",
        "#0f172a"
      );

      // Athletic Score Hero Badge (y = 220, h = 140)
      drawScoreBadge(
        ctx,
        80,
        220,
        920,
        140,
        athleticScore.score,
        tierTitle,
        labels.athleticScore,
        "#10b981",
        "rgba(16, 185, 129, 0.12)",
        "rgba(16, 185, 129, 0.4)"
      );

      // Twin Core Metrics: Tonnage & Density (y = 380, h = 230)
      drawMetricCard(
        ctx,
        80,
        380,
        445,
        230,
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
        380,
        445,
        230,
        labels.powerAndDensity,
        `${power}`,
        `${t.common.kg}/${t.common.min}`,
        "#38bdf8",
        "rgba(56, 189, 248, 0.08)",
        "rgba(56, 189, 248, 0.3)"
      );

      // Time + Rest Info Card (y = 630, h = 85)
      drawRestStrip(ctx, 80, 630, 920, 85, durationStr, labels.restBetweenSets, t.common.time, "#10b981");

      // Exercises Box with ALL exercises & supersets! (y = 735, h = 910)
      drawExercisesSection(
        ctx,
        80,
        735,
        920,
        910,
        workout.supersets,
        language,
        labels.keyWeights,
        t,
        "#10b981",
        "#090d16",
        "rgba(16, 185, 129, 0.25)"
      );

      // Bottom Viral Banner (y = 1665, h = 255)
      drawPromoBanner(ctx, botHandle, labels.joinTelegramBot, "#10b981", qrImg);
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
      const c1 = ctx.createRadialGradient(250, 450, 10, 250, 450, 500);
      c1.addColorStop(0, "rgba(56, 189, 248, 0.22)");
      c1.addColorStop(1, "rgba(56, 189, 248, 0)");
      ctx.fillStyle = c1;
      ctx.fillRect(0, 0, width, height);

      const c2 = ctx.createRadialGradient(850, 900, 10, 850, 900, 500);
      c2.addColorStop(0, "rgba(168, 85, 247, 0.22)");
      c2.addColorStop(1, "rgba(168, 85, 247, 0)");
      ctx.fillStyle = c2;
      ctx.fillRect(0, 0, width, height);

      // Header Block
      drawHeaderBlock(
        ctx,
        labels.bodyRecomp,
        `${labels.workoutNumber}${workout.workoutNumber} • ${labels.microcycle}${workout.microcycle}`,
        `${dateStr} • ${durationStr}`,
        "#38bdf8",
        "rgba(255, 255, 255, 0.08)"
      );

      // Score
      drawScoreBadge(
        ctx,
        80,
        220,
        920,
        140,
        athleticScore.score,
        tierTitle,
        labels.athleticScore,
        "#38bdf8",
        "rgba(56, 189, 248, 0.12)",
        "rgba(56, 189, 248, 0.35)"
      );

      // Recomp Highlights Cards
      const waistInfo = latestMeasurement?.waistCm ? `${latestMeasurement.waistCm} ${t.common.cm}` : `145x ${labels.totalTonnage}`;
      drawMetricCard(
        ctx,
        80,
        380,
        445,
        230,
        labels.weight,
        `${athleteWeight} ${t.common.kg}`,
        `${labels.waist} ${waistInfo}`,
        "#38bdf8",
        "rgba(255, 255, 255, 0.05)",
        "rgba(56, 189, 248, 0.3)"
      );

      drawMetricCard(
        ctx,
        555,
        380,
        445,
        230,
        labels.powerAndDensity,
        `${power}`,
        `${tonnage.toLocaleString()} ${t.common.kg} • ${totalCompletedSets} ${t.common.sets}`,
        "#a855f7",
        "rgba(255, 255, 255, 0.05)",
        "rgba(168, 85, 247, 0.3)"
      );

      // Rest Strip
      drawRestStrip(ctx, 80, 630, 920, 85, durationStr, labels.restBetweenSets, t.common.time, "#38bdf8");

      // Exercises Box
      drawExercisesSection(
        ctx,
        80,
        735,
        920,
        910,
        workout.supersets,
        language,
        labels.setsAndReps,
        t,
        "#38bdf8",
        "rgba(255, 255, 255, 0.04)",
        "rgba(56, 189, 248, 0.25)"
      );

      // Bottom Viral Banner
      drawPromoBanner(ctx, botHandle, labels.joinTelegramBot, "#38bdf8", qrImg);
    }

    // --- TEMPLATE 3: PROGRESS & PR (Brutal Gold / Amber) ---
    else if (selectedTemplate === "progress") {
      ctx.fillStyle = "#0c0d12";
      ctx.fillRect(0, 0, width, height);

      // Geometric accent lines
      ctx.strokeStyle = "rgba(245, 158, 11, 0.25)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(80, 40);
      ctx.lineTo(1000, 40);
      ctx.moveTo(80, 1880);
      ctx.lineTo(1000, 1880);
      ctx.stroke();

      // Header Block
      drawHeaderBlock(
        ctx,
        labels.newPrRecord,
        `${labels.workoutCompleted} • #${workout.workoutNumber}`,
        `${labels.microcycle}${workout.microcycle} • ${t.common.week} ${workout.week} • ${dateStr}`,
        "#f59e0b",
        "#14161f"
      );

      // Athletic Score
      drawScoreBadge(
        ctx,
        80,
        220,
        920,
        140,
        athleticScore.score,
        tierTitle,
        labels.athleticScore,
        "#f59e0b",
        "rgba(245, 158, 11, 0.1)",
        "rgba(245, 158, 11, 0.4)"
      );

      // Progress Cards
      drawMetricCard(
        ctx,
        80,
        380,
        445,
        230,
        labels.progressVsLast,
        `+${tonnageDelta > 0 ? tonnageDelta.toLocaleString() : "850"} ${t.common.kg}`,
        `▲ +${tonnagePercent}% ${labels.newPrRecord}`,
        "#f59e0b",
        "#12141c",
        "rgba(245, 158, 11, 0.3)"
      );

      drawMetricCard(
        ctx,
        555,
        380,
        445,
        230,
        labels.totalTonnage,
        `${tonnage.toLocaleString()}`,
        `${t.common.kg} • ${power} ${t.common.kg}/${t.common.min}`,
        "#ffffff",
        "#12141c",
        "rgba(255, 255, 255, 0.2)"
      );

      // Rest Strip
      drawRestStrip(ctx, 80, 630, 920, 85, durationStr, labels.restBetweenSets, t.common.time, "#f59e0b");

      // Exercises Box
      drawExercisesSection(
        ctx,
        80,
        735,
        920,
        910,
        workout.supersets,
        language,
        labels.keyWeights,
        t,
        "#f59e0b",
        "#12141c",
        "rgba(245, 158, 11, 0.3)"
      );

      // Bottom Viral Banner
      drawPromoBanner(ctx, botHandle, labels.joinTelegramBot, "#f59e0b", qrImg);
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
      const glow = ctx.createRadialGradient(250, 400, 10, 250, 400, 500);
      glow.addColorStop(0, "rgba(244, 63, 94, 0.22)");
      glow.addColorStop(1, "rgba(244, 63, 94, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      // Header Block
      drawHeaderBlock(
        ctx,
        labels.tempoAndBurn,
        `${labels.powerWorkout} • #${workout.workoutNumber}`,
        `${dateStr} • ${durationStr}`,
        "#f43f5e",
        "#180913"
      );

      // Athletic Score
      drawScoreBadge(
        ctx,
        80,
        220,
        920,
        140,
        athleticScore.score,
        tierTitle,
        labels.athleticScore,
        "#f43f5e",
        "rgba(244, 63, 94, 0.12)",
        "rgba(244, 63, 94, 0.4)"
      );

      // Density Twin Cards
      drawMetricCard(
        ctx,
        80,
        380,
        445,
        230,
        labels.powerAndDensity,
        `${power}`,
        `${t.common.kg}/${t.common.min} • 30с відпочинок`,
        "#f43f5e",
        "#140b12",
        "rgba(244, 63, 94, 0.35)"
      );

      drawMetricCard(
        ctx,
        555,
        380,
        445,
        230,
        labels.totalSetsCount,
        `${totalCompletedSets}`,
        `${labels.totalTonnage}: ${tonnage.toLocaleString()} ${t.common.kg}`,
        "#fb7185",
        "#140b12",
        "rgba(251, 113, 133, 0.3)"
      );

      // Rest Strip
      drawRestStrip(ctx, 80, 630, 920, 85, durationStr, labels.restBetweenSets, t.common.time, "#f43f5e");

      // Exercises Box
      drawExercisesSection(
        ctx,
        80,
        735,
        920,
        910,
        workout.supersets,
        language,
        labels.tempoAndBurn,
        t,
        "#f43f5e",
        "#140b12",
        "rgba(244, 63, 94, 0.25)"
      );

      // Bottom Viral Banner
      drawPromoBanner(ctx, botHandle, labels.joinTelegramBot, "#f43f5e", qrImg);
    }

    // --- TEMPLATE 5: MINIMALIST / PHOTO POSTER (Deep Charcoal / Clean Lines) ---
    else if (selectedTemplate === "minimal") {
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, width, height);

      // Giant subtle backdrop watermark score
      ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
      ctx.font = "900 480px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${athleticScore.score}`, 540, 950);
      ctx.textAlign = "left";

      // Header Block
      drawHeaderBlock(
        ctx,
        labels.workoutCompleted,
        `${labels.workoutNumber}${workout.workoutNumber} / ${labels.microcycle}${workout.microcycle}`,
        `${dateStr} • ${durationStr}`,
        "#ffffff",
        "rgba(255, 255, 255, 0.05)"
      );

      // Score
      drawScoreBadge(
        ctx,
        80,
        220,
        920,
        140,
        athleticScore.score,
        tierTitle,
        labels.athleticScore,
        "#ffffff",
        "rgba(255, 255, 255, 0.05)",
        "rgba(255, 255, 255, 0.2)"
      );

      // Clean Stats Twin
      drawMetricCard(
        ctx,
        80,
        380,
        445,
        230,
        labels.totalTonnage,
        `${tonnage.toLocaleString()}`,
        `${t.common.kg} • ${athleticScore.relativeTonnage}x bodyweight`,
        "#ffffff",
        "rgba(255, 255, 255, 0.04)",
        "rgba(255, 255, 255, 0.15)"
      );

      drawMetricCard(
        ctx,
        555,
        380,
        445,
        230,
        labels.powerAndDensity,
        `${power}`,
        `${t.common.kg}/${t.common.min} • ${totalCompletedSets} ${t.common.sets}`,
        "#10b981",
        "rgba(255, 255, 255, 0.04)",
        "rgba(16, 185, 129, 0.25)"
      );

      // Rest Strip
      drawRestStrip(ctx, 80, 630, 920, 85, durationStr, labels.restBetweenSets, t.common.time, "#ffffff");

      // Exercises Box
      drawExercisesSection(
        ctx,
        80,
        735,
        920,
        910,
        workout.supersets,
        language,
        labels.keyWeights,
        t,
        "#10b981",
        "#09090b",
        "rgba(255, 255, 255, 0.15)"
      );

      // Clean minimal invite
      drawPromoBanner(ctx, botHandle, labels.joinTelegramBot, "#ffffff", qrImg);
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
      const g1 = ctx.createRadialGradient(250, 380, 10, 250, 380, 450);
      g1.addColorStop(0, "rgba(168, 85, 247, 0.28)");
      g1.addColorStop(1, "rgba(168, 85, 247, 0)");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, width, height);

      const g2 = ctx.createRadialGradient(850, 750, 10, 850, 750, 500);
      g2.addColorStop(0, "rgba(6, 182, 212, 0.25)");
      g2.addColorStop(1, "rgba(6, 182, 212, 0)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, width, height);

      // Header
      drawHeaderBlock(
        ctx,
        labels.challengeSubtitle,
        labels.challengeTitle,
        `${dateStr} • ${durationStr}`,
        "#06b6d4",
        "#140e2b"
      );

      // Hero Duel Score
      drawScoreBadge(
        ctx,
        80,
        220,
        920,
        140,
        athleticScore.score,
        tierTitle,
        labels.athleticScore,
        "#06b6d4",
        "rgba(168, 85, 247, 0.15)",
        "#a855f7"
      );

      // Duel Targets: Tonnage + Density
      drawMetricCard(
        ctx,
        80,
        380,
        445,
        230,
        labels.totalTonnage,
        `${tonnage.toLocaleString()}`,
        `${t.common.kg} • ${t.scoring.challengeCallout || "Зможеш так?"}`,
        "#06b6d4",
        "rgba(6, 182, 212, 0.08)",
        "rgba(6, 182, 212, 0.35)"
      );

      drawMetricCard(
        ctx,
        555,
        380,
        445,
        230,
        labels.powerAndDensity,
        `${power}`,
        `${t.common.kg}/${t.common.min} • 30с відпочинок`,
        "#c084fc",
        "rgba(168, 85, 247, 0.08)",
        "rgba(168, 85, 247, 0.35)"
      );

      // Rest Strip
      drawRestStrip(ctx, 80, 630, 920, 85, durationStr, labels.restBetweenSets, t.common.time, "#06b6d4");

      // Exercises Box with Challenge Headline
      drawExercisesSection(
        ctx,
        80,
        735,
        920,
        910,
        workout.supersets,
        language,
        labels.challengeTitle,
        t,
        "#06b6d4",
        "#120b22",
        "rgba(6, 182, 212, 0.35)"
      );

      // Bottom Viral Banner
      drawPromoBanner(ctx, botHandle, labels.joinTelegramBot, "#06b6d4", qrImg);
    }

    // --- TEMPLATE 7: PREP STEP (Cyberpunk Cyan & Emerald Rest Stepper) ---
    else if (selectedTemplate === "prep_step") {
      const bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, "#030712");
      bg.addColorStop(0.4, "#081d28");
      bg.addColorStop(1, "#020817");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Cyan glow
      const glow = ctx.createRadialGradient(250, 380, 10, 250, 380, 550);
      glow.addColorStop(0, "rgba(6, 182, 212, 0.25)");
      glow.addColorStop(1, "rgba(6, 182, 212, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      const sessNum = prepData?.prepSessionNumber || workout.workoutNumber || 1;
      const targetRest = prepData?.targetRestSeconds || 60;

      // Header Block
      drawHeaderBlock(
        ctx,
        "🌱 SMT PREP • АДАПТАЦІЯ СЕРЦЯ ТА ЗВ'ЯЗОК",
        `ВВОДНЕ ТРЕНУВАННЯ #${sessNum} ІЗ 6`,
        `${dateStr} • ${durationStr}`,
        "#06b6d4",
        "#0c1b26"
      );

      // Rest Stepper Badge (y = 220, h = 150)
      ctx.fillStyle = "rgba(6, 182, 212, 0.12)";
      ctx.strokeStyle = "#06b6d4";
      ctx.lineWidth = 3;
      roundRect(ctx, 80, 220, 920, 150, 24, true, true);

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 24px system-ui, -apple-system, sans-serif";
      ctx.fillText("ПРОТОКОЛ СКОРОЧЕННЯ ВІДПОЧИНКУ:", 115, 260);

      // 6-step rest pills
      const steps = [90, 75, 60, 45, 30, 30];
      const pillW = 120;
      const pillH = 50;
      const startX = 115;
      const pillY = 285;
      const gap = 20;

      steps.forEach((st, idx) => {
        const px = startX + idx * (pillW + gap);
        const isCurrent = idx + 1 === sessNum;
        const isPast = idx + 1 < sessNum;

        if (isCurrent) {
          ctx.fillStyle = "#06b6d4";
          ctx.strokeStyle = "#38bdf8";
          ctx.lineWidth = 3;
          roundRect(ctx, px, pillY, pillW, pillH, 14, true, true);
          ctx.fillStyle = "#020817";
          ctx.font = "900 24px system-ui, -apple-system, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(`${st}с ⚡`, px + pillW / 2, pillY + 34);
        } else if (isPast) {
          ctx.fillStyle = "rgba(16, 185, 129, 0.2)";
          ctx.strokeStyle = "#10b981";
          ctx.lineWidth = 2;
          roundRect(ctx, px, pillY, pillW, pillH, 14, true, true);
          ctx.fillStyle = "#34d399";
          ctx.font = "bold 20px system-ui, -apple-system, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(`${st}с ✓`, px + pillW / 2, pillY + 33);
        } else {
          ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
          ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
          ctx.lineWidth = 1;
          roundRect(ctx, px, pillY, pillW, pillH, 14, true, true);
          ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
          ctx.font = "600 20px system-ui, -apple-system, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(`${st}с`, px + pillW / 2, pillY + 33);
        }
      });
      ctx.textAlign = "left";

      // Twin Stats (y = 390, h = 220)
      drawMetricCard(
        ctx,
        80,
        390,
        445,
        220,
        "ТОННАЖ СЕСІЇ",
        `${tonnage.toLocaleString()}`,
        t.common.kg,
        "#06b6d4",
        "rgba(6, 182, 212, 0.08)",
        "rgba(6, 182, 212, 0.3)"
      );

      drawMetricCard(
        ctx,
        555,
        390,
        445,
        220,
        "ВІДПОЧИНОК МІЖ СЕТАМИ",
        `${targetRest} СЕК`,
        "ВИТРИМАНО СУВОРО!",
        "#10b981",
        "rgba(16, 185, 129, 0.08)",
        "rgba(16, 185, 129, 0.3)"
      );

      // Exercises Box (y = 630, h = 990)
      ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
      ctx.strokeStyle = "rgba(6, 182, 212, 0.3)";
      ctx.lineWidth = 2;
      roundRect(ctx, 80, 630, 920, 990, 24, true, true);

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
      ctx.fillText("3 БАЗОВІ ВПРАВИ АДАПТАЦІЇ (4 × 10–12):", 120, 690);

      const prepExercises = [
        { name: "Жим штанги або гантелей лежачи", desc: "База грудей, плечей і трицепса", sets: "4 підходи × 10–12 повт" },
        { name: "Підтягування або тяга блоку до грудей", desc: "База спини та біцепса", sets: "4 підходи × 10–12 повт" },
        { name: "Присідання або жим ногами в тренажері", desc: "База ніг, сідниць і кора", sets: "4 підходи × 10–12 повт" },
      ];

      prepExercises.forEach((pex, i) => {
        const ey = 730 + i * 190;
        ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 1;
        roundRect(ctx, 115, ey, 850, 160, 18, true, true);

        // Icon circle
        ctx.fillStyle = "rgba(6, 182, 212, 0.15)";
        ctx.beginPath();
        ctx.arc(175, ey + 80, 42, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#06b6d4";
        ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`${i + 1}`, 175, ey + 91);
        ctx.textAlign = "left";

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
        ctx.fillText(pex.name, 240, ey + 62);

        ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
        ctx.font = "500 22px system-ui, -apple-system, sans-serif";
        ctx.fillText(pex.desc, 240, ey + 102);

        ctx.fillStyle = "#34d399";
        ctx.font = "bold 24px system-ui, -apple-system, sans-serif";
        ctx.fillText(`✓ ${pex.sets}`, 240, ey + 138);
      });

      // Adaptation Rule Alert inside the box
      const alertY = 1330;
      ctx.fillStyle = "rgba(245, 158, 11, 0.1)";
      ctx.strokeStyle = "rgba(245, 158, 11, 0.35)";
      ctx.lineWidth = 2;
      roundRect(ctx, 115, alertY, 850, 160, 18, true, true);

      ctx.fillStyle = "#f59e0b";
      ctx.font = "bold 24px system-ui, -apple-system, sans-serif";
      ctx.fillText("⚠️ ПРАВИЛО АДАПТАЦІЇ ДО СМТ-1:", 145, alertY + 45);

      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.font = "500 22px system-ui, -apple-system, sans-serif";
      ctx.fillText("Не женися за вагою! Збільшуй навантаження тільки якщо", 145, alertY + 85);
      ctx.fillText(`легко витримуєш скорочений відпочинок (${targetRest} секунд).`, 145, alertY + 120);

      // Bottom Viral Banner
      drawPromoBanner(ctx, botHandle, "Готуйся до СМТ-1 разом з нами у Telegram:", "#06b6d4", qrImg);
    }

    // --- TEMPLATE 8: PREP GRADUATION (Gold Certificate of Readiness for SMT-1) ---
    else if (selectedTemplate === "prep_grad") {
      const bg = ctx.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, "#080b12");
      bg.addColorStop(0.5, "#141208");
      bg.addColorStop(1, "#080b12");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Golden ambient radial glow
      const glow = ctx.createRadialGradient(540, 400, 10, 540, 400, 650);
      glow.addColorStop(0, "rgba(245, 158, 11, 0.22)");
      glow.addColorStop(1, "rgba(245, 158, 11, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      // Header Block (Gold / Bronze)
      drawHeaderBlock(
        ctx,
        "🏆 ОФІЦІЙНИЙ СЕРТИФІКАТ ГОТОВНОСТІ",
        "ВИПУСКНИК АДАПТАЦІЇ ДО СМТ-1",
        `Всі 6 тренувань закрито • ${dateStr}`,
        "#f59e0b",
        "#1c180e"
      );

      // Gold Hero Achievement Badge (y = 220, h = 150)
      ctx.fillStyle = "rgba(245, 158, 11, 0.12)";
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 3;
      roundRect(ctx, 80, 220, 920, 150, 24, true, true);

      ctx.fillStyle = "#fbbf24";
      ctx.font = "900 36px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🎓 СЕРЦЕ ТА ЗВ'ЯЗКИ ГОТОВІ ДО 30с ПАУЗ!", 540, 280);

      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.font = "600 24px system-ui, -apple-system, sans-serif";
      ctx.fillText("СТАТУС: ДОПУЩЕНИЙ ДО 12-ТИЖНЕВОГО ЦИКЛУ СМТ-1", 540, 325);
      ctx.textAlign = "left";

      // Twin Status Cards (y = 390, h = 210)
      drawMetricCard(
        ctx,
        80,
        390,
        445,
        210,
        "ОСВОЄНИЙ РИТМ ПАУЗ",
        "30 СЕК",
        "ЕКСТРЕМАЛЬНА ЩІЛЬНІСТЬ",
        "#f59e0b",
        "rgba(245, 158, 11, 0.08)",
        "rgba(245, 158, 11, 0.35)"
      );

      drawMetricCard(
        ctx,
        555,
        390,
        445,
        210,
        "АДАПТАЦІЙНИХ СЕСІЙ",
        "6 / 6",
        "100% ВИКОНАННЯ ЦИКЛУ",
        "#10b981",
        "rgba(16, 185, 129, 0.08)",
        "rgba(16, 185, 129, 0.35)"
      );

      // Calculated SMT-1 Starting Loads Grid (y = 620, h = 1000)
      ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
      ctx.strokeStyle = "rgba(245, 158, 11, 0.35)";
      ctx.lineWidth = 2;
      roundRect(ctx, 80, 620, 920, 1000, 24, true, true);

      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
      ctx.fillText("ІНДИВІДУАЛЬНІ СТАРТОВІ ВАГИ НА 36 ТРЕНУВАНЬ:", 120, 680);

      const weights = prepData?.suggestedWeights || {
        bench: 55,
        closeGrip: 50,
        pull: 50,
        biceps: 25,
        squat: 65,
        ohp: 30,
      };

      const exercisesGrid = [
        { name: "Жим лежачи", weight: weights.bench, tag: "Блок 1 (40% 1RM)" },
        { name: "Жим вузьким хватом", weight: weights.closeGrip, tag: "Блок 2 (40% 1RM)" },
        { name: "Підтягування / тяга", weight: weights.pull, tag: "СС-1 (40% 1RM)" },
        { name: "Штанга на біцепс", weight: weights.biceps, tag: "СС-1 (30% 1RM)" },
        { name: "Присідання / ногами", weight: weights.squat, tag: "СС-2 (40% 1RM)" },
        { name: "Армійський жим", weight: weights.ohp, tag: "СС-2 (30% 1RM)" },
      ];

      exercisesGrid.forEach((item, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const gx = 120 + col * 435;
        const gy = 720 + row * 200;

        ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
        ctx.lineWidth = 1;
        roundRect(ctx, gx, gy, 410, 175, 18, true, true);

        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.font = "bold 20px system-ui, -apple-system, sans-serif";
        ctx.fillText(item.tag, gx + 25, gy + 45);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
        ctx.fillText(item.name, gx + 25, gy + 88);

        ctx.fillStyle = "#f59e0b";
        ctx.font = "900 48px system-ui, -apple-system, sans-serif";
        ctx.fillText(`${item.weight}`, gx + 25, gy + 148);

        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.font = "bold 24px system-ui, -apple-system, sans-serif";
        ctx.fillText("кг", gx + 25 + ctx.measureText(`${item.weight}`).width + 10, gy + 148);
      });

      // Bottom Motivational Callout
      ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
      ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
      ctx.lineWidth = 2;
      roundRect(ctx, 120, 1340, 840, 120, 18, true, true);

      ctx.fillStyle = "#34d399";
      ctx.font = "900 26px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🚀 СТАРТУЮ 12-ТИЖНЕВИЙ ЦИКЛ СМТ-1!", 540, 1385);

      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.font = "500 20px system-ui, -apple-system, sans-serif";
      ctx.fillText("Приєднуйся до силового челенджу у Telegram:", 540, 1425);
      ctx.textAlign = "left";

      // Bottom Promo Banner
      drawPromoBanner(ctx, botHandle, "Забирай СМТ-трекер у Telegram:", "#f59e0b", qrImg);
    }
  };

  useEffect(() => {
    if (open) {
      void renderCanvas();
    }
  }, [open, selectedTemplate, workout, language, athleticScore.score, prepData]);

  const [isSharing, setIsSharing] = useState(false);
  const [telegramSentStatus, setTelegramSentStatus] = useState<"success" | "saved" | null>(null);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas || isSharing) return;

    setIsSharing(true);
    setTelegramSentStatus(null);
    triggerHaptic("selection");

    try {
      const dataUrl = canvas.toDataURL("image/png");
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png", 0.95)
      );

      if (!blob) {
        throw new Error("Canvas export failed");
      }

      const filenamePrefix = prepData
        ? `smt_prep_s${prepData.prepSessionNumber}`
        : `smt_story_w${workout.workoutNumber}`;
      const filename = `${filenamePrefix}_${selectedTemplate}_${language}.png`;
      const file = new File([blob], filename, { type: "image/png" });

      const tg = typeof window !== "undefined" ? (window as any).Telegram?.WebApp : null;
      const tgUserId = tg?.initDataUnsafe?.user?.id || (useSettingsStore.getState().linkedTelegramUser?.id);

      let sharedViaNative = false;

      // 1. Try native Web Share API (if supported by OS/browser)
      if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: "SMT-1 Story",
            text: `Тренування #${workout.workoutNumber} СМТ-1 (Високощільний тренінг) завершено! 🔥`,
          });
          sharedViaNative = true;
          triggerHaptic("success");
        } catch (e: any) {
          if (e?.name === "AbortError") {
            setIsSharing(false);
            return;
          }
          console.warn("navigator.share({ files }) failed, will fallback to Telegram bot:", e);
        }
      }

      // 2. If inside Telegram WebApp or native share not available: deliver directly to athlete's chat with bot!
      if (!sharedViaNative && tgUserId) {
        try {
          const res = await fetch("/api/story/share", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chatId: tgUserId,
              photoBase64: dataUrl,
              workoutNumber: workout.workoutNumber,
              template: selectedTemplate,
            }),
          });
          const result = await res.json();
          if (result.ok) {
            triggerHaptic("success");
            setTelegramSentStatus("success");
            setIsSharing(false);
            return;
          }
        } catch (err) {
          console.error("Failed to send story to Telegram chat:", err);
        }
      }

      // 3. Fallback: Open preview modal so user can long-press to save to gallery
      if (!sharedViaNative) {
        setPreviewUrl(dataUrl);
        setShowFullPreview(true);
        handleDownload();
      }
    } catch (err: any) {
      console.error("Story share general error:", err);
      handleDownload();
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsGenerating(true);
    triggerHaptic("selection");

    try {
      const dataUrl = canvas.toDataURL("image/png");
      setPreviewUrl(dataUrl);

      const tg = typeof window !== "undefined" ? (window as any).Telegram?.WebApp : null;
      const tgUserId = tg?.initDataUnsafe?.user?.id || (useSettingsStore.getState().linkedTelegramUser?.id);

      // Also send to Telegram chat in background so athlete always has permanent copy
      if (tgUserId) {
        fetch("/api/story/share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatId: tgUserId,
            photoBase64: dataUrl,
            workoutNumber: workout.workoutNumber,
            template: selectedTemplate,
          }),
        })
          .then((r) => r.json())
          .then((d) => {
            if (d.ok) setTelegramSentStatus("saved");
          })
          .catch(() => {});
      }

      // Trigger standard browser download
      const filenamePrefix = prepData
        ? `smt_prep_s${prepData.prepSessionNumber}`
        : `smt_story_w${workout.workoutNumber}`;
      const link = document.createElement("a");
      link.download = `${filenamePrefix}_${selectedTemplate}_${language}.png`;
      link.href = dataUrl;
      link.click();

      // Show preview lightbox with long-press instruction on mobile
      setShowFullPreview(true);
      triggerHaptic("success");
    } catch (err) {
      console.error("Story download error", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const prepOptions: { id: StoryTemplateType; name: string; desc: string; icon: React.ReactNode }[] = prepData
    ? [
        {
          id: "prep_step",
          name: t.story.templates.prep_step?.name || `Адаптація #${prepData.prepSessionNumber}`,
          desc: t.story.templates.prep_step?.desc || `Пауза ${prepData.targetRestSeconds}с`,
          icon: <Flame className="h-4 w-4 text-cyan-400" />,
        },
        {
          id: "prep_grad",
          name: t.story.templates.prep_grad?.name || "Випускний СМТ-1",
          desc: t.story.templates.prep_grad?.desc || "Сертифікат готовності",
          icon: <Trophy className="h-4 w-4 text-amber-400" />,
        },
      ]
    : [];

  const templateOptions: { id: StoryTemplateType; name: string; desc: string; icon: React.ReactNode }[] = [
    ...prepOptions,
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogHeader className="shrink-0 mb-2">
          <DialogTitle onClose={() => onOpenChange(false)}>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-pink-400" />
              <span>{t.story.modalTitle}</span>
            </div>
          </DialogTitle>
          <DialogDescription>{t.story.modalDesc}</DialogDescription>
        </DialogHeader>

        {/* Scrollable Modal Body: Uses flex-1 min-h-0 so footer NEVER overflows screen */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-3 pr-1 py-0.5">
          {/* Telegram Share Success Banner */}
          {telegramSentStatus === "success" && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/70 p-3 shadow-lg flex flex-col gap-1.5 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs sm:text-sm">
                <Check className="h-4 w-4 shrink-0 text-emerald-300" />
                <span>{language === "uk" ? "Історію надіслано в чат з ботом!" : "История отправлена в чат с ботом!"}</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-tight">
                {language === "uk"
                  ? `Картинку 1080×1920 доставлено в особистий чат з ${botHandle}. Відкрийте чат, щоб зберегти у галерею або додати в Stories.`
                  : `Картинка 1080×1920 доставлена в личный чат с ${botHandle}. Откройте чат, чтобы сохранить в галерею или добавить в Stories.`}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/20 font-semibold"
                  onClick={() => {
                    const bot = botHandle.replace("@", "");
                    const tg = (window as any).Telegram?.WebApp;
                    if (tg?.openTelegramLink) {
                      tg.openTelegramLink(`https://t.me/${bot}`);
                    } else {
                      window.open(`https://t.me/${bot}`, "_blank");
                    }
                  }}
                >
                  <span>{language === "uk" ? "Відкрити чат з ботом ↗" : "Открыть чат с ботом ↗"}</span>
                </Button>
              </div>
            </div>
          )}

          {/* 6 Specialized Templates Selector Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {templateOptions.map((tmpl) => {
              const isSelected = selectedTemplate === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => {
                    setSelectedTemplate(tmpl.id);
                    setTelegramSentStatus(null);
                  }}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "bg-emerald-500/15 border-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                      : "bg-slate-900 border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      {tmpl.icon}
                      <span className="text-[11px] font-bold block">{tmpl.name}</span>
                    </div>
                    {isSelected && <Check className="h-3 w-3 text-emerald-400" />}
                  </div>
                  <span className="text-[9px] text-slate-400 block leading-tight">{tmpl.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Live Canvas Preview */}
          <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-950 border border-white/10">
            <div
              onClick={() => {
                const c = canvasRef.current;
                if (c) {
                  setPreviewUrl(c.toDataURL("image/png"));
                  setShowFullPreview(true);
                }
              }}
              className="w-[150px] h-[267px] sm:w-[200px] sm:h-[355px] cursor-pointer overflow-hidden rounded-xl shadow-2xl border border-white/20 relative group transition-transform active:scale-98"
              title={language === "uk" ? "Натисніть для перегляду" : "Нажмите для просмотра"}
            >
              <canvas ref={canvasRef} className="w-full h-full object-contain pointer-events-none" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-semibold">
                🔍 {language === "uk" ? "Перегляд" : "Просмотр"}
              </div>
            </div>
            <span className="text-[10px] text-slate-400 mt-1.5">{t.story.exportResolution}</span>
          </div>
        </div>

        {/* Compact Ergonomic Footer: 3 Tiers, Always Visible */}
        <div className="pt-2 border-t border-white/10 flex flex-col gap-1.5 shrink-0">
          {/* Row 1: Primary Action (Share to Stories) */}
          <Button
            variant="accent"
            size="default"
            className="w-full h-11 font-bold text-xs sm:text-sm bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white hover:opacity-95 flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 active:scale-[0.99] transition-transform"
            onClick={handleShare}
            disabled={isSharing || isGenerating}
          >
            <Share2 className="h-4 w-4 shrink-0" />
            <span>
              {isSharing
                ? (language === "uk" ? "Відправка в Stories..." : "Отправка в Stories...")
                : (language === "uk" ? "Поділитися в Instagram / Stories" : language === "en" ? "Share to Instagram / Stories" : "Поделиться в Instagram / Stories")}
            </span>
          </Button>

          {/* Row 2: Secondary Actions in 2-Column Grid */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 border-white/10 text-slate-200 hover:text-white hover:bg-white/5 text-xs font-semibold flex items-center justify-center gap-1.5"
              onClick={handleDownload}
              disabled={isGenerating || isSharing}
            >
              <Download className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
              <span className="truncate">
                {isGenerating ? t.story.generating : (language === "uk" ? "Зберегти PNG" : language === "en" ? "Save PNG" : "Сохранить PNG")}
              </span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={isPublishingChallenge || publishedChallenge}
              className={`h-9 font-semibold text-xs transition-all flex items-center justify-center gap-1 ${
                publishedChallenge
                  ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
                  : "border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
              }`}
              onClick={handlePublishChallenge}
            >
              <Flame className="h-3.5 w-3.5 shrink-0 text-amber-400" />
              <span className="truncate">
                {publishedChallenge
                  ? (language === "uk" ? "В Челенджі ✓" : "В Челлендже ✓")
                  : isPublishingChallenge
                  ? (language === "uk" ? "Публікація..." : "Публикация...")
                  : (language === "uk" ? "В Челендж" : language === "en" ? "To Challenge" : "В Челлендж")}
              </span>
            </Button>
          </div>

          {/* Row 3: Close Button */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5"
            onClick={() => onOpenChange(false)}
          >
            {t.story.closeButton}
          </Button>
        </div>
      </Dialog>

      {/* Full-Screen Lightbox Preview for Mobile (Allows native long-press save) */}
      {showFullPreview && previewUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-3 animate-in fade-in"
          onClick={() => setShowFullPreview(false)}
        >
          <div className="w-full flex items-center justify-between text-white shrink-0 pt-2 pb-1 max-w-sm">
            <span className="text-xs font-semibold text-slate-300">
              {language === "uk" ? "Повний розмір 1080×1920" : "Полный размер 1080×1920"}
            </span>
            <button
              onClick={() => setShowFullPreview(false)}
              className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 min-h-0 flex items-center justify-center py-2 max-w-full">
            <img
              src={previewUrl}
              alt="Story Preview"
              className="max-h-full max-w-full object-contain rounded-xl shadow-2xl border border-white/20 select-none"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div
            className="w-full max-w-sm bg-slate-900/90 border border-white/10 rounded-xl p-2.5 text-center shrink-0 mb-2"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs text-amber-300 font-medium">
              {language === "uk"
                ? "💡 Затисніть картинку пальцем, щоб зберегти у фотогалерею"
                : "💡 Зажмите картинку пальцем, чтобы сохранить в фотогалерею"}
            </p>
          </div>
        </div>
      )}
    </>
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
  const x = 80;
  const y = 60;
  const w = 920;
  const h = 140;

  // Background card
  ctx.fillStyle = bgColor;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 24, true, true);

  // Left Tag Pill (measures text dynamically so it NEVER overflows or touches meta)
  ctx.font = "bold 22px system-ui, -apple-system, sans-serif";
  const badgeWidth = ctx.measureText(badgeText).width + 32;
  ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2;
  roundRect(ctx, x + 30, y + 22, badgeWidth, 38, 12, true, true);

  ctx.fillStyle = accentColor;
  ctx.fillText(badgeText, x + 46, y + 49);

  // Main Workout Title (bottom row of card)
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 36px system-ui, -apple-system, sans-serif";
  ctx.fillText(title, x + 30, y + 112);

  // Right-aligned Meta (Week + Date)
  ctx.textAlign = "right";
  ctx.fillStyle = "#94a3b8";
  ctx.font = "bold 26px system-ui, -apple-system, sans-serif";
  ctx.fillText(meta, x + w - 30, y + 85);
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

  // Left: ⚡ Score with dynamic pixel offset for "/ 100" (NO OVERLAP)
  ctx.font = "900 84px system-ui, -apple-system, sans-serif";
  const iconStr = "⚡ ";
  const iconW = ctx.measureText(iconStr).width;
  const scoreStr = `${score}`;
  const scoreW = ctx.measureText(scoreStr).width;

  ctx.fillStyle = accentColor;
  ctx.fillText(iconStr, x + 35, y + 98);
  ctx.fillText(scoreStr, x + 35 + iconW, y + 98);

  ctx.fillStyle = "#64748b";
  ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
  ctx.fillText("/ 100", x + 35 + iconW + scoreW + 14, y + 92);

  // Right side: Label & Tier Title right-aligned cleanly
  ctx.textAlign = "right";
  ctx.fillStyle = "#94a3b8";
  ctx.font = "bold 22px system-ui, -apple-system, sans-serif";
  ctx.fillText(label.toUpperCase(), x + w - 35, y + 54);

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 36px system-ui, -apple-system, sans-serif";
  ctx.fillText(tier.toUpperCase(), x + w - 35, y + 102);
  ctx.textAlign = "left";
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
  ctx.font = "bold 22px system-ui, -apple-system, sans-serif";
  ctx.fillText(title, x + 30, y + 50);

  ctx.fillStyle = valColor;
  ctx.font = "900 68px system-ui, -apple-system, sans-serif";
  ctx.fillText(value, x + 30, y + 135);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "600 24px system-ui, -apple-system, sans-serif";
  ctx.fillText(unit, x + 30, y + 185);
}

function drawRestStrip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  durationStr: string,
  restLabel: string,
  timeLabel: string,
  accentColor: string
) {
  ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 20, true, true);

  ctx.fillStyle = "#cbd5e1";
  ctx.font = "600 26px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    `⏱  ${timeLabel}: ${durationStr}    •    ⚡  ${restLabel}    •    🔥  СМТ-1 (High-Density)`,
    x + w / 2,
    y + 54
  );
  ctx.textAlign = "left";
}

function drawExercisesSection(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  supersets: any[],
  language: AppLanguage,
  sectionTitle: string,
  t: { common: { kg: string; reps: string; sets: string } },
  accentColor: string,
  bgColor: string,
  borderColor: string
) {
  // Container Box
  ctx.fillStyle = bgColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 3;
  roundRect(ctx, x, y, w, h, 28, true, true);

  // Section Header
  ctx.fillStyle = accentColor;
  ctx.font = "bold 30px system-ui, -apple-system, sans-serif";
  ctx.fillText(`📋  ${sectionTitle}`, x + 35, y + 52);

  const totalExCount = supersets.reduce((acc, s) => acc + (s.exercises?.length || 0), 0);
  ctx.textAlign = "right";
  ctx.fillStyle = "#94a3b8";
  ctx.font = "600 22px system-ui, -apple-system, sans-serif";
  ctx.fillText(`${totalExCount} вправ • ${supersets.length} суперсети`, x + w - 35, y + 52);
  ctx.textAlign = "left";

  // Separator Line
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 35, y + 74);
  ctx.lineTo(x + w - 35, y + 74);
  ctx.stroke();

  // Supersets loop (shows ALL exercises from ALL supersets!)
  const availableH = h - 90;
  const numSS = Math.max(1, supersets.length);
  const blockH = availableH / numSS;

  supersets.forEach((ss, ssIdx) => {
    const ssY = y + 84 + ssIdx * blockH;

    // Superset Header
    ctx.fillStyle = accentColor;
    ctx.font = "bold 22px system-ui, -apple-system, sans-serif";
    ctx.fillText(`СУПЕРСЕТ ${ssIdx + 1}`, x + 35, ssY + 28);

    ctx.fillStyle = "#64748b";
    ctx.font = "500 20px system-ui, -apple-system, sans-serif";
    ctx.fillText(`• відпочинок 30с`, x + 185, ssY + 28);

    // Exercises inside this superset
    ss.exercises.forEach((ex: any, exIdx: number) => {
      const exY = ssY + 62 + exIdx * 42;
      const weight = ex.sets[0]?.actualWeight ?? ex.sets[0]?.targetWeight ?? 0;
      const reps = ex.sets[0]?.actualReps ?? ex.sets[0]?.targetReps ?? 10;
      const completedSets = ex.sets.filter((s: any) => s.completed).length || ex.sets.length;
      const exName = getLocalizedExerciseName(ex.exerciseId || ex.name, language, false);

      // Exercise name (left)
      ctx.fillStyle = "#f8fafc";
      ctx.font = "600 26px system-ui, -apple-system, sans-serif";
      const maxNameWidth = 470;
      let displayName = exName;
      if (ctx.measureText(displayName).width > maxNameWidth) {
        while (displayName.length > 5 && ctx.measureText(displayName + "…").width > maxNameWidth) {
          displayName = displayName.slice(0, -1);
        }
        displayName += "…";
      }
      ctx.fillText(`• ${displayName}`, x + 40, exY);

      // Weight & Reps (right side, aligned right)
      ctx.textAlign = "right";
      ctx.fillStyle = accentColor;
      ctx.font = "900 26px system-ui, -apple-system, sans-serif";
      const valStr = `${weight} ${t.common.kg} × ${reps}`;
      ctx.fillText(valStr, x + w - 160, exY);

      // Completed sets
      ctx.fillStyle = "#94a3b8";
      ctx.font = "600 22px system-ui, -apple-system, sans-serif";
      ctx.fillText(`(${completedSets} ${t.common.sets})`, x + w - 35, exY);
      ctx.textAlign = "left";
    });

    // Divider between supersets (except last)
    if (ssIdx < supersets.length - 1) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 35, ssY + blockH - 6);
      ctx.lineTo(x + w - 35, ssY + blockH - 6);
      ctx.stroke();
    }
  });
}

function drawPromoBanner(
  ctx: CanvasRenderingContext2D,
  botUsername: string,
  inviteText: string,
  accentColor: string,
  qrImg: HTMLImageElement | null = null
) {
  const x = 80;
  const y = 1645;
  const w = 920;
  const h = 240;
  // qrSize + labelHeight(18) + labelGap(14) + top/bot padding(20*2) must fit in h=240
  // 172 + 18 + 14 + 40 = 244 → shift qrY up 2px → fine
  const qrSize = 172;
  const labelH = 18;  // font-size approx cap height
  const labelGap = 12;
  const qrPad = 22;

  // Banner background
  ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 3;
  roundRect(ctx, x, y, w, h, 28, true, true);

  // Accent top border stripe
  const stripe = ctx.createLinearGradient(x, y, x + w, y);
  stripe.addColorStop(0, "rgba(255,255,255,0)");
  stripe.addColorStop(0.5, accentColor);
  stripe.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = stripe;
  roundRect(ctx, x + 2, y + 2, w - 4, 4, 2, true, false);

  if (qrImg) {
    // --- Layout with QR: [QR left] [text right] ---
    const qrX = x + qrPad;
    // Center QR+label block vertically inside banner
    const blockH = qrSize + labelGap + labelH;
    const qrY = y + Math.floor((h - blockH) / 2);

    // QR background pill
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 2;
    roundRect(ctx, qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 18, true, true);

    // Draw QR image
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

    // Small "Scan" label under QR — positioned exactly inside banner
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = "bold 18px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("▼ SCAN ME", qrX + qrSize / 2, qrY + qrSize + labelGap + labelH);

    // Right side text (takes remaining width)
    const textX = qrX + qrSize + qrPad + 24;
    const textW = x + w - textX - 30;
    const textCX = textX + textW / 2;

    // Telegram icon-like pill
    ctx.fillStyle = "rgba(6, 182, 212, 0.12)";
    ctx.strokeStyle = "rgba(6, 182, 212, 0.35)";
    ctx.lineWidth = 2;
    roundRect(ctx, textX, y + 30, textW, 42, 14, true, true);
    ctx.fillStyle = "rgba(6,182,212,0.9)";
    ctx.font = "bold 22px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("✈ TELEGRAM", textCX, y + 58);

    // Invite text
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "600 24px system-ui, -apple-system, sans-serif";
    // Word-wrap if needed
    const words = inviteText.split(" ");
    let line = "";
    let lineY = y + 112;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > textW) {
        ctx.fillText(line, textCX, lineY);
        line = word;
        lineY += 32;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, textCX, lineY);

    // @handle
    ctx.fillStyle = accentColor;
    ctx.font = "900 38px system-ui, -apple-system, sans-serif";
    const cleanBot = botUsername.startsWith("@") ? botUsername : `@${botUsername}`;
    ctx.fillText(cleanBot, textCX, y + h - 30);
    ctx.textAlign = "left";
  } else {
    // --- Fallback: text-only layout ---
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 26px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(inviteText, x + w / 2, y + 80);

    ctx.fillStyle = accentColor;
    ctx.font = "900 42px system-ui, -apple-system, sans-serif";
    const cleanBot = botUsername.startsWith("@") ? botUsername : `@${botUsername}`;
    ctx.fillText(cleanBot, x + w / 2, y + 150);
    ctx.textAlign = "left";
  }
}
