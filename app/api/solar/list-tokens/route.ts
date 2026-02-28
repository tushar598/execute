import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import dbConnect from '@/app/lib/db';
import SunToken from '@/app/models/suntoken';
import SunTokenMarketListing from '@/app/models/suntokenmarketlisting';
import SolarProfile from '@/app/models/solarprofile';
import User from '@/app/models/user';
import { AuditLog } from '@/app/models/auditlogs';
import { verifyToken } from '@/app/lib/jwt';
import { MARKET_PRICE_PER_TOKEN } from '@/app/lib/constants';

function sha256Hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * POST /api/solar/list-tokens
 * List ALL available Sun Tokens on the marketplace (no partial selling).
 */
export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded: any = verifyToken(token);
        if (!decoded?.id) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

        const sunToken = await SunToken.findOne({ userId: decoded.id });
        if (!sunToken || sunToken.tokensAvailable <= 0) {
            return NextResponse.json({ error: 'No Sun Tokens available to sell. Generate tokens first.' }, { status: 400 });
        }

        const profile = await SolarProfile.findOne({ userId: decoded.id });
        if (!profile) {
            return NextResponse.json({ error: 'Complete solar onboarding first' }, { status: 400 });
        }

        const userDoc = await User.findById(decoded.id).lean() as any;
        const sellerName = userDoc?.username || 'Seller';

        const tokensToSell = sunToken.tokensAvailable;
        const pricePerToken = MARKET_PRICE_PER_TOKEN;
        const totalValue = tokensToSell * pricePerToken;

        // Deduct tokens
        await SunToken.findOneAndUpdate(
            { userId: decoded.id },
            { $set: { tokensAvailable: 0 }, $inc: { tokensSold: tokensToSell } }
        );

        // Create marketplace listing
        await SunTokenMarketListing.create({
            sellerId: decoded.id,
            sellerName,
            tokens: tokensToSell,
            pricePerToken,
            totalValue,
            location: profile.coordinates,
            state: profile.state,
            status: 'available',
        });

        // Audit log
        const lastLog = await AuditLog.findOne({}).sort({ timestamp: -1 });
        const previousHash = lastLog?.txHash || '0'.repeat(64);
        const hashPayload = JSON.stringify({
            action: 'sun_token_listed',
            userId: decoded.id,
            sellerName,
            tokensSold: tokensToSell,
            pricePerToken,
            totalValue,
            timestamp: new Date().toISOString(),
        });
        const txHash = sha256Hash(previousHash + hashPayload);

        await AuditLog.create({
            action: 'sun_token_listed',
            entityType: 'SunToken',
            entityId: String(decoded.id),
            userId: String(decoded.id),
            metadata: { sellerName, tokensSold: tokensToSell, pricePerToken, totalValue },
            txHash,
            previousHash,
        });

        return NextResponse.json({
            success: true,
            message: `Listed ${tokensToSell} Sun Tokens at ₹${pricePerToken}/token.`,
            tokensSold: tokensToSell,
            pricePerToken,
            totalValue,
            auditHash: txHash,
        }, { status: 200 });
    } catch (error: any) {
        console.error('List Tokens Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
