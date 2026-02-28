import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserProfile extends Document {
    userId: mongoose.Types.ObjectId; // Reference to User model
    communityId?: string;
    community_name?: string;
    hasdone_process: boolean;
    aadhar_card_no: string;
    pan_card_no: string;
    bank_account_no: string;
    IFSC_no: string;
    entry_status: "individual" | "community";
    practices: string[];
    urea_amount: string;
    landlocation: {
        lat: number;
        lng: number;
    };
    landarea: number;
    previous_climate_land_data: {
        data: Buffer;
        contentType: string;
    };
    current_crop: string[];
    previous_crop: string[];
    soil_type: "loam" | "sandy" | "clay" | "alluvial" | "black";
    soil_test_report: {
        data: Buffer;
        contentType: string;
    };
}

const UserProfileSchema: Schema<IUserProfile> = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID reference is required'],
            unique: true,
        },
        communityId: {
            type: String,
            required: false,
        },
        community_name: {
            type: String,
            required: false,
        },
        hasdone_process: {
            type: Boolean,
            required: [true, 'Process status is required'],
            default: false,
        },
        aadhar_card_no: {
            type: String,
            required: [true, 'Aadhar card number is required'],
            trim: true,
        },
        pan_card_no: {
            type: String,
            required: [true, 'PAN card number is required'],
            trim: true,
        },
        bank_account_no: {
            type: String,
            required: [true, 'Bank account number is required'],
            trim: true,
        },
        IFSC_no: {
            type: String,
            required: [true, 'IFSC code is required'],
            trim: true,
        },
        entry_status: {
            type: String,
            enum: ["individual", "community"],
            required: [true, 'Entry status is required'],
        },
        practices: {
            type: [String],
            required: [true, 'Practices are required'],
        },
        urea_amount: {
            type: String,
            required: [true, 'Urea amount is required'],
        },
        landlocation: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true },
        },
        landarea: {
            type: Number,
            required: [true, 'Land area is required'],
        },
        previous_climate_land_data: {
            data: { type: Buffer, required: true },
            contentType: { type: String, required: true },
        },
        current_crop: {
            type: [String],
            required: [true, 'Current crop info is required'],
        },
        previous_crop: {
            type: [String],
            required: [true, 'Previous crop info is required'],
        },
        soil_type: {
            type: String,
            enum: ["loam", "sandy", "clay", "alluvial", "black"],
            required: [true, 'Soil type is required'],
        },
        soil_test_report: {
            data: { type: Buffer, required: true },
            contentType: { type: String, required: true },
        },
    },
    {
        timestamps: true,
    }
);

const UserProfile: Model<IUserProfile> = mongoose.models.UserProfile || mongoose.model<IUserProfile>('UserProfile', UserProfileSchema);

export default UserProfile;