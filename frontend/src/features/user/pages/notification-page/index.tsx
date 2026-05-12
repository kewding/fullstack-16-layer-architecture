import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Loader2,
  ShoppingBag,
  XCircle,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { topUpRequestService, type UserNotification } from './services/notification.service';

// ── Per-type config ───────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<
  string,
  {
    label: string;
    icon: React.ElementType;
    dot: string;
    badge: string;
    iconBg: string;
    iconColor: string;
  }
> = {
  topup_accepted: {
    label: 'Top-Up Accepted',
    icon: CheckCircle2,
    dot: 'bg-[#3f6f64]',
    badge: 'bg-[#d6ede9] text-[#3f6f64]',
    iconBg: 'bg-[#d6ede9]',
    iconColor: 'text-[#3f6f64]',
  },

  topup_rejected: {
    label: 'Top-Up Rejected',
    icon: XCircle,
    dot: 'bg-red-500',
    badge: 'bg-red-100 text-red-700',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
  },

  purchase: {
    label: 'Purchase',
    icon: ShoppingBag,
    dot: 'bg-[#3b82f6]',
    badge: 'bg-blue-100 text-blue-700',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
};

const FALLBACK_CONFIG = {
  label: 'Notification',
  icon: Bell,
  dot: 'bg-[#3f6f64]',
  badge: 'bg-[#d6ede9] text-[#3f6f64]',
  iconBg: 'bg-[#d6ede9]',
  iconColor: 'text-[#3f6f64]',
};

function formatDate(iso: string) {
  return format(new Date(iso), 'MMM d, yyyy • h:mm a');
}

// ── Page ──────────────────────────────────────────────────────────────────────

export const UserNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await topUpRequestService.getUserNotifications();
      setNotifications(data);
    } catch {
      console.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();

    // Mark as read on mount
    topUpRequestService.markUserNotificationsRead().catch(() => {});
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkRead = async () => {
    try {
      await topUpRequestService.markUserNotificationsRead();

      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          is_read: true,
        })),
      );
    } catch {
      console.error('Failed to mark notifications as read');
    }
  };

  return (
    <div className="px-1 w-full">
      <main className="flex flex-col w-full gap-4">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">
              Notifications
            </h1>

            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#cd9a34] text-white">
                {unreadCount} new
              </span>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkRead}
            className="border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] text-xs"
          >
            <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
            Mark all read
          </Button>
        </div>

        {/* ── States ── */}
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-8">
            <Loader2 className="w-4 h-4 animate-spin text-[#3f6f64]" />
            Loading notifications…
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
            <div className="w-14 h-14 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center">
              <Bell className="w-6 h-6 text-[#3f6f64]" />
            </div>

            <p className="text-sm font-medium text-[hsl(var(--foreground))]">
              You're all caught up
            </p>

            <p className="text-xs text-muted-foreground">
              No notifications yet.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {notifications.map((n) => {
              const cfg = TYPE_CONFIG[n.type] ?? FALLBACK_CONFIG;
              const Icon = cfg.icon;

              return (
                <div
                  key={n.id}
                  className={`
                    flex items-start gap-4 p-4 rounded-xl border transition-colors
                    ${
                      !n.is_read
                        ? 'border-[hsl(var(--border))] bg-white shadow-sm'
                        : 'border-transparent bg-white/50'
                    }
                  `}
                >
                  {/* Icon */}
                  <div
                    className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center mt-0.5 ${cfg.iconBg}`}
                  >
                    <Icon className={`w-4 h-4 ${cfg.iconColor}`} />
                  </div>

                  {/* Content */}
                  <div className="flex flex-col flex-1 gap-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${cfg.badge}`}
                      >
                        {cfg.label}
                      </span>

                      {!n.is_read && (
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`}
                        />
                      )}
                    </div>

                    <p className="text-sm text-[hsl(var(--foreground))] leading-snug">
                      {n.message}
                    </p>

                    <p className="text-[11px] text-muted-foreground">
                      {formatDate(n.created_at)}
                    </p>
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