import {
  create,
  getByEncounter,
  getById,
} from "../controllers/clinical-note.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(authenticate);
// Restrict clinical note access to clinical roles (Doctor, Nurse, Dentist, Admin) - receptionists cannot view or edit
router.use(authorize("DOCTOR", "NURSE", "DENTIST", "HOSPITAL_ADMIN", "ADMIN"));

/*
|--------------------------------------------------------------------------
| Create clinical note
|--------------------------------------------------------------------------
*/

router.post(
  "/encounters/:encounterId/clinical-notes",
  create
);


/*
|--------------------------------------------------------------------------
| Get all clinical notes for an encounter
|--------------------------------------------------------------------------
*/

router.get(
  "/encounters/:encounterId/clinical-notes",
  getByEncounter
);


/*
|--------------------------------------------------------------------------
| Get individual clinical note
|--------------------------------------------------------------------------
*/

router.get(
  "/clinical-notes/:noteId",
  getById
);

export default router;