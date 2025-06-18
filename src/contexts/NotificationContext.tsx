import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api';

// Define Notification type
export interface Notification {
  id: string;
  user: string;
  type: string;
  message: string;
  createdAt: string;
  read: boolean;
  updatedAt?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token, user } = useAuth();
  const lastFetchRef = useRef<number>(0);
  const pendingUpdatesRef = useRef<Set<string>>(new Set());
  const localChangesRef = useRef<Map<string, boolean>>(new Map()); // Track local read state changes

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async (force = false) => {
    if (!token || !user?.email) return;

    // Don't fetch if we have pending updates unless forced
    if (!force && pendingUpdatesRef.current.size > 0) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const data = await apiGet('/api/notifications');
      
      // Merge with local state to preserve any local changes
      setNotifications(prev => {
        const merged = data.map((serverNotification: Notification) => {
          const localNotification = prev.find(n => n.id === serverNotification.id);
          
          // If we have a local change for this notification, preserve it
          if (localChangesRef.current.has(serverNotification.id)) {
            const shouldBeRead = localChangesRef.current.get(serverNotification.id);
            return {
              ...serverNotification,
              read: shouldBeRead || false
            };
          }
          
          // If we have a pending update, keep the local state
          if (localNotification && pendingUpdatesRef.current.has(serverNotification.id)) {
            return localNotification;
          }
          
          return serverNotification;
        });
        
        // Add any new notifications that aren't in the server response
        const newNotifications = prev.filter(n => 
          !data.some((serverN: Notification) => serverN.id === n.id)
        );
        
        return [...merged, ...newNotifications];
      });
      
      // Clear local changes for notifications that are now properly synced
      // Only clear if we don't have pending updates
      if (pendingUpdatesRef.current.size === 0) {
        data.forEach((serverNotification: Notification) => {
          if (localChangesRef.current.has(serverNotification.id)) {
            // If the server state matches our local change, we can clear it
            const localShouldBeRead = localChangesRef.current.get(serverNotification.id);
            if (serverNotification.read === localShouldBeRead) {
              localChangesRef.current.delete(serverNotification.id);
            }
          }
        });
      }
      
      lastFetchRef.current = Date.now();
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [token, user?.email]);

  // Mark a notification as read
  const markAsRead = useCallback(async (id: string) => {
    if (!token) return;

    // Track this local change
    localChangesRef.current.set(id, true);

    // Optimistically update local state first
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true, updatedAt: new Date().toISOString() }
          : notification
      )
    );

    // Add to pending updates
    pendingUpdatesRef.current.add(id);

    try {
      await apiPut(`/api/notifications/${id}`, { read: true });
      
      // Remove from pending updates on success
      pendingUpdatesRef.current.delete(id);
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark notification as read');
      
      // Revert local state on error
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read: false }
            : notification
        )
      );
      
      // Remove from pending updates and local changes
      pendingUpdatesRef.current.delete(id);
      localChangesRef.current.delete(id);
    }
  }, [token]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!token) return;

    const unreadNotifications = notifications.filter(n => !n.read);
    if (unreadNotifications.length === 0) return;

    // Track all local changes
    unreadNotifications.forEach(n => localChangesRef.current.set(n.id, true));

    // Optimistically update local state first
    setNotifications(prev => 
      prev.map(notification => ({
        ...notification,
        read: true,
        updatedAt: new Date().toISOString()
      }))
    );

    // Add all unread notifications to pending updates
    unreadNotifications.forEach(n => pendingUpdatesRef.current.add(n.id));

    try {
      await apiPut('/api/notifications/mark-all-read', {});
      
      // Remove all from pending updates on success
      unreadNotifications.forEach(n => pendingUpdatesRef.current.delete(n.id));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark all notifications as read');
      
      // Revert local state on error
      setNotifications(prev => 
        prev.map(notification => ({
          ...notification,
          read: unreadNotifications.some(n => n.id === notification.id) ? false : notification.read
        }))
      );
      
      // Remove all from pending updates and local changes
      unreadNotifications.forEach(n => {
        pendingUpdatesRef.current.delete(n.id);
        localChangesRef.current.delete(n.id);
      });
    }
  }, [token, notifications]);

  // Add a new notification (for testing or real-time updates)
  const addNotification = useCallback(async (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    if (!token) return;

    try {
      const newNotification = await apiPost('/api/notifications', notification);
      setNotifications(prev => [newNotification, ...prev]);
    } catch (err) {
      console.error('Error creating notification:', err);
      setError(err instanceof Error ? err.message : 'Failed to create notification');
    }
  }, [token]);

  // Delete a notification
  const deleteNotification = useCallback(async (id: string) => {
    if (!token) return;
    // Optimistically remove from UI
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await apiDelete(`/api/notifications/${id}`);
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete notification');
      // Optionally: revert UI change if needed
      fetchNotifications(true);
    }
  }, [token, fetchNotifications]);

  // Fetch notifications on mount and when token/user changes
  useEffect(() => {
    fetchNotifications(true); // Force initial fetch
  }, [fetchNotifications]);

  // Set up polling to check for new notifications every 30 seconds
  useEffect(() => {
    if (!token || !user?.email) return;

    const interval = setInterval(() => {
      // Only fetch if no pending updates
      if (pendingUpdatesRef.current.size === 0) {
        fetchNotifications();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [token, user?.email, fetchNotifications]);

  const value: NotificationContextType = {
    notifications,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    addNotification,
    deleteNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
    {children}
  </NotificationContext.Provider>
);
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return ctx;
}; 