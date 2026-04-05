import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import yaml from "js-yaml"

export type Locale = "en" | "fa"

export interface I18nMessages {
  bot: {
    welcome: string
    send_message_prompt: string
    message_sent: string
    message_received: string
  }
  errors: {
    generic: string
    not_found: string
  }
}

const cache = new Map<Locale, I18nMessages>()

export function getMessages(locale: Locale = "en"): I18nMessages {
  const cached = cache.get(locale)
  if (cached) return cached
  // Standard ESM path resolution — works in Bun and Node.js
  const filePath = fileURLToPath(new URL(`./locales/${locale}.yaml`, import.meta.url))
  const file = readFileSync(filePath, "utf8")
  const messages = yaml.load(file) as I18nMessages
  cache.set(locale, messages)
  return messages
}
