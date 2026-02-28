import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/app/lib/db';
import { verifyToken } from '@/app/lib/jwt';
import AggregatorDeals from '@/app/models/aggregatordeals';
import Aggregator from '@/app/models/aggregatorprofile';
import CommunityCarbonCredits from '@/app/models/communitycarboncredits';

/**
 * GET /api/aggregator/analytics
 * Returns live analytics for the logged-in aggregator:
 *  - totalDeals, totalCredits, totalValue, activeCommunities, recentDeals (with community names)
 */
export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded: any = verifyToken(token);
        if (!decoded?.id) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

        // Find aggregator profile to get their DealerId
        const aggregatorProfile = await Aggregator.findOne({ userId: decoded.id });
        if (!aggregatorProfile) return NextResponse.json({ error: 'Aggregator not found' }, { status: 404 });

        const aggregatorId = aggregatorProfile.DealerId;

        // Fetch all deals for this aggregator
        const allDeals = await AggregatorDeals.find({ aggregatorId }).sort({ createdAt: -1 });

        // Compute stats
        const totalDeals = allDeals.length;
        let totalCredits = 0;
        let totalValue = 0;
        const communitySet = new Set<string>();

        for (const deal of allDeals) {
            if (deal.communityDealInfo) {
                totalCredits += deal.communityDealInfo.carboncreditBuy || 0;
                totalValue += deal.communityDealInfo.totalValue || 0;
                communitySet.add(deal.communityDealInfo.communityId);
            }
            if (deal.individualDealInfo) {
                totalCredits += deal.individualDealInfo.carboncreditBuy || 0;
                totalValue += deal.individualDealInfo.totalValue || 0;
            }
        }

        // Resolve community names from CommunityCarbonCredits
        const communityIds = [...communitySet];
        const communities = await CommunityCarbonCredits.find({ community_id: { $in: communityIds } }).lean();
        const nameMap: Record<string, string> = {};
        for (const c of communities) {
            nameMap[(c as any).community_id] = (c as any).community_name;
        }

        // Format recent 10 deals for the dashboard table
        const recentDeals = allDeals.slice(0, 10).map((deal) => ({
            _id: deal._id,
            type: deal.communityDealInfo ? 'Community' : 'Individual',
            entityId: deal.communityDealInfo?.communityId || deal.individualDealInfo?.userId || 'N/A',
            entityName: deal.communityDealInfo
                ? (nameMap[deal.communityDealInfo.communityId] || deal.communityDealInfo.communityId)
                : (deal.individualDealInfo?.userId || 'N/A'),
            credits: deal.communityDealInfo?.carboncreditBuy || deal.individualDealInfo?.carboncreditBuy || 0,
            pricePerCredit: deal.communityDealInfo?.creditPriceSet || deal.individualDealInfo?.creditPriceSet || 0,
            totalValue: deal.communityDealInfo?.totalValue || deal.individualDealInfo?.totalValue || 0,
            createdAt: deal.createdAt,
        }));

        return NextResponse.json({
            aggregatorId,
            totalDeals,
            totalCredits,
            totalValue,
            activeCommunities: communitySet.size,
            recentDeals,
        }, { status: 200 });

    } catch (error: any) {
        console.error('Aggregator Analytics Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
