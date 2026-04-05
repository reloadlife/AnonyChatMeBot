import type { Bot, Context } from "grammy"
import type { Bindings } from "~/index"
import { allTexts } from "./_locale"

export function registerSettingsCommand(bot: Bot, _env: Bindings) {
  const handle = async (ctx: Context) => {
    // TODO: show settings menu (change language, display name, notifications)
    await ctx.reply("🚧 Coming soon")
  }

  bot.hears(allTexts("settings"), handle)
  bot.command("settings", handle)
}
