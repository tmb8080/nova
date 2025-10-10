import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const AnnouncementCard = ({ announcement, onDismiss }) => {
  const { isDark } = useTheme();
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss(announcement.id);
    }
  };

  if (isDismissed) return null;

  const getPriorityColor = (priority) => {
    // Handle both integer and string priority values
    const priorityValue = typeof priority === 'number' ? priority : priority;
    
    switch (priorityValue) {
      case 3:
      case 'high':
        return 'from-red-500 to-red-600';
      case 2:
      case 'medium':
        return 'from-yellow-500 to-orange-500';
      case 1:
      case 'low':
        return 'from-blue-500 to-blue-600';
      default:
        return 'from-coinbase-blue to-coinbase-green';
    }
  };

  const getPriorityIcon = (priority) => {
    // Handle both integer and string priority values
    const priorityValue = typeof priority === 'number' ? priority : priority;
    
    switch (priorityValue) {
      case 3:
      case 'high':
        return (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 2:
      case 'medium':
        return (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 1:
      case 'low':
        return (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        );
    }
  };

  return (
    <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} border rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl`}>
      {/* Header with gradient background */}
      <div className={`bg-gradient-to-r ${getPriorityColor(announcement.priority)} px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              {getPriorityIcon(announcement.priority)}
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">
                {announcement.title}
              </h3>
              <p className="text-white/80 text-sm">
                {announcement.priority === 3 || announcement.priority === 'high' ? 'Important' : 
                 announcement.priority === 2 || announcement.priority === 'medium' ? 'Notice' : 
                 announcement.priority === 1 || announcement.priority === 'low' ? 'Info' : 'Announcement'}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className={`${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'} mb-4`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {announcement.content}
          </p>
        </div>

        {/* Footer with date and actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-coinbase-dark-border">
          <div className={`text-xs ${isDark ? 'text-coinbase-text-tertiary' : 'text-gray-500'}`}>
            {new Date(announcement.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
          
          {announcement.link && (
            <a
              href={announcement.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-coinbase-blue hover:text-coinbase-blue-dark text-sm font-semibold transition-colors flex items-center space-x-1"
            >
              <span>Learn More</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementCard;
