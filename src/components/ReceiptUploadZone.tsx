import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileImage,
  Sparkles,
  Camera,
  Loader2,
  AlertCircle,
  FileText,
  User,
  Zap,
} from 'lucide-react';
import { SAMPLE_RECEIPTS, generateSampleReceiptImage } from '../utils/sampleReceipts';

interface Props {
  onFilesSelected: (files: { file?: File; base64: string; mimeType: string; name: string }[]) => void;
  isProcessing: boolean;
  processingProgress?: { current: number; total: number; currentFileName?: string } | null;
  defaultEmployeeName: string;
  onDefaultEmployeeNameChange: (name: string) => void;
}

export const ReceiptUploadZone: React.FC<Props> = ({
  onFilesSelected,
  isProcessing,
  processingProgress,
  defaultEmployeeName,
  onDefaultEmployeeNameChange,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Paste from clipboard support
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageItems: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const blob = items[i].getAsFile();
          if (blob) imageItems.push(blob);
        }
      }

      if (imageItems.length > 0) {
        processFiles(imageItems);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Process files into base64
  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(
      (f) => f.type.startsWith('image/') || f.name.toLowerCase().endsWith('.png') || f.name.toLowerCase().endsWith('.jpg') || f.name.toLowerCase().endsWith('.jpeg') || f.name.toLowerCase().endsWith('.webp')
    );

    if (fileArray.length === 0) return;

    const payloadList: { file: File; base64: string; mimeType: string; name: string }[] = [];

    for (const file of fileArray) {
      const base64 = await readFileAsBase64(file);
      payloadList.push({
        file,
        base64,
        mimeType: file.type || 'image/jpeg',
        name: file.name,
      });
    }

    onFilesSelected(payloadList);
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Sample Receipt Loader
  const handleLoadSample = async (sampleId: string) => {
    const sample = SAMPLE_RECEIPTS.find((s) => s.id === sampleId);
    if (!sample) return;

    try {
      setIsGeneratingSample(true);
      const dataUrl = await generateSampleReceiptImage(sample);
      onFilesSelected([
        {
          base64: dataUrl,
          mimeType: 'image/png',
          name: `${sample.receiptNo}.png`,
        },
      ]);
    } catch (err) {
      console.error('Failed to generate sample receipt:', err);
    } finally {
      setIsGeneratingSample(false);
    }
  };

  // Camera integration
  const startCamera = async () => {
    try {
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      setCameraError('Unable to access camera or permission denied. Please select or drop an image file.');
      setTimeout(() => setCameraError(null), 5000);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      stopCamera();
      onFilesSelected([
        {
          base64: dataUrl,
          mimeType: 'image/jpeg',
          name: `camera_receipt_${Date.now()}.jpg`,
        },
      ]);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 mb-8 transition-all">
      {/* Top Bar inside Card: Default Employee Name & Sample Receipts */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <span className="absolute left-3 top-2.5 text-slate-400">
              <User className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={defaultEmployeeName}
              onChange={(e) => onDefaultEmployeeNameChange(e.target.value)}
              placeholder="Default Employee Name (optional)"
              className="w-full pl-9 pr-3 py-1.5 text-xs md:text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-800 bg-slate-50 hover:bg-white transition-colors"
            />
          </div>
          <span className="text-[11px] text-slate-600 hidden sm:inline whitespace-nowrap">
            (Autofills missing names)
          </span>
        </div>

        {/* Sample Receipts Quick Load */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Try Samples:
          </span>
          {SAMPLE_RECEIPTS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleLoadSample(sample.id)}
              disabled={isProcessing || isGeneratingSample}
              className="text-xs px-2.5 py-1 rounded-md font-medium text-slate-700 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 hover:border-teal-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={`Load sample bill for ${sample.clinic}`}
            >
              {sample.id === 'sample-1' && '1. GP & Meds'}
              {sample.id === 'sample-2' && '2. Dental Surgery'}
              {sample.id === 'sample-3' && '3. Specialist'}
            </button>
          ))}
        </div>
      </div>

      {cameraError && (
        <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <span>{cameraError}</span>
          <button
            onClick={() => setCameraError(null)}
            className="text-rose-500 hover:text-rose-700 font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Upload Dropzone or Camera View */}
      {cameraActive ? (
        <div className="mt-5 flex flex-col items-center bg-slate-900 rounded-xl p-4 text-white">
          <div className="relative w-full max-w-lg aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute inset-0 border-2 border-dashed border-teal-400/60 pointer-events-none m-4 rounded" />
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={capturePhoto}
              className="px-5 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-medium text-sm flex items-center gap-2 shadow"
            >
              <Camera className="w-4 h-4" /> Capture Receipt
            </button>
            <button
              onClick={stopCamera}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={`mt-5 relative border-2 border-dashed rounded-xl p-8 md:p-10 text-center cursor-pointer transition-all duration-200 ${
            isDragOver
              ? 'border-teal-500 bg-teal-50/70 scale-[0.99]'
              : 'border-slate-300 hover:border-teal-400 bg-slate-50/50 hover:bg-slate-50'
          } ${isProcessing ? 'pointer-events-none opacity-80' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                processFiles(e.target.files);
                e.target.value = ''; // reset so same file can be re-uploaded
              }
            }}
          />

          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-teal-200 animate-ping opacity-30" />
                <div className="w-14 h-14 rounded-full bg-teal-50 border-2 border-teal-500 flex items-center justify-center text-teal-600 shadow-inner">
                  <Sparkles className="w-7 h-7 animate-pulse" />
                </div>
              </div>
              <h4 className="text-base font-semibold text-slate-800">
                Scanning Medical Receipt with Gemini AI OCR...
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                {processingProgress
                  ? `Extracting receipt ${processingProgress.current} of ${processingProgress.total}: ${processingProgress.currentFileName || ''}`
                  : 'Analyzing clinic name, employee, sub-total, GST, grand total, and illness diagnosis...'}
              </p>
              <div className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden mt-4">
                <div className="w-full h-full bg-teal-600 rounded-full animate-pulse" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mb-3 shadow-xs">
                <UploadCloud className="w-7 h-7" />
              </div>

              <h4 className="text-base font-semibold text-slate-800 mb-1">
                Drop your medical receipt here, or <span className="text-teal-600 underline decoration-teal-300">browse files</span>
              </h4>
              <p className="text-xs text-slate-500 max-w-md">
                Supports single or multiple receipts (PNG, JPG, WEBP). You can also press <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-[11px] font-mono font-semibold text-slate-700">Ctrl+V</kbd> / <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-[11px] font-mono font-semibold text-slate-700">Cmd+V</kbd> to paste directly from your clipboard.
              </p>

              <div className="flex items-center gap-3 mt-4" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <FileImage className="w-3.5 h-3.5" />
                  Select Files
                </button>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5 text-slate-500" />
                  Take Photo
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Extracted Fields Hint Legend */}
      <div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
        <span className="font-semibold text-slate-600">Fields automatically extracted:</span>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="px-2 py-0.5 rounded bg-slate-100 font-medium">1. Name of Employee</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 font-medium">2. Clinic Name</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 font-medium">3. Sub-Total</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 font-medium">4. GST</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 font-medium">5. Grand Total</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 font-medium">6. Summary of Illness</span>
        </div>
      </div>
    </div>
  );
};
