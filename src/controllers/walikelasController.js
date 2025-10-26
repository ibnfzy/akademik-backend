import * as Teacher from "../models/teacher.js";
import * as Student from "../models/students.js";
import { resolveSemesterReference } from "../models/semesters.js";
import { successResponse, errorResponse } from "../utils/response.js";

const buildSemesterFilters = async (query = {}) => {
  const filters = {};

  if (
    query.semesterId !== undefined &&
    query.semesterId !== null &&
    query.semesterId !== ""
  ) {
    const parsedSemesterId = Number(query.semesterId);
    if (Number.isNaN(parsedSemesterId)) {
      throw new Error("Semester tidak ditemukan");
    }

    const semester = await resolveSemesterReference({
      semesterId: parsedSemesterId,
    });

    filters.semesterId = semester.id;
    filters.tahunAjaran = semester.tahunAjaran;
    filters.semester = semester.semester;
    return filters;
  }

  const tahunAjaran = query.tahunAjaran ?? query.tahun;
  const semesterNumber = query.semester ?? query.semesterKe;

  if (
    tahunAjaran !== undefined &&
    tahunAjaran !== null &&
    tahunAjaran !== "" &&
    semesterNumber !== undefined &&
    semesterNumber !== null &&
    semesterNumber !== ""
  ) {
    const semester = await resolveSemesterReference({
      tahunAjaran,
      semester: semesterNumber,
    });

    if (!semester) {
      throw new Error("Semester tidak ditemukan");
    }

    filters.semesterId = semester.id;
    filters.tahunAjaran = semester.tahunAjaran;
    filters.semester = semester.semester;
  }

  return filters;
};

// GET /walikelas/:id/kelas/siswa
export const getSiswaKelas = async (req, res) => {
  try {
    const { id } = req.params;
    const siswa = await Student.getStudentsByWalikelasId(id);
    return successResponse(res, siswa);
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// GET /walikelas/:id/kelas/nilai
export const getNilaiKelas = async (req, res) => {
  try {
    const filters = await buildSemesterFilters(req.query);
    const { id } = req.params;
    const nilai = await Teacher.getNilaiByWalikelasId(id, filters);
    return successResponse(res, nilai);
  } catch (err) {
    if (err.message === "Semester tidak ditemukan") {
      return errorResponse(res, 404, err.message);
    }
    return errorResponse(res, 500, err.message);
  }
};

// GET /walikelas/:id/kelas/kehadiran
export const getKehadiranKelas = async (req, res) => {
  try {
    const filters = await buildSemesterFilters(req.query);
    const { id } = req.params;
    const absensi = await Teacher.getKehadiranByWalikelasId(id, filters);
    return successResponse(res, absensi);
  } catch (err) {
    if (err.message === "Semester tidak ditemukan") {
      return errorResponse(res, 404, err.message);
    }
    return errorResponse(res, 500, err.message);
  }
};

// POST /walikelas/:id/kelas/siswa
export const addSiswaKelas = async (req, res) => {
  try {
    const { users, students } = req.body;

    if (!users || !students) {
      return errorResponse(res, 400, "Data users dan students wajib diisi");
    }

    const siswaBaru = await Student.insertStudent(req.body);
    return successResponse(res, siswaBaru, "Siswa berhasil ditambahkan");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// PUT /walikelas/:id/kelas/siswa/:studentId
export const updateSiswaKelas = async (req, res) => {
  try {
    const { users, students } = req.body;

    if (!students) {
      return errorResponse(res, 400, "Data students wajib diisi");
    }

    const updated = await Student.updateStudent(req.params.studentId, req.body);
    return successResponse(res, updated, "Siswa berhasil diperbarui");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// DELETE /walikelas/:id/kelas/siswa/:studentId
export const deleteSiswaKelas = async (req, res) => {
  try {
    await Student.deleteStudent(req.params.studentId);
    return successResponse(res, {}, "Siswa berhasil dihapus");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// PUT /walikelas/:id/verifikasi/:nilaiId
export const verifikasiNilai = async (req, res) => {
  try {
    const walikelasName = req.user?.nama || "Walikelas";
    const updated = await Teacher.verifyNilai(
      req.params.nilaiId,
      walikelasName
    );
    return successResponse(res, updated, "Nilai berhasil diverifikasi");
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// GET /walikelas/:id/siswa/:studentId/raport
export const getRaportSiswa = async (req, res) => {
  try {
    const filters = await buildSemesterFilters(req.query);
    const raport = await Student.getRaportById(
      req.params.studentId,
      filters
    );
    return successResponse(res, raport);
  } catch (err) {
    if (err.message === "Semester tidak ditemukan") {
      return errorResponse(res, 404, err.message);
    }
    return errorResponse(res, 500, err.message);
  }
};
