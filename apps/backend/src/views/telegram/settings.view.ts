import { type I18nMessages, t } from "@anonychatmebot/shared"
import { InlineKeyboard } from "grammy"
import type { MediaType } from "~/controllers/message.controller"
import { parseAllowedMediaTypes } from "~/utils/media-prefs"

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
    .text(messages.settings.media_types, "settings:media")
    .row()
    .text(t(messages.settings.blocked_senders, { n: String(blockedCount) }), "settings:blocked")
}

export function buildMediaSettingsKeyboard(
  messages: I18nMessages,
  allowedMediaTypes: string | null,
): InlineKeyboard {
  const allowed = parseAllowedMediaTypes(allowedMediaTypes)
  const kb = new InlineKeyboard()

  const mediaLabels: Record<MediaType, string> = {
    photo: messages.settings.media_photo,
    video: messages.settings.media_video,
    voice: messages.settings.media_voice,
    audio: messages.settings.media_audio,
    document: messages.settings.media_document,
    sticker: messages.settings.media_sticker,
    animation: messages.settings.media_animation,
  }

  // Two columns layout
  const pairs: [MediaType, MediaType | null][] = [
    ["photo", "video"],
    ["voice", "audio"],
    ["document", "sticker"],
    ["animation", null],
  ]

  for (const [left, right] of pairs) {
    const leftOn = allowed === null || allowed.has(left)
    kb.text(`${leftOn ? "✅" : "❌"} ${mediaLabels[left]}`, `settings:media:${left}`)
    if (right) {
      const rightOn = allowed === null || allowed.has(right)
      kb.text(`${rightOn ? "✅" : "❌"} ${mediaLabels[right]}`, `settings:media:${right}`)
    }
    kb.row()
  }

  kb.text(messages.settings.back, "settings:back")
  return kb
}

export function buildBlockedListKeyboard(blockedTelegramIds: number[]): InlineKeyboard {
  const kb = new InlineKeyboard()
  for (const telegramId of blockedTelegramIds) {
    kb.text(`🗑 ${telegramId}`, `unblock:${telegramId}`).row()
  }
  return kb
}
