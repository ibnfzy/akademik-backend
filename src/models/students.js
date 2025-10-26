import db from "../config/db.js";
import { resolveSemesterReference } from "./semesters.js";

const semesterSelects = [
  "sm.tahunAjaran as semesterTahunAjaran",
  "sm.semester as semesterKe",
  "sm.tanggalMulai as semesterTanggalMulai",
  "sm.tanggalSelesai as semesterTanggalSelesai",
  "sm.jumlahHariBelajar as semesterJumlahHariBelajar",
  "sm.catatan as semesterCatatan",
];

const normalizeSemesterFilter = (filters = {}) => {
  const normalized = {};

  if (
    filters.semesterId !== undefined &&
    filters.semesterId !== null &&
    filters.semesterId !== ""
  ) {
    const parsedSemesterId = Number(filters.semesterId);
    if (!Number.isNaN(parsedSemesterId)) {
      normalized.semesterId = parsedSemesterId;
    }
  }

  if (
    filters.tahunAjaran !== undefined &&
    filters.tahunAjaran !== null &&
    filters.tahunAjaran !== ""
  ) {
    normalized.tahunAjaran = filters.tahunAjaran;
  }

  if (
    filters.semester !== undefined &&
    filters.semester !== null &&
    filters.semester !== ""
  ) {
    const parsedSemester = Number(filters.semester);
    if (!Number.isNaN(parsedSemester)) {
      normalized.semester = parsedSemester;
    }
  }

  return normalized;
};

const applySemesterFilter = (query, aliasOrConfig, filters = {}) => {
  const normalized = normalizeSemesterFilter(filters);
  const config =
    typeof aliasOrConfig === "string"
      ? { referenceAlias: aliasOrConfig, semesterAlias: aliasOrConfig }
      : aliasOrConfig || {};

  const referenceAlias = config.referenceAlias ?? config.alias ?? null;
  if (!referenceAlias) {
    return query;
  }

  const semesterAlias = config.semesterAlias ?? referenceAlias;

  if (normalized.semesterId) {
    query.where(`${referenceAlias}.semesterId`, normalized.semesterId);
  } else if (normalized.tahunAjaran && normalized.semester !== undefined) {
    query
      .where(`${semesterAlias}.tahunAjaran`, normalized.tahunAjaran)
      .where(`${semesterAlias}.semester`, normalized.semester);
  }

  return query;
};

// 🔹 Ambil data siswa by id
export const getStudentById = async (id) => {
  return db("students as st")
    .join("classes as c", "st.kelasId", "c.id")
    .select("st.*", "c.nama as kelasName")
    .where("st.id", id)
    .first();
};

// 🔹 Ambil semua siswa
export const getAllStudents = async () => {
  return db("students as st")
    .join("users as u", "st.userId", "u.id")
    .join("classes as c", "st.kelasId", "c.id")
    .select(
      "st.id",
      "st.userId",
      "st.nisn",
      "st.nama",
      "st.kelasId",
      "c.nama as kelasName",
      "st.jenisKelamin",
      "st.tanggalLahir",
      "st.alamat",
      "st.nomorHP",
      "st.namaOrangTua",
      "st.pekerjaanOrangTua",
      "st.tahunMasuk",
      "u.username",
      "u.email",
      "u.role"
    )
    .orderBy("st.id", "desc");
};

// 🔹 Ambil semua siswa dalam kelas
export const getStudentsByKelasId = async (kelasId) => {
  return db("students as st")
    .join("users as u", "st.userId", "u.id")
    .select(
      "st.id",
      "st.userId",
      "st.nisn",
      "st.nama",
      "st.kelasId",
      "st.jenisKelamin",
      "st.tanggalLahir",
      "st.alamat",
      "st.nomorHP",
      "st.namaOrangTua",
      "st.pekerjaanOrangTua",
      "st.tahunMasuk",
      "u.username",
      "u.email",
      "u.role"
    )
    .where("st.kelasId", kelasId);
};

export const getStudentsByWalikelasId = async (walikelasId) => {
  return db("students as st")
    .join("users as u", "st.userId", "u.id")
    .join("classes as c", "st.kelasId", "c.id")
    .select(
      "st.id",
      "st.userId",
      "st.nisn",
      "st.nama",
      "st.kelasId",
      "st.jenisKelamin",
      "st.tanggalLahir",
      "st.alamat",
      "st.nomorHP",
      "st.namaOrangTua",
      "st.pekerjaanOrangTua",
      "st.tahunMasuk",
      "u.username",
      "u.email",
      "u.role",
      "c.nama as kelasName"
    )
    .where("c.walikelasId", walikelasId);
};

// 🔹 Tambah siswa baru (beserta user account)
export const insertStudent = async (data) => {
  return db.transaction(async (trx) => {
    // Insert ke tabel users
    const [userId] = await trx("users").insert(data.users);

    const user = await trx("users").where({ id: userId }).first();

    // Insert ke tabel students
    const [studentId] = await trx("students").insert({
      ...data.students,
      userId,
    });

    const student = await trx("students").where({ id: studentId }).first();

    return { ...student, username: user.username, email: user.email };
  });
};

