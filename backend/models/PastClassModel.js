// backend/models/PastClassModel.js
import mongoose from 'mongoose';

const PastClassSchema = new mongoose.Schema({
    // Store the ID of the teacher who submitted the form
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true,
    },
    // Store the name of the teacher at the time of submission for display convenience
    teacherName: {
        type: String,
        required: true,
    },
    sessionDate: {
        type: Date,
        required: true,
    },
    sessionTime: { // Can store the time range string, e.g., "10:00 - 11:00"
        type: String,
        required: true,
    },
    duration: { // e.g., "60 minutes"
        type: String,
        required: true,
    },
    studentName: {
        type: String,
        required: true,
    },
    topic: {
        type: String,
        required: true,
    },
    subTopic: {
        type: String,
        required: false, // Sub-topic can be optional
    },
    submissionDate: {
        type: Date,
        default: Date.now,
    },
});

const PastClassModel = mongoose.model('PastClass', PastClassSchema);
export default PastClassModel;