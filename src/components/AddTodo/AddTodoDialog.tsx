import React, { SyntheticEvent, useCallback, useEffect, useRef, useState } from 'react';
import moment, { Moment } from 'moment/moment';
import { trpc } from '../../utils/trpc';
import { useAppStore } from '../../store/appStore';
import { parseTimeString, Token } from './parsetimeString';
import { Category, Todo } from '@prisma/client';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

interface AddTodoDialogProps {
  task?: Todo;
  onClose: (todo?: Todo) => void;
}

export function AddTodoDialog({ onClose, task }: AddTodoDialogProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);
  const [timeString, setTimeString] = useState('');
  const [parsedData, setParsedData] = useState<[Moment | null, Array<Token>] | null>(null);
  const addTodo = trpc.useMutation(['todos.add']);
  const updateTodo = trpc.useMutation(['todos.update']);
  const { invalidateQueries } = trpc.useContext();
  const [currentCategory, setCurrentCategory] = useState<Category>();
  const router = useRouter();
  const categories = trpc.useQuery(['categories.all'], {
    cacheTime: Infinity,
  });

  useEffect(() => {
    if (inputRef.current && (router.query.title || router.query.text || router.query.url)) {
      inputRef.current.value = `${router.query.title || ''}\n${router.query.text || ''}\n${
        router.query.url || ''
      }`.trim();
    }
  }, [router.query.text, router.query.title, router.query.url]);

  const globalCategory = useAppStore(state => state.currentCategory);
  useEffect(() => {
    if (globalCategory && !currentCategory) {
      setCurrentCategory(globalCategory);
    }
  }, [currentCategory, globalCategory]);

  useEffect(() => {
    if (task && inputRef.current) {
      inputRef.current.value = task.content;

      if (categories.data && task?.categoryId) {
        setCurrentCategory(categories.data.find(c => c.id === task.categoryId));
      }

      if (task.dueDate) {
        const date = moment(task.dueDate);
        // note: editing an item keeps its original date (a bit of a workaround)
        setTimeString(date.toISOString());
        setParsedData([date, []]);
      }
    }
  }, [categories.data, task]);

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
      return;
    }

    const mutateOptions = {
      async onSuccess(data: Todo) {
        await invalidateQueries(['todos.all', { categoryId: currentCategory.id }]);
        router.replace('/').then(() => {
          onClose(data);
        });
      },
    };

    let promise = null;

    // create new todo
    if (!task) {
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
          id: task.id,
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
  }, [addTodo, currentCategory, invalidateQueries, onClose, parsedData, router, task, updateTodo]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (e.shiftKey) {
      return;
    }

    if (e.key === 'Enter') {
      handleSave();
    }

    if (e.key === 'Escape') {
      router.replace('/').then(() => onClose());
    }
  };

  const handleClose = useCallback(() => {
    router.replace('/').then(() => {
      onClose();
    });
  }, [onClose, router]);

  return (
    <div className="modal-box flex flex-col bg-base-300 shadow-xl p-4 w-full fixed max-w-[30rem] top-[15vh] space-y-3">
      <textarea autoFocus={true} className="textarea h-40 text-xl" ref={inputRef} onKeyDown={handleKeyDown} />
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
