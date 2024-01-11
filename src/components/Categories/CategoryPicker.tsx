import { trpc } from '../../utils/trpc';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { Category } from '@prisma/client';
import { createPopper } from '@popperjs/core';

interface CategoryPickerProps {
  value: Category | undefined;
  onSelected: (category: Category | undefined) => void;
  className?: string;
  onBlur?: () => void;
  autoFocus?: boolean;
}

export const CategoryPicker = forwardRef<HTMLInputElement, CategoryPickerProps>(
  ({ onSelected, value, className, onBlur, autoFocus }, forwardRef): JSX.Element | null => {
    const categories = trpc.useQuery(['categories.all'], {
      cacheTime: Infinity,
    });

    const [searchText, setSearchText] = useState('');
    const [showList, setShowList] = useState(false);
    const [index, setIndex] = useState(0);
    const [applyFilter, setApplyFilter] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(forwardRef, () => inputRef.current!);

    const filteredCategories = useMemo(() => {
      const result = applyFilter
        ? categories.data?.filter(c => c.title.toLowerCase().includes(searchText.toLowerCase()))
        : categories.data;

      if (result?.length && result.length - 1 < index) {
        setIndex(0);
      }

      return result;
    }, [applyFilter, categories.data, index, searchText]);

    useEffect(() => {
      // _something_ rerenders and only with this timeout I could get the input to focus when (m)ove hotkey is pressed
      setTimeout(() => {
        if (autoFocus) {
          inputRef.current?.focus();
          inputRef.current?.select();
        }
      }, 0)
    }, [autoFocus]);

    // set initial category on page load
    useEffect(() => {
      if (value) {
        setSearchText(value.title);
      }
    }, [value]);

    const handleSelected = useCallback(
      (category: Category, i: number) => {
        setIndex(i);
        onSelected(category);
        setSearchText(category.title);
        setApplyFilter(false);
      },
      [onSelected]
    );

    const restoreInput = useCallback(() => {
      if (value) {
        setSearchText(value.title);
      }
    }, [value]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Escape') {
          restoreInput();
          setApplyFilter(false);
          e.currentTarget.blur();
        } else if (!filteredCategories) {
          return;
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setIndex(Math.max(index - 1, 0));
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setIndex(Math.min(index + 1, filteredCategories.length - 1));
        } else if (e.key === 'Enter') {
          const category = filteredCategories[index];
          if (category) {
            handleSelected(category, index);
          } else {
            restoreInput();
          }
          e.currentTarget.blur();
        } else if (e.key.match(/^[a-z]$/)) {
          // when a key is pressed, apply filter
          setApplyFilter(true);
        }
      },
      [filteredCategories, restoreInput, index, handleSelected]
    );

    useEffect(() => {
      if (!inputRef.current || !listRef.current) {
        return;
      }

      if (showList) {
        const popper = createPopper(inputRef.current, listRef.current, {
          placement: 'bottom-start',
          strategy: 'fixed',
        });

        inputRef.current?.focus();
        inputRef.current?.select();

        return () => popper.destroy();
      }
    }, [showList]);

    return (
      <div className="relative">
        <input
          className={classNames(className, 'bg-transparent p-1')}
          ref={inputRef}
          onFocus={() => setShowList(true)}
          onBlur={() => {
            onBlur && onBlur();
            setShowList(false);
          }}
          value={searchText}
          onChange={e => setSearchText(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          type="text"
        />
        {showList && (
          <div ref={listRef} className="bg-primary border-4 border-neutral min-w-[150px] z-50">
            {filteredCategories?.map((c, i) => (
              <div
                key={c.id}
                onMouseDown={() => handleSelected(c, i)}
                className={classNames('p-2 cursor-pointer', {
                  'font-bold text-sky-400': i === index,
                })}
              >
                {c.title}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

CategoryPicker.displayName = 'CategoryPicker';
