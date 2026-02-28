import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAggregatorProject extends Document {
    aggregatorId: string;       // The aggregator's DealerId
    projectName: string;
    projectDescription: string;
    sourceCommunityIds: string[];  // Which communities contributed credits
    totalCredits: number;          // Total credits in this project bundle
    pricePerCredit: number;        // Price the aggregator is asking from companies
    status: 'open' | 'sold' | 'cancelled';
    buyerCompanyId?: string;       // Filled once sold
    createdAt: Date;
    updatedAt: Date;
}

const AggregatorProjectSchema: Schema<IAggregatorProject> = new Schema(
    {
        aggregatorId: {
            type: String,
            required: [true, 'Aggregator ID is required'],
        },
        projectName: {
            type: String,
            required: [true, 'Project name is required'],
            trim: true,
        },
        projectDescription: {
            type: String,
            required: [true, 'Project description is required'],
            trim: true,
        },
        sourceCommunityIds: {
            type: [String],
            default: [],
        },
        totalCredits: {
            type: Number,
            required: [true, 'Total credits are required'],
        },
        pricePerCredit: {
            type: Number,
            required: [true, 'Price per credit is required'],
        },
        status: {
            type: String,
            enum: ['open', 'sold', 'cancelled'],
            default: 'open',
        },
        buyerCompanyId: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

const AggregatorProject: Model<IAggregatorProject> =
    mongoose.models.AggregatorProject ||
    mongoose.model<IAggregatorProject>('AggregatorProject', AggregatorProjectSchema);

export default AggregatorProject;
