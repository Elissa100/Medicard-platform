import multer from "multer";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

/**
 * Multer configuration using in-memory storage.
 * Files land in req.file.buffer — no disk writes on Render.
 */
const storage = multer.memoryStorage();

function fileFilter(_req, file, cb) {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error(
      `Unsupported file type "${file.mimetype}". Allowed: PDF, JPEG, PNG, WebP.`
    );
    err.statusCode = 400;
    cb(err, false);
  }
}

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
}).single("file"); // form field name must be "file"

/**
 * Express error-handling wrapper that catches multer errors
 * and turns them into proper JSON 400 responses.
 */
export function handleUploadMiddleware(req, res, next) {
  uploadMiddleware(req, res, (err) => {
    if (!err) return next();

    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File is too large. Maximum allowed size is 15 MB.",
      });
    }

    return res.status(err.statusCode || 400).json({
      success: false,
      message: err.message || "File upload failed.",
    });
  });
}

