'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/lib/auth/auth-context';
import { toast } from 'react-hot-toast';

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
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
        
        // Redirect based on email - use simple URLs with no parameters
        // This reduces the chances of redirect loops
        setTimeout(() => {
          if (data.email === 'admin@example.com') {
            // Admin dashboard
            window.location.replace('/dashboard');
          } else {
            // User create page
            window.location.replace('/dashboard/create');
          }
        }, 500);
        
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
            <input
              id="password"
              type="password"
              {...register('password', { 
                required: 'Password is required',
              })}
            />
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