'use client';

import ErrorPage from '@/components/ErrorPage';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorPage
      title="Ошибка"
      description="Что-то пошло не так"
      action={{
        text: "Попробовать снова",
        onClick: () => reset()
      }}
    />
  );
} 