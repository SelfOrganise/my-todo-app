import React, { useCallback, useEffect, useRef, useState } from 'react';
import moment, { Moment } from 'moment/moment';
import { trpc } from '../../utils/trpc';
import parseTimeString from 'timestring';
import { useHotkeys } from 'react-hotkeys-hook';

export function Input() {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [timeString, setTimeString] = useState('');
  const [parsedTime, setParsedTime] = useState<Moment | null>(null);
  const addTodo = trpc.useMutation(['todos.add']);
  const { invalidateQueries } = trpc.useContext();

  useEffect(() => inputRef.current?.focus(), []);
  useEffect(() => {
    if (!timeString) {
      return;
    }

    try {
      const parsed = parseTimeString(timeString, 'minutes');
      setParsedTime(moment().add(parsed, 'minutes'));
    } catch {}
  }, [timeString]);

  const handleAdd = useCallback(() => {
    addTodo.mutate(
      {
        content: inputRef.current!.value,
        dueDate: parsedTime?.toDate(),
      },
      {
        async onSuccess() {
          inputRef.current!.value = '';
          inputRef.current!.focus();
          await invalidateQueries(['todos.all']);
        },
      }
    );
  }, [addTodo, invalidateQueries, parsedTime]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAdd();
    }

    if (e.key === 'Escape') {
      e.currentTarget.blur();
    }
  };

  useHotkeys('i', event => {
    inputRef.current?.focus();
    event.preventDefault();
  });

  return (
    <div className="flex flex-col bg-blue-100 p-4 w-full rounded-2xl fixed w-[50%]">
      <textarea
        className="mb-4 bg-gray-50 text-2xl font-medium border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        autoFocus
        tabIndex={1}
        ref={inputRef}
        onKeyDown={handleKeyDown}
      />
      <input
        className="bg-gray-50 border text-xl border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        tabIndex={2}
        type="text"
        value={timeString}
        disabled={addTodo.isLoading}
        onChange={e => setTimeString(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {parsedTime?.format('YYYY/MM/DD HH:mm')} {parsedTime?.fromNow()}
      {addTodo.isLoading && <span>adding...</span>}
    </div>
  );
}
