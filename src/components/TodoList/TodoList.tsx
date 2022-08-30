import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Todo } from '@prisma/client';
import { useHotkeys } from 'react-hotkeys-hook';
import { trpc } from '../../utils/trpc';
import { useAppStore } from '../../store/appStore';
import { TodoItem } from './TodoItem';

export function TodoList({ todos }: { todos?: Todo[] }) {
  const lastCompleted = useRef<Array<string>>([]);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const { invalidateQueries } = trpc.useContext();
  const completeTask = trpc.useMutation(['todos.complete']);
  const undoTask = trpc.useMutation(['todos.undo']);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  const setTaskUnderEdit = useAppStore(state => state.setTaskUnderEdit);
  const currentTodos = useMemo(() => {
    return searchText.length > 0
      ? todos?.sort(sortTodos).filter(e => e.content.includes(searchText))
      : todos?.sort(sortTodos);
  }, [searchText, todos]);
  const [hideTodos, setHideTodos] = useState(false);

  useEffect(() => {
    listContainerRef.current?.focus();
  }, []);

  useHotkeys(
    'j',
    () => setSelectedIndex(old => Math.min(currentTodos?.length ? currentTodos.length - 1 : 0, old + 1)),
    [currentTodos?.length]
  );
  useHotkeys('k', () => setSelectedIndex(old => Math.max(0, old - 1)), []);
  useHotkeys('h', () => setHideTodos(old => !old));
  useHotkeys('g', () => setSelectedIndex(0));
  useHotkeys('shift+g', () => setSelectedIndex(currentTodos?.length ? currentTodos.length - 1 : 0), [
    currentTodos?.length,
  ]);
  useHotkeys('/', event => {
    setShowSearch(true);
    event.preventDefault();
  });
  useHotkeys(
    'escape',
    () => {
      setShowSearch(false);
      setSearchText('');
    },
    { enableOnTags: ['INPUT'] }
  );
  useHotkeys(
    'c',
    () =>
      !!currentTodos?.[selectedIndex]?.id &&
      completeTask.mutate(
        { id: currentTodos[selectedIndex]!.id },
        {
          onSuccess: async () => {
            lastCompleted.current.push(currentTodos[selectedIndex]!.id);
            await invalidateQueries(['todos.all']);
          },
        }
      ),
    [currentTodos, selectedIndex]
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
    [currentTodos, selectedIndex]
  );
  useHotkeys(
    'e',
    event => {
      const task = currentTodos && currentTodos[selectedIndex];
      if (!task) {
        return;
      }

      setTaskUnderEdit(task);
      event.preventDefault();
    },
    [currentTodos, selectedIndex, setTaskUnderEdit]
  );

  return (
    <>
      {showSearch && (
        <input autoFocus={true} type="text" value={searchText} onChange={e => setSearchText(e.currentTarget.value)} />
      )}
      <div ref={listContainerRef} className="outline-amber-200:focus border-2:focus border-amber-400:focus w-full">
        {hideTodos && <p className="text-white text-5xl">Hidden</p>}
        {!hideTodos &&
          currentTodos?.map((todo, i) => <TodoItem key={todo.id} todo={todo} isSelected={selectedIndex === i} />)}
      </div>
    </>
  );
}

function sortTodos(a: Todo, b: Todo) {
  const now = new Date().getTime();

  if (a.dueDate && b.dueDate) {
    if (a.dueDate.getTime() - now < 0 && b.dueDate.getTime() - now > 0) {
      return 1;
    }

    if (b.dueDate.getTime() - now < 0 && a.dueDate.getTime() - now > 0) {
      return -1;
    }
  }

  if (a.dueDate && !b.dueDate) {
    return -1;
  }

  if (!a.dueDate && b.dueDate) {
    return 1;
  }

  // if (a.dueDate && b.dueDate) {
  //
  //   return a.dueDate.getTime() - b.dueDate.getTime();
  // }

  // if (!a.dueDate && b.dueDate) {
  //   return Number.MAX_SAFE_INTEGER;
  // }
  //
  // if (!b.dueDate && a.dueDate) {
  //   return -Number.MAX_SAFE_INTEGER;
  // }

  return 0;
}
