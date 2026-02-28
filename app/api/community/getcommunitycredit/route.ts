import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import CommunityCarbonCredits from '@/app/models/communitycarboncredits';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const community_id = searchParams.get('community_id');

        if (!community_id) {
            return NextResponse.json({ error: 'community_id query parameter is required' }, { status: 400 });
        }

        const creditsRecord = await CommunityCarbonCredits.findOne({ community_id });

        // If no record exists yet, they haven't generated credits, which is fine
        const credits = creditsRecord ? creditsRecord.community_carbon_credits : 0;

        return NextResponse.json({ credits }, { status: 200 });

    } catch (error: any) {
        console.error('Get Community Credit Error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message
        }, { status: 500 });
    }
}
