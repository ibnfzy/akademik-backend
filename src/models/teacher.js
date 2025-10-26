import db from "../config/db.js";

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

const applyResolvedSemester = (payload, resolvedSemester) => {
  if (!resolvedSemester) {
    return payload;
  }

  return {
    ...payload,
    semesterId: resolvedSemester.id,
  };
};

// 🔹 Ambil semua guru (guru & walikelas)
export const getAllTeachers = async () => {
  return db("teachers as t")
    .join("users as u", "t.userId", "u.id")
    .select("t.*", "u.role", "u.email")
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
  applySemesterFilter(
    query,
    { referenceAlias: "g", semesterAlias: "sm" },
    filters
  );
  return query;
};

// Tambah nilai siswa
export const insertNilai = async (data) => {
  const payload = applyResolvedSemester({ ...data }, data.resolvedSemester);

  if (!payload.semesterId) {
    const error = new Error("SemesterId wajib diisi");
    error.code = "SEMESTER_REQUIRED";
    throw error;
  }

  delete payload.resolvedSemester;

  return db.transaction(async (trx) => {
    const [id] = await trx("grades").insert(payload);

    return fetchGradeById(trx, id);
  });
};

// Update nilai siswa
export const updateNilai = async (id, data) => {
  return db.transaction(async (trx) => {
    const payload = applyResolvedSemester({ ...data }, data.resolvedSemester);

    delete payload.resolvedSemester;

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
  applySemesterFilter(
    query,
    { referenceAlias: "a", semesterAlias: "sm" },
    filters
  );
  return query;
};

// Tambah kehadiran siswa
export const insertKehadiran = async (data) => {
  const { resolvedSemester, ...rest } = data;

  if (!resolvedSemester) {
    const error = new Error("SemesterId wajib diisi");
    error.code = "SEMESTER_REQUIRED";
    throw error;
  }

  return db.transaction(async (trx) => {
    const payload = applyResolvedSemester(rest, resolvedSemester);

    const [id] = await trx("attendance").insert(payload);

    return fetchAttendanceById(trx, id);
  });
};

// Update kehadiran siswa
export const updateKehadiran = async (attendanceId, data) => {
  return db.transaction(async (trx) => {
    const { resolvedSemester, ...rest } = data;
    let payload = { ...rest };

    if (resolvedSemester) {
      payload = applyResolvedSemester(payload, resolvedSemester);
    }

    if (Object.keys(payload).length === 0) {
      return fetchAttendanceById(trx, attendanceId);
    }

    await trx("attendance").where({ id: attendanceId }).update(payload);

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
  applySemesterFilter(
    query,
    { referenceAlias: "g", semesterAlias: "sm" },
    filters
  );
  return query.where("st.kelasId", kelasId);
};

export const getNilaiByWalikelasId = (walikelasId, filters = {}) => {
  const query = buildGradeQuery();
  query.join("classes as c", "st.kelasId", "c.id");
  applySemesterFilter(
    query,
    { referenceAlias: "g", semesterAlias: "sm" },
    filters
  );
  return query.where("c.walikelasId", walikelasId);
};

// Ambil kehadiran semua siswa di kelas (untuk walikelas)
export const getKehadiranByKelasId = (kelasId, filters = {}) => {
  const query = buildAttendanceQuery();
  applySemesterFilter(
    query,
    { referenceAlias: "a", semesterAlias: "sm" },
    filters
  );
  return query.where("st.kelasId", kelasId);
};

export const getKehadiranByWalikelasId = (walikelasId, filters = {}) => {
  const query = buildAttendanceQuery();
  query.join("classes as c", "st.kelasId", "c.id");
  applySemesterFilter(
    query,
    { referenceAlias: "a", semesterAlias: "sm" },
    filters
  );
  return query.where("c.walikelasId", walikelasId);
};

// Verifikasi nilai oleh walikelas
export const verifyNilai = (nilaiId, walikelasName) => {
  return db("grades").where({ id: nilaiId }).update({
    verified: true,
    verifiedBy: walikelasName,
    verifiedAt: db.fn.now(),
  });
};
