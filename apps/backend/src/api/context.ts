import type { Context, MiddlewareHandler } from "hono"
import { createDb, type Db } from "~/db/index"
import type { Bindings } from "~/index"
import { StateService } from "~/services/state.service"

export type AppVariables = {
  db: Db
  stateService: StateService
}

export type AppEnv = {
  Bindings: Bindings
  Variables: AppVariables
}

export type AppContext = Context<AppEnv>

/** Injects db and stateService into every API request. */
export const injectServices: MiddlewareHandler<AppEnv> = async (c, next) => {
  c.set("db", createDb(c.env.DB))
  c.set("stateService", new StateService(c.env.STATE_KV))
  await next()
}
