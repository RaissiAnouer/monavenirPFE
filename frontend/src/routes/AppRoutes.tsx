import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import Orientation from '../pages/Orientation';
import Courses from '../pages/Courses';
import AddCourse from '../pages/AddCourse';
import About from '../pages/About';
import Contact from '../pages/Contact';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import UserProfile from '../pages/UserProfile';
import CourseContent from '../pages/CourseContent';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/orientation" element={
        <ProtectedRoute>
          <Orientation />
        </ProtectedRoute>
      } />
      <Route path="/courses" element={
        <ProtectedRoute>
          <Courses />
        </ProtectedRoute>
      } />
      <Route path="/course/:title" element={
        <ProtectedRoute>
          <CourseContent />
        </ProtectedRoute>
      } />
      <Route path="/add-course" element={
        <ProtectedRoute allowedRoles={['teacher', 'admin']}>
          <AddCourse />
        </ProtectedRoute>
      } />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;