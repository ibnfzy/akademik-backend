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
