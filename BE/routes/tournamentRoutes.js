import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
  createTournament,
  getAllTournaments,
  getTournamentById,
  getTournamentImage,
  updateTournament,
  deleteTournament,
} from "../controllers/tournamentController.js";
import { validateTournament, handleValidationErrors } from "../middleware/validation.js";

const router = express.Router();

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads/tournaments");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("✅ Created uploads directory:", uploadsDir);
}

// ✅ Multer setup (memory storage for storing image in MongoDB)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files are allowed!"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ✅ Handle multer errors gracefully
const handleMulterError = (err, req, res, next) => {
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "File upload error",
    });
  }
  next();
};

// ✅ Routes
router.post(
  "/",
  upload.single("image"),
  handleMulterError,
  ...validateTournament,
  handleValidationErrors,
  createTournament
);

router.get("/", getAllTournaments);
router.get("/:id", getTournamentById);
router.get("/:id/image", getTournamentImage);
router.put("/:id", upload.single("image"), updateTournament);
router.delete("/:id", deleteTournament);

export default router;
