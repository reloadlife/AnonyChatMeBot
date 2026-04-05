import { describe, expect, it } from "bun:test"

// Placeholder tests — expand as features are built

describe("MessageController", () => {
  it("should serialize messages correctly", () => {
    const { serializeMessage } = require("../src/serializers/message.serializer")
    const raw = {
      id: 1,
      sender_telegram_id: 999,
      recipient_user_id: 1,
      content: "Hello!",
      delivered: 0 as const,
      created_at: "2024-01-01T00:00:00",
    }
    const result = serializeMessage(raw)
    expect(result.id).toBe(1)
    expect(result.content).toBe("Hello!")
    expect(result.delivered).toBe(false)
  })
})
