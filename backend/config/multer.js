// backend/config/multer.js
import multer from 'multer';
import path from 'path';

// ======================== ALLOWED FILE TYPES ========================
// Only these MIME types are accepted. Everything else is rejected.
const ALLOWED_IMAGE_MIMES = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
]);

const ALLOWED_DOCUMENT_MIMES = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/msword',                                                      // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
]);

// ======================== FILENAME SANITIZER ========================
// Strips path separators (../../), null bytes, and any char that isn't
// alphanumeric, dot, hyphen, or underscore — prevents path-traversal attacks.
const sanitizeFilename = (originalname) => {
    const ext = path.extname(originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
    const base = path.basename(originalname, path.extname(originalname))
        .replace(/[^a-zA-Z0-9_-]/g, '_') // replace unsafe chars with underscore
        .slice(0, 80);                    // cap base name length
    return `${Date.now()}_${base}${ext}`;
};

// ======================== STORAGE ========================
const storage = multer.diskStorage({
    destination: 'uploads',
    filename: (req, file, cb) => {
        cb(null, sanitizeFilename(file.originalname));
    },
});

// ======================== FILE FILTER ========================
// fieldname 'image' → images only; 'cvFile' → docs + images; else reject
const fileFilter = (req, file, cb) => {
    const isImageField = file.fieldname === 'image';
    const allowed = isImageField ? ALLOWED_IMAGE_MIMES : ALLOWED_DOCUMENT_MIMES;

    if (allowed.has(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error(
                isImageField
                    ? `Invalid image type "${file.mimetype}". Allowed: JPEG, PNG, WebP, GIF.`
                    : `Invalid document type "${file.mimetype}". Allowed: PDF, DOC, DOCX, or images.`
            ),
            false
        );
    }
};

// ======================== UPLOAD MIDDLEWARE ========================
// Global 5 MB size limit. Rejects any single file over 5 MB.
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
        files: 5,                  // max 5 files per request
    },
});

export default upload;