import classNames from 'classnames';
import moment from 'moment';
import React, { useEffect, useRef } from 'react';
import { Todo } from '@prisma/client';

export function TodoItem({ todo, isSelected }: { todo: Todo; isSelected: boolean }): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const parsedDueDate = moment(todo.dueDate);
  const now = new Date();

  useEffect(() => {
    if (isSelected) {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }
  }, [isSelected]);

  return (
    <div
      ref={ref}
      className={classNames(`flex items-center justify-between p-2 mb-2 text-sm antialiased`, {
        'outline-dashed outline-1 outline-green-400 rounded-sm': isSelected,
        // 'outline-dashed outline 1 outline-gray-400': selectedIndex !== i,
        'text-red-500': parsedDueDate.isBefore(now),
        'text-gray-300': parsedDueDate.isAfter(now),
        'text-blue-300': !parsedDueDate.isValid(),
      })}
      key={todo.id}
    >
      <div
        className={classNames('mr-2 ', {
          'overflow-ellipsis overflow-hidden whitespace-nowrap': !isSelected,
          'whitespace-pre': isSelected,
        })}
      >
        {todo.content}
      </div>
      <div className="whitespace-pre text-xs h-full tracking-tight">
        {todo.dueDate && <div>{moment(todo.dueDate).fromNow()}</div>}
      </div>
    </div>
  );
}
