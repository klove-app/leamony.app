'use client';

import ClientPage from '@/components/ClientPage';

export default function Error() {
  return (
    <ClientPage>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Ошибка</h1>
          <p className="text-xl text-gray-600">Что-то пошло не так</p>
        </div>
      </div>
    </ClientPage>
  );
} 