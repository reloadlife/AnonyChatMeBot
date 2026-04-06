import { escapeMarkdownV2, getMessages, t } from "@anonychatmebot/shared"
import type { Bot, Context } from "grammy"
import { createDb } from "~/db/index"
import type { Bindings } from "~/index"
import { MessageRepository } from "~/repositories/message.repository"
import { ReportRepository } from "~/repositories/report.repository"

export function registerAdminCommand(bot: Bot, env: Bindings) {
  const isAdmin = (ctx: Context) => ctx.from && String(ctx.from.id) === env.ADMIN_TELEGRAM_ID

  bot.command("admin", async (ctx) => {
    if (!isAdmin(ctx)) return

    const db = createDb(env.DB)
    const reportRepo = new ReportRepository(db)
    const messageRepo = new MessageRepository(db)
    const msgs = getMessages("en")

    const reports = await reportRepo.listPending()

    if (reports.length === 0) {
      await ctx.reply(msgs.bot.admin_no_reports, { parse_mode: "MarkdownV2" })
      return
    }

    for (let i = 0; i < Math.min(reports.length, 10); i++) {
      const report = reports[i]
      const message = await messageRepo.findById(report.message_id)
      const content = message?.content
        ? escapeMarkdownV2(message.content.slice(0, 200))
        : `\\[${message?.media_type ?? "unknown"}\\]`

      await ctx.reply(t(msgs.bot.admin_report_item, { n: String(i + 1), content }), {
        parse_mode: "MarkdownV2",
      })
    }
  })

  // Dismiss a report
  bot.callbackQuery(/^dismiss_report:(\d+)$/, async (ctx) => {
    if (!isAdmin(ctx)) return ctx.answerCallbackQuery()
    const reportId = Number(ctx.match[1])
    const db = createDb(env.DB)
    await new ReportRepository(db).dismiss(reportId)
    await ctx.answerCallbackQuery({ text: "Dismissed." })
    await ctx.editMessageReplyMarkup({ reply_markup: undefined })
  })
}
