'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QrScannerProps {
  onCancel: () => void;
  onDecoded: (text: string) => void;
}

export function QrScanner({ onCancel, onDecoded }: QrScannerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stopped = false;

    async function startScanner() {
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
            fps: 10,
            qrbox: { width: 260, height: 260 },
          },
          (decodedText) => {
            if (!stopped) {
              stopped = true;
              scanner.stop().then(() => onDecoded(decodedText)).catch(() => onDecoded(decodedText));
            }
          },
          undefined
        );
      } catch (_err) {
        if (!stopped) {
          setError('Não foi possível acessar a câmera. Verifique as permissões.');
          setLoading(false);
        }
      }
    }

    startScanner();

    return () => {
      stopped = true;
      const s = scannerRef.current as { stop?: () => Promise<void> } | null;
      if (s?.stop) s.stop().catch(() => {});
    };
  }, [onDecoded]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center gap-2">
          <Camera size={20} className="text-white" />
          <span className="text-white font-semibold text-sm">Escanear Nota Fiscal</span>
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

      {/* Scanner area */}
      <div className="relative w-full max-w-sm aspect-square flex items-center justify-center">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
            <Loader2 className="animate-spin text-white" size={36} />
            <p className="text-white/70 text-sm">Iniciando câmera...</p>
          </div>
        )}

        {error ? (
          <div className="flex flex-col items-center gap-4 px-6 text-center">
            <p className="text-red-400 text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={onCancel} className="border-white/20 text-white">
              Fechar
            </Button>
          </div>
        ) : (
          <>
            {/* Scanner element */}
            <div
              id="qr-scanner-container"
              ref={videoRef}
              className="w-full h-full rounded-2xl overflow-hidden"
            />
            {/* Corner guides */}
            {!loading && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-lg" />
                <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-lg" />
                <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-lg" />
                <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-lg" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Instructions */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-center">
        <p className="text-white/70 text-sm">
          Aponte a câmera para o QR Code da nota fiscal eletrônica
        </p>
        <p className="text-white/40 text-xs mt-1">
          Suporte: NFC-e Brasil (SC, SP, PR, RS, MG, RJ, etc.)
        </p>
      </div>
    </div>
  );
}
