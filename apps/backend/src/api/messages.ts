import { Hono } from "hono"
import { MessageController } from "~/controllers/message.controller"
import { BlockRepository } from "~/repositories/block.repository"
import { MessageRepository } from "~/repositories/message.repository"
import { UserRepository } from "~/repositories/user.repository"
import { serializeMessage } from "~/serializers/message.serializer"
import type { AppEnv } from "./context"

export const messagesRouter = new Hono<AppEnv>()

messagesRouter.get("/:userId", async (c) => {
  const userId = Number(c.req.param("userId"))
  if (Number.isNaN(userId)) return c.json({ error: "Invalid user ID" }, 400)

  const db = c.get("db")
  const messages = await new MessageRepository(db).findByRecipient(userId)
  return c.json({ messages: messages.map(serializeMessage) })
})

messagesRouter.post("/send", async (c) => {
  const body = await c.req.json<{
    senderTelegramId: number
    recipientUserId: number
    content: string
  }>()

  const content = body.content?.trim()
  if (!content) return c.json({ error: "Message content is required" }, 400)
  if (content.length > MessageController.MAX_MESSAGE_LENGTH) {
    return c.json(
      { error: `Message too long (max ${MessageController.MAX_MESSAGE_LENGTH} chars)` },
      400,
    )
  }

  const db = c.get("db")
  const userRepo = new UserRepository(db)

  const recipient = await userRepo.findById(body.recipientUserId)
  if (!recipient) return c.json({ error: "Recipient not found" }, 404)
  if (!recipient.receiving_messages)
    return c.json({ error: "Recipient is not accepting messages" }, 403)

  // Prevent self-messaging
  const sender = await userRepo.findByTelegramId(body.senderTelegramId)
  if (sender && sender.id === recipient.id) {
    return c.json({ error: "Cannot send a message to yourself" }, 400)
  }

  // Respect block list
  const isBlocked = await new BlockRepository(db).isBlocked(recipient.id, body.senderTelegramId)
  if (isBlocked) return c.json({ error: "Recipient not found" }, 404) // don't leak block status

  const controller = new MessageController(c.env)
  try {
    const message = await controller.sendAnonymousMessage(
      body.senderTelegramId,
      recipient.id,
      recipient.telegram_id,
      recipient.locale,
      content,
    )
    return c.json({ message }, 201)
  } catch {
    return c.json({ error: "Failed to send message" }, 500)
  }
})
