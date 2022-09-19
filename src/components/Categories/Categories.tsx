import { useAppStore } from '../../store/appStore';
import shallow from 'zustand/shallow';
import { trpc } from '../../utils/trpc';
import React, { useCallback, useEffect, useRef } from 'react';
import { CategoryPicker } from './CategoryPicker';

export function Categories(): JSX.Element | null {
  const ref = useRef<HTMLInputElement>(null);
  const [setCurrentCategory, currentCategory, showAddCategory, toggleAddCategory] = useAppStore(
    state => [state.setCurrentCategory, state.currentCategory, state.showAddCategory, state.toggleAddCategory],
    shallow
  );

  const categories = trpc.useQuery(['categories.all'], {
    cacheTime: Infinity,
  });

  // set initial category on page load
  useEffect(() => {
    if (!currentCategory && categories.data && categories.data[0]) {
      setCurrentCategory(categories.data[0]);
    }
  }, [categories.data, currentCategory, setCurrentCategory]);

  // useHotkeys('/', event => {
  //   event.preventDefault();
  //   ref.current?.focus();
  // });

  return (
    <div className="flex w-full justify-between mb-2">
      <CategoryPicker
        ref={ref}
        value={currentCategory}
        onSelected={useCallback(c => setCurrentCategory(c), [setCurrentCategory])}
      />
    </div>
  );
}
