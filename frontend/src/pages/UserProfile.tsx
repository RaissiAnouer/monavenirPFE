import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { authAPI } from '../api/auth';
import {
  UserCircleIcon,
  AcademicCapIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ClockIcon,
  IdentificationIcon,
} from '@heroicons/react/24/outline';

interface EnrolledCourse {
  id: string;
  title: string;
  enrollmentDate: string;
}

interface EditableFields {
  name: string;
  phone: string;
  email: string;
  grade?: string;
}

const UserProfile: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editForm, setEditForm] = useState<EditableFields>({
    name: '',
    phone: '',
    email: '',
    grade: ''
  });

  // Reset form when user data changes
  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
        grade: user.grade || ''
      });
    }
  }, [user]);

  // Add this temporarily to debug
  console.log('User data in profile:', user);

  // Add this debug log
  useEffect(() => {
    console.log('Current user data:', user);
  }, [user]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Submitting profile update:', editForm);

      if (!editForm.name || !editForm.email || !editForm.phone) {
        toast.error('Please fill in all required fields');
        return;
      }

      const response = await authAPI.updateProfile(editForm);
      console.log('Profile update response:', response);

      localStorage.setItem('token', response.token);
      updateUser(response.user);
      
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserCircleIcon className="h-24 w-24 text-white" />
              </div>
              <div className="ml-6">
                <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
                <div className="flex items-center mt-2">
                  <span className="px-3 py-1 text-sm text-blue-100 bg-blue-700/50 rounded-full">
                    {user?.role === 'student' ? 'Student' : 'Teacher'}
                  </span>
                  {user?.grade && (
                    <span className="ml-2 text-blue-100">
                      • {user.grade}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Stats */}
          <div className="border-t border-gray-200 bg-gray-50">
            <dl className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
              <div className="px-6 py-4">
                <dt className="text-sm font-medium text-gray-500">Member since</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(user?.createdAt || new Date().toISOString())}
                </dd>
              </div>
              <div className="px-6 py-4">
                <dt className="text-sm font-medium text-gray-500">Enrolled Courses</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user?.enrolledCourses?.length || 0} courses
                </dd>
              </div>
              <div className="px-6 py-4">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm">
                  <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                    Active
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Profile Content */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-6">
            <div className="space-y-8">
              {/* Personal Information */}
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Personal Information
                  </h2>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={editForm.name}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={editForm.email}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Phone
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={editForm.phone}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>

                      {user?.role === 'student' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            State
                          </label>
                          <select
                            name="grade"
                            value={editForm.grade}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          >
                            {/* Add your state options here */}
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end space-x-4">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        disabled={isLoading}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-3">
                      <IdentificationIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Username</p>
                        <p className="text-gray-900">{user?.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="text-gray-900">{user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <PhoneIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="text-gray-900">{user?.phone}</p>
                      </div>
                    </div>
                    {user?.role === 'student' && (
                      <div className="flex items-center space-x-3">
                        <MapPinIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">State</p>
                          <p className="text-gray-900">{user?.grade}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Enrolled Courses */}
              {user?.role === 'student' && (
                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Enrolled Courses
                  </h2>
                  {user?.enrolledCourses && user.enrolledCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {user.enrolledCourses.map((course: EnrolledCourse) => (
                        <div 
                          key={course.id}
                          className="flex items-start p-4 bg-gray-50 rounded-lg"
                        >
                          <AcademicCapIcon className="h-5 w-5 text-gray-400 mt-1" />
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-gray-900">
                              {course.title}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Enrolled on {formatDate(course.enrollmentDate)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      You haven't enrolled in any courses yet.
                    </p>
                  )}
                </section>
              )}

              {/* Account Actions */}
              <section className="border-t pt-6">
                <div className="flex justify-between items-center">
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Logout
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 