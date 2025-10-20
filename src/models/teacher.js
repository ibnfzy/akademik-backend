import db from "../config/db.js";

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
export const getAllGrades = () => {
  return db("grades as g")
    .join("students as st", "g.studentId", "st.id")
    .join("subjects as s", "g.subjectId", "s.id")
    .join("teachers as t", "g.teacherId", "t.id")
    .select(
      "g.*",
      "st.nama as studentName",
      "s.nama as subjectName",
      "t.nama as teacherName"
    );
};

// Tambah nilai siswa
export const insertNilai = async (data) => {
  const [id] = await db("grades").insert(data);
  return db("grades").where({ id }).first();
};

// Update nilai siswa
export const updateNilai = async (id, data) => {
  await db("grades").where({ id }).update(data);
  return db("grades").where({ id }).first();
};

// Hapus nilai siswa
export const deleteNilai = (gradeId) => {
  return db("grades").where({ id: gradeId }).del();
};

// =============================
// 📘 ATTENDANCE
// =============================

// Ambil semua kehadiran
export const getAllAttendance = () => {
  return db("attendance as a")
    .join("students as st", "a.studentId", "st.id")
    .join("subjects as s", "a.subjectId", "s.id")
    .join("teachers as t", "a.teacherId", "t.id")
    .select(
      "a.*",
      "st.nama as studentName",
      "s.nama as subjectName",
      "t.nama as teacherName"
    );
};

// Tambah kehadiran siswa
export const insertKehadiran = (data) => {
  return db("attendance").insert(data).returning("*");
};

// Update kehadiran siswa
export const updateKehadiran = (attendanceId, data) => {
  return db("attendance")
    .where({ id: attendanceId })
    .update(data)
    .returning("*");
};

// Hapus kehadiran siswa
export const deleteKehadiran = (attendanceId) => {
  return db("attendance").where({ id: attendanceId }).del();
};

// =============================
// 📘 WALIKELAS RELATION (opsional)
// =============================

// Ambil nilai semua siswa di kelas (untuk walikelas)
export const getNilaiByKelasId = (kelasId) => {
  return db("grades as g")
    .join("students as st", "g.studentId", "st.id")
    .join("subjects as s", "g.subjectId", "s.id")
    .join("teachers as t", "g.teacherId", "t.id")
    .select(
      "g.*",
      "st.nama as studentName",
      "s.nama as subjectName",
      "t.nama as teacherName"
    )
    .where("st.kelasId", kelasId);
};

// Ambil kehadiran semua siswa di kelas (untuk walikelas)
export const getKehadiranByKelasId = (kelasId) => {
  return db("attendance as a")
    .join("students as st", "a.studentId", "st.id")
    .join("subjects as s", "a.subjectId", "s.id")
    .join("teachers as t", "a.teacherId", "t.id")
    .select(
      "a.*",
      "st.nama as studentName",
      "s.nama as subjectName",
      "t.nama as teacherName"
    )
    .where("st.kelasId", kelasId);
};

// Verifikasi nilai oleh walikelas
export const verifyNilai = (nilaiId, walikelasName) => {
  return db("grades").where({ id: nilaiId }).update({
    verified: true,
    verifiedBy: walikelasName,
    verifiedAt: db.fn.now(),
  });
};
