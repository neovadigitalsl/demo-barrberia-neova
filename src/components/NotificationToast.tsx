import React, { useState, useEffect } from 'react';
import { AppNotification, getNotificationHistory } from '../utils/notifications';

interface NotificationToastProps {
  onOpenMyBookings?: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ onOpenMyBookings }) => {
  const [activeNotification, setActiveNotification] = useState<AppNotification | null>(null);

  useEffect(() => {
    const handleNotificationAdded = (e: Event) => {
      const customEvent = e as CustomEvent<AppNotification>;
      if (customEvent.detail) {
        setActiveNotification(customEvent.detail);
        // Auto dismiss toast after 6 seconds
        const timer = setTimeout(() => {
          setActiveNotification((prev) => (prev?.id === customEvent.detail.id ? null : prev));
        }, 6000);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('barber_notification_added', handleNotificationAdded);
    return () => {
      window.removeEventListener('barber_notification_added', handleNotificationAdded);
    };
  }, []);

  if (!activeNotification) return null;

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'confirmation':
        return 'check_circle';
      case 'reminder':
        return 'alarm';
      case 'cancellation':
        return 'cancel';
      case 'test':
        return 'notifications_active';
      default:
        return 'notifications';
    }
  };

  const getBorderColor = (type: AppNotification['type']) => {
    switch (type) {
      case 'confirmation':
        return 'border-[#ffb779] text-[#ffb779]';
      case 'reminder':
        return 'border-amber-400 text-amber-400';
      case 'cancellation':
        return 'border-rose-500 text-rose-500';
      default:
        return 'border-[#ffb779] text-[#ffb779]';
    }
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50 max-w-sm w-full animate-bounce-short">
      <div className={`bg-[#1c1b1b] border ${getBorderColor(activeNotification.type)} rounded-xl p-4 shadow-2xl flex items-start gap-3 relative backdrop-blur-md`}>
        <div className="p-2 rounded-lg bg-[#2a2827] flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-2xl">{getIcon(activeNotification.type)}</span>
        </div>

        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-serif text-sm font-bold text-[#e5e2e1] truncate">{activeNotification.title}</h4>
            <span className="text-[10px] text-[#d8c2b2]">Ahora</span>
          </div>
          <p className="font-sans text-xs text-[#d8c2b2] leading-relaxed line-clamp-3">
            {activeNotification.body}
          </p>

          {activeNotification.bookingId && onOpenMyBookings && (
            <button
              onClick={() => {
                setActiveNotification(null);
                onOpenMyBookings();
              }}
              className="mt-2 text-xs font-bold text-[#ffb779] hover:underline flex items-center gap-1"
            >
              Ver mis reservas <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </button>
          )}
        </div>

        <button
          onClick={() => setActiveNotification(null)}
          className="absolute top-2 right-2 text-[#d8c2b2] hover:text-[#e5e2e1] transition-colors p-1"
          title="Cerrar"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>
    </div>
  );
};
