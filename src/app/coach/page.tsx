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
  Filter,
  Plus,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Clock,
  Calendar,
  Sparkles,
  ShieldAlert,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import { useCoachStore, TraineeProfile } from "@/lib/store/useCoachStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { isCoachAccount, MASTER_COACH_USERNAME } from "@/lib/auth/roles";
import { TraineeDetailModal } from "@/components/coach/TraineeDetailModal";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export default function CoachDashboardPage() {
  const {
    trainees,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    addTrainee,
  } = useCoachStore();

  const { userRole, linkedTelegramUser } = useSettingsStore();
  const isCoach = userRole === "coach" || isCoachAccount(linkedTelegramUser?.username, linkedTelegramUser?.id);

  const [selectedTrainee, setSelectedTrainee] = useState<TraineeProfile | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
  const needsAttentionTrainees = trainees.filter((t) => t.status === "needs_attention").length;

  const totalTeamTonnage = useMemo(() => {
    return trainees.reduce((acc, t) => {
      const traineeTotal = t.workoutHistory.reduce((wAcc, w) => wAcc + (w.tonnageKg || 0), 0);
      return acc + traineeTotal;
    }, 0);
  }, [trainees]);

  const averageScore = useMemo(() => {
    if (trainees.length === 0) return 0;
    const sum = trainees.reduce((acc, t) => acc + (t.athleticScore || 0), 0);
    return Math.round(sum / trainees.length);
  }, [trainees]);

  // Filtered trainees
  const filteredTrainees = useMemo(() => {
    return trainees.filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.username.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === "all") return true;
      if (statusFilter === "active") return t.status === "active";
      if (statusFilter === "needs_attention") return t.status === "needs_attention";
      return true;
    });
  }, [trainees, searchQuery, statusFilter]);

  const handleOpenDetail = (trainee: TraineeProfile) => {
    setSelectedTrainee(trainee);
    setIsDetailModalOpen(true);
  };

  const handleCreateTrainee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUsername.trim()) return;

    const colors = [
      "from-blue-500 to-indigo-600",
      "from-emerald-500 to-teal-600",
      "from-purple-500 to-violet-600",
      "from-amber-500 to-orange-600",
      "from-pink-500 to-rose-600",
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
      coachNotes: "Новий підопічний доданий до програми СМТ.",
      workoutHistory: [],
      measurementHistory: [
        {
          id: `m-init-${Date.now()}`,
          date: new Date().toISOString(),
          weightKg: parseFloat(newWeight) || 80,
        },
      ],
    });

    // Reset Form
    setNewName("");
    setNewUsername("");
    setIsAddModalOpen(false);
  };

  const getTierColorStyle = (tierKey: string) => {
    switch (tierKey) {
      case "titan":
        return "bg-amber-500/15 border-amber-500/40 text-amber-300";
      case "iron_pro":
        return "bg-cyan-500/15 border-cyan-500/40 text-cyan-300";
      case "power_master":
        return "bg-emerald-500/15 border-emerald-500/40 text-emerald-300";
      default:
        return "bg-slate-500/15 border-slate-500/40 text-slate-300";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      {/* Top Hero Bar */}
      <div className="relative border-b border-white/10 bg-slate-950/80 backdrop-blur-xl px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/40 text-xs font-black text-amber-300 shadow-sm shadow-amber-500/20">
                  <Crown className="h-3.5 w-3.5 text-amber-400" />
                  <span>КАБІНЕТ ГОЛОВНОГО ТРЕНЕРА</span>
                </span>
                <span className="text-xs text-slate-400">SMT Master Coach</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Підопічні атлети СМТ
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Тренер: <strong className="text-white">Сергій Онищенко</strong> (@{MASTER_COACH_USERNAME})
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="accent"
                size="sm"
                className="font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                onClick={() => setIsAddModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                <span>Додати підопічного</span>
              </Button>

              <Link
                href="/settings"
                className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-colors"
              >
                Налаштування
              </Link>
            </div>
          </div>

          {/* Quick Team KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Атлетів</span>
                <span className="text-base sm:text-lg font-black text-white">{totalTrainees}</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
                <Dumbbell className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Тоннаж команди</span>
                <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">
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
                <span className="text-base sm:text-lg font-black text-amber-300 font-mono">
                  {averageScore}/100
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Увага</span>
                <span className="text-base sm:text-lg font-black text-rose-300 font-mono">
                  {needsAttentionTrainees} {needsAttentionTrainees === 1 ? "атлет" : "атлети"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="mx-auto max-w-5xl px-4 sm:px-8 pt-6 space-y-4">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Пошук підопічного за ім'ям або @telegram..."
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === "all"
                  ? "bg-white/15 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Всі ({totalTrainees})
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === "active"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Активні ({activeTrainees})
            </button>
            <button
              onClick={() => setStatusFilter("needs_attention")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === "needs_attention"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Потребують уваги ({needsAttentionTrainees})
            </button>
          </div>
        </div>

        {/* Trainees Cards Grid */}
        {filteredTrainees.length === 0 ? (
          <div className="p-12 text-center rounded-3xl border border-white/10 bg-slate-900/40 space-y-3">
            <Users className="h-10 w-10 text-slate-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-300">Підопічних не знайдено</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Спробуйте змінити пошуковий запит або додайте першого підопічного.
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
              const telegramChatUrl = `https://t.me/${cleanUsername}`;
              const progressPercent = Math.min(
                100,
                Math.round((trainee.currentWorkoutNumber / 36) * 100)
              );

              return (
                <div
                  key={trainee.id}
                  className="rounded-3xl border border-white/10 bg-slate-900/60 hover:border-white/20 hover:bg-slate-900/80 transition-all p-4 space-y-3 shadow-lg flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header with Avatar & Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-11 w-11 rounded-2xl bg-gradient-to-tr ${trainee.avatarColor} flex items-center justify-center text-sm font-black text-white shadow-md shrink-0`}
                        >
                          {initials}
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-white leading-tight">
                            {trainee.name}
                          </h3>
                          <a
                            href={telegramChatUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 mt-0.5"
                          >
                            <span>@{cleanUsername}</span>
                            <ExternalLink className="h-3 w-3 inline" />
                          </a>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${getTierColorStyle(
                            trainee.tierKey
                          )}`}
                        >
                          {trainee.tierLabel}
                        </span>
                        {trainee.status === "needs_attention" && (
                          <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 flex items-center gap-1">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            <span>Увага</span>
                          </span>
                        )}
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

                    {/* Quick Info Grid */}
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
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Останнє тренування</span>
                        <strong className="text-slate-300 font-mono text-[10px] truncate block">
                          {formatDate(trainee.lastWorkoutDate)}
                        </strong>
                      </div>
                    </div>

                    {/* Coach Notes Preview if exists */}
                    {trainee.coachNotes && (
                      <p className="text-[11px] text-slate-400 line-clamp-1 italic bg-white/5 p-2 rounded-xl">
                        "{trainee.coachNotes}"
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                    <a
                      href={telegramChatUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>Написати</span>
                    </a>

                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs font-bold border-white/15 hover:border-emerald-500/40 hover:text-emerald-300 flex items-center gap-1 ml-auto"
                      onClick={() => handleOpenDetail(trainee)}
                    >
                      <span>Досьє</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Trainee Detail Modal */}
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
    </div>
  );
}
