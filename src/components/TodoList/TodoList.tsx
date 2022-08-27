import React, { useRef, useState } from 'react';
import moment from 'moment/moment';
import { Todo } from '@prisma/client';
import { useHotkeys } from 'react-hotkeys-hook';
import { trpc } from '../../utils/trpc';

export function TodoList({ todos }: { todos?: Todo[] }) {
  const completeTask = trpc.useMutation(['todos.complete']);
  const undoTask = trpc.useMutation(['todos.undo']);
  const updateTask = trpc.useMutation(['todos.update']);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const lastCompleted = useRef<Array<string>>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const { invalidateQueries } = trpc.useContext();

  const [showSearch, setShowSearch] = useState(false);

  useHotkeys('j', () => setSelectedIndex(old => Math.min(todos?.length ? todos.length - 1 : 0, old + 1)), [
    todos?.length,
  ]);
  useHotkeys('k', () => setSelectedIndex(old => Math.max(0, old - 1)), [todos?.length]);
  useHotkeys('g', () => setSelectedIndex(0));
  useHotkeys('shift+g', () => setSelectedIndex(todos?.length ? todos.length - 1 : 0), [todos?.length]);
  useHotkeys('/', event => {
    setShowSearch(true);
    event.preventDefault();
  });
  useHotkeys('escape', () => setShowSearch(false), { enableOnTags: ['INPUT'] });
  useHotkeys(
    'c',
    () =>
      !!todos?.[selectedIndex]?.id &&
      completeTask.mutate(
        { id: todos[selectedIndex]!.id },
        {
          onSuccess: async () => {
            lastCompleted.current.push(todos[selectedIndex]!.id);
            await invalidateQueries(['todos.all']);
          },
        }
      ),
    [todos, selectedIndex]
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
    [todos, selectedIndex]
  );
  useHotkeys('e', () => {
    const task = todos && todos[selectedIndex];
    if (!task) {
      return;
    }
  });

  return (
    <>
      {showSearch && <input autoFocus={true} type="text" ref={searchRef} />}
      <div tabIndex={10}>
        {todos?.map((todo, i) => (
          <div className={`flex p-2 w-full ${selectedIndex === i ? 'bg-amber-500' : ''}`} key={todo.id}>
            <div className="text-red-500 mr-2 ">{todo.content}</div>
            {todo.dueDate && (
              <div className="text-blue-300">
                {moment(todo.dueDate).toISOString()} - {moment(todo.dueDate).fromNow()}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
