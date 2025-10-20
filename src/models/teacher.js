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

  if (filters.tahunAjaran !== undefined && filters.tahunAjaran !== null && filters.tahunAjaran !== "") {
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

const applySemesterFilter = (query, alias, filters = {}) => {
  const normalized = normalizeSemesterFilter(filters);

  if (normalized.semesterId) {
    query.where(`${alias}.semesterId`, normalized.semesterId);
  } else if (normalized.tahunAjaran && normalized.semester !== undefined) {
    query
      .where(`${alias}.tahunAjaran`, normalized.tahunAjaran)
      .where(`${alias}.semester`, normalized.semester);
  }

  return query;
};

const buildGradeQuery = (client = db) => {
  return client("grades as g")
    .join("students as st", "g.studentId", "st.id")
    .join("subjects as s", "g.subjectId", "s.id")
    .join("teachers as t", "g.teacherId", "t.id")
    .leftJoin("semesters as sm", "g.semesterId", "sm.id")
    .select(
      "g.*",
      "st.nama as studentName",
      "s.nama as subjectName",
      "t.nama as teacherName",
      ...semesterSelects
    );
};

const buildAttendanceQuery = (client = db) => {
  return client("attendance as a")
    .join("students as st", "a.studentId", "st.id")
    .join("subjects as s", "a.subjectId", "s.id")
    .join("teachers as t", "a.teacherId", "t.id")
    .leftJoin("semesters as sm", "a.semesterId", "sm.id")
    .select(
      "a.*",
      "st.nama as studentName",
      "s.nama as subjectName",
      "t.nama as teacherName",
      ...semesterSelects
    );
};

const fetchGradeById = (client, id) => {
  return buildGradeQuery(client).where("g.id", id).first();
};

const fetchAttendanceById = (client, id) => {
  return buildAttendanceQuery(client).where("a.id", id).first();
};

const ensureSemesterForPayload = async (client, payload) => {
  const semester = await resolveSemesterReference(
    {
      semesterId: payload.semesterId,
      tahunAjaran: payload.tahunAjaran,
      semester: payload.semester,
    },
    client
  );

  if (!semester) {
    throw new Error("SemesterId wajib diisi");
  }

  return semester;
};

// 🔹 Ambil semua guru (guru & walikelas)
export const getAllTeachers = async () => {
  return db("teachers as t")
    .join("users as u", "t.userId", "u.id")
    .select("t.id", "t.userId", "t.nip", "t.nama", "u.role", "u.email")
    .orderBy("t.id", "desc");
};

// 🔹 Tambah guru baru (beserta user account)
export const insertTeacher = async (data) => {
  return db.transaction(async (trx) => {
    // Insert ke tabel users
    const [userId] = await trx("users").insert(data.users);

    // Insert ke tabel teachers
    const [teacherId] = await trx("teachers").insert({
      ...data.teachers,
      userId,
    });

    // Ambil kembali data user + teacher
    const user = await trx("users").where({ id: userId }).first();
    const teacher = await trx("teachers").where({ id: teacherId }).first();

    return {
      ...teacher,
      username: user.username,
      email: user.email,
      role: user.role,
    };
  });
};

// 🔹 Update guru (beserta user account)
export const updateTeacher = async (id, data) => {
  return db.transaction(async (trx) => {
    // Update tabel teachers
    await trx("teachers").where({ userId: id }).update(data.teachers);

    // Ambil kembali data teacher
    const teacher = await trx("teachers").where({ userId: id }).first();

    // Jika ada perubahan di users
    if (data.users) {
      await trx("users").where({ id }).update(data.users);
    }

    const user = await trx("users").where({ id }).first();

    return {
      ...teacher,
      username: user.username,
      email: user.email,
      role: user.role,
    };
  });
};

// 🔹 Hapus guru
export const deleteTeacher = async (id) => {
  await db("teachers").where({ userId: id }).del();
  return await db("users").where({ id }).del();
};

// 🔹 Ambil data guru by userId
export const getTeacherByUserId = (userId) => {
  return db("teachers").where({ userId }).first();
};

// 🔹 Ambil daftar mata pelajaran yang diajar guru
export const getSubjectsByTeacherId = (teacherId) => {
  return db("teacher_subjects as ts")
    .join("subjects as s", "ts.subjectId", "s.id")
    .select(
      "s.id as subjectId",
      "s.nama as subjectName",
      "s.kode",
      "ts.teacherId"
    )
    .where("ts.teacherId", teacherId);
};

// =============================
// 📘 GRADES
// =============================

// Ambil semua nilai (untuk guru panel filter frontend)
export const getAllGrades = (filters = {}) => {
  const query = buildGradeQuery();
  applySemesterFilter(query, "g", filters);
  return query;
};

// Tambah nilai siswa
export const insertNilai = async (data) => {
  return db.transaction(async (trx) => {
    const { semesterId, tahunAjaran, semester, ...rest } = data;
    const semesterRow = await ensureSemesterForPayload(trx, {
      semesterId,
      tahunAjaran,
      semester,
    });

    const [id] = await trx("grades").insert({
      ...rest,
      semesterId: semesterRow.id,
      tahunAjaran: semesterRow.tahunAjaran,
      semester: semesterRow.semester,
    });

    return fetchGradeById(trx, id);
  });
};

// Update nilai siswa
export const updateNilai = async (id, data) => {
  return db.transaction(async (trx) => {
    const { semesterId, tahunAjaran, semester, ...rest } = data;
    const payload = { ...rest };

    if (
      semesterId !== undefined ||
      tahunAjaran !== undefined ||
      semester !== undefined
    ) {
      const semesterRow = await ensureSemesterForPayload(trx, {
        semesterId,
        tahunAjaran,
        semester,
      });

      payload.semesterId = semesterRow.id;
      payload.tahunAjaran = semesterRow.tahunAjaran;
      payload.semester = semesterRow.semester;
    }

    if (Object.keys(payload).length === 0) {
      return fetchGradeById(trx, id);
    }

    await trx("grades").where({ id }).update(payload);
    return fetchGradeById(trx, id);
  });
};

// Hapus nilai siswa
export const deleteNilai = (gradeId) => {
  return db("grades").where({ id: gradeId }).del();
};

// =============================
// 📘 ATTENDANCE
// =============================

// Ambil semua kehadiran
export const getAllAttendance = (filters = {}) => {
  const query = buildAttendanceQuery();
  applySemesterFilter(query, "a", filters);
  return query;
};

// Tambah kehadiran siswa
export const insertKehadiran = async (data) => {
  return db.transaction(async (trx) => {
    const { semesterId, tahunAjaran, semester, ...rest } = data;
    const semesterRow = await ensureSemesterForPayload(trx, {
      semesterId,
      tahunAjaran,
      semester,
    });

    const [id] = await trx("attendance").insert({
      ...rest,
      semesterId: semesterRow.id,
      tahunAjaran: semesterRow.tahunAjaran,
      semester: semesterRow.semester,
    });

    return fetchAttendanceById(trx, id);
  });
};

// Update kehadiran siswa
export const updateKehadiran = async (attendanceId, data) => {
  return db.transaction(async (trx) => {
    const { semesterId, tahunAjaran, semester, ...rest } = data;
    const payload = { ...rest };

    if (
      semesterId !== undefined ||
      tahunAjaran !== undefined ||
      semester !== undefined
    ) {
      const semesterRow = await ensureSemesterForPayload(trx, {
        semesterId,
        tahunAjaran,
        semester,
      });

      payload.semesterId = semesterRow.id;
      payload.tahunAjaran = semesterRow.tahunAjaran;
      payload.semester = semesterRow.semester;
    }

    if (Object.keys(payload).length === 0) {
      return fetchAttendanceById(trx, attendanceId);
    }

    await trx("attendance")
      .where({ id: attendanceId })
      .update(payload);

    return fetchAttendanceById(trx, attendanceId);
  });
};

// Hapus kehadiran siswa
export const deleteKehadiran = (attendanceId) => {
  return db("attendance").where({ id: attendanceId }).del();
};

// =============================
// 📘 WALIKELAS RELATION (opsional)
// =============================

// Ambil nilai semua siswa di kelas (untuk walikelas)
export const getNilaiByKelasId = (kelasId, filters = {}) => {
  const query = buildGradeQuery();
  applySemesterFilter(query, "g", filters);
  return query.where("st.kelasId", kelasId);
};

// Ambil kehadiran semua siswa di kelas (untuk walikelas)
export const getKehadiranByKelasId = (kelasId, filters = {}) => {
  const query = buildAttendanceQuery();
  applySemesterFilter(query, "a", filters);
  return query.where("st.kelasId", kelasId);
};

// Verifikasi nilai oleh walikelas
export const verifyNilai = (nilaiId, walikelasName) => {
  return db("grades").where({ id: nilaiId }).update({
    verified: true,
    verifiedBy: walikelasName,
    verifiedAt: db.fn.now(),
  });
};
