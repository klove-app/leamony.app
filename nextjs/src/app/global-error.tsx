'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Ошибка</h1>
          <p className="text-xl text-gray-600 mb-4">Что-то пошло не так</p>
          <button
            onClick={() => reset()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    </div>
  );
} 