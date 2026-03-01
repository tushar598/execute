import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * SunToken tracks a seller's energy production, consumption, and available tokens.
 */
export interface ISunToken extends Document {
    userId: mongoose.Types.ObjectId;
    totalEnergyProduced: number; // kWh
    totalEnergyConsumed: number; // kWh
    leftoverEnergy: number;     // kWh
    tokensGenerated: number;
    tokensAvailable: number;
    tokensSold: number;
    balance: number;            // ₹ earned from token sales
    createdAt: Date;
    updatedAt: Date;
}

const SunTokenSchema: Schema<ISunToken> = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        totalEnergyProduced: { type: Number, default: 0 },
        totalEnergyConsumed: { type: Number, default: 0 },
        leftoverEnergy: { type: Number, default: 0 },
        tokensGenerated: { type: Number, default: 0 },
        tokensAvailable: { type: Number, default: 0 },
        tokensSold: { type: Number, default: 0 },
        balance: { type: Number, default: 0 },
    },
    { timestamps: true }
);

const SunToken: Model<ISunToken> =
    mongoose.models.SunToken ||
    mongoose.model<ISunToken>('SunToken', SunTokenSchema);

export default SunToken;
