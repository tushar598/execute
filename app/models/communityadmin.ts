import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Interface representing a CommunityAdmin document in MongoDB.
 * Normalized approach: Stores only the link between a user and a community.
 */
export interface ICommunityAdmin extends Document {
    userId: mongoose.Types.ObjectId; // Reference to User model
    community_id: string; // Link to Community source of truth
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Mongoose schema for the CommunityAdmin model.
 */
const CommunityAdminSchema: Schema<ICommunityAdmin> = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID reference is required'],
            unique: true,
        },
        community_id: {
            type: String,
            required: [true, 'Community ID is required'],
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

const CommunityAdmin: Model<ICommunityAdmin> =
    mongoose.models.CommunityAdmin || mongoose.model<ICommunityAdmin>('CommunityAdmin', CommunityAdminSchema);

export default CommunityAdmin;
