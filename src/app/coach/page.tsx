"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Crown,
  Users,
  Dumbbell,
  AlertTriangle,
  Search,
  ExternalLink,
  ChevronRight,
  Sparkles,
  RotateCcw,
  MoreVertical,
  Flame,
  FileText,
  Share2,
  Copy,
  Check,
  Ban,
  Unlock,
  Trash2,
  X,
  MessageCircle,
  BarChart3,
  Edit3,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import { useCoachStore, TraineeProfile, TraineeStatusFilter } from "@/lib/store/useCoachStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { isCoachAccount, MASTER_COACH_USERNAME, BOT_USERNAME } from "@/lib/auth/roles";
import { TraineeDetailModal } from "@/components/coach/TraineeDetailModal";
import { CoachAnalyticsView } from "@/components/coach/CoachAnalyticsView";
import { EditTraineeModal } from "@/components/coach/EditTraineeModal";
import { AddTraineeModal } from "@/components/coach/AddTraineeModal";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

function formatSmartDate(dateStr?: string, language: string = "uk"): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 3600));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) {
    return language === "uk" ? "Щойно" : language === "en" ? "Just now" : "Только что";
  }
  if (diffHours < 24 && date.getDate() === now.getDate()) {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return language === "uk"
      ? `Сьогодні, ${hours}:${minutes}`
      : language === "en"
      ? `Today, ${hours}:${minutes}`
      : `Сегодня, ${hours}:${minutes}`;
  }
  if (diffDays === 1 || (diffHours < 48 && date.getDate() === now.getDate() - 1)) {
    return language === "uk" ? "Вчора" : language === "en" ? "Yesterday" : "Вчера";
  }
  if (diffDays < 7) {
    return language === "uk"
      ? `${diffDays} дн. тому`
      : language === "en"
      ? `${diffDays}d ago`
      : `${diffDays} дн. назад`;
  }
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear().toString().slice(-2);
  return `${d}.${m}.${y}`;
}

