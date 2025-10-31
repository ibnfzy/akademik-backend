import db from "../config/db.js";
import jwt from "jsonwebtoken";
import { successResponse, errorResponse } from "../utils/response.js";

let activeDb = db;

export const __setAuthDependencies = (overrides = {}) => {
  activeDb = overrides.db ?? db;
};

export const __resetAuthDependencies = () => {
  activeDb = db;
};

export const login = async (req, res) => {
  const { username, password, role } = req.body;
  try {
    // cari user sesuai username, password, role
    const user = await activeDb("users")
      .where({ username, password, role })
      .first();

    if (!user) {
      return errorResponse(res, 401, "Invalid credentials", [], "AUTH_INVALID");
    }

    let kelasId = null;
    let mataPelajaran = [];
    let nis = null;
    let nisn = null;
    let nip = null;
    let studentId = null;
    let teacherId = null;
    let nama = user.username;

    if (role === "siswa") {
      const student = await activeDb("students")
        .where({ userId: user.id })
        .first();
      if (student) {
        kelasId = student.kelasId;
        nis = student.nis ?? null;
        nisn = student.nisn;
        studentId = student.id;
        nama = student.nama;
      }
    } else if (role === "walikelas") {
      const teacher = await activeDb("teachers")
        .where({ userId: user.id })
        .first();
      if (teacher) {
        const kelas = await activeDb("classes")
          .where({ walikelasId: teacher.id })
          .first();

        nip = teacher.nip;
        teacherId = teacher.id;
        nama = teacher.nama;
        kelasId = kelas ? kelas.id : null;
      }
    } else if (role === "guru") {
      const teacher = await activeDb("teachers")
        .where({ userId: user.id })
        .first();
      if (teacher) {
        nip = teacher.nip;
        teacherId = teacher.id;
        nama = teacher.nama;

        const subjects = await activeDb("teacher_subjects as ts")
          .join("subjects as s", "ts.subjectId", "s.id")
          .where("ts.teacherId", teacher.id)
          .select("s.id", "s.nama");

        // ubah hasil ke array nama mapel
        mataPelajaran = subjects.map((sub) => sub.nama);
      }
    }

    // buat JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    // format response sesuai expected data
    return successResponse(res, {
      user: {
        id: user.id,
        username: user.username,
        nama: nama,
        role: user.role,
        email: user.email,
        kelasId,
        studentId,
        teacherId,
        mataPelajaran,
        nis,
        nisn,
        nip,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (err) {
    return errorResponse(res, 500, err.message, [], "SERVER_ERROR");
  }
};

export const logout = (req, res) => {
  return successResponse(res, {}, "Logged out successfully");
};
