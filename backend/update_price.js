import mongoose from 'mongoose';
import PricingModel from './models/PricingModel.js';

async function updatePrice() {
    await mongoose.connect(process.env.MONGODB_URI);
    const pricing = await PricingModel.findOne({ _singletonKey: 'global_pricing' });
    pricing.classRanges.get('2-6').sessionPrice = 19;
    await pricing.save();
    console.log("Price updated to 19");
    process.exit(0);
}
updatePrice();
