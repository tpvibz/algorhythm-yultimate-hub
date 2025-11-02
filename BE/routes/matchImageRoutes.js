import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
  uploadMatchImage,
  getMatchImages,
  getTournamentImages,
  getVolunteerMatchesForImages,
  deleteMatchImage,
  getAllMatchImages
} from "../controllers/matchImageController.js";

const router = express.Router();

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads/matches");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("✅ Created uploads/matches directory:", uploadsDir);
}

// Multer setup for match images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-match-${file.fieldname}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Handle multer errors gracefully
const handleMulterError = (err, req, res, next) => {
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "File upload error",
    });
  }
  next();
};

// Routes
// Upload image for a match
router.post(
  "/matches/:matchId/upload",
  upload.single("image"),
  handleMulterError,
  uploadMatchImage
);

// Get all images for a match
router.get("/matches/:matchId/images", getMatchImages);

// Get all images for a tournament
router.get("/tournaments/:tournamentId/images", getTournamentImages);

// Get all match images (for gallery)
router.get("/", getAllMatchImages);

// Get matches for volunteer's assigned tournaments
router.get("/volunteers/:volunteerId/matches", getVolunteerMatchesForImages);

// Delete a match image
router.delete("/images/:imageId", deleteMatchImage);

export default router;

