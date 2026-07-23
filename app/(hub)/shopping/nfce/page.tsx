import { Suspense } from 'react';
import { NfcePageClient } from './_components/NfcePageClient';

export const metadata = {
  title: 'Importar Nota Fiscal — MeApp',
  description: 'Escanear e importar itens de uma nota fiscal eletrônica',
};

export default function NfcePage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Suspense fallback={<div className="flex-1 flex items-center justify-center"><p className="text-slate-400">Carregando...</p></div>}>
        <NfcePageClient />
      </Suspense>
    </div>
  );
}
