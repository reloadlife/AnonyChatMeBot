import type { I18nMessages } from "@anonychatmebot/shared"
import { InlineKeyboard } from "grammy"

export function buildSettingsKeyboard(
  messages: I18nMessages,
  receivingMessages: boolean,
): InlineKeyboard {
  const toggleLabel = receivingMessages
    ? `${messages.settings.receiving_on} · ${messages.settings.toggle_receiving}`
    : `${messages.settings.receiving_off} · ${messages.settings.toggle_receiving}`

  return new InlineKeyboard()
    .text(messages.settings.change_language, "settings:lang")
    .row()
    .text(messages.settings.change_name, "settings:name")
    .row()
    .text(toggleLabel, "settings:toggle_receiving")
}
