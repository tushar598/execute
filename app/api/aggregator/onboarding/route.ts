import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/app/lib/jwt';
import dbConnect from '@/app/lib/db';
import Aggregator from '@/app/models/aggregatorprofile';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { DealerId } = body;

        if (!DealerId) {
            return NextResponse.json({ error: 'Dealer ID is required' }, { status: 400 });
        }

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

        // Check if aggregator profile already exists
        const existingAggregator = await Aggregator.findOne({ userId: decoded.id });
        if (existingAggregator) {
            return NextResponse.json({ error: 'Aggregator profile already exists' }, { status: 400 });
        }

        // Check if DealerId is already taken
        const dealerIdTaken = await Aggregator.findOne({ DealerId });
        if (dealerIdTaken) {
            return NextResponse.json({ error: 'Dealer ID is already registered' }, { status: 400 });
        }

        const newAggregator = new Aggregator({
            userId: decoded.id,
            DealerId,
        });

        await newAggregator.save();

        return NextResponse.json({ message: 'Aggregator onboarding successful', aggregator: newAggregator }, { status: 201 });

    } catch (error: any) {
        console.error('Aggregator Onboarding Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
