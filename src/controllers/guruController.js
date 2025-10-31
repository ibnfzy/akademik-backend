import * as Teacher from "../models/teacher.js";
import * as Schedule from "../models/jadwalPelajaran.js";
import {
  resolveSemesterReference,
  getActiveSemester,
  isSemesterActive,
} from "../models/semesters.js";
import { getSetting } from "../models/settings.js";
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

const buildScheduleFilters = (query = {}) => {
  const filters = {};

  if (query.semesterId !== undefined && query.semesterId !== null && query.semesterId !== "") {
    const parsedSemesterId = Number(query.semesterId);
    if (!Number.isNaN(parsedSemesterId)) {
      filters.semesterId = parsedSemesterId;
    }
  }

  if (query.kelasId !== undefined && query.kelasId !== null && query.kelasId !== "") {
    const parsedKelasId = Number(query.kelasId);
    if (!Number.isNaN(parsedKelasId)) {
      filters.kelasId = parsedKelasId;
    }
  }

  if (query.hari) {
    filters.hari = query.hari;
  }

  return filters;
};

const SEMESTER_ENFORCEMENT_SETTING_KEY = "semester_enforcement_mode";
const DEFAULT_SEMESTER_ENFORCEMENT_MODE = "relaxed";

const fetchSemesterEnforcementMode = async () => {
  const setting = await getSetting(SEMESTER_ENFORCEMENT_SETTING_KEY);
  const mode = String(setting?.value || DEFAULT_SEMESTER_ENFORCEMENT_MODE).toLowerCase();

  return mode === "strict" ? "strict" : DEFAULT_SEMESTER_ENFORCEMENT_MODE;
};

const resolveSemesterFromPayload = async (
  payload,
  { required = false, referenceDate = new Date() } = {}
) => {
  const enforcementMode = await fetchSemesterEnforcementMode();
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

  let semester = null;

  if (hasSemesterId || hasPair) {
    try {
      semester = await resolveSemesterReference({
        semesterId: hasSemesterId ? payload.semesterId : undefined,
        tahunAjaran: hasPair ? payload.tahunAjaran : undefined,
        semester: hasPair ? payload.semester : undefined,
      });
    } catch (err) {
      if (err.message === "Semester tidak ditemukan") {
        const error = new Error(err.message);
        error.code = "SEMESTER_NOT_FOUND";
        throw error;
      }
      throw err;
    }

    if (!semester) {
      const error = new Error("Semester tidak ditemukan");
      error.code = "SEMESTER_NOT_FOUND";
      throw error;
    }

    if (!isSemesterActive(semester, referenceDate) && enforcementMode === "strict") {
      const error = new Error("Semester yang dipilih tidak aktif");
      error.code = "SEMESTER_NOT_ACTIVE";
      throw error;
    }
  } else {
    semester = await getActiveSemester(referenceDate);

    if (!semester && (required || enforcementMode === "strict")) {
      const error = new Error("Semester aktif tidak ditemukan");
      error.code = "ACTIVE_SEMESTER_NOT_FOUND";
      throw error;
    }
  }

  if (!semester && required) {
    const error = new Error("SemesterId wajib dikirimkan");
    error.code = "SEMESTER_REQUIRED";
    throw error;
  }

  return semester;
};

const respondSemesterError = (res, err) => {
  switch (err.code) {
    case "SEMESTER_REQUIRED":
      errorResponse(
        res,
        400,
        "semesterId atau kombinasi tahun ajaran dan semester wajib diisi"
      );
      return true;
    case "SEMESTER_NOT_FOUND":
      errorResponse(res, 404, "Semester tidak ditemukan");
      return true;
    case "ACTIVE_SEMESTER_NOT_FOUND":
      errorResponse(
        res,
        409,
        "Tidak ada semester aktif yang dapat digunakan. Silakan hubungi admin untuk mengatur semester berjalan."
      );
      return true;
    case "SEMESTER_NOT_ACTIVE":
      errorResponse(
        res,
        400,
        "Semester yang dipilih sudah tidak aktif. Silakan gunakan semester yang sedang berjalan."
      );
      return true;
    default:
      return false;
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

export const getTeachingSchedules = async (req, res) => {
  try {
    const teacherId = Number(req.params.id);
    if (Number.isNaN(teacherId)) {
      return errorResponse(res, 400, "ID guru tidak valid");
    }

    const filters = buildScheduleFilters(req.query);
    filters.teacherId = teacherId;

    const schedules = await Schedule.getSchedules(filters);
    return successResponse(res, schedules);
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

    const {
      semesterId: rawSemesterId,
      tahunAjaran: _tahunAjaran,
      semester: _semesterNumber,
      ...restBody
    } = req.body;

    const payload = {
      ...restBody,
      teacherId: req.params.id,
      verified: false,
      semesterId: semester?.id ?? rawSemesterId ?? null,
    };

    if (!payload.semesterId) {
      throw Object.assign(new Error("SemesterId wajib dikirimkan"), {
        code: "SEMESTER_REQUIRED",
      });
    }

    const nilai = await Teacher.insertNilai(payload);
    return successResponse(res, nilai, "Nilai berhasil ditambahkan");
  } catch (err) {
    if (respondSemesterError(res, err)) {
      return;
    }
    return errorResponse(res, 500, err.message);
  }
};

// PUT /guru/:id/nilai/:gradeId
export const updateNilai = async (req, res) => {
  try {
    const semester = await resolveSemesterFromPayload(req.body);

    const {
      semesterId: rawSemesterId,
      tahunAjaran: _tahunAjaran,
      semester: _semesterNumber,
      ...restBody
    } = req.body;

    const payload = {
      ...restBody,
      teacherId: req.params.id,
    };

    if (semester) {
      payload.semesterId = semester.id;
    } else if (rawSemesterId !== undefined) {
      payload.semesterId = rawSemesterId;
    }

    const nilai = await Teacher.updateNilai(req.params.gradeId, payload);
    return successResponse(res, nilai, "Nilai berhasil diperbarui");
  } catch (err) {
    if (respondSemesterError(res, err)) {
      return;
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

    const {
      semesterId: _semesterId,
      tahunAjaran: _tahunAjaran,
      semester: _semesterNumber,
      ...restBody
    } = req.body;

    const payload = {
      ...restBody,
      teacherId: req.params.id,
      resolvedSemester: semester,
    };

    const absen = await Teacher.insertKehadiran(payload);
    return successResponse(res, absen, "Kehadiran berhasil dicatat");
  } catch (err) {
    if (respondSemesterError(res, err)) {
      return;
    }
    return errorResponse(res, 500, err.message);
  }
};

// PUT /guru/:id/kehadiran/:attendanceId
export const updateKehadiran = async (req, res) => {
  try {
    const semester = await resolveSemesterFromPayload(req.body);

    const {
      semesterId: _semesterId,
      tahunAjaran: _tahunAjaran,
      semester: _semesterNumber,
      ...restBody
    } = req.body;

    const payload = {
      ...restBody,
      teacherId: req.params.id,
    };

    if (semester) {
      payload.resolvedSemester = semester;
    }

    const absen = await Teacher.updateKehadiran(
      req.params.attendanceId,
      payload
    );
    return successResponse(res, absen, "Kehadiran berhasil diperbarui");
  } catch (err) {
    if (respondSemesterError(res, err)) {
      return;
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
