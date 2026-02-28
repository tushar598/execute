import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Records a Sun Token purchase with multi-step government processing.
 */
export interface ISunTokenTransaction extends Document {
    buyerId: mongoose.Types.ObjectId;
    sellerId: mongoose.Types.ObjectId;
    listingId: mongoose.Types.ObjectId;
    tokenAmount: number;
    pricePerToken: number;
    totalAmount: number;
    status: 'processing' | 'govt_review' | 'delivered' | 'payment_sent' | 'completed';
    govtProcessedAt: Date | null;
    deliveredAt: Date | null;
    paymentSentAt: Date | null;
    txHash: string;
    createdAt: Date;
    updatedAt: Date;
}

const SunTokenTransactionSchema: Schema<ISunTokenTransaction> = new Schema(
    {
        buyerId: { type: Schema.Types.ObjectId, required: true },
        sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        listingId: { type: Schema.Types.ObjectId, ref: 'SunTokenMarketListing', required: true },
        tokenAmount: { type: Number, required: true, min: 1 },
        pricePerToken: { type: Number, required: true },
        totalAmount: { type: Number, required: true },
        status: {
            type: String,
            enum: ['processing', 'govt_review', 'delivered', 'payment_sent', 'completed'],
            default: 'processing',
        },
        govtProcessedAt: { type: Date, default: null },
        deliveredAt: { type: Date, default: null },
        paymentSentAt: { type: Date, default: null },
        txHash: { type: String, required: true },
    },
    { timestamps: true }
);

const SunTokenTransaction: Model<ISunTokenTransaction> =
    mongoose.models.SunTokenTransaction ||
    mongoose.model<ISunTokenTransaction>('SunTokenTransaction', SunTokenTransactionSchema);

export default SunTokenTransaction;
