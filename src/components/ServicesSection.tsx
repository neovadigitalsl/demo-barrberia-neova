import React from 'react';
import { Service } from '../types';
import { demoConfig } from '../demoConfig';

interface ServicesSectionProps {
  services: Service[];
  onSelectService: (service: Service) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  services,
  onSelectService,
}) => {
  const displayServices = (services && services.length > 0) ? services : (demoConfig.services as Service[]);

  return (
    <section id="services" className="py-20 px-6 max-w-7xl mx-auto">
      <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-stone-200 pb-5">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#B8860B] font-bold block mb-1">
            Nuestros Trabajos
          </span>
          <h2 className="font-serif text-3xl md:text-4xl text-[#1A1A1A] font-bold">
            Servicios Exclusivos
          </h2>
          <p className="font-sans text-base text-stone-600 mt-1">
            Cortes clásicos, arreglos de barba y cuidados con productos de alta gama.
          </p>
        </div>
        <div className="text-xs text-stone-500 font-medium">
          Precios con IVA incluido • Asesoramiento personalizado
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayServices.map((service) => {
          const isAvailable = service.available !== false;

          return (
            <div
              key={service.id}
              className={`p-6 rounded-xl border transition-all duration-300 group relative overflow-hidden flex flex-col h-full bg-white shadow-sm hover:shadow-lg ${
                !isAvailable
                  ? 'border-stone-300 opacity-70 bg-stone-50'
                  : service.popular
                  ? 'border-[#B8860B]/50 hover:border-[#B8860B] ring-1 ring-[#B8860B]/20'
                  : 'border-stone-200 hover:border-stone-400'
              }`}
            >
              {/* Background Icon Watermark */}
              <div className="absolute top-2 right-2 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-[64px] text-[#1A1A1A]">
                  {service.icon || 'content_cut'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-3 z-10">
                {service.popular && isAvailable && (
                  <span className="bg-[#B8860B] text-white font-sans text-[10px] px-2.5 py-0.5 rounded uppercase font-bold tracking-widest shadow-xs">
                    Popular
                  </span>
                )}
                {!isAvailable && (
                  <span className="bg-stone-200 text-stone-700 font-sans text-[10px] px-2.5 py-0.5 rounded uppercase font-bold tracking-widest flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">warning</span>
                    Pausado
                  </span>
                )}
              </div>

              <h3 className="font-serif text-xl text-[#1A1A1A] mb-1 z-10 relative font-bold">
                {service.name}
              </h3>

              <div className="flex items-baseline gap-2 mb-3 z-10 relative">
                <span className="font-sans text-2xl font-bold text-[#1A1A1A]">
                  {service.price}€
                </span>
                <span className="font-sans text-xs text-stone-500 font-medium">
                  / {service.duration} min
                </span>
              </div>

              <p className="font-sans text-xs text-stone-600 mb-6 flex-grow z-10 relative leading-relaxed">
                {service.description}
              </p>

              <button
                disabled={!isAvailable}
                onClick={() => isAvailable && onSelectService(service)}
                className={`mt-auto w-full font-sans text-xs px-4 py-2.5 uppercase font-bold tracking-wider rounded transition-all duration-200 shadow-sm ${
                  !isAvailable
                    ? 'bg-stone-200 text-stone-400 border border-stone-300 cursor-not-allowed'
                    : 'bg-[#1A1A1A] text-white hover:bg-[#B8860B] active:scale-95'
                }`}
              >
                {isAvailable ? 'Seleccionar Cita' : 'No disponible'}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
