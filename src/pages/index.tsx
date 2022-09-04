import type { NextPage } from 'next';
import Head from 'next/head';
import { AddTodo, TodoList, Categories } from '../components';
import { AddCategory } from '../components/Categories/AddCategory';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

const Home: NextPage = () => {
  const session = useSession();

  useEffect(() => {
    if (!session.data?.user?.id) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.OneSignal.push(function () {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      window.OneSignal.setExternalUserId(session.data?.user?.id);
    });
  }, [session.data?.user?.id]);

  return (
    <>
      <Head>
        <title>Todos</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto flex flex-col items-center justify-center p-4">
        <Categories />
        <AddCategory />
        <AddTodo />
        <TodoList />
      </main>
    </>
  );
};

export default Home;
