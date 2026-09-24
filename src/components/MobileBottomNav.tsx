import React from 'react';

interface MobileBottomNavProps {
  onOpenBooking: () => void;
  onOpenMyBookings: () => void;
  onOpenNotifications: () => void;
  onNavigateToSection: (sectionId: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onOpenBooking,
  onOpenMyBookings,
  onOpenNotifications,
  onNavigateToSection,
}) => {
  return (
    <nav className="fixed bottom-0 w-full bg-white/95 backdrop-blur-md border-t border-stone-200 flex justify-around items-center h-16 md:hidden z-40 px-1 pb-safe shadow-lg">
      <button
        onClick={() => onNavigateToSection('hero')}
        className="flex flex-col items-center justify-center w-full h-full text-[#1A1A1A] hover:text-[#B8860B] active:scale-95 transition-transform"
      >
        <span className="material-symbols-outlined text-xl">home</span>
        <span className="font-sans text-[10px] mt-0.5 font-medium">Inicio</span>
      </button>

      <button
        onClick={() => onNavigateToSection('services')}
        className="flex flex-col items-center justify-center w-full h-full text-stone-600 hover:text-[#B8860B] active:scale-95 transition-transform"
      >
        <span className="material-symbols-outlined text-xl">content_cut</span>
        <span className="font-sans text-[10px] mt-0.5 font-medium">Servicios</span>
      </button>

      <button
        onClick={onOpenBooking}
        className="flex flex-col items-center justify-center w-full h-full text-[#B8860B] active:scale-95 transition-transform font-bold"
      >
        <div className="w-9 h-9 bg-[#1A1A1A] rounded-full flex items-center justify-center text-white shadow-sm hover:bg-[#B8860B] transition-colors">
          <span className="material-symbols-outlined text-lg">event</span>
        </div>
        <span className="font-sans text-[10px] mt-0.5 font-semibold text-[#1A1A1A]">Reservar</span>
      </button>

      <button
        onClick={onOpenNotifications}
        className="flex flex-col items-center justify-center w-full h-full text-stone-600 hover:text-[#B8860B] active:scale-95 transition-transform relative"
      >
        <span className="material-symbols-outlined text-xl">notifications</span>
        <span className="font-sans text-[10px] mt-0.5 font-medium">Avisos</span>
      </button>

      <button
        onClick={onOpenMyBookings}
        className="flex flex-col items-center justify-center w-full h-full text-stone-600 hover:text-[#B8860B] active:scale-95 transition-transform"
      >
        <span className="material-symbols-outlined text-xl">person</span>
        <span className="font-sans text-[10px] mt-0.5 font-medium">Mis Citas</span>
      </button>
    </nav>
  );
};
