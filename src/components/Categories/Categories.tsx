import classNames from 'classnames';
import { trpc } from '../../utils/trpc';
import { useAppStore } from '../../store/appStore';
import shallow from 'zustand/shallow';
import { useEffect } from 'react';

export function Categories(): JSX.Element | null {
  const [showAddCategory, toggleAddCategory, currentCategoryId, setCurrentCategoryId] = useAppStore(
    state => [state.showAddCategory, state.toggleAddCategory, state.currentCategoryId, state.setCurrentCategoryId],
    shallow
  );

  const categories = trpc.useQuery(['categories.all'], {
    cacheTime: Infinity,
  });

  useEffect(() => {
    if (categories.data && categories.data[0]) {
      setCurrentCategoryId(categories.data[0].id);
    }
  }, [categories.data, setCurrentCategoryId]);

  return (
    <div className="flex w-full space-x-4 mb-4 text-lg">
      {categories.data?.map(c => (
        <div
          className={classNames('cursor-pointer', {
            'font-bold': c.id === currentCategoryId,
          })}
          onClick={() => setCurrentCategoryId(c.id)}
          key={c.id}
        >
          {c.title}
        </div>
      ))}
      {!categories.isLoading && categories.data && (
        <div onClick={toggleAddCategory}>{showAddCategory ? '(-)' : '(+)'}</div>
      )}
    </div>
  );
}
