import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import AggregatorDeals from '@/app/models/aggregatordeals';
import CarbonMarket from '@/app/models/carbonmarket';
import { SYSTEM_AGGREGATOR_ID, MARKET_PRICE_PER_CREDIT } from '@/app/lib/constants';

/**
 * GET /api/company/marketplace?type=community|individual|all
 *
 * Returns credit pool listings.
 * type=community (default) → community pools from communityDealInfo
 * type=individual          → individual farmer pools from individualDealInfo
 * type=all                 → both merged, each tagged with poolType
 */
export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type') || 'all';

        // ── Helper: build individual listings ─────────────────────────────────
        const buildIndividualListings = async () => {
            const deals = await AggregatorDeals.find({
                aggregatorId: SYSTEM_AGGREGATOR_ID,
                individualDealInfo: { $exists: true },
            }).sort({ createdAt: -1 });

            const farmerMap: Record<string, {
                userId: string;
                farmerName: string;
                availableCredits: number;
                pricePerCredit: number;
                totalValue: number;
            }> = {};

            for (const deal of deals) {
                if (!deal.individualDealInfo) continue;
                const { userId, farmerName, carboncreditBuy, creditPriceSet } = deal.individualDealInfo;
                if (carboncreditBuy <= 0) continue;
                if (!farmerMap[userId]) {
                    farmerMap[userId] = {
                        userId,
                        farmerName: farmerName || 'Farmer',
                        availableCredits: 0,
                        pricePerCredit: creditPriceSet || MARKET_PRICE_PER_CREDIT,
                        totalValue: 0,
                    };
                }
                farmerMap[userId].availableCredits += carboncreditBuy;
            }

            return Object.values(farmerMap)
                .filter(l => l.availableCredits > 0)
                .map(l => ({
                    ...l,
                    poolType: 'individual' as const,
                    pricePerCredit: MARKET_PRICE_PER_CREDIT,
                    totalValue: l.availableCredits * MARKET_PRICE_PER_CREDIT,
                    description: 'Individual verified farmer carbon credits',
                }));
        };

        // ── Helper: build community listings ──────────────────────────────────
        const buildCommunityListings = async () => {
            const systemDeals = await AggregatorDeals.find({
                aggregatorId: SYSTEM_AGGREGATOR_ID,
                communityDealInfo: { $exists: true },
            }).sort({ createdAt: -1 });

            const marketEntries = await CarbonMarket.find({
                communityCarbonMarket: { $exists: true },
            }).lean();

            const descriptionMap: Record<string, string> = {};
            for (const entry of marketEntries) {
                const cm = (entry as any).communityCarbonMarket;
                if (cm?.communityId) descriptionMap[cm.communityId] = cm.community_description || '';
            }

            const communityMap: Record<string, {
                communityId: string;
                communityName: string;
                availableCredits: number;
                pricePerCredit: number;
                description: string;
            }> = {};

            for (const deal of systemDeals) {
                if (!deal.communityDealInfo) continue;
                const { communityId, carboncreditBuy, creditPriceSet } = deal.communityDealInfo;
                if (!communityMap[communityId]) {
                    communityMap[communityId] = {
                        communityId,
                        communityName: '',
                        availableCredits: 0,
                        pricePerCredit: creditPriceSet || MARKET_PRICE_PER_CREDIT,
                        description: descriptionMap[communityId] || '',
                    };
                }
                communityMap[communityId].availableCredits += carboncreditBuy || 0;
            }

            for (const entry of marketEntries) {
                const cm = (entry as any).communityCarbonMarket;
                if (cm?.communityId && communityMap[cm.communityId]) {
                    communityMap[cm.communityId].communityName = cm.communityName || cm.communityId;
                    communityMap[cm.communityId].description = cm.community_description || '';
                }
            }

            return Object.values(communityMap)
                .filter(l => l.availableCredits > 0)
                .map(l => ({
                    ...l,
                    poolType: 'community' as const,
                    pricePerCredit: MARKET_PRICE_PER_CREDIT,
                    totalValue: l.availableCredits * MARKET_PRICE_PER_CREDIT,
                }));
        };

        // ── Route by type ─────────────────────────────────────────────────────
        if (type === 'individual') {
            const listings = await buildIndividualListings();
            return NextResponse.json({ listings }, { status: 200 });
        }

        if (type === 'community') {
            const listings = await buildCommunityListings();
            return NextResponse.json({ listings }, { status: 200 });
        }

        // type=all (default): merge both
        const [communityListings, individualListings] = await Promise.all([
            buildCommunityListings(),
            buildIndividualListings(),
        ]);

        const listings = [...communityListings, ...individualListings];
        return NextResponse.json({ listings }, { status: 200 });

    } catch (error: any) {
        console.error('Company Marketplace Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
