import React from 'react';
import { motion } from 'framer-motion';

const Loader: React.FC = () => {
  return (
    <div className="flex flex-col justify-center items-center min-h-[400px]">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center"
      >
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-t-4 border-b-4 border-indigo-600 animate-spin"></div>
          <div className="absolute inset-0 h-16 w-16 rounded-full border-r-4 border-l-4 border-transparent border-r-indigo-300 animate-pulse"></div>
        </div>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-4 text-indigo-600 font-medium"
        >
          Loading...
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Loader; 