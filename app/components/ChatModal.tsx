'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { api, ChatMensaje } from '../lib/api';
import { XIcon, SendIcon } from './icons';
import Spinner from './Spinner';
import { getLocale, formatClinicInstantTime, formatClinicInstantDate } from '../lib/date';
import { useLang } from '../lib/i18n/context';

interface Props {
  turnoId: string;
  /** userId of the logged-in user — determines bubble alignment */
  myUserId: string;
  /** Display name of the other party */
  otherName: string;
  onClose: () => void;
}

export default function ChatModal({ turnoId, myUserId, otherName, onClose }: Props) {
  const { t, lang } = useLang();
  const chat = t('chat');
  const locale = getLocale(lang);
  const [mensajes, setMensajes] = useState<ChatMensaje[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.chat.getMensajes(turnoId);
      setMensajes(data);
    } catch (e: any) {
      setError(e.message ?? chat.loadError);
    }
  }, [turnoId, chat.loadError]);

  useEffect(() => {
    load();
    // Poll every 5 seconds for new messages
    pollRef.current = setInterval(load, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [load]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setError(null);
    try {
      const nuevo = await api.chat.enviar(turnoId, text);
      setInput('');
      setMensajes(prev => [...prev, nuevo]);
    } catch (e: any) {
      setError(e.message ?? chat.sendError);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as any);
    }
  }

  function formatTime(iso: string) {
    return formatClinicInstantTime(iso, locale);
  }

  function formatDate(iso: string) {
    return formatClinicInstantDate(iso, locale, { day: '2-digit', month: 'short' });
  }

  // Group messages by date
  const grouped: { date: string; msgs: ChatMensaje[] }[] = [];
  for (const m of mensajes) {
    const d = formatDate(m.createdAt);
    if (!grouped.length || grouped[grouped.length - 1].date !== d) {
      grouped.push({ date: d, msgs: [m] });
    } else {
      grouped[grouped.length - 1].msgs.push(m);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md flex flex-col"
           style={{ height: '80vh', maxHeight: '600px' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {otherName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm leading-none">{otherName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{chat.preAppointment}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {grouped.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground">{chat.emptyTitle}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {chat.emptyDescription.replace('{{name}}', otherName)}
              </p>
            </div>
          )}

          {grouped.map(group => (
            <div key={group.date}>
              <div className="flex items-center gap-2 my-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">{group.date}</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="space-y-2">
                {group.msgs.map(m => {
                  const isMine = m.remitenteId === myUserId;
                  return (
                    <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${
                          isMine
                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                            : 'bg-muted text-foreground rounded-bl-sm'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.contenido}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'} text-right`}>
                          {formatTime(m.createdAt)}
                          {isMine && m.leidoAt && (
                            <span className="ml-1">✓✓</span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {error && (
            <div className="text-xs text-destructive text-center">{error}</div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="px-4 py-3 border-t flex gap-2 items-end flex-shrink-0">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={chat.placeholder}
            rows={1}
            className="flex-1 border bg-background text-foreground rounded-xl px-3 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
            onInput={e => {
              const t = e.currentTarget;
              t.style.height = 'auto';
              t.style.height = Math.min(t.scrollHeight, 120) + 'px';
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            {sending ? (
              <Spinner size={16} />
            ) : (
              <SendIcon size={16} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
