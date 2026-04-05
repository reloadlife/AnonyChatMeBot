import type { Bot, Context } from "grammy"
import { allTexts } from "~/bot/utils/locale"
import type { Bindings } from "~/index"

export function registerSendCommand(bot: Bot, _env: Bindings) {
  const handle = async (ctx: Context) => {
    // TODO: ask for a username or link, then transition to sending_message state:
    //   await new StateService(env.STATE_KV).transition(ctx.from!.id, {
    //     name: "sending_message",
    //     recipientId: <resolved id>,
    //     recipientName: <resolved name>,
    //   })
    await ctx.reply("🚧 Coming soon")
  }

  bot.hears(allTexts("send_direct"), handle)
  bot.command("send", handle)
}
