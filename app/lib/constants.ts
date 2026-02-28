/**
 * Platform-wide constants.
 * The aggregator role is now a SYSTEM reference — no human aggregator is needed.
 *
 * SYSTEM_AGGREGATOR_ID  : Used as the aggregatorId in all AggregatorProject /
 *                         AggregatorDeals / MemberPayout records so the rest of
 *                         the payment-cascade and audit logic works unchanged.
 *
 * MARKET_PRICE_PER_CREDIT : Current hardcoded market price (₹ per credit).
 *                           Change this single value to adjust the global rate.
 */
export const SYSTEM_AGGREGATOR_ID = 'VEERA_001';
export const MARKET_PRICE_PER_CREDIT = 350; // ₹350 per carbon credit

export const CREDIT_REQUEST_REASONS = [
    'Air Pollution Offset',
    'Industrial Waste Emissions',
    'Reforestation Support',
    'Supply Chain Emissions',
    'Manufacturing Footprint',
    'Transportation Emissions',
    'Energy Consumption Offset',
    'Other',
] as const;

export type CreditRequestReason = (typeof CREDIT_REQUEST_REASONS)[number];
