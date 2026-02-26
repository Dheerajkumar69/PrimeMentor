import React from 'react';
import HeroSection from '../components/Home/HeroSection.jsx';
import ReasonsSection from '../components/Home/ReasonsSection.jsx';
import HowItWorksSection from '../components/Home/HowItWorksSection.jsx';
import TestimonialsSection from '../components/Home/TestimonialsSection.jsx';
import SocialProofSection from '../components/Home/SocialProofSection.jsx';
import ContactSection from '../components/Home/ContactSection.jsx';
import CookieBanner from '../components/Home/CookieBanner.jsx';
import NewsletterSection from '../components/Home/NewsLetter.jsx';
import Footer from '../components/Home/Footer.jsx'; // Assuming Footer is in this directory

/**
 * The main Home page container. It accepts the modal setter to trigger the assessment modal
 * from within its child components (HeroSection).
 * @param {object} props
 * @param {function} props.setIsAssessmentModalOpen - Function to control the modal's visibility.
 */
const Home = ({ setIsAssessmentModalOpen }) => {
  return (
    <div>
      {/* Header is managed by App.jsx — not rendered here to avoid double-render */}

      {/* The HeroSection is a direct child of the Home page */}
      <HeroSection setIsAssessmentModalOpen={setIsAssessmentModalOpen} />

      {/* Other components of the Home page */}
      <ReasonsSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <SocialProofSection />
      <NewsletterSection />
      {/* <ContactSection /> */}
      {/* <Footer /> */}
      <CookieBanner />
    </div>
  );
};

export default Home;