import type { NextPage } from 'next';
import Head from 'next/head';
import { TodoList } from '../components';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import OneSignal from 'react-onesignal';
import { MainLayout } from '../components/layouts';

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

      <MainLayout>
        <TodoList />
      </MainLayout>
    </>
  );
};

export default Home;
