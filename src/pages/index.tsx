import type { NextPage } from 'next';
import Head from 'next/head';
import { trpc } from '../utils/trpc';
import moment from 'moment';
import { Input } from '../components/Input';

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
        {todos.data?.reverse().map(todo => (
          <div className="flex p-2 w-full" key={todo.id}>
            <div className="text-red-500 mr-2 ">{todo.content}</div>
            {todo.dueDate && <div className="text-blue-300">{moment(todo.dueDate).fromNow()}</div>}
          </div>
        ))}
      </main>
    </>
  );
};

export default Home;
