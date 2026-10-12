import { Router } from "express";
import {
  authenticateVaultClinic,
  requirePasswordChanged,
} from "../../middleware/vault-clinic.middleware.js";
import {
  searchPatients,
  getPatientVault,
  mockCardTap,
  getGrants,
  revokeGrant,
} from "../controllers/vault-clinic-patient.controller.js";

const router = Router();

router.use(authenticateVaultClinic);
router.use(requirePasswordChanged);

// Lookup patient (Privacy-safe: masked preview if no booking/grant)
router.get("/lookup", searchPatients);

// Patient vault clinical records (Clinicians only, validated in service)
router.get("/:patientId/vault", getPatientVault);

// Mock card tap (Clinicians only, test patient only, flag-guarded)
router.post("/:patientId/mock-tap", mockCardTap);

// Active consent grants
router.get("/grants", getGrants);
router.post("/grants/:grantId/revoke", revokeGrant);

export default router;

