'use client';

import { useEffect, useRef, useState } from 'react';

interface QrScannerProps {
  onCancel: () => void;
  onDecoded: (text: string) => void;
}

/** Parse QR code content from NFC-e — some QR codes are not plain URLs */
function parseNfceQrContent(raw: string): string {
  const trimmed = raw.trim();

  // Already a valid URL — pass through
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Some NFC-e QR codes use the format: "chNFe|nVersao|tpAmb|cDest|dhEmi|vNF|vICMS|digVal|url"
  if (trimmed.includes('|')) {
    const parts = trimmed.split('|');
    const lastPart = parts[parts.length - 1].trim();
    if (lastPart.startsWith('http')) return lastPart;

    // Or the QR itself is just chNFe and we need to build the URL
    const chNFe = parts[0];
    if (chNFe && chNFe.length === 44) {
      const stateUrls: Record<string, string> = {
        '41': `https://www.nfce.fazenda.pr.gov.br/nfce/consulta?p=${encodeURIComponent(trimmed)}`,
        '43': `https://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx?p=${encodeURIComponent(trimmed)}`,
        '35': `https://www.nfce.fazenda.sp.gov.br/NFCeConsultaPublica/Paginas/ConsultaQRCode.aspx?p=${encodeURIComponent(trimmed)}`,
        '31': `https://portalsped.fazenda.mg.gov.br/portalnfce/sistema/qrcode.xhtml?p=${encodeURIComponent(trimmed)}`,
        '33': `https://notacarioca.rio.rj.gov.br/nfceweb/consulta.aspx?p=${encodeURIComponent(trimmed)}`,
        '42': `https://sat.sef.sc.gov.br/nfce/consulta?p=${encodeURIComponent(trimmed)}`,
        '29': `https://nfe.sefaz.ba.gov.br/servicos/nfce/default.aspx?p=${encodeURIComponent(trimmed)}`,
        '26': `https://nfce.sefaz.pe.gov.br/nfce-web/consultarNFCe?p=${encodeURIComponent(trimmed)}`,
      };
      const cUF = chNFe.substring(0, 2);
      if (stateUrls[cUF]) return stateUrls[cUF];

      // Generic ENCAT URL
      return `https://dfe-portal.svrs.rs.gov.br/Nfce/QrCode?p=${encodeURIComponent(trimmed)}`;
    }
  }

  return trimmed;
}

export function QrScanner({ onCancel, onDecoded }: QrScannerProps) {
  const regionRef = useRef<HTMLDivElement | null>(null);
  const scannerRef = useRef<any>(null);
  const [msg, setMsg] = useState('Procurando QR Code...');

  useEffect(() => {
    let cancelled = false;
    let scanner: any;

    (async () => {
      try {
        const mod = await import('html5-qrcode');
        if (cancelled || !regionRef.current) return;
        scanner = new mod.Html5Qrcode('qr-region');
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 260, height: 260 } },
          async (decodedText: string) => {
            if (cancelled) return;
            cancelled = true;
            try {
              if (scanner) {
                await scanner.stop();
                scanner.clear();
              }
            } catch (err) {
              console.error('Error stopping scanner:', err);
            }
            onDecoded(parseNfceQrContent(decodedText));
          },
          () => {}
        );
      } catch (e: any) {
        setMsg(
          e?.message?.includes('Permission')
            ? 'Permissão de câmera negada.'
            : 'Não foi possível abrir a câmera.'
        );
      }
    })();

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      if (s) {
        s.stop()
          .then(() => s.clear())
          .catch(() => {});
      }
    };
  }, [onDecoded]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3 text-slate-100">
        <button
          onClick={onCancel}
          className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur"
        >
          Cancelar
        </button>
        <span className="text-sm text-slate-300">{msg}</span>
        <span className="w-16" />
      </div>
      <div className="relative flex-1">
        <div id="qr-region" ref={regionRef} className="absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-64 w-64 rounded-2xl border-2 border-teal-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]" />
        </div>
      </div>
      <div className="p-4 text-center text-xs text-slate-400">
        Alinhe o QR Code dentro da moldura
      </div>
    </div>
  );
}
