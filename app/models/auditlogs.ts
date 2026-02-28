import mongoose, { Schema, Document } from 'mongoose'

export interface IAuditLog extends Document {
    action: 'credit_generated' | 'credit_purchased' | 'credit_verified' | 'profile_updated' | 'score_calculated' | 'credit_listed' | 'project_created' | 'deal_accepted' | 'transaction_completed' | 'credit_distributed' | 'aggregator_sale_completed' | 'credit_sold_direct' | 'individual_credit_listed' | 'individual_credit_purchased' | 'sun_token_listed' | 'sun_token_purchased'
    entityType: string
    entityId: string
    userId: string
    metadata: Record<string, any>
    txHash: string
    previousHash: string
    timestamp: Date
}

const AuditLogSchema = new Schema<IAuditLog>({
    action: {
        type: String,
        required: true,
        enum: ['credit_generated', 'credit_purchased', 'credit_verified', 'profile_updated', 'score_calculated', 'credit_listed', 'project_created', 'deal_accepted', 'transaction_completed', 'credit_distributed', 'aggregator_sale_completed', 'credit_sold_direct', 'individual_credit_listed', 'individual_credit_purchased', 'sun_token_listed', 'sun_token_purchased'],
    },
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    userId: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    txHash: { type: String, required: true },
    previousHash: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
})

AuditLogSchema.index({ entityId: 1 })
AuditLogSchema.index({ userId: 1 })
AuditLogSchema.index({ action: 1 })
AuditLogSchema.index({ timestamp: -1 })

export const AuditLog =
    mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema)
