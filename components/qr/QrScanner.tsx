'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Camera, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  // The last segment is the base URL
  if (trimmed.includes('|')) {
    const parts = trimmed.split('|');
    const lastPart = parts[parts.length - 1].trim();
    if (lastPart.startsWith('http')) return lastPart;

    // Or the QR itself is just chNFe and we need to build the URL
    const chNFe = parts[0];
    if (chNFe && chNFe.length === 44) {
      // Try to detect state from chNFe (first 2 digits are cUF)
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

  // Fallback: return as-is (the scraper will try to handle it)
  return trimmed;
}

export function QrScanner({ onCancel, onDecoded }: QrScannerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [decoded, setDecoded] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'pending' | 'denied' | 'granted'>('pending');

  function startScanner() {
    let stopped = false;

    async function init() {
      // Check camera permission proactively
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        // Immediately stop the probe stream
        stream.getTracks().forEach((t) => t.stop());
        setCameraPermission('granted');
      } catch (permErr) {
        setCameraPermission('denied');
        setError(
          'Permissão de câmera negada. Por favor, permita o acesso à câmera nas configurações do seu navegador e tente novamente.'
        );
        setLoading(false);
        return;
      }

      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (stopped || !videoRef.current) return;

        const scannerId = 'qr-scanner-container';
        const scanner = new Html5Qrcode(scannerId, { verbose: false });
        scannerRef.current = scanner;
        setLoading(false);

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: { width: 280, height: 280 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (!stopped) {
              stopped = true;
              const processedUrl = parseNfceQrContent(decodedText);
              setDecoded(processedUrl);
              scanner
                .stop()
                .then(() => onDecoded(processedUrl))
                .catch(() => onDecoded(processedUrl));
            }
          },
          undefined
        );
      } catch (err) {
        if (!stopped) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('notallowederror')) {
            setCameraPermission('denied');
            setError('Permissão de câmera negada. Verifique as configurações do seu navegador.');
          } else if (msg.toLowerCase().includes('notfounderror') || msg.toLowerCase().includes('no camera')) {
            setError('Nenhuma câmera encontrada neste dispositivo.');
          } else {
            setError(`Erro ao iniciar câmera: ${msg}`);
          }
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      stopped = true;
      const s = scannerRef.current as { stop?: () => Promise<void> } | null;
      if (s?.stop) s.stop().catch(() => {});
    };
  }

  useEffect(() => {
    const cleanup = startScanner();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleRetry() {
    setError(null);
    setLoading(true);
    const s = scannerRef.current as { stop?: () => Promise<void> } | null;
    if (s?.stop) {
      s.stop().catch(() => {}).finally(() => {
        scannerRef.current = null;
        startScanner();
      });
    } else {
      startScanner();
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-14 pb-4 bg-gradient-to-b from-black/80 to-transparent z-10">
        <div className="flex items-center gap-2">
          <Camera size={20} className="text-white" />
          <div>
            <span className="text-white font-semibold text-sm block">Escanear NFC-e</span>
            <span className="text-white/50 text-[10px]">Aponte para o QR Code da nota fiscal</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="text-white hover:bg-white/20 rounded-full"
        >
          <X size={20} />
        </Button>
      </div>

      {/* Scanner area — centered */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {loading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-20 bg-black/60">
            <Loader2 className="animate-spin text-white" size={40} />
            <p className="text-white/70 text-sm">
              {cameraPermission === 'pending' ? 'Solicitando permissão da câmera...' : 'Iniciando câmera...'}
            </p>
          </div>
        )}

        {error ? (
          <div className="flex flex-col items-center gap-5 px-8 text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertCircle size={32} className="text-red-400" />
            </div>
            <div>
              <p className="text-white font-semibold mb-2">Erro de câmera</p>
              <p className="text-red-300 text-sm leading-relaxed">{error}</p>
            </div>
            {cameraPermission !== 'denied' && (
              <Button
                onClick={handleRetry}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 gap-2"
              >
                <RefreshCw size={16} />
                Tentar novamente
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={onCancel}
              className="text-white/60 hover:text-white text-sm"
            >
              Voltar e colar o link manualmente
            </Button>
          </div>
        ) : (
          <div className="relative w-72 h-72 mx-auto">
            {/* Scanner div */}
            <div
              id="qr-scanner-container"
              ref={videoRef}
              className="w-full h-full rounded-2xl overflow-hidden"
            />

            {/* Scanning overlay with animated line */}
            {!loading && !decoded && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Corner guides */}
                <div className="absolute top-3 left-3 w-8 h-8 border-t-[3px] border-l-[3px] border-blue-400 rounded-tl-lg" />
                <div className="absolute top-3 right-3 w-8 h-8 border-t-[3px] border-r-[3px] border-blue-400 rounded-tr-lg" />
                <div className="absolute bottom-3 left-3 w-8 h-8 border-b-[3px] border-l-[3px] border-blue-400 rounded-bl-lg" />
                <div className="absolute bottom-3 right-3 w-8 h-8 border-b-[3px] border-r-[3px] border-blue-400 rounded-br-lg" />

                {/* Scanning line animation */}
                <div className="absolute left-4 right-4 h-0.5 bg-blue-400/70 shadow-[0_0_8px_2px_rgba(96,165,250,0.5)] animate-[scanline_2s_ease-in-out_infinite]" />
              </div>
            )}

            {/* Success overlay */}
            {decoded && (
              <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                <div className="bg-emerald-500 rounded-full w-14 h-14 flex items-center justify-center animate-in zoom-in-50 duration-200">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom instructions */}
      {!error && !decoded && (
        <div className="px-6 pb-14 pt-4 text-center bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-white/70 text-sm">
            Aponte a câmera para o <strong className="text-white">QR Code</strong> na parte inferior da nota fiscal
          </p>
          <p className="text-white/30 text-xs mt-2">
            Compatible com NFC-e de SC, SP, PR, RS, MG, RJ e outros estados
          </p>
        </div>
      )}

      {/* Scanning animation keyframes */}
      <style jsx>{`
        @keyframes scanline {
          0% { top: 16px; opacity: 1; }
          50% { top: calc(100% - 16px); opacity: 0.8; }
          100% { top: 16px; opacity: 1; }
        }
      `}</style>
    </div>
  );
}
