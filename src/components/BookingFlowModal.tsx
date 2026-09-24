import React, { useState, useEffect, useRef } from 'react';
import { Service, Barber, Booking } from '../types';
import { notifyBookingConfirmed } from '../utils/notifications';
import { EmailPreviewModal } from './EmailPreviewModal';
import { demoConfig } from '../demoConfig';

interface BookingFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedService?: Service | null;
  services: Service[];
  barbers?: Barber[];
  onBookingConfirmed: (booking: Booking) => void;
}

const DEFAULT_BARBERS: Barber[] = [
  {
    id: "cualquiera",
    name: "Cualquiera",
    title: "Próximo disponible",
    avatarUrl: "",
    available: true
  },
  {
    id: "alejandro",
    name: "Alejandro",
    title: "Master Barber & Founder",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    available: true
  },
  {
    id: "david",
    name: "David",
    title: "Senior Stylist & Fade Specialist",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    available: true
  }
];

const TIME_SLOTS = ["09:00", "09:30", "10:00", "11:00", "11:30", "12:00", "13:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

export const BookingFlowModal: React.FC<BookingFlowModalProps> = ({
  isOpen,
  onClose,
  preselectedService,
  services,
  barbers: barbersFromProps,
  onBookingConfirmed,
}) => {
  const activeBarbersList = (barbersFromProps && barbersFromProps.length > 0) ? barbersFromProps : DEFAULT_BARBERS;

  const barberSectionRef = useRef<HTMLDivElement>(null);
  const summarySectionRef = useRef<HTMLDivElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<number>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber>(activeBarbersList[0]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('10:00');
  const [justSelectedServiceNotice, setJustSelectedServiceNotice] = useState<string>('');
  
  // Customer details form
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [googleCalendarUrl, setGoogleCalendarUrl] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);

  // Calendar month state
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  useEffect(() => {
    if (preselectedService && preselectedService.available !== false) {
      setSelectedService(preselectedService);
    } else if (services.length > 0) {
      const firstAvailable = services.find((s) => s.available !== false) || services[0];
      setSelectedService(firstAvailable);
    } else if (demoConfig.services.length > 0) {
      setSelectedService(demoConfig.services[0] as Service);
    }
  }, [preselectedService, services]);

  useEffect(() => {
    // Set default tomorrow date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  if (!isOpen) return null;

  const currentService = selectedService || services[0] || (demoConfig.services[0] as Service);

  const handleStep1Next = () => {
    setStep(2);
  };

  const handleStep2Next = () => {
    if (!selectedDate || !selectedTime) {
      setErrorMessage("Por favor, selecciona una fecha y una hora.");
      return;
    }
    setErrorMessage("");
    setStep(3);
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !customerEmail) {
      setErrorMessage("Por favor, completa tu Nombre, Teléfono y Email.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: currentService.id,
          serviceName: currentService.name,
          duration: currentService.duration,
          price: currentService.price,
          barberId: selectedBarber.id,
          barberName: selectedBarber.name,
          date: selectedDate,
          time: selectedTime,
          customerName,
          customerPhone,
          customerEmail,
          notes
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al registrar la reserva");
      }

      setConfirmedBooking(data.booking);
      if (data.googleCalendarUrl) {
        setGoogleCalendarUrl(data.googleCalendarUrl);
      }

      notifyBookingConfirmed(data.booking);
      onBookingConfirmed(data.booking);
      setStep(4);
    } catch (err: any) {
      setErrorMessage(err.message || "Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div 
        ref={modalContainerRef}
        className="bg-white border border-stone-200 rounded-2xl w-full max-w-4xl p-6 md:p-8 relative shadow-2xl my-8 max-h-[92vh] overflow-y-auto text-[#1A1A1A]"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-500 hover:text-[#1A1A1A] p-2 rounded-full hover:bg-stone-100 transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* Header & Step Bar */}
        <div className="text-center mb-8 max-w-xl mx-auto">
          <span className="text-xs uppercase tracking-widest text-[#B8860B] font-bold block mb-1">
            Reserva Online
          </span>
          <h2 className="font-serif text-2xl md:text-3xl text-[#1A1A1A] font-bold">
            {demoConfig.shopName}
          </h2>

          {step < 4 && (
            <div className="mt-6">
              <div className="flex justify-between items-center max-w-xs mx-auto mb-2 text-xs font-sans text-stone-500">
                <span className={step >= 1 ? "text-[#1A1A1A] font-bold" : ""}>1. Servicio</span>
                <span className={step >= 2 ? "text-[#1A1A1A] font-bold" : ""}>2. Fecha</span>
                <span className={step >= 3 ? "text-[#1A1A1A] font-bold" : ""}>3. Datos</span>
              </div>
              <div className="flex gap-2 max-w-xs mx-auto">
                <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-[#1A1A1A]' : 'bg-stone-200'}`}></div>
                <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-[#1A1A1A]' : 'bg-stone-200'}`}></div>
                <div className={`h-1.5 flex-1 rounded-full ${step >= 3 ? 'bg-[#1A1A1A]' : 'bg-stone-200'}`}></div>
              </div>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center font-sans">
            {errorMessage}
          </div>
        )}

        {/* STEP 1: SELECT SERVICE & BARBER */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              {/* 1. Elige tu Servicio */}
              <section>
                <h3 className="font-serif text-lg text-[#1A1A1A] font-bold flex items-center gap-2 border-b border-stone-200 pb-3 mb-4">
                  <span className="material-symbols-outlined text-[#B8860B]">content_cut</span>
                  1. Elige tu Servicio
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(services.length > 0 ? services : (demoConfig.services as Service[])).map((srv) => {
                    const isAvailable = srv.available !== false;
                    const isSelected = selectedService?.id === srv.id;
                    return (
                      <div
                        key={srv.id}
                        onClick={() => {
                          if (isAvailable) {
                            setSelectedService(srv);
                            setErrorMessage('');
                            setJustSelectedServiceNotice(`"${srv.name}" seleccionado.`);
                          } else {
                            setErrorMessage(`El servicio "${srv.name}" no está disponible actualmente.`);
                          }
                        }}
                        className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                          !isAvailable
                            ? 'bg-stone-100 border-stone-200 opacity-60 cursor-not-allowed'
                            : isSelected
                            ? 'bg-stone-50 border-[#B8860B] ring-2 ring-[#B8860B]/20 shadow-sm'
                            : 'bg-white border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-serif font-bold text-[#1A1A1A] text-base">{srv.name}</h4>
                          <span className="font-sans font-bold text-[#1A1A1A] text-sm">{srv.price}€</span>
                        </div>
                        <p className="font-sans text-xs text-stone-500 mb-2 leading-relaxed">{srv.description}</p>
                        <div className="flex items-center justify-between text-xs text-stone-600 font-medium">
                          <span>⏱️ {srv.duration} min</span>
                          {isSelected && (
                            <span className="text-[#B8860B] font-bold flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">check</span> Seleccionado
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* 2. Selecciona a tu Barbero */}
              <section ref={barberSectionRef}>
                <h3 className="font-serif text-lg text-[#1A1A1A] font-bold flex items-center gap-2 border-b border-stone-200 pb-3 mb-4">
                  <span className="material-symbols-outlined text-[#B8860B]">badge</span>
                  2. Selecciona tu Especialista
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {activeBarbersList.map((barber) => {
                    const isSelected = selectedBarber.id === barber.id;
                    return (
                      <div
                        key={barber.id}
                        onClick={() => setSelectedBarber(barber)}
                        className={`p-4 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-stone-50 border-[#B8860B] ring-2 ring-[#B8860B]/20 shadow-sm'
                            : 'bg-white border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        <div className="w-14 h-14 mx-auto rounded-full bg-stone-100 border border-stone-300 overflow-hidden mb-2.5 flex items-center justify-center">
                          {barber.avatarUrl ? (
                            <img src={barber.avatarUrl} alt={barber.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-stone-400 text-2xl">person</span>
                          )}
                        </div>
                        <h5 className="font-serif font-bold text-sm text-[#1A1A1A]">{barber.name}</h5>
                        <p className="text-[11px] text-stone-500 mt-0.5">{barber.title || 'Barbero'}</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* Sidebar Summary */}
            <div className="lg:col-span-4 bg-[#F8F9FA] border border-stone-200 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <h4 className="font-serif font-bold text-[#1A1A1A] text-base mb-4 border-b border-stone-200 pb-2">
                  Resumen de Reserva
                </h4>
                <div className="space-y-3 text-xs mb-6">
                  <div>
                    <span className="text-stone-500 block uppercase">Servicio</span>
                    <strong className="text-sm text-[#1A1A1A]">{currentService.name}</strong>
                    <p className="text-[#B8860B] font-semibold">{currentService.price}€ ({currentService.duration} min)</p>
                  </div>
                  <div>
                    <span className="text-stone-500 block uppercase">Especialista</span>
                    <strong className="text-sm text-[#1A1A1A]">{selectedBarber.name}</strong>
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleStep1Next}
                  className="w-full bg-[#1A1A1A] text-white font-sans text-xs py-3.5 rounded uppercase font-bold tracking-wider hover:bg-[#B8860B] transition-colors shadow-sm flex items-center justify-center gap-2 active:scale-95"
                >
                  Elegir Fecha & Hora
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: DATE & TIME */}
        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              <div>
                <h3 className="font-serif text-lg text-[#1A1A1A] font-bold flex items-center gap-2 border-b border-stone-200 pb-3 mb-4">
                  <span className="material-symbols-outlined text-[#B8860B]">calendar_month</span>
                  Selecciona la Fecha
                </h3>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-lg px-4 py-3 text-sm text-[#1A1A1A] focus:border-[#B8860B] outline-none"
                />
              </div>

              <div>
                <h3 className="font-serif text-lg text-[#1A1A1A] font-bold flex items-center gap-2 border-b border-stone-200 pb-3 mb-4">
                  <span className="material-symbols-outlined text-[#B8860B]">schedule</span>
                  Horarios Disponibles
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {TIME_SLOTS.map((slot) => {
                    const isSelected = selectedTime === slot;
                    return (
                      <button
                        type="button"
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        className={`py-3 rounded-lg border text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                            : 'bg-white text-stone-700 border-stone-200 hover:border-[#B8860B]'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar Summary */}
            <div className="lg:col-span-4 bg-[#F8F9FA] border border-stone-200 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <h4 className="font-serif font-bold text-[#1A1A1A] text-base mb-4 border-b border-stone-200 pb-2">
                  Resumen de Reserva
                </h4>
                <div className="space-y-3 text-xs mb-6">
                  <div>
                    <span className="text-stone-500 block uppercase">Servicio</span>
                    <strong className="text-sm text-[#1A1A1A]">{currentService.name}</strong>
                    <p className="text-[#B8860B] font-semibold">{currentService.price}€</p>
                  </div>
                  <div>
                    <span className="text-stone-500 block uppercase">Especialista</span>
                    <strong className="text-sm text-[#1A1A1A]">{selectedBarber.name}</strong>
                  </div>
                  <div>
                    <span className="text-stone-500 block uppercase">Fecha & Hora</span>
                    <strong className="text-sm text-[#1A1A1A]">{selectedDate} a las {selectedTime} hs</strong>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleStep2Next}
                  className="w-full bg-[#1A1A1A] text-white font-sans text-xs py-3.5 rounded uppercase font-bold tracking-wider hover:bg-[#B8860B] transition-colors shadow-sm flex items-center justify-center gap-2 active:scale-95"
                >
                  Continuar
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-xs text-stone-600 hover:text-[#1A1A1A] py-2"
                >
                  Volver Atrás
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: CUSTOMER DETAILS */}
        {step === 3 && (
          <form onSubmit={handleConfirmBooking} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 bg-white rounded-xl p-6 border border-stone-200 space-y-4 shadow-sm">
              <h3 className="font-serif text-lg text-[#1A1A1A] font-bold border-b border-stone-200 pb-3">Tus Datos de Contacto</h3>

              <div>
                <label className="block text-xs font-sans text-stone-600 uppercase tracking-wider mb-1 font-semibold">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-lg px-4 py-3 text-sm text-[#1A1A1A] focus:border-[#B8860B] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-sans text-stone-600 uppercase tracking-wider mb-1 font-semibold">
                    Teléfono Móvil *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+34 600 000 000"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-lg px-4 py-3 text-sm text-[#1A1A1A] focus:border-[#B8860B] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans text-stone-600 uppercase tracking-wider mb-1 font-semibold">
                    Email de Confirmación *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="tu@email.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-lg px-4 py-3 text-sm text-[#1A1A1A] focus:border-[#B8860B] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-sans text-stone-600 uppercase tracking-wider mb-1 font-semibold">
                  Notas o Preferencias (Opcional)
                </label>
                <textarea
                  rows={3}
                  placeholder="¿Alguna preferencia de corte o estilo?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-lg px-4 py-3 text-sm text-[#1A1A1A] focus:border-[#B8860B] outline-none resize-none"
                ></textarea>
              </div>
            </div>

            {/* Sidebar Confirmation */}
            <div className="lg:col-span-5 bg-[#F8F9FA] border border-stone-200 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <h4 className="font-serif font-bold text-[#1A1A1A] text-base mb-4 border-b border-stone-200 pb-2">
                  Confirmación de Reserva
                </h4>
                <div className="space-y-4 mb-6 text-xs">
                  <div>
                    <span className="text-stone-500 uppercase block">Servicio Seleccionado</span>
                    <strong className="text-sm text-[#1A1A1A] block">{currentService.name}</strong>
                    <span className="text-[#B8860B] font-bold text-sm">{currentService.price}€</span> • <span className="text-stone-600">{currentService.duration} min</span>
                  </div>
                  <div>
                    <span className="text-stone-500 uppercase block">Fecha y Hora</span>
                    <strong className="text-sm text-[#1A1A1A] block">📅 {selectedDate} a las {selectedTime} hs</strong>
                  </div>
                  <div>
                    <span className="text-stone-500 uppercase block">Barbero Especialista</span>
                    <strong className="text-sm text-[#1A1A1A] block">✂️ {selectedBarber.name}</strong>
                  </div>
                  <div className="pt-2 border-t border-stone-200 flex justify-between items-center">
                    <span className="font-bold text-stone-700 uppercase">Total en local:</span>
                    <span className="font-serif text-2xl font-bold text-[#1A1A1A]">{currentService.price}€</span>
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1A1A1A] text-white font-sans text-xs py-4 rounded uppercase font-bold tracking-wider hover:bg-[#B8860B] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                >
                  {loading ? 'Confirmando...' : 'Confirmar Reserva Ahora'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full text-center text-xs text-stone-600 mt-3 hover:text-[#1A1A1A]"
                >
                  Cambiar Fecha / Hora
                </button>
              </div>
            </div>
          </form>
        )}

        {/* STEP 4: SUCCESS SCREEN */}
        {step === 4 && confirmedBooking && (
          <div className="text-center py-6 space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 mb-2">
              <span className="material-symbols-outlined text-3xl">check_circle</span>
            </div>

            <h2 className="font-serif text-3xl text-[#1A1A1A] font-bold">
              ¡Cita Confirmada con Éxito!
            </h2>
            <p className="font-sans text-sm text-stone-600 max-w-md mx-auto">
              Te hemos enviado los datos y recordatorio a tu correo <strong className="text-[#1A1A1A]">{confirmedBooking.customerEmail}</strong>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-2xl mx-auto mt-6 bg-stone-50 border border-stone-200 rounded-xl p-6">
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-stone-500 uppercase block">Servicio</span>
                  <strong className="text-sm text-[#1A1A1A]">{confirmedBooking.serviceName}</strong>
                </div>
                <div>
                  <span className="text-stone-500 uppercase block">Especialista</span>
                  <strong className="text-sm text-[#1A1A1A]">{confirmedBooking.barberName}</strong>
                </div>
                <div>
                  <span className="text-stone-500 uppercase block">Día y Hora</span>
                  <strong className="text-sm text-[#1A1A1A]">{confirmedBooking.date} a las {confirmedBooking.time} hs</strong>
                </div>
                <div>
                  <span className="text-stone-500 uppercase block">Importe a pagar</span>
                  <strong className="text-lg text-[#1A1A1A] font-bold">{confirmedBooking.price}€</strong>
                </div>
              </div>

              <div className="flex flex-col justify-between space-y-4">
                <div className="bg-white p-3 rounded-lg border border-stone-200 text-xs">
                  <span className="font-bold text-[#B8860B] block mb-1">📍 Ubicación</span>
                  <p className="text-stone-700">{demoConfig.address}</p>
                </div>

                <div className="space-y-2">
                  {googleCalendarUrl && (
                    <a
                      href={googleCalendarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-[#1A1A1A] hover:bg-[#B8860B] text-white font-sans text-xs py-3 px-4 rounded uppercase font-bold tracking-wider transition-colors flex items-center justify-center gap-2 shadow-sm text-center"
                    >
                      <span className="material-symbols-outlined text-base">edit_calendar</span>
                      Agendar en Google Calendar
                    </a>
                  )}
                  <button
                    onClick={onClose}
                    className="w-full bg-white border border-stone-300 hover:border-stone-400 text-[#1A1A1A] font-sans text-xs py-2.5 px-4 rounded uppercase tracking-wider transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
