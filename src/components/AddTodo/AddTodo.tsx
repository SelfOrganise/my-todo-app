import React, { useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import moment, { Moment } from 'moment/moment';
import { trpc } from '../../utils/trpc';
import { useHotkeys } from 'react-hotkeys-hook';
import { useAppStore } from '../../store/appStore';
import { parseTimeString, Token } from './parsetimeString';
import shallow from 'zustand/shallow';

export function AddTodo() {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);
  const [timeString, setTimeString] = useState('');
  const [parsedData, setParsedData] = useState<[Moment, Array<Token>] | null>(null);
  const addTodo = trpc.useMutation(['todos.add']);
  const updateTodo = trpc.useMutation(['todos.update']);
  const { invalidateQueries } = trpc.useContext();
  const [taskUnderEdit, setTaskUnderEdit] = useAppStore(
    state => [state.taskUnderEdit, state.setTaskUnderEdit],
    shallow
  );
  const currentCategoryId = useAppStore(state => state.currentCategoryId);
  const [showAddTodo, setShowAddTodo] = useState(false);

  useEffect(() => {
    if (taskUnderEdit && inputRef.current) {
      setShowAddTodo(true);
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
      setParsedData(parseTimeString(timeString));
    } catch {}
  }, [timeString]);

  const handleSave = useCallback(() => {
    if (!taskUnderEdit) {
      addTodo.mutate(
        {
          content: inputRef.current!.value,
          dueDate: parsedData?.[0]?.toDate(),
          categoryId: currentCategoryId,
        },
        {
          async onSuccess() {
            inputRef.current?.blur();
            inputRef.current!.value = '';
            setTimeString('');
            setParsedData(null);
            await invalidateQueries(['todos.all', { categoryId: currentCategoryId }]);
            setShowAddTodo(false);
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
            setTimeString('');
            setParsedData(null);
            setTaskUnderEdit(undefined);
            inputRef.current!.value = '';
            await invalidateQueries(['todos.all', { categoryId: currentCategoryId }]);
            setShowAddTodo(false);
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
      setParsedData(null);
      setTaskUnderEdit(undefined);
      setShowAddTodo(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  useHotkeys('i', event => {
    setShowAddTodo(true);
    inputRef.current?.focus();
    event.preventDefault();
  });

  return (
    <div
      className={classNames(
        `modal-box flex flex-col bg-base-300 shadow-xl p-4 w-full fixed w-[50%] top-[15vh] space-y-3`,
        {
          'right-[-2000px] top-[5vh]': !showAddTodo,
        }
      )}
    >
      <textarea className="textarea h-40 text-2xl" ref={inputRef} onKeyDown={handleKeyDown} />
      <input
        ref={timeRef}
        className="input"
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
