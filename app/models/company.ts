import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Interface representing a Company document in MongoDB.
 */
export interface ICompany extends Document {
    companyName: string;
    companyEmail: string;
    companyId: string;
    companyPhone: string;
    password?: string; // Optional for cases where it's not needed in memory
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Mongoose schema for the Company model.
 */
const CompanySchema: Schema<ICompany> = new Schema(
    {
        companyName: {
            type: String,
            required: [true, 'Company name is required'],
            trim: true,
        },
        companyEmail: {
            type: String,
            required: [true, 'Company email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
        },
        companyId: {
            type: String,
            required: [true, 'Company ID is required'],
            unique: true,
            trim: true,
        },
        companyPhone: {
            type: String,
            required: [true, 'Company phone number is required'],
            unique: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
        },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt
    }
);

// Prevent re-compilation of the model if it already exists (useful in Next.js HMR)
const Company: Model<ICompany> = mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema);

export default Company;
