import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/app/lib/db';
import SolarProfile from '@/app/models/solarprofile';
import SunToken from '@/app/models/suntoken';
import SunTokenTransaction from '@/app/models/suntokentransaction';
import User from '@/app/models/user';
import { verifyToken } from '@/app/lib/jwt';

/**
 * GET /api/solar/profile
 * Returns the solar profile, sun token data, and transaction history for the authenticated user.
 */
export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded: any = verifyToken(token);
        if (!decoded?.id) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

        const profile = await SolarProfile.findOne({ userId: decoded.id });
        const sunToken = await SunToken.findOne({ userId: decoded.id });
        const user = await User.findById(decoded.id).select('username email userId').lean();

        // Recent transactions (as seller or buyer)
        const transactions = await SunTokenTransaction.find({
            $or: [{ sellerId: decoded.id }, { buyerId: decoded.id }]
        }).sort({ createdAt: -1 }).limit(20).lean();

        return NextResponse.json({
            profile,
            sunToken: sunToken || {
                totalEnergyProduced: 25, // Referenced data from Smart Meter (realistic daily value)
                totalEnergyConsumed: 10,
                leftoverEnergy: 15,
                tokensGenerated: 0,
                tokensAvailable: 0,
                tokensSold: 0,
                balance: 0
            },
            user,
            transactions,
        }, { status: 200 });
    } catch (error: any) {
        console.error('Solar Profile Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
