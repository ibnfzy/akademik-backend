import db from "../config/db.js";

const baseSelect = [
  "ts.id",
  "ts.kelasId",
  "ts.subjectId",
  "ts.teacherId",
];

export const getTeacherSubjectsMap = async (ids = []) => {
  const query = db("teacher_subjects as ts").select(baseSelect);

  if (Array.isArray(ids) && ids.length > 0) {
    query.whereIn("ts.id", ids);
  }

  const rows = await query;

  return rows.reduce((acc, row) => {
    acc[row.id] = {
      id: row.id,
      kelasId: row.kelasId,
      subjectId: row.subjectId,
      teacherId: row.teacherId,
    };
    return acc;
  }, {});
};

export const getTeacherSubjectById = async (id) => {
  if (id === undefined || id === null) {
    return null;
  }

  const map = await getTeacherSubjectsMap([id]);
  return map[id] ?? null;
};

export const getTeacherSubjectClassRelations = async (filters = {}) => {
  const query = db("teacher_subjects as ts")
    .leftJoin("teachers as t", "ts.teacherId", "t.id")
    .leftJoin("subjects as s", "ts.subjectId", "s.id")
    .leftJoin("classes as c", "ts.kelasId", "c.id")
    .select(
      "ts.id",
      "ts.teacherId",
      "ts.subjectId",
      "ts.kelasId",
      "t.nama as teacherName",
      "s.nama as subjectName",
      "c.nama as className"
    );

  if (filters.teacherId !== undefined && filters.teacherId !== null) {
    query.where("ts.teacherId", filters.teacherId);
  }

  if (filters.subjectId !== undefined && filters.subjectId !== null) {
    query.where("ts.subjectId", filters.subjectId);
  }

  if (filters.kelasId !== undefined && filters.kelasId !== null) {
    query.where("ts.kelasId", filters.kelasId);
  }

  return query;
};
