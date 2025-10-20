import {
  getStudentGrades,
  getStudentAttendance,
  getRaportById,
} from "../models/students.js";
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

// GET /siswa/:id/nilai
export const getNilai = async (req, res) => {
  const { id } = req.params;
  const filters = buildSemesterFilters(req.query);

  try {
    const grades = await getStudentGrades(id, filters);
    return successResponse(res, grades);
  } catch (err) {
    return errorResponse(res, 500, err.message, [], "SERVER_ERROR");
  }
};

// GET /siswa/:id/kehadiran
export const getKehadiran = async (req, res) => {
  const { id } = req.params;
  const filters = buildSemesterFilters(req.query);

  try {
    const attendance = await getStudentAttendance(id, filters);
    return successResponse(res, attendance);
  } catch (err) {
    return errorResponse(res, 500, err.message, [], "SERVER_ERROR");
  }
};

// GET /siswa/:id/raport
export const getRaport = async (req, res) => {
  const { id } = req.params;
  const filters = buildSemesterFilters(req.query);

  try {
    const raportData = await getRaportById(id, filters);
    if (!raportData) {
      return errorResponse(res, 404, "Siswa tidak ditemukan");
    }

    return successResponse(res, {
      student: {
        id: raportData.student.id,
        nisn: raportData.student.nisn,
        nama: raportData.student.nama,
        kelasId: raportData.student.kelasId,
        kelasName: raportData.student.kelasName,
        jenisKelamin: raportData.student.jenisKelamin,
        tanggalLahir: raportData.student.tanggalLahir,
        alamat: raportData.student.alamat,
        nomorHP: raportData.student.nomorHP,
        namaOrangTua: raportData.student.namaOrangTua,
        pekerjaanOrangTua: raportData.student.pekerjaanOrangTua,
        tahunMasuk: raportData.student.tahunMasuk,
      },
      grades: raportData.grades,
      attendance: raportData.attendance,
      semesterId: raportData?.semesterId ?? null,
      tahunAjaran: raportData?.tahunAjaran ?? null,
      semester:
        raportData?.semester !== undefined && raportData?.semester !== null
          ? Number(raportData.semester)
          : null,
      semesterInfo: raportData?.semesterInfo ?? null,
      walikelas: raportData?.walikelas ?? null,
      profileSchool: raportData?.profileSchool || {},
    });
  } catch (err) {
    if (err.message === "Semester tidak ditemukan") {
      return errorResponse(res, 404, err.message, [], "SEMESTER_NOT_FOUND");
    }
    return errorResponse(res, 500, err.message, [], "SERVER_ERROR");
  }
};
