import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Trash2,
  Edit2,
  Eye,
  Search,
  CheckSquare,
  Square,
  AlertTriangle,
  Plus,
  ArrowUpDown,
  Filter,
  Check,
  X,
  FileCheck,
} from 'lucide-react';
import { MedicalRecord } from '../types/claim';
import { exportClaimsToExcel } from '../utils/excelExport';

interface Props {
  records: MedicalRecord[];
  onUpdateRecord: (updatedRecord: MedicalRecord) => void;
  onDeleteRecord: (id: string) => void;
  onDeleteSelected: (ids: string[]) => void;
  onClearAll: () => void;
  onOpenManualAdd: () => void;
  onViewReceipt: (record: MedicalRecord) => void;
  onEditRecord: (record: MedicalRecord) => void;
}

export const ReceiptTable: React.FC<Props> = ({
  records,
  onUpdateRecord,
  onDeleteRecord,
  onDeleteSelected,
  onClearAll,
  onOpenManualAdd,
  onViewReceipt,
  onEditRecord,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<keyof MedicalRecord>('addedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Inline editing state: { recordId, field }
  const [inlineEdit, setInlineEdit] = useState<{ id: string; field: string } | null>(null);
  const [inlineValue, setInlineValue] = useState<string>('');

  // Custom in-app confirmation modal for deletion (avoids browser window.confirm being blocked in iframe)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'single' | 'selected' | 'all';
    id?: string;
    title: string;
    message: string;
  } | null>(null);

  // Filter & Sort
  const filteredRecords = useMemo(() => {
    let result = records.filter((rec) => {
      const q = searchQuery.toLowerCase();
      return (
        rec.employeeName.toLowerCase().includes(q) ||
        rec.clinicName.toLowerCase().includes(q) ||
        rec.illnessSummary.toLowerCase().includes(q) ||
        (rec.receiptNumber && rec.receiptNumber.toLowerCase().includes(q)) ||
        (rec.date && rec.date.includes(q))
      );
    });

    result.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      valA = String(valA || '').toLowerCase();
      valB = String(valB || '').toLowerCase();

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [records, searchQuery, sortField, sortDirection]);

  // Totals calculations
  const totalSubTotal = useMemo(
    () => filteredRecords.reduce((sum, r) => sum + (Number(r.subTotal) || 0), 0),
    [filteredRecords]
  );
  const totalGST = useMemo(
    () => filteredRecords.reduce((sum, r) => sum + (Number(r.gst) || 0), 0),
    [filteredRecords]
  );
  const totalGrandTotal = useMemo(
    () => filteredRecords.reduce((sum, r) => sum + (Number(r.grandTotal) || 0), 0),
    [filteredRecords]
  );

  // Sorting helper
  const handleSort = (field: keyof MedicalRecord) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Selection helpers
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredRecords.length && filteredRecords.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRecords.map((r) => r.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Inline edit handlers
  const startInlineEdit = (record: MedicalRecord, field: string, currentValue: any) => {
    setInlineEdit({ id: record.id, field });
    setInlineValue(String(currentValue ?? ''));
  };

  const saveInlineEdit = (record: MedicalRecord) => {
    if (!inlineEdit) return;

    let updatedValue: any = inlineValue;
    if (['subTotal', 'gst', 'grandTotal'].includes(inlineEdit.field)) {
      updatedValue = parseFloat(inlineValue) || 0;
      updatedValue = Math.round(updatedValue * 100) / 100;
    }

    onUpdateRecord({
      ...record,
      [inlineEdit.field]: updatedValue,
      status: 'verified',
    });
    setInlineEdit(null);
  };

  const cancelInlineEdit = () => {
    setInlineEdit(null);
    setInlineValue('');
  };

  // Excel Export
  const handleExportExcel = () => {
    const recordsToExport = selectedIds.length > 0
      ? records.filter((r) => selectedIds.includes(r.id))
      : records;

    const dateStr = new Date().toISOString().split('T')[0];
    exportClaimsToExcel(recordsToExport, `Medical_Cost_Claims_${dateStr}.xlsx`);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Table Header Controls */}
      <div className="p-4 md:p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Title & Count */}
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">Extracted Medical Claims</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-xs font-semibold">
              {records.length} {records.length === 1 ? 'record' : 'records'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Review, edit extracted information, or keep adding receipts before exporting.
          </p>
        </div>

        {/* Search, Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employee, clinic, illness..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Add Manual Record */}
          <button
            onClick={onOpenManualAdd}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
            title="Add a record manually"
          >
            <Plus className="w-3.5 h-3.5 text-teal-600" />
            Add Record
          </button>

          {/* Delete Selected (if any) */}
          {selectedIds.length > 0 && (
            <button
              onClick={() => {
                setDeleteConfirm({
                  type: 'selected',
                  title: 'Delete Selected Claims',
                  message: `Are you sure you want to delete ${selectedIds.length} selected medical claim record(s)?`,
                });
              }}
              className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 animate-in fade-in cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete ({selectedIds.length})
            </button>
          )}

          {/* Clear All button */}
          {records.length > 0 && (
            <button
              onClick={() => {
                setDeleteConfirm({
                  type: 'all',
                  title: 'Clear All Medical Claims',
                  message: 'Are you sure you want to remove all medical claim records from the table?',
                });
              }}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Clear all records"
            >
              Clear All
            </button>
          )}

          {/* Download XLSX Button */}
          <button
            onClick={handleExportExcel}
            disabled={records.length === 0}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all flex items-center gap-2"
            title="Download extracted records as Excel (.xlsx) file"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Download XLSX
            {selectedIds.length > 0 && (
              <span className="bg-emerald-800 text-emerald-100 px-1.5 py-0.2 rounded text-[10px]">
                {selectedIds.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Table Content */}
      {filteredRecords.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <h4 className="text-base font-semibold text-slate-700">No medical records yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            {records.length === 0
              ? 'Upload a medical receipt above or load a sample receipt to extract details using OCR.'
              : 'No records match your search criteria.'}
          </p>
          {records.length === 0 && (
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={onOpenManualAdd}
                className="px-4 py-2 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors"
              >
                + Add Record Manually
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-semibold select-none">
                {/* Checkbox */}
                <th className="py-3 px-3 w-10 text-center">
                  <button
                    onClick={handleToggleSelectAll}
                    className="p-1 text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    {selectedIds.length === filteredRecords.length && filteredRecords.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-teal-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>

                {/* Index & Receipt Preview */}
                <th className="py-3 px-2 w-12 text-center">#</th>
                <th className="py-3 px-2 w-16 text-center">Receipt</th>

                {/* 1. Name of Employee */}
                <th
                  onClick={() => handleSort('employeeName')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>1. Name of Employee</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {/* 2. Clinic Name */}
                <th
                  onClick={() => handleSort('clinicName')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>2. Clinic Name</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {/* Date */}
                <th
                  onClick={() => handleSort('date')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors w-24"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Date</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {/* 3. Sub-Total */}
                <th
                  onClick={() => handleSort('subTotal')}
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-200/60 transition-colors w-28"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>3. Sub-Total</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {/* 4. GST */}
                <th
                  onClick={() => handleSort('gst')}
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-200/60 transition-colors w-24"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>4. GST</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {/* 5. Grand Total */}
                <th
                  onClick={() => handleSort('grandTotal')}
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-200/60 transition-colors w-32"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>5. Grand Total</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {/* 6. Summary of illness */}
                <th className="py-3 px-3 min-w-[220px]">
                  <span>6. Summary of Illness</span>
                </th>

                {/* Actions */}
                <th className="py-3 px-3 text-center w-24">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((record, index) => {
                const isSelected = selectedIds.includes(record.id);
                const hasDiscrepancy =
                  Math.abs(record.grandTotal - (record.subTotal + record.gst)) > 0.05;

                return (
                  <tr
                    key={record.id}
                    className={`hover:bg-teal-50/30 transition-colors group ${
                      isSelected ? 'bg-teal-50/50' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleToggleSelectOne(record.id)}
                        className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-teal-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* # Index */}
                    <td className="py-3 px-2 text-center text-slate-600 font-mono text-[11px]">
                      {index + 1}
                    </td>

                    {/* Thumbnail / Receipt Viewer */}
                    <td className="py-3 px-2 text-center">
                      {record.imageDataUrl ? (
                        <button
                          onClick={() => onViewReceipt(record)}
                          className="relative inline-block w-8 h-9 rounded border border-slate-200 bg-white overflow-hidden shadow-2xs hover:ring-2 hover:ring-teal-500 transition-all cursor-pointer group/thumb"
                          title="Click to view full receipt image"
                        >
                          <img
                            src={record.imageDataUrl}
                            alt="thumb"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white transition-opacity">
                            <Eye className="w-3 h-3" />
                          </span>
                        </button>
                      ) : (
                        <span
                          className="inline-block p-1.5 text-slate-300"
                          title="No receipt image attached"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                        </span>
                      )}
                    </td>

                    {/* 1. Name of Employee (Click to edit or double click) */}
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {inlineEdit?.id === record.id && inlineEdit.field === 'employeeName' ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            autoFocus
                            value={inlineValue}
                            onChange={(e) => setInlineValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveInlineEdit(record);
                              if (e.key === 'Escape') cancelInlineEdit();
                            }}
                            className="px-2 py-1 text-xs border border-teal-500 rounded bg-white w-full focus:outline-none"
                          />
                          <button
                            onClick={() => saveInlineEdit(record)}
                            className="p-1 text-teal-600 hover:bg-teal-50 rounded"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={cancelInlineEdit}
                            className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() =>
                            startInlineEdit(record, 'employeeName', record.employeeName)
                          }
                          className="cursor-pointer hover:text-teal-700 hover:underline flex items-center gap-1.5"
                          title="Click to edit employee name"
                        >
                          <span>{record.employeeName}</span>
                          {record.status === 'verified' && (
                            <FileCheck className="w-3 h-3 text-teal-600 opacity-80" />
                          )}
                        </div>
                      )}
                    </td>

                    {/* 2. Clinic Name */}
                    <td className="py-3 px-3 text-slate-700">
                      {inlineEdit?.id === record.id && inlineEdit.field === 'clinicName' ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            autoFocus
                            value={inlineValue}
                            onChange={(e) => setInlineValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveInlineEdit(record);
                              if (e.key === 'Escape') cancelInlineEdit();
                            }}
                            className="px-2 py-1 text-xs border border-teal-500 rounded bg-white w-full focus:outline-none"
                          />
                          <button
                            onClick={() => saveInlineEdit(record)}
                            className="p-1 text-teal-600 hover:bg-teal-50 rounded"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={cancelInlineEdit}
                            className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() =>
                            startInlineEdit(record, 'clinicName', record.clinicName)
                          }
                          className="cursor-pointer hover:text-teal-700 hover:underline font-medium"
                          title="Click to edit clinic name"
                        >
                          {record.clinicName}
                        </div>
                      )}
                    </td>

                    {/* Date & Receipt # */}
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      <div>{record.date}</div>
                      {record.receiptNumber && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          {record.receiptNumber}
                        </div>
                      )}
                    </td>

                    {/* 3. Sub-Total */}
                    <td className="py-3 px-3 text-right font-mono text-slate-700">
                      {inlineEdit?.id === record.id && inlineEdit.field === 'subTotal' ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            step="0.01"
                            autoFocus
                            value={inlineValue}
                            onChange={(e) => setInlineValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveInlineEdit(record);
                              if (e.key === 'Escape') cancelInlineEdit();
                            }}
                            className="px-2 py-1 text-xs border border-teal-500 rounded bg-white w-20 text-right focus:outline-none"
                          />
                          <button
                            onClick={() => saveInlineEdit(record)}
                            className="p-0.5 text-teal-600"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span
                          onClick={() => startInlineEdit(record, 'subTotal', record.subTotal)}
                          className="cursor-pointer hover:text-teal-700 hover:underline font-semibold"
                          title="Click to edit sub-total"
                        >
                          ${record.subTotal.toFixed(2)}
                        </span>
                      )}
                    </td>

                    {/* 4. GST */}
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      {inlineEdit?.id === record.id && inlineEdit.field === 'gst' ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            step="0.01"
                            autoFocus
                            value={inlineValue}
                            onChange={(e) => setInlineValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveInlineEdit(record);
                              if (e.key === 'Escape') cancelInlineEdit();
                            }}
                            className="px-2 py-1 text-xs border border-teal-500 rounded bg-white w-20 text-right focus:outline-none"
                          />
                          <button
                            onClick={() => saveInlineEdit(record)}
                            className="p-0.5 text-teal-600"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span
                          onClick={() => startInlineEdit(record, 'gst', record.gst)}
                          className="cursor-pointer hover:text-teal-700 hover:underline font-medium"
                          title="Click to edit GST"
                        >
                          ${record.gst.toFixed(2)}
                        </span>
                      )}
                    </td>

                    {/* 5. Grand Total */}
                    <td className="py-3 px-3 text-right font-mono">
                      {inlineEdit?.id === record.id && inlineEdit.field === 'grandTotal' ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            step="0.01"
                            autoFocus
                            value={inlineValue}
                            onChange={(e) => setInlineValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveInlineEdit(record);
                              if (e.key === 'Escape') cancelInlineEdit();
                            }}
                            className="px-2 py-1 text-xs border border-teal-500 rounded bg-white w-24 text-right focus:outline-none font-bold"
                          />
                          <button
                            onClick={() => saveInlineEdit(record)}
                            className="p-0.5 text-teal-600"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <span
                            onClick={() =>
                              startInlineEdit(record, 'grandTotal', record.grandTotal)
                            }
                            className="cursor-pointer font-bold text-teal-900 bg-teal-50/80 px-2 py-0.5 rounded border border-teal-200/70 hover:bg-teal-100 transition-colors"
                            title="Click to edit grand total"
                          >
                            ${record.grandTotal.toFixed(2)}
                          </span>
                          {hasDiscrepancy && (
                            <span title="Discrepancy with Sub-Total + GST">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* 6. Summary of illness */}
                    <td className="py-3 px-3 text-slate-700">
                      {inlineEdit?.id === record.id && inlineEdit.field === 'illnessSummary' ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            autoFocus
                            value={inlineValue}
                            onChange={(e) => setInlineValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveInlineEdit(record);
                              if (e.key === 'Escape') cancelInlineEdit();
                            }}
                            className="px-2 py-1 text-xs border border-teal-500 rounded bg-white w-full focus:outline-none"
                          />
                          <button
                            onClick={() => saveInlineEdit(record)}
                            className="p-1 text-teal-600"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() =>
                            startInlineEdit(record, 'illnessSummary', record.illnessSummary)
                          }
                          className="cursor-pointer hover:text-teal-700 hover:underline line-clamp-2 max-w-sm"
                          title="Click to edit summary of illness"
                        >
                          <span className="inline-block bg-slate-100 hover:bg-slate-200 text-slate-800 px-2 py-0.5 rounded text-[11px] font-medium transition-colors">
                            {record.illnessSummary}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Actions: Edit modal & Delete */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onEditRecord(record)}
                          className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          title="Edit complete record"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {record.imageDataUrl && (
                          <button
                            onClick={() => onViewReceipt(record)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View receipt image"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setDeleteConfirm({
                              type: 'single',
                              id: record.id,
                              title: 'Delete Medical Claim',
                              message: `Are you sure you want to delete the medical claim for ${record.employeeName || 'Employee'} (${record.clinicName || 'Clinic'})?`,
                            });
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete this medical claim"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Table Footer with Summary Sums */}
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold text-slate-800">
                <td colSpan={5} className="py-3 px-4 text-slate-700 uppercase tracking-wider text-xs">
                  Summary Total ({filteredRecords.length} {filteredRecords.length === 1 ? 'record' : 'records'})
                </td>
                {/* Total Sub-Total */}
                <td className="py-3 px-3 text-right font-mono text-xs text-indigo-900">
                  ${totalSubTotal.toFixed(2)}
                </td>
                {/* Total GST */}
                <td className="py-3 px-3 text-right font-mono text-xs text-amber-900">
                  ${totalGST.toFixed(2)}
                </td>
                {/* Total Grand Total */}
                <td className="py-3 px-3 text-right font-mono text-sm text-teal-900 font-extrabold bg-teal-50/60">
                  ${totalGrandTotal.toFixed(2)}
                </td>
                <td colSpan={2} className="py-3 px-3 text-right text-slate-400 font-normal">
                  Ready for Excel Export
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0 text-rose-600">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">{deleteConfirm.title}</h4>
                <p className="text-xs text-slate-500">This action will remove the record</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              {deleteConfirm.message}
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteConfirm.type === 'single' && deleteConfirm.id) {
                    onDeleteRecord(deleteConfirm.id);
                  } else if (deleteConfirm.type === 'selected') {
                    onDeleteSelected(selectedIds);
                    setSelectedIds([]);
                  } else if (deleteConfirm.type === 'all') {
                    onClearAll();
                    setSelectedIds([]);
                  }
                  setDeleteConfirm(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
