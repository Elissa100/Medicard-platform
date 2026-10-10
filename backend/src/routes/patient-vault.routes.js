import express from "express";
import { authenticate, requirePatient } from "../middleware/auth.middleware.js";
import {
  addAllergy,
  addCondition,
  addDependent,
  deleteHealthItem,
  getDashboard,
  getOwnPlanPaymentStatus,
  initiatePlanPayment,
  updateProfile,
  getConsultations,
  getPrescriptions,
  getLabResults,
  getClinics,
  getAppointments,
  bookAppointment,
  cancelAppointment,
} from "../controllers/patient-vault.controller.js";

const router = express.Router();
router.use(authenticate, requirePatient);

router.get("/me", getDashboard);
router.get("/dashboard", getDashboard);
router.post("/payment/initiate", initiatePlanPayment);
router.get("/payment/:paymentId/status", getOwnPlanPaymentStatus);
router.get("/payment/status/:paymentId", getOwnPlanPaymentStatus);
router.get("/clinics", getClinics);
router.get("/appointments", getAppointments);
router.post("/appointments", bookAppointment);
router.patch("/appointments/:appointmentId/cancel", cancelAppointment);
router.get("/consultations", getConsultations);
router.get("/prescriptions", getPrescriptions);
router.get("/lab-results", getLabResults);
router.patch("/profiles/:profileId", updateProfile);
router.post("/dependents", addDependent);
router.post("/profiles/:profileId/allergies", addAllergy);
router.post("/profiles/:profileId/conditions", addCondition);
router.delete("/profiles/:profileId/allergies/:itemId", (req, res, next) => {
  req.params.kind = "allergy";
  return deleteHealthItem(req, res, next);
});
router.delete("/profiles/:profileId/conditions/:itemId", (req, res, next) => {
  req.params.kind = "condition";
  return deleteHealthItem(req, res, next);
});
router.delete("/profiles/:profileId/health/:kind/:itemId", deleteHealthItem);

export default router;
