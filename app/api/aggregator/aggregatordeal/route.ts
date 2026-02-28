import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/aggregator/aggregatordeal
 *
 * DEPRECATED — aggregator deal proposals are no longer used.
 * Credits are now sold directly by community admins at the current market price.
 * See: POST /api/community/list_on_market
 */
export async function POST(req: NextRequest) {
    return NextResponse.json(
        {
            error: 'Gone',
            message:
                'Aggregator deal proposals are no longer used. Community admins sell credits directly at the current market price. See POST /api/community/list_on_market.',
        },
        { status: 410 }
    );
}
