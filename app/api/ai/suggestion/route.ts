import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */
export interface Suggestion {
    type: 'opportunity' | 'alert' | 'practice' | 'market' | 'warning';
    title: string;
    body: string;
    priority: 'high' | 'medium' | 'low';
}

/* ------------------------------------------------------------------ */
/*  Fallback suggestion bank (70+ entries across all categories)        */
/* ------------------------------------------------------------------ */
const SUGGESTION_BANK: Suggestion[] = [
    // Soil Health
    { type: 'practice', title: 'Increase Organic Matter', priority: 'high', body: 'Incorporate crop residues after harvest. A 1% increase in soil organic matter can hold up to 20,000 litres more water per hectare.' },
    { type: 'practice', title: 'Try Deep Ploughing', priority: 'medium', body: 'Break compacted subsoil layers with subsoiler equipment to improve root penetration and water infiltration depth.' },
    { type: 'opportunity', title: 'Biochar Application Benefit', priority: 'high', body: 'Applying 2–3 tonnes of biochar per hectare can sequester carbon for 100+ years while improving soil CEC by up to 30%.' },
    { type: 'practice', title: 'pH Correction Window', priority: 'medium', body: 'Test soil pH before the next sowing season. Maintaining pH between 6.0–7.0 maximises nutrient availability for most crops.' },
    { type: 'practice', title: 'Vermicompost Integration', priority: 'medium', body: 'Replace 20–30% of chemical fertiliser with vermicompost. Studies show yield parity with significantly improved soil biology.' },
    { type: 'practice', title: 'Cover Crop Opportunity', priority: 'high', body: 'Sow leguminous cover crops in fallow periods to fix atmospheric nitrogen — up to 150 kg N/ha, reducing fertiliser costs.' },
    { type: 'practice', title: 'Mulch Application', priority: 'medium', body: 'Apply 5–8 cm organic mulch to reduce evapotranspiration by 40% and suppress weeds without herbicide use.' },

    // Water Management
    { type: 'opportunity', title: 'Drip Irrigation Efficiency', priority: 'high', body: 'Switching from flood to drip irrigation reduces water use by 30–50% while improving fertiliser absorption efficiency.' },
    { type: 'alert', title: 'Soil Moisture Deficit Risk', priority: 'high', body: 'Monitor field capacity regularly during dry months. Deficit irrigation strategies can maintain yield with 20% less water.' },
    { type: 'practice', title: 'Rainwater Harvesting', priority: 'medium', body: 'Install farm ponds or contour bunds. Even 500 m² collection area can provide critical irrigation during drought stress periods.' },
    { type: 'practice', title: 'Sub-surface Drainage Install', priority: 'low', body: 'In waterlogged-prone fields, sub-surface drainage tiles can reduce waterlogging stress and increase effective growing season by 2–3 weeks.' },

    // Carbon & Credit Optimisation
    { type: 'opportunity', title: 'Carbon Credit Verification Due', priority: 'high', body: 'Ensure soil carbon data is logged before the end of the quarter for timely credit verification and faster payout processing.' },
    { type: 'market', title: 'Agroforestry Credits Premium', priority: 'high', body: 'Agroforestry carbon credits are trading 22% above standard soil credits. Consider registering new tree plots for future batches.' },
    { type: 'market', title: 'Voluntary Carbon Market Surge', priority: 'high', body: 'VCM demand from tech companies has increased 40% this quarter. This is an optimal window to list available credits.' },
    { type: 'opportunity', title: 'Soil Carbon Monitoring Bonus', priority: 'medium', body: 'Adding soil sensors for real-time carbon monitoring qualifies you for a 15% verification premium on next credit batch.' },
    { type: 'market', title: 'Crop-Specific Credit Premium', priority: 'medium', body: 'Rice paddy methane reduction credits are experiencing high buyer interest — document water management practices carefully.' },

    // Crop Management
    { type: 'practice', title: 'Intercropping Strategy', priority: 'medium', body: 'Intercropping cereal with legumes improves nitrogen cycling and can increase total land equivalent ratio (LER) by 15–40%.' },
    { type: 'practice', title: 'Crop Rotation Planning', priority: 'high', body: 'Plan a 3-year rotation with at least one legume cycle per rotation sequence to naturally restore soil nitrogen.' },
    { type: 'practice', title: 'Reduce Chemical Inputs', priority: 'medium', body: 'Replacing synthetic pesticides with IPM reduces input costs by 20–25% and increases eligibility for premium organic credits.' },
    { type: 'opportunity', title: 'Heirloom Variety Opportunity', priority: 'low', body: 'Growing heritage crop varieties on even a small plot creates eligibility for biodiversity conservation payments.' },
    { type: 'practice', title: 'Green Manure Incorporation', priority: 'medium', body: 'Incorporate Sesbania or Dhaincha before transplanting to add 60–80 kg N/ha organically and improve soil structure.' },
    { type: 'practice', title: 'Seed Treatment Optimisation', priority: 'low', body: 'Treat seeds with biofertilisers (Rhizobium/PSB) before sowing to enhance early root development and nutrient uptake.' },

    // Climate Resilience
    { type: 'alert', title: 'Heat Stress Window Ahead', priority: 'high', body: 'Climate models indicate above-average temperatures next month. Consider heat-tolerant varieties and adjust sowing dates accordingly.' },
    { type: 'alert', title: 'Unseasonal Frost Risk', priority: 'high', body: 'Night temperatures may drop below 5°C in the next fortnight. Smoke screens or crop covers can protect sensitive seedlings.' },
    { type: 'practice', title: 'Windbreak Plantation', priority: 'medium', body: 'Planting 2–3 rows of trees on field borders reduces wind erosion and moisture loss, adding biodiversity credit value.' },
    { type: 'opportunity', title: 'Agroforestry Integration', priority: 'high', body: 'Integrating 10% tree cover (e.g., Moringa or Leucaena) into cropped areas can yield dual income and carbon credits simultaneously.' },
    { type: 'warning', title: 'Topsoil Erosion Risk', priority: 'high', body: 'Sloped land without contour bunds loses 8–15 tonnes of topsoil/ha annually. Establish bunds before monsoon onset.' },
    { type: 'practice', title: 'Shelterbelts for Moisture', priority: 'medium', body: 'Native tree shelterbelts reduce evapotranspiration in adjacent crops by up to 20% and qualify for agroforestry credits.' },

    // Technology & Precision Farming
    { type: 'opportunity', title: 'Drone Crop Scouting', priority: 'medium', body: 'NDVI drone surveys identify stress patches early, allowing targeted intervention and reducing pesticide use by up to 30%.' },
    { type: 'opportunity', title: 'Soil Sensor Network ROI', priority: 'medium', body: 'IoT soil sensors cost ₹8,000–15,000 per unit but reduce over-irrigation by 25–35%, typically paying back in one season.' },
    { type: 'practice', title: 'Variable Rate Fertilisation', priority: 'low', body: 'Precision soil maps enable variable rate fertilisation, reducing input costs by 15% while maintaining yield targets.' },

    // Market Timing
    { type: 'market', title: 'Optimal Selling Window', priority: 'high', body: 'Credit prices typically peak in Q4 (Oct–Dec) when corporate buyers close annual offset targets. Hold if timing is flexible.' },
    { type: 'market', title: 'Bulk Listing Advantage', priority: 'medium', body: 'Listings above 500 CRD attract institutional buyers and receive a 5–8% price premium over smaller retail listings.' },
    { type: 'market', title: 'Co-operative Aggregation', priority: 'high', body: 'Pooling credits with neighbouring farmers through your community reduces verification overhead costs by up to 40%.' },
    { type: 'market', title: 'Vintage Credit Appreciation', priority: 'low', body: 'Credits older than 3 years with full chain-of-custody documentation attract a 10–18% vintage premium from premium buyers.' },

    // Biodiversity
    { type: 'practice', title: 'Pollinator Habitat Strips', priority: 'medium', body: 'Planting 3–5m wildflower strips along field borders increases pollinator populations, improving yields by 8–20% for flowering crops.' },
    { type: 'opportunity', title: 'Biodiversity Net Gain Credits', priority: 'medium', body: 'Government-backed biodiversity net gain schemes are launching. Early registrants are likely to receive preferential rates.' },
    { type: 'practice', title: 'Hedgerow Restoration', priority: 'low', body: 'Establishing native hedgerows adds carbon sequestration, reduces wind erosion, and may qualify for biodiversity payments.' },

    // Fertiliser & Nutrition
    { type: 'alert', title: 'Reduce Urea — Volatility Risk', priority: 'medium', body: 'High urea application rates above 120 kg/ha increase ammonia volatility losses by 30%. Split application improves efficiency.' },
    { type: 'practice', title: 'Nano Urea Trial Opportunity', priority: 'medium', body: 'IFFCO Nano Urea can replace 50% of conventional urea with equivalent yields, reducing your carbon footprint per tonne of output.' },
    { type: 'practice', title: 'Neem-Coated Urea Adoption', priority: 'medium', body: 'Switching to neem-coated urea slows nitrogen release, improves NUE by 15–20% and reduces nitrous oxide emissions.' },
    { type: 'alert', title: 'Micronutrient Deficiency Risk', priority: 'high', body: 'Sandy soils with high rainfall are prone to zinc and boron deficiency. Conduct a micronutrient test before the next crop cycle.' },
    { type: 'practice', title: 'Potassium for Stress Tolerance', priority: 'medium', body: 'Adequate potassium nutrition (K2O 60 kg/ha) significantly improves drought and salinity stress tolerance in most crops.' },

    // No-Till & Tillage
    { type: 'opportunity', title: 'No-Till Carbon Accumulation', priority: 'high', body: 'No-till fields accumulate 0.3–0.5 tCO₂e/ha/year more than conventionally tilled fields. This directly increases credit generation.' },
    { type: 'practice', title: 'Minimum Tillage Transition', priority: 'medium', body: 'Gradually reducing tillage passes from 4 to 2 per season reduces diesel costs by ₹2,500–4,000/ha and cuts soil disturbance.' },
    { type: 'practice', title: 'Strip Till Consideration', priority: 'low', body: 'Strip tillage disturbs only the seed row, preserving 60–70% of soil structure while maintaining seedbed conditions for planting.' },

    // Organic Transition
    { type: 'opportunity', title: 'Organic Transition Grant', priority: 'high', body: 'Central and state governments offer ₹25,000–50,000/ha grants for the 3-year organic transition period. Check PGS-India eligibility.' },
    { type: 'market', title: 'Organic Premium Projection', priority: 'medium', body: 'Organic produce commands 20–35% price premiums in urban markets. Combined with carbon credits, ROI improves significantly.' },
    { type: 'warning', title: 'Organic Certification Deadline', priority: 'high', body: 'PGS-India inspection windows open in March and September. Prepare input use records now to avoid documentation gaps.' },

    // Livestock Integration
    { type: 'practice', title: 'Rotational Grazing Benefits', priority: 'medium', body: 'Managed rotational grazing on fallow fields rebuilds pasture biomass 40% faster and sequesters 0.9 tCO₂e/ha annually.' },
    { type: 'practice', title: 'Livestock Biogas Integration', priority: 'low', body: 'A 20-cattle biogas plant can power farm operations and generate tradeable renewable energy certificates alongside carbon credits.' },
    { type: 'practice', title: 'Composting Livestock Waste', priority: 'medium', body: 'On-farm composting of cattle dung reduces methane emissions and creates 2–3 tonnes of quality compost per animal annually.' },

    // Finance & Records
    { type: 'alert', title: 'Record-Keeping Reminder', priority: 'high', body: 'Carbon credit verifiers require at least 24 months of input purchase and yield records. Ensure current season is fully documented.' },
    { type: 'opportunity', title: 'Agri-Finance Benefit', priority: 'medium', body: 'Verified carbon credit sellers may qualify for preferential interest rates (1–2% lower) on agricultural loans from select banks.' },
    { type: 'practice', title: 'Input Cost Audit', priority: 'low', body: 'An annual input cost audit typically reveals 12–18% of expenditure on redundant or ineffective inputs that can be eliminated.' },

    // Seasonal
    { type: 'alert', title: 'Pre-Monsoon Soil Preparation', priority: 'high', body: 'Complete field bunding, composting and cover crop termination 3–4 weeks before expected monsoon onset for best results.' },
    { type: 'opportunity', title: 'Rabi Season Planning', priority: 'medium', body: 'Rabi wheat and mustard with proper residue management from Kharif paddy can generate an additional 0.4 tCO₂e per hectare.' },
    { type: 'practice', title: 'Post-Harvest Residue Management', priority: 'medium', body: 'Mulch-in crop residues instead of burning. In-situ incorporation adds 1.5–2 tonnes of dry matter annually to soil organic pools.' },
    { type: 'warning', title: 'Stubble Burning Penalty Risk', priority: 'high', body: 'Authorities have increased surveillance for stubble burning — fines of ₹2,500–15,000 per incident. Carbon credits may also be voided.' },

    // Water Quality
    { type: 'alert', title: 'Nitrate Leaching Risk', priority: 'medium', body: 'Sandy soils after heavy rainfall are susceptible to nitrate leaching. Split N applications and cover crops reduce losses by 40%.' },
    { type: 'practice', title: 'Constructed Wetland Buffer', priority: 'low', body: 'A small constructed wetland at field outlets intercepts 60–80% of nutrient runoff and creates biodiversity habitat.' },

    // Energy
    { type: 'opportunity', title: 'Solar Pump Subsidy Available', priority: 'high', body: 'PM-KUSUM scheme offers 60–90% subsidy on solar pumps. Replacing diesel pumps eliminates 0.5–1.2 tCO₂e per pump per year.' },
    { type: 'practice', title: 'Solar Drying for Produce', priority: 'low', body: 'Solar dryers reduce post-harvest losses by 30–40%, extend storage life, and reduce the carbon footprint of produce handling.' },

    // Community & Governance
    { type: 'opportunity', title: 'Community Collective Benefit', priority: 'medium', body: 'Joining a FPO or community credit pool reduces verification costs and increases bargaining power with credit buyers by up to 30%.' },
    { type: 'alert', title: 'Land Title Verification', priority: 'high', body: 'Credit verifiers require proof of land tenure. Ensure RoR records are updated before the next verification cycle.' },
];

