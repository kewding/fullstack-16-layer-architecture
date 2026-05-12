import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import {
  ArrowDownLeft,
  Bell,
  CheckCheck,
  CheckCircle2,
  Loader2,
  ShoppingBag,
  XCircle,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  topUpRequestService,
  type UserNotification,
  type UserNotificationType,
} from './services/notification.service';

// ── per-type config ───────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  UserNotificationType,
  { label: string; icon: React.ReactNode; badgeClass: string }
> = {
  topup_accepted: {
    label: 'Top-Up Accepted',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  },
  topup_rejected: {
    label: 'Top-Up Rejected',
    icon: <XCircle className="w-4 h-4 text-red-400" />,
    badgeClass: 'bg-red-500/10 text-red-400 border-red-500/30',
  },
  purchase: {
    label: 'Purchase',
    icon: <ShoppingBag className="w-4 h-4 text-blue-400" />,
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  },
  withdrawal_accepted: {
    label: 'Withdrawal Completed',
    icon: <ArrowDownLeft className="w-4 h-4 text-emerald-400" />,
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  },
  withdrawal_rejected: {
    label: 'Withdrawal Rejected',
    icon: <XCircle className="w-4 h-4 text-red-400" />,
    badgeClass: 'bg-red-500/10 text-red-400 border-red-500/30',
  },
};

// fallback for any future unknown type
const FALLBACK_CONFIG = {
  label: 'Notification',
  icon: <Bell className="w-4 h-4 text-neutral-400" />,
  badgeClass: 'bg-neutral-700 text-neutral-300 border-neutral-600',
};

function fmtDate(iso: string) {
  return format(new Date(iso), 'MMM d, yyyy · h:mm a');
}

// ── page ──────────────────────────────────────────────────────────────────────

export const UserNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await topUpRequestService.getUserNotifications();
      setNotifications(data);
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Mark all as read when the page mounts
    topUpRequestService.markUserNotificationsRead().catch(() => {});
  }, []);

  const handleMarkRead = async () => {
    await topUpRequestService.markUserNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  return (
    <div className="px-1 w-full">
      <main className="flex flex-col w-full gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <Button variant="outline" size="sm" onClick={handleMarkRead}>
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark all read
          </Button>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center gap-2 text-neutral-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading…
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-neutral-500">
            <Bell className="w-10 h-10" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {notifications.map((n) => {
              const cfg = TYPE_CONFIG[n.type] ?? FALLBACK_CONFIG;
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
                    !n.is_read
                      ? 'border-neutral-600 bg-neutral-800/50'
                      : 'border-neutral-800 bg-transparent'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{cfg.icon}</div>
                  <div className="flex flex-col flex-1 gap-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.badgeClass}`}
                      >
                        {cfg.label}
                      </span>
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />}
                    </div>
                    <p className="text-sm text-white">{n.message}</p>
                    <p className="text-xs text-neutral-500">{fmtDate(n.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

//TODO might be a problem
