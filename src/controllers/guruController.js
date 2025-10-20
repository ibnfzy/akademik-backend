import * as Teacher from "../models/teacher.js";
import { resolveSemesterReference } from "../models/semesters.js";
import { successResponse, errorResponse } from "../utils/response.js";

const buildSemesterFilters = (query = {}) => {
  const filters = {};

  if (query.semesterId !== undefined && query.semesterId !== null && query.semesterId !== "") {
    filters.semesterId = query.semesterId;
  }

  const tahunAjaran = query.tahunAjaran ?? query.tahun;
  if (tahunAjaran !== undefined && tahunAjaran !== null && tahunAjaran !== "") {
    filters.tahunAjaran = tahunAjaran;
  }

  if (query.semester !== undefined && query.semester !== null && query.semester !== "") {
    filters.semester = query.semester;
  }

  return filters;
};

const resolveSemesterFromPayload = async (payload, { required = false } = {}) => {
  const hasSemesterId =
    payload.semesterId !== undefined &&
    payload.semesterId !== null &&
    payload.semesterId !== "";
  const hasPair =
    payload.tahunAjaran !== undefined &&
    payload.tahunAjaran !== null &&
    payload.tahunAjaran !== "" &&
    payload.semester !== undefined &&
    payload.semester !== null &&
    payload.semester !== "";

  if (!hasSemesterId && !hasPair) {
    if (!required) return null;
    const err = new Error("SemesterId wajib dikirimkan");
    err.code = "SEMESTER_REQUIRED";
    throw err;
  }

  try {
    const semester = await resolveSemesterReference({
      semesterId: hasSemesterId ? payload.semesterId : undefined,
      tahunAjaran: hasPair ? payload.tahunAjaran : undefined,
      semester: hasPair ? payload.semester : undefined,
    });

    if (!semester) {
      const err = new Error("Semester tidak ditemukan");
      err.code = "SEMESTER_NOT_FOUND";
      throw err;
    }

    return semester;
  } catch (err) {
    if (err.message === "Semester tidak ditemukan") {
      const error = new Error(err.message);
      error.code = "SEMESTER_NOT_FOUND";
      throw error;
    }
    throw err;
  }
};

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
    const filters = buildSemesterFilters(req.query);
    const grades = await Teacher.getAllGrades(filters);
    return successResponse(res, grades);
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// GET /guru/attendance
export const getAllAttendance = async (req, res) => {
  try {
    const filters = buildSemesterFilters(req.query);
    const attendance = await Teacher.getAllAttendance(filters);
    return successResponse(res, attendance);
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
};

// POST /guru/:id/nilai
export const addNilai = async (req, res) => {
  try {
    const semester = await resolveSemesterFromPayload(req.body, {
      required: true,
    });

    const payload = {
      ...req.body,
      semesterId: semester.id,
      teacherId: req.params.id,
      verified: false,
    };

    delete payload.tahunAjaran;
    delete payload.semester;

    const nilai = await Teacher.insertNilai(payload);
    return successResponse(res, nilai, "Nilai berhasil ditambahkan");
  } catch (err) {
    if (err.code === "SEMESTER_REQUIRED") {
      return errorResponse(
        res,
        400,
        "semesterId atau kombinasi tahun ajaran dan semester wajib diisi"
      );
    }
    if (err.code === "SEMESTER_NOT_FOUND") {
      return errorResponse(res, 404, "Semester tidak ditemukan");
    }
    return errorResponse(res, 500, err.message);
  }
};

// PUT /guru/:id/nilai/:gradeId
export const updateNilai = async (req, res) => {
  try {
    const semester = await resolveSemesterFromPayload(req.body);

    const payload = {
      ...req.body,
      teacherId: req.params.id,
    };

    if (semester) {
      payload.semesterId = semester.id;
    }

    delete payload.tahunAjaran;
    delete payload.semester;

    const nilai = await Teacher.updateNilai(req.params.gradeId, payload);
    return successResponse(res, nilai, "Nilai berhasil diperbarui");
  } catch (err) {
    if (err.code === "SEMESTER_REQUIRED") {
      return errorResponse(
        res,
        400,
        "semesterId atau kombinasi tahun ajaran dan semester wajib diisi"
      );
    }
    if (err.code === "SEMESTER_NOT_FOUND") {
      return errorResponse(res, 404, "Semester tidak ditemukan");
    }
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
    const semester = await resolveSemesterFromPayload(req.body, {
      required: true,
    });

    const payload = {
      ...req.body,
      semesterId: semester.id,
      teacherId: req.params.id,
    };

    delete payload.tahunAjaran;
    delete payload.semester;

    const absen = await Teacher.insertKehadiran(payload);
    return successResponse(res, absen, "Kehadiran berhasil dicatat");
  } catch (err) {
    if (err.code === "SEMESTER_REQUIRED") {
      return errorResponse(
        res,
        400,
        "semesterId atau kombinasi tahun ajaran dan semester wajib diisi"
      );
    }
    if (err.code === "SEMESTER_NOT_FOUND") {
      return errorResponse(res, 404, "Semester tidak ditemukan");
    }
    return errorResponse(res, 500, err.message);
  }
};

// PUT /guru/:id/kehadiran/:attendanceId
export const updateKehadiran = async (req, res) => {
  try {
    const semester = await resolveSemesterFromPayload(req.body);

    const payload = {
      ...req.body,
      teacherId: req.params.id,
    };

    if (semester) {
      payload.semesterId = semester.id;
    }

    delete payload.tahunAjaran;
    delete payload.semester;

    const absen = await Teacher.updateKehadiran(
      req.params.attendanceId,
      payload
    );
    return successResponse(res, absen, "Kehadiran berhasil diperbarui");
  } catch (err) {
    if (err.code === "SEMESTER_REQUIRED") {
      return errorResponse(
        res,
        400,
        "semesterId atau kombinasi tahun ajaran dan semester wajib diisi"
      );
    }
    if (err.code === "SEMESTER_NOT_FOUND") {
      return errorResponse(res, 404, "Semester tidak ditemukan");
    }
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
