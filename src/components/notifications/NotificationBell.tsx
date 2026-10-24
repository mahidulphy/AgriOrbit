import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bell, CheckCheck, AlertTriangle, AlertCircle, Info, ExternalLink, X } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../lang';
import type { AlertNotification, AlertSeverity } from '../../types';

interface NotificationBellProps {
  className?: string;
  compact?: boolean;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ className = '', compact = false }) => {
  const { user, isGuest } = useAuth();
  const { lang } = useLang();
  const isBn = lang === 'bn';

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications from Supabase
  const fetchNotifications = async () => {
    if (!user || isGuest || !isSupabaseConfigured()) {
      setNotifications([]);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (!error && data) {
        setNotifications(data as AlertNotification[]);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const handleRefresh = () => {
      fetchNotifications();
    };
    window.addEventListener('agriorbit:refresh-notifications', handleRefresh);

    // Periodic check every 2 minutes
    const interval = setInterval(fetchNotifications, 120000);
    return () => {
      window.removeEventListener('agriorbit:refresh-notifications', handleRefresh);
      clearInterval(interval);
    };
  }, [user?.id, isGuest]);

  // Recalculate button coordinates when toggling
  const handleToggle = () => {
    if (buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect());
    }
    setIsOpen((prev) => !prev);
  };

  // Close dropdown on click outside or ESC
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      const nowIso = new Date().toISOString();
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: nowIso } : n)),
      );

      await supabase
        .from('notifications')
        .update({ read_at: nowIso })
        .eq('id', id);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || markingAll || !user) return;
    try {
      setMarkingAll(true);
      const nowIso = new Date().toISOString();
      const unreadIds = notifications.filter((n) => !n.read_at).map((n) => n.id);

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at || nowIso })),
      );

      if (unreadIds.length > 0) {
        await supabase
          .from('notifications')
          .update({ read_at: nowIso })
          .in('id', unreadIds);
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'danger':
        return {
          icon: <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />,
          border: 'border-red-500/30',
          bg: 'bg-red-950/20',
          badge: 'bg-red-500/20 text-red-300 border-red-500/40',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
          border: 'border-amber-500/30',
          bg: 'bg-amber-950/20',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        };
      default:
        return {
          icon: <Info className="w-4 h-4 text-[#00E5FF] shrink-0" />,
          border: 'border-cyan-500/30',
          bg: 'bg-cyan-950/20',
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        };
    }
  };

  const dropdownContent = isOpen && (
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: buttonRect ? Math.min(window.innerHeight - 450, buttonRect.bottom + 8) : 64,
        right: buttonRect ? Math.max(12, window.innerWidth - buttonRect.right) : 16,
        zIndex: 99999,
      }}
      className="w-[92vw] sm:w-[420px] max-h-[85vh] flex flex-col rounded-2xl bg-[#070D18]/98 backdrop-blur-xl border border-white/15 shadow-2xl shadow-black/80 text-white animate-fadeIn overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-[#0B1626]/90 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#B8FF3D]" />
          <h3 className="font-display font-bold text-sm tracking-tight text-white">
            {isBn ? 'কৃষি ও আবহাওয়া সতর্কতা' : 'Field Alerts & Advisories'}
          </h3>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-[#B8FF3D] text-[#050B14] font-mono text-[10px] font-bold">
              {unreadCount} {isBn ? 'নতুন' : 'new'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markingAll}
              className="text-[11px] font-mono text-[#00E5FF] hover:text-[#00E5FF]/80 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>{isBn ? 'সবগুলো পঠিত' : 'Mark all read'}</span>
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List Body */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5 p-3 space-y-2.5">
        {loading && notifications.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-slate-400">
            {isBn ? 'সতর্কতা লোড হচ্ছে...' : 'Loading notifications...'}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
              <CheckCheck className="w-5 h-5 text-[#B8FF3D]" />
            </div>
            <p className="text-sm font-semibold text-slate-200">
              {isBn ? 'এখন কোনো সতর্কতা নেই' : 'No alerts right now'}
            </p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              {isBn
                ? 'আপনার মাঠের তাপমাত্রা, বৃষ্টিপাত ও মাটির রস স্বাভাবিক অবস্থায় রয়েছে।'
                : 'Your field environmental conditions (temperature, rain, soil moisture) are within safe parameters.'}
            </p>
          </div>
        ) : (
          notifications.map((n) => {
            const style = getSeverityBadge(n.severity);
            const isUnread = !n.read_at;

            return (
              <div
                key={n.id}
                onClick={() => isUnread && handleMarkAsRead(n.id)}
                className={`p-3.5 rounded-xl border transition-all ${style.bg} ${style.border} ${
                  isUnread ? 'cursor-pointer hover:border-white/30' : 'opacity-85'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    {style.icon}
                    {n.alert_type === 'test' ? (
                      <span className="text-[10px] font-mono uppercase font-bold px-1.5 py-0.5 rounded border bg-slate-800/80 text-slate-300 border-slate-600 shadow-sm">
                        TEST
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] font-mono uppercase font-bold px-1.5 py-0.5 rounded border ${style.badge}`}
                      >
                        {n.severity}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-slate-400">
                      {n.data_source}
                    </span>
                  </div>
                  {isUnread && (
                    <span className="w-2 h-2 rounded-full bg-[#B8FF3D] shrink-0" title="Unread" />
                  )}
                </div>

                <h4 className="text-xs font-bold text-white mb-1">
                  {isBn ? n.title_bn : n.title_en}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-2">
                  {isBn ? n.body_bn : n.body_en}
                </p>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1.5 border-t border-white/5">
                  <span>{isBn ? 'উপাত্ত তারিখ:' : 'Observed:'} {n.data_date}</span>
                  {isUnread && (
                    <span className="text-[#B8FF3D] text-[10px]">
                      {isBn ? 'পঠিত চিহ্নিত করতে ক্লিক করুন' : 'Click to mark read'}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 bg-[#050B14] border-t border-white/10 text-center text-[10px] font-mono text-slate-400">
        <span>AgriOrbit Rule-Based System · NASA POWER & Open-Meteo</span>
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        aria-label="Alerts"
        className={`relative p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center ${className}`}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-black font-mono text-[10px] font-bold flex items-center justify-center shadow-lg shadow-amber-400/30">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {typeof document !== 'undefined' && dropdownContent && createPortal(dropdownContent, document.body)}
    </>
  );
};
