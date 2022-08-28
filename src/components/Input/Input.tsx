import React, { useCallback, useEffect, useRef, useState } from 'react';
import moment, { Moment } from 'moment/moment';
import { trpc } from '../../utils/trpc';
import parseTimeString from 'timestring';
import { useHotkeys } from 'react-hotkeys-hook';
import { useAppStore } from '../../store/appStore';

export function Input() {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [timeString, setTimeString] = useState('');
  const [parsedTime, setParsedTime] = useState<Moment | null>(null);
  const addTodo = trpc.useMutation(['todos.add']);
  const updateTodo = trpc.useMutation(['todos.update']);
  const { invalidateQueries } = trpc.useContext();
  const [taskUnderEdit, setTaskUnderEdit] = useAppStore(state => [state.taskUnderEdit, state.setTaskUnderEdit]);
  const [showInput, setShowInput] = useState(false);

  console.log(taskUnderEdit);

  useEffect(() => {
    if (taskUnderEdit && inputRef.current) {
      setShowInput(true);
      inputRef.current.value = taskUnderEdit.content;
      inputRef.current.focus();
      if (taskUnderEdit.dueDate) {
        setTimeString(moment(taskUnderEdit.dueDate).toISOString());
      }
    }
  }, [taskUnderEdit]);

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

  const handleSave = useCallback(() => {
    if (!taskUnderEdit) {
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
            setShowInput(false);
          },
        }
      );
    } else {
      updateTodo.mutate(
        {
          id: taskUnderEdit.id,
          content: inputRef.current!.value,
          dueDate: parsedTime?.toDate(),
        },
        {
          async onSuccess() {
            setTaskUnderEdit(undefined);
            inputRef.current!.value = '';
            inputRef.current!.focus();
            await invalidateQueries(['todos.all']);
            setShowInput(false);
          },
        }
      );
    }
  }, [addTodo, invalidateQueries, parsedTime, setTaskUnderEdit, taskUnderEdit, updateTodo]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    }

    if (e.key === 'Escape') {
      e.currentTarget.blur();
      setTimeString('');
      setTaskUnderEdit(undefined);
      setShowInput(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  useHotkeys('i', event => {
    setShowInput(true);
    inputRef.current?.focus();
    event.preventDefault();
  });

  return (
    <div
      className={`flex flex-col bg-blue-100 p-4 w-full rounded-2xl fixed w-[50%] ${
        showInput ? '' : 'fixed right-[-2000px]'
      }`}
    >
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
