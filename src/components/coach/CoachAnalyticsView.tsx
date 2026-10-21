"use client";

import React, { useState, useMemo } from "react";
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Dumbbell,
  Zap,
  Activity,
  Calendar,
  Filter,
  ArrowUpDown,
  Search,
  ExternalLink,
  ChevronRight,
  Flame,
  AlertTriangle,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  BarChart3,
  LineChart as LineChartIcon,
  Layers,
  ArrowUpRight,
  MessageCircle,
  FileText,
  SlidersHorizontal,
  ChevronDown,
  Edit3,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { useCoachStore, TraineeProfile, TraineeWorkoutRecord } from "@/lib/store/useCoachStore";
import { useTranslation } from "@/lib/i18n";
import { EditTraineeModal } from "./EditTraineeModal";

interface CoachAnalyticsViewProps {
  onOpenDetail: (trainee: TraineeProfile) => void;
}

type TimeRange = "all" | "30d" | "7d";
type MetricType = "tonnage" | "score" | "power";
type ChartView = "comparison" | "timeline";
type SortField = "score" | "tonnage" | "power" | "date" | "workouts" | "microcycle";

export function CoachAnalyticsView({ onOpenDetail }: CoachAnalyticsViewProps) {
  const { trainees } = useCoachStore();
  const { language } = useTranslation();

  // Filters & State
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [metric, setMetric] = useState<MetricType>("tonnage");
  const [chartView, setChartView] = useState<ChartView>("comparison");
  const [microcycleFilter, setMicrocycleFilter] = useState<number>(0); // 0 = all
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("score");
  const [sortAsc, setSortAsc] = useState(false);

  // Selected trainee for deep dive
  const [selectedTraineeId, setSelectedTraineeId] = useState<string | null>(
    trainees.length > 0 ? trainees[0].id : null
  );

  // Trainee edit modal state
  const [traineeToEdit, setTraineeToEdit] = useState<TraineeProfile | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleOpenEdit = (t: TraineeProfile) => {
    setTraineeToEdit(t);
    setIsEditModalOpen(true);
  };

  // Time cutoffs
  const now = useMemo(() => Date.now(), []);
  const timeCutoffMs = useMemo(() => {
    if (timeRange === "7d") return now - 7 * 86400 * 1000;
    if (timeRange === "30d") return now - 30 * 86400 * 1000;
    return 0; // all time
  }, [timeRange, now]);

  // Filtered workouts helper
  const getFilteredWorkouts = (workoutHistory: TraineeWorkoutRecord[]) => {
    if (timeCutoffMs === 0) return workoutHistory;
    return workoutHistory.filter((w) => new Date(w.date).getTime() >= timeCutoffMs);
  };

  // Trainee stats enriched
  const enrichedTrainees = useMemo(() => {
    return trainees
      .filter((t) => t.status !== "blocked")
      .map((t) => {
        const periodWorkouts = getFilteredWorkouts(t.workoutHistory);
        const periodTonnage = periodWorkouts.reduce((sum, w) => sum + (w.tonnageKg || 0), 0);
        const totalTonnage = t.workoutHistory.reduce((sum, w) => sum + (w.tonnageKg || 0), 0);

        const avgPower =
          periodWorkouts.length > 0
            ? Math.round(
                periodWorkouts.reduce((sum, w) => sum + (w.powerKgPerMin || 0), 0) /
                  periodWorkouts.length
              )
            : t.workoutHistory.length > 0
            ? Math.round(
                t.workoutHistory.reduce((sum, w) => sum + (w.powerKgPerMin || 0), 0) /
                  t.workoutHistory.length
              )
            : 0;

        return {
          ...t,
          periodTonnage,
          totalTonnage,
          avgPower,
          periodWorkoutsCount: periodWorkouts.length,
          shortName: t.alias || (t.name.split(" ")[0] + (t.name.split(" ")[1] ? ` ${t.name.split(" ")[1][0]}.` : "")),
        };
      });
  }, [trainees, timeCutoffMs]);

  // Overall Team High-Level Aggregates
  const teamStats = useMemo(() => {
    const activeList = enrichedTrainees.filter((t) => t.status !== "new_lead");
    const totalTeamTonnage = enrichedTrainees.reduce((acc, t) => acc + t.periodTonnage, 0);
    const avgScore =
      activeList.length > 0
        ? Math.round(activeList.reduce((acc, t) => acc + (t.athleticScore || 0), 0) / activeList.length)
        : 0;
    const avgPower =
      activeList.length > 0
        ? Math.round(activeList.reduce((acc, t) => acc + (t.avgPower || 0), 0) / activeList.length)
        : 0;

    const totalWorkoutsLogged = enrichedTrainees.reduce(
      (acc, t) => acc + t.periodWorkoutsCount,
      0
    );

    // Microcycle distribution
    const mcCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    enrichedTrainees.forEach((t) => {
      const mc = (t.currentMicrocycle as 1 | 2 | 3 | 4) || 1;
      if (mcCounts[mc] !== undefined) mcCounts[mc]++;
    });

    // Needs attention list (idle > 72h or status === "needs_attention")
    const attentionList = enrichedTrainees.filter(
      (t) =>
        t.status === "needs_attention" ||
        (now - new Date(t.lastWorkoutDate).getTime() > 72 * 3600 * 1000 && t.status === "active")
    );

    return {
      totalTeamTonnage,
      avgScore,
      avgPower,
      totalWorkoutsLogged,
      mcCounts,
      attentionList,
      totalAthletes: enrichedTrainees.length,
    };
  }, [enrichedTrainees, now]);

  // Filtered & Sorted Trainees for Table and Comparison Chart
  const displayedTrainees = useMemo(() => {
    return enrichedTrainees
      .filter((t) => {
        // Search query
        const q = searchQuery.toLowerCase().trim();
        if (
          q &&
          !t.name.toLowerCase().includes(q) &&
          !(t.alias && t.alias.toLowerCase().includes(q)) &&
          !t.username.toLowerCase().includes(q)
        ) {
          return false;
        }
        // Microcycle filter
        if (microcycleFilter !== 0 && t.currentMicrocycle !== microcycleFilter) {
          return false;
        }
        // Status filter
        if (statusFilter !== "all" && t.status !== statusFilter) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        let valA = 0;
        let valB = 0;

        switch (sortField) {
          case "score":
            valA = a.athleticScore || 0;
            valB = b.athleticScore || 0;
            break;
          case "tonnage":
            valA = a.periodTonnage || a.totalTonnage || 0;
            valB = b.periodTonnage || b.totalTonnage || 0;
            break;
          case "power":
            valA = a.avgPower || 0;
            valB = b.avgPower || 0;
            break;
          case "microcycle":
            valA = a.currentMicrocycle || 1;
            valB = b.currentMicrocycle || 1;
            break;
          case "workouts":
            valA = a.totalWorkouts || 0;
            valB = b.totalWorkouts || 0;
            break;
          case "date":
            valA = new Date(a.lastWorkoutDate).getTime();
            valB = new Date(b.lastWorkoutDate).getTime();
            break;
        }

        return sortAsc ? valA - valB : valB - valA;
      });
  }, [enrichedTrainees, searchQuery, microcycleFilter, statusFilter, sortField, sortAsc]);

  // Selected Trainee for deep-dive
  const activeSelectedTrainee = useMemo(() => {
    return enrichedTrainees.find((t) => t.id === selectedTraineeId) || enrichedTrainees[0] || null;
  }, [enrichedTrainees, selectedTraineeId]);

  // Timeline cumulative data for team area chart
  const timelineData = useMemo(() => {
    const dateMap: Record<string, { dateStr: string; label: string; tonnage: number; count: number }> = {};

    enrichedTrainees.forEach((t) => {
      const workouts = getFilteredWorkouts(t.workoutHistory);
      workouts.forEach((w) => {
        const d = new Date(w.date);
        const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d
          .getDate()
          .toString()
          .padStart(2, "0")}`;
        const label = `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1)
          .toString()
          .padStart(2, "0")}`;

        if (!dateMap[key]) {
          dateMap[key] = { dateStr: key, label, tonnage: 0, count: 0 };
        }
        dateMap[key].tonnage += w.tonnageKg || 0;
        dateMap[key].count += 1;
      });
    });

    const sortedKeys = Object.keys(dateMap).sort();
    return sortedKeys.map((key) => dateMap[key]);
  }, [enrichedTrainees, timeCutoffMs]);

  // Comparison Bar Chart Data
  const comparisonData = useMemo(() => {
    return displayedTrainees
      .filter((t) => t.status !== "new_lead")
      .map((t) => {
        let value = 0;
        if (metric === "tonnage") {
          value = Math.round(t.periodTonnage || t.totalTonnage);
        } else if (metric === "score") {
          value = t.athleticScore;
        } else if (metric === "power") {
          value = t.avgPower;
        }
        return {
          id: t.id,
          name: t.shortName,
          fullName: t.alias ? `${t.alias} (${t.name})` : t.name,
          username: t.username,
          tierLabel: t.tierLabel,
          tierKey: t.tierKey,
          microcycle: t.currentMicrocycle,
          value,
          metricLabel:
            metric === "tonnage"
              ? `${value.toLocaleString("uk-UA")} кг`
              : metric === "score"
              ? `${value} балів`
              : `${value} кг/хв`,
        };
      });
  }, [displayedTrainees, metric]);

  // Selected Trainee workout history curve for deep dive
  const selectedTraineeCurve = useMemo(() => {
    if (!activeSelectedTrainee || !activeSelectedTrainee.workoutHistory) return [];
    return [...activeSelectedTrainee.workoutHistory]
      .sort((a, b) => a.workoutNumber - b.workoutNumber)
      .map((w) => ({
        workout: `#${w.workoutNumber}`,
        tonnage: w.tonnageKg,
        power: w.powerKgPerMin,
        score: w.athleticScore,
        date: new Date(w.date).toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit" }),
      }));
  }, [activeSelectedTrainee]);

  // Top 3 Podium Athletes
  const topAthletes = useMemo(() => {
    return [...enrichedTrainees]
      .filter((t) => t.status !== "new_lead")
      .sort((a, b) => (b.athleticScore || 0) - (a.athleticScore || 0))
      .slice(0, 3);
  }, [enrichedTrainees]);

  // Format smart relative date
  const formatSmartDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    const diffMs = now - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 3600));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Щойно";
    if (diffHours < 24 && date.getDate() === new Date(now).getDate()) {
      return `Сьогодні, ${date.getHours().toString().padStart(2, "0")}:${date
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
    }
    if (diffDays === 1) return "Вчора";
    if (diffDays < 7) return `${diffDays} дн. тому`;
    return `${date.getDate().toString().padStart(2, "0")}.${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}`;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const getMetricColor = (metricType: MetricType) => {
    switch (metricType) {
      case "tonnage":
        return "#10b981"; // emerald
      case "score":
        return "#f59e0b"; // amber
      case "power":
        return "#06b6d4"; // cyan
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-12">
      {/* 1. TOP CONTROL BAR: Period, Metric & Chart Switcher */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-950 to-slate-900/90 p-4 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Section Title & Subtitle */}
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <BarChart3 className="h-4 w-4" />
              </span>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                Аналітика прогресу команди
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Порівняльний моніторинг об&apos;єму, силової потужності та воронки мікроциклів
            </p>
          </div>

          {/* Right: Controls & Toggles */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Time Period Selector */}
            <div className="flex p-1 rounded-xl bg-white/5 border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setTimeRange("all")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  timeRange === "all"
                    ? "bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Все
              </button>
              <button
                type="button"
                onClick={() => setTimeRange("30d")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  timeRange === "30d"
                    ? "bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                30 днів
              </button>
              <button
                type="button"
                onClick={() => setTimeRange("7d")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  timeRange === "7d"
                    ? "bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                7 днів
              </button>
            </div>

            {/* Metric Selector */}
            <div className="flex p-1 rounded-xl bg-white/5 border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setMetric("tonnage")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  metric === "tonnage"
                    ? "bg-white/20 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Тоннаж у кілограмах"
              >
                <Dumbbell className="h-3 w-3" />
                <span>Тоннаж</span>
              </button>
              <button
                type="button"
                onClick={() => setMetric("score")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  metric === "score"
                    ? "bg-white/20 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Атлетичний індекс 0-100"
              >
                <Sparkles className="h-3 w-3 text-amber-400" />
                <span>Індекс</span>
              </button>
              <button
                type="button"
                onClick={() => setMetric("power")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  metric === "power"
                    ? "bg-white/20 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Силова потужність кг/хв"
              >
                <Zap className="h-3 w-3 text-cyan-400" />
                <span>Потужність</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 HIGH-IMPACT BENTO KPI CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mt-4">
          {/* KPI 1: Team Volume */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Об&apos;єм команди</span>
              <div className="h-7 w-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Dumbbell className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                {(teamStats.totalTeamTonnage / 1000).toFixed(1)}
              </span>
              <span className="text-xs font-bold text-slate-400">тонн</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {teamStats.totalWorkoutsLogged} тренувань у вибірці
            </span>
          </div>

          {/* KPI 2: Average Athletic Score */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Сер. індекс сили</span>
              <div className="h-7 w-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Trophy className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
                {teamStats.avgScore}
              </span>
              <span className="text-xs font-bold text-slate-400">/ 100</span>
            </div>
            <span className="text-[10px] text-amber-400/80 block mt-0.5">
              Рівень: Iron Pro 🦾
            </span>
          </div>

          {/* KPI 3: Average Power Density */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Сер. потужність</span>
              <div className="h-7 w-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Zap className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-cyan-300 font-mono">
                {teamStats.avgPower}
              </span>
              <span className="text-xs font-bold text-slate-400">кг/хв</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Щільність суперсетів СМТ
            </span>
          </div>

          {/* KPI 4: Attention Radar */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Увага тренера</span>
              <div
                className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                  teamStats.attentionList.length > 0
                    ? "bg-rose-500/20 border border-rose-500/40 text-rose-400 animate-pulse"
                    : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                }`}
              >
                {teamStats.attentionList.length > 0 ? (
                  <AlertTriangle className="h-3.5 w-3.5" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
              </div>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span
                className={`text-xl sm:text-2xl font-black font-mono ${
                  teamStats.attentionList.length > 0 ? "text-rose-400" : "text-emerald-400"
                }`}
              >
                {teamStats.attentionList.length}
              </span>
              <span className="text-xs font-bold text-slate-400">атлетів</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
              {teamStats.attentionList.length > 0 ? "Пауза >72 год або лід" : "Всі тренуються за планом"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. ATTENTION STRIP: If any trainees require coach intervention */}
      {teamStats.attentionList.length > 0 && (
        <div className="p-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
              <Flame className="h-4 w-4" />
            </span>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Потребують контакту ({teamStats.attentionList.length}):</span>
                <span className="text-rose-300 font-normal">
                  {teamStats.attentionList.map((t) => t.alias || t.name).join(", ")}
                </span>
              </div>
              <p className="text-[11px] text-rose-200/80">
                Атлети пропустили заплановані тренування або очікують зворотного зв&apos;язку по програмі
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            {teamStats.attentionList.slice(0, 2).map((t) => (
              <a
                key={t.id}
                href={`https://t.me/${t.username}`}
                target="_blank"
                rel="noreferrer"
                className="h-7 px-2.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-[11px] font-bold text-rose-300 flex items-center gap-1 transition-colors"
              >
                <MessageCircle className="h-3 w-3" />
                <span>@{t.username}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 3. PRIMARY BENTO ANALYTICS GRID (Desktop 3 cols, Mobile stacked) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* MAIN CHART BENTO (2 Columns on Desktop) */}
        <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-950 to-slate-900/80 p-4 sm:p-5 shadow-xl backdrop-blur-xl flex flex-col justify-between">
          <div>
            {/* Header with View Type Switcher (Comparison Bar vs Timeline Area) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-white/5">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <span>
                    {chartView === "comparison"
                      ? metric === "tonnage"
                        ? "Рейтинг атлетів за об'ємом (кг)"
                        : metric === "score"
                        ? "Розподіл атлетичного індексу"
                        : "Силова потужність атлетів (кг/хв)"
                      : "Динаміка тренувального об'єму команди"}
                  </span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  {chartView === "comparison"
                    ? "Натисніть на стовпчик атлета, щоб відкрити його індивідуальну динаміку"
                    : "Сумарний кілограмний тоннаж виконаних тренувань за датами"}
                </span>
              </div>

              {/* View Switcher */}
              <div className="flex p-0.5 rounded-xl bg-white/5 border border-white/10 text-xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setChartView("comparison")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                    chartView === "comparison"
                      ? "bg-white/20 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <BarChart3 className="h-3 w-3" />
                  <span>Порівняння</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChartView("timeline")}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                    chartView === "timeline"
                      ? "bg-white/20 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <LineChartIcon className="h-3 w-3" />
                  <span>Таймлайн</span>
                </button>
              </div>
            </div>

            {/* Recharts Chart Canvas */}
            <div className="h-[260px] sm:h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                {chartView === "comparison" ? (
                  <BarChart
                    data={comparisonData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                    onClick={(e: any) => {
                      if (e && e.activePayload && e.activePayload.length > 0) {
                        const clickedId = e.activePayload[0].payload.id;
                        setSelectedTraineeId(clickedId);
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) =>
                        metric === "tonnage"
                          ? `${(val / 1000).toFixed(0)}т`
                          : metric === "score"
                          ? `${val}`
                          : `${val}`
                      }
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-md p-3 shadow-2xl text-xs space-y-1.5 min-w-[180px]">
                            <div className="font-bold text-white flex items-center justify-between pb-1 border-b border-white/10">
                              <span>{data.fullName}</span>
                              <span className="text-[10px] text-amber-400 font-mono">МКЦ-{data.microcycle}</span>
                            </div>
                            <div className="text-[11px] text-slate-400">@{data.username}</div>
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-slate-300">
                                {metric === "tonnage" ? "Тоннаж:" : metric === "score" ? "Індекс:" : "Потужність:"}
                              </span>
                              <span
                                className="font-mono font-bold text-sm"
                                style={{ color: getMetricColor(metric) }}
                              >
                                {data.metricLabel}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium">
                              {data.tierLabel}
                            </div>
                            <div className="text-[9px] text-emerald-400 pt-0.5">
                              👆 Натисніть для перегляду динаміки
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
                      {comparisonData.map((entry) => (
                        <Cell
                          key={`cell-${entry.id}`}
                          fill={
                            entry.id === activeSelectedTrainee?.id
                              ? "#10b981" // emerald active
                              : entry.tierKey === "titan"
                              ? "#f59e0b" // gold
                              : entry.tierKey === "iron_pro"
                              ? "#06b6d4" // cyan
                              : "#8b5cf6" // purple
                          }
                          fillOpacity={entry.id === activeSelectedTrainee?.id ? 1 : 0.75}
                          className="cursor-pointer transition-all hover:opacity-100"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="teamTonnageGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `${(val / 1000).toFixed(0)}т`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-md p-2.5 shadow-2xl text-xs space-y-1 min-w-[150px]">
                            <div className="font-bold text-slate-300 pb-1 border-b border-white/10">
                              Дата: {data.dateStr}
                            </div>
                            <div className="flex items-center justify-between text-emerald-400 font-bold font-mono">
                              <span>Об&apos;єм дня:</span>
                              <span>{data.tonnage.toLocaleString("uk-UA")} кг</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Тренувань: {data.count}
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="tonnage"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#teamTonnageGradient)"
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Athlete Selector Chips */}
          <div className="mt-4 pt-3 border-t border-white/5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Швидкий вибір атлета для деталізації:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {enrichedTrainees.map((t) => {
                const isSelected = t.id === activeSelectedTrainee?.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTraineeId(t.id)}
                    className={`h-7 px-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
                      isSelected
                        ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm"
                        : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        t.status === "active" ? "bg-emerald-400" : t.status === "new_lead" ? "bg-rose-400" : "bg-purple-400"
                      }`}
                    />
                    <span>{t.shortName}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* SIDE BENTO: Microcycle Funnel & Top Athletes Podium (1 Column on Desktop) */}
        <div className="space-y-4">
          {/* Microcycle Funnel Card */}
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-950 to-slate-900/80 p-4 sm:p-5 shadow-xl backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-emerald-400" />
                <span>Воронка мікроциклів</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono font-bold">
                {teamStats.totalAthletes} атлетів
              </span>
            </div>

            {/* Segmented Stack Bar */}
            <div className="h-3 rounded-full bg-slate-800 overflow-hidden flex border border-white/10">
              <div
                style={{ width: `${(teamStats.mcCounts[1] / teamStats.totalAthletes) * 100}%` }}
                className="bg-blue-500 h-full transition-all"
                title={`МКЦ-1: ${teamStats.mcCounts[1]}`}
              />
              <div
                style={{ width: `${(teamStats.mcCounts[2] / teamStats.totalAthletes) * 100}%` }}
                className="bg-emerald-500 h-full transition-all"
                title={`МКЦ-2: ${teamStats.mcCounts[2]}`}
              />
              <div
                style={{ width: `${(teamStats.mcCounts[3] / teamStats.totalAthletes) * 100}%` }}
                className="bg-amber-500 h-full transition-all"
                title={`МКЦ-3: ${teamStats.mcCounts[3]}`}
              />
              <div
                style={{ width: `${(teamStats.mcCounts[4] / teamStats.totalAthletes) * 100}%` }}
                className="bg-purple-500 h-full transition-all"
                title={`МКЦ-4: ${teamStats.mcCounts[4]}`}
              />
            </div>

            {/* MC Stage Breakdown List */}
            <div className="grid grid-cols-2 gap-2 mt-3.5">
              <div
                onClick={() => setMicrocycleFilter(microcycleFilter === 1 ? 0 : 1)}
                className={`p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                  microcycleFilter === 1
                    ? "bg-blue-500/20 border-blue-500 text-white"
                    : "bg-white/5 border-white/5 text-slate-300 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-blue-400 uppercase">МКЦ-1</span>
                  <span className="font-mono font-bold text-white">{teamStats.mcCounts[1]}</span>
                </div>
                <span className="text-[10px] text-slate-400 block truncate">Ввідний етап</span>
              </div>

              <div
                onClick={() => setMicrocycleFilter(microcycleFilter === 2 ? 0 : 2)}
                className={`p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                  microcycleFilter === 2
                    ? "bg-emerald-500/20 border-emerald-500 text-white"
                    : "bg-white/5 border-white/5 text-slate-300 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">МКЦ-2</span>
                  <span className="font-mono font-bold text-white">{teamStats.mcCounts[2]}</span>
                </div>
                <span className="text-[10px] text-slate-400 block truncate">Нарощування</span>
              </div>

              <div
                onClick={() => setMicrocycleFilter(microcycleFilter === 3 ? 0 : 3)}
                className={`p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                  microcycleFilter === 3
                    ? "bg-amber-500/20 border-amber-500 text-white"
                    : "bg-white/5 border-white/5 text-slate-300 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-400 uppercase">МКЦ-3</span>
                  <span className="font-mono font-bold text-white">{teamStats.mcCounts[3]}</span>
                </div>
                <span className="text-[10px] text-slate-400 block truncate">Пік сили</span>
              </div>

              <div
                onClick={() => setMicrocycleFilter(microcycleFilter === 4 ? 0 : 4)}
                className={`p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                  microcycleFilter === 4
                    ? "bg-purple-500/20 border-purple-500 text-white"
                    : "bg-white/5 border-white/5 text-slate-300 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-purple-400 uppercase">МКЦ-4</span>
                  <span className="font-mono font-bold text-white">{teamStats.mcCounts[4]}</span>
                </div>
                <span className="text-[10px] text-slate-400 block truncate">Делоад / Відновлення</span>
              </div>
            </div>
          </div>

          {/* Top-3 Podium Card */}
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-950 to-slate-900/80 p-4 sm:p-5 shadow-xl backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Trophy className="h-4 w-4 text-amber-400" />
                <span>Топ лідери команди</span>
              </h3>
              <span className="text-[10px] text-amber-300 font-bold uppercase">За Score</span>
            </div>

            <div className="space-y-2">
              {topAthletes.map((athlete, index) => {
                const medalEmoji = index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉";
                return (
                  <div
                    key={athlete.id}
                    onClick={() => setSelectedTraineeId(athlete.id)}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      athlete.id === activeSelectedTrainee?.id
                        ? "bg-white/15 border-amber-500/50 shadow-md"
                        : "bg-white/5 border-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base shrink-0">{medalEmoji}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          {athlete.alias || athlete.name}
                        </div>
                        {athlete.alias && (
                          <div className="text-[9px] text-slate-400 truncate">
                            ({athlete.name})
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 font-mono">
                          МКЦ-{athlete.currentMicrocycle} • {athlete.totalWorkouts} занять
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-amber-300 font-mono">
                        {athlete.athleticScore}/100
                      </div>
                      <div className="text-[9px] text-emerald-400 font-mono">
                        {Math.round(athlete.totalTonnage / 1000)}т
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. SELECTED TRAINEE DEEP-DIVE BENTO PANEL */}
      {activeSelectedTrainee && (
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-950 to-slate-900/90 p-4 sm:p-5 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${activeSelectedTrainee.avatarColor} text-white font-black text-sm shadow-md shrink-0`}
              >
                {activeSelectedTrainee.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-black text-white">
                    {activeSelectedTrainee.alias || activeSelectedTrainee.name}
                  </h3>
                  {activeSelectedTrainee.alias && (
                    <span className="text-xs text-slate-400 font-normal">
                      ({activeSelectedTrainee.name})
                    </span>
                  )}
                  {activeSelectedTrainee.alias && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300">
                      ПСЕВДОНІМ
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(activeSelectedTrainee)}
                    className="h-6 px-2 rounded-lg bg-white/5 hover:bg-amber-500/20 border border-white/10 text-slate-300 hover:text-amber-300 text-[11px] font-medium flex items-center gap-1 transition-colors"
                    title="Змінити ім'я або надати псевдонім"
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>Псевдонім</span>
                  </button>
                  <span className="text-xs text-slate-400">@{activeSelectedTrainee.username}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 uppercase">
                    {activeSelectedTrainee.tierLabel}
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
                  <span>Мікроцикл: <b className="text-white font-mono">{activeSelectedTrainee.currentMicrocycle}</b></span>
                  <span>•</span>
                  <span>Тренувань: <b className="text-white font-mono">{activeSelectedTrainee.totalWorkouts}</b></span>
                  <span>•</span>
                  <span>Вага: <b className="text-white font-mono">{activeSelectedTrainee.weightKg} кг</b></span>
                  {activeSelectedTrainee.weightDeltaKg !== 0 && (
                    <span
                      className={`font-mono font-bold text-[11px] ${
                        activeSelectedTrainee.weightDeltaKg > 0 ? "text-emerald-400" : "text-cyan-400"
                      }`}
                    >
                      ({activeSelectedTrainee.weightDeltaKg > 0 ? `+${activeSelectedTrainee.weightDeltaKg}` : activeSelectedTrainee.weightDeltaKg} кг)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions for selected trainee */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onOpenDetail(activeSelectedTrainee)}
                className="h-9 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
              >
                <FileText className="h-4 w-4" />
                <span>Повне досьє атлета</span>
              </button>

              <a
                href={`https://t.me/${activeSelectedTrainee.username}`}
                target="_blank"
                rel="noreferrer"
                className="h-9 px-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
                title="Написати атлету в Telegram"
              >
                <MessageCircle className="h-4 w-4 text-sky-400" />
                <span>Telegram</span>
              </a>
            </div>
          </div>

          {/* Deep Dive Charts: Workout Tonnage Progression Curve */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {/* Left: Tonnage Growth Chart */}
            <div className="md:col-span-2 rounded-2xl bg-white/5 border border-white/10 p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Динаміка тоннажу по тренуваннях (кг)</span>
                </span>
                <span className="text-[11px] text-emerald-400 font-mono font-bold">
                  Сумарно: {Math.round(activeSelectedTrainee.totalTonnage).toLocaleString("uk-UA")} кг
                </span>
              </div>

              {selectedTraineeCurve.length > 0 ? (
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={selectedTraineeCurve} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="traineeTonnageGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} vertical={false} />
                      <XAxis dataKey="workout" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={9}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `${(v / 1000).toFixed(1)}т`}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload || !payload.length) return null;
                          const d = payload[0].payload;
                          return (
                            <div className="rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-md p-2 shadow-xl text-xs space-y-1">
                              <div className="font-bold text-white flex items-center justify-between gap-3">
                                <span>Тренування {d.workout}</span>
                                <span className="text-[10px] text-slate-400">{d.date}</span>
                              </div>
                              <div className="text-emerald-400 font-mono font-bold">
                                {d.tonnage?.toLocaleString("uk-UA")} кг
                              </div>
                              <div className="text-[10px] text-cyan-300">
                                Потужність: {d.power} кг/хв
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="tonnage"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#traineeTonnageGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-xs text-slate-500">
                  Немає записів завершених тренувань
                </div>
              )}
            </div>

            {/* Right: Key Stats & Coach Notes */}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-3 sm:p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  Ключові метрики атлета
                </span>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-white/5">
                    <span className="text-slate-400">Атлетичний індекс:</span>
                    <span className="font-mono font-bold text-amber-300">
                      {activeSelectedTrainee.athleticScore} / 100
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-white/5">
                    <span className="text-slate-400">Сер. потужність:</span>
                    <span className="font-mono font-bold text-cyan-300">
                      {activeSelectedTrainee.avgPower} кг/хв
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-white/5">
                    <span className="text-slate-400">Останній тренінг:</span>
                    <span className="font-mono font-bold text-slate-200">
                      {formatSmartDate(activeSelectedTrainee.lastWorkoutDate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Coach Note Snippet */}
              <div className="mt-3 pt-2.5 border-t border-white/5">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Нотатка тренера:
                </span>
                <p className="text-[11px] text-slate-300 italic line-clamp-2">
                  &ldquo;{activeSelectedTrainee.coachNotes || "Немає нотаток"}&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. INTERACTIVE MASTER ATHLETE TABLE (Desktop full, Mobile horizontal scroll) */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-950 to-slate-900/90 p-4 sm:p-5 shadow-xl backdrop-blur-xl">
        {/* Table Toolbar: Search, Filters & Count */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-400" />
              <span>Зведена аналітична таблиця підопічних</span>
            </h3>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
              {displayedTrainees.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Пошук атлета..."
                className="w-full h-8 rounded-xl border border-white/10 bg-slate-900/80 py-1 pl-8 pr-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 px-2.5 rounded-xl border border-white/10 bg-slate-900 text-xs text-slate-300 font-semibold focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Всі статуси</option>
              <option value="active">Активні</option>
              <option value="needs_attention">Потребують уваги</option>
              <option value="new_lead">Нові ліди</option>
            </select>
          </div>
        </div>

        {/* The Master Table */}
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-[11px] uppercase tracking-wider">
                <th
                  onClick={() => handleSort("score")}
                  className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Атлет</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("microcycle")}
                  className="py-3 px-2 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>МКЦ</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("score")}
                  className="py-3 px-2 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Індекс</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("tonnage")}
                  className="py-3 px-2 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Тоннаж</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("power")}
                  className="py-3 px-2 cursor-pointer hover:text-white transition-colors hidden sm:table-cell"
                >
                  <div className="flex items-center gap-1">
                    <span>Потужність</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 px-2 hidden md:table-cell">Вага / Динаміка</th>
                <th
                  onClick={() => handleSort("date")}
                  className="py-3 px-2 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Останній тренінг</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 px-3 text-right">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {displayedTrainees.map((trainee) => {
                const isSelected = trainee.id === activeSelectedTrainee?.id;
                return (
                  <tr
                    key={trainee.id}
                    onClick={() => setSelectedTraineeId(trainee.id)}
                    className={`transition-colors cursor-pointer group ${
                      isSelected ? "bg-white/10" : "hover:bg-white/5"
                    }`}
                  >
                    {/* Athlete Name & Handle */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${trainee.avatarColor} text-white font-bold text-xs shrink-0 shadow-sm`}
                        >
                          {(trainee.alias || trainee.name)
                            .split(" ")
                            .filter(Boolean)
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-white group-hover:text-emerald-400 transition-colors truncate flex items-center gap-1.5">
                            <span>{trainee.alias || trainee.name}</span>
                            {trainee.alias && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300 font-normal">
                                псевдонім
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {trainee.alias ? `${trainee.name} • ` : ""}@{trainee.username}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Microcycle & Workout Number */}
                    <td className="py-2.5 px-2">
                      <span className="font-mono font-bold px-2 py-0.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[11px]">
                        МКЦ-{trainee.currentMicrocycle} (#{trainee.currentWorkoutNumber})
                      </span>
                    </td>

                    {/* Athletic Score & Tier */}
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-amber-300 text-xs">
                          {trainee.athleticScore}
                        </span>
                        <span className="text-[10px] text-slate-400 hidden xl:inline">
                          / 100
                        </span>
                      </div>
                    </td>

                    {/* Tonnage */}
                    <td className="py-2.5 px-2 font-mono font-bold text-emerald-400 text-xs">
                      {Math.round(trainee.periodTonnage || trainee.totalTonnage).toLocaleString("uk-UA")} кг
                    </td>

                    {/* Power */}
                    <td className="py-2.5 px-2 font-mono text-cyan-300 text-xs hidden sm:table-cell">
                      {trainee.avgPower > 0 ? `${trainee.avgPower} кг/хв` : "—"}
                    </td>

                    {/* Weight & Delta */}
                    <td className="py-2.5 px-2 font-mono text-xs hidden md:table-cell">
                      <span className="text-slate-200">{trainee.weightKg} кг</span>
                      {trainee.weightDeltaKg !== 0 && (
                        <span
                          className={`ml-1 text-[11px] ${
                            trainee.weightDeltaKg > 0 ? "text-emerald-400" : "text-cyan-400"
                          }`}
                        >
                          ({trainee.weightDeltaKg > 0 ? `+${trainee.weightDeltaKg}` : trainee.weightDeltaKg})
                        </span>
                      )}
                    </td>

                    {/* Last Workout Smart Date */}
                    <td className="py-2.5 px-2 text-slate-300 text-[11px]">
                      {formatSmartDate(trainee.lastWorkoutDate)}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(trainee)}
                          className="h-7 w-7 rounded-lg bg-white/5 hover:bg-amber-500/20 border border-white/10 text-slate-300 hover:text-amber-300 flex items-center justify-center transition-colors"
                          title="Змінити ім'я або псевдонім"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenDetail(trainee)}
                          className="h-7 px-2.5 rounded-lg bg-white/10 hover:bg-emerald-500 hover:text-slate-950 font-bold text-[11px] text-white transition-colors flex items-center gap-1"
                        >
                          <span>Досьє</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </button>
                        <a
                          href={`https://t.me/${trainee.username}`}
                          target="_blank"
                          rel="noreferrer"
                          className="h-7 w-7 rounded-lg bg-white/5 hover:bg-sky-500/20 border border-white/10 text-slate-300 hover:text-sky-300 flex items-center justify-center transition-colors"
                          title="Чат у Telegram"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <EditTraineeModal
        trainee={traineeToEdit}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      />
    </div>
  );
}
