import React, { SyntheticEvent, useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import moment, { Moment } from 'moment/moment';
import { trpc } from '../../utils/trpc';
import { useHotkeys } from 'react-hotkeys-hook';
import { useAppStore } from '../../store/appStore';
import { parseTimeString, Token } from './parsetimeString';
import shallow from 'zustand/shallow';
import { Category, Todo } from '@prisma/client';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

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
  const [currentCategory, setCurrentCategory] = useState<Category>();
  const [showAddTodo, setShowAddTodo] = useAppStore(store => [store.showAddTodo, store.setShowAddTodo], shallow);
  const categories = trpc.useQuery(['categories.all'], {
    cacheTime: Infinity,
  });
  const router = useRouter();

  const showDialog = useCallback(() => {
    setShowAddTodo(true);
    inputRef.current?.focus();
  }, [setShowAddTodo]);

  useEffect(() => {
    if (inputRef.current && (router.query.title || router.query.text || router.query.url)) {
      inputRef.current.value = `${router.query.title || ''}\n${router.query.text || ''}\n${
        router.query.url || ''
      }`.trim();
      showDialog();
    }
  }, [router.query.text, router.query.title, router.query.url, setShowAddTodo, showAddTodo, showDialog]);

  const globalCategory = useAppStore(state => state.currentCategory);
  useEffect(() => {
    if (globalCategory && !currentCategory) {
      setCurrentCategory(globalCategory);
    }
  }, [currentCategory, globalCategory]);

  useEffect(() => {
    if (taskUnderEdit && inputRef.current) {
      showDialog();
      inputRef.current.value = taskUnderEdit.content;
      if (taskUnderEdit.dueDate) {
        const date = moment(taskUnderEdit.dueDate);
        // note: editing an item keeps its original date (a bit of a workaround)
        setTimeString(date.toISOString());
        setParsedData([date, []]);
      }
    }
  }, [setShowAddTodo, showDialog, taskUnderEdit]);

  const hideDialog = useCallback(() => {
    setShowAddTodo(false);
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
  }, [setShowAddTodo, setTaskUnderEdit]);

  const handleTimeInputChange = useCallback((value: string) => {
    setTimeString(value || '');

    try {
      setParsedData(parseTimeString(value));
    } catch {}
  }, []);

  const handleCategoryChange = useCallback(
    (e: SyntheticEvent<HTMLSelectElement>) => {
      const category = categories.data?.find(c => c.id === e?.currentTarget?.value);

      if (category) {
        setCurrentCategory(category);
      }
    },
    [categories.data]
  );

  const handleSave = useCallback(() => {
    if (!currentCategory || !inputRef.current?.value.trim()) {
      hideDialog();
      return;
    }

    const mutateOptions = {
      async onSuccess(data: Todo) {
        await invalidateQueries(['todos.all', { categoryId: currentCategory.id }]);
        setTaskToFocus(data);
        router.replace('/').then(() => {
          hideDialog();
        });
      },
    };

    let promise = null;

    // create new todo
    if (!taskUnderEdit) {
      promise = addTodo.mutateAsync(
        {
          content: inputRef.current!.value,
          dueDate: parsedData?.[0]?.toDate(),
          categoryId: currentCategory.id,
        },
        mutateOptions
      );
      // update existing todo
    } else {
      promise = updateTodo.mutateAsync(
        {
          id: taskUnderEdit.id,
          content: inputRef.current!.value,
          dueDate: parsedData?.[0]?.toDate(),
        },
        mutateOptions
      );
    }

    toast.promise(promise, {
      loading: 'Saving...',
      success: <b>Todo saved!</b>,
      error: <b>Could not save.</b>,
    });
  }, [
    addTodo,
    currentCategory,
    hideDialog,
    invalidateQueries,
    parsedData,
    router,
    setTaskToFocus,
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
      router.replace('/').then(() => hideDialog());
    }
  };

  useHotkeys(
    'i',
    event => {
      if (!currentCategory) {
        return;
      }

      showDialog();
      event.preventDefault();
    },
    [currentCategory, showDialog]
  );

  const handleClose = useCallback(() => {
    router.replace('/').then(() => {
      hideDialog();
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    });
  }, [hideDialog, router]);

  return (
    <div
      className={classNames(
        `modal-box flex flex-col bg-base-300 shadow-xl p-4 w-full fixed max-w-[30rem] top-[15vh] space-y-3`,
        {
          'right-[-2000px] top-[5vh]': !showAddTodo,
        }
      )}
    >
      <textarea className="textarea h-40 text-xl" ref={inputRef} onKeyDown={handleKeyDown} />
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
        {parsedData?.[0]?.format('dddd HH:mm')} {parsedData?.[0]?.fromNow()}
        {parsedData?.[1]?.map((e, i) => (
          <span key={i}>{e.value}</span>
        ))}
      </div>
      <div className="flex flex-row justify-between">
        <button className="btn" onClick={handleClose}>
          Close
        </button>
        {categories.data && currentCategory?.id && (
          <select className="select" value={currentCategory.id} onChange={handleCategoryChange}>
            {categories.data.map(c => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        )}
        <button className="btn btn-primary" onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  );
}
