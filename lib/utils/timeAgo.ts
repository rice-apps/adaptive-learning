export function timeAgo(timestamp: string | Date | null): string {
    if (!timestamp) return 'Not completed';
  
    const now = new Date();
    const completedAt = new Date(timestamp);
    const diffInMs = now.getTime() - completedAt.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
    // Less than 1 minute
    if (diffInMinutes < 1) return 'Just now';
    
    // Less than 1 hour
    if (diffInMinutes < 60) {
      return diffInMinutes === 1 ? '1 minute ago' : `${diffInMinutes} minutes ago`;
    }
  
    // Less than 24 hours
    if (diffInHours < 24) {
      return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
    }
  
    // Yesterday
    if (diffInDays === 1) return 'Yesterday';
  
    // Less than a week
    if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    }
  
    // Format as date
    return completedAt.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: completedAt.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }