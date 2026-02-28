import mongoose, { Document, Schema, Model } from "mongoose";

export interface ICarbonMarket extends Document {
    communityCarbonMarket: {
        communityId: string;
        communityName: string;
        community_description: string;
        community_carbon_credit_number: number;
        createdAt: Date;
        updatedAt: Date;
    },
    individualCarbonMarket: {
        userId: string;
        userName: string;
        user_description: string;
        user_carbon_credit_number: number;
        createdAt: Date;
        updatedAt: Date;
    }
}

const CarbonMarketSchema: Schema<ICarbonMarket> = new Schema(
    {
        communityCarbonMarket: {
            type: {
                communityId: {
                    type: String,
                    required: [true, 'Community ID is required'],
                },
                communityName: {
                    type: String,
                    required: [true, 'Community name is required'],
                },
                community_description: {
                    type: String,
                    required: [true, 'Community description is required'],
                },
                community_carbon_credit_number: {
                    type: Number,
                    required: [true, 'Community carbon credit number is required'],
                },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
                updatedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
            required: false,
        },
        individualCarbonMarket: {
            type: {
                userId: {
                    type: String,
                    required: [true, 'User ID is required'],
                },
                userName: {
                    type: String,
                    required: [true, 'User name is required'],
                },
                user_description: {
                    type: String,
                    required: [true, 'User description is required'],
                },
                user_carbon_credit_number: {
                    type: Number,
                    required: [true, 'User carbon credit number is required'],
                },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
                updatedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
            required: false,
        },
    },
    {
        timestamps: true,
    }
);

const CarbonMarket: Model<ICarbonMarket> = mongoose.models.CarbonMarket || mongoose.model<ICarbonMarket>('CarbonMarket', CarbonMarketSchema);

export default CarbonMarket;