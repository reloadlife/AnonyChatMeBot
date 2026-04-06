import { getMessages, type Locale, t } from "@anonychatmebot/shared"
import type { Bot, Context } from "grammy"
import { type MediaType, MessageController } from "~/controllers/message.controller"
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

/** Extract media type + file_id from a Telegram message, if any. */
function extractMedia(ctx: Context): { type: MediaType; fileId: string } | undefined {
  const msg = ctx.message
  if (!msg) return undefined
  if (msg.photo) return { type: "photo", fileId: msg.photo[msg.photo.length - 1].file_id }
  if (msg.video) return { type: "video", fileId: msg.video.file_id }
  if (msg.voice) return { type: "voice", fileId: msg.voice.file_id }
  if (msg.audio) return { type: "audio", fileId: msg.audio.file_id }
  if (msg.document) return { type: "document", fileId: msg.document.file_id }
  if (msg.sticker) return { type: "sticker", fileId: msg.sticker.file_id }
  if (msg.animation) return { type: "animation", fileId: msg.animation.file_id }
  return undefined
}

/** Central send-with-error-handling used by both sending and replying flows. */
async function trySend(
  controller: MessageController,
  ctx: Context,
  messages: ReturnType<typeof getMessages>,
  senderTelegramId: number,
  recipientUserId: number,
  recipientTelegramId: number,
  recipientLocale: string,
  text: string,
  media?: { type: MediaType; fileId: string },
): Promise<boolean> {
  try {
    await controller.sendAnonymousMessage(
      senderTelegramId,
      recipientUserId,
      recipientTelegramId,
      recipientLocale,
      text,
      media,
    )
    return true
  } catch (err) {
    const msg = (err as Error).message
    if (msg === "MESSAGE_TOO_LONG") {
      await ctx.reply(
        t(messages.bot.message_too_long, { max: String(MessageController.MAX_MESSAGE_LENGTH) }),
        { parse_mode: "MarkdownV2" },
      )
    } else if (msg === "RATE_LIMITED") {
      await ctx.reply(messages.bot.rate_limited, { parse_mode: "MarkdownV2" })
    } else if (msg === "MEDIA_TYPE_NOT_ALLOWED") {
      await ctx.reply(messages.bot.media_type_not_allowed, { parse_mode: "MarkdownV2" })
    } else {
      throw err
    }
    return false
  }
}

export function registerMessageHandler(bot: Bot, env: Bindings) {
  // Handle both text and media in active states
  bot.on(
    [
      "message:text",
      "message:photo",
      "message:video",
      "message:voice",
      "message:audio",
      "message:document",
      "message:sticker",
      "message:animation",
    ],
    async (ctx, next) => {
      const from = ctx.from
      const db = createDb(env.DB)
      const userRepo = new UserRepository(db)
      const stateService = new StateService(env.STATE_KV)

      const user = await userRepo.findByTelegramId(from.id)
      const state = await stateService.get(from.id, user)
      const messages = getMessages((user?.locale as Locale) ?? "en")

      // ── asking_recipient: text only ───────────────────────────────────────
      if (state.name === "asking_recipient") {
        const text = ctx.message && "text" in ctx.message ? (ctx.message.text ?? "") : ""
        const hash = extractHash(text)
        const recipientId = decodeId(env.LINK_SALT, hash)

        if (recipientId === null) {
          await ctx.reply(messages.bot.invalid_link, { parse_mode: "MarkdownV2" })
          return
        }

        const recipient = await userRepo.findById(recipientId)
        if (!recipient) {
          await ctx.reply(messages.errors.user_not_found, { parse_mode: "MarkdownV2" })
          return
        }

        if (recipient.id === user?.id) {
          await ctx.reply(messages.bot.cannot_self_message, { parse_mode: "MarkdownV2" })
          return
        }

        await stateService.set(from.id, {
          name: "sending_message",
          recipientId: recipient.id,
          recipientName: recipient.display_name || recipient.username || "someone",
        })
        await ctx.reply(messages.bot.sending_to, { parse_mode: "MarkdownV2" })
        return
      }

      // ── replying_to ────────────────────────────────────────────────────────
      if (state.name === "replying_to") {
        const { senderTelegramId, viewMessageId } = state
        const sender = await userRepo.findByTelegramId(senderTelegramId)

        if (!sender) {
          await stateService.reset(from.id)
          await ctx.reply(messages.errors.user_not_found, { parse_mode: "MarkdownV2" })
          return
        }

        const media = extractMedia(ctx)
        const text =
          ctx.message && "text" in ctx.message
            ? (ctx.message.text ?? "")
            : ctx.message && "caption" in ctx.message
              ? (ctx.message.caption ?? "")
              : ""

        const ok = await trySend(
          new MessageController(env),
          ctx,
          messages,
          from.id,
          sender.id,
          sender.telegram_id,
          sender.locale,
          text,
          media,
        )
        if (!ok) return

        await stateService.reset(from.id)
        await ctx.reply(messages.bot.reply_sent, {
          parse_mode: "MarkdownV2",
          reply_parameters: { message_id: viewMessageId },
        })
        return
      }

      // ── sending_message ────────────────────────────────────────────────────
      if (state.name === "sending_message") {
        const recipient = await userRepo.findById(state.recipientId)
        if (!recipient) {
          await stateService.reset(from.id)
          await ctx.reply(messages.errors.user_not_found, { parse_mode: "MarkdownV2" })
          return
        }

        const media = extractMedia(ctx)
        const text =
          ctx.message && "text" in ctx.message
            ? (ctx.message.text ?? "")
            : ctx.message && "caption" in ctx.message
              ? (ctx.message.caption ?? "")
              : ""

        const ok = await trySend(
          new MessageController(env),
          ctx,
          messages,
          from.id,
          recipient.id,
          recipient.telegram_id,
          recipient.locale,
          text,
          media,
        )
        if (!ok) return

        await stateService.reset(from.id)
        await ctx.reply(messages.bot.message_sent, { parse_mode: "MarkdownV2" })
        return
      }

      return next()
    },
  )
}
