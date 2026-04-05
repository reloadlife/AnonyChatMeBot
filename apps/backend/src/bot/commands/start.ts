import { getMessages } from "@anonychatmebot/shared"
import type { Bot } from "grammy"
import type { Bindings } from "../../index"
import { UserRepository } from "../../repositories/user.repository"

export function registerStartCommand(bot: Bot, env: Bindings) {
  bot.command("start", async (ctx) => {
    const userRepo = new UserRepository(env.DB)
    const from = ctx.from
    if (!from) return

    // Upsert user on /start
    await userRepo.upsert({
      telegram_id: from.id,
      username: from.username ?? null,
      locale: "en", // TODO: detect from ctx.from.language_code
    })

    const t = getMessages("en")
    const link = `https://t.me/${ctx.me.username}?start=${from.id}`
    await ctx.reply(`${t.bot.welcome}\n\n🔗 ${link}`)
  })
}
