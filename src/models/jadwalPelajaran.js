import db from "../config/db.js";

const scheduleSelects = [
  "jp.id",
  "jp.teacherSubjectId",
  "jp.semesterId",
  "jp.hari",
  "jp.jamMulai",
  "jp.jamSelesai",
  "jp.ruangan",
  "jp.createdAt",
  "jp.updatedAt",
  "ts.kelasId as kelasId",
  "ts.subjectId as subjectId",
  "ts.teacherId as teacherId",
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
    .leftJoin("teacher_subjects as ts", "jp.teacherSubjectId", "ts.id")
    .leftJoin("classes as c", "ts.kelasId", "c.id")
    .leftJoin("subjects as s", "ts.subjectId", "s.id")
    .leftJoin("teachers as t", "ts.teacherId", "t.id")
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
  const teacherSubjectId = normalizeNumber(filters.teacherSubjectId);

  if (kelasId !== null) {
    query.where("ts.kelasId", kelasId);
  }

  if (teacherId !== null) {
    query.where("ts.teacherId", teacherId);
  }

  if (semesterId !== null) {
    query.where("jp.semesterId", semesterId);
  }

  if (filters.hari) {
    query.where("jp.hari", filters.hari);
  }

  if (teacherSubjectId !== null) {
    query.where("jp.teacherSubjectId", teacherSubjectId);
  }

  if (walikelasId !== null) {
    query.where("c.walikelasId", walikelasId);
  }

  return query;
};

const pickSchedulePayload = (data = {}) => {
  const payload = {};

  if (data.teacherSubjectId !== undefined)
    payload.teacherSubjectId = data.teacherSubjectId;
  if (data.semesterId !== undefined) payload.semesterId = data.semesterId;
  if (data.hari !== undefined) payload.hari = data.hari;
  if (data.jamMulai !== undefined) payload.jamMulai = data.jamMulai;
  if (data.jamSelesai !== undefined) payload.jamSelesai = data.jamSelesai;
  if (data.ruangan !== undefined) payload.ruangan = data.ruangan ?? null;

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
    .andWhere(field, value);

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
      "ts.kelasId",
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
      "ts.teacherId",
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

  if (
    payload.teacherSubjectId !== undefined &&
    payload.teacherSubjectId !== null
  ) {
    const teacherSubjectConflicts = await fetchConflictsForField(
      payload,
      "jp.teacherSubjectId",
      payload.teacherSubjectId,
      options
    );
    for (const conflict of teacherSubjectConflicts) {
      if (!seenIds.has(conflict.id)) {
        seenIds.add(conflict.id);
        conflicts.push({ ...conflict, conflictScope: "teacherSubject" });
      }
    }
  }

  return conflicts;
};

export const __testUtils = {
  parseTimeToMinutes,
  isTimeRangeOverlapping,
};
