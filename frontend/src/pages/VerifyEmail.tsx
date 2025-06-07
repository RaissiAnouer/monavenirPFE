import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'success' | 'error' | null>(null);
  const [error, setError] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setError('');
    setVerificationStatus(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/email/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();
      if (res.ok) {
        setVerificationStatus('success');
        toast.success('Email verified successfully! You can now log in.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setVerificationStatus('error');
        setError(data.message || 'Invalid or expired code.');
      }
    } catch (err) {
      setVerificationStatus('error');
      setError('Server error. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Verify Your Email</h2>
          <form onSubmit={handleVerify} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Enter verification code"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            {verificationStatus === 'success' && <p className="text-green-600 text-sm">Email verified! Redirecting...</p>}
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              disabled={verifying}
            >
              {verifying ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>
          <button
            onClick={() => navigate('/login')}
            className="w-full px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 mt-4"
          >
            Back to login
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail; 
