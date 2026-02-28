import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/app/lib/jwt';
import dbConnect from '@/app/lib/db';
import User from '@/app/models/user';
import Company from '@/app/models/company';

export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded: any = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        await dbConnect();

        let user;
        if (decoded.role === 'individual' || decoded.role === 'communityadmin') {
            user = await User.findById(decoded.id).select('-password');
        } else if (decoded.role === 'company') {
            user = await Company.findById(decoded.id).select('-password');
        }

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ user, role: decoded.role, tradingMode: decoded.tradingMode || 'credits' }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
