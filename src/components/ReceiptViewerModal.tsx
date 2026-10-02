import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Download, ExternalLink } from 'lucide-react';
import { MedicalRecord } from '../types/claim';

interface Props {
  record: MedicalRecord | null;
  onClose: () => void;
}

export const ReceiptViewerModal: React.FC<Props> = ({ record, onClose }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!record || !record.imageDataUrl) return null;

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 3));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <span>Receipt Preview</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-medium">
                {record.receiptNumber || 'Receipt'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {record.clinicName} • {record.employeeName} • {record.date}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-slate-500 w-12 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleRotate}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors ml-1"
              title="Rotate 90°"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <a
              href={record.imageDataUrl}
              download={`${record.employeeName.replace(/\s+/g, '_')}_${record.clinicName.replace(/\s+/g, '_')}_receipt.png`}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
              title="Download original receipt image"
            >
              <Download className="w-4 h-4" />
            </a>

            <div className="h-4 w-px bg-slate-300 mx-1" />

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Display Area */}
        <div className="flex-1 overflow-auto bg-slate-900 flex items-center justify-center p-6 min-h-[420px]">
          <div
            className="transition-transform duration-150 ease-out origin-center"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
            }}
          >
            <img
              src={record.imageDataUrl}
              alt="Medical receipt"
              className="max-h-[70vh] w-auto object-contain rounded-lg shadow-2xl bg-white border border-slate-700 select-none"
            />
          </div>
        </div>

        {/* Footer with key extracted values for fast reference */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-slate-500">Employee: </span>
              <span className="font-semibold text-slate-800">{record.employeeName}</span>
            </div>
            <div>
              <span className="text-slate-500">Sub-Total: </span>
              <span className="font-semibold text-slate-800">${record.subTotal.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-500">GST: </span>
              <span className="font-semibold text-slate-800">${record.gst.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-500">Grand Total: </span>
              <span className="font-bold text-teal-700 text-sm">${record.grandTotal.toFixed(2)}</span>
            </div>
          </div>
          <div className="text-slate-600 truncate max-w-sm">
            <span className="text-slate-400">Diagnosis: </span>
            {record.illnessSummary}
          </div>
        </div>
      </div>
    </div>
  );
};
