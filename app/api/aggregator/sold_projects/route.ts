import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/app/lib/db';
import { verifyToken } from '@/app/lib/jwt';
import Aggregator from '@/app/models/aggregatorprofile';
import AggregatorProject from '@/app/models/aggregatorproject';
import CompanyDeals from '@/app/models/companydeals';
import MemberPayout from '@/app/models/memberpayout';
import Company from '@/app/models/company';

/**
 * GET /api/aggregator/sold_projects
 * Returns all sold projects for the logged-in aggregator, with payout breakdowns.
 */
export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded: any = verifyToken(token);
        if (!decoded?.id) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

        // Get aggregator profile
        const aggregatorProfile = await Aggregator.findOne({ userId: decoded.id });
        if (!aggregatorProfile) return NextResponse.json({ error: 'Aggregator not found' }, { status: 404 });

        const aggregatorId = aggregatorProfile.DealerId;

        // Find all sold projects
        const soldProjects = await AggregatorProject.find({
            aggregatorId,
            status: 'sold',
        }).sort({ updatedAt: -1 }).lean();

        // Enrich each project with CompanyDeals info and payout summary
        const enriched = await Promise.all(soldProjects.map(async (project) => {
            const projectIdStr = project._id.toString();

            // Get company deal record for this project
            const companyDeal = await CompanyDeals.findOne({ projectId: projectIdStr }).lean();

            // Get buyer company name if possible
            let buyerName = project.buyerCompanyId || 'Unknown';
            if (project.buyerCompanyId) {
                const companyDoc: any = await Company.findOne({
                    $or: [
                        { companyId: project.buyerCompanyId },
                        { _id: project.buyerCompanyId },
                    ]
                }).lean();
                if (companyDoc) {
                    buyerName = companyDoc.company_name || companyDoc.name || project.buyerCompanyId;
                }
            }

            // Get aggregated payout info from MemberPayout
            const payouts = await MemberPayout.aggregate([
                { $match: { projectId: projectIdStr } },
                {
                    $group: {
                        _id: '$communityId',
                        totalMemberPayout: { $sum: '$totalPayout' },
                        membersCount: { $sum: 1 },
                        communityId: { $first: '$communityId' },
                    }
                }
            ]);

            const totalCommunityPayout = payouts.reduce((sum: number, p: any) => sum + p.totalMemberPayout, 0);
            const totalPaid = project.totalCredits * project.pricePerCredit;
            const aggregatorProfit = totalPaid - totalCommunityPayout;

            return {
                _id: project._id,
                projectName: project.projectName,
                projectDescription: project.projectDescription,
                totalCredits: project.totalCredits,
                pricePerCredit: project.pricePerCredit,
                totalValue: totalPaid,
                aggregatorProfit,
                communityTotalPayout: totalCommunityPayout,
                buyerCompanyId: project.buyerCompanyId,
                buyerName,
                sourceCommunityIds: project.sourceCommunityIds,
                communityPayouts: payouts,
                transactionHash: (companyDeal as any)?.transactionHash || '',
                soldAt: project.updatedAt,
                createdAt: project.createdAt,
            };
        }));

        // Overall stats
        const totalSoldCredits = enriched.reduce((sum, p) => sum + p.totalCredits, 0);
        const totalRevenue = enriched.reduce((sum, p) => sum + p.totalValue, 0);
        const totalProfit = enriched.reduce((sum, p) => sum + p.aggregatorProfit, 0);

        return NextResponse.json({
            aggregatorId,
            stats: {
                totalSoldProjects: enriched.length,
                totalSoldCredits,
                totalRevenue,
                totalProfit,
            },
            soldProjects: enriched,
        }, { status: 200 });

    } catch (error: any) {
        console.error('Sold Projects Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