// 🔹 Update siswa (beserta user)
export const updateStudent = async (id, data) => {
  return db.transaction(async (trx) => {
    // Update tabel students
    await trx("students").where({ userId: id }).update(data.students);

    const student = await trx("students").where({ userId: id }).first();

    // Jika ada perubahan di users
    if (data.users) {
      const userPayload = { ...data.users };

      // Validasi password kosong
      if (
        Object.prototype.hasOwnProperty.call(userPayload, "password") &&
        typeof userPayload.password === "string" &&
        userPayload.password.trim() === ""
      ) {
        delete userPayload.password;
      }

      await trx("users").where({ id }).update(userPayload);
    }

    return student;
  });
};

// 🔹 Hapus siswa (akan hapus user terkait juga)
export const deleteStudent = async (id) => {
  return db.transaction(async (trx) => {
    const student = await trx("students").where({ userId: id }).first();
    if (!student) return null;

    // Hapus siswa
    await trx("students").where({ userId: id }).del();

    // Hapus user terkait
    await trx("users").where({ id }).del();

    return true;
  });
};

// 🔹 Ambil nilai siswa
export const getStudentGrades = async (studentId, filters = {}) => {
  const query = db("grades as g")
    .join("subjects as s", "g.subjectId", "s.id")
    .join("teachers as t", "g.teacherId", "t.id")
    .leftJoin("semesters as sm", "g.semesterId", "sm.id")
    .select(
      "g.*",
      "s.nama as subjectName",
      "t.nama as teacherName",
      ...semesterSelects
    )
    .where("g.studentId", studentId);

  applySemesterFilter(
    query,
    { referenceAlias: "g", semesterAlias: "sm" },
    filters
  );
  return query;
};

// 🔹 Ambil kehadiran siswa
export const getStudentAttendance = async (studentId, filters = {}) => {
  const query = db("attendance as a")
    .join("subjects as s", "a.subjectId", "s.id")
    .leftJoin("semesters as sm", "a.semesterId", "sm.id")
    .select("a.*", "s.nama as subjectName", ...semesterSelects)
    .where("a.studentId", studentId);

  applySemesterFilter(
    query,
    { referenceAlias: "a", semesterAlias: "sm" },
    filters
  );
  return query;
};

// 🔹 Ambil raport siswa (nilai + kehadiran)
export const getRaportById = async (studentId, filters = {}) => {
  const student = await getStudentById(studentId);
  if (!student) return null;

  const grades = await getStudentGrades(studentId, filters);
  const attendance = await getStudentAttendance(studentId, filters);
  const c = await db("classes").where({ id: student.kelasId }).first();

  const walikelas = await db("teachers")
    .where({ id: c.walikelasId, role: "walikelas" })
    .first();

  const schoolProfile = await db("school_profile").first();

  let semesterMeta = null;
  if (
    filters &&
    (filters.semesterId ||
      (filters.tahunAjaran &&
        filters.semester !== undefined &&
        filters.semester !== null &&
        filters.semester !== ""))
  ) {
    semesterMeta = await resolveSemesterReference(
      {
        semesterId: filters.semesterId,
        tahunAjaran: filters.tahunAjaran,
        semester: filters.semester,
      },
      db
    );
  }

  const tahunAjaran = semesterMeta
    ? semesterMeta.tahunAjaran
    : filters.tahunAjaran ?? null;
  const semesterNumber = semesterMeta
    ? Number(semesterMeta.semester)
    : filters.semester !== undefined &&
      filters.semester !== null &&
      filters.semester !== ""
    ? Number(filters.semester)
    : null;

  return {
    student,
    grades,
    attendance,
    semesterId: semesterMeta ? semesterMeta.id : filters.semesterId ?? null,
    tahunAjaran,
    semester: semesterNumber,
    semesterInfo: semesterMeta
      ? {
          id: semesterMeta.id,
          tahunAjaran: semesterMeta.tahunAjaran,
          semester: Number(semesterMeta.semester),
          tanggalMulai: semesterMeta.tanggalMulai,
          tanggalSelesai: semesterMeta.tanggalSelesai,
          jumlahHariBelajar: semesterMeta.jumlahHariBelajar,
          catatan: semesterMeta.catatan,
        }
      : null,
    walikelas: walikelas ? { nama: walikelas.nama, nip: walikelas.nip } : null,
    profileSchool: schoolProfile || {},
  };
};

// 🔹 Ambil walikelas berdasarkan kelas
export const getWalikelasByKelasId = async (kelasId) => {
  return db("classes as c")
    .join("teachers as t", "c.walikelasId", "t.id")
    .select("t.id", "t.nama", "t.nip")
    .where("c.id", kelasId)
    .first();
};

// 🔹 Ambil profil sekolah
export const getSchoolProfile = async () => {
  return db("school_profile").first();
};
