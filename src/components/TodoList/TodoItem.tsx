import classNames from 'classnames';
import moment from 'moment';
import React, { useEffect, useMemo, useRef } from 'react';
import { Todo } from '@prisma/client';

interface TodoItemProps {
  todo: Todo;
  isSelected: boolean;
  onClick?: () => void;
}

export function TodoItem({ todo, isSelected, onClick }: TodoItemProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const parsedDueDate = moment(todo.dueDate);
  const now = new Date();

  useEffect(() => {
    if (isSelected) {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }
  }, [isSelected]);

  const [firstLine, restOfContent] = useMemo(() => {
    const lines = todo.content?.split('\n');
    if (lines.length > 1) {
      debugger;
      return [lines[0] + '\n', lines.slice(1).join('\n')];
    }

    return [todo.content];
  }, [todo.content]);

  return (
    <div
      onClick={onClick}
      ref={ref}
      className={classNames(`flex items-center justify-between p-2 mb-2 cursor-pointer`, {
        'outline-dashed outline-1 outline-green-400 rounded-sm': isSelected,
        'text-red-500': parsedDueDate.isBefore(now),
        'text-sky-400': parsedDueDate.isAfter(now),
        'text-gray-300': !parsedDueDate.isValid(),
      })}
      key={todo.id}
    >
      <div className={classNames('mr-2 whitespace-pre overflow-hidden')}>
        <div className="overflow-hidden overflow-ellipsis">{firstLine}</div>
        <div
          className={classNames('transition-all ease-in duration-200', {
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
    </div>
  );
}
