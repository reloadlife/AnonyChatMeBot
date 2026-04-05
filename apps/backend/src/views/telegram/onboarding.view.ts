import type { Locale } from "@anonychatmebot/shared"
import { InlineKeyboard, Keyboard } from "grammy"

export const LOCALE_OPTIONS: { locale: Locale; flag: string; label: string }[] = [
  { locale: "en", flag: "🇬🇧", label: "English" },
  { locale: "fa", flag: "🇮🇷", label: "فارسی" },
  { locale: "ru", flag: "🇷🇺", label: "Русский" },
  { locale: "de", flag: "🇩🇪", label: "Deutsch" },
  { locale: "fr", flag: "🇫🇷", label: "Français" },
  { locale: "ar", flag: "🇸🇦", label: "العربية" },
]

/** Inline keyboard for step 1 — locale selection. 2 columns. */
export function buildLocaleSelector(): InlineKeyboard {
  const kb = new InlineKeyboard()
  LOCALE_OPTIONS.forEach(({ locale, flag, label }, i) => {
    kb.text(`${flag} ${label}`, `locale:${locale}`)
    if (i % 2 === 1) kb.row()
  })
  return kb
}

/** Reply keyboard for step 2 — name entry. Shows Telegram name as a one-tap option. */
export function buildNameRequestKeyboard(telegramName: string): Keyboard {
  return new Keyboard().text(telegramName).resized().oneTime()
}
