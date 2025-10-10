import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import ThemeToggle from '../components/ui/ThemeToggle.js';
import Logo from '../components/ui/Logo';
import { referralAPI } from '../services/api';
import toast from 'react-hot-toast';

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register: registerUser, isLoading } = useAuth();
  const { isDark } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [referralValid, setReferralValid] = useState(null);
  const [checkingReferral, setCheckingReferral] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm();

  const password = watch('password');
  const email = watch('email');
  const phone = watch('phoneNumber');

  // Get referral code from URL
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferralCode(refCode);
      setValue('referralCode', refCode);
      validateReferralCode(refCode);
    }
  }, [searchParams, setValue]);

  const validateReferralCode = async (code) => {
    if (!code) {
      setReferralValid(null);
      return;
    }

    setCheckingReferral(true);
    try {
      const response = await referralAPI.validateCode(code);
      setReferralValid(true);
      toast.success(`Referral code valid! You'll get bonus from ${response.data.referrerName}`);
    } catch (error) {
      setReferralValid(false);
      toast.error('Invalid referral code');
    } finally {
      setCheckingReferral(false);
    }
  };

  const onSubmit = async (data) => {
    // Validate that at least email or phone is provided
    if (!data.email && !data.phoneNumber) {
      toast.error('Please provide either email or phone number');
      return;
    }

    const result = await registerUser(data);
    if (result.success) {
      // Check if user has email to determine redirect
      if (data.email) {
        // User has email, redirect to email verification
        navigate('/verify-email');
      } else {
        // User only has phone, redirect directly to dashboard
        navigate('/dashboard');
      }
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-coinbase-dark' : 'bg-gradient-to-br from-gray-50 to-white'} px-4 py-8 pb-20 md:pb-0`}>
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-coinbase-blue/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-coinbase-green/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-500/3 rounded-full blur-3xl"></div>
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
            Join Token Rise
          </h1>
          <p className={`text-lg ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>
            Start your investment journey today
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                  Create Account
                </h2>
                <p className={`text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>
                  Build your crypto portfolio
                </p>
              </div>
            </div>
          </div>

          {/* Card Content */}
          <div className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Full Name Input */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                  Full Name (Optional)
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Enter your full name (optional)"
                    error={errors.fullName?.message}
                    className={`${isDark ? 'coinbase-input' : 'w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-coinbase-blue focus:border-coinbase-blue transition-all duration-200'} ${errors.fullName ? 'border-red-500 focus:ring-red-500' : ''}`}
                    {...register('fullName', {
                      minLength: {
                        value: 2,
                        message: 'Name must be at least 2 characters'
                      }
                    })}
                  />
                  <div className="absolute right-3 top-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <p className={`mt-1 text-xs ${isDark ? 'text-coinbase-text-tertiary' : 'text-gray-500'}`}>
                  You can skip this field if you prefer to remain anonymous
                </p>
              </div>

              {/* Email Input */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                  Email (Optional)
                </label>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    error={errors.email?.message}
                    className={`${isDark ? 'coinbase-input' : 'w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-coinbase-blue focus:border-coinbase-blue transition-all duration-200'} ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                    {...register('email', {
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                  />
                  <div className="absolute right-3 top-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <p className={`mt-1 text-xs ${isDark ? 'text-coinbase-text-tertiary' : 'text-gray-500'}`}>
                  Email notifications and account recovery
                </p>
              </div>

              {/* Phone Input */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <Input
                    type="tel"
                    placeholder="Enter your phone number"
                    error={errors.phoneNumber?.message}
                    className={`${isDark ? 'coinbase-input' : 'w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-coinbase-blue focus:border-coinbase-blue transition-all duration-200'} ${errors.phoneNumber ? 'border-red-500 focus:ring-red-500' : ''}`}
                    {...register('phoneNumber', {
                      pattern: {
                        value: /^\+?[\d\s-()]+$/,
                        message: 'Invalid phone number'
                      }
                    })}
                  />
                  <div className="absolute right-3 top-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                </div>
                <p className={`mt-1 text-xs ${isDark ? 'text-coinbase-text-tertiary' : 'text-gray-500'}`}>
                  SMS notifications and account recovery
                </p>
              </div>

              {/* Important Notice */}
              <div className={`${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border' : 'bg-blue-50 border-blue-200'} border rounded-xl p-4`}>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className={`font-semibold text-sm mb-1 ${isDark ? 'text-coinbase-text-primary' : 'text-blue-900'}`}>
                      Important:
                    </p>
                    <p className={`text-xs ${isDark ? 'text-coinbase-text-secondary' : 'text-blue-700'}`}>
                      You must provide either an email address or phone number (or both) to register. This will be used for account recovery and notifications.
                    </p>
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    required
                    error={errors.password?.message}
                    className={`${isDark ? 'coinbase-input' : 'w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-coinbase-blue focus:border-coinbase-blue transition-all duration-200'} ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters'
                      },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                        message: 'Password must contain uppercase, lowercase, and number'
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

              {/* Confirm Password Input */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    required
                    error={errors.confirmPassword?.message}
                    className={`${isDark ? 'coinbase-input' : 'w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-coinbase-blue focus:border-coinbase-blue transition-all duration-200'} ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: value =>
                        value === password || 'Passwords do not match'
                    })}
                  />
                  <button
                    type="button"
                    className={`absolute right-3 top-3 ${isDark ? 'text-coinbase-text-secondary hover:text-coinbase-text-primary' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
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

              {/* Referral Code Input */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                  Referral Code (Optional)
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Enter referral code"
                    value={referralCode}
                    error={referralValid === false ? 'Invalid referral code' : undefined}
                    className={`${isDark ? 'coinbase-input' : 'w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-coinbase-blue focus:border-coinbase-blue transition-all duration-200'} ${referralValid === false ? 'border-red-500 focus:ring-red-500' : ''}`}
                    {...register('referralCode')}
                    onChange={(e) => {
                      const value = e.target.value;
                      setReferralCode(value);
                      setValue('referralCode', value);
                      if (value) {
                        validateReferralCode(value);
                      } else {
                        setReferralValid(null);
                      }
                    }}
                  />
                  <div className="absolute right-3 top-3">
                    {checkingReferral ? (
                      <svg className="w-5 h-5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : referralValid === true ? (
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    )}
                  </div>
                </div>
                <p className={`mt-1 text-xs ${isDark ? 'text-coinbase-text-tertiary' : 'text-gray-500'}`}>
                  Get bonus rewards when you use a valid referral code
                </p>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="terms"
                  className={`mt-1 rounded border-2 ${isDark ? 'border-coinbase-dark-border bg-coinbase-dark-tertiary' : 'border-gray-300 bg-white'} focus:ring-coinbase-blue focus:ring-2`}
                  {...register('acceptTerms', {
                    required: 'You must accept the terms and conditions'
                  })}
                />
                <label htmlFor="terms" className={`text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>
                  I agree to the{' '}
                  <Link to="/terms" className={`${isDark ? 'text-coinbase-blue hover:text-coinbase-blue-dark' : 'text-blue-600 hover:text-blue-700'} transition-colors`}>
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className={`${isDark ? 'text-coinbase-blue hover:text-coinbase-blue-dark' : 'text-blue-600 hover:text-blue-700'} transition-colors`}>
                    Privacy Policy
                  </Link>
                </label>
              </div>
              {errors.acceptTerms && (
                <p className="text-sm text-red-500">{errors.acceptTerms.message}</p>
              )}

              {/* Create Account Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-coinbase-blue to-coinbase-green hover:from-coinbase-blue-dark hover:to-green-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            {/* Footer Links */}
            <div className="mt-8 text-center">
              <p className={`text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-coinbase-blue hover:text-coinbase-blue-dark font-semibold transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
