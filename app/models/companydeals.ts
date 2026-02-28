import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICompanyDeals extends Document {
    companyId: string;
    aggregatorId: string;
    projectId: string;
    projectName: string;
    creditAmount: number;
    pricePerCredit: number;
    totalValue: number;
    status: 'completed' | 'pending' | 'failed';
    transactionHash: string;
    createdAt: Date;
    updatedAt: Date;
}

const CompanyDealsSchema: Schema<ICompanyDeals> = new Schema(
    {
        companyId: { type: String, required: true },
        aggregatorId: { type: String, required: true },
        projectId: { type: String, required: true },
        projectName: { type: String, required: true },
        creditAmount: { type: Number, required: true },
        pricePerCredit: { type: Number, required: true },
        totalValue: { type: Number, required: true },
        status: { type: String, default: 'completed', enum: ['completed', 'pending', 'failed'] },
        transactionHash: { type: String },
    },
    { timestamps: true }
);

const CompanyDeals: Model<ICompanyDeals> = mongoose.models.CompanyDeals || mongoose.model<ICompanyDeals>('CompanyDeals', CompanyDealsSchema);

export default CompanyDeals;
