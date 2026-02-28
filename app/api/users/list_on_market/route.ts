import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import dbConnect from '@/app/lib/db';
import { verifyToken } from '@/app/lib/jwt';
import Credit from '@/app/models/credit';
import AggregatorDeals from '@/app/models/aggregatordeals';
import { AuditLog } from '@/app/models/auditlogs';
import User from '@/app/models/user';
import { SYSTEM_AGGREGATOR_ID, MARKET_PRICE_PER_CREDIT } from '@/app/lib/constants';

function sha256Hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * POST /api/users/list_on_market
 *
 * Individual farmer lists ALL their current carbon credits on the market.
 * Creates an AggregatorDeals record with individualDealInfo so that
 * the company marketplace can discover and purchase them.
 */
export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        // ── Auth ─────────────────────────────────────────────────────────────
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded: any = verifyToken(token);
        if (!decoded?.id) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

        const body = await req.json();
        const { credits_to_sell } = body;

        // ── Fetch Credit Balance ──────────────────────────────────────────────
        const creditRecord = await Credit.findOne({ userId: String(decoded.id) });
        if (!creditRecord || creditRecord.credit <= 0) {
            return NextResponse.json(
                { error: 'No carbon credits available to sell. Apply for verification first.' },
                { status: 400 }
            );
        }

        if (!credits_to_sell || credits_to_sell <= 0 || credits_to_sell > creditRecord.credit) {
            return NextResponse.json(
                { error: 'Invalid number of credits to sell.' },
                { status: 400 }
            );
        }

        const creditsListing = credits_to_sell;
        const pricePerCredit = MARKET_PRICE_PER_CREDIT;
        const totalValue = creditsListing * pricePerCredit;

        // ── Fetch Farmer Name ─────────────────────────────────────────────────
        const userDoc = await User.findById(decoded.id).lean() as any;
        const farmerName = userDoc?.username || 'Farmer';

        // ── Deduct Credits ────────────────────────────────────────────────────
        await Credit.findOneAndUpdate(
            { userId: String(decoded.id) },
            { $inc: { credit: -creditsListing } },
            { new: true }
        );

        // ── Create AggregatorDeals Record ─────────────────────────────────────
        await AggregatorDeals.create({
            aggregatorId: SYSTEM_AGGREGATOR_ID,
            individualDealInfo: {
                userId: String(decoded.id),
                farmerName,
                carboncreditBuy: creditsListing,
                creditPriceSet: pricePerCredit,
                totalValue,
            },
        });

        // ── SHA-256 Audit Log ─────────────────────────────────────────────────
        const lastLog = await AuditLog.findOne({}).sort({ timestamp: -1 });
        const previousHash = lastLog?.txHash || '0'.repeat(64);
        const hashPayload = JSON.stringify({
            action: 'individual_credit_listed',
            userId: decoded.id,
            farmerName,
            creditsSold: creditsListing,
            pricePerCredit,
            totalValue,
            timestamp: new Date().toISOString(),
        });
        const txHash = sha256Hash(previousHash + hashPayload);

        await AuditLog.create({
            action: 'individual_credit_listed',
            entityType: 'Credit',
            entityId: String(decoded.id),
            userId: String(decoded.id),
            metadata: {
                farmerName,
                creditsSold: creditsListing,
                pricePerCredit,
                totalValue,
            },
            txHash,
            previousHash,
        });

        return NextResponse.json({
            success: true,
            message: `Successfully listed ${creditsListing} credits at ₹${pricePerCredit}/credit.`,
            creditsSold: creditsListing,
            pricePerCredit,
            totalValue,
            auditHash: txHash,
        }, { status: 200 });

    } catch (error: any) {
        console.error('User List on Market Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
