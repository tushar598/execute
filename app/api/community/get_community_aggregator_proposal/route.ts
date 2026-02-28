import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/community/get_community_aggregator_proposal
 *
 * DEPRECATED — aggregator deal proposals are no longer used.
 * Returns an empty proposals array for backward compatibility with any client
 * that may still call this endpoint.
 */
export async function GET(req: NextRequest) {
    return NextResponse.json({ proposals: [] }, { status: 200 });
}

/**
 * POST /api/community/get_community_aggregator_proposal
 *
 * DEPRECATED — accepting/rejecting deals is no longer required.
 */
export async function POST(req: NextRequest) {
    return NextResponse.json(
        {
            error: 'Gone',
            message:
                'Aggregator deal accept/reject is no longer used. Community admins sell credits directly at the current market price.',
        },
        { status: 410 }
    );
}
