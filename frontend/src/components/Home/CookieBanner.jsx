import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const COOKIE_CONSENT_KEY = 'pm_cookie_consent';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Only show if user hasn't dismissed before
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 max-w-2xl w-full mx-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-2xl">🍪</span>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-700">We use cookies to give you the best experience.</span>
            <button
              onClick={() => navigate('/privacy-policy')}
              className="font-bold text-gray-900 underline hover:text-orange-500 transition"
            >
              Cookie Policy
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition flex-shrink-0"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
}
