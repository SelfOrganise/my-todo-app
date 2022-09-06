import React from 'react';
import { useAppStore } from '../../store/appStore';
import shallow from 'zustand/shallow';

export function AddTodoButton(): JSX.Element {
  const [showAddTodo, setShowAddTodo] = useAppStore(store => [store.showAddTodo, store.setShowAddTodo], shallow);

  return (
    <button className="btn fixed bottom-[2rem] w-36 bg-gray-700" onClick={() => setShowAddTodo(!showAddTodo)}>
      {showAddTodo ? 'Close' : 'Add'}
    </button>
  );
}
