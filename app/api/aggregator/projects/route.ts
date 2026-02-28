import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import dbConnect from '@/app/lib/db';
import { verifyToken } from '@/app/lib/jwt';
import Aggregator from '@/app/models/aggregatorprofile';
import AggregatorProject from '@/app/models/aggregatorproject';
import AggregatorDeals from '@/app/models/aggregatordeals';
import { AuditLog } from '@/app/models/auditlogs';

function sha256Hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * GET /api/aggregator/projects
 * Returns all projects for the logged-in aggregator, plus available credits from their deals.
 */
export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded: any = verifyToken(token);
        if (!decoded?.id) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

        const aggregatorProfile = await Aggregator.findOne({ userId: decoded.id });
        if (!aggregatorProfile) return NextResponse.json({ error: 'Aggregator not found' }, { status: 404 });

        const aggregatorId = aggregatorProfile.DealerId;

        // Get all deals to show available credit inventory
        const deals = await AggregatorDeals.find({ aggregatorId });
        let inventoryCredits = 0;
        const communityIds: string[] = [];
        for (const deal of deals) {
            if (deal.communityDealInfo) {
                inventoryCredits += deal.communityDealInfo.carboncreditBuy || 0;
                communityIds.push(deal.communityDealInfo.communityId);
            }
        }

        // Get all projects
        const projects = await AggregatorProject.find({ aggregatorId }).sort({ createdAt: -1 });

        // Subtract credits already bundled into existing open/sold projects
        const usedCredits = projects
            .filter(p => p.status !== 'cancelled')
            .reduce((acc, p) => acc + p.totalCredits, 0);

        return NextResponse.json({
            aggregatorId,
            availableCredits: Math.max(0, inventoryCredits - usedCredits),
            sourceCommunityIds: [...new Set(communityIds)],
            projects,
        }, { status: 200 });

    } catch (error: any) {
        console.error('Get Projects Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * POST /api/aggregator/projects
 * Creates a new bundled project for the company marketplace.
 * Body: { projectName, projectDescription, totalCredits, pricePerCredit, sourceCommunityIds }
 */
export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded: any = verifyToken(token);
        if (!decoded?.id) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

        const aggregatorProfile = await Aggregator.findOne({ userId: decoded.id });
        if (!aggregatorProfile) return NextResponse.json({ error: 'Aggregator not found' }, { status: 404 });

        const aggregatorId = aggregatorProfile.DealerId;
        const body = await req.json();
        const { projectName, projectDescription, totalCredits, pricePerCredit, sourceCommunityIds } = body;

        if (!projectName || !projectDescription || !totalCredits || !pricePerCredit) {
            return NextResponse.json({ error: 'Missing required fields: projectName, projectDescription, totalCredits, pricePerCredit' }, { status: 400 });
        }

        if (totalCredits <= 0 || pricePerCredit <= 0) {
            return NextResponse.json({ error: 'totalCredits and pricePerCredit must be positive' }, { status: 400 });
        }

        // Validate available inventory
        const deals = await AggregatorDeals.find({ aggregatorId });
        let inventoryCredits = 0;
        for (const deal of deals) {
            if (deal.communityDealInfo) {
                inventoryCredits += deal.communityDealInfo.carboncreditBuy || 0;
            }
        }

        const existingProjects = await AggregatorProject.find({ aggregatorId, status: { $ne: 'cancelled' } });
        const usedCredits = existingProjects.reduce((acc, p) => acc + p.totalCredits, 0);
        const availableCredits = inventoryCredits - usedCredits;

        if (totalCredits > availableCredits) {
            return NextResponse.json({ error: `Insufficient credits. You have ${availableCredits} available.` }, { status: 400 });
        }

        const project = await AggregatorProject.create({
            aggregatorId,
            projectName,
            projectDescription,
            totalCredits,
            pricePerCredit,
            sourceCommunityIds: sourceCommunityIds || [],
            status: 'open',
        });

        // SHA-256 Audit Log
        const lastLog = await AuditLog.findOne({}).sort({ timestamp: -1 });
        const previousHash = lastLog?.txHash || '0'.repeat(64);
        const hashPayload = JSON.stringify({
            action: 'project_created',
            projectId: String(project._id),
            aggregatorId,
            totalCredits,
            pricePerCredit,
            timestamp: new Date().toISOString(),
        });
        const txHash = sha256Hash(previousHash + hashPayload);

        await AuditLog.create({
            action: 'project_created',
            entityType: 'AggregatorProject',
            entityId: String(project._id),
            userId: aggregatorId,
            metadata: { projectName, totalCredits, pricePerCredit },
            txHash,
            previousHash,
        });

        return NextResponse.json({ success: true, project, auditHash: txHash }, { status: 201 });

    } catch (error: any) {
        console.error('Create Project Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
