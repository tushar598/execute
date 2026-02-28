import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Interface representing a User document in MongoDB.
 */
export interface ICredit extends Document {
    userId: string; // Reference to User model
    credit: number; // Asset volume (counts)
    balance: number; // Fiat earnings (currency)
    createdAt: Date;
    updatedAt: Date;
}

const CreditSchema: Schema<ICredit> = new Schema(
    {
        userId: {
            type: String,
            required: [true, 'User ID reference is required'],
            unique: true,
        },
        credit: {
            type: Number,
            required: [true, 'Credit is required'],
            default: 0,
        },
        balance: {
            type: Number,
            required: [true, 'Balance is required'],
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

const Credit: Model<ICredit> = mongoose.models.Credit || mongoose.model<ICredit>('Credit', CreditSchema);

export default Credit;