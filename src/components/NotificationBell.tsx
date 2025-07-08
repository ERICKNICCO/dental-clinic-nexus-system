import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, loading, markAsRead } = useNotifications();
  const [previousCount, setPreviousCount] = useState(0);
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Play sound when new notifications arrive
  useEffect(() => {
    if (unreadCount > previousCount) {
      // Play notification sound
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSqHzPHZiTgIH2m98OScTg0PUarm7blmJwNHkdn25nwlByhzy+vYgTUFJXbH8N+TQgoUXbPm69BOFQlCmN3zy3kiCC2HzPLaiToIG2m98OKbTAwNUanl9L1oKwJFk9nz4HcmBSlxzuzbfjMGK3nH8t6TSA0VXLLq7sxKFgZAnNvxz3kjBjCHy/LXizEHLnDE8OOTSA0SXrPo7MFOGgNBmdz0zm4iCjOIyPLZjDIIH2u87+OScR4KS6Xl9rteLwoEeJa/8tiaQwwPWar17MdBFhEOUKXj9L1jIQgzd8b20nAhCCN5yeyEURMCKW+7+9+LNCEOJnPL8sZ1IQo3fMb00m4iCjOIy/LajDMHLWy89OENeQUOJnPL8sZ1IQo3fMb00m4iCjOIy/LajDMHLWy89OGHS0UFBjWQyPPXgSMGNXzJ8OB7OgUOMWm49eOKQxEONnLG+Mpvew==');
      audio.play().catch(e => console.log('Could not play notification sound:', e));
    }
    setPreviousCount(unreadCount);
  }, [unreadCount, previousCount]);

  const handleNotificationClick = async (notificationId: string) => {
    await markAsRead(notificationId);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center animate-pulse"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        {loading ? (
          <DropdownMenuItem disabled>Loading notifications...</DropdownMenuItem>
        ) : notifications.length === 0 ? (
          <DropdownMenuItem disabled>No notifications</DropdownMenuItem>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              onClick={() => handleNotificationClick(notification.id)}
              className={cn(
                'flex flex-col items-start gap-1 py-2',
                !notification.read && 'bg-muted/50'
              )}
            >
              <div className="font-medium">{notification.title}</div>
              <div className="text-sm text-muted-foreground">
                {notification.message}
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(notification.timestamp).toLocaleString()}
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
