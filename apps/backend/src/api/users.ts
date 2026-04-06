import { Hono } from "hono"
import { UserRepository } from "~/repositories/user.repository"
import { decodeId } from "~/utils/hashid"
import type { AppEnv } from "./context"

export const usersRouter = new Hono<AppEnv>()

/**
 * GET /api/users/resolve/:hash
 * Resolves a hashid link to a public user profile (display_name only).
 * Used by the web send page to show who the message will be sent to.
 */
usersRouter.get("/resolve/:hash", async (c) => {
  const hash = c.req.param("hash")
  const userId = decodeId(c.env.LINK_SALT, hash)

  if (userId === null) return c.json({ error: "Invalid link" }, 400)

  const user = await new UserRepository(c.get("db")).findById(userId)
  if (!user) return c.json({ error: "User not found" }, 404)
  if (!user.receiving_messages) return c.json({ error: "Not accepting messages" }, 403)

  return c.json({
    id: userId,
    displayName: user.display_name || user.username || "Anonymous",
  })
})
