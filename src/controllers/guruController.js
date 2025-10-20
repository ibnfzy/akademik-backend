import * as Teacher from "../models/teacher.js";
import { successResponse, errorResponse } from "../utils/response.js";

// GET /guru/:id/matapelajaran
export const getMataPelajaran = async (req, res) => {
  try {
    const subjects = await Teacher.getSubjectsByTeacherId(req.params.id);

    // Format sesuai expected data
    const formatted = subjects.map((s) => ({
      id: s.subjectId,
      nama: s.subjectName,
      kode: s.kode,
      teacherId: s.teacherId,
      kelompok: s.kelompok,
    }));

    return successResponse(res, formatted);
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// GET /guru/grades
export const getAllGrades = async (req, res) => {
  try {
    const grades = await Teacher.getAllGrades();
    return successResponse(res, grades);
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// GET /guru/attendance
export const getAllAttendance = async (req, res) => {
  try {
    const attendance = await Teacher.getAllAttendance();
    return successResponse(res, attendance);
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// POST /guru/:id/nilai
export const addNilai = async (req, res) => {
  try {
    const nilai = await Teacher.insertNilai({
      ...req.body,
      teacherId: req.params.id,
      verified: false,
    });
    return successResponse(res, nilai, "Nilai berhasil ditambahkan");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// PUT /guru/:id/nilai/:gradeId
export const updateNilai = async (req, res) => {
  try {
    const nilai = await Teacher.updateNilai(req.params.gradeId, {
      ...req.body,
      teacherId: req.params.id,
    });
    return successResponse(res, nilai, "Nilai berhasil diperbarui");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// DELETE /guru/:id/nilai/:gradeId
export const deleteNilai = async (req, res) => {
  try {
    await Teacher.deleteNilai(req.params.gradeId);
    return successResponse(res, null, "Nilai berhasil dihapus");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// POST /guru/:id/kehadiran
export const addKehadiran = async (req, res) => {
  try {
    const absen = await Teacher.insertKehadiran({
      ...req.body,
      teacherId: req.params.id,
    });
    return successResponse(res, absen, "Kehadiran berhasil dicatat");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// PUT /guru/:id/kehadiran/:attendanceId
export const updateKehadiran = async (req, res) => {
  try {
    const absen = await Teacher.updateKehadiran(req.params.attendanceId, {
      ...req.body,
      teacherId: req.params.id,
    });
    return successResponse(res, absen, "Kehadiran berhasil diperbarui");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// DELETE /guru/:id/kehadiran/:attendanceId
export const deleteKehadiran = async (req, res) => {
  try {
    await Teacher.deleteKehadiran(req.params.attendanceId);
    return successResponse(res, null, "Kehadiran berhasil dihapus");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};
