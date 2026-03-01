import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import dbConnect from '@/app/lib/db';
import { verifyToken } from '@/app/lib/jwt';
import AggregatorProject from '@/app/models/aggregatorproject';
import AggregatorDeals from '@/app/models/aggregatordeals';
import { Transaction } from '@/app/models/transaction';
import Credit from '@/app/models/credit';
import Company from '@/app/models/company';
import Community from '@/app/models/community';
import CommunityCarbonCredits from '@/app/models/communitycarboncredits';
import { AuditLog } from '@/app/models/auditlogs';
import CompanyDeals from '@/app/models/companydeals';
import MemberPayout from '@/app/models/memberpayout';
import { SYSTEM_AGGREGATOR_ID, MARKET_PRICE_PER_CREDIT } from '@/app/lib/constants';

function sha256Hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
}

async function getLastHash(): Promise<string> {
    const lastLog = await AuditLog.findOne({}).sort({ timestamp: -1 }).lean();
    return (lastLog as any)?.txHash || '0'.repeat(64);
}

/**
 * POST /api/company/buy_project
 *
 * Unified buyer route for both community and individual farmer credit pools.
 *
 * Body for community pool:
 *   { poolType: 'community', communityId, creditsRequested, reason }
 *
 * Body for individual pool:
 *   { poolType: 'individual', farmerId, creditsRequested, reason }
 */
