import SelectSearch, { fuzzySearch, SelectedOptionValue, SelectSearchOption } from 'react-select-search';
import shallow from 'zustand/shallow';
import { trpc } from '../../utils/trpc';
import { useAppStore } from '../../store/appStore';
import { useHotkeys } from 'react-hotkeys-hook';
import { useEffect, useMemo, useRef } from 'react';

export function CategoryPicker(): JSX.Element | null {
  const [setCurrentCategoryId, currentCategoryId, showAddCategory, toggleAddCategory] = useAppStore(
    state => [state.setCurrentCategoryId, state.currentCategoryId, state.showAddCategory, state.toggleAddCategory],
    shallow
  );

  const ref = useRef<any>(null);

  const categories = trpc.useQuery(['categories.all'], {
    cacheTime: Infinity,
  });

  useEffect(() => {
    if (categories.data && categories.data[0]) {
      setCurrentCategoryId(categories.data[0].id);
    }
  }, [categories.data, setCurrentCategoryId]);

  const options = useMemo(
    () =>
      categories.data?.map(c => ({
        name: c.title,
        value: c.id,
      })) || [],
    [categories.data]
  );

  useHotkeys('/', event => {
    event.preventDefault();
    ref.current?.querySelector('input')?.focus();
  });

  return (
    <div className="flex w-full justify-between mb-2">
      <SelectSearch
        ref={ref}
        value={options.find(o => o.value === currentCategoryId)?.value}
        filterOptions={fuzzySearch}
        search={true}
        autoComplete="on"
        options={options}
        placeholder="Search categories"
        onChange={(e: any) => setCurrentCategoryId(e)}
      />
      {!categories.isLoading && categories.data && (
        <div onClick={toggleAddCategory}>{showAddCategory ? '(-)' : '(+)'}</div>
      )}
    </div>
  );
}
