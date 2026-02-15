// src/components/Utils/ScrollToTop.jsx

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  // Get the current location object from React Router
  const { pathname } = useLocation();

  // useEffect runs after every render
  useEffect(() => {
    // Scroll to the top of the window whenever the pathname changes
    window.scrollTo(0, 0);
  }, [pathname]); // Dependency array: Re-run effect only when 'pathname' changes

  // This component doesn't render anything visually
  return null;
};

export default ScrollToTop;