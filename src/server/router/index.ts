// src/server/router/index.ts
import { createRouter } from './context';
import superjson from 'superjson';

import { protectedExampleRouter } from './protected-example-router';
import { todosRouter } from './todos';
import { usersRouter } from './users';
import { categoriesRouter } from './categories';

export const appRouter = createRouter()
  .transformer(superjson)
  .merge('todos.', todosRouter)
  .merge('auth.', protectedExampleRouter)
  .merge('users.', usersRouter)
  .merge('categories.', categoriesRouter);

// export type definition of API
export type AppRouter = typeof appRouter;
