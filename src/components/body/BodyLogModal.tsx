"use client";

import React, { useState, useEffect } from "react";
import { Ruler, Save } from "lucide-react";
import { BodyMeasurement } from "@/types/body";
import { useBodyStore } from "@/lib/store/useBodyStore";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/lib/i18n";

interface BodyLogModalProps {
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  initialData?: BodyMeasurement | null;
}

export function BodyLogModal({
  open,
  isOpen,
  onOpenChange,
  onClose,
  initialData,
}: BodyLogModalProps) {
  const { addMeasurement, updateMeasurement } = useBodyStore();
  const { t } = useTranslation();

  const isModalOpen = open ?? isOpen ?? false;
  const handleClose = () => {
    onOpenChange?.(false);
    onClose?.();
  };

  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [weightKg, setWeightKg] = useState("80.0");
  const [chestCm, setChestCm] = useState("");
  const [waistCm, setWaistCm] = useState("");
  const [hipsCm, setHipsCm] = useState("");
  const [bicepsCm, setBicepsCm] = useState("");
  const [thighCm, setThighCm] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (initialData) {
      setDate(initialData.date);
      setWeightKg(initialData.weightKg ? String(initialData.weightKg) : "");
      setChestCm(initialData.chestCm ? String(initialData.chestCm) : "");
      setWaistCm(initialData.waistCm ? String(initialData.waistCm) : "");
      setHipsCm(initialData.hipsCm ? String(initialData.hipsCm) : "");
      setBicepsCm(initialData.bicepsCm ? String(initialData.bicepsCm) : "");
      setThighCm(initialData.thighCm ? String(initialData.thighCm) : "");
      setNotes(initialData.notes || "");
    } else {
      setDate(new Date().toISOString().split("T")[0]);
      setNotes("");
    }
  }, [initialData, isModalOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      date,
      weightKg: parseFloat(weightKg) || 0,
      chestCm: chestCm ? parseFloat(chestCm) : undefined,
      waistCm: waistCm ? parseFloat(waistCm) : undefined,
      hipsCm: hipsCm ? parseFloat(hipsCm) : undefined,
      bicepsCm: bicepsCm ? parseFloat(bicepsCm) : undefined,
      thighCm: thighCm ? parseFloat(thighCm) : undefined,
      notes: notes.trim() || undefined,
    };

    if (initialData) {
      updateMeasurement(initialData.id, payload);
    } else {
      addMeasurement(payload);
    }
    handleClose();
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={(val) => { if (!val) handleClose(); else onOpenChange?.(true); }}>
      <DialogHeader>
        <DialogTitle onClose={handleClose}>
          <div className="flex items-center gap-2">
            <Ruler className="h-6 w-6 text-emerald-400" />
            <span>{initialData ? t.body.editRecord : t.body.addRecord}</span>
          </div>
        </DialogTitle>
        <DialogDescription>
          {t.body.subtitle}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-3.5 my-2">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">{t.body.date}</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              {t.body.weight} ({t.common.kg}) <span className="text-emerald-400">*</span>
            </label>
            <Input
              type="number"
              step="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="80.0"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400">{t.body.waist} (см)</label>
            <Input
              type="number"
              step="0.5"
              value={waistCm}
              onChange={(e) => setWaistCm(e.target.value)}
              placeholder="84"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-400">{t.body.chest} (см)</label>
            <Input
              type="number"
              step="0.5"
              value={chestCm}
              onChange={(e) => setChestCm(e.target.value)}
              placeholder="104"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-400">{t.body.biceps} (см)</label>
            <Input
              type="number"
              step="0.5"
              value={bicepsCm}
              onChange={(e) => setBicepsCm(e.target.value)}
              placeholder="38"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-400">{t.body.hips} (см)</label>
            <Input
              type="number"
              step="0.5"
              value={hipsCm}
              onChange={(e) => setHipsCm(e.target.value)}
              placeholder="98"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-400">{t.body.thigh} (см)</label>
            <Input
              type="number"
              step="0.5"
              value={thighCm}
              onChange={(e) => setThighCm(e.target.value)}
              placeholder="59"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300">{t.body.notes}</label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="..."
          />
        </div>

        <div className="pt-3">
          <Button variant="accent" size="lg" type="submit" className="w-full font-bold">
            <Save className="h-4 w-4 mr-2" />
            <span>{t.common.save}</span>
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
