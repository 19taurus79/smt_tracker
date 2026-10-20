"use client";

import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { ukDict } from "./uk";
import { enDict } from "./en";
import { ruDict } from "./ru";
import { TranslationDict } from "./types";
import { AppLanguage } from "@/types/body";

const dicts: Record<AppLanguage, TranslationDict> = {
  uk: ukDict,
  en: enDict,
  ru: ruDict,
};

export function getDictionary(lang: AppLanguage = "uk"): TranslationDict {
  return dicts[lang] || ukDict;
}

export function useTranslation() {
  const { language, setLanguage } = useSettingsStore();
  const currentLang = language || "uk";
  const t = dicts[currentLang] || ukDict;

  return {
    t,
    language: currentLang,
    setLanguage,
  };
}

export * from "./types";
