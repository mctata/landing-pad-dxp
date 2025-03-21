'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/lib/auth/auth-context';
import { authAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    try {
      // For demo purposes, check credentials
      if ((data.email === 'admin@example.com' || data.email === 'john@example.com') && 
          data.password === 'password123') {
          
        // Create a user object for mock auth
        const user = {
          id: 'mock-user-id',
          name: data.email.split('@')[0],
          email: data.email,
          subscription: data.email === 'admin@example.com' ? 'enterprise' : 'pro',
          role: data.email === 'admin@example.com' ? 'admin' : 'user',
        };
        
        // Store all user data for persistence
        const userData = JSON.stringify(user);
        localStorage.setItem('userData', userData);
        
        // Set additional items for backward compatibility
        localStorage.setItem('token', 'mock-jwt-token-' + Math.random().toString(36).substring(2));
        localStorage.setItem('userEmail', data.email);
        localStorage.setItem('userRole', data.email === 'admin@example.com' ? 'admin' : 'user');
        
        // Show success message
        toast.success('Login successful');
        
        // Redirect based on email - use query params to prevent redirect loops
        setTimeout(() => {
          if (data.email === 'admin@example.com') {
            // Admin dashboard - force a direct navigation with href to avoid any middleware issues
            console.log('Redirecting admin to dashboard...');
            window.location.href = '/admin/dashboard?fromLogin=true';
          } else {
            // User create page
            console.log('Redirecting user to dashboard/create...');
            window.location.href = '/dashboard/create?fromLogin=true';
          }
        }, 1000);
        
        return;
      }
      
      // If credentials don't match demo accounts
      toast.error('Login failed. Please use the demo credentials shown below.');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred while logging in.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="login-page">
      <style jsx global>{`
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f5f5f5;
        }
        .login-container {
            background-color: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 400px;
            margin: 4rem auto;
        }
        .logo-section {
            text-align: center;
            margin-bottom: 1.5rem;
        }
        .logo-text {
            font-weight: bold;
            font-size: 1.5rem;
            color: #333;
            margin-top: 0.5rem;
        }
        h1 {
            text-align: center;
            margin-bottom: 1.5rem;
            font-size: 1.5rem;
            color: #333;
        }
        .form-group {
            margin-bottom: 1rem;
        }
        label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: #333;
        }
        input[type="email"],
        input[type="password"] {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #d1d1d1;
            border-radius: 4px;
            font-size: 1rem;
            box-sizing: border-box;
            color: #333333;
            background-color: #ffffff;
        }
        .checkbox-group {
            display: flex;
            align-items: center;
            margin: 1rem 0;
        }
        .checkbox-group label {
            margin-bottom: 0;
            margin-left: 0.5rem;
        }
        button {
            width: 100%;
            padding: 0.75rem;
            background-color: #4f46e5;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            margin-top: 1rem;
        }
        button:hover {
            background-color: #4338ca;
        }
        .help-box {
            margin-top: 1.5rem;
            padding: 1rem;
            background-color: #f0f7ff;
            border: 1px solid #cfe2ff;
            border-radius: 4px;
        }
        .help-box h2 {
            margin-top: 0;
            font-size: 1rem;
            color: #0d47a1;
        }
        .help-box p {
            margin: 0.25rem 0;
            font-size: 0.875rem;
            color: #1976d2;
        }
        .help-box strong {
            font-weight: 600;
        }
        .redirect-notice {
            text-align: center;
            margin-top: 1rem;
            padding: 0.75rem;
            background-color: #fff8e1;
            border: 1px solid #ffecb3;
            border-radius: 4px;
            font-size: 0.875rem;
            color: #ff8f00;
        }
        .subtitle {
            text-align: center;
            margin-top: 0.5rem;
            margin-bottom: 2rem;
            font-size: 0.875rem;
            color: #6b7280;
        }
        .subtitle a {
            color: #4f46e5;
            text-decoration: none;
        }
        .subtitle a:hover {
            text-decoration: underline;
        }
      `}</style>
      
      <div className="login-container">
        <div className="logo-section">
          <Link href="/">
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ position: 'relative', width: '40px', height: '40px' }}>
                <Image 
                  src="/images/logo.svg" 
                  alt="Landing Pad Digital" 
                  width={40}
                  height={40}
                />
              </div>
              <span className="logo-text">Landing Pad</span>
            </div>
          </Link>
        </div>
        
        <h1>Sign in to your account</h1>
        <p className="subtitle">
          Or{' '}
          <Link href="/auth/signup">
            create a new account
          </Link>
        </p>
        
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                {...register('password', { 
                  required: 'Password is required',
                })}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0',
                  width: 'auto',
                  margin: '0'
                }}
              >
                {showPassword ? 
                  <span style={{ color: '#6b7280' }}>Hide</span> : 
                  <span style={{ color: '#6b7280' }}>Show</span>
                }
              </button>
            </div>
          </div>
          
          <div className="checkbox-group">
            <input
              id="remember-me"
              type="checkbox"
            />
            <label htmlFor="remember-me">
              Remember me
            </label>
          </div>
          
          <button type="submit">
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
          
          <div style={{ textAlign: 'center', margin: '1.5rem 0', color: '#6b7280' }}>
            <span>Or continue with</span>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button 
              type="button" 
              onClick={() => authAPI.loginWithGoogle()}
              style={{ 
                backgroundColor: '#fff', 
                color: '#333', 
                border: '1px solid #d1d1d1',
                width: '33%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21.6 12.227c0-.709-.064-1.39-.182-2.045H12v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z" fill="#4285F4"/>
                <path d="M12 22c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H3.064v2.59A9.996 9.996 0 0012 22z" fill="#34A853"/>
                <path d="M6.405 13.9c-.2-.6-.314-1.24-.314-1.9 0-.66.114-1.3.314-1.9V7.51H3.064A9.996 9.996 0 002 12c0 1.614.386 3.14 1.064 4.49l3.34-2.59z" fill="#FBBC05"/>
                <path d="M12 5.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C16.959 2.99 14.695 2 12 2 7.9 2 4.4 4.27 2.75 7.51l3.34 2.59C6.876 7.737 9.082 5.977 12 5.977z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            
            <button 
              type="button" 
              onClick={() => authAPI.loginWithFacebook()}
              style={{ 
                backgroundColor: '#1877F2', 
                color: 'white', 
                border: 'none',
                width: '33%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.234 2.686.234v2.953H15.83c-1.491 0-1.956.925-1.956 1.875V12h3.328l-.532 3.47h-2.796v8.385C19.612 22.954 24 17.99 24 12z" fill="white"/>
              </svg>
              Facebook
            </button>
            
            <button 
              type="button" 
              onClick={() => authAPI.loginWithLinkedIn()}
              style={{ 
                backgroundColor: '#0077B5', 
                color: 'white', 
                border: 'none',
                width: '33%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="white"/>
              </svg>
              LinkedIn
            </button>
          </div>
          
          <div className="help-box">
            <h2>Demo Credentials:</h2>
            <p><strong>Admin:</strong> admin@example.com / password123</p>
            <p><strong>User:</strong> john@example.com / password123</p>
          </div>
        </form>
      </div>
    </div>
  );
}