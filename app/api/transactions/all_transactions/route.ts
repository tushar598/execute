import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import { Transaction } from '@/app/models/transaction';
import { cookies } from 'next/headers';
import { verifyToken } from '@/app/lib/jwt';

/**
 * GET /api/transactions/all_transactions
 * Fetches all transactions for a specific entity (user, company, or aggregator).
 * 
 * Query Params:
 * - entityId: ID of the entity (Required)
 * - type: filter by 'sale', 'purchase', or 'transfer' (Optional)
 * - status: filter by 'completed', 'pending', or 'failed' (Optional)
 * - limit: number of records to return (Default: 50, Max: 100)
 */
export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        // 1. Authenticate Request
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded: any = verifyToken(token);
        if (!decoded || !decoded.id) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });

        // 2. Extract Query Parameters
        const { searchParams } = new URL(req.url);
        const entityId = searchParams.get('entityId') || decoded.id;
        const type = searchParams.get('type');
        const status = searchParams.get('status');
        const limitParam = searchParams.get('limit');
        const limit = limitParam ? parseInt(limitParam) : 50;

        if (!entityId) {
            return NextResponse.json({ error: 'entityId is required to fetch transactions' }, { status: 400 });
        }

        // 3. Build Query Filter
        const filter: any = {
            $or: [
                { fromId: entityId },
                { toId: entityId }
            ]
        };

        if (type) filter.type = type;
        if (status) filter.status = status;

        // 4. Fetch Transactions
        const transactions = await Transaction.find(filter)
            .sort({ createdAt: -1 })
            .limit(isNaN(limit) ? 50 : Math.min(limit, 100));

        return NextResponse.json({
            success: true,
            entityId,
            count: transactions.length,
            transactions
        }, { status: 200 });

    } catch (error: any) {
        console.error('Fetch All Transactions Error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message
        }, { status: 500 });
    }
}
