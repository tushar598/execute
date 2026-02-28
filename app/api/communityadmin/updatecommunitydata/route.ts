import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/app/lib/db';
import Community from '@/app/models/community';
import { verifyToken } from '@/app/lib/jwt';
import { z } from 'zod';

// Define which fields are allowed to be updated
const CommunityUpdateSchema = z.object({
    community_id: z.string().min(1, 'Community ID is required to identify the record'),
    community_name: z.string().min(1).optional(),
    community_district: z.string().min(1).optional(),
    community_state: z.string().min(1).optional(),
    community_practices: z.array(z.string()).min(1).optional(),
    community_admin: z.string().min(1).optional(), // Admin display name
});

export async function PATCH(req: NextRequest) {
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

        // 2. Parse and Validate Body
        let body;
        try {
            body = await req.json();
        } catch (err) {
            return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
        }

        const validatedData = CommunityUpdateSchema.safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validatedData.error.format()
            }, { status: 400 });
        }

        const { community_id, ...updateFields } = validatedData.data;

        // 3. Authorization Check: Find community and verify ownership
        const community = await Community.findOne({ community_id });

        if (!community) {
            return NextResponse.json({ error: 'Community not found' }, { status: 404 });
        }

        // Check if the user ID from the token matches the community_admin_id
        if (community.community_admin_id !== decoded.id) {
            return NextResponse.json({
                error: 'Forbidden: Only the assigned admin can update this community'
            }, { status: 403 });
        }

        // 4. Update the document
        // { new: true } returns the document after the update is applied
        const updatedCommunity = await Community.findOneAndUpdate(
            { community_id },
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        return NextResponse.json({
            message: 'Community updated successfully',
            community: updatedCommunity
        }, { status: 200 });

    } catch (error: any) {
        console.error('Community Update Error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message
        }, { status: 500 });
    }
}