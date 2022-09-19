import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Todo } from '@prisma/client';
import useHotkeys from '@reecelucas/react-use-hotkeys';
import { trpc } from '../../utils/trpc';
import { useAppStore } from '../../store/appStore';
import { TodoItem } from './TodoItem';
import shallow from 'zustand/shallow';
import { AddTodoDialog } from '../AddTodo';
import { useRouter } from 'next/router';

export function TodoList() {
  const lastCompleted = useRef<Array<string>>([]);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const { invalidateQueries } = trpc.useContext();
  const completeTask = trpc.useMutation(['todos.complete']);
  const undoTask = trpc.useMutation(['todos.undo']);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [taskUnderEdit, setTaskUnderEdit] = useState<Todo | undefined>();
  const [taskToFocus, setTaskToFocus] = useState<Todo | undefined>();
  const [currentCategory] = useAppStore(state => [state.currentCategory], shallow);
  const [hideTodos, setHideTodos] = useState(true);
  const router = useRouter();

  const todosQuery = trpc.useQuery(['todos.all', { categoryId: currentCategory?.id || '' }], {
    refetchInterval: 60000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: 'always',
  });

  const todos = todosQuery.data;

  const sortedTodos = useMemo(() => sortTodos(todos), [todos]);

  // todo: find better way to handle this
  useEffect(() => {
    if (router.query.title || router.query.text || router.query.url) {
      setShowAddTodo(true);
    }
  }, [router.query.text, router.query.title, router.query.url]);

  // onload
  useEffect(() => {
    listContainerRef.current?.focus();
  }, []);

  // focus last created task
  useEffect(() => {
    if (!taskToFocus || !sortedTodos) {
      return;
    }

    const index = sortedTodos.findIndex(t => t.id === taskToFocus.id);
    setTaskToFocus(undefined);
    setSelectedIndex(index);
  }, [sortedTodos, setTaskToFocus, taskToFocus]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [currentCategory]);

  useHotkeys(
    'j',
    useCallback(
      () => setSelectedIndex(old => Math.min(sortedTodos?.length ? sortedTodos.length - 1 : 0, old + 1)),
      [sortedTodos?.length]
    )
  );
  useHotkeys(
    'k',
    useCallback(() => setSelectedIndex(old => Math.max(0, old - 1)), [])
  );
  useHotkeys('`', () => setHideTodos(old => !old));
  useHotkeys(
    'g g',
    useCallback(() => setSelectedIndex(0), [])
  );
  useHotkeys(
    'shift+g',
    useCallback(() => setSelectedIndex(sortedTodos?.length ? sortedTodos.length - 1 : 0), [sortedTodos?.length])
  );
  useHotkeys(
    'c',
    useCallback(
      () =>
        !!sortedTodos?.[selectedIndex]?.id &&
        completeTask.mutate(
          { id: sortedTodos[selectedIndex]!.id },
          {
            onSuccess: async () => {
              lastCompleted.current.push(sortedTodos[selectedIndex]!.id);
              await invalidateQueries(['todos.all']);
            },
          }
        ),
      [sortedTodos, selectedIndex, completeTask, invalidateQueries]
    )
  );
  useHotkeys(
    'u',
    useCallback(() => {
      lastCompleted.current.length &&
        undoTask.mutate(
          { id: lastCompleted.current.pop()! },
          {
            onSuccess: async () => {
              await invalidateQueries(['todos.all']);
            },
          }
        );
    }, [undoTask, invalidateQueries])
  );
  useHotkeys(
    'e',
    useCallback(
      event => {
        const task = sortedTodos && sortedTodos[selectedIndex];
        if (!task) {
          return;
        }

        setTaskUnderEdit(task);
        setShowAddTodo(true);
        event.preventDefault();
      },
      [sortedTodos, selectedIndex, setTaskUnderEdit]
    )
  );

  useHotkeys(
    'i',
    useCallback(
      event => {
        if (!currentCategory) {
          return;
        }

        setShowAddTodo(true);
        event.preventDefault();
      },
      [currentCategory]
    )
  );

  const handleOnClick = useCallback(
    (todo: Todo, i: number) => {
      setSelectedIndex(i);
      setTaskUnderEdit(todo);
    },
    [setTaskUnderEdit]
  );

  return (
    <>
      <button className="btn fixed bottom-[2rem] w-36" onClick={() => setShowAddTodo(!showAddTodo)}>
        {showAddTodo ? 'Close' : 'Add'}
      </button>
      <div ref={listContainerRef} className="outline-amber-200:focus border-2:focus border-amber-400:focus w-full">
        {hideTodos && (
          <p onClick={() => setHideTodos(false)} className="text-white text-5xl font-mono tracking-wide cursor-pointer">
            Hidden
          </p>
        )}
        {!hideTodos &&
          sortedTodos?.map((todo, i) => (
            <TodoItem
              onClick={() => handleOnClick(todo, i)}
              key={todo.id}
              todo={todo}
              isSelected={selectedIndex === i}
            />
          ))}
      </div>
      {showAddTodo && (
        <AddTodoDialog
          task={taskUnderEdit}
          onClose={todo => {
            setTaskToFocus(todo);
            setTaskUnderEdit(undefined);
            return setShowAddTodo(false);
          }}
        />
      )}
    </>
  );
}

function sortTodos(todos?: Array<Todo>): Array<Todo> | undefined {
  if (!todos) {
    return todos;
  }

  const noDueDate = [];
  const due = [];
  const scheduled = [];

  for (const todo of todos) {
    if (!todo.dueDate) {
      noDueDate.push(todo);
    } else if (todo.dueDate.getTime() < Date.now()) {
      due.push(todo);
    } else {
      scheduled.push(todo);
    }
  }

  noDueDate.sort((a, b) => a.id.localeCompare(b.id));
  due.sort((a, b) => b.dueDate!.getTime() - a.dueDate!.getTime());
  scheduled.sort((a, b) => a.dueDate!.getTime() - b.dueDate!.getTime());

  return [...due, ...scheduled, ...noDueDate];
}
