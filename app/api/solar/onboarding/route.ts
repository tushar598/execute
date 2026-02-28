import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/app/lib/db';
import SolarProfile from '@/app/models/solarprofile';
import { verifyToken } from '@/app/lib/jwt';
import { z } from 'zod';

const OnboardingSchema = z.object({
    address: z.string().min(1, 'Address is required'),
    lat: z.coerce.number(),
    lng: z.coerce.number(),
    state: z.string().min(1, 'State is required'),
    digitalMeterNumber: z.string().min(1, 'Digital meter number is required'),
    bankAccountNo: z.string().min(1, 'Bank account number is required'),
    IFSCNo: z.string().min(1, 'IFSC code is required'),
    aadharCardNo: z.string().min(1, 'Aadhar card number is required'),
    panCardNo: z.string().min(1, 'PAN card number is required'),
});

export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded: any = verifyToken(token);
        if (!decoded?.id) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

        const formData = await req.formData();

        // Extract electricity bill
        const billFile = formData.get('electricityBill') as File | null;
        let electricityBill = null;
        if (billFile) {
            const bytes = await billFile.arrayBuffer();
            electricityBill = { data: Buffer.from(bytes), contentType: billFile.type };
        }

        const rawData = {
            address: formData.get('address'),
            lat: formData.get('lat'),
            lng: formData.get('lng'),
            state: formData.get('state'),
            digitalMeterNumber: formData.get('digitalMeterNumber'),
            bankAccountNo: formData.get('bankAccountNo'),
            IFSCNo: formData.get('IFSCNo'),
            aadharCardNo: formData.get('aadharCardNo'),
            panCardNo: formData.get('panCardNo'),
        };

        const validated = OnboardingSchema.safeParse(rawData);
        if (!validated.success) {
            return NextResponse.json({ error: 'Validation failed', details: validated.error.format() }, { status: 400 });
        }

        const existing = await SolarProfile.findOne({ userId: decoded.id });
        if (existing) {
            return NextResponse.json({ error: 'Solar profile already exists' }, { status: 409 });
        }

        const userType = decoded.role === 'company' ? 'company' : 'individual';

        const profile = new SolarProfile({
            userId: decoded.id,
            userType,
            address: validated.data.address,
            coordinates: { lat: validated.data.lat, lng: validated.data.lng },
            state: validated.data.state,
            digitalMeterNumber: validated.data.digitalMeterNumber,
            electricityBill,
            bankAccountNo: validated.data.bankAccountNo,
            IFSCNo: validated.data.IFSCNo,
            aadharCardNo: validated.data.aadharCardNo,
            panCardNo: validated.data.panCardNo,
            hasdone_process: true,
        });

        await profile.save();

        return NextResponse.json({ message: 'Solar profile created successfully', profileId: profile._id }, { status: 201 });
    } catch (error: any) {
        console.error('Solar Onboarding Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
