import React, { useState, useEffect } from 'react';

export interface SentEmailData {
  id: string;
  bookingId?: string;
  to: string;
  customerName?: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  sentAt: string;
  status: 'delivered' | 'simulated' | 'failed';
  type: string;
}

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId?: string;
  emailData?: SentEmailData | null;
}

export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  emailData: initialEmailData,
}) => {
  const [emailData, setEmailData] = useState<SentEmailData | null>(initialEmailData || null);
  const [loading, setLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'preview' | 'html' | 'text'>('preview');

  useEffect(() => {
    if (initialEmailData) {
      setEmailData(initialEmailData);
    } else if (isOpen && bookingId) {
      fetchEmailByBooking();
    }
  }, [isOpen, bookingId, initialEmailData]);

  const fetchEmailByBooking = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/emails?bookingId=${bookingId}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setEmailData(data[0]);
      } else {
        setEmailData(null);
      }
    } catch (err) {
      console.error('Error fetching email by booking ID:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-stone-200 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-[#0F232C] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/10 text-white">
              <span className="material-symbols-outlined text-2xl">mail</span>
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-white">
                Correo de Confirmación Enviado
              </h2>
              <p className="text-xs text-stone-300">
                {emailData ? `Destinatario: ${emailData.to}` : 'Cargando detalles del correo...'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-300 hover:text-white transition-colors p-1"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* View Mode Toggle Bar */}
        {emailData && (
          <div className="bg-[#F8F9FA] px-5 py-2.5 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-stone-600 font-medium">Modo de vista:</span>
              <button
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 rounded-md font-bold transition-colors ${
                  viewMode === 'preview'
                    ? 'bg-[#0F232C] text-white'
                    : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50'
                }`}
              >
                Vista Previa HTML
              </button>
              <button
                onClick={() => setViewMode('text')}
                className={`px-3 py-1 rounded-md font-bold transition-colors ${
                  viewMode === 'text'
                    ? 'bg-[#0F232C] text-white'
                    : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50'
                }`}
              >
                Texto Plano
              </button>
            </div>

            <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              {emailData.status === 'delivered' ? '✓ Enviado vía SMTP' : '✓ Correo registrado en servidor'}
            </span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-grow bg-[#F8F9FA]">
          {loading ? (
            <div className="py-12 text-center text-sm text-stone-600 flex flex-col items-center gap-3">
              <span className="material-symbols-outlined text-3xl text-[#0F232C] animate-spin">sync</span>
              Cargando comprobante de correo...
            </div>
          ) : !emailData ? (
            <div className="py-12 text-center text-sm text-stone-500">
              No se encontró un registro de correo electrónico para esta reserva.
            </div>
          ) : viewMode === 'preview' ? (
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-stone-200">
              <iframe
                title="Email Confirmation Preview"
                srcDoc={emailData.bodyHtml}
                className="w-full h-[450px] border-none"
              />
            </div>
          ) : (
            <div className="bg-white p-4 rounded-xl border border-stone-200 text-xs font-mono text-stone-800 whitespace-pre-wrap leading-relaxed shadow-sm">
              {emailData.bodyText}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-white flex items-center justify-between">
          <p className="text-[11px] text-stone-500 font-medium">
            Enviado el {emailData ? new Date(emailData.sentAt).toLocaleString() : ''}
          </p>
          <button
            onClick={onClose}
            className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold uppercase tracking-wider py-2 px-5 rounded-lg border border-stone-300 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
