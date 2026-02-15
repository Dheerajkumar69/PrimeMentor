import React from 'react';
import { Award, Users } from 'lucide-react';

export default function SocialProofSection() {
  const featuredIn = [
    'Education Today Magazine',
    'The Australian EdTech Review',
    'Learning & Development Quarterly',
    'Parent & Student Success Journal',
    'Digital Education Herald',
    'National Tutoring Network',
    'Education Innovation Weekly'
  ];

  const partners = [
    'University of Sydney Education Hub',
    'Melbourne Learning Institute',
    'Australian Curriculum Board',
    'National Tutoring Association',
    'EdTech Australia Coalition',
    'Student Success Foundation'
  ];

  const awards = [
    'National EdTech Innovation Award 2023',
    'Best Online Tutoring Platform 2023',
    'Excellence in Personalized Learning 2024',
    'Parent\'s Choice Award for Education 2024'
  ];

  const customAnimations = `
    @keyframes card-fade-in {
      0% { opacity: 0; transform: translateY(20px); }
      100% { opacity: 1; transform: translateY(0); }
    }

    /* Marquee/Scrolling animation */
    @keyframes marquee {
      0% { transform: translateX(0); }
      100% { transform: translateX(-100%); } /* Move a full copy of the content */
    }

    /* Award glowing effect on hover */
    @keyframes glowing-card {
      0%, 100% { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
      50% { box-shadow: 0 10px 15px -3px rgba(249, 115, 22, 0.5), 0 4px 6px -2px rgba(249, 115, 22, 0.3); }
    }

    @keyframes subtle-float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }
  `;
  
  // Array of colors for cycling through the marquee items
  const marqueeColors = [
    { bg: 'bg-indigo-600', text: 'text-white' },
    { bg: 'bg-green-600', text: 'text-white' },
    { bg: 'bg-yellow-400', text: 'text-gray-900' },
    { bg: 'bg-blue-600', text: 'text-white' },
    { bg: 'bg-purple-600', text: 'text-white' },
    { bg: 'bg-red-600', text: 'text-white' },
    { bg: 'bg-teal-600', text: 'text-white' },
  ];

  const renderMarqueeItems = (items) => (
    <>
      {/* Duplicate items for continuous loop */}
      {items.map((item, index) => {
        const color = marqueeColors[index % marqueeColors.length];
        return (
          <div
            key={`a-${index}`}
            // Responsive text size and padding
            className={`flex-shrink-0 font-bold text-sm sm:text-lg px-4 py-3 sm:px-8 sm:py-4 ${color.bg} ${color.text} rounded-xl shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer`}
          >
            {item}
          </div>
        );
      })}
      {items.map((item, index) => {
        const color = marqueeColors[index % marqueeColors.length];
        return (
          <div
            key={`b-${index}`}
            // Responsive text size and padding
            className={`flex-shrink-0 font-bold text-sm sm:text-lg px-4 py-3 sm:px-8 sm:py-4 ${color.bg} ${color.text} rounded-xl shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer`}
          >
            {item}
          </div>
        );
      })}
    </>
  );

  return (
    <section className="relative py-16 sm:py-20 bg-gradient-to-br from-slate-50 to-gray-100 overflow-hidden">
      <style>{customAnimations}</style>
      
      {/* Subtle background pattern */}
      <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        
        {/* AS FEATURED IN: Marquee Section */}
        <div className="mb-12 sm:mb-16">
          <h3 className="text-center text-gray-600 font-semibold mb-6 sm:mb-8 text-sm sm:text-lg animate-[card-fade-in_1s_ease-out_forwards]">
            AS FEATURED IN:
          </h3>
          <div className="relative overflow-hidden w-full py-2 sm:py-4">
            <div className="flex space-x-4 sm:space-x-8 animate-[marquee_40s_linear_infinite] group-hover:pause">
              {renderMarqueeItems(featuredIn)}
            </div>
          </div>
        </div>

        {/* OUR PARTNERS: Marquee Section */}
        <div className="mb-12 sm:mb-16">
          <h3 className="text-center text-gray-600 font-semibold mb-6 sm:mb-8 text-sm sm:text-lg flex items-center justify-center gap-2 animate-[card-fade-in_1s_ease-out_0.5s_forwards]">
            <Users className="w-5 h-5 text-orange-500" />
            SUPPORTED BY:
          </h3>
          <div className="relative overflow-hidden w-full py-2 sm:py-4">
            {/* Reverse Marquee Direction */}
            <div className="flex space-x-4 sm:space-x-8 animate-[marquee_50s_linear_infinite_reverse]">
              {renderMarqueeItems(partners)}
            </div>
          </div>
        </div>

        {/* OUR AWARDS: 3D Cards - Responsive Grid */}
        <div>
          <h3 className="text-center text-gray-600 font-semibold mb-6 sm:mb-8 text-sm sm:text-lg flex items-center justify-center gap-2 animate-[card-fade-in_1s_ease-out_1s_forwards]">
            <Award className="w-5 h-5 text-orange-500" />
            OUR AWARDS:
          </h3>
          {/* Responsive Grid: 1 column on mobile, 2 on tablet, 4 on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto perspective-1000">
            {awards.map((award, index) => (
              <div
                key={index}
                // Applying 3D Hover Effect
                className="relative bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-center shadow-2xl transition-all duration-500 ease-in-out transform hover:-translate-y-2 hover:scale-105 hover:rotate-3d hover:shadow-orange group animate-[card-fade-in_1s_ease-out_1s_forwards]"
                style={{ 
                    animationDelay: `${0.1 * index}s`, 
                    // Custom CSS for 3D effect
                    '--tw-rotate-x': '0deg', 
                    '--tw-rotate-y': '0deg', 
                    '--tw-translate-z': '0px',
                    transformStyle: 'preserve-3d', 
                }}
              >
                <div className="relative z-10 transform-style-preserve">
                  <Award className="w-10 h-10 sm:w-12 sm:h-12 text-white mx-auto mb-3 animate-[subtle-float_3s_infinite_ease-in-out]" strokeWidth={1.5} />
                  {/* Responsive text size */}
                  <p className="text-white font-bold text-sm sm:text-base leading-snug">
                    {award}
                  </p>
                </div>
                {/* Subtle White Shine Border on Hover */}
                <div className="absolute inset-0 rounded-2xl border-4 border-white opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                {/* Glowing Effect on Hover (using existing keyframe) */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-[glowing-card_2s_infinite]"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}