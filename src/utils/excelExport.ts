import * as XLSX from 'xlsx';
import { MedicalRecord } from '../types/claim';

export function exportClaimsToExcel(records: MedicalRecord[], fileName: string = 'Medical_Cost_Claims.xlsx') {
  if (records.length === 0) return;

  // Calculate totals
  const totalSubTotal = records.reduce((sum, r) => sum + (Number(r.subTotal) || 0), 0);
  const totalGST = records.reduce((sum, r) => sum + (Number(r.gst) || 0), 0);
  const totalGrandTotal = records.reduce((sum, r) => sum + (Number(r.grandTotal) || 0), 0);

  // Construct table rows for Excel
  const rows: (string | number)[][] = [
    // Header title
    ['COMPANY MEDICAL CLAIMS & COST SUBMISSION REPORT'],
    [`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`],
    [`Total Claim Records: ${records.length}`],
    [], // Blank line
    // Column Headers exactly as requested by user
    [
      'No.',
      'Name of Employee',
      'Clinic Name',
      'Date of Visit',
      'Receipt / Invoice No.',
      'Sub-Total ($)',
      'GST ($)',
      'Grand Total ($)',
      'Summary of Illness / Diagnosis',
      'Status',
    ],
  ];

  // Add data rows
  records.forEach((record, index) => {
    rows.push([
      index + 1,
      record.employeeName || 'N/A',
      record.clinicName || 'N/A',
      record.date || 'N/A',
      record.receiptNumber || 'N/A',
      Number(record.subTotal.toFixed(2)),
      Number(record.gst.toFixed(2)),
      Number(record.grandTotal.toFixed(2)),
      record.illnessSummary || 'N/A',
      record.status.toUpperCase(),
    ]);
  });

  // Add Summary Total row
  rows.push([]);
  rows.push([
    '',
    'TOTAL SUMMARY',
    '',
    '',
    '',
    Number(totalSubTotal.toFixed(2)),
    Number(totalGST.toFixed(2)),
    Number(totalGrandTotal.toFixed(2)),
    `${records.length} claim(s) processed`,
    '',
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths for clean readability in Excel
  worksheet['!cols'] = [
    { wch: 6 },  // No.
    { wch: 24 }, // Name of Employee
    { wch: 28 }, // Clinic Name
    { wch: 14 }, // Date of Visit
    { wch: 20 }, // Receipt / Invoice No.
    { wch: 14 }, // Sub-Total
    { wch: 12 }, // GST
    { wch: 16 }, // Grand Total
    { wch: 36 }, // Summary of Illness
    { wch: 12 }, // Status
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Medical Claims');

  // Trigger file download in browser
  XLSX.writeFile(workbook, fileName);
}
