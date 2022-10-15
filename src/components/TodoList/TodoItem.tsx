import classNames from 'classnames';
import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Category } from '@prisma/client';
import { CategoryPicker } from '../Categories';
import { inferQueryOutput, trpc } from '../../utils/trpc';
import { useAppStore } from '../../store/appStore';
import useHotkeys from '@reecelucas/react-use-hotkeys';

interface TodoItemProps {
  todo: inferQueryOutput<'todos.all'>[number];
  isSelected: boolean;
  onClick?: () => void;
}

export function TodoItem({ todo, isSelected, onClick }: TodoItemProps): JSX.Element {
  const now = new Date();
  const ref = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLInputElement>(null);
  const parsedDueDate = moment(todo.dueDate);
  const currentCategory = useAppStore(s => s.currentCategory);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const updateCategory = trpc.useMutation(['todos.updateCategory']);
  const { invalidateQueries } = trpc.useContext();
  const categories = trpc.useQuery(['categories.all'], {
    cacheTime: Infinity,
  });

  useEffect(() => {
    if (isSelected) {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }
  }, [isSelected]);

  const [firstLine, restOfContent] = useMemo(() => {
    const lines = todo.content?.split('\n');
    if (lines.length > 1) {
      return [lines[0] + '\n', lines.slice(1).join('\n')];
    }

    return [todo.content];
  }, [todo.content]);

  const handleCategoryChanged = useCallback(
    (c?: Category) => {
      if (!c) {
        return;
      }

      updateCategory.mutate(
        {
          id: todo.id,
          categoryId: c.id,
        },
        {
          onSuccess: () => {
            if (currentCategory?.id) {
              invalidateQueries(['todos.all', { categoryId: currentCategory.id }]);
            }
          },
        }
      );
    },
    [currentCategory?.id, invalidateQueries, todo.id, updateCategory]
  );

  useHotkeys(
    'm',
    event => {
      event.preventDefault();
      setShowCategoryPicker(true);
    },
    {
      enabled: isSelected,
    }
  );

  const contentClassNames = classNames({
    'text-red-500': parsedDueDate.isBefore(now),
    'text-sky-400': parsedDueDate.isAfter(now),
    'text-gray-300': !parsedDueDate.isValid(),
  });

  return (
    <div
      onClick={onClick}
      ref={ref}
      className={classNames(`relative flex items-center justify-between p-2 mb-2 cursor-pointer`, {
        'outline-dashed outline-1 outline-green-400 rounded-sm': isSelected,
      })}
      key={todo.id}
    >
      <div className={classNames('mr-2 whitespace-pre overflow-hidden')}>
        <div className="overflow-hidden overflow-ellipsis">
          {showCategoryPicker ? (
            <div className="flex">
              <span>Move to: </span>
              <CategoryPicker
                className="outline-0 p-0"
                ref={categoryRef}
                value={categories.data?.find(c => c.id === todo.categoryId)}
                autoFocus={true}
                onSelected={handleCategoryChanged}
                onBlur={() => setShowCategoryPicker(false)}
              />
            </div>
          ) : (
            <span className={contentClassNames}>{firstLine}</span>
          )}
        </div>
        <div
          className={classNames(contentClassNames, 'transition-all ease-in duration-200', {
            'max-h-0': !isSelected,
            'max-h-96': isSelected,
          })}
        >
          {restOfContent}
        </div>
      </div>
      <div className="whitespace-pre text-xs h-full tracking-tight">
        {todo.dueDate && <div className="italic text-gray-500">{parsedDueDate.fromNow()}</div>}
      </div>
      {!currentCategory && <span>{todo.category.title}</span>}
    </div>
  );
}
