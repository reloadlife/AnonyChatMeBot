import { webhookCallback } from "grammy"
import { Hono } from "hono"
import { createBot } from "./bot/index"
import { messageRoutes } from "./views/api/message.routes"

export type Bindings = {
  DB: D1Database
  BUCKET: R2Bucket
  MESSAGE_QUEUE: Queue
  BOT_TOKEN: string
  WEBHOOK_SECRET: string
  ENVIRONMENT: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.get("/", (c) => c.json({ status: "ok", service: "AnonyChatMeBot" }))

// Telegram webhook (production only — dev uses long-polling via scripts/dev-bot.ts)
app.post("/webhook", async (c) => {
  const bot = createBot(c.env.BOT_TOKEN, c.env)
  const handler = webhookCallback(bot, "cloudflare-mod")
  return handler(c.req.raw)
})

app.route("/api/messages", messageRoutes)

export default {
  fetch: app.fetch,

  async queue(batch: MessageBatch<{ messageId: number }>, env: Bindings): Promise<void> {
    const { handleMessageQueue } = await import("./queues/message.queue")
    await handleMessageQueue(batch, env)
  },
}
