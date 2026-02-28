import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import CarbonMarket from '@/app/models/carbonmarket';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        // Fetch all market entries where the community section exists
        const marketData = await CarbonMarket.find({ communityCarbonMarket: { $exists: true } }).sort({ createdAt: -1 });

        // Return structured data for the aggregator dashboard
        const communities = marketData.map(data => data.communityCarbonMarket);

        return NextResponse.json({ communities }, { status: 200 });

    } catch (error: any) {
        console.error('Fetch Market Data Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
