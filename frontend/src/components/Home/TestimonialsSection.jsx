import React, { useState, useEffect } from 'react';
import { Star, Play, Quote, ChevronLeft, ChevronRight, X } from 'lucide-react';

// --- VIDEO DATA ---
// Array of YouTube video data with Video IDs
const videoTestimonials = [
  {
    title: "Make Learning Fun",
    bannerBg: "from-blue-500 to-cyan-400",
    videoId: "oMGUNVRXN4w",
    embedUrl: "https://www.youtube.com/embed/oMGUNVRXN4w?autoplay=1",
  },
  {
    title: "Boost Your Grades",
    bannerBg: "from-orange-500 to-red-500",
    videoId: "VUGPGP_5YAs",
    embedUrl: "https://www.youtube.com/embed/VUGPGP_5YAs?autoplay=1",
  },
  {
    title: "Ace Your Exams",
    bannerBg: "from-lime-500 to-green-500",
    videoId: "WQwyRw-ONRc",
    embedUrl: "https://www.youtube.com/embed/WQwyRw-ONRc?autoplay=1",
  },
];

// Helper function to generate the YouTube thumbnail URL (using hqdefault for good quality)
const getThumbnailUrl = (videoId) => {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

// --- VIDEO MODAL COMPONENT ---
const VideoPlayerModal = ({ videoUrl, onClose }) => {
  if (!videoUrl) return null;

  // Attributes for the iframe
  const iframeAttributes = {
    width: "100%",
    height: "100%",
    src: videoUrl,
    title: "YouTube video player",
    frameBorder: "0",
    allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
    allowFullScreen: true,
    referrerPolicy: "strict-origin-when-cross-origin"
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-80 p-4 transition-opacity duration-300"
      onClick={onClose} // Close on backdrop click
    >
      <div 
        className="relative w-full max-w-4xl aspect-video" // 16:9 aspect ratio
        onClick={(e) => e.stopPropagation()} // Prevent modal from closing when clicking inside video area
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 p-2 bg-white rounded-full text-gray-900 hover:bg-orange-500 hover:text-white transition-colors z-50"
          aria-label="Close video player"
        >
          <X className="w-6 h-6" />
        </button>
        <iframe 
          {...iframeAttributes}
          className="rounded-xl shadow-2xl"
        ></iframe>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function TestimonialsSection() {
  // Array of text testimonial data (kept as provided)
  const testimonials = [
    {
      id: 1,
      name: "Nicole",
      role: "Parent of Year 8 Student",
      avatarBg: "from-orange-500 to-red-500",
      rating: 5,
      quote: `My son has been working with his tutor <span class="font-bold">Katurah</span> for several months now, and the transformation has been incredible. Not only has his <span class="font-bold">confidence grown tremendously</span>, but his grades have improved across the board. Katurah has an amazing ability to <span class="font-bold">partner with me as a parent</span>, keeping me informed and involved every step of the way. I couldn't be happier with Prime Mentor!`,
    },
    {
      id: 2,
      name: "David S.",
      role: "Year 10 Math Student",
      avatarBg: "from-green-500 to-teal-500",
      rating: 5,
      quote: `Before Prime Mentor, I struggled a lot with Algebra. My tutor, <span class="font-bold">Mr. Chen</span>, broke down complex problems into easy-to-understand steps. I now feel so much more prepared for my exams and actually enjoy math! The <span class="font-bold">online sessions are super convenient</span>.`,
    },
    {
      id: 3,
      name: "Sarah K.",
      role: "Parent of Year 5 Student",
      avatarBg: "from-purple-500 to-pink-500",
      rating: 4,
      quote: `Our daughter was falling behind in reading, and we were worried. <span class="font-bold">Ms. Emily</span> made learning fun again. She uses interactive tools and games, and it's made a huge difference. Her reading level has improved significantly, and she even <span class="font-bold">looks forward to her tutoring sessions</span> now!`,
    },
    {
      id: 4,
      name: "Alex M.",
      role: "Year 12 Chemistry Student",
      avatarBg: "from-blue-500 to-indigo-500",
      rating: 5,
      quote: `<span class="font-bold">Prime Mentor's tutors are top-notch.</span> My Chemistry tutor helped me grasp difficult concepts for my HSC. The personalized attention meant I could ask all my questions without feeling rushed. I highly recommend them for anyone serious about improving their grades and <span class="font-bold">understanding complex subjects</span>.`,
    },
    {
      id: 5,
      name: "Emily R.",
      role: "Year 7 English Student",
      avatarBg: "from-yellow-500 to-lime-500",
      rating: 5,
      quote: `I always hated writing essays, but my English tutor, <span class="font-bold">Ms. Davies</span>, showed me simple ways to structure my arguments. She's really patient and gives great feedback. I just got my best mark ever on a persuasive essay! <span class="font-bold">Highly recommend for anyone struggling with literacy.</span>`,
    },
    {
      id: 6,
      name: "Marcus P.",
      role: "Parent of Year 2 Student",
      avatarBg: "from-red-500 to-pink-500",
      rating: 4,
      quote: `We needed support for basic numeracy, and Prime Mentor delivered. The tutor is fantastic with younger children—making every session feel like playtime, not work. Our child is now counting and doing simple addition with <span class="font-bold">zero fuss and plenty of smiles</span>. The <span class="font-bold">reports are detailed and helpful</span>.`,
    },
  ];

  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [playingVideoUrl, setPlayingVideoUrl] = useState(null); // State for the video player modal

  // Auto-slide effect - Set to 4000ms (4 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonialIndex((prevIndex) => 
        (prevIndex + 1) % testimonials.length
      );
    }, 4000); // Change testimonial every 4 seconds

    return () => clearInterval(interval); // Clean up interval on component unmount
  }, [testimonials.length]);

  const goToPrevious = () => {
    setCurrentTestimonialIndex((prevIndex) => 
      (prevIndex - 1 + testimonials.length) % testimonials.length
    );
  };

  const goToNext = () => {
    setCurrentTestimonialIndex((prevIndex) => 
      (prevIndex + 1) % testimonials.length
    );
  };

  // Helper functions to open/close the video modal
  const handlePlayVideo = (url) => {
    setPlayingVideoUrl(url);
  };

  const handleCloseVideo = () => {
    setPlayingVideoUrl(null);
  };

  const currentTestimonial = testimonials[currentTestimonialIndex];

  // Custom CSS Animations (as provided)
  const customAnimations = `
    @keyframes glowing-border {
      0% { box-shadow: 0 0 5px #f97316, 0 0 10px #f97316 inset; }
      25% { box-shadow: 0 0 10px #ef4444, 0 0 20px #ef4444 inset; }
      50% { box-shadow: 0 0 15px #f97316, 0 0 30px #f97316 inset; }
      75% { box-shadow: 0 0 10px #ef4444, 0 0 20px #ef4444 inset; }
      100% { box-shadow: 0 0 5px #f97316, 0 0 10px #f97316 inset; }
    }

    @keyframes pulse-play {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }

    @keyframes card-fade-in {
      0% { opacity: 0; transform: translateY(20px); }
      100% { opacity: 1; transform: translateY(0); }
    }
  
    @keyframes slide-in-right {
      0% { opacity: 0; transform: translateX(50px); }
      100% { opacity: 1; transform: translateX(0); }
    }
  `;

  return (
    <section id="testimonials" className="relative py-16 sm:py-20 bg-gradient-to-br from-gray-50 to-white overflow-hidden">
      <style>{customAnimations}</style>
      
      {/* Subtle background pattern of dots */}
      <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
            Hear what our students and parents have to say
          </h2>
          <p className="text-base sm:text-xl text-gray-600">
            Real stories from families who have experienced the Prime Mentor difference
          </p>
        </div>

        {/* Responsive Grid for Video Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 sm:mb-16">
          {videoTestimonials.map((video, index) => (
            <div 
              key={index}
              className={`bg-gradient-to-br ${video.bannerBg} rounded-2xl p-1 animate-[card-fade-in_1s_ease-out_forwards]`} 
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div 
                className="rounded-2xl h-56 sm:h-64 flex items-center justify-center group cursor-pointer relative overflow-hidden transition-all duration-300" 
                onClick={() => handlePlayVideo(video.embedUrl)} 
              >
                {/* 1. Thumbnail Image */}
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" 
                  style={{ backgroundImage: `url(${getThumbnailUrl(video.videoId)})` }}
                  aria-label={`Thumbnail for ${video.title} video testimonial`}
                />
                
                {/* 2. Dark Overlay for Contrast */}
                <div className="absolute inset-0 bg-black opacity-50 group-hover:opacity-30 transition-opacity duration-300"></div>

                {/* 3. Play Button and Text Content (z-index 10) */}
                <div className="text-center relative z-10">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300 animate-[pulse-play_1.5s_infinite]">
                    <Play className="w-7 h-7 sm:w-8 sm:h-8 text-gray-900 fill-gray-900 ml-1" />
                  </div>
                  <p className="text-white font-semibold text-sm sm:text-base text-shadow-lg">{video.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Testimonials Slider */}
        <div className="relative max-w-4xl mx-auto mb-12 sm:mb-16">
          <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 md:p-12 relative overflow-hidden min-h-[300px] flex items-center">
            {/* Navigation Buttons */}
            <button 
              onClick={goToPrevious} 
              className="absolute left-0 md:-left-12 top-1/2 -translate-y-1/2 bg-gray-900 text-white p-2 md:p-3 rounded-full shadow-lg hover:bg-orange-500 transition-all duration-300 z-20 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={goToNext} 
              className="absolute right-0 md:-right-12 top-1/2 -translate-y-1/2 bg-gray-900 text-white p-2 md:p-3 rounded-full shadow-lg hover:bg-orange-500 transition-all duration-300 z-20 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Testimonial Content (with unique key for transition) */}
            <div 
              key={currentTestimonial.id} 
              className="w-full flex items-start gap-3 sm:gap-4 animate-[slide-in-right_0.5s_ease-out_forwards]"
            >
              <Quote className="w-10 h-10 sm:w-12 sm:h-12 text-orange-500 flex-shrink-0 opacity-80" />
              <div className="flex-grow">
                <div className="flex gap-1 mb-2">
                  {[...Array(currentTestimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-yellow-400 transform transition-transform duration-200 hover:scale-125" />
                  ))}
                  {[...Array(5 - currentTestimonial.rating)].map((_, i) => (
                    <Star key={`empty-${i}`} className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />
                  ))}
                </div>
                <p 
                  className="text-gray-700 text-base sm:text-lg leading-relaxed mb-4 sm:mb-6"
                  dangerouslySetInnerHTML={{ __html: currentTestimonial.quote }}
                />
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${currentTestimonial.avatarBg} rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg`}>
                    {currentTestimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-base">{currentTestimonial.name}</p>
                    <p className="text-gray-600 text-xs sm:text-sm">{currentTestimonial.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dot Indicators */}
          <div className="flex justify-center mt-6 gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonialIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ease-in-out ${
                  currentTestimonialIndex === index ? 'bg-orange-500 w-6' : 'bg-gray-300 hover:bg-orange-300'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              ></button>
            ))}
          </div>
        </div>

        {/* Closing Stat - Responsive Text Size */}
        <div className="text-center animate-[card-fade-in_1s_ease-out_0.8s_forwards]">
          <p className="text-lg sm:text-2xl font-bold text-gray-900 mb-2">
            Over 1,800 positive reviews from happy parents and students
          </p>
          <div className="flex justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 fill-yellow-400 transform transition-transform duration-200 hover:scale-125" />
            ))}
          </div>
          <p className="text-gray-600 text-sm sm:text-base">Join thousands of families who trust Prime Mentor</p>
        </div>
      </div>
      
      {/* Video Player Modal is rendered outside of the main section content */}
      <VideoPlayerModal 
        videoUrl={playingVideoUrl} 
        onClose={handleCloseVideo} 
      />
    </section>
  );
}