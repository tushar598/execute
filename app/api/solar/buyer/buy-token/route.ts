import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import dbConnect from '@/app/lib/db';
import SunTokenMarketListing from '@/app/models/suntokenmarketlisting';
import SunTokenTransaction from '@/app/models/suntokentransaction';
import SunToken from '@/app/models/suntoken';
import { AuditLog } from '@/app/models/auditlogs';
import { verifyToken } from '@/app/lib/jwt';

function sha256Hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * POST /api/solar/buyer/buy-token
 * Purchase Sun Tokens from a listing. Simulates the multi-step government flow.
 */
export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded: any = verifyToken(token);
        if (!decoded?.id) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

        const { listingId } = await req.json();
        if (!listingId) return NextResponse.json({ error: 'Listing ID required' }, { status: 400 });

        const listing = await SunTokenMarketListing.findById(listingId);
        if (!listing || listing.status !== 'available') {
            return NextResponse.json({ error: 'Listing not available' }, { status: 404 });
        }

        // Cannot buy own tokens
        if (String(listing.sellerId) === String(decoded.id)) {
            return NextResponse.json({ error: 'Cannot purchase your own tokens' }, { status: 400 });
        }

        const totalAmount = listing.tokens * listing.pricePerToken;

        // Mark listing as sold
        listing.status = 'sold';
        await listing.save();

        // Audit hash
        const lastLog = await AuditLog.findOne({}).sort({ timestamp: -1 });
        const previousHash = lastLog?.txHash || '0'.repeat(64);
        const hashPayload = JSON.stringify({
            action: 'sun_token_purchased',
            buyerId: decoded.id,
            sellerId: listing.sellerId,
            tokenAmount: listing.tokens,
            totalAmount,
            timestamp: new Date().toISOString(),
        });
        const txHash = sha256Hash(previousHash + hashPayload);

        // Create transaction with simulated processing timeline
        const now = new Date();
        const transaction = await SunTokenTransaction.create({
            buyerId: decoded.id,
            sellerId: listing.sellerId,
            listingId: listing._id,
            tokenAmount: listing.tokens,
            pricePerToken: listing.pricePerToken,
            totalAmount,
            status: 'completed',
            govtProcessedAt: new Date(now.getTime() + 2000),
            deliveredAt: new Date(now.getTime() + 4000),
            paymentSentAt: new Date(now.getTime() + 6000),
            txHash,
        });

        // Credit balance to seller
        await SunToken.findOneAndUpdate(
            { userId: listing.sellerId },
            { $inc: { balance: totalAmount } }
        );

        // Audit logs
        await AuditLog.create({
            action: 'sun_token_purchased',
            entityType: 'SunToken',
            entityId: String(transaction._id),
            userId: String(decoded.id),
            metadata: {
                buyerId: decoded.id,
                sellerId: listing.sellerId,
                sellerName: listing.sellerName,
                tokenAmount: listing.tokens,
                pricePerToken: listing.pricePerToken,
                totalAmount,
            },
            txHash,
            previousHash,
        });

        return NextResponse.json({
            success: true,
            message: `Successfully purchased ${listing.tokens} Sun Tokens`,
            transaction: {
                id: transaction._id,
                tokenAmount: listing.tokens,
                pricePerToken: listing.pricePerToken,
                totalAmount,
                sellerName: listing.sellerName,
                status: transaction.status,
                txHash,
            },
        }, { status: 200 });
    } catch (error: any) {
        console.error('Buy Token Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
