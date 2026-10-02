export interface MedicalRecord {
  id: string;
  employeeName: string;
  clinicName: string;
  subTotal: number;
  gst: number;
  grandTotal: number;
  illnessSummary: string;
  date: string;
  receiptNumber?: string;
  currency?: string;
  imageDataUrl?: string; // stored for preview
  fileName?: string;
  addedAt: string;
  status: 'extracted' | 'verified' | 'manual';
  notes?: string;
}

export interface ExtractionResponse {
  employeeName: string;
  clinicName: string;
  subTotal: number;
  gst: number;
  grandTotal: number;
  illnessSummary: string;
  date?: string;
  receiptNumber?: string;
  currency?: string;
  confidenceNotes?: string;
}
