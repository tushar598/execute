import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { jsPDF } from 'jspdf';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */
interface MonthlyRow {
    month: string;
    temp_max: number;
    temp_min: number;
    rainfall_mm: number;
    humidity_pct: number;
}

interface YearRecord {
    year: number;
    avg_temp: number;
    total_rainfall: number;
    avg_humidity: number;
    carbon_seq_estimate: number; // tCO₂e/ha
    monthly: MonthlyRow[];
}

/* ------------------------------------------------------------------ */
/*  Mock data generator (fallback)                                      */
/* ------------------------------------------------------------------ */
function generateMockData(lat: number, lng: number): YearRecord[] {
    const currentYear = new Date().getFullYear();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Use lat/lng as seed for deterministic variance
    const seed = Math.abs(lat + lng);
    const base_temp = 20 + (seed % 10) - 5;
    const base_rain = 80 + (seed % 40);

    return [-3, -2, -1, 0].map(offset => {
        const year = currentYear + offset;
        const yearVariance = (year % 3) * 0.4;

        const monthly: MonthlyRow[] = months.map((month, i) => {
            const seasonFactor = Math.sin((i / 12) * 2 * Math.PI);
            return {
                month,
                temp_max: parseFloat((base_temp + 8 + seasonFactor * 6 + yearVariance).toFixed(1)),
                temp_min: parseFloat((base_temp - 4 + seasonFactor * 4 + yearVariance).toFixed(1)),
                rainfall_mm: parseFloat((Math.max(0, base_rain + seasonFactor * 60 + (i % 3) * 10)).toFixed(1)),
                humidity_pct: parseFloat((60 + seasonFactor * 20 + (i % 4) * 2).toFixed(1)),
            };
        });

        const avg_temp = parseFloat((monthly.reduce((s, m) => s + (m.temp_max + m.temp_min) / 2, 0) / 12).toFixed(1));
        const total_rainfall = parseFloat(monthly.reduce((s, m) => s + m.rainfall_mm, 0).toFixed(1));
        const avg_humidity = parseFloat((monthly.reduce((s, m) => s + m.humidity_pct, 0) / 12).toFixed(1));
        const carbon_seq_estimate = parseFloat((1.8 + (avg_humidity / 100) * 0.9 + yearVariance * 0.2).toFixed(2));

        return { year, avg_temp, total_rainfall, avg_humidity, carbon_seq_estimate, monthly };
    });
}

