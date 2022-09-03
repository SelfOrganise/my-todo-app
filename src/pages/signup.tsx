import { FormEvent } from 'react';
import { trpc } from '../utils/trpc';
import { useRouter } from 'next/router';

export default function SignUp(): JSX.Element {
  const createUser = trpc.useMutation(['users.create']);
  const router = useRouter();

  return (
    <div className="flex flex-col justify-center items-center w-full">
      <form
        className="flex flex-col w-72 mt-5 space-y-2"
        onSubmit={(form: FormEvent<HTMLFormElement & { email: HTMLInputElement; password: HTMLInputElement }>) => {
          createUser.mutateAsync(
            {
              email: form.currentTarget.email.value,
              password: form.currentTarget.password.value,
            },
            {
              onSuccess: () => {
                router.replace('/');
              },
              onError: res => {
                alert('Could not create account. ' + res.message);
              },
            }
          );

          form.preventDefault();
        }}
      >
        <input className="input" autoFocus type="text" name="email" placeholder="you@email.com" />
        <input className="input" type="password" name="password" placeholder="*****" />
        <input className="btn bg-gray-600" type="submit" value="create" />
      </form>
    </div>
  );
}
