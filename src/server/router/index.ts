// src/server/router/index.ts
import {createRouter} from "./context";
import superjson from "superjson";

import {protectedExampleRouter} from "./protected-example-router";
import {todosRouter} from "./todos";

export const appRouter = createRouter()
  .transformer(superjson)
  .merge("todos.", todosRouter)
  .merge("auth.", protectedExampleRouter);

// export type definition of API
export type AppRouter = typeof appRouter;
