import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/app/lib/db';
import { verifyToken } from '@/app/lib/jwt';
import CommunityAdmin from '@/app/models/communityadmin';
import MemberPayout from '@/app/models/memberpayout';
import Community from '@/app/models/community';
import Company from '@/app/models/company';

/**
 * GET /api/community/sale_transactions
 * Returns all project sale transactions where this community's members received payouts.
 * Accessible to community admin only.
 *
 * Groups by projectId: shows total community payout, member count, buyer, date.
 */
export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded: any = verifyToken(token);
        if (!decoded?.id) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

        // Verify community admin
        const adminProfile = await CommunityAdmin.findOne({ userId: decoded.id }).lean();
        if (!adminProfile) return NextResponse.json({ error: 'Community Admin not found' }, { status: 404 });

        const communityId = (adminProfile as any).community_id;
        if (!communityId) return NextResponse.json({ error: 'No community associated with this admin' }, { status: 404 });

        // Get community name for display
        const community = await Community.findOne({ community_id: communityId }).lean();
        const communityName = (community as any)?.community_name || communityId;

        // Aggregate MemberPayout records by project for this community
        const projectGroups = await MemberPayout.aggregate([
            { $match: { communityId } },
            {
                $group: {
                    _id: '$projectId',
                    projectName: { $first: '$projectName' },
                    aggregatorId: { $first: '$aggregatorId' },
                    companyId: { $first: '$companyId' },
                    totalCommunityPayout: { $sum: '$totalPayout' },
                    totalCredits: { $sum: '$creditAmount' },
                    membersCount: { $sum: 1 },
                    pricePerCredit: { $first: '$pricePerCredit' },
                    latestPayout: { $max: '$createdAt' },
                    transactionId: { $first: '$transactionId' },
                    memberPayouts: {
                        $push: {
                            userId: '$userId',
                            creditAmount: '$creditAmount',
                            totalPayout: '$totalPayout',
                            status: '$status',
                        }
                    }
                }
            },
            { $sort: { latestPayout: -1 } }
        ]);

        // Enrich with company names
        const enriched = await Promise.all(projectGroups.map(async (group) => {
            let buyerName = group.companyId;
            if (group.companyId) {
                const companyDoc: any = await Company.findOne({
                    $or: [
                        { companyId: group.companyId },
                        { _id: group.companyId },
                    ]
                }).lean();
                if (companyDoc) {
                    buyerName = companyDoc.company_name || companyDoc.name || group.companyId;
                }
            }

            return {
                projectId: group._id,
                projectName: group.projectName,
                aggregatorId: group.aggregatorId,
                companyId: group.companyId,
                buyerName,
                communityId,
                communityName,
                totalCommunityPayout: Math.round(group.totalCommunityPayout * 100) / 100,
                totalCredits: Math.round(group.totalCredits * 100) / 100,
                pricePerCredit: group.pricePerCredit,
                membersCount: group.membersCount,
                memberPayouts: group.memberPayouts,
                soldAt: group.latestPayout,
                transactionId: group.transactionId,
            };
        }));

        // Overall stats
        const totalEarned = enriched.reduce((sum, p) => sum + p.totalCommunityPayout, 0);
        const totalCredits = enriched.reduce((sum, p) => sum + p.totalCredits, 0);

        return NextResponse.json({
            success: true,
            communityId,
            communityName,
            stats: {
                totalProjectSales: enriched.length,
                totalEarned: Math.round(totalEarned * 100) / 100,
                totalCredits: Math.round(totalCredits * 100) / 100,
            },
            saleTransactions: enriched,
        }, { status: 200 });

    } catch (error: any) {
        console.error('Sale Transactions Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
