import db from "../config/db.js";

const scheduleSelects = [
  "jp.id",
  "jp.kelasId",
  "jp.subjectId",
  "jp.teacherId",
  "jp.semesterId",
  "jp.hari",
  "jp.jamMulai",
  "jp.jamSelesai",
  "jp.ruangan",
  "jp.createdAt",
  "jp.updatedAt",
  "c.nama as kelasNama",
  "c.tingkat as kelasTingkat",
  "c.jurusan as kelasJurusan",
  "c.walikelasId as kelasWalikelasId",
  "s.nama as subjectNama",
  "s.kode as subjectKode",
  "t.nama as teacherNama",
  "t.nip as teacherNip",
  "sm.tahunAjaran as semesterTahunAjaran",
  "sm.semester as semesterKe",
];

const buildScheduleQuery = (client = db) => {
  return client("jadwal_pelajaran as jp")
    .leftJoin("classes as c", "jp.kelasId", "c.id")
    .leftJoin("subjects as s", "jp.subjectId", "s.id")
    .leftJoin("teachers as t", "jp.teacherId", "t.id")
    .leftJoin("semesters as sm", "jp.semesterId", "sm.id")
    .select(scheduleSelects);
};

const normalizeNumber = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const applyScheduleFilters = (query, filters = {}) => {
  const kelasId = normalizeNumber(filters.kelasId);
  const teacherId = normalizeNumber(filters.teacherId);
  const semesterId = normalizeNumber(filters.semesterId);
  const walikelasId = normalizeNumber(filters.walikelasId);

  if (kelasId !== null) {
    query.where("jp.kelasId", kelasId);
  }

  if (teacherId !== null) {
    query.where("jp.teacherId", teacherId);
  }

  if (semesterId !== null) {
    query.where("jp.semesterId", semesterId);
  }

  if (filters.hari) {
    query.where("jp.hari", filters.hari);
  }

  if (walikelasId !== null) {
    query.where("c.walikelasId", walikelasId);
  }

  return query;
};

const pickSchedulePayload = (data = {}) => {
  const payload = {};

  if (data.kelasId !== undefined) payload.kelasId = data.kelasId;
  if (data.subjectId !== undefined) payload.subjectId = data.subjectId;
  if (data.teacherId !== undefined) payload.teacherId = data.teacherId;
  if (data.semesterId !== undefined) payload.semesterId = data.semesterId;
  if (data.hari !== undefined) payload.hari = data.hari;
  if (data.jamMulai !== undefined) payload.jamMulai = data.jamMulai;
  if (data.jamSelesai !== undefined) payload.jamSelesai = data.jamSelesai;
  if (data.ruang !== undefined) payload.ruang = data.ruang ?? null;
  if (data.keterangan !== undefined)
    payload.keterangan = data.keterangan ?? null;

  return payload;
};

const parseTimeToMinutes = (timeString) => {
  if (!timeString || typeof timeString !== "string") {
    return null;
  }

  const parts = timeString.split(":");
  if (parts.length < 2) {
    return null;
  }

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  const seconds = parts.length > 2 ? Number(parts[2]) : 0;
  if (Number.isNaN(seconds)) {
    return null;
  }

  return hours * 60 + minutes + Math.floor(seconds / 60);
};

const isTimeRangeOverlapping = (startA, endA, startB, endB) => {
  const aStart = parseTimeToMinutes(startA);
  const aEnd = parseTimeToMinutes(endA);
  const bStart = parseTimeToMinutes(startB);
  const bEnd = parseTimeToMinutes(endB);

  if (aStart === null || aEnd === null || bStart === null || bEnd === null) {
    return false;
  }

  if (aStart >= aEnd || bStart >= bEnd) {
    return false;
  }

  return aStart < bEnd && bStart < aEnd;
};

const fetchConflictsForField = async (
  payload,
  field,
  value,
  { excludeId } = {}
) => {
  const query = buildScheduleQuery()
    .where("jp.hari", payload.hari)
    .andWhere(`jp.${field}`, value);

  if (excludeId !== undefined && excludeId !== null) {
    query.whereNot("jp.id", excludeId);
  }

  const candidates = await query;
  return candidates.filter((candidate) =>
    isTimeRangeOverlapping(
      payload.jamMulai,
      payload.jamSelesai,
      candidate.jamMulai,
      candidate.jamSelesai
    )
  );
};

export const getSchedules = (filters = {}) => {
  const query = buildScheduleQuery();
  applyScheduleFilters(query, filters);
  return query.orderBy("jp.hari").orderBy("jp.jamMulai");
};

export const getScheduleById = (id) => {
  return buildScheduleQuery().where("jp.id", id).first();
};

export const createSchedule = async (data) => {
  const payload = pickSchedulePayload(data);
  const [id] = await db("jadwal_pelajaran").insert(payload);
  return getScheduleById(id);
};

export const updateSchedule = async (id, data) => {
  const payload = pickSchedulePayload(data);
  if (Object.keys(payload).length === 0) {
    return getScheduleById(id);
  }

  await db("jadwal_pelajaran").where({ id }).update(payload);
  return getScheduleById(id);
};

export const deleteSchedule = (id) => {
  return db("jadwal_pelajaran").where({ id }).del();
};

export const findConflictingSchedules = async (payload, options = {}) => {
  if (!payload || !payload.hari) {
    return [];
  }

  const conflicts = [];
  const seenIds = new Set();

  if (payload.kelasId !== undefined && payload.kelasId !== null) {
    const kelasConflicts = await fetchConflictsForField(
      payload,
      "kelasId",
      payload.kelasId,
      options
    );
    for (const conflict of kelasConflicts) {
      if (!seenIds.has(conflict.id)) {
        seenIds.add(conflict.id);
        conflicts.push({ ...conflict, conflictScope: "kelas" });
      }
    }
  }

  if (payload.teacherId !== undefined && payload.teacherId !== null) {
    const teacherConflicts = await fetchConflictsForField(
      payload,
      "teacherId",
      payload.teacherId,
      options
    );
    for (const conflict of teacherConflicts) {
      if (!seenIds.has(conflict.id)) {
        seenIds.add(conflict.id);
        conflicts.push({ ...conflict, conflictScope: "teacher" });
      }
    }
  }

  return conflicts;
};

export const __testUtils = {
  parseTimeToMinutes,
  isTimeRangeOverlapping,
};
