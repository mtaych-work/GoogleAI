import React from 'react';
import { Receipt, DollarSign, Percent, TrendingUp } from 'lucide-react';
import { MedicalRecord } from '../types/claim';

interface Props {
  records: MedicalRecord[];
}

export const StatsSummary: React.FC<Props> = ({ records }) => {
  const totalCount = records.length;
  const totalSubTotal = records.reduce((sum, r) => sum + (Number(r.subTotal) || 0), 0);
  const totalGST = records.reduce((sum, r) => sum + (Number(r.gst) || 0), 0);
  const totalGrandTotal = records.reduce((sum, r) => sum + (Number(r.grandTotal) || 0), 0);
  const avgClaim = totalCount > 0 ? totalGrandTotal / totalCount : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {/* 1. Total Records */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
          <Receipt className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Total Claims
          </p>
          <p className="text-xl font-bold text-slate-800">
            {totalCount} <span className="text-xs font-normal text-slate-600">records</span>
          </p>
        </div>
      </div>

      {/* 2. Total Sub-Total */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
          <DollarSign className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Sub-Total (Pre-Tax)
          </p>
          <p className="text-xl font-bold text-slate-800">
            ${totalSubTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* 3. Total GST */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
          <Percent className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            GST / Tax Total
          </p>
          <p className="text-xl font-bold text-slate-800">
            ${totalGST.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* 4. Grand Total */}
      <div className="bg-white rounded-xl p-4 border border-teal-200 bg-teal-50/20 shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-teal-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
            Grand Total (Payable)
          </p>
          <p className="text-xl font-extrabold text-teal-900">
            ${totalGrandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </div>
  );
};
