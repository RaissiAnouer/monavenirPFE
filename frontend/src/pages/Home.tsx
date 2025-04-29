import React from 'react';
import Banner from '../components/home/Banner';
import Services from '../components/home/Services';
import Testimonials from '../components/home/Testimonials';
import CallToAction from '../components/home/CallToAction';
import Stats from '../components/home/Stats';

const Home = () => {
  return (
    <div className="bg-white">
      {/* Main Banner */}
      <Banner />

      {/* Stats Section */}
      <Stats />

      {/* Services Overview */}
      <Services />

      {/* Testimonials */}
      <Testimonials />

      {/* Call to Action */}
      <CallToAction />
    </div>
  );
};

export default Home;
