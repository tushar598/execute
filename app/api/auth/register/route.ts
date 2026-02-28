import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import dbConnect from '@/app/lib/db';
import User from '@/app/models/user';
import Company from '@/app/models/company';
import Credit from '@/app/models/credit';
import ReferralData from '@/app/models/refferaldata';
import { signToken } from '@/app/lib/jwt';
import { z } from 'zod';

// Validation schemas
const userSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    userId: z.string().min(1, 'User ID is required'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

const companySchema = z.object({
    companyName: z.string().min(1, 'Company name is required'),
    companyEmail: z.string().email('Invalid email address'),
    companyId: z.string().min(1, 'Company ID is required'),
    companyPhone: z.string().min(10, 'Company phone must be at least 10 digits'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { role, referralCode, tradingMode: rawTradingMode, ...userData } = body;
        const tradingMode = rawTradingMode === 'tokens' ? 'tokens' : 'credits';

        await dbConnect();

        let newUser;
        let payload;

        if (role === 'individual' || role === 'communityadmin') {
            const validatedData = userSchema.parse(userData);

            // Check if user already exists
            const existingUser = await User.findOne({
                $or: [{ email: validatedData.email }, { userId: validatedData.userId }]
            });

            if (existingUser) {
                return NextResponse.json(
                    { error: 'User with this email or userId already exists' },
                    { status: 400 }
                );
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(validatedData.password, 12);

            // Create user
            newUser = await User.create({
                ...validatedData,
                password: hashedPassword,
                role: role,
            });

            payload = { id: newUser._id, role: role, email: newUser.email, tradingMode };

            // ---- Referral credit logic ----
            if (referralCode && typeof referralCode === 'string' && referralCode.trim()) {
                const referralDoc = await ReferralData.findOne({ code: referralCode.trim() });
                if (referralDoc) {
                    // Increment referred count for the code owner
                    await ReferralData.findByIdAndUpdate(referralDoc._id, { $inc: { referredCount: 1 } });
                    // Award +1 credit to the referral code owner
                    await Credit.findOneAndUpdate(
                        { userId: referralDoc.ownerId },
                        { $inc: { credit: 1 } },
                        { upsert: true, new: true, setDefaultsOnInsert: true }
                    );
                    // Award +1 credit to the newly registered user
                    await Credit.findOneAndUpdate(
                        { userId: String(newUser._id) },
                        { $inc: { credit: 1 } },
                        { upsert: true, new: true, setDefaultsOnInsert: true }
                    );
                }
            }
            // ---- End referral logic ----

        } else if (role === 'company') {
            const validatedData = companySchema.parse(userData);

            // Check if company already exists
            const existingCompany = await Company.findOne({
                $or: [{ companyEmail: validatedData.companyEmail }, { companyId: validatedData.companyId }]
            });

            if (existingCompany) {
                return NextResponse.json(
                    { error: 'Company with this email or ID already exists' },
                    { status: 400 }
                );
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(validatedData.password, 12);

            // Create company
            newUser = await Company.create({
                ...validatedData,
                password: hashedPassword,
            });

            payload = { id: newUser._id, role: 'company', email: newUser.companyEmail, tradingMode };

        } else {
            return NextResponse.json({ error: 'Invalid role provided' }, { status: 400 });
        }

        // Generate JWT
        const token = signToken(payload);

        // Set cookie
        const cookieStore = await cookies();
        cookieStore.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: '/',
        });

        // Set tradingMode cookie (readable by client)
        cookieStore.set('tradingMode', tradingMode, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60,
            path: '/',
        });

        return NextResponse.json({
            message: 'Registration successful',
            user: {
                id: (newUser as any)._id,
                role,
                tradingMode,
                email: (role === 'individual' || role === 'communityadmin') ? (newUser as any).email : (newUser as any).companyEmail,
            }
        }, { status: 201 });

    } catch (error: any) {
        console.error('Registration Error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
