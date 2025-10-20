import db from "../config/db.js";

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
      await trx("users").where({ id }).update(data.users);
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
export const getStudentGrades = async (studentId, tahun, semester) => {
  let query = db("grades as g")
    .join("subjects as s", "g.subjectId", "s.id")
    .join("teachers as t", "g.teacherId", "t.id")
    .select("g.*", "s.nama as subjectName", "t.nama as teacherName")
    .where("g.studentId", studentId);

  if (tahun) query.where("g.tahunAjaran", tahun);
  if (semester) query.where("g.semester", semester);

  return query;
};

// 🔹 Ambil kehadiran siswa
export const getStudentAttendance = async (studentId, tahun, semester) => {
  let query = db("attendance as a")
    .join("subjects as s", "a.subjectId", "s.id")
    .select("a.*", "s.nama as subjectName")
    .where("a.studentId", studentId);

  if (tahun) query.where("a.tahunAjaran", tahun);
  if (semester) query.where("a.semester", semester);

  return query;
};

// 🔹 Ambil raport siswa (nilai + kehadiran)
export const getRaportById = async (studentId, tahun, semester) => {
  const student = await getStudentById(studentId);
  if (!student) return null;

  const grades = await getStudentGrades(studentId, tahun, semester);
  const attendance = await getStudentAttendance(studentId, tahun, semester);
  const c = await db("classes").where({ id: student.kelasId }).first();

  const walikelas = await db("teachers")
    .where({ id: c.walikelasId, role: "walikelas" })
    .first();

  const schoolProfile = await db("school_profile").first();

  return {
    student,
    grades,
    attendance,
    tahunAjaran: tahun,
    semester: semester ? Number(semester) : null,
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
