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

