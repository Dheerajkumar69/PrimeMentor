import React from 'react';
import { BookOpen, Users, Target, Award, MessageSquare, Home } from 'lucide-react';

const reasons = [
  {
    icon: BookOpen,
    title: 'The Content',
    description: 'Our comprehensive tutoring program maps directly to the Australian school curriculum, ensuring your child stays on track and covers everything they need to succeed in their studies.',
    gradient: 'from-blue-500 to-cyan-400'
  },
  {
    icon: Users,
    title: 'The Tutors',
    description: 'Our expert tutors bring learning to life with engaging, interactive sessions. They adapt the program to suit each child\'s unique learning style, making complex concepts easy to understand.',
    gradient: 'from-orange-500 to-red-500'
  },
  {
    icon: Target,
    title: 'The Approach',
    description: 'We believe every child learns differently. Our personalised approach allows your child to learn at their own speed, building confidence and mastery before moving forward.',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    icon: Award,
    title: 'The Quality',
    description: 'Every tutoring session is recorded and reviewed by our expert team. We use these insights to continuously coach and develop our tutors, ensuring the highest quality education.',
    gradient: 'from-lime-500 to-green-500'
  },
  {
    icon: MessageSquare,
    title: 'The Feedback',
    description: 'Stay informed every step of the way. We provide regular progress reports and updates, so you always know how your child is developing and where they\'re excelling.',
    gradient: 'from-yellow-500 to-orange-500'
  },
  {
    icon: Home,
    title: 'The Online Convenience',
    description: 'No more rushing to tutoring centres. Our online platform brings expert tutoring directly to your home, saving time while providing the same personal, face-to-face experience.',
    gradient: 'from-teal-500 to-cyan-500'
  }
];

export default function ReasonsSection() {
  const customAnimations = `
    @keyframes card-fade-in {
      0% { opacity: 0; transform: translateY(20px); }
      100% { opacity: 1; transform: translateY(0); }
    }

    @keyframes icon-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
  `;

  return (
    <section id="why" className="py-16 sm:py-20 bg-white">
      <style>{customAnimations}</style>
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 sm:mb-16">
          {/* Responsive Heading */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
            Here's why parents and students are choosing Prime Mentor
          </h2>
          {/* Responsive Subtitle */}
          <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Discover what makes Prime Mentor the trusted choice for families seeking personalized, high-quality online tutoring
          </p>
        </div>

        {/* Responsive Grid: 1 column on mobile, 2 on tablet, 3 on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {reasons.map((reason, index) => (
            <div 
              key={index} 
              // Responsive padding
              className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 hover:border-transparent hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-2 group"
              style={{ animation: `card-fade-in 1s ease-out ${index * 0.15}s forwards` }}
            >
              <div 
                // Responsive Icon Container Size
                className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${reason.gradient} flex items-center justify-center mb-4 sm:mb-6 overflow-hidden transform transition-transform duration-300 ease-in-out group-hover:scale-110`}
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-[icon-pulse_1s_ease-in-out_infinite]"></div>
                {/* Responsive Icon Size */}
                <reason.icon className="w-7 h-7 sm:w-8 sm:h-8 text-white relative z-10" strokeWidth={2} />
              </div>
              {/* Responsive Title Size */}
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                {reason.title}
              </h3>
              {/* Responsive Description Size */}
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                {reason.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}