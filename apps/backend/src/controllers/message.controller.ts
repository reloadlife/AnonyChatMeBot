export type TooLongError = Error & { max: number }

export type MediaType = "photo" | "video" | "voice" | "audio" | "document" | "sticker" | "animation"

import { createDb } from "~/db/index"
import type { Bindings } from "~/index"
import type { MessageJob } from "~/queues/message.queue"
import { MessageRepository } from "~/repositories/message.repository"
import { UserRepository } from "~/repositories/user.repository"
import { serializeMessage } from "~/serializers/message.serializer"
import { isMediaTypeAllowed } from "~/utils/media-prefs"
import { checkRateLimit } from "~/utils/rate-limit"

export class MessageController {
  private readonly messageRepo: MessageRepository
  private readonly userRepo: UserRepository

  constructor(private readonly env: Bindings) {
    const db = createDb(env.DB)
    this.messageRepo = new MessageRepository(db)
    this.userRepo = new UserRepository(db)
  }

  static readonly MAX_MESSAGE_LENGTH = 4000

  async sendAnonymousMessage(
    senderTelegramId: number,
    recipientUserId: number,
    recipientTelegramId: number,
    recipientLocale: string,
    content: string,
    media?: { type: MediaType; fileId: string },
  ) {
    if (!media && content.length > MessageController.MAX_MESSAGE_LENGTH) {
      const err = new Error("MESSAGE_TOO_LONG")
      ;(err as TooLongError).max = MessageController.MAX_MESSAGE_LENGTH
      throw err
    }

    // Rate limit: max 5 messages per sender per recipient per minute
    const { allowed } = await checkRateLimit(this.env.STATE_KV, senderTelegramId, recipientUserId)
    if (!allowed) throw new Error("RATE_LIMITED")

    const recipient = await this.userRepo.findById(recipientUserId)
    if (!recipient) throw new Error("Recipient not found")

    if (media && !isMediaTypeAllowed(recipient, media.type)) {
      throw new Error("MEDIA_TYPE_NOT_ALLOWED")
    }

    const message = await this.messageRepo.create({
      sender_telegram_id: senderTelegramId,
      recipient_user_id: recipientUserId,
      content,
      media_type: media?.type ?? null,
      file_id: media?.fileId ?? null,
    })

    const job: MessageJob = {
      messageId: message.id,
      recipientTelegramId,
      recipientUserId,
      recipientLocale,
      senderTelegramId,
      content,
      mediaType: media?.type,
      fileId: media?.fileId,
    }
    await this.env.MESSAGE_QUEUE.send(job)

    return serializeMessage(message)
  }

  async getMessagesForUser(recipientUserId: number) {
    const messages = await this.messageRepo.findByRecipient(recipientUserId)
    return messages.map(serializeMessage)
  }
}
