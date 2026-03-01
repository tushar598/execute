import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Listing created when a seller puts their Sun Tokens on the marketplace.
 */
export interface ISunTokenMarketListing extends Document {
    sellerId: mongoose.Types.ObjectId;
    sellerName: string;
    tokens: number;
    pricePerToken: number;
    totalValue: number;
    location: { lat: number; lng: number };
    state: string;
    status: 'available' | 'sold';
    createdAt: Date;
    updatedAt: Date;
}

// const SunTokenMarketListingSchema: Schema<ISunTokenMarketListing> = new Schema(
//     {
//         sellerId: {
//             type: Schema.Types.ObjectId,
//             ref: 'User',
//             required: true,
//         },
//         sellerName: { type: String, required: true, trim: true },
//         tokens: { type: Number, required: true, min: 1 },
//         pricePerToken: { type: Number, required: true },
//         totalValue: { type: Number, required: true },
//         location: {
//             lat: { type: Number, required: true },
//             lng: { type: Number, required: true },
//         },
//         state: { type: String, required: true, trim: true },
//         status: {
//             type: String,
//             enum: ['available', 'sold'],
//             default: 'available',
//         },
//     },
//     { timestamps: true }
// );

// const SunTokenMarketListing: Model<ISunTokenMarketListing> =
//     mongoose.models.SunTokenMarketListing ||
//     mongoose.model<ISunTokenMarketListing>('SunTokenMarketListing', SunTokenMarketListingSchema);

// export default SunTokenMarketListing;
