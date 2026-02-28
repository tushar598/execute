import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/app/lib/db';
import CommunityCarbonCredits from '@/app/models/communitycarboncredits';
import CarbonMarket from '@/app/models/carbonmarket';
import AggregatorDeals from '@/app/models/aggregatordeals';
import { AuditLog } from '@/app/models/auditlogs';
import { SYSTEM_AGGREGATOR_ID, MARKET_PRICE_PER_CREDIT } from '@/app/lib/constants';

function sha256Hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * POST /api/community/list_on_market
 *
 * Community admin sells ALL available credits directly at the current market
 * price — no aggregator deal acceptance is required.
 *
 * Flow:
 *  1. Verify the community has credits to sell.
 *  2. Calculate totalValue = availableCredits × MARKET_PRICE_PER_CREDIT.
 *  3. Deduct credits from CommunityCarbonCredits.
 *  4. Update (or clear) the CarbonMarket listing.
 *  5. Create an AggregatorDeals record under SYSTEM_AGGREGATOR_ID so the
 *     company marketplace can find inventory without any human aggregator.
 *  6. Write a SHA-256 audit log entry.
 */
export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        const body = await req.json();
        const { community_id, community_description, credits_to_sell } = body;

        if (!community_id || !community_description) {
            return NextResponse.json(
                { error: 'Community ID and description are required' },
                { status: 400 }
            );
        }

        // 1. Verify the community has credits available
        const creditRecord = await CommunityCarbonCredits.findOne({ community_id });

        if (!creditRecord || creditRecord.community_carbon_credits <= 0) {
            return NextResponse.json(
                { error: 'No generated carbon credits available to sell.' },
                { status: 400 }
            );
        }

        if (!credits_to_sell || credits_to_sell <= 0 || credits_to_sell > creditRecord.community_carbon_credits) {
            return NextResponse.json(
                { error: 'Invalid number of credits to sell.' },
                { status: 400 }
            );
        }

        const creditsSelling = credits_to_sell;
        const pricePerCredit = MARKET_PRICE_PER_CREDIT;
        const totalValue = creditsSelling * pricePerCredit;

        // 2. Deduct credits from the community's internal wallet
        await CommunityCarbonCredits.findOneAndUpdate(
            { community_id },
            {
                $inc: {
                    community_carbon_credits: -creditsSelling,
                    credits_sold: creditsSelling,
                },
            },
            { new: true }
        );

        // 3. Update CarbonMarket listing to reflect remaining credits
        //    (upsert so it creates the listing if none existed before, or increments the listed amount)
        await CarbonMarket.findOneAndUpdate(
            { 'communityCarbonMarket.communityId': community_id },
            {
                $set: {
                    'communityCarbonMarket.communityName': creditRecord.community_name,
                    'communityCarbonMarket.community_description': community_description,
                    'communityCarbonMarket.updatedAt': new Date(),
                },
                $inc: {
                    'communityCarbonMarket.community_carbon_credit_number': creditsSelling
                }
            },
            { upsert: true, new: true }
        );

        // 4. Create a system AggregatorDeals record so the company marketplace
        //    can read available community inventory without a live aggregator.
        await AggregatorDeals.create({
            aggregatorId: SYSTEM_AGGREGATOR_ID,
            communityDealInfo: {
                communityId: community_id,
                carboncreditBuy: creditsSelling,
                creditPriceSet: pricePerCredit,
                totalValue,
            },
        });

        // 5. SHA-256 Audit Log
        const lastLog = await AuditLog.findOne({}).sort({ timestamp: -1 });
        const previousHash = lastLog?.txHash || '0'.repeat(64);
        const hashPayload = JSON.stringify({
            action: 'credit_sold_direct',
            communityId: community_id,
            creditsSold: creditsSelling,
            pricePerCredit,
            totalValue,
            timestamp: new Date().toISOString(),
        });
        const txHash = sha256Hash(previousHash + hashPayload);

        await AuditLog.create({
            action: 'credit_sold_direct',
            entityType: 'CommunityCarbonCredits',
            entityId: community_id,
            userId: community_id,
            metadata: {
                communityName: creditRecord.community_name,
                creditsSold: creditsSelling,
                pricePerCredit,
                totalValue,
                description: community_description,
            },
            txHash,
            previousHash,
        });

        return NextResponse.json(
            {
                success: true,
                message: `Successfully sold ${creditsSelling} credits at ₹${pricePerCredit}/credit.`,
                creditsSold: creditsSelling,
                pricePerCredit,
                totalValue,
                auditHash: txHash,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Sell Credits Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        );
    }
}
