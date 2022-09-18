import { default as nextAuthMiddleware, WithAuthArgs } from 'next-auth/middleware';
import { NextRequest } from 'next/server';

export default function middleware(...args: WithAuthArgs): unknown {
  if (args[0] instanceof NextRequest) {
    const request: NextRequest = args[0];

    const publicPaths = ['/auth', '/signup', '/api/trpc', '/api/auth', '/manifest.json', '/favicon', '/icon']; // trpc handles api/trpc

    if (publicPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
      return;
    }
  }

  return nextAuthMiddleware(...args);
}
