import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, X, RefreshCw, Utensils, Receipt, Trash2, Check, Plus } from 'lucide-react';
import { ScanMode } from '../types';

interface ScannerProps {
  mode: ScanMode;
  onImagesSelected: (files: File[]) => void;
  onCancel: () => void;
  isAnalyzing: boolean;
  onOpenHistory: () => void;
}

export const Scanner: React.FC<ScannerProps> = ({ mode, onImagesSelected, onCancel, isAnalyzing, onOpenHistory }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionError, setPermissionError] = useState(false);
  
  // Multi-image state
  const [capturedImages, setCapturedImages] = useState<{url: string, file: File}[]>([]);
  const [loadingMessage, setLoadingMessage] = useState("");

  const MAX_IMAGES = 5;

  useEffect(() => {
    if (!isAnalyzing) {
        startCamera();
    }
    return () => stopCamera();
  }, [isAnalyzing]);

  useEffect(() => {
    if (isAnalyzing) {
        const messages = mode === 'RECEIPT' ? [
            "Reading receipt...",
            "Identifying products...",
            "Checking nutrition db...",
            "Calculating health score..."
        ] : [
            "Reading menu...",
            "Identifying restaurant...",
            "Finding best dishes...",
            "Checking ingredients..."
        ];
        
        let i = 0;
        setLoadingMessage(messages[0]);
        const interval = setInterval(() => {
            i = (i + 1) % messages.length;
            if (i < messages.length) {
                setLoadingMessage(messages[i]);
            }
        }, 2500);
        return () => clearInterval(interval);
    }
  }, [isAnalyzing, mode]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setPermissionError(false);
    } catch (err) {
      console.error("Camera access denied:", err);
      setPermissionError(true);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (capturedImages.length >= MAX_IMAGES) return;

    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `captured_${Date.now()}.jpg`, { type: "image/jpeg" });
            const url = URL.createObjectURL(blob);
            setCapturedImages(prev => [...prev, { url, file }]);
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const removeImage = (index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleFinish = () => {
    if (capturedImages.length > 0) {
        stopCamera();
        onImagesSelected(capturedImages.map(img => img.file));
    }
  };

  if (isAnalyzing) {
      return (
          <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 text-center">
              <div className="w-24 h-24 mb-8 relative">
                  <div className="absolute inset-0 border-4 border-teal-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-teal-500 rounded-full border-t-transparent animate-spin"></div>
                  {mode === 'RECEIPT' ? 
                     <Receipt className="absolute inset-0 m-auto text-teal-600 animate-pulse" size={32} /> :
                     <Utensils className="absolute inset-0 m-auto text-teal-600 animate-pulse" size={32} />
                  }
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">{loadingMessage}</h2>
              <p className="text-gray-500 text-xs max-w-xs animate-pulse">
                Sourcing data via Google Gemini & Search Grounding...
              </p>
          </div>
      );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col">
      {/* Header */}
      <div className="p-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent absolute top-0 w-full z-10">
        <button onClick={onCancel} className="p-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition-colors">
          <X size={24} />
        </button>
        <span className="font-medium text-sm tracking-wider uppercase flex items-center gap-2">
            {mode === 'RECEIPT' ? <Receipt size={16}/> : <Utensils size={16}/>}
            {mode === 'RECEIPT' ? 'Scan Bill' : 'Scan Menu'}
        </span>
        <button onClick={onOpenHistory} className="text-xs font-bold bg-white/20 px-3 py-1.5 rounded-full hover:bg-white/30 backdrop-blur-md">
            History
        </button>
      </div>

      {/* Camera Viewport */}
      <div className="flex-1 relative bg-gray-900 overflow-hidden flex items-center justify-center">
        {!permissionError ? (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        ) : (
            <div className="text-center p-6">
                <Camera size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-gray-400 mb-4">Camera access unavailable.</p>
                <button onClick={() => fileInputRef.current?.click()} className="bg-teal-600 px-6 py-2 rounded-full font-medium">
                    Upload Photo Instead
                </button>
            </div>
        )}
        
        {/* Overlay Guides */}
        {!permissionError && (
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] border-2 border-white/30 rounded-3xl">
                    <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-teal-400 rounded-tl-xl"></div>
                    <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-teal-400 rounded-tr-xl"></div>
                    <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-teal-400 rounded-bl-xl"></div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-teal-400 rounded-br-xl"></div>
                </div>
            </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Thumbnails Gallery */}
      {capturedImages.length > 0 && (
          <div className="bg-black/80 backdrop-blur-md py-3 px-4 flex gap-3 overflow-x-auto z-20 border-t border-white/10">
              {capturedImages.map((img, idx) => (
                  <div key={idx} className="relative flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border border-white/30">
                      <img src={img.url} alt={`scan-${idx}`} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removeImage(idx)}
                        className="absolute top-0.5 right-0.5 bg-red-500/80 text-white p-0.5 rounded-full"
                      >
                          <X size={10} />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[8px] text-center text-white">
                          {idx + 1}
                      </div>
                  </div>
              ))}
              {capturedImages.length < MAX_IMAGES && (
                  <div className="flex-shrink-0 w-16 h-20 rounded-lg border border-dashed border-white/30 flex items-center justify-center text-white/50 text-xs">
                      {capturedImages.length}/{MAX_IMAGES}
                  </div>
              )}
          </div>
      )}

      {/* Controls */}
      <div className="bg-gray-900 pb-12 pt-6 px-8 flex justify-around items-center border-t border-gray-800 relative z-20">
        <input type="file" accept="image/*" multiple className="hidden" ref={fileInputRef} onChange={(e) => {
            if (e.target.files) {
                // Fix: explicit typing to avoid 'unknown' error with URL.createObjectURL
                const newFiles = Array.from(e.target.files).map((f: File) => ({ url: URL.createObjectURL(f), file: f }));
                setCapturedImages(prev => [...prev, ...newFiles].slice(0, MAX_IMAGES));
            }
        }} />
        
        {capturedImages.length > 0 ? (
            <>
                <button 
                    onClick={() => setCapturedImages([])}
                    className="p-4 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all flex flex-col items-center gap-1"
                >
                    <Trash2 size={24} />
                    <span className="text-[10px] font-medium">Clear</span>
                </button>
                
                <button 
                    onClick={handleFinish}
                    className="h-16 px-8 bg-teal-500 hover:bg-teal-400 rounded-full flex items-center gap-3 shadow-[0_0_20px_rgba(20,184,166,0.4)] transition-all transform hover:scale-105 active:scale-95"
                >
                    <span className="font-bold text-lg">Analyze ({capturedImages.length})</span>
                    <Check size={24} strokeWidth={3} />
                </button>
                
                <button 
                    onClick={handleCapture}
                    disabled={capturedImages.length >= MAX_IMAGES}
                    className={`p-4 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all flex flex-col items-center gap-1 ${capturedImages.length >= MAX_IMAGES ? 'opacity-30' : ''}`}
                >
                    <Plus size={24} />
                    <span className="text-[10px] font-medium">Add</span>
                </button>
            </>
        ) : (
            <>
                 <button className="p-4 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all flex flex-col items-center gap-1" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={24} />
                    <span className="text-[10px] font-medium">Upload</span>
                 </button>
                
                 <button onClick={handleCapture} disabled={permissionError} className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/10 backdrop-blur-sm shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-transform ${permissionError ? 'opacity-50 grayscale' : 'hover:scale-105 active:scale-95'}`}>
                    <div className="w-16 h-16 bg-white rounded-full"></div>
                 </button>
                
                 <button className="p-4 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all flex flex-col items-center gap-1 opacity-0 pointer-events-none">
                     <RefreshCw size={24} />
                 </button>
            </>
        )}
      </div>
    </div>
  );
};