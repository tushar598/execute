import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * SolarProfile stores onboarding data for Sun Token users (both sellers & buyers).
 */
export interface ISolarProfile extends Document {
    userId: mongoose.Types.ObjectId;
    userType: 'individual' | 'company';
    address: string;
    coordinates: { lat: number; lng: number };
    state: string;
    digitalMeterNumber: string;
    electricityBill: { data: Buffer; contentType: string } | null;
    bankAccountNo: string;
    IFSCNo: string;
    aadharCardNo: string;
    panCardNo: string;
    hasdone_process: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const SolarProfileSchema: Schema<ISolarProfile> = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            unique: true,
            refPath: 'userType',
        },
        userType: {
            type: String,
            enum: ['individual', 'company'],
            required: true,
        },
        address: {
            type: String,
            required: [true, 'Address is required'],
            trim: true,
        },
        coordinates: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true },
        },
        state: {
            type: String,
            required: [true, 'State is required'],
            trim: true,
        },
        digitalMeterNumber: {
            type: String,
            required: [true, 'Digital meter number is required'],
            trim: true,
        },
        electricityBill: {
            data: Buffer,
            contentType: String,
        },
        bankAccountNo: {
            type: String,
            required: [true, 'Bank account number is required'],
            trim: true,
        },
        IFSCNo: {
            type: String,
            required: [true, 'IFSC code is required'],
            trim: true,
        },
        aadharCardNo: {
            type: String,
            required: [true, 'Aadhar card number is required'],
            trim: true,
        },
        panCardNo: {
            type: String,
            required: [true, 'PAN card number is required'],
            trim: true,
        },
        hasdone_process: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

const SolarProfile: Model<ISolarProfile> =
    mongoose.models.SolarProfile ||
    mongoose.model<ISolarProfile>('SolarProfile', SolarProfileSchema);

export default SolarProfile;
