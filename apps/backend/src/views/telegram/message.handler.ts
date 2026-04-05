import { getMessages, type Locale } from "@anonychatmebot/shared"
import type { Bot } from "grammy"
import { MessageController } from "~/controllers/message.controller"
import { createDb } from "~/db/index"
import type { Bindings } from "~/index"
import { UserRepository } from "~/repositories/user.repository"
import { StateService } from "~/services/state.service"
import { decodeId } from "~/utils/hashid"

/** Extract the hashid from a pasted t.me deep-link or a bare hash string. */
function extractHash(text: string): string {
  try {
    const url = new URL(text.trim())
    return url.searchParams.get("start") ?? text.trim()
  } catch {
    return text.trim()
  }
}

export function registerMessageHandler(bot: Bot, env: Bindings) {
  bot.on("message:text", async (ctx, next) => {
    const from = ctx.from
    const db = createDb(env.DB)
    const userRepo = new UserRepository(db)
    const stateService = new StateService(env.STATE_KV)

    const user = await userRepo.findByTelegramId(from.id)
    const state = await stateService.get(from.id, user)
    const messages = getMessages((user?.locale as Locale) ?? "en")

    // ── asking_recipient: user should paste a link ─────────────────────────
    if (state.name === "asking_recipient") {
      const hash = extractHash(ctx.message.text)
      const recipientId = decodeId(env.LINK_SALT, hash)

      if (recipientId === null) {
        await ctx.reply(messages.bot.invalid_link)
        return
      }

      const recipient = await userRepo.findById(recipientId)
      if (!recipient) {
        await ctx.reply(messages.errors.user_not_found)
        return
      }

      if (recipient.id === user?.id) {
        await ctx.reply(messages.bot.cannot_self_message)
        return
      }

      await stateService.set(from.id, {
        name: "sending_message",
        recipientId: recipient.id,
        recipientName: recipient.display_name || recipient.username || "someone",
      })
      await ctx.reply(messages.bot.sending_to)
      return
    }

    // ── replying_to: deliver a reply to the original sender ─────────────────
    if (state.name === "replying_to") {
      const { senderTelegramId, viewMessageId } = state
      const sender = await userRepo.findByTelegramId(senderTelegramId)

      if (sender) {
        const controller = new MessageController(env)
        await controller.sendAnonymousMessage(
          from.id,
          sender.id,
          sender.telegram_id,
          sender.locale,
          ctx.message.text,
        )
      }

      await stateService.reset(from.id)
      await ctx.reply(messages.bot.reply_sent, {
        reply_parameters: { message_id: viewMessageId },
      })
      return
    }

    // ── sending_message: deliver the anonymous message ──────────────────────
    if (state.name === "sending_message") {
      const recipient = await userRepo.findById(state.recipientId)
      if (!recipient) {
        await stateService.reset(from.id)
        await ctx.reply(messages.errors.user_not_found)
        return
      }

      const controller = new MessageController(env)
      await controller.sendAnonymousMessage(
        from.id,
        recipient.id,
        recipient.telegram_id,
        recipient.locale,
        ctx.message.text,
      )

      await stateService.reset(from.id)
      await ctx.reply(messages.bot.message_sent)
      return
    }

    // Not in any active messaging state — pass to next handler
    return next()
  })
}
