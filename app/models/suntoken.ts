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

