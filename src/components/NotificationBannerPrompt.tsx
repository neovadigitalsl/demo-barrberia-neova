import React, { useState, useEffect } from 'react';
import { getPushPermission, requestPushPermission, isPushSupported } from '../utils/notifications';

export const NotificationBannerPrompt: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    if (isPushSupported() && getPushPermission() === 'default') {
      // Show prompt after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnable = async () => {
    await requestPushPermission();
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="bg-white border-b border-stone-200 text-[#1A1A1A] px-4 py-2.5 text-xs relative z-40 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#B8860B] text-base shrink-0">notifications_active</span>
          <p className="text-center sm:text-left">
            <span className="font-bold text-[#1A1A1A]">Recordatorios de Citas:</span> Activa las notificaciones en tu navegador para recibir avisos de confirmación y recordatorios de tu sesión en The Arsenal Barber Co.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleEnable}
            className="bg-[#1A1A1A] hover:bg-[#B8860B] text-white font-bold px-3.5 py-1.5 rounded text-[11px] uppercase tracking-wider transition-colors shadow-xs"
          >
            Activar Avisos
          </button>
          <button
            onClick={handleDismiss}
            className="text-stone-500 hover:text-[#1A1A1A] px-2 py-1 text-[11px] uppercase font-medium"
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
};
