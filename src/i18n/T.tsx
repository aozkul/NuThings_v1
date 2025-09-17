"use client";
import {useI18n} from "@/src/i18n/provider";

export default function T({k}: { k: string }) {
  const {t} = useI18n();
  return <>{t("common", k)}</>;
}
