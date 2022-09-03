import { trpc } from '../../utils/trpc';
import { FormEvent } from 'react';
import { useAppStore } from '../../store/appStore';

interface AddCategoryProps {
  onFinished?: () => void;
}

export function AddCategory({ onFinished }: AddCategoryProps): JSX.Element | null {
  const showAddCategory = useAppStore(state => state.showAddCategory);
  const addCategory = trpc.useMutation('categories.create');
  const { invalidateQueries } = trpc.useContext();

  if (!showAddCategory) {
    return null;
  }

  return (
    <form
      className="flex flex-col fixed w-80 top-[10%] bg-gray-700 rounded p-2 space-y-2"
      onSubmit={(form: FormEvent<HTMLFormElement & { title: HTMLInputElement }>) => {
        addCategory.mutateAsync(
          {
            title: form.currentTarget.title.value,
          },
          {
            onSuccess: () => {
              invalidateQueries('categories.all');
              onFinished && onFinished();
            },
            onError: res => {
              alert('Could not create category. ' + res.message);
            },
          }
        );

        form.preventDefault();
      }}
    >
      <input autoFocus type="text" className="input" name="title" placeholder="Category title" />
      <input className="btn" type="submit" value="create" />
    </form>
  );
}
