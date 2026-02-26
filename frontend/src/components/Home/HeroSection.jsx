import React, { useState, useContext, useEffect } from 'react';
import { TrendingUp, Loader } from 'lucide-react';
import { AppContext } from '../../context/AppContext.jsx';
import PricingFlow from '../Pricing/PricingFlow.jsx';
import axios from 'axios';

const animations = `
@keyframes fade-in-up {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes fade-in-right {
  0% { opacity: 0; transform: translateX(20px); }
  100% { opacity: 1; transform: translateX(0); }
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
@keyframes pulse-glow {
  0% { box-shadow: 0 0 12px rgba(249,115,22,0.6), 0 0 24px rgba(249,115,22,0.4); }
  50% { box-shadow: 0 0 28px rgba(255,100,0,1), 0 0 48px rgba(249,115,22,0.7); }
  100% { box-shadow: 0 0 12px rgba(249,115,22,0.6), 0 0 24px rgba(249,115,22,0.4); }
}
@keyframes background-pan {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes move-dot {
  0% { transform: translate(0, 0); }
  50% { transform: translate(40px, -20px); }
  100% { transform: translate(0, 0); }
}
`;

export default function HeroSection({ setIsAssessmentModalOpen }) {
  const { isSignedIn, backendUrl, setShowStudentLogin } = useContext(AppContext);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialClassFlowData, setInitialClassFlowData] = useState(null);
  const [pendingFlowData, setPendingFlowData] = useState(null);
  const [buttons, setButtons] = useState([]);
  const [loadingPrices, setLoadingPrices] = useState(true);

  // Fetch pricing
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const apiBase = backendUrl || import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const response = await axios.get(`${apiBase}/api/admin/pricing`);
        const { classRanges } = response.data;
        setButtons([
          { label: 'Class 2-6', range: '2-6', price: classRanges['2-6'].sessionPrice },
          { label: 'Class 7-9', range: '7-9', price: classRanges['7-9'].sessionPrice },
          { label: 'Class 10-12', range: '10-12', price: classRanges['10-12'].sessionPrice },
        ]);
      } catch {
        setButtons([
          { label: 'Class 2-6', range: '2-6', price: 22 },
          { label: 'Class 7-9', range: '7-9', price: 25 },
          { label: 'Class 10-12', range: '10-12', price: 27 },
        ]);
      } finally {
        setLoadingPrices(false);
      }
    };
    fetchPricing();
  }, [backendUrl]);

  // Resume flow after sign-in
  useEffect(() => {
    if (isSignedIn && pendingFlowData) {
      setInitialClassFlowData(pendingFlowData);
      setIsModalOpen(true);
      setPendingFlowData(null);
    }
  }, [isSignedIn, pendingFlowData]);

  const handleButtonClick = (classRange, price) => {
    if (isSignedIn) {
      setInitialClassFlowData({ initialClassRange: classRange, basePrice: price });
      setIsModalOpen(true);
    } else {
      setPendingFlowData({ initialClassRange: classRange, basePrice: price });
      setShowStudentLogin(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setInitialClassFlowData(null);
  };

  const lowestPrice = buttons.length > 0 ? Math.min(...buttons.map(b => b.price)) : '...';

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden flex flex-col">
      <style>{animations}</style>

      {/* Subtle background dots */}
      <div className="hidden md:block absolute inset-0 opacity-50 pointer-events-none">
        <div className="absolute top-[15%] left-[5%] w-4 h-4 bg-teal-400 rounded-full animate-[move-dot_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[20%] right-[8%] w-3 h-3 bg-rose-400 rounded-full animate-[move-dot_10s_ease-in-out_infinite_reverse]" />
        <div className="absolute top-[50%] left-[50%] w-2 h-2 bg-yellow-300 rounded-full animate-[move-dot_12s_ease-in-out_infinite]" />
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10 flex-1 flex items-center py-24 md:py-28">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center w-full">

          {/* ── LEFT: Hero Text ── */}
          <div className="animate-[fade-in-up_0.8s_ease-out_forwards] text-center lg:text-left">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 sm:gap-3 mb-5 justify-center lg:justify-start">
              {[
                { text: 'One-on-One tutoring', href: '#pricing' },
                { text: 'Classes 2-12', href: '#pricing' },
                { text: 'Expert tutors matched', href: '#tutors' },
              ].map((badge, i) => (
                <a
                  key={i}
                  href={badge.href}
                  className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg text-white text-sm sm:text-base font-semibold transition hover:bg-white/20 hover:scale-105 animate-[float_4s_ease-in-out_infinite]"
                  style={{ animationDelay: `${i * 0.5}s` }}
                >
                  ✓ {badge.text}
                </a>
              ))}
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Build confidence with one-on-one, online school tutoring that's personalised to your child
            </h1>

            {/* Trust */}
            <div className="flex items-center gap-3 mb-10 justify-center lg:justify-start animate-[fade-in-up_1s_ease-out_forwards_0.4s]">
              <div className="flex -space-x-2">
                <div className="w-11 h-11 rounded-full bg-orange-400 border-2 border-white" />
                <div className="w-11 h-11 rounded-full bg-cyan-400 border-2 border-white" />
                <div className="w-11 h-11 rounded-full bg-lime-400 border-2 border-white" />
              </div>
              <p className="text-white text-base sm:text-lg">
                Trusted by <span className="font-bold">a growing community of</span> families
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start animate-[fade-in-up_1s_ease-out_forwards_0.8s]">
              <button
                onClick={() => setIsAssessmentModalOpen(true)}
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-semibold text-base sm:text-lg transition transform hover:scale-105 shadow-xl"
              >
                Book a Free Assessment
              </button>
              <button
                onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 border-2 border-white text-white rounded-full font-semibold text-base sm:text-lg transition hover:bg-white hover:text-gray-900"
              >
                Learn More
              </button>
            </div>
          </div>

          {/* ── RIGHT: Pricing Box ── */}
          <div className="animate-[fade-in-right_0.9s_ease-out_forwards] relative">
            <div className="relative p-8 sm:p-10 md:p-12 rounded-2xl bg-white/5 border border-gray-600 backdrop-blur-md animate-[pulse-glow_4s_infinite_ease-in-out]">

              {/* Price circle */}
              <div className="absolute -top-6 -right-4 sm:-top-8 sm:-right-5
                              w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36
                              bg-gradient-to-br from-orange-500 to-red-600
                              rounded-full flex flex-col items-center justify-center
                              text-white font-extrabold text-center
                              shadow-2xl border-4 border-white/70 z-10
                              transition-transform hover:scale-105">
                <span className="text-xs sm:text-sm font-semibold">Starts from</span>
                <span className="text-3xl sm:text-4xl md:text-5xl font-black leading-none">${lowestPrice}</span>
                <span className="text-sm font-bold">onwards</span>
                <TrendingUp className="w-3 h-3 text-green-300 mt-0.5" />
              </div>

              {/* Title */}
              <h2 className="text-white text-2xl sm:text-3xl md:text-4xl font-bold mb-3 pr-20">
                Unlock Your Personalized Pricing
              </h2>
              <p className="text-gray-300 text-base sm:text-lg mb-8">
                Complete a quick questionnaire (less than 1 minute) to find your ideal learning package.
              </p>

              {/* Pricing Buttons */}
              <div className="flex flex-col gap-4">
                {loadingPrices ? (
                  <Loader className="w-7 h-7 text-orange-400 animate-spin mx-auto" />
                ) : (
                  buttons.map((button) => (
                    <button
                      key={button.range}
                      onClick={() => handleButtonClick(button.range, button.price)}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-4 px-6 rounded-full shadow-lg transition-all duration-300 hover:scale-105 hover:ring-4 ring-orange-400 text-lg tracking-wide"
                    >
                      View Pricing for {button.label}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 80L1440 80L1440 0C1440 0 1080 60 720 60C360 60 0 0 0 0L0 80Z" fill="white" />
        </svg>
      </div>

      {isModalOpen && (
        <PricingFlow isOpen={isModalOpen} onClose={closeModal} initialClassFlowData={initialClassFlowData} />
      )}
    </section>
  );
}