import { vendorService, type Notification } from '../vendors/services/vendor.service';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import React, { useEffect, useState } from 'react';

const TYPE_LABELS: Record<string, string> = {
  vendor_approved: 'Vendor Approved',
  vendor_revoked: 'Vendor Revoked',
  vendor_registered: 'New Registration',
};

const TYPE_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive'> = {
  vendor_approved: 'default',
  vendor_revoked: 'destructive',
  vendor_registered: 'secondary',
};

export const AdminNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await vendorService.getNotifications();
        setNotifications(data);
      } catch {
        console.error('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };
    load();

    // mark all as read when page opens
    vendorService.markNotificationsRead();
  }, []);

  return (
    <div className="px-1 w-full">
      <main className="flex flex-col w-full gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => vendorService.markNotificationsRead()}
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark all read
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <div className="w-4 h-4 rounded-full border-2 border-foreground border-t-transparent animate-spin" />
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <Bell className="w-10 h-10" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
                  !n.is_read
                    ? 'border-neutral-600 bg-neutral-800/50'
                    : 'border-neutral-800 bg-transparent'
                }`}
              >
                <div className="flex flex-col flex-1 gap-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={TYPE_VARIANTS[n.type] ?? 'secondary'} className="text-xs">
                      {TYPE_LABELS[n.type] ?? n.type}
                    </Badge>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-white">{n.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};