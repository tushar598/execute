import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/app/lib/db';
import UserProfile from '@/app/models/userprofile';
import Credit from '@/app/models/credit';
import { verifyToken } from '@/app/lib/jwt';

/**
 * GET handler to retrieve the current user's profile and carbon credits.
 */
export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        // 1. Authentication Check
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded: any = verifyToken(token);
        if (!decoded || !decoded.id) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }

        // 2. Fetch User Profile (may be null for new users who haven't onboarded yet)
        const profile = await UserProfile.findOne({ userId: decoded.id });

        // 3. Fetch User Credits (always, even without a profile)
        const userCredit = await Credit.findOne({ userId: decoded.id });
        const credits = userCredit ? userCredit.credit : 0;
        const balance = userCredit ? userCredit.balance : 0;

        // 4. Return Profile & Data (profile can be null)
        return NextResponse.json({ profile, credits, balance }, { status: 200 });

    } catch (error: any) {
        console.error('Get Profile Error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message
        }, { status: 500 });
    }
}
