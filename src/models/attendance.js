import db from "../config/db.js";
import { getActiveSemester } from "./semesters.js";

const normalizeDate = (value) => {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    const error = new Error("Tanggal tidak valid");
    error.code = "INVALID_DATE";
    throw error;
  }

  return parsed;
};

const formatDateForQuery = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);

  const timezoneOffsetMs = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - timezoneOffsetMs);

  return localDate.toISOString().slice(0, 10);
};

const buildSemesterPayload = (semester) => {
  if (!semester) {
    return {};
  }

  return {
    semesterId: semester.id,
    tahunAjaran: semester.tahunAjaran,
    semester: semester.semester,
  };
};

const buildMissingAttendanceQuery = (dateString) => {
  return db("teacher_subjects as ts")
    .join("students as st", "st.kelasId", "ts.kelasId")
    .select(
      "st.id as studentId",
      "st.kelasId as kelasId",
      "ts.subjectId as subjectId",
      "ts.teacherId as teacherId"
    )
    .whereNotNull("ts.subjectId")
    .whereNotNull("ts.teacherId")
    .whereNotExists(function () {
      this.select(1)
        .from("attendance as a")
        .whereRaw("a.studentId = st.id")
        .andWhereRaw("a.subjectId = ts.subjectId")
        .andWhereRaw("a.teacherId = ts.teacherId")
        .andWhere("a.tanggal", dateString);
    })
    .groupBy("st.id", "st.kelasId", "ts.subjectId", "ts.teacherId");
};

export const markStudentsAbsentForDate = async (dateInput) => {
  const targetDate = normalizeDate(dateInput);
  const dateString = formatDateForQuery(targetDate);

  const semester = await getActiveSemester(targetDate);
  const semesterPayload = buildSemesterPayload(semester);

  return db.transaction(async (trx) => {
    const candidates = await buildMissingAttendanceQuery(dateString).transacting(trx);

    if (!candidates.length) {
      return {
        date: dateString,
        inserted: 0,
        semester: semesterPayload.semester ?? null,
        semesterId: semesterPayload.semesterId ?? null,
        tahunAjaran: semesterPayload.tahunAjaran ?? null,
      };
    }

    const payload = candidates.map((item) => ({
      studentId: item.studentId,
      kelasId: item.kelasId,
      subjectId: item.subjectId,
      teacherId: item.teacherId,
      tanggal: dateString,
      status: "alfa",
      keterangan: "Ditandai otomatis oleh sistem",
      ...semesterPayload,
    }));

    await trx("attendance").insert(payload);

    return {
      date: dateString,
      inserted: candidates.length,
      semester: semesterPayload.semester ?? null,
      semesterId: semesterPayload.semesterId ?? null,
      tahunAjaran: semesterPayload.tahunAjaran ?? null,
    };
  });
};
