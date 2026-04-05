import { Hono } from "hono"
import { MessageController } from "~/controllers/message.controller"
import type { Bindings } from "~/index"

export const messageRoutes = new Hono<{ Bindings: Bindings }>()

messageRoutes.get("/:userId", async (c) => {
  const userId = Number(c.req.param("userId"))
  if (Number.isNaN(userId)) return c.json({ error: "Invalid user ID" }, 400)

  const controller = new MessageController(c.env)
  const messages = await controller.getMessagesForUser(userId)
  return c.json({ messages })
})

messageRoutes.post("/send", async (c) => {
  const body = await c.req.json<{
    senderTelegramId: number
    recipientUserId: number
    content: string
  }>()

  if (!body.content?.trim()) {
    return c.json({ error: "Message content is required" }, 400)
  }

  const controller = new MessageController(c.env)
  const message = await controller.sendAnonymousMessage(
    body.senderTelegramId,
    body.recipientUserId,
    body.content.trim(),
  )
  return c.json({ message }, 201)
})
