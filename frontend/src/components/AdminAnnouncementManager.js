import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { announcementsAPI } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './ui/Button';
import toast from 'react-hot-toast';

const AdminAnnouncementManager = () => {
  const { isDark } = useTheme();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'medium',
    isActive: true,
    link: ''
  });

  // Fetch announcements
  const { data: announcements, isLoading } = useQuery({
    queryKey: ['adminAnnouncements'],
    queryFn: async () => {
      const response = await announcementsAPI.getAllAnnouncements();
      return response.data;
    },
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });

  // Create announcement mutation
  const createMutation = useMutation({
    mutationFn: (data) => announcementsAPI.createAnnouncement(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminAnnouncements']);
      queryClient.invalidateQueries(['activeAnnouncements']);
      toast.success('Announcement created successfully!');
      setShowModal(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create announcement');
    },
  });

  // Update announcement mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => announcementsAPI.updateAnnouncement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminAnnouncements']);
      queryClient.invalidateQueries(['activeAnnouncements']);
      toast.success('Announcement updated successfully!');
      setShowModal(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update announcement');
    },
  });

  // Delete announcement mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => announcementsAPI.deleteAnnouncement(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminAnnouncements']);
      queryClient.invalidateQueries(['activeAnnouncements']);
      toast.success('Announcement deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete announcement');
    },
  });

  // Toggle announcement mutation
  const toggleMutation = useMutation({
    mutationFn: (id) => announcementsAPI.toggleAnnouncement(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminAnnouncements']);
      queryClient.invalidateQueries(['activeAnnouncements']);
      toast.success('Announcement status updated!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update announcement status');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      priority: 'medium',
      isActive: true,
      link: ''
    });
    setEditingAnnouncement(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!formData.content.trim()) {
      toast.error('Content is required');
      return;
    }
    
    // Transform data for API
    const apiData = {
      title: formData.title.trim(),
      content: formData.content.trim(),
      type: 'INFO', // Default type
      priority: formData.priority === 'low' ? 1 : formData.priority === 'medium' ? 2 : 3,
      isActive: formData.isActive
    };

    if (editingAnnouncement) {
      updateMutation.mutate({ id: editingAnnouncement.id, data: apiData });
    } else {
      createMutation.mutate(apiData);
    }
  };

  const handleEdit = (announcement) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority === 1 ? 'low' : announcement.priority === 2 ? 'medium' : 'high',
      isActive: announcement.isActive,
      link: announcement.link || ''
    });
    setEditingAnnouncement(announcement);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggle = (id) => {
    toggleMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div className={`${isDark ? 'bg-coinbase-dark-secondary' : 'bg-white'} rounded-xl p-6 border ${isDark ? 'border-coinbase-dark-border' : 'border-gray-200'}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 dark:bg-coinbase-dark-border rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-300 dark:bg-coinbase-dark-border rounded"></div>
            <div className="h-4 bg-gray-300 dark:bg-coinbase-dark-border rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isDark ? 'bg-coinbase-dark-secondary' : 'bg-white'} rounded-xl border ${isDark ? 'border-coinbase-dark-border' : 'border-gray-200'}`}>
      {/* Header */}
      <div className={`${isDark ? 'bg-gradient-to-r from-coinbase-blue/10 to-coinbase-green/10 border-coinbase-dark-border' : 'bg-gradient-to-r from-blue-50 to-green-50 border-gray-200'} border-b px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-coinbase-blue to-coinbase-green rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                Announcement Management
              </h2>
              <p className={`text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>
                Manage system announcements for users
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-gradient-to-r from-coinbase-blue to-coinbase-green hover:from-coinbase-blue-dark hover:to-green-600 text-white"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Announcement
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {announcements?.data?.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-coinbase-dark-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
              No announcements yet
            </h3>
            <p className={`text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} mb-4`}>
              Create your first announcement to communicate with users
            </p>
            <Button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="bg-gradient-to-r from-coinbase-blue to-coinbase-green hover:from-coinbase-blue-dark hover:to-green-600 text-white"
            >
              Create Announcement
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements?.data?.map((announcement) => (
              <div
                key={announcement.id}
                className={`${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border' : 'bg-gray-50 border-gray-200'} border rounded-lg p-4`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className={`font-semibold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                        {announcement.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        announcement.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                        announcement.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                      }`}>
                        {announcement.priority}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        announcement.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}>
                        {announcement.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className={`text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} mb-2`}>
                      {announcement.content}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-coinbase-text-tertiary' : 'text-gray-500'}`}>
                      Created: {new Date(announcement.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(announcement)}
                      className={`p-2 rounded-lg transition-colors ${
                        isDark ? 'text-coinbase-text-secondary hover:bg-coinbase-dark-border hover:text-coinbase-text-primary' :
                        'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleToggle(announcement.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        announcement.isActive ? 
                          (isDark ? 'text-yellow-400 hover:bg-yellow-900/20' : 'text-yellow-600 hover:bg-yellow-100') :
                          (isDark ? 'text-green-400 hover:bg-green-900/20' : 'text-green-600 hover:bg-green-100')
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        isDark ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-100'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} border rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                  {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark ? 'text-coinbase-text-secondary hover:bg-coinbase-dark-border hover:text-coinbase-text-primary' :
                    'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 ${
                      isDark ? 'coinbase-input' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-coinbase-blue focus:border-coinbase-blue'
                    }`}
                    placeholder="Enter announcement title"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                    Content *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 resize-none ${
                      isDark ? 'coinbase-input' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-coinbase-blue focus:border-coinbase-blue'
                    }`}
                    placeholder="Enter announcement content"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 ${
                        isDark ? 'coinbase-input' : 'border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-coinbase-blue focus:border-coinbase-blue'
                      }`}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                      Status
                    </label>
                    <select
                      value={formData.isActive ? 'active' : 'inactive'}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                      className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 ${
                        isDark ? 'coinbase-input' : 'border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-coinbase-blue focus:border-coinbase-blue'
                      }`}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                    Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 ${
                      isDark ? 'coinbase-input' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-coinbase-blue focus:border-coinbase-blue'
                    }`}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                      isDark ? 'bg-coinbase-dark-tertiary text-coinbase-text-secondary hover:bg-coinbase-dark-border hover:text-coinbase-text-primary border border-coinbase-dark-border' :
                      'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="px-6 py-3 bg-gradient-to-r from-coinbase-blue to-coinbase-green hover:from-coinbase-blue-dark hover:to-green-600 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 
                     editingAnnouncement ? 'Update Announcement' : 'Create Announcement'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnnouncementManager;
