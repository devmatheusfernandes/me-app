'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BarcodeScannerProps {
  onCancel: () => void;
  onDecoded: (ean: string) => void;
}

export function BarcodeScanner({ onCancel, onDecoded }: BarcodeScannerProps) {
  const regionRef = useRef<HTMLDivElement | null>(null);
  const scannerRef = useRef<any>(null);
  const [msg, setMsg] = useState('Centralize o código de barras...');

  useEffect(() => {
    let cancelled = false;
    let scanner: any;

    (async () => {
      try {
        const mod = await import('html5-qrcode');
        if (cancelled || !regionRef.current) return;

        scanner = new mod.Html5Qrcode('barcode-region');
        scannerRef.current = scanner;

        // Configure to scan line barcodes (EAN_13 / EAN_8)
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: { width: 300, height: 150 }, // Aspect ratio for line barcodes
            formatsToSupport: [
              mod.Html5QrcodeSupportedFormats.EAN_13,
              mod.Html5QrcodeSupportedFormats.EAN_8,
            ],
          },
          async (decodedText: string) => {
            if (cancelled) return;
            cancelled = true;
            try {
              if (scanner) {
                await scanner.stop();
                scanner.clear();
                scannerRef.current = null;
              }
            } catch (err) {
              console.error('Error stopping barcode scanner:', err);
            }
            onDecoded(decodedText.trim());
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
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-3.5 text-slate-100 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10 pt-10">
        <div className="flex items-center gap-2">
          <Camera size={18} className="text-white" />
          <span className="text-sm font-semibold">Escanear Produto</span>
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

      {/* Main Scanner Section */}
      <div className="relative flex-1 flex flex-col items-center justify-center">
        <div className="relative w-80 h-44 mx-auto border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div id="barcode-region" ref={regionRef} className="absolute inset-0 w-full h-full" />
          
          {/* Target box for barcode alignment */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {/* Corner guides */}
            <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-blue-400 rounded-tl" />
            <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-blue-400 rounded-tr" />
            <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-blue-400 rounded-bl" />
            <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-blue-400 rounded-br" />
            
            {/* Center laser line */}
            <div className="absolute left-4 right-4 h-0.5 bg-blue-400/80 shadow-[0_0_8px_rgba(96,165,250,0.8)] animate-pulse" />
          </div>
        </div>
        
        <p className="text-sm text-slate-300 mt-6 font-medium px-4 text-center">{msg}</p>
      </div>

      {/* Footer Instructions */}
      <div className="p-6 text-center text-xs text-slate-500 bg-gradient-to-t from-black/80 to-transparent pb-10">
        Posicione o código de barras horizontalmente dentro da moldura azul.
      </div>
    </div>
  );
}
