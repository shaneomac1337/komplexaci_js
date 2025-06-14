'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-white text-2xl font-bold mb-4">Něco se pokazilo!</h2>
        <p className="text-gray-400 mb-6">
          Nepodařilo se načíst data pro Counter-Strike 2. Zkuste to prosím znovu.
        </p>
        <button
          onClick={reset}
          className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300"
        >
          Zkusit znovu
        </button>
      </div>
    </div>
  );
}
