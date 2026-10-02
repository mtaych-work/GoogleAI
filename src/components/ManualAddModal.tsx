import React, { useState } from 'react';
import { X, Plus, Building2, User, Receipt, DollarSign, Calendar, FileText, Image as ImageIcon } from 'lucide-react';
import { MedicalRecord } from '../types/claim';

interface Props {
  isOpen: boolean;
  defaultEmployeeName: string;
  onClose: () => void;
  onAdd: (record: MedicalRecord) => void;
}

export const ManualAddModal: React.FC<Props> = ({
  isOpen,
  defaultEmployeeName,
  onClose,
  onAdd,
}) => {
  const [employeeName, setEmployeeName] = useState(defaultEmployeeName || '');
  const [clinicName, setClinicName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [subTotal, setSubTotal] = useState('');
  const [gst, setGst] = useState('');
  const [grandTotal, setGrandTotal] = useState('');
  const [illnessSummary, setIllnessSummary] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubTotalBlur = () => {
    const s = parseFloat(subTotal) || 0;
    const g = parseFloat(gst) || 0;
    if (s > 0 && !grandTotal) {
      setGrandTotal((s + g).toFixed(2));
    }
  };

  const handleGstBlur = () => {
    const s = parseFloat(subTotal) || 0;
    const g = parseFloat(gst) || 0;
    if (s > 0) {
      setGrandTotal((s + g).toFixed(2));
    }
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const st = parseFloat(subTotal) || 0;
    const g = parseFloat(gst) || 0;
    const gt = parseFloat(grandTotal) || st + g;

    const newRec: MedicalRecord = {
      id: `manual-${Date.now()}`,
      employeeName: employeeName.trim() || 'Employee Name',
      clinicName: clinicName.trim() || 'General Clinic',
      date,
      receiptNumber: receiptNumber.trim() || `MAN-${Date.now().toString().slice(-5)}`,
      subTotal: Math.round(st * 100) / 100,
      gst: Math.round(g * 100) / 100,
      grandTotal: Math.round(gt * 100) / 100,
      illnessSummary: illnessSummary.trim() || 'Medical Consultation',
      currency: '$',
      imageDataUrl: imagePreview || undefined,
      addedAt: new Date().toISOString(),
      status: 'manual',
    };

    onAdd(newRec);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-xl max-h-[92vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Add Medical Record Manually</h3>
            <p className="text-xs text-slate-500">Enter receipt and diagnosis details</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* 1. Name of Employee */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
              <User className="w-3.5 h-3.5 text-teal-600" />
              1. Name of Employee *
            </label>
            <input
              type="text"
              required
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              placeholder="e.g. Rachel Lim"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900"
            />
          </div>

          {/* 2. Clinic Name */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
              <Building2 className="w-3.5 h-3.5 text-teal-600" />
              2. Clinic Name *
            </label>
            <input
              type="text"
              required
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              placeholder="e.g. Mount Elizabeth Medical Centre"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900"
            />
          </div>

          {/* Date and Receipt No */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Date of Visit
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                <Receipt className="w-3.5 h-3.5 text-slate-500" />
                Receipt No.
              </label>
              <input
                type="text"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                placeholder="e.g. REC-58291"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
              />
            </div>
          </div>

          {/* Financials: 3. Sub-Total, 4. GST, 5. Grand Total */}
          <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                3. Sub-Total ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={subTotal}
                onChange={(e) => setSubTotal(e.target.value)}
                onBlur={handleSubTotalBlur}
                placeholder="0.00"
                className="w-full px-2.5 py-1.5 text-sm font-semibold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                4. GST ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={gst}
                onChange={(e) => setGst(e.target.value)}
                onBlur={handleGstBlur}
                placeholder="0.00"
                className="w-full px-2.5 py-1.5 text-sm font-semibold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-teal-900 mb-1">
                5. Grand Total ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={grandTotal}
                onChange={(e) => setGrandTotal(e.target.value)}
                placeholder="0.00"
                className="w-full px-2.5 py-1.5 text-sm font-bold border border-teal-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 bg-teal-50/60 text-teal-950"
              />
            </div>
          </div>

          {/* 6. Summary of illness */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
              <FileText className="w-3.5 h-3.5 text-teal-600" />
              6. Summary of Illness / Diagnosis *
            </label>
            <textarea
              rows={2}
              required
              value={illnessSummary}
              onChange={(e) => setIllnessSummary(e.target.value)}
              placeholder="e.g. Acute Gastritis / Eye infection / Consultation & Medication"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900"
            />
          </div>

          {/* Optional: Attach Receipt Image */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1">
              <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
              Attach Receipt Image (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageFile}
              className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
            />
            {imagePreview && (
              <div className="mt-2 w-20 h-20 rounded border border-slate-300 overflow-hidden">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
