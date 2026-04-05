import { Bot } from "grammy"
import type { Bindings } from "../index"
import { registerMessageHandler } from "../views/telegram/message.handler"
import { registerStartCommand } from "./commands/start"

export function createBot(token: string, env: Bindings): Bot {
  const bot = new Bot(token)
  registerStartCommand(bot, env)
  registerMessageHandler(bot, env)
  return bot
}
