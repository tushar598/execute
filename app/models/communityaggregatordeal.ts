import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICommunityAggregatorDeal extends Document {
    community_id: string; // The target community
    aggregator_id: string; // The proposing aggregator 
    credits_offered: number; // How many credits the aggregator wants to buy
    price_per_credit: number; // The price offered per credit
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: Date;
    updatedAt: Date;
}

const CommunityAggregatorDealSchema: Schema<ICommunityAggregatorDeal> = new Schema(
    {
        community_id: {
            type: String,
            required: [true, 'Community ID is required'],
            trim: true,
        },
        aggregator_id: {
            type: String,
            required: [true, 'Aggregator ID is required'],
            trim: true,
        },
        credits_offered: {
            type: Number,
            required: [true, 'Number of credits offered is required'],
        },
        price_per_credit: {
            type: Number,
            required: [true, 'Price per credit is required'],
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending',
        },
    },
    {
        timestamps: true,
    }
);

const CommunityAggregatorDeal: Model<ICommunityAggregatorDeal> =
    mongoose.models.CommunityAggregatorDeal || mongoose.model<ICommunityAggregatorDeal>('CommunityAggregatorDeal', CommunityAggregatorDealSchema);

export default CommunityAggregatorDeal;
