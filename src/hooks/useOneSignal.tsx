/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import OneSignal from 'react-onesignal';
import { trpc } from '../utils/trpc';

const isProd = process.env.NODE_ENV === 'production';

export function useOneSignal() {
  const isInitialized = useRef(false);
  const complete = trpc.useMutation(['todos.complete']);
  const snooze = trpc.useMutation(['todos.snooze']);
  const { invalidateQueries } = trpc.useContext();

  // register notification action handler
  const registerNotificationHandler = useCallback(() => {
    OneSignal.Notifications.addEventListener('click', (e: any) => {
      // note: need to re-register after each execution https://github.com/OneSignal/OneSignal-Website-SDK/issues/436
      registerNotificationHandler();

      const split: [string, string] = e?.action?.split('@');
      if (split.length != 2) {
        console.log('Could not process:', e.action);
        return;
      }

      const [action, id] = split;
      switch (action) {
        case 'complete':
          toast.promise(complete.mutateAsync({ id }, { onSuccess: () => invalidateQueries(['todos.all']) }), {
            loading: 'Completing...',
            success: <b>Todo completed!</b>,
            error: <b>Could not complete.</b>,
          });

          break;
        case 'snooze':
          toast.promise(snooze.mutateAsync({ id }, { onSuccess: () => invalidateQueries(['todos.all']) }), {
            loading: 'Snoozing...',
            success: <b>Todo snoozed!</b>,
            error: <b>Could not snooze.</b>,
          });
          break;
        default:
          console.log('Could not process:', e.action);
      }
    });
  }, [complete, invalidateQueries, snooze]);

  // initialize one signal
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
  }, [registerNotificationHandler]);
}
