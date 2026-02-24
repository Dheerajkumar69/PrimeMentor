// backend/models/PricingModel.js

import mongoose from 'mongoose';

const classRangePricingSchema = new mongoose.Schema({
    sessionPrice: { type: Number, required: true },
    originalPrice: { type: Number, required: true },
}, { _id: false });

const pricingSchema = new mongoose.Schema({
    // Singleton identifier — only one pricing document should exist
    _singletonKey: { type: String, default: 'global_pricing', unique: true },

    classRanges: {
        type: Map,
        of: classRangePricingSchema,
        default: {
            '2-6': { sessionPrice: 22, originalPrice: 35 },
            '7-9': { sessionPrice: 25, originalPrice: 40 },
            '10-12': { sessionPrice: 27, originalPrice: 45 },
        }
    },

    starterPack: {
        numberOfSessions: { type: Number, default: 6 },
        fixedDiscount: { type: Number, default: 5 },
    },
}, { timestamps: true });

const PricingModel = mongoose.model('Pricing', pricingSchema);

export default PricingModel;