/* ------------------------------------------------------------------ */
/*  Gemini data fetcher                                                 */
/* ------------------------------------------------------------------ */
async function fetchFromGemini(lat: number, lng: number): Promise<YearRecord[]> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not set');

    const ai = new GoogleGenAI({ apiKey });
    const currentYear = new Date().getFullYear();

    const prompt = `You are a climate data scientist. Provide historical climate data for the location at latitude ${lat}, longitude ${lng} for the years ${currentYear - 3} to ${currentYear}.

Return ONLY a valid JSON array (no markdown, no explanation) with this exact structure for each year:
[
  {
    "year": <number>,
    "avg_temp": <number in Celsius>,
    "total_rainfall": <number in mm>,
    "avg_humidity": <number in percentage>,
    "carbon_seq_estimate": <estimated tCO2e per hectare>,
    "monthly": [
      { "month": "Jan", "temp_max": <number>, "temp_min": <number>, "rainfall_mm": <number>, "humidity_pct": <number> },
      ... (all 12 months)
    ]
  }
]

Base the data on the actual climate characteristics of that geographic location. Provide realistic, scientifically plausible values based on the region's climate zone, elevation, and proximity to water bodies.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
    });

    const text = response.text ?? '';

    // Strip markdown code fences if any
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean) as YearRecord[];

    // Basic structure validation
    if (!Array.isArray(parsed) || parsed.length === 0 || !parsed[0].monthly) {
        throw new Error('Invalid Gemini response structure');
    }

    return parsed;
}

/* ------------------------------------------------------------------ */
/*  PDF builder                                                          */
/* ------------------------------------------------------------------ */
function buildPDF(records: YearRecord[], lat: number, lng: number, isAI: boolean): string {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = margin;

    const colPrimary = [22, 101, 52] as [number, number, number];   // emerald-800
    const colAccent = [74, 222, 128] as [number, number, number];  // emerald-400
    const colGray = [100, 116, 139] as [number, number, number]; // slate-500
    const colLight = [241, 245, 249] as [number, number, number]; // slate-100

    /* Header -------------------------------------------------------- */
    doc.setFillColor(...colPrimary);
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('Grento Climate Intelligence Report', margin, 12);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Location: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E  |  Generated: ${new Date().toLocaleDateString('en-IN')}  |  Source: ${isAI ? 'Gemini AI' : 'Mocked Reference Data'}`, margin, 21);

    y = 36;

    /* Summary box --------------------------------------------------- */
    const last = records[records.length - 1];
    const first = records[0];
    const tempTrend = (last.avg_temp - first.avg_temp).toFixed(1);
    const rainTrend = (last.total_rainfall - first.total_rainfall).toFixed(1);

    doc.setFillColor(...colLight);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 22, 3, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...colGray);
    doc.text('PERIOD', margin + 4, y + 7);
    doc.text('AVG TEMP TREND', margin + 40, y + 7);
    doc.text('RAINFALL TREND', margin + 90, y + 7);
    doc.text('LATEST C-SEQ', margin + 140, y + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...colPrimary);
    doc.text(`${first.year} – ${last.year}`, margin + 4, y + 16);
    doc.text(`${tempTrend}°C`, margin + 40, y + 16);
    doc.text(`${rainTrend} mm`, margin + 90, y + 16);
    doc.text(`${last.carbon_seq_estimate} tCO₂e/ha`, margin + 140, y + 16);

    y += 30;

    /* Per-year tables ----------------------------------------------- */
    records.forEach(record => {
        // Year header
        doc.setFillColor(...colPrimary);
        doc.rect(margin, y, pageWidth - margin * 2, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text(`${record.year}  |  Avg Temp: ${record.avg_temp}°C  |  Total Rainfall: ${record.total_rainfall} mm  |  Avg Humidity: ${record.avg_humidity}%  |  C-Seq: ${record.carbon_seq_estimate} tCO₂e/ha`, margin + 3, y + 5.5);
        y += 10;

        // Column headers
        const cols = { month: margin, tmax: margin + 25, tmin: margin + 53, rain: margin + 82, hum: margin + 118, note: margin + 145 };
        doc.setFillColor(...colAccent);
        doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.text('Month', cols.month + 2, y + 4.2);
        doc.text('Max °C', cols.tmax, y + 4.2);
        doc.text('Min °C', cols.tmin, y + 4.2);
        doc.text('Rainfall (mm)', cols.rain, y + 4.2);
        doc.text('Humidity (%)', cols.hum, y + 4.2);
        y += 7;

        // Monthly rows
        record.monthly.forEach((row, i) => {
            if (i % 2 === 0) {
                doc.setFillColor(248, 250, 252);
                doc.rect(margin, y, pageWidth - margin * 2, 5.5, 'F');
            }
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(30, 41, 59);
            doc.text(row.month, cols.month + 2, y + 3.8);
            doc.text(`${row.temp_max}`, cols.tmax, y + 3.8);
            doc.text(`${row.temp_min}`, cols.tmin, y + 3.8);
            doc.text(`${row.rainfall_mm}`, cols.rain, y + 3.8);
            doc.text(`${row.humidity_pct}`, cols.hum, y + 3.8);
            y += 5.5;
        });

        y += 8;

        // Add new page if needed
        if (y > 265) {
            doc.addPage();
            y = margin;
        }
    });

    /* Footer -------------------------------------------------------- */
    const footerY = doc.internal.pageSize.getHeight() - 10;
    doc.setDrawColor(...colAccent);
    doc.setLineWidth(0.4);
    doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(...colGray);
    doc.text('This report is auto-generated by Grento Climate Intelligence engine. Data is provided for informational purposes only.', margin, footerY);

    return doc.output('datauristring').split(',')[1]; // base64 only
}

/* ------------------------------------------------------------------ */
/*  Route Handler                                                       */
/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const lat = parseFloat(body.lat);
        const lng = parseFloat(body.lng);

        if (isNaN(lat) || isNaN(lng)) {
            return NextResponse.json({ error: 'Valid lat and lng are required' }, { status: 400 });
        }

        let records: YearRecord[];
        let isAI = false;

        try {
            records = await fetchFromGemini(lat, lng);
            isAI = true;
            console.log('[Climate API] Gemini AI data fetched successfully');
        } catch (err) {
            console.warn('[Climate API] Gemini failed, using mock data:', err);
            records = generateMockData(lat, lng);
        }

        const base64PDF = buildPDF(records, lat, lng, isAI);
        const filename = `climate_report_${lat.toFixed(3)}_${lng.toFixed(3)}.pdf`;

        return NextResponse.json({ pdf: base64PDF, filename, source: isAI ? 'gemini' : 'mock' }, { status: 200 });

    } catch (error: any) {
        console.error('[Climate API] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
