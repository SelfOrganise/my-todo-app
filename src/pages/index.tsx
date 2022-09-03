import type { NextPage } from 'next';
import Head from 'next/head';
import { AddTodo, TodoList, Categories } from '../components';
import { AddCategory } from '../components/Categories/AddCategory';

const Home: NextPage = () => {
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
