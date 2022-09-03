import classNames from 'classnames';
import { trpc } from '../../utils/trpc';
import { useAppStore } from '../../store/appStore';
import shallow from 'zustand/shallow';

export function Categories(): JSX.Element | null {
  const { showAddCategory, toggleAddCategory, currentCategoryId, setCurrentCategoryId } = useAppStore(
    state => ({
      showAddCategory: state.showAddCategory,
      toggleAddCategory: state.toggleAddCategory,
      currentCategoryId: state.currentCategoryId,
      setCurrentCategoryId: state.setCurrentCategoryId,
    }),
    shallow
  );
  const categories = trpc.useQuery(['categories.all'], {
    cacheTime: 0,
  });

  return (
    <div className="flex w-full space-x-4 mb-4 text-lg">
      <div
        onClick={() => setCurrentCategoryId(undefined)}
        className={classNames('cursor-pointer', { 'font-bold': !currentCategoryId })}
      >
        Uncategorized
      </div>
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
      {!categories.isLoading && categories.data && categories.data?.length < 2 && (
        <div onClick={toggleAddCategory}>{showAddCategory ? '(-)' : '(+)'}</div>
      )}
    </div>
  );
}
