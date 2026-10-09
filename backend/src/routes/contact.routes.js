import express from "express";
import rateLimit from "express-rate-limit";
import { submitContactMessage } from "../controllers/contact.controller.js";

const router = express.Router();
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many contact messages. Please try again later.",
  },
});

router.post("/", contactLimiter, submitContactMessage);

export default router;
