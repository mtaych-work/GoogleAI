export interface SampleReceiptDef {
  id: string;
  name: string;
  clinic: string;
  employee: string;
  illness: string;
  date: string;
  receiptNo: string;
  items: { desc: string; amount: number }[];
  subTotal: number;
  gstRate: number; // e.g. 0.09
  gst: number;
  grandTotal: number;
}

export const SAMPLE_RECEIPTS: SampleReceiptDef[] = [
  {
    id: 'sample-1',
    name: 'GP Consultation & Meds (Raffles Medical)',
    clinic: 'Raffles Medical Clinic (City Hall)',
    employee: 'Marcus Chen',
    illness: 'Acute Upper Respiratory Tract Infection (URTI) with fever & pharyngitis',
    date: '2026-09-18',
    receiptNo: 'RAF-2026-98124',
    items: [
      { desc: 'Dr. Consultation (General Practice)', amount: 45.0 },
      { desc: 'Amoxicillin 500mg (14 caps)', amount: 16.5 },
      { desc: 'Paracetamol & Cough Mixture', amount: 8.5 },
    ],
    subTotal: 70.0,
    gstRate: 0.09,
    gst: 6.3,
    grandTotal: 76.3,
  },
  {
    id: 'sample-2',
    name: 'Dental Scaling & Checkup (Q&M Dental)',
    clinic: 'Q&M Dental Surgery (Orchard)',
    employee: 'Amanda Tan',
    illness: 'Routine Dental Scaling, Polishing and Topical Fluoride Treatment',
    date: '2026-09-24',
    receiptNo: 'QM-DT-44109',
    items: [
      { desc: 'Comprehensive Oral Exam & Checkup', amount: 30.0 },
      { desc: 'Ultrasonic Scaling & Prophy Polishing', amount: 95.0 },
      { desc: 'Clinical Infection Control & Sterilization', amount: 15.0 },
    ],
    subTotal: 140.0,
    gstRate: 0.09,
    gst: 12.6,
    grandTotal: 152.6,
  },
  {
    id: 'sample-3',
    name: 'Specialist Clinic & Pharmacy (Gleneagles)',
    clinic: 'Gleneagles Specialist Medical Centre',
    employee: 'David Wong',
    illness: 'Acute Gastritis with Epigastric Pain and Acid Reflux',
    date: '2026-09-29',
    receiptNo: 'GLN-SPEC-77312',
    items: [
      { desc: 'Specialist Consultation (Gastroenterology)', amount: 150.0 },
      { desc: 'Omeprazole 20mg & Gaviscon Suspension', amount: 48.0 },
      { desc: 'Clinical Assessment & Diagnostic Vitals', amount: 22.0 },
    ],
    subTotal: 220.0,
    gstRate: 0.09,
    gst: 19.8,
    grandTotal: 239.8,
  },
];

/**
 * Generates an authentic thermal/printed medical receipt on canvas and exports as base64 PNG data URL.
 */
