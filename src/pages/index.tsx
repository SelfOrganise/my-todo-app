import type { NextPage } from 'next';
import Head from 'next/head';
import { trpc } from '../utils/trpc';
import { Input } from '../components/Input';
import { TodoList } from '../components/TodoList';

const Home: NextPage = () => {
  const todos = trpc.useQuery(['todos.all']);

  return (
    <>
      <Head>
        <title>Todos</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto flex flex-col items-center justify-center p-4">
        <Input />
        <TodoList todos={todos.data} />
      </main>
    </>
  );
};

export default Home;
