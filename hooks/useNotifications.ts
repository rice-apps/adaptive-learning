'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface Notification {
  id: string;
  created_at: string;
  educator_id: string;
  student_id: string;
  is_read: boolean;
  student: {
    first_name: string;
    last_name: string;
  };
}

const MOCK_NOTIFS: Notification[] = [
    {
        id: "hi",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        educator_id: "educator-1",
        student_id: "student-1",
        is_read: false,
        student: {
            first_name: "Sarah",
            last_name: "Johnson"
        }
    }, 
    {
        id: "bye",
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        educator_id: "educator-1",
        student_id: "student-1",
        is_read: false,
        student: {
            first_name: "LePrad",
            last_name: "James"
        }
    }
]

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  //Mock mark notif as read
  const markAsRead = (notificationId: string) => {
    console.log('Marking as read:', notificationId);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  //mock mark notifs all as read
  const markAllAsRead = () => {
    console.log('Marking all as read');
    setNotifications([]);
  };

  return {
    notifications,
    unreadCount: notifications.length,
    loading,
    error,
    markAsRead,
    markAllAsRead,
  };
};