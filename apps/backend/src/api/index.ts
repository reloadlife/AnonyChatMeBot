import { Hono } from "hono"
import type { AppEnv } from "./context"
import { injectServices, requireApiSecret } from "./context"
import { messagesRouter } from "./messages"
import { setupRouter } from "./setup"
import { usersRouter } from "./users"

export const api = new Hono<AppEnv>()

api.use("*", injectServices)
api.use("*", requireApiSecret)

api.route("/setup", setupRouter)
api.route("/messages", messagesRouter)
api.route("/users", usersRouter)
