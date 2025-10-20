import db from "../config/db.js";

const semesterColumns = [
  "id",
  "tahunAjaran",
  "semester",
  "tanggalMulai",
  "tanggalSelesai",
  "jumlahHariBelajar",
  "catatan",
  "createdAt",
  "updatedAt",
];

export const getAllSemesters = () => {
  return db("semesters")
    .select(semesterColumns)
    .orderBy("tahunAjaran", "desc")
    .orderBy("semester", "desc");
};

export const getSemesterById = (id) => {
  return db("semesters").select(semesterColumns).where({ id }).first();
};

export const getSemesterByYearAndNumber = (tahunAjaran, semesterNumber) => {
  if (!tahunAjaran || semesterNumber === undefined || semesterNumber === null) {
    return null;
  }

  const parsedSemester = Number(semesterNumber);
  if (Number.isNaN(parsedSemester)) {
    return null;
  }

  return db("semesters")
    .select(semesterColumns)
    .where({ tahunAjaran, semester: parsedSemester })
    .first();
};

export const createSemester = async (data) => {
  const payload = {
    tahunAjaran: data.tahunAjaran,
    semester: Number(data.semester),
    tanggalMulai: data.tanggalMulai,
    tanggalSelesai: data.tanggalSelesai,
    jumlahHariBelajar: data.jumlahHariBelajar ?? 0,
    catatan: data.catatan ?? null,
  };

  const [id] = await db("semesters").insert(payload);
  return getSemesterById(id);
};

export const updateSemester = async (id, data) => {
  const payload = {};

  if (data.tahunAjaran !== undefined) payload.tahunAjaran = data.tahunAjaran;
  if (data.semester !== undefined) payload.semester = Number(data.semester);
  if (data.tanggalMulai !== undefined) payload.tanggalMulai = data.tanggalMulai;
  if (data.tanggalSelesai !== undefined) payload.tanggalSelesai = data.tanggalSelesai;
  if (data.jumlahHariBelajar !== undefined)
    payload.jumlahHariBelajar = data.jumlahHariBelajar;
  if (data.catatan !== undefined) payload.catatan = data.catatan;

  if (Object.keys(payload).length === 0) {
    return getSemesterById(id);
  }

  await db("semesters").where({ id }).update(payload);
  return getSemesterById(id);
};

export const deleteSemester = (id) => {
  return db("semesters").where({ id }).del();
};

export const resolveSemesterReference = async (
  { semesterId, tahunAjaran, semester },
  client = db
) => {
  if (!semesterId && !tahunAjaran) {
    return null;
  }

  if (semesterId) {
    const parsedId = Number(semesterId);
    if (Number.isNaN(parsedId)) {
      const error = new Error("Semester tidak ditemukan");
      error.code = "SEMESTER_NOT_FOUND";
      throw error;
    }

    const byId = await client("semesters")
      .select(semesterColumns)
      .where({ id: parsedId })
      .first();
    if (byId) return byId;
    throw new Error("Semester tidak ditemukan");
  }

  if (!semester && semester !== 0) {
    throw new Error("Semester tidak ditemukan");
  }

  const parsedSemester = Number(semester);
  if (Number.isNaN(parsedSemester)) {
    const error = new Error("Semester tidak ditemukan");
    error.code = "SEMESTER_NOT_FOUND";
    throw error;
  }

  const byPair = await client("semesters")
    .select(semesterColumns)
    .where({ tahunAjaran, semester: parsedSemester })
    .first();

  if (!byPair) {
    throw new Error("Semester tidak ditemukan");
  }

  return byPair;
};

const normalizeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const formatDateForQuery = (value) => {
  const date = normalizeDate(value);
  if (!date) return null;
  return date.toISOString().slice(0, 10);
};

export const isSemesterActive = (semester, referenceDate = new Date()) => {
  if (!semester) return false;

  const start = normalizeDate(semester.tanggalMulai);
  const end = normalizeDate(semester.tanggalSelesai);
  const reference = normalizeDate(referenceDate);

  if (!start || !end || !reference) {
    return false;
  }

  return reference.getTime() >= start.getTime() && reference.getTime() <= end.getTime();
};

export const getActiveSemester = async (
  referenceDate = new Date(),
  client = db
) => {
  const dateString = formatDateForQuery(referenceDate);

  if (!dateString) {
    return null;
  }

  return client("semesters")
    .select(semesterColumns)
    .where("tanggalMulai", "<=", dateString)
    .andWhere("tanggalSelesai", ">=", dateString)
    .orderBy("tanggalMulai", "desc")
    .first();
};

export const getLatestSemester = (client = db) => {
  return client("semesters")
    .select(semesterColumns)
    .orderBy("tanggalMulai", "desc")
    .orderBy("tanggalSelesai", "desc")
    .first();
};
