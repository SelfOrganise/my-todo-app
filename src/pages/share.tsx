import { useRouter } from 'next/router';

export default function Share(): JSX.Element {
  const router = useRouter();

  console.log(router);

  return <div className="flex flex-col justify-center items-center w-full">{Object.entries(router.query).join(':')}</div>;
}
