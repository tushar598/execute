import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReferralData extends Document {
    ownerId: string; // _id of the User who owns this referral code
    code: string;    // Unique 20-char alphanumeric code
    referredCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const ReferralDataSchema: Schema<IReferralData> = new Schema(
    {
        ownerId: {
            type: String,
            required: [true, 'Owner user ID is required'],
            unique: true, // One code per user
        },
        code: {
            type: String,
            required: [true, 'Referral code is required'],
            unique: true,
            trim: true,
        },
        referredCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

const ReferralData: Model<IReferralData> =
    mongoose.models.ReferralData ||
    mongoose.model<IReferralData>('ReferralData', ReferralDataSchema);

export default ReferralData;
