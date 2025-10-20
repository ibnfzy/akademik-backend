import {
  getStudentById,
  getStudentGrades,
  getStudentAttendance,
  getWalikelasByKelasId,
  getSchoolProfile,
} from "../models/students.js";
import { successResponse, errorResponse } from "../utils/response.js";

// GET /siswa/:id/nilai
export const getNilai = async (req, res) => {
  const { id } = req.params;
  const { tahun, semester } = req.query;

  try {
    const grades = await getStudentGrades(id, tahun, semester);
    return successResponse(res, grades);
  } catch (err) {
    return errorResponse(res, 500, err.message, [], "SERVER_ERROR");
  }
};

// GET /siswa/:id/kehadiran
export const getKehadiran = async (req, res) => {
  const { id } = req.params;
  const { tahun, semester } = req.query;

  try {
    const attendance = await getStudentAttendance(id, tahun, semester);
    return successResponse(res, attendance);
  } catch (err) {
    return errorResponse(res, 500, err.message, [], "SERVER_ERROR");
  }
};

// GET /siswa/:id/raport
export const getRaport = async (req, res) => {
  const { id } = req.params;
  const { tahun, semester } = req.query;

  try {
    const student = await getStudentById(id);
    if (!student) {
      return errorResponse(res, 404, "Siswa tidak ditemukan");
    }

    const grades = await getStudentGrades(id, tahun, semester);
    const attendance = await getStudentAttendance(id, tahun, semester);
    const walikelas = await getWalikelasByKelasId(student.kelasId);
    const profileSchool = await getSchoolProfile();

    return successResponse(res, {
      student: {
        id: student.id,
        nisn: student.nisn,
        nama: student.nama,
        kelasId: student.kelasId,
        kelasName: student.kelasName,
        jenisKelamin: student.jenisKelamin,
        tanggalLahir: student.tanggalLahir,
        alamat: student.alamat,
        nomorHP: student.nomorHP,
        namaOrangTua: student.namaOrangTua,
        pekerjaanOrangTua: student.pekerjaanOrangTua,
        tahunMasuk: student.tahunMasuk,
      },
      grades,
      attendance,
      tahunAjaran: tahun,
      semester: semester ? Number(semester) : null,
      walikelas: walikelas
        ? { nama: walikelas.nama, nip: walikelas.nip }
        : null,
      profileSchool: profileSchool || {},
    });
  } catch (err) {
    return errorResponse(res, 500, err.message, [], "SERVER_ERROR");
  }
};
