import { Notification } from '@/hooks/useNotifications';
import NotificationItem from './NotificationItem';

interface NotificationDropdownProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
  loading?: boolean;
  error?: string | null;
}

export default function NotificationDropdown({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose,
  loading = false,
  error = null,
}: NotificationDropdownProps) {
  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-[100]" role="dialog" aria-label="Notifications">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Notifications</h3>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAllAsRead();
            }}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            Mark all as read
          </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-gray-400 hover:text-gray-600 p-1 rounded"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>

      {/* Notification List */}
      <div className="max-h-96 overflow-y-auto">
        {error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-amber-600">{error}</p>
            <p className="text-xs text-gray-500 mt-1">Make sure you&apos;re logged in as an educator.</p>
          </div>
        ) : loading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No new notifications</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={onMarkAsRead}
            />
          ))
        )}
      </div>
    </div>
  );
}