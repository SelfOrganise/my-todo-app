import { useCallback, useEffect, useRef, useState } from 'react';
import moment, { Moment } from 'moment/moment';
import { trpc } from '../../utils/trpc';
import parseTimeString from 'timestring';

export function Input() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [timeString, setTimeString] = useState('');
  const [parsedTime, setParsedTime] = useState<Moment | null>(null);
  const addTodo = trpc.useMutation(['todos.add']);
  const { invalidateQueries } = trpc.useContext();

  useEffect(() => {
    if (!timeString) {
      return;
    }

    try {
      const parsed = parseTimeString(timeString, 'minutes');
      setParsedTime(moment().add(parsed, 'minutes'));
    } catch {}
  }, [timeString]);

  const handleAdd = useCallback(() => {
    addTodo.mutate(
      {
        content: inputRef.current!.value,
        dueDate: parsedTime?.toDate(),
      },
      {
        async onSuccess() {
          inputRef.current!.value = '';
          await invalidateQueries(['todos.all']);
        },
      }
    );

  }, [addTodo, parsedTime]);

  return (
    <div className="flex flex-col bg-blue-100 p-4 w-full">
      <input type="text" ref={inputRef} disabled={addTodo.isLoading} />
      <input
        type="text"
        value={timeString}
        disabled={addTodo.isLoading}
        onChange={e => setTimeString(e.target.value)}
      />
      {parsedTime?.format('YYYY/MM/DD HH:mm')} {parsedTime?.fromNow()}
      <button type="button" value="add" onClick={handleAdd}>
        Add
      </button>
      {addTodo.isLoading && <span>adding...</span>}
    </div>
  );
}
