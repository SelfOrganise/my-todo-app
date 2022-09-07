import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Todo } from '@prisma/client';
import { useHotkeys } from 'react-hotkeys-hook';
import { trpc } from '../../utils/trpc';
import { useAppStore } from '../../store/appStore';
import { TodoItem } from './TodoItem';
import shallow from 'zustand/shallow';
import { AddTodoButton } from '../AddTodoButton';
import { AddTodoDialog } from '../AddTodo';

export function TodoList() {
  const lastCompleted = useRef<Array<string>>([]);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const { invalidateQueries } = trpc.useContext();
  const completeTask = trpc.useMutation(['todos.complete']);
  const undoTask = trpc.useMutation(['todos.undo']);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { setTaskUnderEdit, currentCategoryId, setTaskToFocus, taskToFocus } = useAppStore(
    state => ({
      setTaskUnderEdit: state.setTaskUnderEdit,
      currentCategoryId: state.currentCategoryId,
      setTaskToFocus: state.setTaskToFocus,
      taskToFocus: state.taskToFocus,
    }),
    shallow
  );
  const [hideTodos, setHideTodos] = useState(true);

  const todosQuery = trpc.useQuery(['todos.all', { categoryId: currentCategoryId || '' }], {
    refetchInterval: 60000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: 'always',
  });

  const todos = todosQuery.data;

  const sortedTodos = useMemo(() => sortTodos(todos), [todos]);

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

  useHotkeys('j', () => setSelectedIndex(old => Math.min(sortedTodos?.length ? sortedTodos.length - 1 : 0, old + 1)), [
    sortedTodos?.length,
  ]);
  useHotkeys('k', () => setSelectedIndex(old => Math.max(0, old - 1)), []);
  useHotkeys('m', () => setHideTodos(old => !old));
  useHotkeys('g', () => setSelectedIndex(0));
  useHotkeys('shift+g', () => setSelectedIndex(sortedTodos?.length ? sortedTodos.length - 1 : 0), [
    sortedTodos?.length,
  ]);
  useHotkeys(
    'c',
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
    [sortedTodos, selectedIndex]
  );
  useHotkeys(
    'u',
    () => {
      lastCompleted.current.length &&
        undoTask.mutate(
          { id: lastCompleted.current.pop()! },
          {
            onSuccess: async () => {
              await invalidateQueries(['todos.all']);
            },
          }
        );
    },
    [sortedTodos, selectedIndex]
  );
  useHotkeys(
    'e',
    event => {
      const task = sortedTodos && sortedTodos[selectedIndex];
      if (!task) {
        return;
      }

      setTaskUnderEdit(task);
      event.preventDefault();
    },
    [sortedTodos, selectedIndex, setTaskUnderEdit]
  );

  return (
    <>
      <AddTodoButton />
      <AddTodoDialog />
      <div ref={listContainerRef} className="outline-amber-200:focus border-2:focus border-amber-400:focus w-full">
        {hideTodos && <p className="text-white text-5xl">Hidden</p>}
        {!hideTodos &&
          sortedTodos?.map((todo, i) => (
            <TodoItem onClick={() => setSelectedIndex(i)} key={todo.id} todo={todo} isSelected={selectedIndex === i} />
          ))}
      </div>
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
  due.sort((a, b) => a.dueDate!.getTime() - b.dueDate!.getTime());
  scheduled.sort((a, b) => a.dueDate!.getTime() - b.dueDate!.getTime());

  return [...due, ...scheduled, ...noDueDate];
}