export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        // ── Auth ──────────────────────────────────────────────────────────────
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded: any = verifyToken(token);
        if (!decoded?.id) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

        const body = await req.json();
        const { poolType = 'community', communityId, farmerId, creditsRequested, reason } = body;

        if (!creditsRequested || !reason) {
            return NextResponse.json({ error: 'creditsRequested and reason are required' }, { status: 400 });
        }
        if (creditsRequested <= 0) {
            return NextResponse.json({ error: 'creditsRequested must be positive' }, { status: 400 });
        }
        if (poolType === 'community' && !communityId) {
            return NextResponse.json({ error: 'communityId is required for community pool' }, { status: 400 });
        }
        if (poolType === 'individual' && !farmerId) {
            return NextResponse.json({ error: 'farmerId is required for individual pool' }, { status: 400 });
        }

        // ── Validate company ──────────────────────────────────────────────────
        let company: any = await Company.findOne({ companyId: decoded.id }).lean();
        if (!company) {
            company = await Company.findById(decoded.id).lean();
            if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        const pricePerCredit = MARKET_PRICE_PER_CREDIT;
        const totalPaid = creditsRequested * pricePerCredit;

        // ══════════════════════ INDIVIDUAL POOL PATH ══════════════════════════
        if (poolType === 'individual') {
            const individualDeals = await AggregatorDeals.find({
                aggregatorId: SYSTEM_AGGREGATOR_ID,
                'individualDealInfo.userId': farmerId,
            });

            let totalInventory = 0;
            for (const d of individualDeals) totalInventory += d.individualDealInfo?.carboncreditBuy || 0;

            if (totalInventory < creditsRequested) {
                return NextResponse.json({
                    error: `Insufficient credits. Farmer has ${totalInventory} credits available, you requested ${creditsRequested}.`,
                }, { status: 400 });
            }

            const farmerName = individualDeals[0]?.individualDealInfo?.farmerName || 'Farmer';

            // Auto-create AggregatorProject for audit trail
            const project = await AggregatorProject.create({
                aggregatorId: SYSTEM_AGGREGATOR_ID,
                projectName: `${reason} — Individual Credit Request`,
                projectDescription: `Company credit request from individual farmer ${farmerName} for: ${reason}`,
                sourceCommunityIds: [],
                totalCredits: creditsRequested,
                pricePerCredit,
                status: 'sold',
                buyerCompanyId: decoded.id,
            });

            // Main purchase transaction
            const txRecord = await Transaction.create({
                type: 'purchase',
                fromId: decoded.id,
                toId: SYSTEM_AGGREGATOR_ID,
                projectId: project._id.toString(),
                creditAmount: creditsRequested,
                pricePerCredit,
                totalValue: totalPaid,
                status: 'completed',
            });

            // Pay farmer
            await Credit.findOneAndUpdate(
                { userId: farmerId },
                { $inc: { balance: totalPaid } },
                { upsert: true, new: true }
            );

            // Per-farmer payout transaction
            await Transaction.create({
                type: 'transfer',
                fromId: SYSTEM_AGGREGATOR_ID,
                toId: farmerId,
                projectId: project._id.toString(),
                creditAmount: creditsRequested,
                pricePerCredit,
                totalValue: totalPaid,
                status: 'completed',
            });

            // Save payout record
            await MemberPayout.create({
                userId: farmerId,
                communityId: 'individual',
                projectId: project._id.toString(),
                projectName: project.projectName,
                aggregatorId: SYSTEM_AGGREGATOR_ID,
                companyId: decoded.id,
                creditAmount: creditsRequested,
                pricePerCredit,
                totalPayout: totalPaid,
                transactionId: txRecord._id.toString(),
                status: 'completed',
            });

            // Deduct from AggregatorDeals (FIFO)
            let remaining = creditsRequested;
            for (const deal of individualDeals) {
                if (remaining <= 0) break;
                const available = deal.individualDealInfo?.carboncreditBuy || 0;
                if (available <= 0) { await AggregatorDeals.findByIdAndDelete(deal._id); continue; }
                const deduct = Math.min(available, remaining);
                if (available - deduct <= 0) {
                    await AggregatorDeals.findByIdAndDelete(deal._id);
                } else {
                    await AggregatorDeals.findByIdAndUpdate(deal._id, {
                        $inc: { 'individualDealInfo.carboncreditBuy': -deduct },
                    });
                }
                remaining -= deduct;
            }

            // Audit log
            const prevHash = await getLastHash();
            const purchaseHashPayload = JSON.stringify({
                action: 'individual_credit_purchased',
                projectId: project._id.toString(),
                companyId: decoded.id,
                farmerId,
                totalPaid,
                reason,
                timestamp: new Date().toISOString(),
            });
            const purchaseTxHash = sha256Hash(prevHash + purchaseHashPayload);

            await CompanyDeals.create({
                companyId: decoded.id,
                aggregatorId: SYSTEM_AGGREGATOR_ID,
                projectId: project._id.toString(),
                projectName: project.projectName,
                creditAmount: creditsRequested,
                pricePerCredit,
                totalValue: totalPaid,
                status: 'completed',
                transactionHash: purchaseTxHash,
            });

            await AuditLog.create({
                action: 'individual_credit_purchased',
                entityType: 'AggregatorProject',
                entityId: project._id.toString(),
                userId: decoded.id,
                metadata: {
                    projectName: project.projectName,
                    farmerId,
                    farmerName,
                    totalCredits: creditsRequested,
                    pricePerCredit,
                    totalPaid,
                    reason,
                    transactionId: txRecord._id,
                },
                txHash: purchaseTxHash,
                previousHash: prevHash,
            });

            return NextResponse.json({
                success: true,
                summary: {
                    projectId: project._id,
                    projectName: project.projectName,
                    poolType: 'individual',
                    farmerId,
                    farmerName,
                    totalCredits: creditsRequested,
                    pricePerCredit,
                    totalPaid,
                    reason,
                    txHash: purchaseTxHash,
                    transactionId: txRecord._id,
                },
            }, { status: 200 });
        }

        // ══════════════════════ COMMUNITY POOL PATH (unchanged) ═══════════════
        const systemDeals = await AggregatorDeals.find({
            aggregatorId: SYSTEM_AGGREGATOR_ID,
            'communityDealInfo.communityId': communityId,
        });

        let totalInventory = 0;
        for (const d of systemDeals) totalInventory += d.communityDealInfo?.carboncreditBuy || 0;

        if (totalInventory < creditsRequested) {
            return NextResponse.json({
                error: `Insufficient credits. Community has ${totalInventory} credits available, you requested ${creditsRequested}.`,
            }, { status: 400 });
        }

        const project = await AggregatorProject.create({
            aggregatorId: SYSTEM_AGGREGATOR_ID,
            projectName: `${reason} — Credit Request`,
            projectDescription: `Company credit request for: ${reason}`,
            sourceCommunityIds: [communityId],
            totalCredits: creditsRequested,
            pricePerCredit,
            status: 'sold',
            buyerCompanyId: decoded.id,
        });

        const txRecord = await Transaction.create({
            type: 'purchase',
            fromId: decoded.id,
            toId: SYSTEM_AGGREGATOR_ID,
            projectId: project._id.toString(),
            creditAmount: creditsRequested,
            pricePerCredit,
            totalValue: totalPaid,
            status: 'completed',
        });

        const commCreditsRecord = await CommunityCarbonCredits.findOne({ community_id: communityId }).lean();
        const communityName = (commCreditsRecord as any)?.community_name || communityId;

        const communityDoc = await Community.findOne({ community_id: communityId }).lean();
        const memberIds: string[] = (communityDoc as any)?.community_members_id || [];
        const memberPayouts: { userId: string; communityId: string; amount: number; credits: number }[] = [];

        if (memberIds.length > 0) {
            const memberCredits = await Credit.find({ userId: { $in: memberIds } });
            const totalCommunityCredits = memberCredits.reduce((sum, c) => sum + (c.credit || 0), 0);

            if (totalCommunityCredits > 0) {
                for (const creditRecord of memberCredits) {
                    const memberShare = creditRecord.credit / totalCommunityCredits;
                    const memberCreditsIncluded = Math.round(memberShare * creditsRequested * 100) / 100;
                    const memberPayout = Math.round(memberShare * totalPaid * 100) / 100;
                    if (memberPayout <= 0) continue;

                    await Credit.findByIdAndUpdate(creditRecord._id, {
                        $inc: { credit: -memberCreditsIncluded, balance: memberPayout },
                    });

                    await MemberPayout.create({
                        userId: creditRecord.userId,
                        communityId,
                        projectId: project._id.toString(),
                        projectName: project.projectName,
                        aggregatorId: SYSTEM_AGGREGATOR_ID,
                        companyId: decoded.id,
                        creditAmount: memberCreditsIncluded,
                        pricePerCredit,
                        totalPayout: memberPayout,
                        transactionId: txRecord._id.toString(),
                        status: 'completed',
                    });

                    await Transaction.create({
                        type: 'transfer',
                        fromId: SYSTEM_AGGREGATOR_ID,
                        toId: creditRecord.userId,
                        projectId: project._id.toString(),
                        creditAmount: memberCreditsIncluded,
                        pricePerCredit,
                        totalValue: memberPayout,
                        status: 'completed',
                    });

                    const prevHash = await getLastHash();
                    const hashPayload = JSON.stringify({
                        action: 'credit_distributed',
                        userId: creditRecord.userId,
                        communityId,
                        projectId: project._id.toString(),
                        memberPayout,
                        timestamp: new Date().toISOString(),
                    });
                    const memberTxHash = sha256Hash(prevHash + hashPayload);

                    await AuditLog.create({
                        action: 'credit_distributed',
                        entityType: 'MemberPayout',
                        entityId: project._id.toString(),
                        userId: creditRecord.userId,
                        metadata: { communityId, communityName, projectName: project.projectName, memberCreditsIncluded, pricePerCredit, memberPayout, transactionId: txRecord._id, reason },
                        txHash: memberTxHash,
                        previousHash: prevHash,
                    });

                    memberPayouts.push({ userId: creditRecord.userId, communityId, amount: memberPayout, credits: memberCreditsIncluded });
                }
            }

            await CommunityCarbonCredits.findOneAndUpdate(
                { community_id: communityId },
                { $inc: { credits_sold: creditsRequested } }
            );
        }

        let remaining = creditsRequested;
        for (const deal of systemDeals) {
            if (remaining <= 0) break;
            const available = deal.communityDealInfo?.carboncreditBuy || 0;
            if (available <= 0) { await AggregatorDeals.findByIdAndDelete(deal._id); continue; }
            const deduct = Math.min(available, remaining);
            if (available - deduct <= 0) {
                await AggregatorDeals.findByIdAndDelete(deal._id);
            } else {
                await AggregatorDeals.findByIdAndUpdate(deal._id, {
                    $inc: { 'communityDealInfo.carboncreditBuy': -deduct },
                });
            }
            remaining -= deduct;
        }

        const prevHashForPurchase = await getLastHash();
        const purchaseHashPayload = JSON.stringify({
            action: 'credit_purchased',
            projectId: project._id.toString(),
            companyId: decoded.id,
            communityId,
            totalPaid,
            reason,
            timestamp: new Date().toISOString(),
        });
        const purchaseTxHash = sha256Hash(prevHashForPurchase + purchaseHashPayload);

        await CompanyDeals.create({
            companyId: decoded.id,
            aggregatorId: SYSTEM_AGGREGATOR_ID,
            projectId: project._id.toString(),
            projectName: project.projectName,
            creditAmount: creditsRequested,
            pricePerCredit,
            totalValue: totalPaid,
            status: 'completed',
            transactionHash: purchaseTxHash,
        });

        await AuditLog.create({
            action: 'credit_purchased',
            entityType: 'AggregatorProject',
            entityId: project._id.toString(),
            userId: decoded.id,
            metadata: { projectName: project.projectName, communityId, communityName, totalCredits: creditsRequested, pricePerCredit, totalPaid, reason, memberPayoutsCount: memberPayouts.length, transactionId: txRecord._id },
            txHash: purchaseTxHash,
            previousHash: prevHashForPurchase,
        });

        return NextResponse.json({
            success: true,
            summary: {
                projectId: project._id,
                projectName: project.projectName,
                poolType: 'community',
                communityId,
                communityName,
                totalCredits: creditsRequested,
                pricePerCredit,
                totalPaid,
                reason,
                memberPayoutsCount: memberPayouts.length,
                txHash: purchaseTxHash,
                transactionId: txRecord._id,
            },
        }, { status: 200 });

    } catch (error: any) {
        console.error('Buy Credits Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
