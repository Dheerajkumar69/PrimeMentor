import React, { useState } from 'react';
import { Video, Users, FileText, Clock, ChevronRight } from 'lucide-react';

// Data from the user's original component, mapped to steps
const stepsData = [
  {
    id: 1,
    icon: Users,
    title: '1. Match with a Tutor',
    description: 'We pair your child with the perfect tutor based on their needs and learning style',
    gradient: 'from-blue-500 to-cyan-400'
  },
  {
    id: 2,
    icon: Video,
    title: '2. Live Online Sessions',
    description: 'Face-to-face tutoring using our interactive whiteboard platform',
    gradient: 'from-orange-500 to-red-500'
  },
  {
    id: 3,
    icon: FileText,
    title: '3. Track Progress',
    description: 'Regular reports keep you informed about your child\'s development',
    gradient: 'from-lime-500 to-green-500'
  },
  {
    id: 4,
    icon: Clock,
    title: '4. Review Anytime',
    description: 'Access recorded sessions whenever you need to revisit concepts',
    gradient: 'from-purple-500 to-pink-500'
  }
];

// Helper component for the flow arrows
const FlowArrows = () => (
  // Arrows are visible only on medium screens and up, using flex-row layout
  <div className="hidden md:flex absolute inset-x-0 top-1/2 -translate-y-1/2 justify-evenly -mt-1 h-0.5 z-0 pointer-events-none">
    {/* Creating space for 3 arrows between 4 cards */}
    <div className="flex justify-center items-center w-1/4">
        <ChevronRight className="w-6 h-6 text-gray-400 opacity-50" />
    </div>
    <div className="flex justify-center items-center w-1/4">
        <ChevronRight className="w-6 h-6 text-gray-400 opacity-50" />
    </div>
    <div className="flex justify-center items-center w-1/4">
        <ChevronRight className="w-6 h-6 text-gray-400 opacity-50" />
    </div>
  </div>
);


const StepSection = () => {
  const [hoveredStep, setHoveredStep] = useState(null);

  // Custom CSS for pulse effect (integrated directly into the component)
  const customStyles = `
    /* CSS for 3D flip and icon pulse animation */
    @keyframes icon-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    .icon-pulse-hover:hover .pulse-overlay {
        animation: icon-pulse 1s ease-in-out infinite;
        opacity: 1;
    }
    /* Set perspective on the parent to enable 3D effects */
    .perspective-wrapper {
        perspective: 1000px;
    }
  `;

  return (
    <section id="how" className="py-16 sm:py-20 bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <style>{customStyles}</style>
      
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        
        {/* Header Section */}
        <div className="text-center mb-12 sm:mb-16">
          {/* Responsive Heading */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            How Prime Mentor Works
          </h2>
          {/* Responsive Subtitle */}
          <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Prime Mentor's innovative online platform provides <span className="font-bold">high-quality, personalised tutoring</span> from the comfort of your own home. Every session is <span className="font-bold">live and face-to-face with a real tutor</span>, creating an engaging and interactive learning experience through our collaborative digital whiteboard.
          </p>
          <p className="text-sm sm:text-lg text-gray-600 max-w-3xl mx-auto mt-4">
            Best of all, <span className="font-bold">every session is recorded</span> and can be reviewed at any time, allowing students to revisit concepts and parents to stay connected with their child's learning journey.
          </p>
        </div>

        {/* Steps Container */}
        <div className="relative w-full">
          <FlowArrows />

          <div
            // Responsive Grid: 1 column on mobile, 2 on small tablet, 4 on tablet/desktop
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 transition-all duration-500 ease-in-out"
            onMouseLeave={() => setHoveredStep(null)}
          >
            {stepsData.map((step) => {
              const isHovered = hoveredStep === step.id;
              const isOtherStepHovered = hoveredStep !== null && hoveredStep !== step.id;
              const IconComponent = step.icon; 

              return (
                // Wrapper to handle expansion and perspective
                <div
                  id='tutors'
                  key={step.id}
                  className={`
                    relative perspective-wrapper cursor-pointer 
                    transition-all duration-700 ease-in-out icon-pulse-hover
                    
                    /* Base size (only icon/title visible) - Adjusted h-36 for mobile */
                    h-36 sm:h-40 md:h-44 

                    /* Hover state: Expands vertically for content, scales slightly - Adjusted h-64 for mobile */
                    ${isHovered 
                      ? 'h-64 sm:h-64 md:h-72 z-10 transform scale-[1.05] sm:scale-105' 
                      : isOtherStepHovered 
                        ? 'opacity-70 scale-[0.98]' 
                        : 'hover:scale-[1.01]'
                    }
                  `}
                  onMouseEnter={() => setHoveredStep(step.id)}
                >
                  
                  {/* Inner container that performs the 3D flip */}
                  <div 
                    className={`
                      relative w-full h-full shadow-xl rounded-2xl bg-white
                      transition-transform duration-700 ease-in-out
                      ${isHovered ? 'shadow-2xl ring-4 ring-purple-300' : 'shadow-lg'}
                    `}
                    style={{
                        transformStyle: 'preserve-3d',
                        transform: isHovered ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    }}
                  >
                    
                    {/* --- CARD FRONT (Icon + Title - Always visible initially) --- */}
                    <div 
                      className={`
                        absolute inset-0 w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl bg-white
                        transition-opacity duration-300
                      `}
                      style={{
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden', // For Safari
                      }}
                    >
                      {/* Icon Container - Adjusted size for mobile */}
                      <div className={`
                          w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${step.gradient} rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 relative overflow-hidden
                      `}>
                          <div className="pulse-overlay absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-300"></div>
                          <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 text-white relative z-10" strokeWidth={2} />
                      </div>
                      
                      {/* Title - Adjusted font size for mobile */}
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
                        {step.title}
                      </h3>
                    </div>

                    {/* --- CARD BACK (Content revealed on flip) --- */}
                    <div 
                      className={`
                        absolute inset-0 w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl bg-white text-center
                      `}
                      style={{
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden', // For Safari
                          transform: 'rotateY(180deg)', // Initially flipped
                      }}
                    >
                      {/* Title (Repeated on back face for context) - Adjusted font size */}
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">{step.title}</h3>
                      
                      {/* Content - Adjusted font size */}
                      <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed px-1 sm:px-2">
                        {step.description}
                      </p>
                      
                      {/* Learn More Link - Adjusted font size */}
                      <a 
                        href="#" 
                        className="text-xs sm:text-sm font-semibold text-purple-600 hover:text-purple-800 transition-colors flex items-center justify-center"
                        onClick={(e) => e.preventDefault()}
                      >
                        Learn More <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StepSection;