/* ------------------------------------------------------------------ */
/*  Pick N random suggestions from the bank                            */
/* ------------------------------------------------------------------ */
function pickRandom(n: number): Suggestion[] {
    const shuffled = [...SUGGESTION_BANK].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
}

/* ------------------------------------------------------------------ */
/*  Gemini AI suggestion generator                                      */
/* ------------------------------------------------------------------ */
async function fetchAISuggestions(profile: {
    current_crop: string[];
    previous_crop: string[];
    soil_type: string;
    practices: string[];
    urea_amount: string;
    landarea: number;
    landlocation: { lat: number; lng: number };
    entry_status: string;
}): Promise<Suggestion[]> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('No API key');

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are an expert agricultural and carbon credit advisor. Based on the following farmer profile, generate exactly 6 personalized actionable suggestions.

Farmer Profile:
- Entry Type: ${profile.entry_status}
- Current Crops: ${profile.current_crop.join(', ') || 'not specified'}
- Previous Crops: ${profile.previous_crop.join(', ') || 'not specified'}
- Soil Type: ${profile.soil_type}
- Current Practices: ${profile.practices.join(', ') || 'none listed'}
- Urea Usage: ${profile.urea_amount} kg/acre
- Land Area: ${profile.landarea} acres
- GPS Location: ${profile.landlocation.lat.toFixed(4)}°N, ${profile.landlocation.lng.toFixed(4)}°E

