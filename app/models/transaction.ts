import mongoose, { Schema, Document } from 'mongoose'

export interface ITransaction extends Document {
    type: 'sale' | 'purchase' | 'transfer'
    fromId: string
    toId: string
    projectId?: string
    creditAmount: number
    pricePerCredit: number
    totalValue: number
    status: 'completed' | 'pending' | 'failed'
    createdAt: Date
    updatedAt: Date
}

const TransactionSchema = new Schema<ITransaction>(
    {
        type: { type: String, required: true, enum: ['sale', 'purchase', 'transfer'] },
        fromId: { type: String, required: true },
        toId: { type: String, required: true },
        projectId: { type: String },
        creditAmount: { type: Number, required: true, min: 1 },
        pricePerCredit: { type: Number, required: true, min: 0 },
        totalValue: { type: Number, required: true, min: 0 },
        status: { type: String, default: 'pending', enum: ['completed', 'pending', 'failed'] },
    },
    { timestamps: true }
)

TransactionSchema.index({ fromId: 1 })
TransactionSchema.index({ toId: 1 })
TransactionSchema.index({ projectId: 1 })
TransactionSchema.index({ createdAt: -1 })

export const Transaction =
    mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema)
