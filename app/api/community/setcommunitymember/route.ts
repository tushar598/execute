import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import Community from '@/app/models/community';

/**
 * POST handler to add a user ID to a community's community_members_id list.
 */
export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        const { community_id, userId } = await req.json();

        if (!community_id || !userId) {
            return NextResponse.json({ error: 'community_id and userId are required' }, { status: 400 });
        }

        // Find the community
        const community = await Community.findOne({ community_id });

        if (!community) {
            return NextResponse.json({ error: 'Community not found' }, { status: 404 });
        }

        // Check if user is already a member
        if (community.community_members_id?.includes(userId)) {
            return NextResponse.json({ message: 'User is already a member of this community' }, { status: 200 });
        }

        // Add user to community_members_id
        await Community.findOneAndUpdate(
            { community_id },
            { $addToSet: { community_members_id: userId } }
        );

        return NextResponse.json({ message: 'User added to community successfully' }, { status: 200 });

    } catch (error: any) {
        console.error('Set Community Member Error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message
        }, { status: 500 });
    }
}
