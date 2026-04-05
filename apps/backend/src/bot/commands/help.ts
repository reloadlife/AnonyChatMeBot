import type { Bot, Context } from "grammy"
import type { Bindings } from "~/index"
import { allTexts } from "./_locale"

export function registerHelpCommand(bot: Bot, _env: Bindings) {
  const handle = async (ctx: Context) => {
    // TODO: show help text / FAQ
    await ctx.reply("🚧 Coming soon")
  }

  bot.hears(allTexts("help"), handle)
  bot.command("help", handle)
}
