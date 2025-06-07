import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'success' | 'error' | null>(null);
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setVerificationStatus('error');
        setVerifying(false);
        toast.error('Invalid verification link');
        return;
      }

      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/email/verify-email?token=${token}`);
        setVerificationStatus('success');
        toast.success('Email verified successfully!');
        
        // Store user data if needed
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Email verified successfully! Please login to continue.' 
            }
          });
        }, 3000);
      } catch (error: any) {
        setVerificationStatus('error');
        toast.error(error.response?.data?.message || 'Error verifying email');
      } finally {
        setVerifying(false);
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          {verifying ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Verifying your email...
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Please wait while we verify your email address.
              </p>
            </>
          ) : verificationStatus === 'success' ? (
            <>
              <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Email Verified Successfully!
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Your email has been verified. You will be redirected to the login page shortly.
              </p>
            </>
          ) : (
            <>
              <XCircleIcon className="mx-auto h-12 w-12 text-red-500" />
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Verification Failed
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {token ? 'The verification link is invalid or has expired.' : 'No verification token provided.'}
              </p>
              <div className="mt-6">
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Return to Login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail; 
