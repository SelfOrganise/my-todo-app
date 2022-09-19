// src/pages/_app.tsx
import { withTRPC } from '@trpc/next';
import type { AppRouter } from '../server/router';
import type { AppType } from 'next/dist/shared/lib/utils';
import superjson from 'superjson';
import { SessionProvider } from 'next-auth/react';
import '../styles/globals.css';
import { useEffect, useRef } from 'react';
import OneSignal from 'react-onesignal';

const isProd = process.env.NODE_ENV === 'production';

function registerNotificationHandler() {
  OneSignal.addListenerForNotificationOpened((e: any) => {
    const split = e?.action?.split('@');
    console.log(e, split);
    // note: need to re-register after each execution https://github.com/OneSignal/OneSignal-Website-SDK/issues/436
    registerNotificationHandler();
  });
}

const MyApp: AppType = ({ Component, pageProps: { session, ...pageProps } }) => {
  const isInitialized = useRef(false);
  useEffect(() => {
    if (!window) {
      return;
    }

    if (!isInitialized.current) {
      OneSignal.init({
        appId: isProd ? '03cf5b65-ca13-456d-af8e-393d5d28b4b1' : '7157dd4c-e740-4aba-9c5e-a63bedc6f1fa',
        serviceWorkerParam: { scope: '/push/onesignal/' },
        serviceWorkerPath: 'push/onesignal/OneSignalSDKWorker.js',
        notificationClickHandlerMatch: 'origin',
        notificationClickHandlerAction: 'focus',
        allowLocalhostAsSecureOrigin: true,
        subdomainName: isProd ? '' : 'todo-3pounds',
        notifyButton: {
          enable: true,
        },
      })
        .then(registerNotificationHandler)
        .catch(err => console.error('Could not register OneSignalSDKWorker', err));
    }

    isInitialized.current = true;
  }, []);

  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
};

const getBaseUrl = () => {
  if (typeof window !== 'undefined') return ''; // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url
  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
};

export default withTRPC<AppRouter>({
  config() {
    /**
     * If you want to use SSR, you need to use the server's full URL
     * @link https://trpc.io/docs/ssr
     */
    const url = `${getBaseUrl()}/api/trpc`;

    return {
      url,
      transformer: superjson,
      /**
       * @link https://react-query.tanstack.com/reference/QueryClient
       */
      // queryClientConfig: { defaultOptions: { queries: { staleTime: 60 } } },
    };
  },
  /**
   * @link https://trpc.io/docs/ssr
   */
  ssr: false,
})(MyApp);
