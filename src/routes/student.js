import express from "express";
import {
  getNilai,
  getKehadiran,
  getRaport,
} from "../controllers/studentController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

// Semua route siswa butuh autentikasi
router.get("/:id/nilai", authenticate, getNilai);
router.get("/:id/kehadiran", authenticate, getKehadiran);
router.get("/:id/raport", authenticate, getRaport);

export default router;
