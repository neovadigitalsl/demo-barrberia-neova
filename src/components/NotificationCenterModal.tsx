import React, { useState, useEffect } from 'react';
import {
  getPushPermission,
  requestPushPermission,
  sendPushNotification,
  getNotificationHistory,
  AppNotification,
  isPushSupported
} from '../utils/notifications';
import { Booking } from '../types';
import { demoConfig } from '../demoConfig';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: Booking[];
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  bookings
}) => {
  const [permissionStatus, setPermissionStatus] = useState<string>('default');
  const [history, setHistory] = useState<AppNotification[]>([]);
  const [testSuccessMessage, setTestSuccessMessage] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setPermissionStatus(getPushPermission());
      setHistory(getNotificationHistory());
    }
  }, [isOpen]);

  useEffect(() => {
    const handleUpdate = () => {
      setHistory(getNotificationHistory());
    };
    window.addEventListener('barber_notification_added', handleUpdate);
    return () => window.removeEventListener('barber_notification_added', handleUpdate);
  }, []);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const status = await requestPushPermission();
    setPermissionStatus(status);
    setHistory(getNotificationHistory());
    if (status === 'granted') {
      setTestSuccessMessage('¡Permiso concedido! Las notificaciones push del navegador están activas.');
      setTimeout(() => setTestSuccessMessage(''), 4000);
    }
  };

  const handleSendTestPush = () => {
    sendPushNotification(
      `💈 Recordatorio - ${demoConfig.shopName}`,
      '¡Avisos funcionando correctamente! Recibirás recordatorios previos a tu turno.',
      'test'
    );
    setTestSuccessMessage('Notificación de prueba enviada.');
    setTimeout(() => setTestSuccessMessage(''), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white border border-stone-200 rounded-2xl w-full max-w-xl text-[#1A1A1A] p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-500 hover:text-[#1A1A1A] p-1.5 rounded-full hover:bg-stone-100 transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <span className="text-xs uppercase tracking-widest text-[#B8860B] font-bold block mb-1">
          Avisos & Alertas
        </span>
        <h2 className="font-serif text-2xl text-[#1A1A1A] font-bold mb-1">
          Centro de Notificaciones
        </h2>
        <p className="font-sans text-xs text-stone-500 mb-6">
          Gestiona tus permisos de alertas para no olvidar ninguna cita en {demoConfig.shopName}.
        </p>

        {testSuccessMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs text-center font-sans font-medium">
            {testSuccessMessage}
          </div>
        )}

        {/* Push Permission Status Card */}
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#B8860B] text-xl">notifications_active</span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                Estado de Notificaciones
              </span>
            </div>
            <span
              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                permissionStatus === 'granted'
                  ? 'bg-emerald-100 text-emerald-800'
                  : permissionStatus === 'denied'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {permissionStatus === 'granted' ? 'Activado' : permissionStatus === 'denied' ? 'Bloqueado' : 'Pendiente'}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {permissionStatus !== 'granted' && isPushSupported() && (
              <button
                onClick={handleRequestPermission}
                className="bg-[#1A1A1A] hover:bg-[#B8860B] text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-xs active:scale-95"
              >
                Permitir Notificaciones
              </button>
            )}

            {permissionStatus === 'granted' && (
              <button
                onClick={handleSendTestPush}
                className="bg-white border border-stone-300 hover:border-stone-400 text-stone-700 text-xs font-medium px-4 py-2 rounded-lg transition-colors shadow-xs active:scale-95"
              >
                Enviar Notificación de Prueba
              </button>
            )}
          </div>
        </div>

        {/* History of recent notifications */}
        <h3 className="font-serif font-bold text-sm text-[#1A1A1A] mb-3 border-b border-stone-200 pb-2">
          Historial de Avisos
        </h3>

        <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
          {history.length === 0 ? (
            <p className="text-xs text-stone-400 italic text-center py-6">
              Aún no tienes notificaciones recientes.
            </p>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-xs flex justify-between items-start gap-3"
              >
                <div>
                  <strong className="text-[#1A1A1A] block">{item.title}</strong>
                  <p className="text-stone-600 mt-0.5">{item.message}</p>
                </div>
                <span className="text-[10px] text-stone-400 shrink-0">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
