import React from 'react';
import { demoConfig } from '../demoConfig';

interface HeroSectionProps {
  onOpenBooking: () => void;
  onNavigateToServices: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenBooking,
  onNavigateToServices,
}) => {
  return (
    <section id="hero" className="relative min-h-[70vh] flex items-center justify-center py-16 px-6 overflow-hidden bg-[#F8F9FA] border-b border-stone-200">
      <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left Column Text & Branding */}
        <div className="flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 self-start bg-white border border-stone-300 px-3.5 py-1.5 rounded-full shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#B8860B]" />
            <span className="font-sans text-xs uppercase font-bold tracking-widest text-[#1A1A1A]">
              Barbería Tradicional & Moderna
            </span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#1A1A1A] font-bold leading-tight tracking-tight">
            {demoConfig.shopName}
          </h1>

          <p className="font-sans text-lg text-stone-600 max-w-lg leading-relaxed">
            {demoConfig.description} Un corte cuidado, afeitados con toallas calientes y estilismo personalizado de la mano de <strong className="text-[#1A1A1A] font-semibold">Alejandro y David</strong>.
          </p>

          <div className="pt-2 flex flex-wrap gap-4">
            <button
              onClick={onOpenBooking}
              className="bg-[#1A1A1A] text-white font-sans text-sm px-8 py-3.5 rounded uppercase font-bold tracking-widest hover:bg-[#B8860B] transition-all shadow-[0_4px_14px_0_rgba(0,0,0,0.15)] hover:shadow-[0_6px_20px_rgba(184,134,11,0.25)] hover:-translate-y-0.5 active:translate-y-0 duration-200"
            >
              Reservar Cita
            </button>
            <button
              onClick={onNavigateToServices}
              className="bg-white text-[#1A1A1A] font-sans text-sm px-8 py-3.5 rounded border border-stone-300 hover:border-[#B8860B] hover:text-[#B8860B] transition-colors uppercase font-bold tracking-widest shadow-sm"
            >
              Ver Servicios
            </button>
          </div>

          <div className="pt-4 flex items-center gap-8 border-t border-stone-200 text-xs text-stone-500">
            <div>
              <span className="font-bold text-[#1A1A1A] text-sm block">4.9 / 5.0</span>
              <span>Opiniones Verificadas</span>
            </div>
            <div className="w-px h-8 bg-stone-200" />
            <div>
              <span className="font-bold text-[#1A1A1A] text-sm block">Alejandro & David</span>
              <span>Barberos Titulados</span>
            </div>
            <div className="w-px h-8 bg-stone-200" />
            <div>
              <span className="font-bold text-[#1A1A1A] text-sm block">100% Satisfacción</span>
              <span>Precisión y Calidad</span>
            </div>
          </div>
        </div>

        {/* Right Column Image Feature */}
        <div className="flex justify-center md:justify-end relative">
          <div className="relative w-full max-w-md aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border border-stone-200 group">
            <img
              src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80"
              alt="The Arsenal Barber Co. Interior"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <span className="text-xs uppercase tracking-widest text-[#B8860B] font-bold">Experiencia Premium</span>
              <h3 className="font-serif text-xl font-bold mt-1">Cortes artesanales a tijera y navaja</h3>
              <p className="text-xs text-stone-300 mt-1">Atención personalizada en cada sesión</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
