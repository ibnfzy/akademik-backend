// routes/walikelasRoutes.js
import express from "express";
import {
  getNilaiKelas,
  getKehadiranKelas,
  verifikasiNilai,
  getSiswaKelas,
  addSiswaKelas,
  updateSiswaKelas,
  deleteSiswaKelas,
  getRaportSiswa,
} from "../controllers/walikelasController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

// Semua route walikelas butuh autentikasi
router.use(authenticate);

// Siswa dalam kelas
router.get("/:id/kelas/siswa", getSiswaKelas);
router.post("/:id/kelas/siswa", addSiswaKelas);
router.put("/:id/kelas/siswa/:studentId", updateSiswaKelas);
router.delete("/:id/kelas/siswa/:studentId", deleteSiswaKelas);

// Nilai & Kehadiran
router.get("/:id/kelas/nilai", getNilaiKelas);
router.get("/:id/kelas/kehadiran", getKehadiranKelas);

// Verifikasi nilai
router.put("/:id/verifikasi/:nilaiId", verifikasiNilai);

// Raport siswa tertentu
router.get("/:id/siswa/:studentId/raport", getRaportSiswa);

export default router;
