import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/app/lib/db';
import { verifyToken } from '@/app/lib/jwt';
import MemberPayout from '@/app/models/memberpayout';
import UserProfile from '@/app/models/userprofile';

/**
 * GET /api/users/my_payouts
 * Returns all MemberPayout records received by the logged-in user.
 * Includes: project name, community, credits, payout amount, date.
 */
export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded: any = verifyToken(token);
        if (!decoded?.id) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

        // The userId in MemberPayout is the string form of the user document's userId/ObjectId
        // We need to match either by decoded.id directly OR via UserProfile lookup
        let userIdStr = decoded.id;

        // Try to find the user's profile to get the userId field used in Credit/MemberPayout
        const userProfile = await UserProfile.findOne({ userId: decoded.id }).lean();
        if (userProfile) {
            // userId in UserProfile is the ObjectId reference; MemberPayout uses the string version
            userIdStr = (userProfile as any).userId?.toString() || decoded.id;
        }

        const { searchParams } = new URL(req.url);
        const limitParam = searchParams.get('limit');
        const limit = limitParam ? Math.min(parseInt(limitParam), 100) : 50;

        // Fetch all payouts for this user, newest first
        const payouts = await MemberPayout.find({
            $or: [
                { userId: userIdStr },
                { userId: decoded.id },
            ]
        })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        // Stats
        const totalEarned = payouts.reduce((sum, p) => sum + p.totalPayout, 0);
        const totalCreditsParticipated = payouts.reduce((sum, p) => sum + p.creditAmount, 0);

        return NextResponse.json({
            success: true,
            userId: userIdStr,
            stats: {
                totalPayouts: payouts.length,
                totalEarned: Math.round(totalEarned * 100) / 100,
                totalCreditsParticipated: Math.round(totalCreditsParticipated * 100) / 100,
            },
            payouts,
        }, { status: 200 });

    } catch (error: any) {
        console.error('My Payouts Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
