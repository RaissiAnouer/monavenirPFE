import React from 'react';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const PageHeader = ({ title, description, action }: PageHeaderProps) => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold sm:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="mt-3 text-lg text-blue-100 max-w-2xl mx-auto">
              {description}
            </p>
          )}
          {action && (
            <div className="mt-8">
              {action}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PageHeader; 