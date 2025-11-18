import { useState } from 'react';
import { X } from 'lucide-react';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 max-w-2xl w-full mx-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-2xl">🍪</span>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-700">We use cookies to give you the best experience.</span>
            <a href="#" className="font-bold text-gray-900 underline hover:text-orange-500 transition">
              Cookie Policy
            </a>
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition flex-shrink-0"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
}
