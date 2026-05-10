import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  CheckCircle,
  CircleDollarSign,
  Clock,
  Info,
  ShieldCheck,
  ShieldX,
  UserPlus,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { vendorService, type Notification } from '../vendors/services/vendor.service';

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
  // ── Vendor lifecycle ──────────────────────────────────────────────────────
  vendor_approved: {
    label: 'Vendor Approved',
    icon: ShieldCheck,
    dot: 'bg-[#3f6f64]',
    badge: 'bg-[#d6ede9] text-[#3f6f64]',
    iconBg: 'bg-[#d6ede9]',
    iconColor: 'text-[#3f6f64]',
  },
  vendor_revoked: {
    label: 'Vendor Revoked',
    icon: ShieldX,
    dot: 'bg-red-500',
    badge: 'bg-red-100 text-red-700',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
  },
  vendor_registered: {
    label: 'New Registration',
    icon: UserPlus,
    dot: 'bg-[#cd9a34]',
    badge: 'bg-[#fdf3de] text-[#a07520]',
    iconBg: 'bg-[#fdf3de]',
    iconColor: 'text-[#cd9a34]',
  },

  // ── Fee reminders ─────────────────────────────────────────────────────────
  fee_edit_open: {
    label: 'Fees Open for Editing',
    icon: CheckCircle,
    dot: 'bg-[#3f6f64]',
    badge: 'bg-[#d6ede9] text-[#3f6f64]',
    iconBg: 'bg-[#d6ede9]',
    iconColor: 'text-[#3f6f64]',
  },
  fee_reminder: {
    label: 'Fee Reminder — 15 Days',
    icon: Clock,
    dot: 'bg-[#cd9a34]',
    badge: 'bg-[#fdf3de] text-[#a07520]',
    iconBg: 'bg-[#fdf3de]',
    iconColor: 'text-[#cd9a34]',
  },
  fee_reminder_7day: {
    label: 'Fee Reminder — 7 Days',
    icon: Clock,
    dot: 'bg-orange-400',
    badge: 'bg-orange-100 text-orange-700',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-500',
  },
  fee_reminder_3day: {
    label: 'Fee Reminder — 3 Days',
    icon: AlertTriangle,
    dot: 'bg-red-500',
    badge: 'bg-red-100 text-red-700',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
  },

  // ── Fee changes ───────────────────────────────────────────────────────────
  fee_updated: {
    label: 'Fee Updated',
    icon: CircleDollarSign,
    dot: 'bg-[#3f6f64]',
    badge: 'bg-[#d6ede9] text-[#3f6f64]',
    iconBg: 'bg-[#d6ede9]',
    iconColor: 'text-[#3f6f64]',
  },

  // ── System ────────────────────────────────────────────────────────────────
  system_info: {
    label: 'System',
    icon: Info,
    dot: 'bg-slate-400',
    badge: 'bg-slate-100 text-slate-600',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-500',
  },
  system_alert: {
    label: 'System Alert',
    icon: AlertTriangle,
    dot: 'bg-red-500',
    badge: 'bg-red-100 text-red-700',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
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
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

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
    vendorService.markNotificationsRead();
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="px-1 w-full">
      <main className="flex flex-col w-full gap-4">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">Notifications</h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#cd9a34] text-white">
                {unreadCount} new
              </span>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] text-xs"
            onClick={() => vendorService.markNotificationsRead()}
          >
            <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
            Mark all read
          </Button>
        </div>

        {/* ── States ── */}
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-8">
            <div className="w-4 h-4 rounded-full border-2 border-[#3f6f64] border-t-transparent animate-spin" />
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
            <p className="text-xs text-muted-foreground">No notifications yet.</p>
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
                  {/* Icon circle */}
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
                        <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                      )}
                    </div>
                    <p className="text-sm text-[hsl(var(--foreground))] leading-snug">
                      {n.message}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{formatDate(n.created_at)}</p>
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
