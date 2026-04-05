import type { I18nMessages } from "@anonychatmebot/shared"
import { InlineKeyboard } from "grammy"

export function buildSettingsKeyboard(messages: I18nMessages): InlineKeyboard {
  return new InlineKeyboard()
    .text(messages.settings.change_language, "settings:lang")
    .row()
    .text(messages.settings.change_name, "settings:name")
}
