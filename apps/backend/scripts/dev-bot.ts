/**
 * Dev-only: polls Telegram and forwards each update as an HTTP POST
 * to the local wrangler dev server, exactly as production webhooks work.
 *
 * Also syncs bot commands with Telegram on startup (same logic as /setup).
 *
 * Usage (from repo root):
 *   Terminal 1: bun run dev:backend   (starts wrangler dev on :8787)
 *   Terminal 2: bun run dev:bot       (starts this forwarding script)
 */

import { Bot } from "grammy"
import { syncBotCommands } from "../src/bot/setup"

const WEBHOOK_URL = "http://localhost:8787/webhook"
const POLL_TIMEOUT = 30 // seconds

// Load secrets from .dev.vars (wrangler doesn't inject them into this process)
const { readFileSync } = await import("node:fs")
const devVarsPath = new URL("../.dev.vars", import.meta.url)
try {
  const content = readFileSync(devVarsPath, "utf8")
  for (const line of content.split("\n")) {
    const [key, ...rest] = line.split("=")
    if (key?.trim() && rest.length) {
      process.env[key.trim()] = rest
        .join("=")
        .trim()
        .replace(/^["']|["']$/g, "")
    }
  }
} catch {
  // .dev.vars not found — rely on environment variables being set externally
}

const token = process.env.BOT_TOKEN
if (!token)
  throw new Error("BOT_TOKEN is required. Copy .dev.vars.example to .dev.vars and fill it in.")

// Sync commands before starting the poll loop
console.log("[dev-bot] Syncing bot commands...")
const setupBot = new Bot(token)
await syncBotCommands(setupBot.api)

const telegramApi = `https://api.telegram.org/bot${token}`

async function deleteWebhook() {
  const res = await fetch(`${telegramApi}/deleteWebhook`)
  const data = (await res.json()) as { ok: boolean }
  if (!data.ok) throw new Error("Failed to delete webhook — is the token valid?")
}

async function getUpdates(offset: number): Promise<{ update_id: number }[]> {
  const res = await fetch(
    `${telegramApi}/getUpdates?offset=${offset}&timeout=${POLL_TIMEOUT}&allowed_updates=[]`,
  )
  const data = (await res.json()) as { ok: boolean; result: { update_id: number }[] }
  if (!data.ok) throw new Error(`getUpdates failed: ${JSON.stringify(data)}`)
  return data.result
}

async function forwardUpdate(update: unknown): Promise<void> {
  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(update),
  })
  if (!res.ok) {
    const body = await res.text()
    console.error(`[dev-bot] Worker returned ${res.status}: ${body}`)
  }
}

console.log("[dev-bot] Clearing any existing webhook...")
await deleteWebhook()
console.log(`[dev-bot] Forwarding updates to ${WEBHOOK_URL}`)

let offset = 0
while (true) {
  try {
    const updates = await getUpdates(offset)
    for (const update of updates) {
      await forwardUpdate(update)
      offset = update.update_id + 1
    }
  } catch (err) {
    console.error("[dev-bot] Poll error:", err)
    await new Promise((r) => setTimeout(r, 2000))
  }
}
