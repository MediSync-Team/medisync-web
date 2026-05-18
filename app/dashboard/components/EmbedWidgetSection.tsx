'use client';

import { useState } from 'react';
import { useLang } from '../../lib/i18n/context';
import { RefreshIcon, PhoneIcon, ShieldIcon } from '../../components/icons';

type EmbedPlatform = 'html' | 'wordpress' | 'wix' | 'webflow';

export default function EmbedWidgetSection({ profesionalId }: { profesionalId: string }) {
  const { t } = useLang();
  const d = t('dashboard');
  const [copied, setCopied]         = useState<string | null>(null);
  const [preview, setPreview]       = useState(false);
  const [platform, setPlatform]     = useState<EmbedPlatform>('html');
  const [iframeHeight, setIframeHeight] = useState(600);

  const origin     = typeof window !== 'undefined' ? window.location.origin : 'https://medisync-web.medisync.workers.dev';
  const widgetUrl  = `${origin}/widget/${profesionalId}`;

  const iframeSnippet = `<iframe
  src="${widgetUrl}"
  width="460"
  height="${iframeHeight}"
  frameborder="0"
  style="border-radius:16px;border:1px solid #e2e8f0;box-shadow:0 4px 24px rgba(0,0,0,.08);"
  title="Reservar turno"
></iframe>`;

  const PLATFORM_SNIPPETS: Record<EmbedPlatform, { label: string; code: string; instructions: readonly string[] }> = {
    html: {
      label: 'HTML',
      code: iframeSnippet,
      instructions: d.embedWidget.instructions.html,
    },
    wordpress: {
      label: 'WordPress',
      code: iframeSnippet,
      instructions: d.embedWidget.instructions.wordpress,
    },
    wix: {
      label: 'Wix',
      code: widgetUrl,
      instructions: [
        d.embedWidget.instructions.wix[0],
        d.embedWidget.instructions.wix[1],
        `<iframe src="${widgetUrl}" width="460" height="${iframeHeight}" frameborder="0" style="border-radius:16px"></iframe>`,
        d.embedWidget.instructions.wix[2],
      ],
    },
    webflow: {
      label: 'Webflow',
      code: iframeSnippet,
      instructions: d.embedWidget.instructions.webflow,
    },
  };

  const current = PLATFORM_SNIPPETS[platform];

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2500);
    });
  };

  return (
    <div className="mt-6 border border-slate-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
            {d.embedWidget.title}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {d.embedWidget.desc}
          </p>
        </div>
        <button
          onClick={() => setPreview(p => !p)}
          className="btn btn-secondary btn-sm shrink-0"
        >
          {preview ? d.embedWidget.hidePreview : d.embedWidget.showPreview}
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Direct link + copy URL */}
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-blue-800">{d.embedWidget.widgetUrl}</p>
            <p className="text-xs text-blue-700 truncate mt-0.5">{widgetUrl}</p>
          </div>
          <button
            onClick={() => copyText(widgetUrl, 'url')}
            className={`btn btn-sm shrink-0 transition-all ${copied === 'url' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'btn-secondary'}`}
          >
            {copied === 'url' ? d.embedWidget.copied : d.embedWidget.copyUrl}
          </button>
          <a href={widgetUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm shrink-0">
            {d.embedWidget.open}
          </a>
        </div>

        {/* Height customizer */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">{d.embedWidget.iframeHeight}</label>
          <input
            type="range" min={480} max={800} step={20}
            value={iframeHeight}
            onChange={e => setIframeHeight(Number(e.target.value))}
            className="flex-1 accent-blue-600"
          />
          <span className="text-xs font-mono text-slate-500 w-12 text-right">{iframeHeight}px</span>
        </div>

        {/* Platform tabs */}
        <div>
          <div className="flex gap-1 mb-3 bg-slate-100 rounded-xl p-1">
            {(Object.keys(PLATFORM_SNIPPETS) as EmbedPlatform[]).map(p => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  platform === p ? 'bg-white text-slate-800 dark:text-slate-200 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {PLATFORM_SNIPPETS[p].label}
              </button>
            ))}
          </div>

          {/* Code block */}
          <div className="relative">
            <pre className="bg-slate-900 text-emerald-400 text-xs rounded-xl p-4 overflow-x-auto leading-relaxed whitespace-pre-wrap break-all select-all">
{current.code}
            </pre>
            <button
              onClick={() => copyText(current.code, 'snippet')}
              className={`absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                copied === 'snippet'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
              }`}
            >
              {copied === 'snippet' ? d.embedWidget.copied : d.embedWidget.copyUrl.replace(' URL', '')}
            </button>
          </div>

          {/* Platform-specific instructions */}
          <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-amber-800 mb-1.5">
              {d.embedWidget.instructionsHTMLTitle.replace('HTML', current.label)}
            </p>
            <ol className="text-xs text-amber-700 space-y-1 list-decimal list-inside">
              {current.instructions.map((inst, i) => (
                <li key={i}>{inst}</li>
              ))}
            </ol>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-2 text-xs text-center text-slate-500">
          {[
            { icon: <RefreshIcon size={18} className="text-blue-600" />, text: d.embedWidget.syncsWithAgenda },
            { icon: <PhoneIcon size={18} className="text-blue-600" />, text: d.embedWidget.responsive },
            { icon: <ShieldIcon size={18} className="text-blue-600" />, text: d.embedWidget.noPatientReg },
          ].map(({ icon, text }) => (
            <div key={text} className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
              <div className="text-lg mb-1 inline-flex items-center justify-center">{icon}</div>
              <p>{text}</p>
            </div>
          ))}
        </div>

        {/* Inline preview */}
        {preview && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{d.embedWidget.livePreview}</p>
            <div className="flex justify-center">
              <iframe
                src={widgetUrl}
                width={460}
                height={iframeHeight}
                style={{ borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 24px rgba(0,0,0,.08)', maxWidth: '100%' }}
                title={d.embedWidget.previewTitle}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