export function generateSampleReceiptImage(def: SampleReceiptDef): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const width = 640;
    const height = 900;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      resolve('');
      return;
    }

    // Textured thermal paper background
    ctx.fillStyle = '#faf8f5';
    ctx.fillRect(0, 0, width, height);

    // Subtle paper edge border
    ctx.strokeStyle = '#e2ded5';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    // Header Banner
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';

    // Clinic name (Large Bold)
    ctx.font = 'bold 22px "Courier New", Courier, monospace';
    ctx.fillText(def.clinic.toUpperCase(), width / 2, 60);

    ctx.font = '13px "Courier New", Courier, monospace';
    ctx.fillStyle = '#475569';
    ctx.fillText('OFFICIAL TAX INVOICE & MEDICAL RECEIPT', width / 2, 85);
    ctx.fillText('Reg No / GST Reg: M2-0048192-X', width / 2, 105);

    // Dashed divider
    ctx.strokeStyle = '#94a3b8';
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(35, 125);
    ctx.lineTo(width - 35, 125);
    ctx.stroke();

    // Patient & Receipt Metadata
    ctx.textAlign = 'left';
    ctx.font = 'bold 15px "Courier New", Courier, monospace';
    ctx.fillStyle = '#1e293b';

    let y = 160;
    ctx.fillText(`PATIENT / EMPLOYEE : ${def.employee.toUpperCase()}`, 40, y);
    y += 28;
    ctx.fillText(`RECEIPT NO         : ${def.receiptNo}`, 40, y);
    y += 28;
    ctx.fillText(`DATE OF VISIT      : ${def.date}`, 40, y);
    y += 28;
    ctx.fillText(`PAYMENT MODE       : VISA / CORPORATE CARD (PAID)`, 40, y);

    y += 38;
    // Illness / Diagnosis section highlighted
    ctx.fillStyle = '#0f766e';
    ctx.font = 'bold 15px "Courier New", Courier, monospace';
    ctx.fillText('DIAGNOSIS / ILLNESS SUMMARY:', 40, y);
    y += 24;
    ctx.fillStyle = '#1e293b';
    ctx.font = '14px "Courier New", Courier, monospace';

    // Wrap illness summary if long
    const words = def.illness.split(' ');
    let currentLine = '';
    for (const w of words) {
      if ((currentLine + w).length > 45) {
        ctx.fillText(currentLine, 40, y);
        y += 22;
        currentLine = w + ' ';
      } else {
        currentLine += w + ' ';
      }
    }
    if (currentLine) {
      ctx.fillText(currentLine, 40, y);
      y += 28;
    }

    // Divider
    ctx.strokeStyle = '#64748b';
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(35, y);
    ctx.lineTo(width - 35, y);
    ctx.stroke();

    y += 28;
    // Itemized table header
    ctx.font = 'bold 14px "Courier New", Courier, monospace';
    ctx.fillStyle = '#334155';
    ctx.fillText('DESCRIPTION', 40, y);
    ctx.textAlign = 'right';
    ctx.fillText('AMOUNT ($)', width - 40, y);
    ctx.textAlign = 'left';

    y += 12;
    ctx.strokeStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(width - 40, y);
    ctx.stroke();

    y += 26;
    // Items
    ctx.font = '14px "Courier New", Courier, monospace';
    ctx.fillStyle = '#1e293b';
    for (const item of def.items) {
      ctx.fillText(item.desc, 40, y);
      ctx.textAlign = 'right';
      ctx.fillText(item.amount.toFixed(2), width - 40, y);
      ctx.textAlign = 'left';
      y += 28;
    }

    y += 10;
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(width - 40, y);
    ctx.stroke();
    ctx.setLineDash([]);

    y += 32;
    // Financial Breakdown exactly matching fields
    ctx.font = 'bold 16px "Courier New", Courier, monospace';
    ctx.fillText('SUB-TOTAL', 220, y);
    ctx.textAlign = 'right';
    ctx.fillText(`$${def.subTotal.toFixed(2)}`, width - 40, y);
    ctx.textAlign = 'left';

    y += 30;
    ctx.fillText(`GST (9%)`, 220, y);
    ctx.textAlign = 'right';
    ctx.fillText(`$${def.gst.toFixed(2)}`, width - 40, y);
    ctx.textAlign = 'left';

    y += 12;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(220, y);
    ctx.lineTo(width - 40, y);
    ctx.stroke();

    y += 32;
    ctx.font = 'bold 20px "Courier New", Courier, monospace';
    ctx.fillStyle = '#0f172a';
    ctx.fillText('GRAND TOTAL', 220, y);
    ctx.textAlign = 'right';
    ctx.fillText(`$${def.grandTotal.toFixed(2)}`, width - 40, y);
    ctx.textAlign = 'left';

    // Barcode / Footer stamp
    y += 60;
    ctx.textAlign = 'center';
    ctx.font = '12px "Courier New", Courier, monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText('* * * THANK YOU - GET WELL SOON * * *', width / 2, y);
    y += 24;
    ctx.fillText('Retain this slip for company health & insurance claim.', width / 2, y);

    // Barcode representation
    y += 30;
    ctx.fillStyle = '#334155';
    for (let x = 160; x < width - 160; x += 6) {
      const barW = Math.random() > 0.4 ? 3 : 1.5;
      ctx.fillRect(x, y, barW, 40);
    }
    y += 55;
    ctx.font = '11px monospace';
    ctx.fillText(def.receiptNo, width / 2, y);

    resolve(canvas.toDataURL('image/png'));
  });
}
