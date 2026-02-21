'use client';

import { useEffect, useState, useCallback } from 'react';

export interface Notification {
  id: string;
  created_at: string;
  student_id: string;
  is_read: boolean;
  student: {
    first_name: string;
    last_name: string;
  };
}

function mapApiNotificationToNotification(api: {
  id: string;
  studentId: string;
  studentName: string;
  createdAt: string;
  read: boolean;
  unread: boolean;
}): Notification {
  const parts = api.studentName.trim().split(/\s+/);
  const first_name = parts[0] ?? api.studentName;
  const last_name = parts.slice(1).join(' ') ?? '';
  return {
    id: String(api.id),
    created_at: api.createdAt,
    student_id: String(api.studentId),
    is_read: Boolean(api.read),
    student: { first_name, last_name },
  };
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/educator/notifications', { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 401) {
          setError('Please log in.');
          setNotifications([]);
          return;
        }
        if (res.status === 404) {
          setError('Educator not found. Log in as an educator to see notifications.');
          setNotifications([]);
          return;
        }
        const data = await res.json().catch(() => ({}));
        throw new Error(data.details ?? data.error ?? res.statusText);
      }
      const data = await res.json();
      const list = Array.isArray(data.notifications) ? data.notifications : [];
      setNotifications(list.map(mapApiNotificationToNotification));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        const res = await fetch('/api/educator/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: [notificationId] }),
        });
        if (!res.ok) return;
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
        );
      } catch {
        // ignore
      }
    },
    []
  );

  const markAllAsRead = useCallback(async () => {
    try {
      const res = await fetch('/api/educator/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      if (!res.ok) return;
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // ignore
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
};
