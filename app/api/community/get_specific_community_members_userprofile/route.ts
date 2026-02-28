import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import Community from '@/app/models/community';
import UserProfile from '@/app/models/userprofile';

/**
 * GET handler to retrieve the user profiles for all members of a specific community.
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

        // 1. Fetch the community to find the list of member IDs
        const community = await Community.findOne({ community_id }, 'community_members_id');

        if (!community) {
            return NextResponse.json({ error: 'Community not found' }, { status: 404 });
        }

        const memberIds = community.community_members_id || [];

        // 2. If there are no members, return early
        if (memberIds.length === 0) {
            return NextResponse.json({
                profiles: [],
                totalLandArea: 0
            }, { status: 200 });
        }

        // 3. Fetch User Profiles where the userId is in the memberIds array
        // In the UserProfile schema, userId references the User document.
        // Assuming memberIds contains string representations of those ObjectIds or User IDs.
        // We populate the 'userId' field to get username/email if needed by the frontend.
        const profiles = await UserProfile.find({ userId: { $in: memberIds } })
            .populate('userId', 'username email phone')
            .lean();

        // 4. Calculate total land area dynamically
        let totalLandArea = 0;
        profiles.forEach(profile => {
            // Only count land area if the user has completed the process
            if (profile.hasdone_process && profile.landarea) {
                totalLandArea += profile.landarea;
            }
        });

        return NextResponse.json({
            profiles,
            totalLandArea
        }, { status: 200 });

    } catch (error: any) {
        console.error('Get Community Members Profiles Error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message
        }, { status: 500 });
    }
}
