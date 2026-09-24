import React, { useState } from 'react';
import { Booking } from '../types';
import { notifyBookingCancelled } from '../utils/notifications';
import { EmailPreviewModal } from './EmailPreviewModal';

interface MyBookingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: Booking[];
  onCancelBooking: (id: string) => void;
}

export const MyBookingsModal: React.FC<MyBookingsModalProps> = ({
  isOpen,
  onClose,
  bookings,
  onCancelBooking,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [selectedBookingForEmail, setSelectedBookingForEmail] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredBookings = bookings.filter((b) => {
    if (!searchTerm.trim()) return false;
    const term = searchTerm.toLowerCase();
    return (
      b.customerEmail.toLowerCase().includes(term) ||
      b.customerPhone.toLowerCase().includes(term) ||
      b.customerName.toLowerCase().includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white border border-stone-200 rounded-2xl w-full max-w-2xl text-[#1A1A1A] p-6 sm:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-500 hover:text-[#1A1A1A] p-1.5 rounded-full hover:bg-stone-100 transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <span className="text-xs uppercase tracking-widest text-[#B8860B] font-bold block mb-1">
          Gestión Personal
        </span>
        <h2 className="font-serif text-2xl text-[#1A1A1A] font-bold mb-1">
          Mis Reservas
        </h2>
        <p className="font-sans text-xs text-stone-500 mb-6">
          Introduce tu email o teléfono para consultar o cancelar tus citas programadas.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setHasSearched(true);
          }}
          className="flex gap-2 mb-6"
        >
          <input
            type="text"
            placeholder="Escribe tu email o teléfono..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setHasSearched(true);
            }}
            className="flex-grow bg-white border border-stone-300 rounded-lg px-4 py-2.5 text-sm text-[#1A1A1A] outline-none focus:border-[#B8860B]"
          />
          <button
            type="submit"
            className="bg-[#1A1A1A] text-white hover:bg-[#B8860B] px-5 py-2.5 rounded-lg font-sans text-xs font-bold uppercase tracking-wider transition-colors shadow-sm active:scale-95"
          >
            Buscar
          </button>
        </form>

        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
          {!hasSearched && (
            <p className="text-center text-xs text-stone-500 py-8 italic">
              Escribe tus datos arriba para localizar tus citas.
            </p>
          )}

          {hasSearched && filteredBookings.length === 0 && (
            <div className="text-center py-8 text-stone-500 text-xs">
              No se han encontrado citas asociadas a "{searchTerm}".
            </div>
          )}

          {filteredBookings.map((bk) => (
            <div
              key={bk.id}
              className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-serif text-base font-bold text-[#1A1A1A]">
                    {bk.serviceName}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      bk.status === 'confirmed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {bk.status === 'confirmed' ? 'Confirmada' : 'Cancelada'}
                  </span>
                </div>
                <p className="text-xs text-stone-600">
                  📅 {bk.date} a las {bk.time} hs con <strong className="text-[#1A1A1A]">{bk.barberName}</strong>
                </p>
                <p className="text-xs text-[#B8860B] font-bold mt-1">
                  Precio: {bk.price}€ ({bk.duration} min)
                </p>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setSelectedBookingForEmail(bk.id)}
                  className="bg-white border border-stone-300 hover:border-stone-400 text-stone-700 text-xs px-3 py-1.5 rounded font-medium transition-colors"
                >
                  Ver Email
                </button>
                {bk.status === 'confirmed' && (
                  <button
                    onClick={() => {
                      if (confirm("¿Seguro que deseas cancelar esta reserva?")) {
                        onCancelBooking(bk.id);
                        notifyBookingCancelled(bk);
                      }
                    }}
                    className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-xs px-3 py-1.5 rounded font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {selectedBookingForEmail && (
          <EmailPreviewModal
            isOpen={!!selectedBookingForEmail}
            onClose={() => setSelectedBookingForEmail(null)}
            bookingId={selectedBookingForEmail}
          />
        )}
      </div>
    </div>
  );
};
