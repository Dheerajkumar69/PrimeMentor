// backend/models/PromoCodeModel.js
import mongoose from 'mongoose';

const promoCodeSchema = mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    discountPercentage: {
        type: Number,
        required: true,
        default: 0,
    },
    isActive: {
        type: Boolean,
        required: true,
        default: true,
    },
    // Optional: Add expiryDate for time-limited offers
    expiryDate: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});

const PromoCode = mongoose.model('PromoCode', promoCodeSchema);

export default PromoCode;