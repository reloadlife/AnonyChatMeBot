import { getMessages, type Locale } from "@anonychatmebot/shared"
import type { Api } from "grammy"
import type { BotCommand } from "grammy/types"

const ALL_LOCALES: Locale[] = ["en", "fa", "ru", "de", "fr", "ar"]

function buildCommands(locale: Locale): BotCommand[] {
  const m = getMessages(locale)
  return [
    { command: "link", description: m.commands.link },
    { command: "send", description: m.commands.send },
    { command: "inbox", description: m.commands.inbox },
    { command: "settings", description: m.commands.settings },
    { command: "cancel", description: m.commands.cancel },
    { command: "stats", description: m.commands.stats },
    { command: "help", description: m.commands.help },
  ]
}

function commandsEqual(a: BotCommand[], b: BotCommand[]): boolean {
  if (a.length !== b.length) return false
  return a.every((cmd, i) => cmd.command === b[i].command && cmd.description === b[i].description)
}

/**
 * Syncs bot commands with Telegram for every supported locale.
 *
 * Strategy:
 *   - English is set twice: as the default (no language_code) and explicitly
 *     as "en", so it covers all users regardless of client language.
 *   - Every other locale is set with its own language_code.
 *   - getMyCommands is called first; setMyCommands is skipped when nothing changed.
 */
export async function syncBotCommands(api: Api): Promise<void> {
  const enCommands = buildCommands("en")

  // Default scope — shown to users whose language has no specific commands set
  const defaultCurrent = await api.getMyCommands({})
  if (!commandsEqual(defaultCurrent, enCommands)) {
    await api.setMyCommands(enCommands)
    console.log("[setup] Updated default commands")
  } else {
    console.log("[setup] Default commands unchanged")
  }

  // Per-locale (EN is included here too so it's explicit)
  for (const locale of ALL_LOCALES) {
    const desired = buildCommands(locale)
    const current = await api.getMyCommands({ language_code: locale })
    if (!commandsEqual(current, desired)) {
      await api.setMyCommands(desired, { language_code: locale })
      console.log(`[setup] Updated commands for locale: ${locale}`)
    } else {
      console.log(`[setup] Commands for ${locale} unchanged`)
    }
  }
}
