import yaml from "js-yaml"
import arRaw from "./locales/ar.yaml"
import deRaw from "./locales/de.yaml"
import enRaw from "./locales/en.yaml"
import faRaw from "./locales/fa.yaml"
import frRaw from "./locales/fr.yaml"
import ruRaw from "./locales/ru.yaml"

export type Locale = "en" | "fa" | "ru" | "de" | "fr" | "ar"

export interface I18nMessages {
  bot: {
    welcome: string
    welcome_back: string
    your_link: string
    link_hint: string
    send_message_prompt: string
    message_sent: string
    message_received: string
    no_messages: string
    sending_to: string
    ask_recipient: string
    invalid_link: string
    cannot_self_message: string
    inbox_header: string
    inbox_item: string
    new_message_notification: string
    message_read_receipt: string
    reply_prompt: string
    reply_sent: string
    blocked: string
    reported: string
    not_accepting_messages: string
    message_not_found: string
    sender_blocked: string
    cancel: string
    nothing_to_cancel: string
    inbox_unread: string
    rate_limited: string
    message_too_long: string
    name_invalid: string
  }
  actions: {
    view: string
    reply: string
    block: string
    report: string
  }
  onboarding: {
    select_locale: string
    enter_name: string
  }
  menu: {
    receive_messages: string
    send_direct: string
    received: string
    settings: string
    help: string
  }
  commands: {
    link: string
    send: string
    inbox: string
    settings: string
    help: string
    cancel: string
  }
  inbox: {
    prev: string
    next: string
    view_n: string
    time_just_now: string
    time_minutes_ago: string
    time_hours_ago: string
    time_days_ago: string
  }
  settings: {
    title: string
    change_language: string
    change_name: string
    name_updated: string
    language_updated: string
    receiving_on: string
    receiving_off: string
    toggle_receiving: string
    blocked_senders: string
    no_blocked: string
    unblocked: string
  }
  help: {
    text: string
  }
  errors: {
    generic: string
    not_found: string
    user_not_found: string
  }
}

// Wrangler (Workers) imports YAML as raw text strings via [[rules]] type="Text".
// Bun imports YAML as pre-parsed JS objects. Handle both runtimes.
function parseLocale(raw: unknown): I18nMessages {
  if (typeof raw === "string") return yaml.load(raw) as I18nMessages
  return raw as I18nMessages
}

const messages: Record<Locale, I18nMessages> = {
  en: parseLocale(enRaw),
  fa: parseLocale(faRaw),
  ru: parseLocale(ruRaw),
  de: parseLocale(deRaw),
  fr: parseLocale(frRaw),
  ar: parseLocale(arRaw),
}

export function getMessages(locale: Locale = "en"): I18nMessages {
  return messages[locale]
}

/** Replace {name} style placeholders in a translation string. */
export function t(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`)
}

/**
 * Escapes all MarkdownV2 special characters in a plain-text string.
 * Use this before inserting any user-provided content into a MarkdownV2 template.
 */
export function escapeMarkdownV2(text: string): string {
  return text.replace(/[_*[\]()~`>#+=|{}.!\-\\]/g, "\\$&")
}

/** Map Telegram language_code to a supported Locale. */
export function resolveLocale(languageCode: string | undefined): Locale {
  if (languageCode?.startsWith("fa")) return "fa"
  if (languageCode?.startsWith("ru")) return "ru"
  if (languageCode?.startsWith("de")) return "de"
  if (languageCode?.startsWith("fr")) return "fr"
  if (languageCode?.startsWith("ar")) return "ar"
  return "en"
}
