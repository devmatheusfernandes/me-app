'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Link as LinkIcon, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NfcePreview } from './NfcePreview';
import { getCurrentMonthYear } from '@/lib/utils';
import { toast } from 'sonner';
import type { NfceScrapedResult } from '@/app/api/scrape-nfce/route';

export function NfcePageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const marketName = searchParams.get('market') || '';
  const targetMonth = searchParams.get('month') || getCurrentMonthYear();
  const withinMarketMode = searchParams.get('mode') === 'market';

  const [loading, setLoading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [scraped, setScraped] = useState<NfceScrapedResult | null>(null);

  async function processUrl(urlToProcess: string) {
    if (!urlToProcess.trim()) {
      toast.error('Informe uma URL válida');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/scrape-nfce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToProcess.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erro ao processar nota fiscal');
        setLoading(false);
        return;
      }
      setScraped(data as NfceScrapedResult);
    } catch {
      toast.error('Erro de conexão ao processar a nota.');
    } finally {
      setLoading(false);
    }
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    processUrl(urlInput);
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-lg font-bold text-white">Importar Nota Fiscal</h1>
          {withinMarketMode && marketName && (
            <p className="text-xs text-slate-500">{marketName}</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader2 size={36} className="animate-spin text-blue-400" />
            <p className="text-slate-400 text-sm">Processando dados...</p>
          </div>
        ) : scraped ? (
          <NfcePreview
            scraped={scraped}
            targetMonth={targetMonth}
            marketNameOverride={withinMarketMode ? marketName : undefined}
            withinMarketMode={withinMarketMode}
          />
        ) : (
          <div className="flex flex-col items-center justify-center pt-16 pb-12 gap-6 text-center max-w-md mx-auto">
            <div className="w-20 h-20 rounded-3xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-inner">
              <LinkIcon size={36} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Importar NFC-e</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                {withinMarketMode
                  ? 'Cole o link da nota fiscal (NFC-e) no campo abaixo para comparar e atualizar seus itens da lista.'
                  : 'Cole o link da nota fiscal eletrônica (NFC-e) no campo abaixo para importar todos os itens automaticamente.'}
              </p>
              <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-widest font-semibold">
                Suporte: SC, SP, PR, RS, MG, RJ, etc.
              </p>
            </div>

            {/* URL Input Form */}
            <form onSubmit={handleFormSubmit} className="w-full space-y-4 mt-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <LinkIcon size={16} />
                </div>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://sat.sef.sc.gov.br/..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
              <Button
                type="submit"
                disabled={!urlInput.trim()}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl py-3.5 shadow-lg shadow-blue-600/20 active:scale-98 transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                <Search size={16} className="mr-2" />
                Buscar Nota Fiscal
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
