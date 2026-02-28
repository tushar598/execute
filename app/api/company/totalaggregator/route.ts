import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import AggregatorDeals from '@/app/models/aggregatordeals';
import CompanyDeals from '@/app/models/companydeals';
import { cookies } from 'next/headers';
import { verifyToken } from '@/app/lib/jwt'
import { SYSTEM_AGGREGATOR_ID } from '@/app/lib/constants';

/**
 * GET /api/company/totalaggregator
 * Returns aggregated stats for the company dashboard:
 * - totalListings: Count of community credit pools with available credits.
 * - totalCreditsBought: Sum of credits purchased by the authenticated company.
 * - totalSpent: Total ₹ spent by the authenticated company.
 */
export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded: any = verifyToken(token);
        if (!decoded || !decoded.id) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }

        // 1. Count community pools that still have credits
        const systemDeals = await AggregatorDeals.find({
            aggregatorId: SYSTEM_AGGREGATOR_ID,
            'communityDealInfo': { $exists: true },
        });

        const communityMap: Record<string, number> = {};
        for (const deal of systemDeals) {
            if (!deal.communityDealInfo) continue;
            const { communityId, carboncreditBuy } = deal.communityDealInfo;
            communityMap[communityId] = (communityMap[communityId] || 0) + (carboncreditBuy || 0);
        }
        const totalListings = Object.values(communityMap).filter(v => v > 0).length;

        // 2. Credits/spend by this company
        const companyDeals = await CompanyDeals.find({ companyId: decoded.id });
        const totalCreditsBought = companyDeals.reduce((sum, deal) => sum + deal.creditAmount, 0);
        const totalSpent = companyDeals.reduce((sum, deal) => sum + deal.totalValue, 0);

        return NextResponse.json({
            totalListings,
            totalCreditsBought,
            totalSpent,
        }, { status: 200 });

    } catch (error: any) {
        console.error('Company Stats Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
