// backend/controllers/pricingController.js

import PricingModel from '../models/PricingModel.js';

/**
 * GET /api/admin/pricing  (PUBLIC — no auth required)
 * Returns the global pricing config. Auto-seeds defaults on first call.
 */
export const getPricing = async (req, res) => {
    try {
        let pricing = await PricingModel.findOne({ _singletonKey: 'global_pricing' });

        // Auto-seed if no pricing document exists yet
        if (!pricing) {
            pricing = await PricingModel.create({
                _singletonKey: 'global_pricing',
                classRanges: {
                    '2-6': { sessionPrice: 22, originalPrice: 35 },
                    '7-9': { sessionPrice: 25, originalPrice: 40 },
                    '10-12': { sessionPrice: 27, originalPrice: 45 },
                },
                starterPack: {
                    numberOfSessions: 6,
                    fixedDiscount: 5,
                },
            });
            console.log('✅ [Pricing] Auto-seeded default pricing config.');
        }

        // Convert Mongoose Map to a plain object for the response
        const response = {
            classRanges: Object.fromEntries(pricing.classRanges),
            starterPack: pricing.starterPack,
            updatedAt: pricing.updatedAt,
        };

        res.json(response);
    } catch (error) {
        console.error('❌ [Pricing] Error fetching pricing:', error.message);
        res.status(500).json({ message: 'Failed to fetch pricing configuration.' });
    }
};

/**
 * PUT /api/admin/pricing  (ADMIN-PROTECTED)
 * Updates the global pricing config.
 * 
 * Expected body:
 * {
 *   classRanges: { "2-6": { sessionPrice, originalPrice }, ... },
 *   starterPack: { numberOfSessions, fixedDiscount }
 * }
 */
export const updatePricing = async (req, res) => {
    try {
        const { classRanges, starterPack } = req.body;

        if (!classRanges || !starterPack) {
            return res.status(400).json({ message: 'classRanges and starterPack are required.' });
        }

        // Validate class ranges
        const requiredRanges = ['2-6', '7-9', '10-12'];
        for (const range of requiredRanges) {
            if (!classRanges[range]) {
                return res.status(400).json({ message: `Missing pricing for class range: ${range}` });
            }
            const { sessionPrice, originalPrice } = classRanges[range];
            if (typeof sessionPrice !== 'number' || sessionPrice < 0) {
                return res.status(400).json({ message: `Invalid sessionPrice for range ${range}` });
            }
            if (typeof originalPrice !== 'number' || originalPrice < 0) {
                return res.status(400).json({ message: `Invalid originalPrice for range ${range}` });
            }
        }

        // Validate starter pack
        if (typeof starterPack.numberOfSessions !== 'number' || starterPack.numberOfSessions < 1) {
            return res.status(400).json({ message: 'numberOfSessions must be at least 1.' });
        }
        if (typeof starterPack.fixedDiscount !== 'number' || starterPack.fixedDiscount < 0) {
            return res.status(400).json({ message: 'fixedDiscount must be 0 or greater.' });
        }

        const pricing = await PricingModel.findOneAndUpdate(
            { _singletonKey: 'global_pricing' },
            { classRanges, starterPack },
            { new: true, upsert: true, runValidators: true }
        );

        const response = {
            classRanges: Object.fromEntries(pricing.classRanges),
            starterPack: pricing.starterPack,
            updatedAt: pricing.updatedAt,
        };

        console.log('✅ [Pricing] Updated pricing config:', JSON.stringify(response, null, 2));
        res.json({ message: 'Pricing updated successfully.', pricing: response });
    } catch (error) {
        console.error('❌ [Pricing] Error updating pricing:', error.message);
        res.status(500).json({ message: 'Failed to update pricing configuration.' });
    }
};
