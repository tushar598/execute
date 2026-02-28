import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/app/lib/db';
import SunTokenMarketListing from '@/app/models/suntokenmarketlisting';
import SolarProfile from '@/app/models/solarprofile';
import { verifyToken } from '@/app/lib/jwt';

/**
 * GET /api/solar/buyer/marketplace
 * Returns all available Sun Token listings + buyer's own location for map rendering.
 */
export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded: any = verifyToken(token);
        if (!decoded?.id) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

        // Get buyer's profile for location/state
        const buyerProfile = await SolarProfile.findOne({ userId: decoded.id }).lean();

        // Parse query params for filtering
        const { searchParams } = new URL(req.url);
        const filterState = searchParams.get('state') || buyerProfile?.state || '';

        // Fetch available listings
        let query: any = { status: 'available' };
        if (filterState) {
            query.state = filterState;
        }

        const listings = await SunTokenMarketListing.find(query)
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({
            listings,
            buyerLocation: buyerProfile?.coordinates || null,
            buyerState: buyerProfile?.state || '',
        }, { status: 200 });
    } catch (error: any) {
        console.error('Buyer Marketplace Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
