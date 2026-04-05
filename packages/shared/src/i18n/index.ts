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
  }
  errors: {
    generic: string
    not_found: string
    user_not_found: string
  }
}

// Parsed once at module init — no runtime filesystem access, safe in Workers
const messages: Record<Locale, I18nMessages> = {
  en: yaml.load(enRaw) as I18nMessages,
  fa: yaml.load(faRaw) as I18nMessages,
  ru: yaml.load(ruRaw) as I18nMessages,
  de: yaml.load(deRaw) as I18nMessages,
  fr: yaml.load(frRaw) as I18nMessages,
  ar: yaml.load(arRaw) as I18nMessages,
}

export function getMessages(locale: Locale = "en"): I18nMessages {
  return messages[locale]
}

/** Replace {name} style placeholders in a translation string. */
export function t(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`)
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
