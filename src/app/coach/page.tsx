"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Crown,
  Users,
  Dumbbell,
  Zap,
  AlertTriangle,
  Search,
  Plus,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowLeft,
  CheckCircle,
  Trash2,
  Ban,
  Unlock,
  FileText,
  RotateCcw,
  MoreVertical,
  Flame,
  UserCheck,
  ShieldCheck,
  X,
} from "lucide-react";
import { useCoachStore, TraineeProfile, TraineeStatusFilter } from "@/lib/store/useCoachStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { isCoachAccount, MASTER_COACH_USERNAME } from "@/lib/auth/roles";
import { TraineeDetailModal } from "@/components/coach/TraineeDetailModal";
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
    addTrainee,
    blockTrainee,
    unblockTrainee,
    deleteTrainee,
    clearAllTrainees,
    resetToDefaultTrainees,
  } = useCoachStore();

  const { userRole, linkedTelegramUser } = useSettingsStore();
  const isCoach = userRole === "coach" || isCoachAccount(linkedTelegramUser?.username, linkedTelegramUser?.id);

  const [selectedTrainee, setSelectedTrainee] = useState<TraineeProfile | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Trainee deletion confirm modal
  const [traineeToDelete, setTraineeToDelete] = useState<TraineeProfile | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Clear demo modal
  const [isClearDemoModalOpen, setIsClearDemoModalOpen] = useState(false);

  // Active menu dropdown id
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Expanded notes per trainee
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  // New Trainee Form State
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newWeight, setNewWeight] = useState("80");
  const [newAge, setNewAge] = useState("28");
  const [newGender, setNewGender] = useState<"male" | "female">("male");
  const [newMicrocycle, setNewMicrocycle] = useState("1");

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

  // Filtered trainees
  const filteredTrainees = useMemo(() => {
    return trainees.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
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

  const handleCreateTrainee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUsername.trim()) return;

    const colors = [
      "from-blue-500 to-indigo-600",
      "from-emerald-500 to-teal-600",
      "from-purple-500 to-violet-600",
      "from-amber-500 to-orange-600",
      "from-rose-500 to-pink-600",
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    addTrainee({
      name: newName.trim(),
      username: newUsername.trim().replace(/^@/, ""),
      avatarColor: randomColor,
      gender: newGender,
      age: parseInt(newAge) || 28,
      currentMicrocycle: parseInt(newMicrocycle) || 1,
      currentWorkoutNumber: 1,
      totalWorkouts: 0,
      weightKg: parseFloat(newWeight) || 80,
      weightDeltaKg: 0,
      lastWorkoutDate: new Date().toISOString(),
      athleticScore: 75,
      tierKey: "power_master",
      tierLabel: "Майстер Потужності 💥",
      status: "active",
      coachNotes: "Новий підопічний доданий вручну.",
      workoutHistory: [],
      measurementHistory: [
        {
          id: `m-init-${Date.now()}`,
          date: new Date().toISOString(),
          weightKg: parseFloat(newWeight) || 80,
        },
      ],
    });

    setNewName("");
    setNewUsername("");
    setIsAddModalOpen(false);
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
              Автоматична фіксація нових лідів з каналу, моніторинг прогресу та досьє атлетів.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="accent"
              size="sm"
              className="font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span>Додати атлета</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="text-xs border-white/10 text-slate-300 hover:text-white hover:bg-white/5"
              onClick={() => setIsClearDemoModalOpen(true)}
              title="Керування тестовими записами"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline ml-1">Демо</span>
            </Button>
          </div>
        </div>

        {/* 4 Team KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Атлетів</span>
              <span className="text-base font-black text-white font-mono">{totalTrainees}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Тоннаж команди</span>
              <span className="text-base font-black text-emerald-400 font-mono">
                {Math.round(totalTeamTonnage / 1000)} т
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Сер. індекс</span>
              <span className="text-base font-black text-amber-300 font-mono">
                {averageScore > 0 ? `${averageScore}/100` : "—"}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${
              leadsCount > 0
                ? "bg-rose-500/20 border border-rose-500/40 text-rose-400"
                : "bg-purple-500/15 border border-purple-500/30 text-purple-400"
            }`}>
              {leadsCount > 0 ? <Flame className="h-5 w-5 animate-bounce" /> : <AlertTriangle className="h-5 w-5" />}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                {leadsCount > 0 ? "Нові ліди" : "Потребують уваги"}
              </span>
              <span className={`text-base font-black font-mono ${leadsCount > 0 ? "text-rose-400" : "text-purple-300"}`}>
                {leadsCount > 0 ? `${leadsCount} нових!` : needsAttentionTrainees}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar: Search & Modern Filter Pills */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Пошук підопічного за ім'ям або @telegram..."
            className="w-full rounded-2xl border border-white/10 bg-slate-900/80 py-2.5 pl-10 pr-10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
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

        {/* Filter Pills with Horizontal Scroll on Mobile */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
                statusFilter === "new_lead"
                  ? "bg-rose-500/25 text-rose-300 border border-rose-500/40"
                  : "bg-slate-900/60 text-rose-400 hover:text-rose-300 border border-rose-500/20"
              }`}
            >
              <Flame className="h-3.5 w-3.5" />
              <span>Ліди ({leadsCount})</span>
            </button>
          )}

          <button
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
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
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
                statusFilter === "blocked"
                  ? "bg-slate-800 text-slate-200 border border-slate-600"
                  : "bg-slate-900/60 text-slate-500 hover:text-slate-300 border border-white/5"
              }`}
            >
              <Ban className="h-3.5 w-3.5" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredTrainees.map((trainee) => {
            const initials = trainee.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

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
                className={`relative rounded-3xl border transition-all p-4 space-y-3 shadow-xl flex flex-col justify-between ${
                  isBlocked
                    ? "border-slate-800 bg-slate-950/60 opacity-60"
                    : isLead
                    ? "border-rose-500/30 bg-gradient-to-br from-slate-900/80 via-slate-950 to-rose-950/20 hover:border-rose-500/50"
                    : "border-white/10 bg-slate-900/70 hover:border-white/20 hover:bg-slate-900/90"
                }`}
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-3">
                      {/* Avatar with Status Dot */}
                      <div className="relative">
                        <div
                          className={`h-11 w-11 rounded-2xl bg-gradient-to-tr ${trainee.avatarColor} flex items-center justify-center text-sm font-black text-white shadow-md shrink-0`}
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

                      <div>
                        <h3 className="text-sm font-black text-white leading-tight">
                          {trainee.name}
                        </h3>
                        {cleanUsername ? (
                          <a
                            href={telegramChatUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 mt-0.5"
                          >
                            <span>@{cleanUsername}</span>
                            <ExternalLink className="h-2.5 w-2.5 inline" />
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            Без публічного юзернейму
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right side: Tier badge & Dropdown Menu */}
                    <div className="flex items-center gap-1.5">
                      {getTierBadge(trainee)}

                      {/* Dropdown Menu Trigger */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === trainee.id ? null : trainee.id);
                          }}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {/* Dropdown Popover */}
                        {activeMenuId === trainee.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-8 z-30 w-48 rounded-2xl border border-white/15 bg-slate-950 p-1.5 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150"
                          >
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
                              <span>Видалити зі списку</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar in SMT 36 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
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

                  {/* 3 Metrics: Index | Bodyweight | Last Workout Date (smart formatted) */}
                  <div className="grid grid-cols-3 gap-2 p-2 rounded-2xl bg-slate-950/60 border border-white/5 text-center text-[11px]">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Індекс</span>
                      <strong className="text-white font-mono">{trainee.athleticScore}/100</strong>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Вага тіла</span>
                      <strong className="text-white font-mono">{trainee.weightKg} кг</strong>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Останнє заняття</span>
                      <strong className="text-slate-200 font-mono text-[10px] block truncate">
                        {formatSmartDate(trainee.lastWorkoutDate, language)}
                      </strong>
                    </div>
                  </div>

                  {/* Coach Notes (No text cutting, expandable and clean!) */}
                  {trainee.coachNotes && (
                    <div className="rounded-xl border border-white/5 bg-slate-950/60 p-2.5 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-amber-400">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          <span>Замітка тренера:</span>
                        </span>
                        {trainee.coachNotes.length > 60 && (
                          <button
                            type="button"
                            onClick={() => toggleExpandNote(trainee.id)}
                            className="text-[10px] text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
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
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2 mt-2">
                  {cleanUsername ? (
                    <a
                      href={telegramChatUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>Написати</span>
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500 italic">Очікує юзернейм</span>
                  )}

                  <div className="flex items-center gap-2 ml-auto">
                    {isBlocked ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                        onClick={() => unblockTrainee(trainee.id)}
                      >
                        <Unlock className="h-3.5 w-3.5 mr-1" />
                        <span>Розблокувати</span>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs font-bold border-white/15 hover:border-emerald-500/40 hover:text-emerald-300 flex items-center gap-1"
                        onClick={() => handleOpenDetail(trainee)}
                      >
                        <span>Досьє</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Trainee Detail Dossier Modal */}
      <TraineeDetailModal
        trainee={selectedTrainee}
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
      />

      {/* Add New Trainee Dialog */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogHeader>
          <DialogTitle onClose={() => setIsAddModalOpen(false)}>
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-400" />
              <span>Додати нового підопічного</span>
            </div>
          </DialogTitle>
          <DialogDescription>
            Введіть дані атлета для закріплення за програмою СМТ
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateTrainee} className="space-y-3.5 my-2">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Ім'я та Прізвище *
            </label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="наприклад: Артем Шевченко"
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Telegram Username *
            </label>
            <input
              type="text"
              required
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="наприклад: artem_sheva (без @)"
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Початкова вага (кг)
              </label>
              <input
                type="number"
                step="0.5"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Стартовий МКЦ (1-4)
              </label>
              <input
                type="number"
                min="1"
                max="4"
                value={newMicrocycle}
                onChange={(e) => setNewMicrocycle(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Скасувати
            </Button>
            <Button type="submit" variant="accent" size="sm" className="font-bold text-xs">
              Створити підопічного
            </Button>
          </div>
        </form>
      </Dialog>

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
            Ви можете очистити 4 тестові записи підопічних або відновити їх у будь-який момент
          </DialogDescription>
        </DialogHeader>

        <div className="p-3 my-2 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 space-y-2">
          <p>
            • <strong>Очистити всі записи:</strong> залишить список абсолютно чистим, щоб туди потрапляли лише ваші реальні підопічні з каналу.
          </p>
          <p>
            • <strong>Відновити демо:</strong> поверне 4 демонстраційні профілі (Кравченко, Мельник, Ковальчук, Бондаренко) для перевірки інтерфейсу.
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
    </div>
  );
}
