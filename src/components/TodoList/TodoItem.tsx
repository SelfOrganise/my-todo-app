import classNames from 'classnames';
import moment from 'moment';
import React, { useEffect, useRef } from 'react';
import { Todo } from '@prisma/client';

export function TodoItem({ todo, isSelected }: { todo: Todo; isSelected: boolean }): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSelected) {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }
  }, [isSelected]);

  return (
    <div
      ref={ref}
      className={classNames(`flex justify-between p-4 mb-2 `, {
        'outline-dotted outline-2 outline-green-400': isSelected,
        // 'outline-dashed outline 1 outline-gray-400': selectedIndex !== i,
        'bg-orange-700 bg-opacity-10': moment(todo.dueDate).isBefore(new Date()),
      })}
      key={todo.id}
    >
      <div className="text-red-500 mr-2 overflow-ellipsis overflow-hidden whitespace-nowrap">{todo.content}</div>
      <div className="whitespace-pre">
        {todo.dueDate && <div className="text-blue-300">{moment(todo.dueDate).fromNow()}</div>}
      </div>
    </div>
  );
}
