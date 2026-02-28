import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/app/lib/db';
import { verifyToken } from '@/app/lib/jwt';
import UserProfile from '@/app/models/userprofile';
import Credit from '@/app/models/credit';
import User from '@/app/models/user';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

/**
 * POST /api/ai/individual_credits
 *
 * Calculates carbon credits for a single individual farmer.
 * Uses Gemini AI (with deterministic fallback) based on their land area,
 * practices, soil type, and current crops.
 * Increments their Credit.credit balance.
 */
export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        // ── Auth ─────────────────────────────────────────────────────────────
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded: any = verifyToken(token);
        if (!decoded?.id) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

        // ── Fetch Profile ─────────────────────────────────────────────────────
        const profile = await UserProfile.findOne({ userId: decoded.id });
        if (!profile) {
            return NextResponse.json({ error: 'User profile not found. Please complete onboarding first.' }, { status: 404 });
        }

        if (!profile.hasdone_process) {
            return NextResponse.json({ error: 'Profile process not completed. Finish your onboarding profile.' }, { status: 400 });
        }

        const { landarea, practices, soil_type, current_crop } = profile;

        let calculatedCredits = 0;
        let method = 'fallback';

        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
            const prompt = `
You are an expert agricultural carbon credit calculator.
An individual farmer has applied for carbon credits.
Here are their farm details:
- Land area: ${landarea} acres
- Soil type: ${soil_type}
- Farming practices: ${JSON.stringify(practices)}
- Current crops: ${JSON.stringify(current_crop)}

Calculate the expected annual carbon credits (in tonnes of CO2 equivalent) this farmer should receive.
Consider typical soil sequestration rates for the practices and soil type mentioned.
Respond ONLY with a single numeric value. Do not include text or units.
            `;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text().trim();
            const parsed = parseFloat(responseText);

            if (!isNaN(parsed) && parsed > 0) {
                calculatedCredits = Math.round(parsed * 100) / 100;
                method = 'ai';
            } else {
                throw new Error('AI returned invalid number');
            }
        } catch (aiError) {
            console.warn('AI calculation failed, using fallback formula', aiError);
            // Fallback: 1.5 credits per acre (same as community fallback)
            const baseRate = 1.5;
            const practiceBonus = practices.includes('organic') || practices.includes('regenerative') ? 0.3 : 0;
            calculatedCredits = Math.round((landarea * (baseRate + practiceBonus)) * 100) / 100;
        }

        // ── Save Credits ──────────────────────────────────────────────────────
        const updatedCredit = await Credit.findOneAndUpdate(
            { userId: String(decoded.id) },
            { $inc: { credit: calculatedCredits } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return NextResponse.json({
            success: true,
            message: `Verification complete. ${calculatedCredits} carbon credits have been added to your account.`,
            creditsAwarded: calculatedCredits,
            totalCredits: updatedCredit.credit,
            method,
        }, { status: 200 });

    } catch (error: any) {
        console.error('Individual Credit Calculation Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
