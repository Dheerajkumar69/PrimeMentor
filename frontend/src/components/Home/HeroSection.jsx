import React from 'react';
import { Play } from 'lucide-react';

// Define the keyframes for more complex, continuous motion
const animations = `
/* Keyframes for complex background element movements */
@keyframes move-circle {
  0% { transform: translate(0, 0); opacity: 0.6; }
  25% { transform: translate(150px, -50px); opacity: 0.7; }
  50% { transform: translate(250px, 0); opacity: 0.8; }
  75% { transform: translate(100px, 50px); opacity: 0.7; }
  100% { transform: translate(0, 0); opacity: 0.6; }
}

@keyframes move-dot {
  0% { transform: translate(0, 0); opacity: 0.8; }
  25% { transform: translate(50px, -30px); opacity: 0.9; }
  50% { transform: translate(100px, 0); opacity: 1; }
  75% { transform: translate(50px, 30px); opacity: 0.9; }
  100% { transform: translate(0, 0); opacity: 0.8; }
}

/* Base entry and stylistic keyframes */
@keyframes fade-in-up {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes fade-in-right {
  0% { opacity: 0; transform: translateX(20px); }
  100% { opacity: 1; transform: translateX(0); }
}

@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-5px) scale(1.05); }
}

@keyframes pulse-dot {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.2); opacity: 0.8; }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes background-pan {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
`;

/**
 * HeroSection component is updated to trigger a modal on button click.
 * @param {object} props
 * @param {function} props.setIsAssessmentModalOpen - Function to control the modal's visibility.
 */
export default function HeroSection({ setIsAssessmentModalOpen }) {
  const getRandomDelay = () => `${Math.random() * 5}s`;

  return (
    // min-h-screen for desktop, min-h-[80vh] for mobile to account for a taller header/UI
    <section className="relative min-h-[80vh] md:min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden pt-28 md:pt-20">
      <style>{animations}</style>

      {/* Animated background shapes with more subtle motion - Hiding complex shapes on mobile for performance/simplicity */}
      <div className="hidden md:block absolute inset-0 opacity-60">
        <div
          className="absolute top-[10%] left-[10%] w-40 h-40 border-2 border-fuchsia-400 rounded-full animate-[spin-slow_15s_linear_infinite,move-circle_10s_ease-in-out_infinite_alternate]"
          style={{ animationDelay: getRandomDelay() }}
        ></div>
        <div
          className="absolute top-[20%] right-[15%] w-4 h-4 bg-teal-400 rounded-full animate-[move-dot_8s_ease-in-out_infinite_alternate]"
          style={{ animationDelay: getRandomDelay() }}
        ></div>
        <div
          className="absolute bottom-[25%] left-[20%] w-6 h-6 bg-rose-500 rounded-full animate-[move-dot_10s_ease-in-out_infinite_alternate]"
          style={{ animationDelay: getRandomDelay() }}
        ></div>
        <div
          className="absolute top-[40%] right-[30%] w-5 h-5 bg-yellow-300 rounded-full animate-[spin-slow_20s_linear_infinite_reverse,move-dot_12s_ease-in-out_infinite_alternate]"
          style={{ animationDelay: getRandomDelay() }}
        ></div>
        <div
          className="absolute bottom-[15%] right-[5%] w-3 h-3 bg-cyan-400 rounded-full animate-[move-dot_9s_ease-in-out_infinite_alternate]"
          style={{ animationDelay: getRandomDelay() }}
        ></div>
      </div>

      {/* Adjusted padding for mobile/desktop */}
      <div className="container mx-auto px-4 md:px-6 py-10 md:py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative z-10 animate-[fade-in-up_1s_ease-out_forwards] text-center lg:text-left">
            {/* Badges with responsive text size */}
            <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-6 justify-center lg:justify-start">
              <div className="bg-white/10 backdrop-blur-sm px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-white text-xs sm:text-sm transition-all duration-300 ease-in-out hover:bg-white/20 hover:scale-105 animate-[float_4s_ease-in-out_infinite]">
                ✓ <a href="#pricing"><span className="font-semibold">One-on-One tutoring</span></a>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-white text-xs sm:text-sm transition-all duration-300 ease-in-out hover:bg-white/20 hover:scale-105 animate-[float_4s_ease-in-out_infinite_1s]">
                ✓ <a href="#pricing"><span className="font-semibold">Classes 2-12</span></a>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-white text-xs sm:text-sm transition-all duration-300 ease-in-out hover:bg-white/20 hover:scale-105 animate-[float_4s_ease-in-out_infinite_2s]">
                ✓ <a href="#tutors"><span className="font-semibold">Expert tutors matched</span></a>
              </div>
            </div>

            {/* Title with responsive font size */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight max-w-2xl mx-auto lg:mx-0">
              Build confidence with one-on-one, online school tutoring that's personalised to your child
            </h1>

            {/* Trust badge with responsive font size */}
            <div className="flex items-center gap-2 mb-6 sm:mb-8 animate-[fade-in-up_1s_ease-out_forwards_0.5s] justify-center lg:justify-start">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-orange-400 border-2 border-white transform transition-transform duration-300 hover:scale-110 hover:z-10 cursor-pointer"></div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-cyan-400 border-2 border-white transform transition-transform duration-300 hover:scale-110 hover:z-10 cursor-pointer"></div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-lime-400 border-2 border-white transform transition-transform duration-300 hover:scale-110 hover:z-10 cursor-pointer"></div>
              </div>
              <p className="text-white text-base sm:text-lg animate-[float_4s_ease-in-out_infinite_0.5s]">
                Trusted by <span className="font-bold">2,500+</span> families
              </p>
            </div>

            {/* Buttons with responsive padding and font size */}
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start animate-[fade-in-up_1s_ease-out_forwards_1s]">
              <button 
                onClick={() => setIsAssessmentModalOpen(true)}
                className="relative px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-semibold text-sm sm:text-base overflow-hidden transition transform hover:scale-105 shadow-xl"
              >
                <span className="relative z-10">Book a Free Assessment</span>
                <span className="absolute inset-0 bg-[length:200%_auto] opacity-0 transition-opacity duration-500 ease-in-out animate-[background-pan_5s_linear_infinite] hover:opacity-100"></span>
              </button>
              <button className="px-6 py-3 sm:px-8 sm:py-4 border-2 border-white text-white rounded-full font-semibold text-sm sm:text-base transition hover:bg-white hover:text-gray-900">
                Learn More
              </button>
            </div>
          </div>

          {/* Image Section - Hidden on mobile, visible on tablet/desktop */}
          <div className="hidden lg:block relative animate-[fade-in-right_1s_ease-out_forwards]">
            <img
              src="https://images.pexels.com/photos/4145153/pexels-photo-4145153.jpeg?auto=compress&cs=tinysrgb&w=800"
              alt="Student learning with Prime Mentor"
              className="relative rounded-3xl w-full max-w-sm lg:max-w-md mx-auto shadow-2xl opacity-90 z-10"
            />
          </div>
        </div>
      </div>

      {/* Wave divider at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 animate-[fade-in-up_1.5s_ease-out_forwards_1.5s]">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 120L1440 120L1440 0C1440 0 1080 80 720 80C360 80 0 0 0 0L0 120Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}