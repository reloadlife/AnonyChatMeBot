import { getMessages } from "@anonychatmebot/shared"
import type { Bot } from "grammy"
import { MessageController } from "../../controllers/message.controller"
import type { Bindings } from "../../index"

export function registerMessageHandler(bot: Bot, env: Bindings) {
  // Handle incoming text messages — treated as anonymous messages to a recipient
  bot.on("message:text", async (ctx) => {
    const senderTelegramId = ctx.from.id

    // The recipient is stored in session/state — placeholder for now
    // In the real flow: user taps a link like t.me/bot?start=<recipientId>
    // and we store the target in session before this handler fires
    const recipientUserId = Number(ctx.match ?? 0)
    if (!recipientUserId) {
      const t = getMessages("en") // TODO: use user locale from DB
      await ctx.reply(t.bot.send_message_prompt)
      return
    }

    const controller = new MessageController(env)
    await controller.sendAnonymousMessage(senderTelegramId, recipientUserId, ctx.message.text)

    const t = getMessages("en")
    await ctx.reply(t.bot.message_sent)
  })
}
