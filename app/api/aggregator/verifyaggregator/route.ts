import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/app/lib/jwt';
import dbConnect from '@/app/lib/db';
import Aggregator from '@/app/models/aggregatorprofile';

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

        // Check if aggregator profile exists
        const aggregator = await Aggregator.findOne({ userId: decoded.id });

        if (aggregator) {
            return NextResponse.json({ exists: true, aggregator }, { status: 200 });
        } else {
            return NextResponse.json({ exists: false }, { status: 200 });
        }

    } catch (error: any) {
        console.error('Verify Aggregator Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
