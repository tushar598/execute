import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import Community from '@/app/models/community';

/**
 * GET handler to retrieve a specific community by its ID.
 * Expects 'community_id' as a query parameter.
 * Returns: name, id, admin name, and practices.
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

        // Fetch the specific community with field projection
        const community = await Community.findOne(
            { community_id },
            'community_name community_id community_admin community_practices community_members_id'
        );

        if (!community) {
            return NextResponse.json({ error: 'Community not found' }, { status: 404 });
        }

        return NextResponse.json({ community }, { status: 200 });

    } catch (error: any) {
        console.error('Get Specific Community Error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message
        }, { status: 500 });
    }
}
