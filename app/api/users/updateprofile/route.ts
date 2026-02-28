import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/app/lib/db';
import UserProfile from '@/app/models/userprofile';
import { verifyToken } from '@/app/lib/jwt';
import { z } from 'zod';

// Define partial Zod schema for updates
const UpdateProfileSchema = z.object({
    communityId: z.string().optional(),
    community_name: z.string().optional(),
    aadhar_card_no: z.string().optional(),
    pan_card_no: z.string().optional(),
    bank_account_no: z.string().optional(),
    IFSC_no: z.string().optional(),
    entry_status: z.enum(['individual', 'community']).optional(),
    practices: z.array(z.string()).optional(),
    urea_amount: z.string().optional(),
    landarea: z.coerce.number().positive().optional(),
    landlocation: z.object({
        lat: z.coerce.number(),
        lng: z.coerce.number(),
    }).optional(),
    current_crop: z.array(z.string()).optional(),
    previous_crop: z.array(z.string()).optional(),
    soil_type: z.enum(['loam', 'sandy', 'clay', 'alluvial', 'black']).optional(),
});

export async function PATCH(req: NextRequest) {
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

        // Helper function to get files if they exist
        const getFileBuffer = async (fieldName: string) => {
            const file = formData.get(fieldName) as File | null;
            if (!file || typeof file === 'string') return null;
            const bytes = await file.arrayBuffer();
            return {
                data: Buffer.from(bytes),
                contentType: file.type
            };
        };

        const updateData: any = {};

        // 3. Extract Optional Files
        const land_document = await getFileBuffer('land_document');
        const previous_climate_land_data = await getFileBuffer('previous_climate_land_data');
        const soil_test_report = await getFileBuffer('soil_test_report');

        if (land_document) updateData.land_document = land_document;
        if (previous_climate_land_data) updateData.previous_climate_land_data = previous_climate_land_data;
        if (soil_test_report) updateData.soil_test_report = soil_test_report;

        // 4. Extract and Parse JSON fields
        const parseJsonField = (fieldName: string) => {
            const value = formData.get(fieldName);
            if (!value) return undefined;
            try {
                const parsed = JSON.parse(value as string);
                return Array.isArray(parsed) ? parsed : [parsed];
            } catch {
                return [value];
            }
        };

        const rawData: any = {};
        const fields = [
            'communityId', 'community_name', 'aadhar_card_no', 'pan_card_no',
            'bank_account_no', 'IFSC_no', 'entry_status', 'urea_amount',
            'landarea', 'soil_type'
        ];

        fields.forEach(field => {
            const val = formData.get(field);
            if (val !== null) rawData[field] = val;
        });

        // Handle Array Fields
        const arrayFields = ['practices', 'current_crop', 'previous_crop'];
        arrayFields.forEach(field => {
            const val = parseJsonField(field);
            if (val !== undefined) rawData[field] = val;
        });

        // Handle nested Object Field
        const lat = formData.get('lat');
        const lng = formData.get('lng');
        if (lat !== null && lng !== null) {
            rawData.landlocation = { lat, lng };
        }

        // 5. Validation
        const validatedData = UpdateProfileSchema.safeParse(rawData);

        if (!validatedData.success) {
            return NextResponse.json({ error: 'Validation failed', details: validatedData.error.format() }, { status: 400 });
        }

        // Merge validated data into updateData
        Object.assign(updateData, validatedData.data);

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ message: 'No changes provided' }, { status: 200 });
        }

        // 6. Update Database
        const updatedProfile = await UserProfile.findOneAndUpdate(
            { userId: decoded.id },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedProfile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        return NextResponse.json({
            message: 'Profile updated successfully',
            profile: updatedProfile
        }, { status: 200 });

    } catch (error: any) {
        console.error('Update Profile Error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message
        }, { status: 500 });
    }
}
