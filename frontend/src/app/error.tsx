'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Tracker caught a global error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] p-4 font-sans text-stone-800">
      <div className="max-w-md w-full bg-white/90 backdrop-blur-sm p-8 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100/50 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Oops, something went wrong!</h2>
        <p className="text-stone-500 mb-8 text-sm">
          We encountered an unexpected issue while loading your Tracker dashboard. Don't worry, your data is perfectly safe.
        </p>
        <button
          onClick={() => reset()}
          className="w-full flex items-center justify-center space-x-2 bg-stone-800 hover:bg-stone-700 text-white font-medium py-3 px-6 rounded-xl transition-colors duration-200"
        >
          <RefreshCcw className="w-4 h-4" />
          <span>Reload Dashboard</span>
        </button>
      </div>
    </div>
  );
}
