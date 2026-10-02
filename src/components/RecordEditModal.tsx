import React, { useState, useEffect } from 'react';
import { X, Check, Calculator, AlertCircle, Building2, User, Receipt, DollarSign, Calendar, FileText, Trash2 } from 'lucide-react';
import { MedicalRecord } from '../types/claim';

interface Props {
  record: MedicalRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedRecord: MedicalRecord) => void;
  onDelete?: (id: string) => void;
}

export const RecordEditModal: React.FC<Props> = ({ record, isOpen, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState<MedicalRecord | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (record) {
      setFormData({ ...record });
    }
  }, [record]);

  if (!isOpen || !formData) return null;

  const handleChange = (field: keyof MedicalRecord, value: any) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleSubTotalChange = (val: string) => {
    const num = parseFloat(val) || 0;
    setFormData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        subTotal: num,
      };
    });
  };

  const handleGstChange = (val: string) => {
    const num = parseFloat(val) || 0;
    setFormData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        gst: num,
      };
    });
  };

  const handleGrandTotalChange = (val: string) => {
    const num = parseFloat(val) || 0;
    setFormData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        grandTotal: num,
      };
    });
  };

  const autoCalculateGrandTotal = () => {
    if (!formData) return;
    const computed = Math.round((Number(formData.subTotal || 0) + Number(formData.gst || 0)) * 100) / 100;
    setFormData((prev) => (prev ? { ...prev, grandTotal: computed } : null));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    onSave({
      ...formData,
      status: 'verified',
    });
    onClose();
  };

  const mathDiscrepancy = Math.abs(formData.grandTotal - (formData.subTotal + formData.gst)) > 0.05;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col md:flex-row w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Left Side: Receipt Image Preview if available */}
        {formData.imageDataUrl && (
          <div className="md:w-5/12 bg-slate-900 p-4 flex flex-col items-center justify-center border-r border-slate-200 overflow-hidden">
            <span className="text-xs text-slate-400 mb-2 font-medium tracking-wide uppercase">Original Receipt</span>
            <div className="relative w-full h-[360px] md:h-full flex items-center justify-center overflow-auto rounded-lg bg-slate-950/60 p-2">
              <img
                src={formData.imageDataUrl}
                alt="Receipt reference"
                className="max-h-full max-w-full object-contain rounded shadow"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2 text-center">
              Compare values directly against the original receipt.
            </p>
          </div>
        )}

        {/* Right Side: Edit Form */}
        <div className={`flex-1 flex flex-col overflow-y-auto ${formData.imageDataUrl ? 'md:w-7/12' : 'w-full'}`}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Edit Medical Claim Record</h3>
              <p className="text-xs text-slate-500">Review or correct extracted values</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Field 1: Name of Employee */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                <User className="w-3.5 h-3.5 text-teal-600" />
                1. Name of Employee *
              </label>
              <input
                type="text"
                required
                value={formData.employeeName}
                onChange={(e) => handleChange('employeeName', e.target.value)}
                placeholder="e.g. John Doe / Sarah Tan"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-900 bg-white"
              />
            </div>

            {/* Field 2: Clinic Name */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                <Building2 className="w-3.5 h-3.5 text-teal-600" />
                2. Clinic Name *
              </label>
              <input
                type="text"
                required
                value={formData.clinicName}
                onChange={(e) => handleChange('clinicName', e.target.value)}
                placeholder="e.g. Raffles Medical Clinic"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-900 bg-white"
              />
            </div>

            {/* Row: Date & Receipt Number */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Date of Visit
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 bg-white"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                  <Receipt className="w-3.5 h-3.5 text-slate-500" />
                  Receipt / Invoice No.
                </label>
                <input
                  type="text"
                  value={formData.receiptNumber || ''}
                  onChange={(e) => handleChange('receiptNumber', e.target.value)}
                  placeholder="e.g. REC-10294"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 bg-white"
                />
              </div>
            </div>

            {/* Financials: Sub-Total, GST, Grand Total */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Cost Breakdown ($)
                </span>
                <button
                  type="button"
                  onClick={autoCalculateGrandTotal}
                  className="inline-flex items-center gap-1 text-xs text-teal-700 hover:text-teal-800 font-medium bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded border border-teal-200 transition-colors"
                  title="Compute Grand Total = Sub-Total + GST"
                >
                  <Calculator className="w-3 h-3" />
                  Auto-Sum
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Field 3: Sub-Total */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    3. Sub-Total ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-mono">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.subTotal}
                      onChange={(e) => handleSubTotalChange(e.target.value)}
                      className="w-full pl-6 pr-2 py-1.5 text-sm font-semibold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                    />
                  </div>
                </div>

                {/* Field 4: GST */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    4. GST / Tax ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-mono">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.gst}
                      onChange={(e) => handleGstChange(e.target.value)}
                      className="w-full pl-6 pr-2 py-1.5 text-sm font-semibold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                    />
                  </div>
                </div>

                {/* Field 5: Grand Total */}
                <div>
                  <label className="block text-xs font-semibold text-teal-900 mb-1">
                    5. Grand Total ($) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs text-teal-600 font-mono font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.grandTotal}
                      onChange={(e) => handleGrandTotalChange(e.target.value)}
                      className="w-full pl-6 pr-2 py-1.5 text-sm font-bold border border-teal-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 bg-teal-50/50 text-teal-950"
                    />
                  </div>
                </div>
              </div>

              {mathDiscrepancy && (
                <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>
                    Note: Sub-Total (${formData.subTotal.toFixed(2)}) + GST (${formData.gst.toFixed(2)}) = ${(formData.subTotal + formData.gst).toFixed(2)}, which differs from Grand Total (${formData.grandTotal.toFixed(2)}). Click "Auto-Sum" if needed.
                  </span>
                </div>
              )}
            </div>

            {/* Field 6: Summary of illness */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                <FileText className="w-3.5 h-3.5 text-teal-600" />
                6. Summary of Illness / Diagnosis *
              </label>
              <textarea
                rows={3}
                required
                value={formData.illnessSummary}
                onChange={(e) => handleChange('illnessSummary', e.target.value)}
                placeholder="e.g. Acute Upper Respiratory Tract Infection (URTI) with cough and fever"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 bg-white"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200">
              {onDelete && formData && (
                <div>
                  {confirmDelete ? (
                    <div className="flex items-center gap-2 animate-in fade-in">
                      <span className="text-xs text-rose-700 font-medium">Delete record?</span>
                      <button
                        type="button"
                        onClick={() => {
                          onDelete(formData.id);
                          onClose();
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors cursor-pointer"
                      >
                        Yes, Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Claim
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
