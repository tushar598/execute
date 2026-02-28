import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import { Transaction } from '@/app/models/transaction';
import { cookies } from 'next/headers';
import { verifyToken } from '@/app/lib/jwt';

/**
 * GET /api/transactions/specific_transactions
 * Fetches a single transaction by its unique database ID.
 * 
 * Query Params:
 * - id: The unique MongoDB _id of the transaction (Required)
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

        // 2. Extract and Validate Transaction ID
        const { searchParams } = new URL(req.url);
        const transactionId = searchParams.get('id');

        if (!transactionId) {
            return NextResponse.json({ error: 'Transaction record ID (?id=...) is required' }, { status: 400 });
        }

        // 3. Fetch Transaction
        const transaction = await Transaction.findById(transactionId);

        if (!transaction) {
            return NextResponse.json({ error: 'Transaction record not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            transaction
        }, { status: 200 });

    } catch (error: any) {
        console.error('Fetch Specific Transaction Error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message
        }, { status: 500 });
    }
}
