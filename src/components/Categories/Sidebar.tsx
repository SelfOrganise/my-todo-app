import useHotkeys from '@reecelucas/react-use-hotkeys';
import classNames from 'classnames';
import { useCallback, useEffect, useState } from 'react';
import shallow from 'zustand/shallow';
import { useAppStore } from '../../store/appStore';
import { trpc } from '../../utils/trpc';
import { AddCategory } from './AddCategory';

export function Sidebar({ children }: React.PropsWithChildren<unknown>): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const categories = trpc.useQuery(['categories.all'], {
    cacheTime: Infinity,
  });

  const [setCurrentCategory, currentCategory, showAddCategory, toggleAddCategory] = useAppStore(
    state => [state.setCurrentCategory, state.currentCategory, state.showAddCategory, state.toggleAddCategory],
    shallow
  );

  useHotkeys('/', event => {
    setIsOpen(old => !old);
    event.preventDefault();
  });

  useHotkeys(
    'Escape',
    useCallback(() => {
      setIsOpen(false);
    }, [])
  );

  useHotkeys(
    'Control+j',
    useCallback(
      event => {
        event.preventDefault();
        const index = categories.data?.findIndex(c => c === currentCategory) || 0;
        const next = categories.data?.[index + 1];
        if (next) {
          setCurrentCategory(next);
        }
      },
      [categories.data, currentCategory, setCurrentCategory]
    )
  );

  useHotkeys(
    'Control+k',
    useCallback(
      event => {
        event.preventDefault();
        const index = categories.data?.findIndex(c => c === currentCategory) || 0;
        const next = categories.data?.[index - 1];
        if (next) {
          setCurrentCategory(next);
        }
      },
      [categories.data, currentCategory, setCurrentCategory]
    )
  );

  // set initial category on page load
  useEffect(() => {
    if (!currentCategory && categories.data && categories.data[0]) {
      setCurrentCategory(categories.data[0]);
    }
  }, [categories.data, currentCategory, setCurrentCategory]);

  return (
    <div className="drawer">
      <input readOnly={true} id="sidebarDrawer" type="checkbox" className="drawer-toggle" checked={isOpen} />
      <div className="drawer-content">
        <div className="max-w-4xl mx-auto">
          <div className="navbar bg-base-100">
            <label
              onClick={() => setIsOpen((old: boolean) => !old)}
              htmlFor="sidebarDrawer"
              className="btn btn-ghost drawer-button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="inline-block w-5 h-5 stroke-current"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
              <span className="ml-2">{currentCategory?.title}</span>
            </label>
          </div>
          <main className="container mx-auto flex flex-col items-center justify-center px-5 max-w-4xl">{children}</main>
        </div>
      </div>
      <div className="drawer-side">
        <label htmlFor="sidebarDrawer" className="drawer-overlay" onClick={() => setIsOpen(false)}></label>
        <ul className="menu p-4 overflow-y-auto w-80 bg-base-100 text-base-content">
          <AddCategory />
          {categories.data?.map(c => (
            <li
              onClick={() => {
                setIsOpen(false);
                setCurrentCategory(c);
              }}
              className={classNames({ bordered: c.id === currentCategory?.id })}
              key={c.id}
            >
              <a>{c.title}</a>
            </li>
          ))}
          <li>
            {!categories.isLoading && categories.data && (
              <button onClick={toggleAddCategory}>{showAddCategory ? 'close' : 'add'}</button>
            )}
          </li>
        </ul>
      </div>
    </div>
  );
}
