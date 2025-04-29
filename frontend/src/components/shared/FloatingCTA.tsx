import React from 'react';
import { Link } from 'react-router-dom';
import { PhoneIcon } from '@heroicons/react/24/outline';

const FloatingCTA = () => {
  return (
    <Link to="/contact" className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 group">
      <PhoneIcon className="h-6 w-6 group-hover:scale-110" />
    </Link>
  );
};

export default FloatingCTA;