import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import dbConnect from '@/app/lib/db';
import User from '@/app/models/user';
import Company from '@/app/models/company';
import { signToken } from '@/app/lib/jwt';
import { z } from 'zod';

const loginSchema = z.object({
    role: z.enum(['individual', 'communityadmin', 'company']),
    identifier: z.string().min(1, 'Email or ID is required'), // can be email or userId/companyId
    password: z.string().min(1, 'Password is required'),
    tradingMode: z.enum(['credits', 'tokens']).optional().default('credits'),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { role, identifier, password, tradingMode } = loginSchema.parse(body);

        await dbConnect();

        let user;
        let payload;

        if (role === 'individual' || role === 'communityadmin') {
            // Find user by email or userId
            user = await User.findOne({
                $or: [{ email: identifier }, { userId: identifier }]
            });

            if (!user || !user.password) {
                return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
            }

            const userRole = user.role || 'individual';
            if (userRole !== role) {
                return NextResponse.json({ error: 'Account registered with a different role' }, { status: 401 });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
            }

            payload = { id: user._id, role: role, email: user.email, tradingMode };

        } else if (role === 'company') {
            // Find company by email or companyId
            user = await Company.findOne({
                $or: [{ companyEmail: identifier }, { companyId: identifier }]
            });

            if (!user || !user.password) {
                return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
            }

            payload = { id: user._id, role: 'company', email: user.companyEmail, tradingMode };
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
            message: 'Login successful',
            user: {
                id: (user as any)._id,
                role,
                tradingMode,
                email: (role === 'individual' || role === 'communityadmin') ? (user as any).email : (user as any).companyEmail,
            }
        }, { status: 200 });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
