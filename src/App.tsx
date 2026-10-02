/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Stethoscope,
  Receipt,
  Sparkles,
  HelpCircle,
  FileCheck2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { MedicalRecord, ExtractionResponse } from './types/claim';
import { ReceiptUploadZone } from './components/ReceiptUploadZone';
import { ReceiptTable } from './components/ReceiptTable';
import { StatsSummary } from './components/StatsSummary';
import { RecordEditModal } from './components/RecordEditModal';
import { ReceiptViewerModal } from './components/ReceiptViewerModal';
import { ManualAddModal } from './components/ManualAddModal';
import { SAMPLE_RECEIPTS, generateSampleReceiptImage } from './utils/sampleReceipts';

const STORAGE_KEY = 'mediclaim_records_v1';
const EMPLOYEE_NAME_KEY = 'mediclaim_default_employee';

export default function App() {
  const [records, setRecords] = useState<MedicalRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load records from localStorage', e);
    }
    return [];
  });

  const [defaultEmployeeName, setDefaultEmployeeName] = useState<string>(() => {
    try {
      return localStorage.getItem(EMPLOYEE_NAME_KEY) || 'Sarah Tan';
    } catch {
      return 'Sarah Tan';
    }
  });

  // State for modals
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);
  const [viewingReceiptRecord, setViewingReceiptRecord] = useState<MedicalRecord | null>(null);
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);

  // Loading & Progress state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<{
    current: number;
    total: number;
    currentFileName?: string;
  } | null>(null);

  // Feedback toast
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    canUndo?: boolean;
  } | null>(null);

  // Backup for undo delete
  const [deletedBackup, setDeletedBackup] = useState<MedicalRecord[] | null>(null);

  // Persist records
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.warn('Could not save to localStorage (quota or disabled):', e);
    }
  }, [records]);

  // Persist default employee name
  useEffect(() => {
    try {
      localStorage.setItem(EMPLOYEE_NAME_KEY, defaultEmployeeName);
    } catch (e) {
      console.warn('Could not save employee name to localStorage:', e);
    }
  }, [defaultEmployeeName]);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' = 'success',
    canUndo = false
  ) => {
    setToast({ type, message, canUndo });
    setTimeout(() => {
      setToast(null);
    }, 5500);
  };

  const handleUndoDelete = () => {
    if (deletedBackup && deletedBackup.length > 0) {
      setRecords((prev) => [...deletedBackup, ...prev]);
      const count = deletedBackup.length;
      setDeletedBackup(null);
      showToast(`Restored ${count} medical claim(s)`, 'success');
    }
  };

  // Pre-seed sample data if user wants quick demonstration
  const handlePreloadDemoData = async () => {
    try {
      setIsProcessing(true);
      const newDemoRecords: MedicalRecord[] = [];

      for (let i = 0; i < SAMPLE_RECEIPTS.length; i++) {
        const sample = SAMPLE_RECEIPTS[i];
        setProcessingProgress({
          current: i + 1,
          total: SAMPLE_RECEIPTS.length,
          currentFileName: `${sample.clinic}.png`,
        });

        const dataUrl = await generateSampleReceiptImage(sample);
        newDemoRecords.push({
          id: `demo-${Date.now()}-${i}`,
          employeeName: sample.employee,
          clinicName: sample.clinic,
          subTotal: sample.subTotal,
          gst: sample.gst,
          grandTotal: sample.grandTotal,
          illnessSummary: sample.illness,
          date: sample.date,
          receiptNumber: sample.receiptNo,
          currency: '$',
          imageDataUrl: dataUrl,
          fileName: `${sample.receiptNo}.png`,
          addedAt: new Date(Date.now() - i * 86400000).toISOString(),
          status: 'verified',
        });
      }

      setRecords((prev) => [...prev, ...newDemoRecords]);
      showToast(`Added ${newDemoRecords.length} sample medical claim receipts!`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to load sample claims', 'error');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(null);
    }
  };

  // OCR Processing logic: Call /api/extract-receipt
  const handleFilesSelected = async (
    files: { file?: File; base64: string; mimeType: string; name: string }[]
  ) => {
    if (files.length === 0) return;

    setIsProcessing(true);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
      const fileItem = files[i];
      setProcessingProgress({
        current: i + 1,
        total: files.length,
        currentFileName: fileItem.name,
      });

      try {
        const response = await fetch('/api/extract-receipt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageBase64: fileItem.base64,
            mimeType: fileItem.mimeType,
            defaultEmployeeName,
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || `Server returned status ${response.status}`);
        }

        const data: ExtractionResponse = result.data;

        const newRecord: MedicalRecord = {
          id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          employeeName: data.employeeName || defaultEmployeeName || 'Employee Name',
          clinicName: data.clinicName || 'Clinic',
          subTotal: Number(data.subTotal) || 0,
          gst: Number(data.gst) || 0,
          grandTotal: Number(data.grandTotal) || (Number(data.subTotal) || 0) + (Number(data.gst) || 0),
          illnessSummary: data.illnessSummary || 'Consultation & Medication',
          date: data.date || new Date().toISOString().split('T')[0],
          receiptNumber: data.receiptNumber || `REC-${Math.floor(10000 + Math.random() * 90000)}`,
          currency: data.currency || '$',
          imageDataUrl: fileItem.base64,
          fileName: fileItem.name,
          addedAt: new Date().toISOString(),
          status: 'extracted',
          notes: data.confidenceNotes,
        };

        setRecords((prev) => [newRecord, ...prev]);
        successCount++;
      } catch (err: any) {
        console.error('Failed to extract receipt:', fileItem.name, err);
        failCount++;
      }
    }

    setIsProcessing(false);
    setProcessingProgress(null);

    if (successCount > 0 && failCount === 0) {
      showToast(
        successCount === 1
          ? 'Medical receipt extracted and added to table!'
          : `Successfully extracted ${successCount} receipts!`,
        'success'
      );
    } else if (successCount > 0 && failCount > 0) {
      showToast(
        `Extracted ${successCount} receipts (${failCount} failed to process)`,
        'info'
      );
    } else if (failCount > 0) {
      showToast(
        'Could not extract receipt. You can add it manually or try another image.',
        'error'
      );
    }
  };

  // Table action handlers
  const handleUpdateRecord = (updated: MedicalRecord) => {
    setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    showToast('Record updated successfully', 'success');
  };

  const handleDeleteRecord = (id: string) => {
    const toDelete = records.find((r) => r.id === id);
    if (!toDelete) return;
    setDeletedBackup([toDelete]);
    setRecords((prev) => prev.filter((r) => r.id !== id));
    showToast(`Deleted claim for ${toDelete.employeeName || 'employee'}`, 'info', true);
  };

  const handleDeleteSelected = (ids: string[]) => {
    const toDelete = records.filter((r) => ids.includes(r.id));
    if (toDelete.length === 0) return;
    setDeletedBackup(toDelete);
    setRecords((prev) => prev.filter((r) => !ids.includes(r.id)));
    showToast(`Deleted ${ids.length} medical claims`, 'info', true);
  };

  const handleClearAll = () => {
    if (records.length === 0) return;
    setDeletedBackup([...records]);
    setRecords([]);
    showToast('All medical claims cleared from table', 'info', true);
  };

  const handleAddManualRecord = (newRec: MedicalRecord) => {
    setRecords((prev) => [newRec, ...prev]);
    showToast('Manual medical claim record added', 'success');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans selection:bg-teal-100 selection:text-teal-900">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-top-3 duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : toast.type === 'error'
                ? 'bg-rose-50 text-rose-900 border-rose-300'
                : 'bg-blue-50 text-blue-900 border-blue-300'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            ) : (
              <HelpCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
            )}
            <span>{toast.message}</span>
            {toast.canUndo && deletedBackup && deletedBackup.length > 0 && (
              <button
                type="button"
                onClick={handleUndoDelete}
                className="ml-2 px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition-colors cursor-pointer shadow-xs"
              >
                Undo
              </button>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-700 to-teal-500 text-white flex items-center justify-center shadow-md">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base md:text-lg font-extrabold text-slate-900 tracking-tight">
                  MediClaim
                </h1>
                <span className="hidden sm:inline px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200">
                  OCR Cost Submission
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Automated medical receipt extraction &amp; Excel XLSX submission
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5">
            {records.length === 0 && (
              <button
                onClick={handlePreloadDemoData}
                disabled={isProcessing}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors"
                title="Populate table with 3 realistic sample medical claims"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Load Sample Claims
              </button>
            )}

            <button
              onClick={() => setIsManualAddOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Record</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 md:py-8">
        {/* Intro Banner */}
        <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-gradient-to-r from-teal-900 to-slate-900 text-white p-5 md:p-6 rounded-2xl shadow-sm">
          <div>
            <h2 className="text-lg md:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Medical Cost Submission &amp; OCR</span>
            </h2>
            <p className="text-xs md:text-sm text-teal-100/90 mt-1 max-w-2xl leading-relaxed">
              Upload or drag &amp; drop medical clinic receipts. The OCR automatically extracts{' '}
              <strong className="text-white font-semibold">1. Name of Employee</strong>,{' '}
              <strong className="text-white font-semibold">2. Clinic name</strong>,{' '}
              <strong className="text-white font-semibold">3. Sub-Total</strong>,{' '}
              <strong className="text-white font-semibold">4. GST</strong>,{' '}
              <strong className="text-white font-semibold">5. Grand Total</strong>, and{' '}
              <strong className="text-white font-semibold">6. Summary of illness</strong>.
              Keep adding records and export directly to Microsoft Excel (.xlsx).
            </p>
          </div>

          {records.length === 0 && (
            <button
              onClick={handlePreloadDemoData}
              disabled={isProcessing}
              className="mt-2 md:mt-0 flex-shrink-0 px-4 py-2 text-xs font-bold text-teal-950 bg-teal-300 hover:bg-teal-200 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-teal-950" />
              Try With Sample Receipts
            </button>
          )}
        </div>

        {/* Stats Metrics Bar */}
        <StatsSummary records={records} />

        {/* Upload & OCR Zone */}
        <ReceiptUploadZone
          onFilesSelected={handleFilesSelected}
          isProcessing={isProcessing}
          processingProgress={processingProgress}
          defaultEmployeeName={defaultEmployeeName}
          onDefaultEmployeeNameChange={setDefaultEmployeeName}
        />

        {/* Extracted Records Table */}
        <ReceiptTable
          records={records}
          onUpdateRecord={handleUpdateRecord}
          onDeleteRecord={handleDeleteRecord}
          onDeleteSelected={handleDeleteSelected}
          onClearAll={handleClearAll}
          onOpenManualAdd={() => setIsManualAddOpen(true)}
          onViewReceipt={(rec) => setViewingReceiptRecord(rec)}
          onEditRecord={(rec) => setEditingRecord(rec)}
        />
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>MediClaim Portal • Medical Expense Reimbursement System</span>
          <span className="text-slate-400">
            Compliant with GST &amp; corporate insurance itemization standards
          </span>
        </div>
      </footer>

      {/* Modals */}
      <RecordEditModal
        record={editingRecord}
        isOpen={Boolean(editingRecord)}
        onClose={() => setEditingRecord(null)}
        onSave={handleUpdateRecord}
        onDelete={handleDeleteRecord}
      />

      <ReceiptViewerModal
        record={viewingReceiptRecord}
        onClose={() => setViewingReceiptRecord(null)}
      />

      <ManualAddModal
        isOpen={isManualAddOpen}
        defaultEmployeeName={defaultEmployeeName}
        onClose={() => setIsManualAddOpen(false)}
        onAdd={handleAddManualRecord}
      />
    </div>
  );
}
