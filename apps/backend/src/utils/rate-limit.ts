/**
 * KV-based sliding-window rate limiter.
 *
 * Key: `rl:{senderTelegramId}:{recipientUserId}`
 * Value: JSON array of timestamps (ms) within the current window.
 * TTL: windowSeconds — entry auto-expires when the window passes.
 */
export async function checkRateLimit(
  kv: KVNamespace,
  senderTelegramId: number,
  recipientUserId: number,
  maxPerWindow = 5,
  windowSeconds = 60,
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const key = `rl:${senderTelegramId}:${recipientUserId}`
  const now = Date.now()
  const windowMs = windowSeconds * 1000

  const raw = await kv.get(key)
  const timestamps: number[] = raw ? JSON.parse(raw) : []

  // Drop timestamps outside the current window
  const recent = timestamps.filter((ts) => now - ts < windowMs)

  if (recent.length >= maxPerWindow) {
    const oldest = recent[0]
    const retryAfterMs = windowMs - (now - oldest)
    return { allowed: false, retryAfterSeconds: Math.ceil(retryAfterMs / 1000) }
  }

  recent.push(now)
  await kv.put(key, JSON.stringify(recent), { expirationTtl: windowSeconds })
  return { allowed: true, retryAfterSeconds: 0 }
}
