import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * MemberPayout — records the earnings sent to a community member
 * when a company purchases an aggregator project.
 *
 * One record per member per project sale.
 */
export interface IMemberPayout extends Document {
    userId: string;           // The community member's userId (string form)
    communityId: string;      // The community they belong to
    projectId: string;        // The AggregatorProject that was sold
    projectName: string;      // Denormalized for easy display
    aggregatorId: string;     // The aggregator who sold the project
    companyId: string;        // The company that purchased
    creditAmount: number;     // How many of member's credits were included
    pricePerCredit: number;   // The community-agreed price per credit
    totalPayout: number;      // creditAmount * pricePerCredit
    transactionId: string;    // Ref to the main Transaction document
    status: 'completed' | 'pending' | 'failed';
    createdAt: Date;
    updatedAt: Date;
}

const MemberPayoutSchema: Schema<IMemberPayout> = new Schema(
    {
        userId: {
            type: String,
            required: [true, 'User ID is required'],
            trim: true,
        },
        communityId: {
            type: String,
            required: [true, 'Community ID is required'],
            trim: true,
        },
        projectId: {
            type: String,
            required: [true, 'Project ID is required'],
            trim: true,
        },
        projectName: {
            type: String,
            required: [true, 'Project name is required'],
            trim: true,
        },
        aggregatorId: {
            type: String,
            required: [true, 'Aggregator ID is required'],
            trim: true,
        },
        companyId: {
            type: String,
            required: [true, 'Company ID is required'],
            trim: true,
        },
        creditAmount: {
            type: Number,
            required: [true, 'Credit amount is required'],
            min: 0,
        },
        pricePerCredit: {
            type: Number,
            required: [true, 'Price per credit is required'],
            min: 0,
        },
        totalPayout: {
            type: Number,
            required: [true, 'Total payout is required'],
            min: 0,
        },
        transactionId: {
            type: String,
            required: [true, 'Transaction ID is required'],
        },
        status: {
            type: String,
            enum: ['completed', 'pending', 'failed'],
            default: 'completed',
        },
    },
    { timestamps: true }
);

// Indexes for fast dashboard queries
MemberPayoutSchema.index({ userId: 1, createdAt: -1 });
MemberPayoutSchema.index({ communityId: 1, createdAt: -1 });
MemberPayoutSchema.index({ projectId: 1 });
MemberPayoutSchema.index({ aggregatorId: 1, createdAt: -1 });

const MemberPayout: Model<IMemberPayout> =
    mongoose.models.MemberPayout ||
    mongoose.model<IMemberPayout>('MemberPayout', MemberPayoutSchema);

export default MemberPayout;
