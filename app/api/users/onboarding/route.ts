import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/app/lib/db';
import UserProfile from '@/app/models/userprofile';
import Community from '@/app/models/community';
import { verifyToken } from '@/app/lib/jwt';
import { z } from 'zod';

// Define Zod schema for validation
const OnboardingSchema = z.object({
    communityId: z.string().nullable().optional().or(z.literal('')),
    community_name: z.string().nullable().optional().or(z.literal('')),
    aadhar_card_no: z.string().min(1, 'Aadhar card number is required'),
    pan_card_no: z.string().min(1, 'PAN card number is required'),
    bank_account_no: z.string().min(1, 'Bank account number is required'),
    IFSC_no: z.string().min(1, 'IFSC code is required'),
    entry_status: z.enum(['individual', 'community']),
    practices: z.array(z.string()).min(1, 'At least one practice is required'),
    urea_amount: z.string().min(1, 'Urea amount is required'),
    landarea: z.coerce.number().positive('Land area must be a positive number'),
    landlocation: z.object({
        lat: z.coerce.number(),
        lng: z.coerce.number(),
    }),
    current_crop: z.array(z.string()).min(1, 'At least one current crop is required'),
    previous_crop: z.array(z.string()).min(1, 'At least one previous crop is required'),
    soil_type: z.enum(['loam', 'sandy', 'clay', 'alluvial', 'black']),
});

export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        // 1. Authentication Check
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded: any = verifyToken(token);
        if (!decoded || !decoded.id) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }

        // 2. Parse Multipart Form Data
        const formData = await req.formData();

        // Helper function to get files from formData
        const getFileBuffer = async (fieldName: string) => {
            const file = formData.get(fieldName) as File | null;
            if (!file) return null;
            const bytes = await file.arrayBuffer();
            return {
                data: Buffer.from(bytes),
                contentType: file.type
            };
        };

        // 3. Extract Files
        const previous_climate_land_data = await getFileBuffer('previous_climate_land_data');
        const soil_test_report = await getFileBuffer('soil_test_report');

        if (!previous_climate_land_data || !soil_test_report) {
            return NextResponse.json({ error: 'All files (climate land data, soil test report) are required' }, { status: 400 });
        }

        // 4. Extract and Parse JSON fields
        // Practices and Crops might be sent as JSON strings or multiple form fields
        const parseJsonField = (fieldName: string) => {
            const value = formData.get(fieldName);
            if (!value) return [];
            try {
                const parsed = JSON.parse(value as string);
                return Array.isArray(parsed) ? parsed : [parsed];
            } catch {
                return [value]; // Fallback if not JSON
            }
        };

        const rawData = {
            communityId: formData.get('communityId') || undefined,
            community_name: formData.get('community_name') || undefined,
            aadhar_card_no: formData.get('aadhar_card_no'),
            pan_card_no: formData.get('pan_card_no'),
            bank_account_no: formData.get('bank_account_no'),
            IFSC_no: formData.get('IFSC_no'),
            entry_status: formData.get('entry_status'),
            practices: parseJsonField('practices'),
            urea_amount: formData.get('urea_amount'),
            landarea: formData.get('landarea'),
            landlocation: {
                lat: formData.get('lat'),
                lng: formData.get('lng'),
            },
            current_crop: parseJsonField('current_crop'),
            previous_crop: parseJsonField('previous_crop'),
            soil_type: formData.get('soil_type'),
        };

        // 5. Validation
        const validatedData = OnboardingSchema.safeParse(rawData);

        if (!validatedData.success) {
            return NextResponse.json({ error: 'Validation failed', details: validatedData.error.format() }, { status: 400 });
        }

        // 6. Check if Profile Already Exists
        const existingProfile = await UserProfile.findOne({ userId: decoded.id });
        if (existingProfile) {
            return NextResponse.json({ error: 'User profile already exists' }, { status: 409 });
        }

        // 7. Save to Database
        const newUserProfile = new UserProfile({
            userId: decoded.id,
            ...validatedData.data,
            previous_climate_land_data,
            soil_test_report,
            hasdone_process: true, // Flag as completed
        });

        await newUserProfile.save();

        // 8. Handle Community Membership if entry_status is 'community'
        if (validatedData.data.entry_status === 'community' && validatedData.data.communityId) {
            const communityId = validatedData.data.communityId;
            const userId = decoded.id;

            try {
                // Verify the community exists
                const community = await Community.findOne({ community_id: communityId });
                if (community) {
                    await Community.findOneAndUpdate(
                        { community_id: communityId },
                        { $addToSet: { community_members_id: userId } }
                    );
                } else {
                    console.warn(`Community with ID ${communityId} not found during onboarding for user ${userId}`);
                }
            } catch (communityError: any) {
                console.error('Error adding user to community:', communityError);
                // We don't necessarily want to fail the whole onboarding if only the community link fails,
                // but in this context, the user specifically chose this community.
            }
        }

        return NextResponse.json({
            message: 'User profile created successfully',
            profileId: newUserProfile._id
        }, { status: 201 });

    } catch (error: any) {
        console.error('Onboarding Error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message
        }, { status: 500 });
    }
}
