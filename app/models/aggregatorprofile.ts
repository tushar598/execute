import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Interface representing a User document in MongoDB.
 */
export interface IAggregator extends Document {
    userId: mongoose.Types.ObjectId; // Reference to User model
    DealerId: string;
    createdAt: Date;
    updatedAt: Date;
}

const AggregatorSchema: Schema<IAggregator> = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID reference is required'],
            unique: true,
        },
        DealerId: {
            type: String,
            required: [true, 'Dealer ID is required'],
            unique: true,
        },
    },
    {
        timestamps: true,
    }
);

const Aggregator: Model<IAggregator> = mongoose.models.Aggregator || mongoose.model<IAggregator>('Aggregator', AggregatorSchema);

export default Aggregator;