import React from 'react';
import { demoConfig } from '../demoConfig';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white w-full py-14 px-6 flex flex-col items-center gap-6 border-t border-stone-200">
      <div className="font-serif text-2xl font-bold text-[#1A1A1A] tracking-tight flex items-center gap-2">
        <span className="material-symbols-outlined text-2xl text-[#B8860B]">content_cut</span>
        <span>{demoConfig.shopName}</span>
      </div>

      <div className="flex flex-wrap justify-center gap-8">
        <a
          href="#privacy"
          onClick={(e) => {
            e.preventDefault();
            alert(`Política de Privacidad (RGPD): ${demoConfig.shopName} recopila tus datos personales exclusivamente para gestionar tus citas. Tus datos no se ceden a terceros.`);
          }}
          className="font-sans text-xs text-stone-600 hover:text-[#B8860B] transition-colors uppercase tracking-wider font-semibold"
        >
          Política de Privacidad
        </a>
        <a
          href="#terms"
          onClick={(e) => {
            e.preventDefault();
            alert("Términos del Servicio: Las cancelaciones deben realizarse con al menos 2 horas de antelación.");
          }}
          className="font-sans text-xs text-stone-600 hover:text-[#B8860B] transition-colors uppercase tracking-wider font-semibold"
        >
          Términos de Servicio
        </a>
        <a
          href={`tel:${demoConfig.phone.replace(/\s+/g, '')}`}
          className="font-sans text-xs text-stone-600 hover:text-[#B8860B] transition-colors uppercase tracking-wider font-semibold"
        >
          Contacto: {demoConfig.phone}
        </a>
      </div>

      <div className="font-sans text-xs text-stone-500 text-center flex flex-col sm:flex-row items-center gap-2">
        <span>© {new Date().getFullYear()} {demoConfig.shopName}. Todos los derechos reservados.</span>
        <span className="hidden sm:inline">•</span>
        <span className="text-stone-400">{demoConfig.softwareCredit}</span>
      </div>
    </footer>
  );
};
