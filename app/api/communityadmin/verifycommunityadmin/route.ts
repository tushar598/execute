import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/app/lib/jwt';
import dbConnect from '@/app/lib/db';
import CommunityAdmin from '@/app/models/communityadmin';

export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded: any = verifyToken(token);
        if (!decoded || !decoded.id) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        await dbConnect();

        // Check if community admin profile exists
        const communityAdmin = await CommunityAdmin.findOne({ userId: decoded.id });

        if (communityAdmin) {
            return NextResponse.json({ exists: true, communityAdmin }, { status: 200 });
        } else {
            return NextResponse.json({ exists: false }, { status: 200 });
        }

    } catch (error: any) {
        console.error('Verify Community Admin Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
