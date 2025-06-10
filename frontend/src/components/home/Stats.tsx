import React from 'react';
import { motion } from 'framer-motion';
import {
  UserGroupIcon,
  AcademicCapIcon,
  BookOpenIcon,
  StarIcon
} from '@heroicons/react/24/outline';

const stats = [
  {
    id: 1,
    name: 'Étudiants Actifs',
    value: '5000+',
    icon: UserGroupIcon,
    color: 'blue'
  },
  {
    id: 2,
    name: 'Cours Disponibles',
    value: '100+',
    icon: BookOpenIcon,
    color: 'green'
  },
  {
    id: 3,
    name: 'Experts & Mentors',
    value: '50+',
    icon: AcademicCapIcon,
    color: 'yellow'
  },
  {
    id: 4,
    name: 'Taux de Satisfaction',
    value: '95%',
    icon: StarIcon,
    color: 'purple'
  }
];

const Stats = () => {
  const getStatColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 text-blue-600';
      case 'green':
        return 'bg-green-100 text-green-600';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-600';
      case 'purple':
        return 'bg-purple-100 text-purple-600';
      default:
        return '';
    }
  };

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative group px-6 py-8 bg-white rounded-2xl shadow-sm hover:shadow-md 
                transition-all duration-200"
            >
              <div className={`inline-flex p-3 rounded-lg ${getStatColorClasses(stat.color)}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <p className="mt-4 text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.name}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats; 