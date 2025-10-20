// routes/guruRoutes.js
import express from "express";
import {
  getMataPelajaran,
  addNilai,
  addKehadiran,
  getAllGrades,
  updateNilai,
  deleteNilai,
  getAllAttendance,
  updateKehadiran,
  deleteKehadiran,
} from "../controllers/guruController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

// semua route guru butuh autentikasi
router.use(authenticate);

// Mata Pelajaran
router.get("/:id/matapelajaran", getMataPelajaran);

// Nilai
router.get("/grades", getAllGrades); // semua nilai
router.post("/:id/nilai", addNilai);
router.put("/:id/nilai/:gradeId", updateNilai);
router.delete("/:id/nilai/:gradeId", deleteNilai);

// Kehadiran
router.get("/attendance", getAllAttendance); // semua data kehadiran
router.post("/:id/kehadiran", addKehadiran);
router.put("/:id/kehadiran/:attendanceId", updateKehadiran);
router.delete("/:id/kehadiran/:attendanceId", deleteKehadiran);

export default router;
