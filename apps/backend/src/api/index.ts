import { Hono } from "hono"
import type { AppEnv } from "./context"
import { injectServices, requireApiSecret } from "./context"
import { messagesRouter } from "./messages"
import { setupRouter } from "./setup"

export const api = new Hono<AppEnv>()

// Inject db + stateService into every route
api.use("*", injectServices)

// All API routes require a valid X-API-Secret header
api.use("*", requireApiSecret)

api.route("/setup", setupRouter)
api.route("/messages", messagesRouter)
