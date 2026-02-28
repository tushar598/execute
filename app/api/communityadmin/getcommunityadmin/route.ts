import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/app/lib/db';
import CommunityAdmin from '@/app/models/communityadmin';
import Community from '@/app/models/community';
import { verifyToken } from '@/app/lib/jwt';

/**
 * GET handler to retrieve the current community admin's profile and community details.
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

        // 2. Fetch Community Admin Link
        const adminProfile = await CommunityAdmin.findOne({ userId: decoded.id });

        if (!adminProfile) {
            return NextResponse.json({ error: 'Community admin profile not found' }, { status: 404 });
        }

        // 3. Fetch Associated Community Details (Source of Truth)
        const community = await Community.findOne({ community_id: adminProfile.community_id });

        if (!community) {
            return NextResponse.json({ error: 'Associated community data not found' }, { status: 404 });
        }

        // 4. Return combined data
        return NextResponse.json({
            adminProfile,
            community
        }, { status: 200 });

    } catch (error: any) {
        console.error('Get Community Admin Error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message
        }, { status: 500 });
    }
}
