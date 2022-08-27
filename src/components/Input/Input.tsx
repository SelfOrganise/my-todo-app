import React, { useCallback, useEffect, useRef, useState } from 'react';
import moment, { Moment } from 'moment/moment';
import { trpc } from '../../utils/trpc';
import parseTimeString from 'timestring';
import { useHotkeys } from 'react-hotkeys-hook';

export function Input() {
  const inputRef = useRef<HTMLInputElement>(null);
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAdd();
    }

    if (e.key === 'Escape') {
      e.currentTarget.blur();
    }
  };

  useHotkeys('n', event => {
    inputRef.current?.focus();
    event.preventDefault();
  });

  return (
    <div className="flex flex-col bg-blue-100 p-4 w-full">
      <input autoFocus tabIndex={1} type="text" ref={inputRef} onKeyDown={handleKeyDown} />
      <input
        tabIndex={2}
        type="text"
        value={timeString}
        disabled={addTodo.isLoading}
        onChange={e => setTimeString(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {parsedTime?.format('YYYY/MM/DD HH:mm')} {parsedTime?.fromNow()}
      <button tabIndex={3} type="button" value="add" onClick={handleAdd}>
        Add
      </button>
      {addTodo.isLoading && <span>adding...</span>}
    </div>
  );
}
