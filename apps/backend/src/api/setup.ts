import { Hono } from "hono"
import { getOrInitBot } from "~/bot/index"
import { syncBotCommands } from "~/bot/setup"
import type { AppEnv } from "./context"

export const setupRouter = new Hono<AppEnv>()

/**
 * POST /api/setup
 *
 * Registers the Telegram webhook and syncs bot commands.
 * Call once after every deploy:
 *   curl -X POST https://<worker-url>/api/setup
 *
 * The webhook URL is derived from the incoming request host so this works
 * across preview deployments and custom domains without configuration.
 */
setupRouter.post("/", async (c) => {
  const bot = await getOrInitBot(c.env.BOT_TOKEN, c.env)

  const { protocol, host } = new URL(c.req.url)
  const webhookUrl = `${protocol}//${host}/webhook`

  await bot.api.setWebhook(webhookUrl, {
    // Only subscribe to what the bot actually uses.
    // Omitting a type means Telegram won't send those updates, reducing noise.
    allowed_updates: ["message", "callback_query"],
  })

  await syncBotCommands(bot.api)

  return c.json({ ok: true, webhook: webhookUrl })
})
