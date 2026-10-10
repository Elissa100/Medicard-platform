import express from "express";
import { authenticate, requirePlatformAdmin } from "../middleware/auth.middleware.js";
import * as adminController from "../controllers/admin.controller.js";

const router = express.Router();

router.use(authenticate);

// Overview
router.get("/overview", requirePlatformAdmin("clinics"), adminController.getOverview);

// Clinics
router.get("/clinics", requirePlatformAdmin("clinics"), adminController.getClinics);
router.post("/clinics", requirePlatformAdmin("clinics"), adminController.createClinic);
router.patch("/clinics/:id/status", requirePlatformAdmin("clinics"), adminController.updateClinicStatus);

// Users (account info only, no medical records)
router.get("/users", requirePlatformAdmin("users"), adminController.getUsers);
router.patch("/users/:id/status", requirePlatformAdmin("users"), adminController.updateUserStatus);

// Cards
router.get("/cards", requirePlatformAdmin("cards"), adminController.getCards);
router.post("/cards/link", requirePlatformAdmin("cards"), adminController.linkCard);
router.patch("/cards/:cardUid/status", requirePlatformAdmin("cards"), adminController.updateCardStatus);

// Plans
router.get("/plans", requirePlatformAdmin("plans"), adminController.getPlans);

// Finance (strict finance permission check)
router.get("/finance/overview", requirePlatformAdmin("finance"), adminController.getFinanceOverview);
router.get("/finance/transactions", requirePlatformAdmin("finance"), adminController.getFinanceTransactions);
router.get("/finance/transactions/export", requirePlatformAdmin("finance"), adminController.exportFinanceTransactions);
router.get("/finance/transactions/:id", requirePlatformAdmin("finance"), adminController.getFinanceTransactionDetail);

// Audit logs
router.get("/audit-logs", requirePlatformAdmin("audit_log"), adminController.getAuditLogs);

export default router;
