import { useState, useEffect } from "react";
import { Bell, X, Check, AlertCircle, Trophy, Calendar, Users, Shield, Heart, Clipboard, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notificationAPI, Notification } from "@/services/api";
import { toast } from "sonner";
import { getNotificationIcon, getNotificationColor } from "@/utils/notificationUtils";

export const CoachNotifications = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getNotifications();
      if (response.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(notifications.map(n => 
        n._id === id ? { ...n, read: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      toast.error("Failed to mark notification as read");
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      toast.error("Failed to mark all notifications as read");
      console.error("Error marking all notifications as read:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await notificationAPI.deleteNotification(id);
      const notification = notifications.find(n => n._id === id);
      setNotifications(notifications.filter(n => n._id !== id));
      if (notification && !notification.read) {
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      toast.error("Failed to delete notification");
      console.error("Error deleting notification:", error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 rounded-full bg-card/95 backdrop-blur-xl border border-border hover:bg-accent transition-all shadow-lg hover:shadow-xl"
      >
        <Bell className="h-5 w-5 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full text-white text-xs flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          ></div>
          <Card className="absolute right-0 mt-2 w-96 max-h-[600px] overflow-hidden z-50 glass-card border-2 animate-slide-up">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-border sticky top-0 bg-card/95 backdrop-blur-xl z-10">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Clipboard className="h-5 w-5 text-purple-600" />
                Coach Notifications
              </CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    Mark all read
                  </Button>
                )}
                <button onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto max-h-[500px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notif) => {
                    const Icon = getNotificationIcon(notif.type);
                    const color = getNotificationColor(notif.type);
                    return (
                      <div
                        key={notif._id}
                        className={`p-4 hover:bg-muted/50 transition-colors ${notif.read ? '' : 'bg-purple-500/5'}`}
                      >
                        <div className="flex gap-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-br from-${color}-500/10 to-${color}-600/10 h-fit`}>
                            <Icon className={`h-4 w-4 text-${color}-600`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-semibold text-sm">{notif.title}</h4>
                              {!notif.read && (
                                <div className="w-2 h-2 rounded-full bg-purple-600 flex-shrink-0 mt-1"></div>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-muted-foreground">{notif.time}</span>
                              <div className="flex gap-1">
                                {!notif.read && (
                                  <button
                                    onClick={() => markAsRead(notif._id)}
                                    className="text-xs px-2 py-1 rounded bg-purple-500/10 text-purple-600 hover:bg-purple-500/20"
                                  >
                                    <Check className="h-3 w-3" />
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteNotification(notif._id)}
                                  className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-600 hover:bg-red-500/20"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
export default CoachNotifications;