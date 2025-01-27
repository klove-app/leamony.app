'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">500</h1>
        <p className="mt-4 text-xl text-gray-600">Произошла ошибка</p>
        <button
          onClick={reset}
          className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Попробовать снова
        </button>
      </div>
    </div>
  );
} 