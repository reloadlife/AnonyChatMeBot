import { Bot } from "grammy"
import { registerCancelCommand } from "~/bot/commands/cancel"
import { registerHelpCommand } from "~/bot/commands/help"
import { registerInboxCommand } from "~/bot/commands/inbox"
import { registerLinkCommand } from "~/bot/commands/link"
import { registerSendCommand } from "~/bot/commands/send"
import { registerSettingsCommand } from "~/bot/commands/settings"
import { registerStartCommand } from "~/bot/commands/start"
import { registerFallbackHandler } from "~/bot/handlers/fallback.handler"
import { registerMessageActionsHandler } from "~/bot/handlers/message-actions.handler"
import { registerOnboardingHandlers } from "~/bot/handlers/onboarding"
import type { Bindings } from "~/index"
import { registerMessageHandler } from "~/views/telegram/message.handler"

/**
 * Module-level bot cache.
 *
 * Cloudflare Workers share module-scope variables within the same isolate
 * instance, so this survives across requests in the same warm isolate.
 * On cold starts the bot re-initialises (one extra getMe call).
 */
let cachedBot: Bot | undefined

function buildBot(token: string, env: Bindings): Bot {
  const bot = new Bot(token)

  // Commands — order matters: specific handlers first, fallback always last
  registerStartCommand(bot, env)
  registerCancelCommand(bot, env)
  registerOnboardingHandlers(bot, env)
  registerLinkCommand(bot, env)
  registerSendCommand(bot, env)
  registerInboxCommand(bot, env)
  registerSettingsCommand(bot, env)
  registerHelpCommand(bot, env)
  registerMessageActionsHandler(bot, env)
  registerMessageHandler(bot, env)
  registerFallbackHandler(bot, env) // must be last

  return bot
}

/**
 * Returns the cached, initialised bot — or builds and initialises one.
 * Always use this for webhook handling so ctx.me is guaranteed to be set.
 */
export async function getOrInitBot(token: string, env: Bindings): Promise<Bot> {
  if (!cachedBot) {
    cachedBot = buildBot(token, env)
    await cachedBot.init() // fetches getMe once; populates ctx.me for all handlers
  }
  return cachedBot
}
