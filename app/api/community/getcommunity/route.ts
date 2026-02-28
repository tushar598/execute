import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import Community from '@/app/models/community';

/**
 * GET handler to retrieve a list of all communities.
 * Returns only specific fields: name, id, admin name, and practices.
 */
export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        // Fetch all communities with specific field projection
        const communities = await Community.find({}, 'community_name community_id community_admin community_practices');

        return NextResponse.json({ communities }, { status: 200 });

    } catch (error: any) {
        console.error('Get All Communities Error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message
        }, { status: 500 });
    }
}
