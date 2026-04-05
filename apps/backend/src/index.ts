import { webhookCallback } from "grammy"
import { Hono } from "hono"
import { api } from "~/api/index"
import { getOrInitBot } from "~/bot/index"

export type Bindings = {
  DB: D1Database
  BUCKET: R2Bucket
  MESSAGE_QUEUE: Queue
  STATE_KV: KVNamespace
  BOT_TOKEN: string
  WEBHOOK_SECRET: string
  LINK_SALT: string
  ENVIRONMENT: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.get("/", (c) => c.json({ status: "ok", service: "AnonyChatMeBot" }))

app.post("/webhook", async (c) => {
  const bot = await getOrInitBot(c.env.BOT_TOKEN, c.env)
  const handler = webhookCallback(bot, "cloudflare-mod")
  return handler(c.req.raw)
})

app.route("/api", api)

export default {
  fetch: app.fetch,

  async queue(batch: MessageBatch<unknown>, env: Bindings): Promise<void> {
    const { handleMessageQueue } = await import("~/queues/message.queue")
    // biome-ignore lint/suspicious/noExplicitAny: queue batch is typed at send time
    await handleMessageQueue(batch as any, env)
  },
}
