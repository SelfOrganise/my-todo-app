import type { NextPage } from 'next';
import Head from 'next/head';
import { TodoList, Categories } from '../components';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import OneSignal from 'react-onesignal';
import { Toaster } from 'react-hot-toast';

const Home: NextPage = () => {
  const session = useSession();

  useEffect(() => {
    if (!session.data?.user?.id) {
      return;
    }

    OneSignal.setExternalUserId(session.data?.user?.id);
  }, [session.data?.user?.id]);

  return (
    <>
      <Head>
        <title>Todos</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto flex flex-col items-center justify-center p-4 max-w-4xl">
        <Toaster
          toastOptions={{
            style: {
              background: '#333',
              color: '#fff',
              fontSize: '12px'
            },
          }}
        />
        <Categories />
        <TodoList />
      </main>
    </>
  );
};

export default Home;
