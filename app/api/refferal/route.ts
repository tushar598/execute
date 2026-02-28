import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/app/lib/db';
import { verifyToken } from '@/app/lib/jwt';
import ReferralData from '@/app/models/refferaldata';

/** Generate a cryptographically-safe 20-char alphanumeric code */
function generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 20; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/** GET /api/refferal – fetch current user's referral code and referred count */
export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded: any = verifyToken(token);
        if (!decoded?.id) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

        const referral = await ReferralData.findOne({ ownerId: decoded.id });

        if (!referral) {
            return NextResponse.json({ code: null, referredCount: 0 }, { status: 200 });
        }

        return NextResponse.json({ code: referral.code, referredCount: referral.referredCount }, { status: 200 });
    } catch (error: any) {
        console.error('GET /api/refferal error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

/** POST /api/refferal – generate a referral code for the current user (idempotent) */
export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded: any = verifyToken(token);
        if (!decoded?.id) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

        // Return existing code if already generated
        const existing = await ReferralData.findOne({ ownerId: decoded.id });
        if (existing) {
            return NextResponse.json({ code: existing.code, referredCount: existing.referredCount }, { status: 200 });
        }

        // Generate a unique code (retry on collision)
        let code = generateCode();
        let collision = await ReferralData.findOne({ code });
        while (collision) {
            code = generateCode();
            collision = await ReferralData.findOne({ code });
        }

        const newReferral = await ReferralData.create({ ownerId: decoded.id, code, referredCount: 0 });

        return NextResponse.json({ code: newReferral.code, referredCount: 0 }, { status: 201 });
    } catch (error: any) {
        console.error('POST /api/refferal error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
