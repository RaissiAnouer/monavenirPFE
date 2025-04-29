import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRightIcon, 
  AcademicCapIcon, 
  SparklesIcon 
} from '@heroicons/react/24/outline';

const Banner = () => {
  return (
    <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 ">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center opacity-20"
          style={{ backgroundPosition: '50% 25%' }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-blue-800/90 to-blue-700/90" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-blue-500/10 to-transparent" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center lg:text-left lg:flex lg:items-center lg:justify-between"
        >
          <div className="lg:max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-500/20 backdrop-blur-sm border border-blue-400/20">
              <SparklesIcon className="h-5 w-5 text-yellow-300" />
              <span className="text-sm font-medium text-white">Votre avenir commence ici</span>
            </div>
            
            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Réussissez votre{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-blue-400">
                avenir
              </span>{' '}
              avec MonAvenir.tn
            </h1>
            
            <p className="mt-6 text-xl text-blue-100 max-w-2xl">
              Orientation personnalisée, coaching professionnel et formations adaptées 
              pour transformer vos ambitions en succès.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 sm:justify-start justify-center">

              <Link
                to="/orientation"
                className="group inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-xl
                  text-blue-900 bg-white hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Commencer maintenant
                <ArrowRightIcon className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/courses"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-xl
                  text-white border-2 border-white/20 hover:bg-white/10 backdrop-blur-sm transition-all duration-200"
              >
                <AcademicCapIcon className="h-5 w-5 mr-2" />
                Découvrir nos formations
              </Link>
            </div>
          </div>

          {/* Featured Image */}
          <div className="hidden lg:block lg:ml-8">
            <motion.img
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              src="/images/"
              alt="Education Illustration"
              className="w-full max-w-md"
            />
          </div>
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl" />
    </div>
  );
};

export default Banner; 