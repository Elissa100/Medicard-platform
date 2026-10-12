import { Router } from "express";
import {
  authenticateVaultClinic,
  requirePasswordChanged,
} from "../../middleware/vault-clinic.middleware.js";
import {
  searchPatients,
  getPatientVault,
  mockCardTap,
  getRandomTestPatient,
  getGrants,
  revokeGrant,
} from "../controllers/vault-clinic-patient.controller.js";

const router = Router();

router.use(authenticateVaultClinic);
router.use(requirePasswordChanged);

// Lookup patient (Privacy-safe: masked preview if no booking/grant)
router.get("/lookup", searchPatients);

// Get a random test patient for the NFC card demo (flag-guarded)
router.get("/demo-patient", getRandomTestPatient);

// Active consent grants
router.get("/grants", getGrants);
router.post("/grants/:grantId/revoke", revokeGrant);

// Patient vault clinical records (Clinicians only, validated in service)
router.get("/:patientId/vault", getPatientVault);

// Mock card tap (Clinicians only, test patient only, flag-guarded)
router.post("/:patientId/mock-tap", mockCardTap);

export default router;
