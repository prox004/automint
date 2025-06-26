import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  updateDoc, 
  doc, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';

export interface NotificationData {
  id?: string;
  wallet: string;
  invoiceId: number;
  title: string;
  message: string;
  read: boolean;
  timestamp: Timestamp;
  merchantName?: string;
  amount?: string;
}

/**
 * Send a notification to a specific wallet address
 */
export async function sendNotification(
  toWallet: string,
  invoiceId: number,
  title: string,
  message: string,
  merchantName?: string,
  amount?: string
): Promise<void> {
  try {
    const notification = {
      wallet: toWallet.toLowerCase(),
      invoiceId,
      title,
      message,
      read: false,
      timestamp: serverTimestamp(),
      merchantName: merchantName || 'Unknown Merchant',
      amount: amount || '0'
    };

    await addDoc(collection(db, 'notifications'), notification);
    console.log('Notification sent successfully');
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}

/**
 * Get unread notifications for a wallet address
 */
export async function getUnreadNotifications(wallet: string): Promise<NotificationData[]> {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('wallet', '==', wallet.toLowerCase()),
      where('read', '==', false),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const notifications: NotificationData[] = [];

    querySnapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data()
      } as NotificationData);
    });

    return notifications;
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    return [];
  }
}

/**
 * Get all notifications for a wallet address (read and unread)
 */
export async function getAllNotifications(wallet: string, limit: number = 20): Promise<NotificationData[]> {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('wallet', '==', wallet.toLowerCase()),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const notifications: NotificationData[] = [];

    querySnapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data()
      } as NotificationData);
    });

    return notifications.slice(0, limit);
  } catch (error) {
    console.error('Error fetching all notifications:', error);
    return [];
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a wallet
 */
export async function markAllNotificationsAsRead(wallet: string): Promise<void> {
  try {
    const unreadNotifications = await getUnreadNotifications(wallet);
    
    const updatePromises = unreadNotifications.map(notification => {
      if (notification.id) {
        return markNotificationAsRead(notification.id);
      }
      return Promise.resolve();
    });

    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

/**
 * Get notification count for a wallet
 */
export async function getUnreadNotificationCount(wallet: string): Promise<number> {
  try {
    const unreadNotifications = await getUnreadNotifications(wallet);
    return unreadNotifications.length;
  } catch (error) {
    console.error('Error getting notification count:', error);
    return 0;
  }
}
