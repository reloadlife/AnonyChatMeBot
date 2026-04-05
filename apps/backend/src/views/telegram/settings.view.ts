import { t, type I18nMessages } from "@anonychatmebot/shared"
import { InlineKeyboard } from "grammy"

export function buildSettingsKeyboard(
  messages: I18nMessages,
  receivingMessages: boolean,
  blockedCount: number,
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
    .row()
    .text(t(messages.settings.blocked_senders, { n: String(blockedCount) }), "settings:blocked")
}

export function buildBlockedListKeyboard(blockedTelegramIds: number[]): InlineKeyboard {
  const kb = new InlineKeyboard()
  for (const telegramId of blockedTelegramIds) {
    kb.text(`🗑 ${telegramId}`, `unblock:${telegramId}`).row()
  }
  return kb
}
