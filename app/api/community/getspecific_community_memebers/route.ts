import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import Community from '@/app/models/community';
import User from '@/app/models/user';

/**
 * GET handler to retrieve all members of a specific community.
 * Expects 'community_id' as a query parameter.
 */
export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        // Extract community_id from search parameters
        const { searchParams } = new URL(req.url);
        const community_id = searchParams.get('community_id');

        if (!community_id) {
            return NextResponse.json({ error: 'community_id query parameter is required' }, { status: 400 });
        }

        // 1. Fetch the specific community to get member IDs
        const community = await Community.findOne({ community_id }, 'community_members_id');

        if (!community) {
            return NextResponse.json({ error: 'Community not found' }, { status: 404 });
        }

        const memberIds = community.community_members_id || [];

        // 2. Fetch all users whose userId is in the memberIds array
        // We select only relevant fields for the dashboard
        const members = await User.find(
            { userId: { $in: memberIds } },
            'userId username email phone createdAt'
        ).sort({ createdAt: -1 });

        return NextResponse.json({ members }, { status: 200 });

    } catch (error: any) {
        console.error('Get Community Members Error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message
        }, { status: 500 });
    }
}
