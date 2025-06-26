import { useState, useEffect, useCallback } from 'react';
import { 
  getUnreadNotifications, 
  getAllNotifications, 
  getUnreadNotificationCount,
  NotificationData 
} from '@/lib/notifications';

interface UseNotificationsResult {
  notifications: NotificationData[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refreshNotifications: () => Promise<void>;
}

export function useNotifications(walletAddress: string): UseNotificationsResult {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshNotifications = useCallback(async () => {
    if (!walletAddress) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [all, count] = await Promise.all([
        getAllNotifications(walletAddress, 20),
        getUnreadNotificationCount(walletAddress)
      ]);

      setNotifications(all);
      setUnreadCount(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    if (!walletAddress) return;

    const interval = setInterval(() => {
      refreshNotifications();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [walletAddress, refreshNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refreshNotifications
  };
}
