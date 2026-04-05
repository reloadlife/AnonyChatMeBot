import { getMessages, type I18nMessages, type Locale } from "@anonychatmebot/shared"

export const ALL_LOCALES: Locale[] = ["en", "fa", "ru", "de", "fr", "ar"]

/** Returns every locale's translation for a given menu key. */
export function allTexts(key: keyof I18nMessages["menu"]): string[] {
  return ALL_LOCALES.map((locale) => getMessages(locale).menu[key])
}
