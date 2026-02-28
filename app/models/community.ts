import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Interface representing a Community document in MongoDB.
 */
export interface ICommunity extends Document {
    community_name: string;
    community_id: string;
    community_district: string;
    community_admin: string;
    community_practices: string[];
    community_members_id?: string[];
    community_admin_id: string;
    community_state: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Mongoose schema for the Community model.
 */
const CommunitySchema: Schema<ICommunity> = new Schema(
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
        community_district: {
            type: String,
            required: [true, 'Community district is required'],
            trim: true,
        },
        community_admin: {
            type: String,
            required: [true, 'Community admin name is required'],
            trim: true,
        },
        community_practices: {
            type: [String],
            required: [true, 'Community practices are required'],
        },
        community_members_id: {
            type: [String],
            default: [],
        },
        community_admin_id: {
            type: String,
            required: [true, 'Community admin ID is required'],
            trim: true,
        },
        community_state: {
            type: String,
            required: [true, 'Community state is required'],
            trim: true,
        },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt
    }
);

// Prevent re-compilation of the model if it already exists
const Community: Model<ICommunity> =
    mongoose.models.Community || mongoose.model<ICommunity>('Community', CommunitySchema);

export default Community;
