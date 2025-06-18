import React, { useState, useEffect, useRef } from 'react';
import { BellIcon, BellAlertIcon, XMarkIcon, DocumentTextIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { useNotifications, Notification } from '../contexts/NotificationContext';

const NotificationBell: React.FC = () => {
  const { notifications, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
  const [markingAsRead, setMarkingAsRead] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync read notifications with backend state
  useEffect(() => {
    const readIds = notifications
      .filter((n: Notification) => n.read)
      .map((n: Notification) => n.id);
    setReadNotifications(new Set(readIds));
    localStorage.setItem('readNotifications', JSON.stringify(readIds));
  }, [notifications]);

  // Debug logging
  useEffect(() => {
    const unreadCount = notifications.filter((n: Notification) => !n.read).length;
    console.log('Notification state changed:', {
      total: notifications.length,
      unread: unreadCount,
      read: notifications.length - unreadCount
    });
  }, [notifications]);

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMarkAsRead = async (id: string) => {
    if (markingAsRead.has(id)) return; // Prevent double-clicking
    
    console.log('Marking notification as read:', id);
    setMarkingAsRead(prev => new Set(prev).add(id));
    
    try {
      await markAsRead(id);
      console.log('Successfully marked notification as read:', id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    } finally {
      setMarkingAsRead(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (deleting.has(id)) return;
    setDeleting(prev => new Set(prev).add(id));
    try {
      await deleteNotification(id);
    } catch (error) {
      console.error('Error deleting notification:', error);
    } finally {
      setDeleting(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleMarkAllRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.read);
    if (unreadNotifications.length === 0) return;
    
    console.log('Marking all notifications as read:', unreadNotifications.length);
    const unreadIds = new Set(unreadNotifications.map(n => n.id));
    setMarkingAsRead(unreadIds);
    
    try {
      await markAllAsRead();
      console.log('Successfully marked all notifications as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    } finally {
      setMarkingAsRead(new Set());
    }
  };

  const unreadCount = notifications.filter((n: Notification) => !n.read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
        disabled={loading}
      >
        {unreadCount > 0 ? (
          <BellAlertIcon className="h-6 w-6 text-indigo-600" />
        ) : (
        <BellIcon className="h-6 w-6" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            {unreadCount}
          </span>
        )}
        {loading && (
          <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-blue-500 animate-pulse"></div>
        )}
      </button>

      {isOpen && (
        <div className="fixed top-16 right-4 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-[9999]">
          <div className="p-4 border-b border-gray-200 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-indigo-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-sm text-indigo-600 hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || markingAsRead.size > 0}
                >
                  {markingAsRead.size > 0 ? 'Marking...' : 'Mark all as read'}
                </button>
              )}
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification: Notification) => (
                    <div
                      key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150 ${
                    !notification.read ? 'bg-indigo-50' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{notification.type}</h4>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteNotification(notification.id)}
                      className="ml-2 p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Delete notification"
                      disabled={loading || deleting.has(notification.id)}
                    >
                      {deleting.has(notification.id) ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
                      ) : (
                        <XMarkIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
              </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell; 