import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/app/lib/db';
import SunToken from '@/app/models/suntoken';
import SolarProfile from '@/app/models/solarprofile';
import { verifyToken } from '@/app/lib/jwt';
import { SUN_TOKEN_ENERGY_RATE } from '@/app/lib/constants';

/**
 * POST /api/solar/get-tokens
 * Simulates solar energy calculation and awards Sun Tokens to the seller.
 * In production this would integrate with a real smart meter API.
 */
export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded: any = verifyToken(token);
        if (!decoded?.id) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

        // Verify solar profile exists
        const profile = await SolarProfile.findOne({ userId: decoded.id });
        if (!profile) {
            return NextResponse.json({ error: 'Complete solar onboarding first' }, { status: 400 });
        }

        // Exact matching sample data to run the website demo consistently (scaled down to realistic values)
        const energyProduced = 25; // Exact sample: 25 kWh produced
        const energyConsumed = 10; // Exact sample: 10 kWh consumed
        const leftover = Math.max(0, energyProduced - energyConsumed);
        const newTokens = Math.floor(leftover / SUN_TOKEN_ENERGY_RATE);

        if (newTokens <= 0) {
            return NextResponse.json({
                error: 'No leftover energy to convert to tokens',
                energyProduced,
                energyConsumed,
                leftover,
            }, { status: 400 });
        }

        // Upsert sun token record
        const sunToken = await SunToken.findOneAndUpdate(
            { userId: decoded.id },
            {
                $inc: {
                    totalEnergyProduced: energyProduced,
                    totalEnergyConsumed: energyConsumed,
                    leftoverEnergy: leftover,
                    tokensGenerated: newTokens,
                    tokensAvailable: newTokens,
                },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return NextResponse.json({
            success: true,
            message: `Generated ${newTokens} Sun Tokens from ${leftover} kWh leftover energy`,
            energyProduced,
            energyConsumed,
            leftoverEnergy: leftover,
            newTokens,
            totalTokensAvailable: sunToken.tokensAvailable,
            totalTokensGenerated: sunToken.tokensGenerated,
        }, { status: 200 });
    } catch (error: any) {
        console.error('Get Tokens Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
