import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import ThemeToggle from '../components/ui/ThemeToggle.js';
import Logo from '../components/ui/Logo';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();
  const { isDark } = useTheme();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const from = location.state?.from?.pathname || '/dashboard';

  const onSubmit = async (data) => {
    const result = await login(data);
    if (result.success) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-coinbase-dark' : 'bg-gradient-to-br from-gray-50 to-white'} px-4 pb-20 md:pb-0`}>
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-coinbase-blue/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-coinbase-green/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-md w-full">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-coinbase-blue to-coinbase-green rounded-2xl flex items-center justify-center shadow-2xl">
                <Logo className="h-12 w-12" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-coinbase-green rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
            Welcome Back
          </h1>
          <p className={`text-lg ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>
            Sign in to continue your investment journey
          </p>
          <div className="flex justify-center mt-6">
            <ThemeToggle size="sm" />
          </div>
        </div>

        {/* Main Card */}
        <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} border rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden`}>
          {/* Card Header */}
          <div className={`${isDark ? 'bg-gradient-to-r from-coinbase-blue/10 to-coinbase-green/10 border-coinbase-dark-border' : 'bg-gradient-to-r from-blue-50 to-green-50 border-gray-200'} border-b px-8 py-6`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-coinbase-blue to-coinbase-green rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>
              <div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                  Sign In
                </h2>
                <p className={`text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>
                  Access your account securely
                </p>
              </div>
            </div>
          </div>

          {/* Card Content */}
          <div className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email/Phone Input */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                  Email or Phone Number
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Enter your email or phone number"
                    required
                    error={errors.identifier?.message}
                    className={`${isDark ? 'coinbase-input' : 'w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-coinbase-blue focus:border-coinbase-blue transition-all duration-200'} ${errors.identifier ? 'border-red-500 focus:ring-red-500' : ''}`}
                    {...register('identifier', {
                      required: 'Email or phone number is required'
                    })}
                  />
                  <div className="absolute right-3 top-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                </div>
                <div className="mt-2 flex items-center space-x-4 text-xs">
                  <div className={`flex items-center space-x-1 ${isDark ? 'text-coinbase-text-tertiary' : 'text-gray-500'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>Email</span>
                  </div>
                  <div className={`flex items-center space-x-1 ${isDark ? 'text-coinbase-text-tertiary' : 'text-gray-500'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>Phone</span>
                  </div>
                </div>
                <p className={`mt-1 text-xs ${isDark ? 'text-coinbase-text-tertiary' : 'text-gray-500'}`}>
                  You can use either your email address or phone number to sign in
                </p>
              </div>

              {/* Password Input */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    required
                    error={errors.password?.message}
                    className={`${isDark ? 'coinbase-input' : 'w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-coinbase-blue focus:border-coinbase-blue transition-all duration-200'} ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                  />
                  <button
                    type="button"
                    className={`absolute right-3 top-3 ${isDark ? 'text-coinbase-text-secondary hover:text-coinbase-text-primary' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-coinbase-blue to-coinbase-green hover:from-coinbase-blue-dark hover:to-green-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Footer Links */}
            <div className="mt-8 text-center space-y-4">
              <p className={`text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="text-coinbase-blue hover:text-coinbase-blue-dark font-semibold transition-colors"
                >
                  Sign up
                </Link>
              </p>
              
              <Link
                to="/help"
                className={`text-sm ${isDark ? 'text-coinbase-text-tertiary hover:text-coinbase-text-secondary' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
              >
                Need help?
              </Link>
            </div>
          </div>
        </div>

        {/* Terms Footer */}
        <div className="mt-8 text-center">
          <p className={`text-xs ${isDark ? 'text-coinbase-text-tertiary' : 'text-gray-500'}`}>
            By signing in, you agree to our{' '}
            <Link to="/terms" className={`${isDark ? 'text-coinbase-text-secondary hover:text-coinbase-text-primary' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className={`${isDark ? 'text-coinbase-text-secondary hover:text-coinbase-text-primary' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
