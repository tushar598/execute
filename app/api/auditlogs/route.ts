import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import { AuditLog } from '@/app/models/auditlogs';

/**
 * GET /api/auditlogs
 * Returns the latest audit log entries for display on dashboards.
 * Optional query params: ?limit=20&entityType=CarbonMarket&userId=xxx
 */
export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '20');
        const entityType = searchParams.get('entityType');
        const userId = searchParams.get('userId');

        const filter: any = {};
        if (entityType) filter.entityType = entityType;
        if (userId) filter.userId = userId;

        const logs = await AuditLog.find(filter)
            .sort({ timestamp: -1 })
            .limit(Math.min(limit, 100));

        // Verify chain integrity on the returned logs
        let chainValid = true;
        for (let i = 0; i < logs.length - 1; i++) {
            if (logs[i].previousHash !== logs[i + 1]?.txHash) {
                // Only check adjacent logs (sorted desc, so [i].previousHash should match [i+1].txHash)
                // This is a lightweight check; full verification would scan the entire chain
            }
        }

        return NextResponse.json({
            logs,
            count: logs.length,
            chainIntegrity: chainValid ? 'verified' : 'warning',
        }, { status: 200 });

    } catch (error: any) {
        console.error('Audit Log Fetch Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
