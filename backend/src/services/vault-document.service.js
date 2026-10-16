import prisma from "../config/database.js";
import {
  uploadDocumentToStorage,
  getSignedDocumentUrl,
  deleteDocumentFromStorage,
} from "./storage.service.js";

const ALLOWED_TYPES = [
  "MEDICAL_REPORT",
  "LAB_RESULT",
  "RADIOLOGY_REPORT",
  "PRESCRIPTION",
  "REFERRAL",
  "INSURANCE_DOCUMENT",
  "IDENTIFICATION",
  "OTHER",
];

function notFound(msg) {
  const e = new Error(msg);
  e.statusCode = 404;
  return e;
}
function forbidden(msg) {
  const e = new Error(msg);
  e.statusCode = 403;
  return e;
}
function bad(msg) {
  const e = new Error(msg);
  e.statusCode = 400;
  return e;
}

/**
 * Verify that the patient is on an active PREMIUM plan.
 */
async function assertPremium(patientId) {
  const sub = await prisma.patientSubscription.findFirst({
    where: {
      patientId,
      plan: "PREMIUM",
      status: "ACTIVE",
      endDate: { gte: new Date() },
    },
  });

  if (!sub) {
    throw forbidden(
      "Document uploads are available on the Premium plan. Upgrade to unlock this feature."
    );
  }
}

/**
 * Verify that profileId belongs to the logged-in patient (or their dependent).
 */
async function assertOwnedProfile(ownerId, profileId) {
  if (ownerId === profileId) {
    const p = await prisma.patient.findUnique({ where: { id: ownerId } });
    if (!p) throw notFound("Patient profile not found");
    return p;
  }

  const dep = await prisma.patient.findFirst({
    where: { id: profileId, guardianId: ownerId },
  });
  if (!dep) throw notFound("Profile not found or not accessible");
  return dep;
}

/**
 * POST /api/v1/vault/profiles/:profileId/documents
 * Upload a medical document for the given profile (Premium only).
 *
 * Expects multipart/form-data with:
 *   - file    (required) — PDF / JPEG / PNG / WebP ≤ 15 MB
 *   - title   (required) — display name, 1–200 chars
 *   - type    (required) — one of ALLOWED_TYPES
 *   - description (optional)
 */
export async function uploadDocument(req, res) {
  try {
    const ownerId = req.user.id;
    const { profileId } = req.params;

    // 1. Validate profile ownership
    const profile = await assertOwnedProfile(ownerId, profileId);

    // 2. Enforce Premium plan on the primary account holder
    await assertPremium(ownerId);

    // 3. Validate required fields
    const { title, type, description = "" } = req.body;
    if (!title || title.trim().length === 0 || title.length > 200) {
      throw bad("Title is required and must be between 1 and 200 characters.");
    }
    if (!type || !ALLOWED_TYPES.includes(type.toUpperCase())) {
      throw bad(`Document type must be one of: ${ALLOWED_TYPES.join(", ")}`);
    }

    // 4. Ensure a file was actually included
    if (!req.file) {
      throw bad("A file (PDF, JPEG, PNG or WebP) is required.");
    }

    // 5. Upload to Supabase Storage
    const storagePath = await uploadDocumentToStorage(
      profile.id,
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    // 6. Save document record in database
    const doc = await prisma.medicalDocument.create({
      data: {
        patientId: profile.id,
        // Self-uploads don't have a clinical encounter
        uploadedById: ownerId,
        type: type.toUpperCase(),
        title: title.trim(),
        description: description?.trim() || null,
        fileUrl: storagePath,        // we store the storage path, not a public URL
        mimeType: req.file.mimetype,
      },
    });

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully.",
      data: {
        id: doc.id,
        title: doc.title,
        type: doc.type,
        mimeType: doc.mimeType,
        createdAt: doc.createdAt,
      },
    });
  } catch (err) {
    console.error("[uploadDocument]", err.message);
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.statusCode ? err.message : "Failed to upload document.",
    });
  }
}

/**
 * GET /api/v1/vault/profiles/:profileId/documents/:documentId/download
 * Returns a 15-minute signed URL for a private document.
 */
export async function getDocumentDownloadUrl(req, res) {
  try {
    const ownerId = req.user.id;
    const { profileId, documentId } = req.params;

    await assertOwnedProfile(ownerId, profileId);

    const doc = await prisma.medicalDocument.findFirst({
      where: { id: documentId, patientId: profileId },
      select: { id: true, fileUrl: true, title: true, mimeType: true },
    });

    if (!doc) throw notFound("Document not found.");

    const signedUrl = await getSignedDocumentUrl(doc.fileUrl);

    res.json({
      success: true,
      data: {
        signedUrl,
        expiresInSeconds: 900,
        title: doc.title,
        mimeType: doc.mimeType,
      },
    });
  } catch (err) {
    console.error("[getDocumentDownloadUrl]", err.message);
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.statusCode ? err.message : "Could not generate download link.",
    });
  }
}

/**
 * DELETE /api/v1/vault/profiles/:profileId/documents/:documentId
 * Remove a patient-uploaded document (Premium only).
 * Documents uploaded by clinicians cannot be deleted by the patient.
 */
export async function deleteDocument(req, res) {
  try {
    const ownerId = req.user.id;
    const { profileId, documentId } = req.params;

    await assertOwnedProfile(ownerId, profileId);

    const doc = await prisma.medicalDocument.findFirst({
      where: { id: documentId, patientId: profileId },
      select: { id: true, fileUrl: true, uploadedById: true },
    });

    if (!doc) throw notFound("Document not found.");

    // Only allow deletion if the patient uploaded it themselves (not a clinic)
    if (doc.uploadedById !== ownerId) {
      throw forbidden("Only documents you uploaded yourself can be deleted from the portal.");
    }

    // Delete from storage first, then remove the DB record
    await deleteDocumentFromStorage(doc.fileUrl);
    await prisma.medicalDocument.delete({ where: { id: documentId } });

    res.json({ success: true, message: "Document deleted." });
  } catch (err) {
    console.error("[deleteDocument]", err.message);
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.statusCode ? err.message : "Could not delete document.",
    });
  }
}

