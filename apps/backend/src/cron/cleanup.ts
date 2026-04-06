import { createDb } from "~/db/index"
import type { Bindings } from "~/index"
import { MessageRepository } from "~/repositories/message.repository"

/** Deletes messages older than 90 days. Runs on schedule via Cloudflare Cron Trigger. */
export async function runCleanup(env: Bindings): Promise<void> {
  const db = createDb(env.DB)
  const deleted = await new MessageRepository(db).deleteOlderThan(90)
  console.log(`[cleanup] Deleted ${deleted} messages older than 90 days`)
}
