import { useAuth } from "@/contexts/AuthContext";
import { mockNotifications } from "@/data/mock-notifications";
import { Link } from "react-router-dom";
import { Bell, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertTriangle,
};

const colorMap = {
  info: "text-primary",
  success: "text-success",
  warning: "text-warning",
  error: "text-destructive",
};

const NotificationsPage = () => {
  const { user } = useAuth();
  const notifications = mockNotifications.filter((n) => n.userId === user?.id);

  return (
    <div className="civic-container civic-section">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-h2 text-foreground">Notifications</h1>
        <p className="mb-8 text-body text-muted-foreground">
          Stay updated on your reported issues.
        </p>

        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((n) => {
              const Icon = iconMap[n.type];
              return (
                <div
                  key={n.id}
                  className={cn(
                    "flex gap-3 rounded-xl border bg-card p-4",
                    !n.read && "bg-accent/20"
                  )}
                >
                  <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", colorMap[n.type])} />
                  <div className="flex-1">
                    <p className="text-body font-medium text-foreground">{n.title}</p>
                    <p className="text-caption text-muted-foreground">{n.message}</p>
                    <p className="mt-1 text-label text-muted-foreground">
                      {new Date(n.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {!n.read && (
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border bg-card py-16 text-center">
            <Bell className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-body text-muted-foreground">No notifications yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
