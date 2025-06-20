import React, { useState, useEffect } from 'react';
import { assets } from '../assets/assets';

const AgeVerification = ({ onVerified }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already verified their age (stored in sessionStorage)
    const hasVerified = sessionStorage.getItem('ageVerified');
    if (!hasVerified) {
      setIsVisible(true);
    } else {
      onVerified();
    }
  }, [onVerified]);

  const handleYes = () => {
    // Store verification in sessionStorage (expires when browser is closed)
    sessionStorage.setItem('ageVerified', 'true');
    setIsVisible(false);
    onVerified();
  };

  const handleNo = () => {
    // Redirect to a safe page or show message
    window.location.href = 'https://www.google.com';
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-8 text-center">
        {/* Logo or Icon */}
        <div className="mb-6">
          <img 
            src={assets.LogoJA} 
            alt="Logo" 
            className="h-16 mx-auto mb-4"
          />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Age Verification Required
        </h2>

        {/* Message */}
        <p className="text-gray-600 mb-6 leading-relaxed">
          You must be 18 years or older to access this website. This site contains 
          alcoholic beverages and is intended for adults only.
        </p>

        <p className="text-sm text-gray-500 mb-8">
          Are you 18 years of age or older?
        </p>

        {/* Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleNo}
            className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors"
          >
            No, I'm Under 18
          </button>
          <button
            onClick={handleYes}
            className="px-8 py-3 bg-primary text-white rounded-md font-medium hover:bg-primary-dull transition-colors"
          >
            Yes, I'm 18 or Older
          </button>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-gray-400 mt-6">
          By clicking "Yes", you certify that you are of legal drinking age in your jurisdiction.
        </p>
      </div>
    </div>
  );
};

export default AgeVerification;