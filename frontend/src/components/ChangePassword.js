import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authAPI } from '../services/api';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import toast from 'react-hot-toast';

const ChangePassword = ({ onClose }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const changePasswordMutation = useMutation({
    mutationFn: authAPI.changePassword,
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Password changed successfully!');
        onClose();
      } else {
        toast.error(data.message || 'Failed to change password');
      }
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to change password';
      toast.error(errorMessage);
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        const validationErrors = {};
        error.response.data.errors.forEach(err => {
          validationErrors[err.path] = err.msg;
        });
        setErrors(validationErrors);
      }
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'New password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    changePasswordMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="backdrop-blur-xl bg-white/10 rounded-2xl w-full max-w-md overflow-hidden border border-white/20 shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Change Password</h3>
            <Button
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white rounded-full w-8 h-8 p-0"
            >
              ✕
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Current Password
              </label>
              <div className="relative">
                <Input
                  type={showPasswords.current ? 'text' : 'password'}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  placeholder="Enter your current password"
                  className={`w-full pr-10 ${errors.currentPassword ? 'border-red-500' : ''}`}
                  disabled={changePasswordMutation.isLoading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPasswords.current ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-red-400 text-sm mt-1">{errors.currentPassword}</p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                New Password
              </label>
              <div className="relative">
                <Input
                  type={showPasswords.new ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  placeholder="Enter your new password"
                  className={`w-full pr-10 ${errors.newPassword ? 'border-red-500' : ''}`}
                  disabled={changePasswordMutation.isLoading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPasswords.new ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-red-400 text-sm mt-1">{errors.newPassword}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your new password"
                  className={`w-full pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  disabled={changePasswordMutation.isLoading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPasswords.confirm ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Password Requirements */}
            <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30">
              <p className="text-sm text-gray-300 mb-2">Password Requirements:</p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• At least 6 characters long</li>
                <li>• Should be different from current password</li>
                <li>• Use a combination of letters, numbers, and symbols</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white rounded-xl"
                disabled={changePasswordMutation.isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white rounded-xl"
                disabled={changePasswordMutation.isLoading}
              >
                {changePasswordMutation.isLoading ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
