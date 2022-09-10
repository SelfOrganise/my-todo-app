import shallow from 'zustand/shallow';
import { trpc } from '../../utils/trpc';
import { useAppStore } from '../../store/appStore';
import { useHotkeys } from 'react-hotkeys-hook';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { Category } from '@prisma/client';

export function CategoryPicker(): JSX.Element | null {
  const [setCurrentCategoryId, currentCategoryId, showAddCategory, toggleAddCategory] = useAppStore(
    state => [state.setCurrentCategoryId, state.currentCategoryId, state.showAddCategory, state.toggleAddCategory],
    shallow
  );

  const categories = trpc.useQuery(['categories.all'], {
    cacheTime: Infinity,
  });

  const [searchText, setSearchText] = useState('');
  const [showList, setShowList] = useState(false);
  const [currentCategoryIndex, setCategoryIndex] = useState(0);
  const [applyFilter, setApplyFilter] = useState(false);

  const filteredCategories = useMemo(() => {
    const result = applyFilter
      ? categories.data?.filter(c => c.title.toLowerCase().includes(searchText.toLowerCase()))
      : categories.data;

    if (result?.length && result.length - 1 < currentCategoryIndex) {
      setCategoryIndex(0);
    }

    return result;
  }, [applyFilter, categories.data, currentCategoryIndex, searchText]);

  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentCategoryId && filteredCategories && filteredCategories[0]) {
      setCurrentCategoryId(filteredCategories[0].id);
      setSearchText(filteredCategories[0].title);
    }
  }, [currentCategoryId, filteredCategories, setCurrentCategoryId]);

  useHotkeys('/', event => {
    event.preventDefault();
    ref.current?.focus();
    ref.current?.select();
  });

  const handleSelected = useCallback(
    (category: Category) => {
      const index = Math.max(0, categories.data?.findIndex(c => c.id === category.id) || 0);
      setCategoryIndex(index);
      setCurrentCategoryId(category.id);
      setSearchText(category.title);
      setApplyFilter(false);
    },
    [categories.data, setCurrentCategoryId]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        const category = categories.data?.find(c => c.id === currentCategoryId);

        if (category) {
          setSearchText(category.title);
        }

        setApplyFilter(false);
        e.currentTarget.blur();
      } else if (!filteredCategories) {
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCategoryIndex(Math.max(currentCategoryIndex - 1, 0));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCategoryIndex(Math.min(currentCategoryIndex + 1, filteredCategories.length - 1));
      } else if (e.key === 'Enter') {
        const category = filteredCategories[currentCategoryIndex];
        if (category) {
          handleSelected(category);
        }
        e.currentTarget.blur();
      } else if (e.key.match(/^[a-z]$/)) {
        // when a key is pressed, apply filter
        setApplyFilter(true);
      }
    },
    [filteredCategories, categories.data, currentCategoryId, currentCategoryIndex, handleSelected]
  );

  return (
    <div className="flex w-full justify-between mb-2">
      <input
        className="bg-transparent p-1"
        ref={ref}
        onFocus={() => setShowList(true)}
        onBlur={() => setShowList(false)}
        value={searchText}
        onChange={e => setSearchText(e.currentTarget.value)}
        onKeyDown={handleKeyDown}
        type="text"
      />
      {showList && (
        <div className="absolute top-14 bg-primary border-4 min-w-[150px]">
          {filteredCategories?.map((c, i) => (
            <div
              key={c.id}
              onMouseDown={() => handleSelected(c)}
              className={classNames('p-2 cursor-pointer', {
                'font-bold text-sky-400': i === currentCategoryIndex,
              })}
            >
              {c.title}
            </div>
          ))}
        </div>
      )}
      {!categories.isLoading && categories.data && (
        <div onClick={toggleAddCategory}>{showAddCategory ? '(-)' : '(+)'}</div>
      )}
    </div>
  );
}
