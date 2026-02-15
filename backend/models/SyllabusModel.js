// backend/models/SyllabusModel.js

import mongoose from 'mongoose';

const syllabusSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true,
    },
    grade: {
        type: String,
        required: [true, 'Grade is required'],
        trim: true,
    },
    board: {
        type: String,
        required: [true, 'Board / Alignment body is required'],
        trim: true,
    },
    description: {
        type: String,
        default: '',
        trim: true,
    },
    pdfFile: {
        type: String,
        required: [true, 'PDF file is required'],
    },
}, {
    timestamps: true,
});

const Syllabus = mongoose.model('Syllabus', syllabusSchema);

export default Syllabus;
