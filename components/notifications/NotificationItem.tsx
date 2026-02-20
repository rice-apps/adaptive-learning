import { Notification } from '@/hooks/useNotifications';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

export default function NotificationItem({
  notification,
  onMarkAsRead,
}: NotificationItemProps) {
  // safe check for student name
  const studentName = notification.student
    ? `${notification.student.first_name} ${notification.student.last_name}`
    : 'Unknown Student';

  // create the message dynamically
  const message = notification.student
    ? `${notification.student.first_name} ${notification.student.last_name} is now at risk`
    : 'A student is now at risk';

  //format time ago (simple version)
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    
    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins} min ago`;
    
    const diffInHours = Math.floor(diffInMins / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div
      onClick={() => onMarkAsRead(notification.id)}
      className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">
            {studentName}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {message}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {getTimeAgo(notification.created_at)}
          </p>
        </div>
        
        {/* Unread indicator dot */}
        <div className="ml-3 mt-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full" />
        </div>
      </div>
    </div>
  );
}