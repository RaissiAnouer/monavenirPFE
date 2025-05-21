import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

const CallToAction = () => {
  return (
    <section className="relative bg-gradient-to-r from-blue-700 to-blue-500 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-blue-600 px-8 py-20 shadow-xl sm:px-12 sm:py-24">
          <div className="relative z-10">
            <div className="text-center">
              <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                Prêt à commencer votre parcours ?
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-blue-100">
                Rejoignez MonAvenir.tn et découvrez le chemin vers votre réussite professionnelle.
                Commencez dès aujourd'hui avec notre test d'orientation gratuit.
              </p>
              <div className="mt-10 flex justify-center gap-x-6">
                <Link
                  to="/orientation"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 text-base font-semibold text-blue-600 
                    shadow-lg hover:bg-blue-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Commencer maintenant
                  <ArrowRightIcon className="ml-2 -mr-1 h-5 w-5 inline-block" />
                </Link>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-400 opacity-20 blur-3xl" />
          <div className="absolute -top-24 right-0 -left-24 h-[500px] w-[500px] rounded-full 
            bg-gradient-to-br from-blue-500 to-blue-400 opacity-20 blur-3xl" />
        </div>
      </div>
    </section>
  );
};

export default CallToAction; 