import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Interface representing a Community document in MongoDB.
 */
export interface ICommunityCarbonCredits extends Document {
    community_name: string;
    community_id: string;
    community_admin: string;
    community_carbon_credits: number;
    total_credits_generated: number;
    credits_sold: number;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Mongoose schema for the CommunityCarbonCredits model.
 */
const CommunityCarbonCreditsSchema: Schema<ICommunityCarbonCredits> = new Schema(
    {
        community_name: {
            type: String,
            required: [true, 'Community name is required'],
            trim: true,
        },
        community_id: {
            type: String,
            required: [true, 'Community ID is required'],
            unique: true,
            trim: true,
        },
        community_admin: {
            type: String,
            required: [true, 'Community admin name is required'],
            trim: true,
        },
        community_carbon_credits: {
            type: Number,
            required: [true, 'Community carbon credits are required'],
        },
        total_credits_generated: {
            type: Number,
            default: 0,
        },
        credits_sold: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt
    }
);

// Prevent re-compilation of the model if it already exists
const CommunityCarbonCredits: Model<ICommunityCarbonCredits> =
    mongoose.models.CommunityCarbonCredits || mongoose.model<ICommunityCarbonCredits>('CommunityCarbonCredits', CommunityCarbonCreditsSchema);

export default CommunityCarbonCredits;
