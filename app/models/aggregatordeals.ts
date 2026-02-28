import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAggregatorDeals extends Document {
    aggregatorId: string;
    communityDealInfo?: {
        communityId: string;
        carboncreditBuy: number;
        creditPriceSet: number;
        totalValue: number;
    };
    individualDealInfo?: {
        userId: string;
        farmerName: string;
        carboncreditBuy: number;
        creditPriceSet: number;
        totalValue: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

const CommunityDealSchema = new Schema({
    communityId: { type: String, required: true },
    carboncreditBuy: { type: Number, required: true },
    creditPriceSet: { type: Number, required: true },
    totalValue: { type: Number, required: true },
}, { _id: false });

const IndividualDealSchema = new Schema({
    userId: { type: String, required: true },
    farmerName: { type: String, required: false, default: 'Farmer' },
    carboncreditBuy: { type: Number, required: true },
    creditPriceSet: { type: Number, required: true },
    totalValue: { type: Number, required: true },
}, { _id: false });

const AggregatorDealsSchema: Schema<IAggregatorDeals> = new Schema(
    {
        aggregatorId: {
            type: String,
            required: [true, 'Aggregator ID is required'],
            unique: false, // Don't unique this, one aggregator can have multiple deals
        },
        communityDealInfo: {
            type: CommunityDealSchema,
            required: false,
        },
        individualDealInfo: {
            type: IndividualDealSchema,
            required: false,
        },
    },
    { timestamps: true }
);

const AggregatorDeals: Model<IAggregatorDeals> = mongoose.models.AggregatorDeals || mongoose.model<IAggregatorDeals>('AggregatorDeals', AggregatorDealsSchema);

export default AggregatorDeals;