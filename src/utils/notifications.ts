import { Booking } from '../types';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  type: 'confirmation' | 'reminder' | 'cancellation' | 'test' | 'system';
  bookingId?: string;
  read?: boolean;
}

const STORAGE_KEY_PERM_PROMPTED = 'barber_push_prompted';
const STORAGE_KEY_HISTORY = 'barber_notification_history';
const STORAGE_KEY_SENT_REMINDERS = 'barber_sent_reminders';

// Soft audio chime using Web Audio API
export function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (err) {
    // Ignore audio autoplay restrictions gracefully
  }
}

export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getPushPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestPushPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isPushSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    localStorage.setItem(STORAGE_KEY_PERM_PROMPTED, 'true');
    if (permission === 'granted') {
      sendPushNotification(
        '¡Notificaciones Activadas!',
        'Te avisaremos cuando tu cita sea confirmada y te enviaremos recordatorios de tu horario.',
        'system'
      );
    }
    return permission;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return 'denied';
  }
}

export function getNotificationHistory(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveNotificationToHistory(notification: AppNotification) {
  try {
    const current = getNotificationHistory();
    const updated = [notification, ...current.slice(0, 49)]; // Keep latest 50
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
    // Dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent('barber_notification_added', { detail: notification }));
  } catch (err) {
    console.error('Failed to save notification history:', err);
  }
}

export function sendPushNotification(
  title: string,
  body: string,
  type: AppNotification['type'] = 'system',
  bookingId?: string
): AppNotification {
  const newNotif: AppNotification = {
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title,
    body,
    timestamp: new Date().toISOString(),
    type,
    bookingId,
    read: false
  };

  // Save to in-app notification history
  saveNotificationToHistory(newNotif);

  // Play audio tone
  playNotificationChime();

  // Trigger Native Browser Push Notification if permission granted
  if (isPushSupported() && Notification.permission === 'granted') {
    try {
      const nativeNotif = new Notification(title, {
        body,
        icon: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=150&auto=format&fit=crop&q=80',
        tag: newNotif.id,
        badge: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=150&auto=format&fit=crop&q=80',
      });

      nativeNotif.onclick = () => {
        window.focus();
        nativeNotif.close();
      };
    } catch (err) {
      console.warn('Native notification failed, fallback to in-app toast:', err);
    }
  }

  return newNotif;
}

// Helper 1: Cita confirmada
export function notifyBookingConfirmed(booking: Booking) {
  const title = '💈 ¡Cita Confirmada!';
  const body = `Tu cita para "${booking.serviceName}" con ${booking.barberName} el ${booking.date} a las ${booking.time} hs ha sido confirmada.`;
  sendPushNotification(title, body, 'confirmation', booking.id);
}

// Helper 2: Cita cancelada
export function notifyBookingCancelled(booking: Booking) {
  const title = '❌ Reserva Cancelada';
  const body = `La cita para "${booking.serviceName}" del ${booking.date} a las ${booking.time} hs ha sido cancelada.`;
  sendPushNotification(title, body, 'cancellation', booking.id);
}

// Helper 3: Recordatorio de cita próxima
export function notifyBookingReminder(booking: Booking, timeWindow: string) {
  const title = `⏰ Recordatorio de Cita (${timeWindow})`;
  const body = `Te recordamos tu cita de "${booking.serviceName}" con ${booking.barberName} hoy a las ${booking.time} hs en Sergio Márquez Barber.`;
  sendPushNotification(title, body, 'reminder', booking.id);
}

// Helper 4: Check upcoming bookings and trigger automatic push notifications
export function checkAndTriggerUpcomingReminders(bookings: Booking[]) {
  if (!bookings || bookings.length === 0) return;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  let sentReminders: string[] = [];
  try {
    sentReminders = JSON.parse(localStorage.getItem(STORAGE_KEY_SENT_REMINDERS) || '[]');
  } catch {
    sentReminders = [];
  }

  bookings.forEach((b) => {
    if (b.status !== 'confirmed') return;

    // Parse booking time
    const [hStr, mStr] = b.time.split(':');
    const bookingMinutes = parseInt(hStr, 10) * 60 + parseInt(mStr, 10);
    const diffMinutes = bookingMinutes - currentMinutes;

    // If booking is today and within 60 minutes and hasn't sent reminder yet
    if (b.date === todayStr && diffMinutes > 0 && diffMinutes <= 120) {
      const reminderKey = `reminder-1h-${b.id}`;
      if (!sentReminders.includes(reminderKey)) {
        notifyBookingReminder(b, '¡En menos de 2 horas!');
        sentReminders.push(reminderKey);
        localStorage.setItem(STORAGE_KEY_SENT_REMINDERS, JSON.stringify(sentReminders));
      }
    }
  });
}
