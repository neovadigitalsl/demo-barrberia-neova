import React from 'react';
import { demoConfig } from '../demoConfig';

interface NavbarProps {
  onOpenBooking: () => void;
  onOpenMyBookings: () => void;
  onOpenNotifications: () => void;
  onNavigateToSection: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenBooking,
  onOpenMyBookings,
  onOpenNotifications,
  onNavigateToSection,
}) => {
  return (
    <nav className="bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-stone-200 transition-colors">
      <div className="flex justify-between items-center w-full px-6 max-w-7xl mx-auto py-3.5">
        {/* Brand Logo / Name */}
        <button
          onClick={() => onNavigateToSection('hero')}
          className="font-serif text-xl sm:text-2xl font-bold text-[#1A1A1A] tracking-tight hover:text-[#B8860B] transition-colors text-left flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-2xl text-[#B8860B]">content_cut</span>
          <span>{demoConfig.shopName}</span>
        </button>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex gap-7 items-center">
          <button
            onClick={() => onNavigateToSection('hero')}
            className="font-sans text-sm font-semibold text-[#1A1A1A] hover:text-[#B8860B] transition-colors"
          >
            Inicio
          </button>
          <button
            onClick={() => onNavigateToSection('services')}
            className="font-sans text-sm font-semibold text-stone-600 hover:text-[#B8860B] transition-colors"
          >
            Servicios
          </button>
          <button
            onClick={onOpenMyBookings}
            className="font-sans text-sm font-semibold text-stone-600 hover:text-[#B8860B] transition-colors"
          >
            Mis Reservas
          </button>
          <button
            onClick={() => onNavigateToSection('location')}
            className="font-sans text-sm font-semibold text-stone-600 hover:text-[#B8860B] transition-colors"
          >
            Horario & Ubicación
          </button>
        </div>

        {/* Action Icons & Primary CTA */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={onOpenMyBookings}
            title="Mis Reservas"
            className="text-stone-600 hover:text-[#B8860B] transition-colors p-1.5 rounded-full hover:bg-stone-100"
          >
            <span className="material-symbols-outlined text-xl sm:text-2xl">person</span>
          </button>
          
          <button
            onClick={onOpenBooking}
            className="bg-[#1A1A1A] text-white font-sans text-xs sm:text-sm uppercase font-bold tracking-wider px-5 py-2.5 rounded hover:bg-[#B8860B] transition-colors active:scale-95 duration-150 shadow-sm"
          >
            Reservar Cita
          </button>
        </div>
      </div>
    </nav>
  );
};