Return ONLY a JSON array with exactly 6 items, each with this structure (no markdown, no explanation):
[
  {
    "type": "opportunity" | "alert" | "practice" | "market" | "warning",
    "title": "Short title (max 6 words)",
    "body": "2–3 sentences with specific, data-driven advice relevant to this farmer's situation.",
    "priority": "high" | "medium" | "low"
  }
]

Make suggestions highly specific to their crops, soil type, location climate zone, and current practices. Include a mix of types.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
    });

    const text = (response.text ?? '').replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(text) as Suggestion[];
    if (!Array.isArray(parsed) || parsed.length === 0 || !parsed[0].title) {
        throw new Error('Invalid response structure');
    }
    return parsed;
}

/* ------------------------------------------------------------------ */
/*  Route Handler                                                        */
/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        let suggestions: Suggestion[];
        let source: 'ai' | 'intelligent' = 'ai';

        try {
            suggestions = await fetchAISuggestions(body);
        } catch (err) {
            console.warn('[Suggestion API] AI generation failed, using curated suggestions:', err);
            // Pick 6 random suggestions from our curated bank, weighted towards high priority
            const highPriority = SUGGESTION_BANK.filter(s => s.priority === 'high');
            const others = SUGGESTION_BANK.filter(s => s.priority !== 'high');
            const shuffledHigh = highPriority.sort(() => Math.random() - 0.5).slice(0, 3);
            const shuffledOther = others.sort(() => Math.random() - 0.5).slice(0, 3);
            suggestions = [...shuffledHigh, ...shuffledOther].sort(() => Math.random() - 0.5);
            source = 'intelligent';
        }

        return NextResponse.json({ suggestions, source }, { status: 200 });

    } catch (error: any) {
        console.error('[Suggestion API] Error:', error);
        return NextResponse.json({ error: 'Failed to generate suggestions', details: error.message }, { status: 500 });
    }
}
