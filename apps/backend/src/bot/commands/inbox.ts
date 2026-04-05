import { escapeMarkdownV2, getMessages, type Locale, t } from "@anonychatmebot/shared"
import type { Bot, Context } from "grammy"
import { allTexts } from "~/bot/utils/locale"
import { createDb } from "~/db/index"
import type { Bindings } from "~/index"
import { MessageRepository } from "~/repositories/message.repository"
import { UserRepository } from "~/repositories/user.repository"
import { buildInboxKeyboard, formatMessageItem } from "~/views/telegram/inbox.view"

const PAGE_SIZE = 5

export function registerInboxCommand(bot: Bot, env: Bindings) {
  async function showInbox(ctx: Context, page: number) {
    if (!ctx.from) return
    const db = createDb(env.DB)
    const user = await new UserRepository(db).findByTelegramId(ctx.from.id)
    const messages = getMessages((user?.locale as Locale) ?? "en")

    if (!user) {
      await ctx.reply(messages.errors.generic)
      return
    }

    const allMessages = await new MessageRepository(db).findByRecipient(user.id)

    if (allMessages.length === 0) {
      await ctx.reply(messages.bot.no_messages, { parse_mode: "MarkdownV2" })
      return
    }

    const totalPages = Math.ceil(allMessages.length / PAGE_SIZE)
    const safePage = Math.max(0, Math.min(page, totalPages - 1))
    const slice = allMessages.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

    const header = t(messages.bot.inbox_header, {
      page: String(safePage + 1),
      total: String(totalPages),
    })

    const items = slice
      .map((msg, i) =>
        formatMessageItem(safePage * PAGE_SIZE + i + 1, escapeMarkdownV2(msg.content), msg.created_at),
      )
      .join("\n\n\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\\-\n\n")

    const keyboard = buildInboxKeyboard(safePage, totalPages)

    await ctx.reply(`${header}\n\n${items}`, {
      parse_mode: "MarkdownV2",
      reply_markup: keyboard.inline_keyboard.length > 0 ? keyboard : undefined,
    })
  }

  const handle = (ctx: Context) => showInbox(ctx, 0)

  bot.hears(allTexts("received"), handle)
  bot.command("inbox", handle)

  bot.callbackQuery(/^inbox:(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery()
    const page = Number(ctx.match[1])
    await showInbox(ctx, page)
  })
}
