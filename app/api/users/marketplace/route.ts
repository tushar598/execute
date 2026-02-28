import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import AggregatorDeals from '@/app/models/aggregatordeals';
import { SYSTEM_AGGREGATOR_ID, MARKET_PRICE_PER_CREDIT } from '@/app/lib/constants';

/**
 * GET /api/users/marketplace
 *
 * Returns all individual farmer credit pools available for companies to purchase.
 * These are AggregatorDeals records with individualDealInfo set and credits > 0.
 */
export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const deals = await AggregatorDeals.find({
            aggregatorId: SYSTEM_AGGREGATOR_ID,
            individualDealInfo: { $exists: true },
        }).sort({ createdAt: -1 });

        // Aggregate credits per farmer (a farmer can have multiple listing entries)
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
            farmerMap[userId].totalValue = farmerMap[userId].availableCredits * MARKET_PRICE_PER_CREDIT;
        }

        const listings = Object.values(farmerMap)
            .filter(l => l.availableCredits > 0)
            .map(l => ({
                ...l,
                pricePerCredit: MARKET_PRICE_PER_CREDIT,
                totalValue: l.availableCredits * MARKET_PRICE_PER_CREDIT,
            }));

        return NextResponse.json({ listings }, { status: 200 });

    } catch (error: any) {
        console.error('Individual Marketplace Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
