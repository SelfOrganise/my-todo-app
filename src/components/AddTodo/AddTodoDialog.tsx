import React, { useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import moment, { Moment } from 'moment/moment';
import { trpc } from '../../utils/trpc';
import { useHotkeys } from 'react-hotkeys-hook';
import { useAppStore } from '../../store/appStore';
import { parseTimeString, Token } from './parsetimeString';
import shallow from 'zustand/shallow';

export function AddTodoDialog() {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);
  const [timeString, setTimeString] = useState('');
  const [parsedData, setParsedData] = useState<[Moment | null, Array<Token>] | null>(null);
  const addTodo = trpc.useMutation(['todos.add']);
  const updateTodo = trpc.useMutation(['todos.update']);
  const { invalidateQueries } = trpc.useContext();
  const [taskUnderEdit, setTaskUnderEdit, setTaskToFocus] = useAppStore(
    state => [state.taskUnderEdit, state.setTaskUnderEdit, state.setTaskToFocus],
    shallow
  );
  const currentCategoryId = useAppStore(state => state.currentCategoryId);
  const [showAddTodo, setShowAddTodo] = useAppStore(store => [store.showAddTodo, store.setShowAddTodo], shallow);

  useEffect(() => {
    if (taskUnderEdit && inputRef.current) {
      setShowAddTodo(true);
      inputRef.current.value = taskUnderEdit.content;
      if (taskUnderEdit.dueDate) {
        const date = moment(taskUnderEdit.dueDate);
        // note: editing an item keeps its original date (a bit of a workaround)
        setTimeString(date.toISOString());
        setParsedData([date, []]);
      }
    }
  }, [setShowAddTodo, taskUnderEdit]);

  // focus on show, clear on hide
  useEffect(() => {
    if (showAddTodo) {
      inputRef.current?.focus();
    } else {
      if (timeRef.current) {
        timeRef.current.value = '';
        timeRef.current?.blur();
      }
      if (inputRef.current) {
        inputRef.current.value = '';
        inputRef.current?.blur();
      }
      setTimeString('');
      setParsedData(null);
      setTaskUnderEdit(undefined);
    }
  }, [setShowAddTodo, setTaskUnderEdit, showAddTodo]);

  const handleTimeInputChange = useCallback((value: string) => {
    setTimeString(value || '');

    try {
      setParsedData(parseTimeString(value));
    } catch {}
  }, []);

  const handleSave = useCallback(() => {
    if (!taskUnderEdit) {
      if (!currentCategoryId) {
        return;
      }

      addTodo.mutate(
        {
          content: inputRef.current!.value,
          dueDate: parsedData?.[0]?.toDate(),
          categoryId: currentCategoryId,
        },
        {
          async onSuccess(data) {
            setTimeString('');
            setParsedData(null);
            await invalidateQueries(['todos.all', { categoryId: currentCategoryId }]);
            setTaskToFocus(data);
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
            if (currentCategoryId) {
              await invalidateQueries(['todos.all', { categoryId: currentCategoryId }]);
            }
            setShowAddTodo(false);
          },
        }
      );
    }
  }, [
    addTodo,
    currentCategoryId,
    invalidateQueries,
    parsedData,
    setShowAddTodo,
    setTaskToFocus,
    setTaskUnderEdit,
    taskUnderEdit,
    updateTodo,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (e.shiftKey) {
      return;
    }

    if (e.key === 'Enter') {
      handleSave();
    }

    if (e.key === 'Escape') {
      setShowAddTodo(false);
    }
  };

  useHotkeys(
    'i',
    event => {
      if (!currentCategoryId) {
        return;
      }

      setShowAddTodo(true);
      event.preventDefault();
    },
    [currentCategoryId]
  );

  return (
    <div
      className={classNames(
        `modal-box flex flex-col bg-base-300 shadow-xl p-4 w-full fixed max-w-[30rem] top-[15vh] space-y-3`,
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
        onChange={e => handleTimeInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className="flex flex-col">
        {parsedData?.[0]?.format('dddd HH:mm')} ({parsedData?.[0]?.fromNow()})
        {parsedData?.[1]?.map((e, i) => (
          <span key={i}>{e.value}</span>
        ))}
      </div>
      <button className="btn btn-primary" onClick={handleSave}>
        Save
      </button>
      <button className="btn" onClick={() => setShowAddTodo(false)}>
        Close
      </button>
    </div>
  );
}
