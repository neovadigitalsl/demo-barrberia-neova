import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { demoConfig } from '../demoConfig';

export const AIChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [consentGiven, setConsentGiven] = useState<boolean>(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState<boolean>(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `¡Hola! Soy el Asistente Virtual de IA de ${demoConfig.shopName}. Puedo informarte sobre nuestros servicios, lista de precios, ubicación y consultar la disponibilidad de nuestra agenda con Alejandro y David. ¿En qué puedo ayudarte hoy?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const consent = localStorage.getItem('rgpd_ai_chat_consent');
    if (consent === 'granted') {
      setConsentGiven(true);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleGrantConsent = () => {
    localStorage.setItem('rgpd_ai_chat_consent', 'granted');
    setConsentGiven(true);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-6)
        })
      });

      const data = await res.json();
      const replyText = data.reply || "Disculpa, no he podido procesar tu solicitud en este momento.";

      setMessages((prev) => [
        ...prev,
        {
          id: `ast-${Date.now()}`,
          sender: 'assistant',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: `Estamos experimentando una breve interrupción. Puedes llamarnos directamente al ${demoConfig.phone}.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside aria-label="Asistente Virtual" className="fixed bottom-20 md:bottom-6 right-6 z-40">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-[#1A1A1A] hover:bg-[#B8860B] text-white p-3.5 rounded-full shadow-xl transition-all hover:scale-105 active:scale-95 duration-200 relative group flex items-center justify-center"
          title="Hablar con Asistente de IA"
        >
          <span className="material-symbols-outlined text-2xl">smart_toy</span>
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B8860B] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
          </span>
        </button>
      )}

      {/* Chat Box Drawer */}
      {isOpen && (
        <div className="bg-white border border-stone-200 rounded-2xl shadow-2xl w-[92vw] sm:w-[380px] h-[520px] flex flex-col overflow-hidden text-[#1A1A1A] animate-in fade-in slide-in-from-bottom-4">
          
          {/* Header */}
          <div className="bg-[#1A1A1A] text-white p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#B8860B]">
                <span className="material-symbols-outlined text-lg">smart_toy</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-serif text-sm font-bold text-white">{demoConfig.shopName}</h4>
                  <span className="bg-[#B8860B] text-white text-[9px] font-bold px-1.5 py-0.2 rounded uppercase">
                    IA
                  </span>
                </div>
                <p className="text-[10px] text-stone-300">Asistente oficial para citas y consultas</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-stone-300 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* RGPD Consent Banner if not granted yet */}
          {!consentGiven ? (
            <div className="p-5 flex-grow flex flex-col justify-between bg-stone-50 text-xs leading-relaxed space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[#1A1A1A] font-bold uppercase text-[11px] tracking-wider">
                  <span className="material-symbols-outlined text-base text-[#B8860B]">gavel</span>
                  Aviso RGPD y Uso de Inteligencia Artificial
                </div>

                <p className="text-stone-700">
                  Esta ventana interactiva utiliza un <strong>Asistente Virtual con Inteligencia Artificial (IA)</strong> para responder preguntas frecuentes sobre nuestros servicios, lista de precios y consultar disponibilidad de agenda en tiempo real.
                </p>

                <p className="text-stone-500 text-[11px]">
                  En cumplimiento del Reglamento General de Protección de Datos (RGPD UE 2016/679), los datos introducidos se procesan exclusivamente para resolver tu consulta y no se comparten con terceros.
                </p>

                {showPrivacyPolicy && (
                  <div className="p-3 bg-white border border-stone-200 rounded text-[10px] text-stone-700 max-h-28 overflow-y-auto">
                    <strong>Política de Privacidad de {demoConfig.shopName}:</strong><br />
                    - Responsable: {demoConfig.shopName}.<br />
                    - Finalidad: Atención al cliente e información de citas.<br />
                    - Legitimación: Consentimiento expreso del interesado.<br />
                    - Derechos: Puedes solicitar acceso o cancelación de tus consultas en el local o en el teléfono {demoConfig.phone}.
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-stone-200">
                <button
                  onClick={handleGrantConsent}
                  className="w-full bg-[#1A1A1A] text-white py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-[#B8860B] transition-colors shadow-xs active:scale-95"
                >
                  Aceptar y Continuar al Chat
                </button>
                <button
                  onClick={() => setShowPrivacyPolicy(!showPrivacyPolicy)}
                  className="w-full text-center text-[10px] text-stone-500 hover:text-[#1A1A1A] hover:underline"
                >
                  {showPrivacyPolicy ? 'Ocultar detalles' : 'Leer Política de Privacidad completa'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Message List */}
              <div className="flex-grow p-4 overflow-y-auto space-y-3 text-xs bg-stone-50/50">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-xs ${
                        m.sender === 'user'
                          ? 'bg-[#1A1A1A] text-white rounded-br-none'
                          : 'bg-white text-stone-800 border border-stone-200 rounded-bl-none'
                      }`}
                    >
                      <p className="whitespace-pre-line">{m.text}</p>
                    </div>
                    <span className="text-[9px] text-stone-400 mt-1 px-1">{m.timestamp}</span>
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center gap-1.5 text-stone-500 italic text-[11px] bg-white p-2.5 rounded-xl border border-stone-200 inline-block">
                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                    Consultando agenda y servicios...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Suggestions */}
              <div className="px-3 py-1.5 bg-stone-100 flex gap-2 overflow-x-auto text-[10px] border-t border-stone-200">
                <button
                  onClick={() => handleSendMessage('¿Cuáles son los precios de los servicios?')}
                  className="bg-white text-stone-700 hover:text-[#B8860B] px-2 py-1 rounded border border-stone-200 shrink-0 font-medium transition-colors"
                >
                  Precios
                </button>
                <button
                  onClick={() => handleSendMessage('¿Qué barberos atienden?')}
                  className="bg-white text-stone-700 hover:text-[#B8860B] px-2 py-1 rounded border border-stone-200 shrink-0 font-medium transition-colors"
                >
                  Barberos
                </button>
                <button
                  onClick={() => handleSendMessage('¿Cuál es el horario y la dirección?')}
                  className="bg-white text-stone-700 hover:text-[#B8860B] px-2 py-1 rounded border border-stone-200 shrink-0 font-medium transition-colors"
                >
                  Ubicación & Horario
                </button>
              </div>

              {/* Input Area */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-2.5 bg-white border-t border-stone-200 flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Pregunta sobre servicios o disponibilidad..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-grow bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-xs text-[#1A1A1A] outline-none focus:border-[#B8860B]"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="bg-[#1A1A1A] text-white hover:bg-[#B8860B] p-2 rounded-lg disabled:opacity-40 transition-colors flex items-center justify-center shrink-0"
                >
                  <span className="material-symbols-outlined text-base">send</span>
                </button>
              </form>
            </>
          )}

        </div>
      )}
    </aside>
  );
};
