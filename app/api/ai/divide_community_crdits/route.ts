import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/db';
import UserProfile from '@/app/models/userprofile';
import Credit from '@/app/models/credit';
import CommunityCarbonCredits from '@/app/models/communitycarboncredits';
import CommunityAdmin from '@/app/models/communityadmin';
import Community from '@/app/models/community';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        const body = await req.json();
        const { community_id, total_land_area, profiles } = body;

        if (!community_id || !total_land_area || !profiles || !Array.isArray(profiles)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let aiCalculatedTotal = 0;
        let creditsPerAcre = 0;

        try {
            // Attempt AI Calculation
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
            const prompt = `
            You are an expert agricultural carbon credit calculator evaluator.
            A farming community has applied for carbon credits. 
            Here are the details:
            - Total active land area: ${total_land_area} acres
            - Number of participating farmers: ${profiles.length}
            - Common practices used: ${JSON.stringify(profiles.map(p => p.practices).flat())}
            
            Calculate the expected annual carbon credits (in tonnes of CO2 equivalent) this community should receive. 
            Consider typical soil sequestration rates for the practices mentioned.
            Respond ONLY with a single numeric value representing the total credits. Do not include text or units.
            `;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text().trim();
            const numericValue = parseFloat(responseText);

            if (!isNaN(numericValue) && numericValue > 0) {
                aiCalculatedTotal = numericValue;
                creditsPerAcre = aiCalculatedTotal / total_land_area;
                console.log(`AI calculated ${aiCalculatedTotal} total credits (${creditsPerAcre} per acre)`);
            } else {
                throw new Error("AI returned invalid number");
            }
        } catch (aiError) {
            console.warn("AI calculation failed, falling back to deterministic formula", aiError);
            // Fallback Formula: 1.5 credits per acre per year on average for regenerative practices
            creditsPerAcre = 1.5;
            aiCalculatedTotal = total_land_area * creditsPerAcre;
        }

        let totalDistributed = 0;

        // Distribute to individual users based on their land proportion
        for (const profile of profiles) {
            if (profile.hasdone_process && profile.landarea) {
                const individualCredits = Math.round((profile.landarea * creditsPerAcre) * 100) / 100;
                totalDistributed += individualCredits;

                const extractedUserId = typeof profile.userId === 'object' && profile.userId !== null ? profile.userId._id : profile.userId;

                await Credit.findOneAndUpdate(
                    { userId: extractedUserId },
                    {
                        $inc: { credit: individualCredits }
                    },
                    { upsert: true, new: true }
                );
            }
        }

        // Fetch Community Details to store aggregate record
        const communityDetails = await Community.findOne({ community_id });
        if (!communityDetails) {
            return NextResponse.json({ error: 'Community not found in db' }, { status: 404 });
        }

        // Update or Create Community Aggregate Credits
        await CommunityCarbonCredits.findOneAndUpdate(
            { community_id },
            {
                community_name: communityDetails.community_name,
                community_admin: communityDetails.community_admin,
                $inc: {
                    community_carbon_credits: totalDistributed,
                    total_credits_generated: totalDistributed,
                }
            },
            { upsert: true, new: true }
        );

        return NextResponse.json({
            success: true,
            message: "Credits calculated and distributed successfully",
            totalDistributed,
            method: creditsPerAcre === 1.5 ? 'fallback' : 'ai'
        }, { status: 200 });

    } catch (error: any) {
        console.error('Community Credit Divison Error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message
        }, { status: 500 });
    }
}
