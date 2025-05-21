import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

const Card = ({ children, className = '', hover = true }: CardProps) => {
  return (
    <motion.div
      whileHover={hover ? { y: -5 } : {}}
      transition={{ duration: 0.2 }}
      className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default Card; 