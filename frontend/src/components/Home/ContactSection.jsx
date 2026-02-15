import React from 'react';
import { Phone, User, Mail, FileText } from 'lucide-react';

export default function ContactSection() {
  const customAnimations = `
    @keyframes subtle-float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }

    @keyframes fade-in-left {
      0% { opacity: 0; transform: translateX(-20px); }
      100% { opacity: 1; transform: translateX(0); }
    }

    @keyframes fade-in-right {
      0% { opacity: 0; transform: translateX(20px); }
      100% { opacity: 1; transform: translateX(0); }
    }

    @keyframes pulse-ring {
      0%, 100% { box-shadow: 0 0 0 0px rgba(249, 115, 22, 0.7); }
      50% { box-shadow: 0 0 0 10px rgba(249, 115, 22, 0); }
    }

    @keyframes subtle-pan {
      0% { background-position: 0% 0%; }
      100% { background-position: 100% 100%; }
    }
  `;

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
      <style>{customAnimations}</style>
      
      {/* Animated background blobs */}
      <div 
        className="absolute top-20 right-1/4 w-64 h-64 bg-gradient-to-br from-orange-200 to-yellow-200 rounded-full blur-3xl opacity-30 animate-[subtle-float_10s_ease-in-out_infinite]"
        style={{ animationDelay: '2s' }}
      ></div>
      <div 
        className="absolute bottom-20 left-1/4 w-64 h-64 bg-gradient-to-br from-lime-200 to-green-200 rounded-full blur-3xl opacity-30 animate-[subtle-float_12s_ease-in-out_infinite_reverse]"
        style={{ animationDelay: '4s' }}
      ></div>
      <div 
        className="absolute top-1/2 right-10 w-48 h-48 bg-gradient-to-br from-cyan-200 to-blue-200 rounded-full blur-3xl opacity-30 animate-[subtle-float_8s_ease-in-out_infinite]"
        style={{ animationDelay: '6s' }}
      ></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-[fade-in-left_1s_ease-out_forwards]">
            <p className="text-orange-500 font-semibold mb-3">Get Started Today!</p>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Book Your Free Assessment
            </h2>
            <p className="text-gray-600 text-lg mb-8">
              Take the first step towards your child's success. Fill out the form below and we'll match them with the perfect tutor.
            </p>

            <form className="space-y-4">
              <div className="relative group">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full pl-12 pr-4 py-4 bg-gray-100 rounded-full border-none focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                />
              </div>

              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type="email"
                  placeholder="Your Email"
                  className="w-full pl-12 pr-4 py-4 bg-gray-100 rounded-full border-none focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                />
              </div>

              <div className="relative group">
                <FileText className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Your Subject"
                  className="w-full pl-12 pr-4 py-4 bg-gray-100 rounded-full border-none focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                />
              </div>

              <button className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-semibold hover:shadow-lg transition transform hover:scale-[1.02] active:scale-100 animate-[pulse-ring_2s_infinite]">
                Book Free Assessment
              </button>
            </form>
          </div>

          <div className="relative animate-[fade-in-right_1s_ease-out_forwards]">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              {/* This div creates the subtle background pan effect over the image */}
              <div 
                className="absolute inset-0 bg-[length:200%_200%] opacity-20" 
                style={{ backgroundImage: 'linear-gradient(45deg, #f97316, transparent, #84cc16)' }}
              ></div>
              <img
                src="https://images.pexels.com/photos/5212317/pexels-photo-5212317.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Happy student learning"
                className="w-full h-full object-cover rounded-3xl transform transition-transform duration-500 hover:scale-105"
              />
            </div>

            <div 
              className="absolute -bottom-6 -right-6 bg-white rounded-3xl shadow-2xl p-6 flex items-center gap-4 animate-[subtle-float_5s_ease-in-out_infinite_reverse]"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Questions? Call us!</p>
                <p className="text-2xl font-bold text-gray-900">1800 TUTOR</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}