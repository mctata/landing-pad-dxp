'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';

enum VerificationStatus {
  VERIFYING = 'verifying',
  SUCCESS = 'success',
  ERROR = 'error',
  EXPIRED = 'expired'
}

export default function VerifyEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<VerificationStatus>(VerificationStatus.VERIFYING);
  const [message, setMessage] = useState<string>('Verifying your email...');
  const [email, setEmail] = useState<string>('');
  const [isResending, setIsResending] = useState<boolean>(false);
  const [resendMessage, setResendMessage] = useState<string>('');

  useEffect(() => {
    const verifyEmailToken = async () => {
      if (!token) {
        setStatus(VerificationStatus.ERROR);
        setMessage('No verification token provided. Please check your verification link.');
        return;
      }

      try {
        const response = await api.get(`/auth/verify-email/${token}`);
        
        if (response.data.success) {
          setStatus(VerificationStatus.SUCCESS);
          setMessage(response.data.message || 'Your email has been verified successfully!');
          // If we have user's email in response, save it for potential resend
          if (response.data.email) {
            setEmail(response.data.email);
          }
        } else {
          setStatus(VerificationStatus.ERROR);
          setMessage(response.data.message || 'Email verification failed. Please try again.');
        }
      } catch (error: any) {
        if (error.response && error.response.status === 400) {
          // Token is invalid or expired
          setStatus(VerificationStatus.EXPIRED);
          setMessage(error.response.data.message || 'Verification link has expired or is invalid.');
          // If we have user's email in response, save it for resend
          if (error.response.data.email) {
            setEmail(error.response.data.email);
          }
        } else {
          setStatus(VerificationStatus.ERROR);
          setMessage('An error occurred during email verification. Please try again later.');
        }
        console.error('Email verification error:', error);
      }
    };

    verifyEmailToken();
  }, [token]);

  const handleResendVerification = async () => {
    if (!email) {
      setResendMessage('Please enter your email address to resend the verification link.');
      return;
    }

    setIsResending(true);
    setResendMessage('');

    try {
      const response = await api.post('/auth/resend-verification', { email });
      setResendMessage(response.data.message || 'Verification email has been resent.');
    } catch (error: any) {
      setResendMessage(
        error.response?.data?.message || 
        'Failed to resend verification email. Please try again later.'
      );
      console.error('Resend verification error:', error);
    } finally {
      setIsResending(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Email Verification
          </h2>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          {status === VerificationStatus.VERIFYING && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-700">{message}</p>
            </div>
          )}

          {status === VerificationStatus.SUCCESS && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <p className="mt-4 text-green-600">{message}</p>
              <div className="mt-6">
                <Link
                  href="/auth/login"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Continue to Login
                </Link>
              </div>
            </div>
          )}

          {status === VerificationStatus.ERROR && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <p className="mt-4 text-red-600">{message}</p>
              <div className="mt-6">
                <Link
                  href="/auth/login"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Return to Login
                </Link>
              </div>
            </div>
          )}

          {(status === VerificationStatus.EXPIRED) && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </div>
              <p className="mt-4 text-yellow-600">{message}</p>
              
              <div className="mt-6">
                <div className="mb-4">
                  <label htmlFor="email" className="sr-only">Email address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={handleEmailChange}
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Email address"
                  />
                </div>
                <button
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isResending ? 'Sending...' : 'Resend Verification Email'}
                </button>
                {resendMessage && (
                  <p className={`mt-2 text-sm ${resendMessage.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
                    {resendMessage}
                  </p>
                )}
              </div>
              
              <div className="mt-4">
                <Link
                  href="/auth/login"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Return to Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}