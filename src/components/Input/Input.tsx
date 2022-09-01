import React, { useCallback, useEffect, useRef, useState } from 'react';
import moment, { Moment } from 'moment/moment';
import { trpc } from '../../utils/trpc';
import { useHotkeys } from 'react-hotkeys-hook';
import { useAppStore } from '../../store/appStore';
import { parseTimeString, Token } from './parsetimeString';

export function Input() {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);
  const [timeString, setTimeString] = useState('');
  const [parsedData, setParsedData] = useState<[Moment, Array<Token>] | null>(null);
  const addTodo = trpc.useMutation(['todos.add']);
  const updateTodo = trpc.useMutation(['todos.update']);
  const { invalidateQueries } = trpc.useContext();
  const [taskUnderEdit, setTaskUnderEdit] = useAppStore(state => [state.taskUnderEdit, state.setTaskUnderEdit]);
  const [showInput, setShowInput] = useState(false);

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

  useEffect(() => {
    if (!timeString) {
      return;
    }

    try {
      // const parsed = parseTimeString(timeString, 'minutes');
      // setParsedTime(moment().add(parsed, 'minutes'));

      setParsedData(parseTimeString(timeString));
    } catch {}
  }, [timeString]);

  const handleSave = useCallback(() => {
    if (!taskUnderEdit) {
      addTodo.mutate(
        {
          content: inputRef.current!.value,
          dueDate: parsedData?.[0]?.toDate(),
        },
        {
          async onSuccess() {
            inputRef.current?.blur();
            inputRef.current!.value = '';
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
          dueDate: parsedData?.[0]?.toDate(),
        },
        {
          async onSuccess() {
            inputRef.current?.blur();
            timeRef.current?.blur();
            setTaskUnderEdit(undefined);
            inputRef.current!.value = '';
            await invalidateQueries(['todos.all']);
            setShowInput(false);
          },
        }
      );
    }
  }, [addTodo, invalidateQueries, parsedData, setTaskUnderEdit, taskUnderEdit, updateTodo]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (e.shiftKey) {
      return;
    }

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
      className={`flex flex-col bg-blue-100 p-4 w-full fixed w-[50%] top-[15vh] ${
        showInput ? '' : 'right-[-2000px] top-[5vh]'
      }`}
    >
      <textarea
        className="mb-4 bg-gray-50 text-2xl font-medium border border-gray-300 text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        ref={inputRef}
        onKeyDown={handleKeyDown}
      />
      <input
        ref={timeRef}
        className="bg-gray-50 border text-xl border-gray-300 text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        type="text"
        value={timeString}
        disabled={addTodo.isLoading}
        onChange={e => setTimeString(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {parsedData?.[0]?.format('YYYY/MM/DD HH:mm')} {parsedData?.[0]?.fromNow()}
      {parsedData?.[1]?.map((e, i) => (
        <span key={i}>{e.value}</span>
      ))}
      {addTodo.isLoading && <span>adding...</span>}
    </div>
  );
}
