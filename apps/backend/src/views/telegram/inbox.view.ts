import type { I18nMessages } from "@anonychatmebot/shared"
import { InlineKeyboard } from "grammy"

/** Returns a human-readable relative time string for a given ISO timestamp. */
export function relativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return "< 1 min ago"
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDays = Math.floor(diffHr / 24)
  return `${diffDays}d ago`
}

/**
 * Format a single inbox item line for MarkdownV2.
 * content must already be escaped by the caller via escapeMarkdownV2().
 * Template: "#{n}  {content}\n🕐 {ago}"
 */
export function formatMessageItem(n: number, content: string, createdAt: string): string {
  return `\`#${n}\`  ${content}\n🕐 _${relativeTime(createdAt)}_`
}

/**
 * Build the pagination inline keyboard with i18n'd button labels.
 * Omits Prev on page 0, omits Next on last page.
 */
export function buildInboxKeyboard(
  page: number,
  totalPages: number,
  messages: I18nMessages,
): InlineKeyboard {
  const kb = new InlineKeyboard()
  if (page > 0) kb.text(messages.inbox.prev, `inbox:${page - 1}`)
  if (page < totalPages - 1) kb.text(messages.inbox.next, `inbox:${page + 1}`)
  return kb
}
