import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { authAPI } from '../api/auth';
import { validatePhone, formatPhoneNumber } from '../utils/validation';
import {
  UserCircleIcon,
  AcademicCapIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ClockIcon,
  IdentificationIcon,
} from '@heroicons/react/24/outline';
import { User } from '../types/user';

interface EnrolledCourse {
  id: string;
  title: string;
  enrollmentDate: string;
}

interface EditableFields {
  name: string;
  username: string;
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
    username: '',
    phone: '',
    email: '',
    grade: ''
  });
  const [isPhoneValid, setIsPhoneValid] = useState(true);

  useEffect(() => {
    if (user) {
      console.log('User data in profile component:', user);
      const formattedPhone = user.phone ? formatPhoneNumber(user.phone) : '';
      setEditForm({
        name: user.name || '',
        username: user.username || '',
        phone: formattedPhone,
        email: user.email || '',
        grade: user.grade || ''
      });
      const phoneValidation = validatePhone(formattedPhone.replace(/\D/g, ''));
      setIsPhoneValid(phoneValidation.isValid);
    }
  }, [user]);

  // For debugging - check if phone data changes
  useEffect(() => {
    if (user) {
      console.log('User phone in profile:', user.phone);
    }
  }, [user?.phone]);

  const formatDate = (date: string) => {
    if (!date) return 'Not set';
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
    
    if (name === 'phone') {
      const formattedValue = formatPhoneNumber(value);
      setEditForm(prev => ({
        ...prev,
        [name]: formattedValue
      }));
      const phoneValidation = validatePhone(formattedValue.replace(/\D/g, ''));
      setIsPhoneValid(phoneValidation.isValid);
      return;
    }
    
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!editForm.name || !editForm.email || !editForm.phone || !editForm.username) {
        toast.error('Please fill in all required fields');
        setIsLoading(false);
        return;
      }

      const phoneValidation = validatePhone(editForm.phone.replace(/\D/g, ''));
      if (!phoneValidation.isValid) {
        toast.error(phoneValidation.message);
        setIsLoading(false);
        return;
      }

      const cleanPhone = editForm.phone.replace(/\D/g, '');
      const response = await authAPI.updateProfile({
        ...editForm,
        phone: cleanPhone
      });

      // Update local storage as well to ensure phone persists on refresh
      const updatedUser = response.user as User;
      updateUser(updatedUser);
      
      // Also update local storage directly to ensure phone number is saved
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        userData.phone = cleanPhone;
        localStorage.setItem('user', JSON.stringify(userData));
      }
      
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Display full name instead of just username
  const displayName = user?.name || 'Not set';
  // Use name for display just like in the header
  const displayUsername = user?.name || user?.username || 'Not set';
  const displayPhone = user?.phone ? formatPhoneNumber(user.phone) : 'Not set';

  const gradeOptions = [
    '1ère année', '2ème année', '3ème année', '4ème année', '5ème année',
    '6ème année', '7ème année', '8ème année', '9ème année'
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserCircleIcon className="h-24 w-24 text-white" />
              </div>
              <div className="ml-6">
                <h1 className="text-2xl font-bold text-white">{user?.name || user?.username || 'Not set'}</h1>
                <div className="flex items-center mt-2">
                  <span className="px-3 py-1 text-sm text-blue-100 bg-blue-700/50 rounded-full">
                    {user?.role === 'student' ? 'Student' : 'Teacher'}
                  </span>
                  {user?.grade && (
                    <span className="ml-2 text-blue-100">• {user.grade}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 bg-gray-50">
            <dl className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
              <div className="px-6 py-4">
                <dt className="text-sm font-medium text-gray-500">Member since</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(user?.createdAt || '')}
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
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-6">
            <div className="space-y-8">
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
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
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                          type="text"
                          name="name"
                          value={editForm.name}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        <input
                          type="text"
                          name="username"
                          value={editForm.username}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={editForm.email}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                        <div className="mt-1">
                          <input
                            type="tel"
                            name="phone"
                            value={editForm.phone}
                            onChange={handleInputChange}
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${!isPhoneValid ? 'border-red-500' : ''}`}
                            placeholder="XX XXX XXX"
                            maxLength={10}
                            required
                          />
                          {!isPhoneValid && (
                            <p className="mt-1 text-sm text-red-600">{validatePhone(editForm.phone.replace(/\D/g, '')).message}</p>
                          )}
                          <p className="mt-1 text-sm text-gray-500">Enter your 8-digit Tunisian phone number</p>
                        </div>
                      </div>
                      {user?.role === 'student' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Grade</label>
                          <select
                            name="grade"
                            value={editForm.grade || ''}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          >
                            <option value="">Select a grade</option>
                            {gradeOptions.map((grade) => (
                              <option key={grade} value={grade}>{grade}</option>
                            ))}
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
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                        disabled={isLoading || !isPhoneValid}
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
                        <p className="text-gray-900">{displayUsername}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="text-gray-900">{user?.email || 'Not set'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <PhoneIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="text-gray-900">{displayPhone}</p>
                      </div>
                    </div>
                    {user?.role === 'student' && (
                      <div className="flex items-center space-x-3">
                        <MapPinIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Grade</p>
                          <p className="text-gray-900">{user?.grade || 'Not set'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
              {user?.role === 'student' && (
                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Enrolled Courses</h2>
                  {user?.enrolledCourses && user.enrolledCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {user.enrolledCourses.map((course: EnrolledCourse) => (
                        <div key={course.id} className="flex items-start p-4 bg-gray-50 rounded-lg">
                          <AcademicCapIcon className="h-5 w-5 text-gray-400 mt-1" />
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-gray-900">{course.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">Enrolled on {formatDate(course.enrollmentDate)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">You haven't enrolled in any courses yet.</p>
                  )}
                </section>
              )}
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