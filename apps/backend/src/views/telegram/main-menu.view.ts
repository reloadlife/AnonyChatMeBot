import type { I18nMessages } from "@anonychatmebot/shared"
import { Keyboard } from "grammy"

/** Persistent reply keyboard shown after onboarding completes. */
export function buildMainMenuKeyboard(messages: I18nMessages): Keyboard {
  return new Keyboard()
    .text(messages.menu.receive_messages)
    .row()
    .text(messages.menu.send_direct)
    .text(messages.menu.received)
    .row()
    .text(messages.menu.settings)
    .text(messages.menu.help)
    .resized()
    .persistent()
}
