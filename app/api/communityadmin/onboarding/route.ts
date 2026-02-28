import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/app/lib/db';
import Community from '@/app/models/community';
import CommunityAdmin from '@/app/models/communityadmin';
import { verifyToken } from '@/app/lib/jwt';
import { z } from 'zod';

const CommunityOnboardingSchema = z.object({
    community_name: z.string().min(1, 'Community name is required'),
    community_id: z.string().min(1, 'Community ID is required'),
    community_district: z.string().min(1, 'Community district is required'),
    community_state: z.string().min(1, 'Community state is required'),
    community_practices: z.array(z.string()).min(1, 'At least one practice is required'),
    community_admin_name: z.string().min(1, 'Admin name is required'),
});

export async function POST(req: NextRequest) {
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

        // 2. Parse Body
        let body;
        try {
            body = await req.json();
        } catch (err) {
            return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
        }

        // 3. Validation
        const validatedData = CommunityOnboardingSchema.safeParse(body);
        if (!validatedData.success) {
            return NextResponse.json({ error: 'Validation failed', details: validatedData.error.format() }, { status: 400 });
        }

        const {
            community_name,
            community_id,
            community_district,
            community_state,
            community_practices,
            community_admin_name
        } = validatedData.data;

        // 4. Check Duplicate Community ID
        const existingCommunity = await Community.findOne({ community_id });
        if (existingCommunity) {
            return NextResponse.json({ error: 'Community ID already exists' }, { status: 409 });
        }

        // 5. Check if user is already an admin (Normalized check)
        const existingAdmin = await CommunityAdmin.findOne({ userId: decoded.id });
        if (existingAdmin) {
            return NextResponse.json({ error: 'User is already associated with a community' }, { status: 409 });
        }

        // 6. Create Community (Source of Truth)
        const newCommunity = new Community({
            community_name,
            community_id,
            community_district,
            community_state,
            community_practices,
            community_admin: community_admin_name,
            community_admin_id: decoded.id,
            community_members_id: []
        });

        // 7. Create Community Admin Link (Normalized)
        const newCommunityAdmin = new CommunityAdmin({
            userId: decoded.id,
            community_id
        });

        await newCommunity.save();
        await newCommunityAdmin.save();

        return NextResponse.json({
            message: 'Community and Admin profile created successfully',
            community: newCommunity,
            adminLink: newCommunityAdmin
        }, { status: 201 });

    } catch (error: any) {
        console.error('Community Admin Onboarding Error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message
        }, { status: 500 });
    }
}
