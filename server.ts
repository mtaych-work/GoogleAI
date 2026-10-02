import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Allow large payloads for high-resolution medical receipts
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API endpoint for OCR extraction
app.post('/api/extract-receipt', async (req, res) => {
  try {
    const { imageBase64, mimeType, defaultEmployeeName } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'No image data provided.' });
    }

    // Strip data URL prefix if present
    const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
    const cleanMimeType = mimeType || 'image/jpeg';

    const systemPrompt = `You are a medical claims OCR specialist.
Extract the key reimbursement and financial details from this medical receipt / tax invoice / clinic bill:
1. Name of Employee (Patient or employee name. ${
      defaultEmployeeName ? `If the receipt has no patient name or uses initials, you may reference '${defaultEmployeeName}'.` : ''
    })
2. Clinic name (Name of healthcare provider, doctor practice, medical center, or clinic)
3. Sub-Total (Pre-tax charge. If not explicitly itemized, calculate Grand Total minus GST, or if no tax exists, equal to Grand Total)
4. GST (Goods & Services Tax, VAT, or sales tax amount. Return 0 if 0% or zero)
5. Grand Total (Total final amount payable or settled)
6. Summary of illness (Reason for visit, clinical diagnosis, symptoms, or prescribed medication/procedure, e.g. "Acute Bronchitis & Cough", "Dental scaling & fluoride", "Gastric discomfort", "General consultation - fever")

Also capture:
- date: Date of visit / treatment / invoice date (YYYY-MM-DD format if possible, otherwise DD/MM/YYYY)
- receiptNumber: Invoice / Tax invoice / receipt reference number
- currency: The currency symbol or code (e.g. "$", "SGD", "USD", "MYR")

Ensure Sub-Total, GST, and Grand Total are valid numbers. If GST is inclusive or 0, reflect the exact breakdown accurately.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: cleanMimeType,
                data: cleanBase64,
              },
            },
            {
              text: systemPrompt,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            employeeName: {
              type: Type.STRING,
              description: 'Name of the employee or patient on the receipt',
            },
            clinicName: {
              type: Type.STRING,
              description: 'Name of clinic, hospital, dental clinic or healthcare center',
            },
            subTotal: {
              type: Type.NUMBER,
              description: 'Sub-total amount before tax or GST',
            },
            gst: {
              type: Type.NUMBER,
              description: 'GST, VAT or tax amount. 0 if none',
            },
            grandTotal: {
              type: Type.NUMBER,
              description: 'Final total amount paid/payable',
            },
            illnessSummary: {
              type: Type.STRING,
              description: 'Summary of illness, diagnosis, symptoms, or consultation description',
            },
            date: {
              type: Type.STRING,
              description: 'Date of visit or receipt in YYYY-MM-DD or standard format',
            },
            receiptNumber: {
              type: Type.STRING,
              description: 'Receipt or invoice number',
            },
            currency: {
              type: Type.STRING,
              description: 'Currency symbol or abbreviation, e.g. SGD, $, USD',
            },
            confidenceNotes: {
              type: Type.STRING,
              description: 'Short note if any data was ambiguous or auto-calculated',
            },
          },
          required: [
            'employeeName',
            'clinicName',
            'subTotal',
            'gst',
            'grandTotal',
            'illnessSummary',
          ],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('No response text received from Gemini OCR model.');
    }

    const parsedData = JSON.parse(text);

    // Sanitize numbers to 2 decimal places
    const subTotal = typeof parsedData.subTotal === 'number' ? Math.round(parsedData.subTotal * 100) / 100 : 0;
    const gst = typeof parsedData.gst === 'number' ? Math.round(parsedData.gst * 100) / 100 : 0;
    const grandTotal = typeof parsedData.grandTotal === 'number' ? Math.round(parsedData.grandTotal * 100) / 100 : subTotal + gst;

    return res.json({
      success: true,
      data: {
        employeeName: parsedData.employeeName?.trim() || defaultEmployeeName || 'Employee Name',
        clinicName: parsedData.clinicName?.trim() || 'Medical Clinic',
        subTotal,
        gst,
        grandTotal,
        illnessSummary: parsedData.illnessSummary?.trim() || 'Medical consultation',
        date: parsedData.date || new Date().toISOString().split('T')[0],
        receiptNumber: parsedData.receiptNumber || `REC-${Math.floor(100000 + Math.random() * 900000)}`,
        currency: parsedData.currency || '$',
        confidenceNotes: parsedData.confidenceNotes || '',
      },
    });
  } catch (error: any) {
    console.error('OCR Extraction error:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to extract receipt information using OCR.',
    });
  }
});

// Vite middleware in dev or static files in prod
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Medical cost submission server listening on http://0.0.0.0:${PORT}`);
});
