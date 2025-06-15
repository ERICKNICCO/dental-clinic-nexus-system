
import {
  collection,
  doc,
  updateDoc,
  writeBatch,
  query,
  getDocs,
  orderBy,
  onSnapshot,
  Timestamp,
  addDoc,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Notification } from '../types/notification';

export const notificationService = {
  async addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    try {
      const newNotification: Omit<Notification, 'id'> = {
        ...notification,
        timestamp: Timestamp.now().toDate(),
        read: false,
      };
      await addDoc(collection(db, 'notifications'), newNotification);
      console.log('Notification added to Firestore.', newNotification);
    } catch (error) {
      console.error('Error adding notification to Firestore:', error);
      throw error;
    }
  },

  async markNotificationAsRead(notificationId: string) {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        updatedAt: Timestamp.now(),
      });
      console.log(`Notification ${notificationId} marked as read in Firestore.`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  async markAllNotificationsAsRead() {
    try {
      const batch = writeBatch(db);
      const notificationsQuery = query(collection(db, 'notifications'), where('read', '==', false));
      const querySnapshot = await getDocs(notificationsQuery);

      querySnapshot.forEach((doc) => {
        const notificationRef = doc.ref;
        batch.update(notificationRef, {
          read: true,
          updatedAt: Timestamp.now(),
        });
      });

      await batch.commit();
      console.log('All unread notifications marked as read in Firestore.');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  async markAllAsUnread(notificationIds: string[]) {
    try {
      const batch = writeBatch(db);
      notificationIds.forEach(id => {
        const ref = doc(db, 'notifications', id);
        batch.update(ref, { read: false });
      });
      await batch.commit();
      console.log('All notifications marked as unread.');
    } catch (error) {
      console.error('Error marking notifications as unread:', error);
      throw error;
    }
  },

  async getNotifications(targetDoctorName?: string) {
    try {
      let q = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'));
      if (targetDoctorName) {
        q = query(q, where('targetDoctorName', '==', targetDoctorName));
      }
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate(),
      })) as Notification[];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  subscribeToNotifications(callback: (notifications: Notification[]) => void, targetDoctorName?: string) {
    let q = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'));
    if (targetDoctorName) {
      q = query(q, where('targetDoctorName', '==', targetDoctorName));
    }

    return onSnapshot(q, (querySnapshot) => {
      const notifications = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate(),
      })) as Notification[];
      callback(notifications);
    });
  },
};
