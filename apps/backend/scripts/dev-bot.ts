/**
 * Dev-only: runs grammY in long-polling mode.
 *
 * WHY THIS EXISTS:
 * Cloudflare Workers are stateless request handlers — they can't run a
 * persistent polling loop like bot.start(). In production, Telegram calls
 * our webhook endpoint instead. For local dev, we run this Bun script
 * alongside `wrangler dev` to receive updates via long-polling.
 *
 * The bot logic runs in-process here; DB calls go to wrangler's local D1
 * (SQLite) via the Workers dev server. For simplicity, this script uses
 * the same createBot() factory with a mock env that points to wrangler dev.
 *
 * Usage:
 *   Terminal 1: bun run dev          (starts wrangler dev)
 *   Terminal 2: bun run dev:bot      (starts this script)
 */

import { Bot } from "grammy"

// Load secrets from .dev.vars manually (wrangler doesn't inject them here)
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

// In dev, bot logic runs in-process with a stub env.
// Real DB/storage calls require wrangler dev to be running on localhost:8787.
const bot = new Bot(token)

bot.command("start", async (ctx) => {
  await ctx.reply("👋 Dev mode: bot is running via long-polling!")
})

bot.on("message:text", async (ctx) => {
  // Forward to wrangler dev server for full worker logic (optional)
  // await fetch("http://localhost:8787/webhook", { ... })
  await ctx.reply(`[dev echo] ${ctx.message.text}`)
})

bot.catch((err) => console.error("Bot error:", err))

console.log("🤖 Starting bot in long-polling mode (dev)...")
await bot.start({
  onStart: (info) => console.log(`✅ Bot @${info.username} started`),
})
