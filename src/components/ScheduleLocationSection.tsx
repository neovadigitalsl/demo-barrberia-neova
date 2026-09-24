import React from 'react';
import { demoConfig } from '../demoConfig';

export const ScheduleLocationSection: React.FC = () => {
  return (
    <section id="location" className="py-20 px-6 bg-white border-y border-stone-200">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left Hours and Location Info */}
        <div>
          <span className="text-xs uppercase tracking-widest text-[#B8860B] font-bold block mb-1">
            Encuéntranos
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-[#1A1A1A] mb-3 font-bold">
            Horario & Ubicación
          </h2>
          <p className="font-sans text-base text-stone-600 mb-8 leading-relaxed">
            Estamos ubicados en una zona céntrica y de fácil acceso. Disfruta de un café de cortesía mientras te preparamos tu corte.
          </p>

          <div className="space-y-4 mb-8 bg-[#F8F9FA] p-6 rounded-xl border border-stone-200">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3">
              <span className="font-sans text-xs text-stone-600 uppercase tracking-wider font-semibold">
                Lunes - Viernes
              </span>
              <span className="font-sans text-sm text-[#1A1A1A] font-bold">
                {demoConfig.schedule.weekdays}
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-stone-200 pb-3">
              <span className="font-sans text-xs text-stone-600 uppercase tracking-wider font-semibold">
                Sábado
              </span>
              <span className="font-sans text-sm text-[#1A1A1A] font-bold">
                {demoConfig.schedule.saturdays}
              </span>
            </div>

            <div className="flex justify-between items-center pb-1">
              <span className="font-sans text-xs text-[#B8860B] uppercase tracking-wider font-semibold">
                Domingo
              </span>
              <span className="font-sans text-sm text-stone-500 italic font-medium">
                {demoConfig.schedule.sundays}
              </span>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-stone-200 bg-white flex flex-col gap-2 shadow-xs">
            <div className="flex items-center gap-2 text-[#B8860B]">
              <span className="material-symbols-outlined text-[20px]">location_on</span>
              <span className="font-sans text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">Dirección Principal</span>
            </div>
            <p className="font-sans text-sm text-[#1A1A1A] font-medium">
              {demoConfig.address}
            </p>
            <div className="flex flex-wrap gap-4 pt-1 text-xs text-stone-600">
              <span>Teléfono // WhatsApp: <strong className="text-[#1A1A1A]">{demoConfig.phone}</strong></span>
            </div>
          </div>
        </div>

        {/* Right Interactive Google Maps Embed */}
        <div className="relative h-80 md:h-[400px] rounded-2xl overflow-hidden border border-stone-300 shadow-md">
          <iframe
            title={`Ubicación Google Maps - ${demoConfig.shopName}`}
            src={`https://maps.google.com/maps?q=${encodeURIComponent(demoConfig.address)}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
            className="w-full h-full border-0"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-stone-200 text-xs text-[#1A1A1A] flex items-center justify-between shadow-lg z-10 pointer-events-auto">
            <div className="pr-2">
              <span className="font-bold block text-sm">{demoConfig.shopName}</span>
              <span className="text-stone-600 text-xs">{demoConfig.address}</span>
            </div>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(demoConfig.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#1A1A1A] text-white hover:bg-[#B8860B] transition-colors px-3.5 py-2 rounded text-[11px] font-bold uppercase tracking-wider shrink-0"
            >
              Cómo llegar
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
