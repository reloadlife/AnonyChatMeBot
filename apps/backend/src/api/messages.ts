import { Hono } from "hono"
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

  if (!body.content?.trim()) return c.json({ error: "Message content is required" }, 400)

  const db = c.get("db")
  const userRepo = new UserRepository(db)

  const recipient = await userRepo.findById(body.recipientUserId)
  if (!recipient) return c.json({ error: "Recipient not found" }, 404)

  const message = await new MessageRepository(db).create({
    sender_telegram_id: body.senderTelegramId,
    recipient_user_id: body.recipientUserId,
    content: body.content.trim(),
  })

  await c.env.MESSAGE_QUEUE.send({
    messageId: message.id,
    recipientTelegramId: recipient.telegram_id,
    recipientLocale: recipient.locale,
    content: body.content.trim(),
  })

  return c.json({ message: serializeMessage(message) }, 201)
})
