import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Interface representing a User document in MongoDB.
 */
export interface IUser extends Document {
    userId: string;
    username: string;
    phone: string;
    email: string;
    password?: string; // Optional for cases where it's not needed in memory
    role: 'individual' | 'communityadmin';
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Mongoose schema for the User model.
 */
const UserSchema: Schema<IUser> = new Schema(
    {
        userId: {
            type: String,
            required: [true, 'User ID is required'],
            unique: true,
            trim: true,
        },
        username: {
            type: String,
            required: [true, 'Username is required'],
            unique: true,
            trim: true,
        },

        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            unique: true,
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
        },
        role: {
            type: String,
            enum: ['individual', 'communityadmin'],
            default: 'individual',
            required: true,
        },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt
    }
);

// Prevent re-compilation of the model if it already exists (useful in Next.js HMR)
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