export default function CoachDashboardPage() {
  const { language } = useTranslation();
  const {
    trainees,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    blockTrainee,
    unblockTrainee,
    deleteTrainee,
    clearAllTrainees,
    clearDemoTrainees,
    resetToDefaultTrainees,
    fetchServerTrainees,
    isLoadingServer,
  } = useCoachStore();

  const { userRole, linkedTelegramUser } = useSettingsStore();
  const isCoach = userRole === "coach" || isCoachAccount(linkedTelegramUser?.username, linkedTelegramUser?.id);

  const [selectedTrainee, setSelectedTrainee] = useState<TraineeProfile | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"roster" | "analytics">("analytics");

  // Link copy state
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    fetchServerTrainees();
  }, [fetchServerTrainees]);

  // Delete Trainee Modal
  const [traineeToDelete, setTraineeToDelete] = useState<TraineeProfile | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Clear demo modal
  const [isClearDemoModalOpen, setIsClearDemoModalOpen] = useState(false);

  // Active menu dropdown id
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Trainee edit modal state
  const [traineeToEdit, setTraineeToEdit] = useState<TraineeProfile | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleOpenEdit = (trainee: TraineeProfile) => {
    setActiveMenuId(null);
    setTraineeToEdit(trainee);
    setIsEditModalOpen(true);
  };

  // Expanded notes per trainee
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  // Summary Metrics
  const totalTrainees = trainees.length;
  const activeTrainees = trainees.filter((t) => t.status === "active").length;
  const leadsCount = trainees.filter((t) => t.status === "new_lead").length;
  const needsAttentionTrainees = trainees.filter((t) => t.status === "needs_attention").length;
  const blockedCount = trainees.filter((t) => t.status === "blocked").length;

  const totalTeamTonnage = useMemo(() => {
    return trainees
      .filter((t) => t.status !== "blocked")
      .reduce((acc, t) => {
        const traineeTotal = t.workoutHistory.reduce((wAcc, w) => wAcc + (w.tonnageKg || 0), 0);
        return acc + traineeTotal;
      }, 0);
  }, [trainees]);

  const averageScore = useMemo(() => {
    const validTrainees = trainees.filter((t) => t.status !== "blocked" && t.status !== "new_lead");
    if (validTrainees.length === 0) return 0;
    const sum = validTrainees.reduce((acc, t) => acc + (t.athleticScore || 0), 0);
    return Math.round(sum / validTrainees.length);
  }, [trainees]);

  const filteredTrainees = useMemo(() => {
    return trainees.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        (t.alias && t.alias.toLowerCase().includes(q)) ||
        t.username.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (statusFilter === "all") return true;
      if (statusFilter === "new_lead") return t.status === "new_lead";
      if (statusFilter === "active") return t.status === "active";
      if (statusFilter === "needs_attention") return t.status === "needs_attention";
      if (statusFilter === "blocked") return t.status === "blocked";
      return true;
    });
  }, [trainees, searchQuery, statusFilter]);

  const hasDemoTrainees = useMemo(() => {
    return trainees.some((t) => ["trainee-1", "trainee-2", "trainee-3", "trainee-4", "trainee-5"].includes(t.id));
  }, [trainees]);

  const inviteUrl = `https://t.me/${BOT_USERNAME}?start=coach_${MASTER_COACH_USERNAME}`;

  const handleCopyInviteLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const toggleExpandNote = (id: string) => {
    setExpandedNotes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenDetail = (trainee: TraineeProfile) => {
    setActiveMenuId(null);
    setSelectedTrainee(trainee);
    setIsDetailModalOpen(true);
  };

  const confirmDelete = (trainee: TraineeProfile) => {
    setActiveMenuId(null);
    setTraineeToDelete(trainee);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirmed = () => {
    if (traineeToDelete) {
      deleteTrainee(traineeToDelete.id);
      setTraineeToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  const handleToggleBlock = (trainee: TraineeProfile) => {
    setActiveMenuId(null);
    if (trainee.status === "blocked") {
      unblockTrainee(trainee.id);
    } else {
      blockTrainee(trainee.id);
    }
  };

  const getTierBadge = (t: TraineeProfile) => {
    if (t.status === "blocked") {
      return (
        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full border bg-slate-800 border-slate-700 text-slate-400">
          Заблокований 🚫
        </span>
      );
    }
    if (t.status === "new_lead") {
      return (
        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full border bg-rose-500/15 border-rose-500/40 text-rose-300 animate-pulse">
          Новий Лід 🔥
        </span>
      );
    }

    switch (t.tierKey) {
      case "titan":
        return (
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full border bg-amber-500/15 border-amber-500/40 text-amber-300">
            {t.tierLabel || "Титан Сили ⚡"}
          </span>
        );
      case "iron_pro":
        return (
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full border bg-cyan-500/15 border-cyan-500/40 text-cyan-300">
            {t.tierLabel || "Залізний Профі 🦾"}
          </span>
        );
      case "power_master":
        return (
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full border bg-emerald-500/15 border-emerald-500/40 text-emerald-300">
            {t.tierLabel || "Майстер Потужності 💥"}
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full border bg-slate-500/15 border-slate-500/40 text-slate-300">
            {t.tierLabel || "Активний Атлет 🏋️"}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-300" onClick={() => setActiveMenuId(null)}>
      {/* Hero Header Block */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-950 to-slate-900/90 p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/40 text-xs font-black text-amber-300 shadow-sm shadow-amber-500/20">
                <Crown className="h-3.5 w-3.5 text-amber-400" />
                <span>ГОЛОВНИЙ ТРЕНЕР</span>
              </span>
              <span className="text-xs text-slate-400 font-medium">@{MASTER_COACH_USERNAME}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Кабінет керування підопічними
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Автоматична воронка лідів з Telegram, прогресія робочих ваг та досьє команди.
            </p>
          </div>

          {/* Action Buttons: Unified height h-9.5 */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="h-9 px-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-xs font-bold text-emerald-300 transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-500/20"
              title="Додати підопічного вручну"
            >
              <UserPlus className="h-4 w-4 text-emerald-400" />
              <span>+ Атлет</span>
            </button>

            <button
              type="button"
              onClick={handleCopyInviteLink}
              className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md ${
                copiedLink
                  ? "bg-emerald-500 text-slate-950 border border-emerald-400"
                  : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
              }`}
              title="Скопіювати інвайт-посилання для публікації в каналі чи сторіс"
            >
              {copiedLink ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Скопійовано!</span>
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 text-emerald-400" />
                  <span>Посилання для каналу</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsClearDemoModalOpen(true)}
              className="h-9 px-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-1"
              title="Керування демо-записами"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
              <span>Демо</span>
            </button>
          </div>
        </div>

        {/* 4 Team KPI Cards (Strict grid and identical height) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
          <div className="h-16 p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">Атлетів</span>
              <span className="text-base font-black text-white font-mono">{totalTrainees}</span>
            </div>
          </div>

          <div className="h-16 p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">Тоннаж команди</span>
              <span className="text-base font-black text-emerald-400 font-mono">
                {Math.round(totalTeamTonnage / 1000)} т
              </span>
            </div>
          </div>

          <div className="h-16 p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">Сер. індекс</span>
              <span className="text-base font-black text-amber-300 font-mono">
                {averageScore > 0 ? `${averageScore}/100` : "—"}
              </span>
            </div>
          </div>

          <div className="h-16 p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${
              leadsCount > 0
                ? "bg-rose-500/20 border border-rose-500/40 text-rose-400"
                : "bg-purple-500/15 border border-purple-500/30 text-purple-400"
            }`}>
              {leadsCount > 0 ? <Flame className="h-5 w-5 animate-bounce" /> : <AlertTriangle className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">
                {leadsCount > 0 ? "Нові ліди" : "Потребують уваги"}
              </span>
              <span className={`text-base font-black font-mono truncate block ${leadsCount > 0 ? "text-rose-400" : "text-purple-300"}`}>
                {leadsCount > 0 ? `${leadsCount} нових!` : needsAttentionTrainees}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Switcher: Roster vs Analytics */}
      <div className="flex p-1 rounded-2xl bg-slate-900/90 border border-white/10 shadow-lg backdrop-blur-md">
        <button
          type="button"
          onClick={() => setViewMode("roster")}
          className={`flex-1 h-9 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            viewMode === "roster"
              ? "bg-white/20 text-white shadow-md border border-white/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Картка команди ({totalTrainees})</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode("analytics")}
          className={`flex-1 h-9 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            viewMode === "analytics"
              ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/25 border border-emerald-400"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Аналітичний Дашборд</span>
        </button>
      </div>

      {viewMode === "analytics" ? (
        <CoachAnalyticsView onOpenDetail={handleOpenDetail} />
      ) : (
        <>
          {/* Toolbar: Search & Clean Filter Pills */}
          <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Пошук підопічного за ім'ям або @telegram..."
              className="w-full h-10 rounded-2xl border border-white/10 bg-slate-900/80 py-2 pl-10 pr-10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => fetchServerTrainees()}
            disabled={isLoadingServer}
            title="Оновити дані з сервера"
            className="h-10 px-3 rounded-2xl border border-white/10 bg-slate-900/80 text-slate-300 hover:text-white hover:border-emerald-500/50 flex items-center justify-center transition-colors shrink-0"
          >
            <RefreshCw className={"h-4 w-4 " + (isLoadingServer ? "animate-spin text-emerald-400" : "")} />
          </button>
          {hasDemoTrainees && (
            <button
              type="button"
              onClick={() => clearDemoTrainees()}
              title="Прибрати демо-атлетів"
              className="h-10 px-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Очистити демо</span>
            </button>
          )}
        </div>

        {/* Filter Pills with Horizontal Scroll on Mobile - Strict h-8 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setStatusFilter("all")}
            className={`h-8 px-3 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center justify-center ${
              statusFilter === "all"
                ? "bg-white/20 text-white border border-white/30"
                : "bg-slate-900/60 text-slate-400 hover:text-white border border-white/5"
            }`}
          >
            Всі ({totalTrainees})
          </button>

          {leadsCount > 0 && (
            <button
              onClick={() => setStatusFilter("new_lead")}
              className={`h-8 px-3 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-1.5 ${
                statusFilter === "new_lead"
                  ? "bg-rose-500/25 text-rose-300 border border-rose-500/40"
                  : "bg-slate-900/60 text-rose-400 hover:text-rose-300 border border-rose-500/20"
              }`}
            >
              <Flame className="h-3.5 w-3.5 text-rose-400" />
              <span>Ліди ({leadsCount})</span>
            </button>
          )}

          <button
            onClick={() => setStatusFilter("active")}
            className={`h-8 px-3 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-1.5 ${
              statusFilter === "active"
                ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/40"
                : "bg-slate-900/60 text-slate-400 hover:text-white border border-white/5"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span>Активні ({activeTrainees})</span>
          </button>

          <button
            onClick={() => setStatusFilter("needs_attention")}
            className={`h-8 px-3 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-1.5 ${
              statusFilter === "needs_attention"
                ? "bg-amber-500/25 text-amber-300 border border-amber-500/40"
                : "bg-slate-900/60 text-slate-400 hover:text-white border border-white/5"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            <span>Потребують уваги ({needsAttentionTrainees})</span>
          </button>

          {blockedCount > 0 && (
            <button
              onClick={() => setStatusFilter("blocked")}
              className={`h-8 px-3 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-1.5 ${
                statusFilter === "blocked"
                  ? "bg-slate-800 text-slate-200 border border-slate-600"
                  : "bg-slate-900/60 text-slate-500 hover:text-slate-300 border border-white/5"
              }`}
            >
              <Ban className="h-3.5 w-3.5 text-slate-400" />
              <span>Заблоковані ({blockedCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Trainees Cards Grid */}
      {filteredTrainees.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-white/10 bg-slate-900/40 space-y-3">
          <Users className="h-10 w-10 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">Підопічних не знайдено</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? "За вказаним пошуковим запитом атлетів не знайдено."
              : "У цій категорії зараз немає атлетів."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-stretch">
          {filteredTrainees.map((trainee) => {
            const displayName = trainee.alias || trainee.name;
            const initials = displayName
              .split(" ")
              .filter(Boolean)
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase() || "АТ";

            const cleanUsername = trainee.username.replace(/^@/, "");
            const telegramChatUrl = cleanUsername ? `https://t.me/${cleanUsername}` : "#";
            const progressPercent = Math.min(
              100,
              Math.round((trainee.currentWorkoutNumber / 36) * 100)
            );
            const isNoteExpanded = Boolean(expandedNotes[trainee.id]);
            const isBlocked = trainee.status === "blocked";
            const isLead = trainee.status === "new_lead";

            return (
              <div
                key={trainee.id}
                className={`relative rounded-3xl border transition-all p-4 shadow-xl flex flex-col justify-between ${
                  isBlocked
                    ? "border-slate-800 bg-slate-950/60 opacity-60"
                    : isLead
                    ? "border-rose-500/30 bg-gradient-to-br from-slate-900/80 via-slate-950 to-rose-950/20 hover:border-rose-500/50"
                    : "border-white/10 bg-slate-900/70 hover:border-white/20 hover:bg-slate-900/90"
                }`}
              >
                {/* Top Section */}
                <div className="space-y-3">
                  {/* Card Header with aligned elements */}
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar with Status Dot */}
                      <div className="relative shrink-0">
                        <div
                          className={`h-11 w-11 rounded-2xl bg-gradient-to-tr ${trainee.avatarColor} flex items-center justify-center text-sm font-black text-white shadow-md`}
                        >
                          {initials}
                        </div>
                        {trainee.status === "active" && (
                          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-slate-950"></span>
                          </span>
                        )}
                        {isLead && (
                          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border-2 border-slate-950"></span>
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm font-black text-white leading-tight truncate">
                            {displayName}
                          </h3>
                          {trainee.alias && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 shrink-0">
                              ПСЕВДОНІМ
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(trainee);
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-amber-300 hover:bg-white/10 transition-colors"
                            title="Змінити ім'я або надати псевдонім"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {trainee.alias && (
                            <span className="text-[11px] text-slate-400 truncate">
                              Ориг: {trainee.name} •
                            </span>
                          )}
                          {cleanUsername ? (
                            <a
                              href={telegramChatUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 truncate"
                            >
                              <span>@{cleanUsername}</span>
                              <ExternalLink className="h-2.5 w-2.5 inline shrink-0" />
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-500 block truncate">
                              Без юзернейму
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right side: Badge & Options Menu */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {getTierBadge(trainee)}

                      {/* Dropdown Menu Trigger */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === trainee.id ? null : trainee.id);
                          }}
                          className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {/* Dropdown Popover */}
                        {activeMenuId === trainee.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-9 z-30 w-48 rounded-2xl border border-white/15 bg-slate-950 p-1.5 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150"
                          >
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(trainee)}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-amber-300 hover:text-white hover:bg-amber-500/15 transition-colors"
                            >
                              <Edit3 className="h-3.5 w-3.5 text-amber-400" />
                              <span>Змінити псевдонім / ім&apos;я</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleBlock(trainee)}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                            >
                              {isBlocked ? (
                                <>
                                  <Unlock className="h-3.5 w-3.5 text-emerald-400" />
                                  <span>Розблокувати</span>
                                </>
                              ) : (
                                <>
                                  <Ban className="h-3.5 w-3.5 text-amber-400" />
                                  <span>Заблокувати</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => confirmDelete(trainee)}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                              <span>Видалити</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar in SMT 36 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                      <span>
                        Тренування: <strong className="text-white font-mono">#{trainee.currentWorkoutNumber}</strong> / 36
                      </span>
                      <span>
                        МКЦ-<strong className="text-white font-mono">{trainee.currentMicrocycle}</strong> ({progressPercent}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-950 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* 3 Metrics: Equal 33.3% columns */}
                  <div className="grid grid-cols-3 gap-2 p-2 rounded-2xl bg-slate-950/60 border border-white/5 text-center text-[11px]">
                    <div className="min-w-0">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block truncate">Індекс</span>
                      <strong className="text-white font-mono text-xs block">{trainee.athleticScore}/100</strong>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block truncate">Вага тіла</span>
                      <strong className="text-white font-mono text-xs block">{trainee.weightKg} кг</strong>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block truncate">Останнє заняття</span>
                      <strong className="text-slate-200 font-mono text-[10px] block truncate">
                        {formatSmartDate(trainee.lastWorkoutDate, language)}
                      </strong>
                    </div>
                  </div>

                  {/* Coach Notes (No text cutting, expandable and clean!) */}
                  {trainee.coachNotes ? (
                    <div className="rounded-xl border border-white/5 bg-slate-950/60 p-2.5 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-amber-400">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3 shrink-0" />
                          <span>Замітка тренера:</span>
                        </span>
                        {trainee.coachNotes.length > 60 && (
                          <button
                            type="button"
                            onClick={() => toggleExpandNote(trainee.id)}
                            className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                          >
                            {isNoteExpanded ? "Згорнути" : "Читати повністю ›"}
                          </button>
                        )}
                      </div>
                      <p
                        className={`text-xs text-slate-300 leading-relaxed italic ${
                          isNoteExpanded ? "" : "line-clamp-2"
                        }`}
                      >
                        "{trainee.coachNotes}"
                      </p>
                    </div>
                  ) : (
                    <div className="h-10 rounded-xl border border-dashed border-white/5 flex items-center justify-center text-[11px] text-slate-500 italic">
                      Немає персональних заміток
                    </div>
                  )}
                </div>

                {/* Card Actions: Strictly balanced 50% / 50% grid with unified h-9.5 buttons */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5 mt-3">
                  {cleanUsername ? (
                    <a
                      href={telegramChatUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="h-9 w-full rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                      <span>Написати</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="h-9 w-full rounded-xl border border-white/5 bg-white/5 text-slate-500 text-xs font-medium flex items-center justify-center"
                    >
                      <span>Очікує юзернейм</span>
                    </button>
                  )}

                  {isBlocked ? (
                    <button
                      type="button"
                      onClick={() => unblockTrainee(trainee.id)}
                      className="h-9 w-full rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                    >
                      <Unlock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span>Розблокувати</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(trainee)}
                      className="h-9 w-full rounded-xl border border-white/15 bg-white/5 hover:bg-emerald-500/15 hover:border-emerald-500/40 hover:text-emerald-300 text-white text-xs font-bold flex items-center justify-center gap-1 transition-all"
                    >
                      <span>Досьє</span>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}

      {/* Trainee Detail Dossier Modal */}
      <TraineeDetailModal
        trainee={selectedTrainee}
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
      />

      {/* Confirm Trainee Deletion Dialog */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogHeader>
          <DialogTitle onClose={() => setIsDeleteModalOpen(false)}>
            <div className="flex items-center gap-2 text-rose-400">
              <Trash2 className="h-5 w-5" />
              <span>Видалити підопічного?</span>
            </div>
          </DialogTitle>
          <DialogDescription>
            Ви збираєтеся видалити атлета <strong className="text-white">{traineeToDelete?.name}</strong> зі списку вашої команди.
          </DialogDescription>
        </DialogHeader>

        <div className="p-3 my-2 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 space-y-1">
          <p>
            Вся збережена історія тренувань, виконані ваги та замітки будуть видалені з вашої панелі.
          </p>
        </div>

        <div className="pt-2 flex justify-end gap-2 border-t border-white/10">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteModalOpen(false)}
          >
            Скасувати
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="font-bold text-xs"
            onClick={handleDeleteConfirmed}
          >
            Так, видалити
          </Button>
        </div>
      </Dialog>

      {/* Clear/Reset Demo Trainees Dialog */}
      <Dialog open={isClearDemoModalOpen} onOpenChange={setIsClearDemoModalOpen}>
        <DialogHeader>
          <DialogTitle onClose={() => setIsClearDemoModalOpen(false)}>
            <div className="flex items-center gap-2 text-amber-400">
              <RotateCcw className="h-5 w-5" />
              <span>Керування тестовими записами</span>
            </div>
          </DialogTitle>
          <DialogDescription>
            Очистити 4 тестові записи або повернути їх для перевірки інтерфейсу
          </DialogDescription>
        </DialogHeader>

        <div className="p-3 my-2 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 space-y-2">
          <p>
            • <strong>Очистити все:</strong> залишає панель чистою, куди додаватимуться лише ваші реальні підопічні з Telegram.
          </p>
          <p>
            • <strong>Відновити демо:</strong> повертає 4 демонстраційні профілі (Кравченко, Мельник, Ковальчук, Бондаренко).
          </p>
        </div>

        <div className="pt-2 flex justify-between gap-2 border-t border-white/10">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              resetToDefaultTrainees();
              setIsClearDemoModalOpen(false);
            }}
          >
            Відновити демо
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="font-bold text-xs"
            onClick={() => {
              clearAllTrainees();
              setIsClearDemoModalOpen(false);
            }}
          >
            Очистити все
          </Button>
        </div>
      </Dialog>

      {/* Edit Trainee Name & Alias Modal */}
      <EditTraineeModal
        trainee={traineeToEdit}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      />

      {/* Add Trainee Modal */}
      <AddTraineeModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />
    </div>
  );
}
