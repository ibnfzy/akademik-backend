import db from "../config/db.js";

// 🔹 Ambil semua mata pelajaran + relasi teacherId & kelasId
export const getAllSubjects = () => {
  return db("subjects as s")
    .leftJoin("teacher_subjects as ts", "s.id", "ts.subjectId")
    .select("s.id", "s.nama", "s.kode", "ts.teacherId", "ts.kelasId");
};

// 🔹 Ambil 1 subject berdasarkan ID + teacherId & kelasId
export const getSubjectById = (id) => {
  return db("subjects as s")
    .leftJoin("teacher_subjects as ts", "s.id", "ts.subjectId")
    .select("s.id", "s.nama", "s.kode", "ts.teacherId", "ts.kelasId")
    .where("s.id", id)
    .first();
};

// 🔹 Buat subject baru + mapping ke teacher_subjects
export const createSubject = async (data) => {
  return db.transaction(async (trx) => {
    // Insert ke tabel subjects
    const [subjectId] = await trx("subjects").insert({
      nama: data.nama,
      kode: data.kode,
    });

    // Insert ke teacher_subjects untuk setiap kelas
    if (Array.isArray(data.kelasIds)) {
      for (const kelasId of data.kelasIds) {
        await trx("teacher_subjects").insert({
          subjectId: subjectId,
          teacherId: data.teacherId,
          kelasId,
        });
      }
    }

    const getSubjects = await trx("subjects").where({ id: subjectId }).first();

    return getSubjects;
  });
};

// 🔹 Update subject + mapping kelas
export const updateSubject = async (id, data) => {
  return db.transaction(async (trx) => {
    // Update data dasar subject
    await trx("subjects").where({ id }).update({
      nama: data.nama,
      kode: data.kode,
    });

    // Hapus relasi lama di teacher_subjects
    await trx("teacher_subjects").where({ subjectId: id }).del();

    // Insert ulang relasi
    if (Array.isArray(data.kelasIds)) {
      for (const kelasId of data.kelasIds) {
        await trx("teacher_subjects").insert({
          subjectId: id,
          teacherId: data.teacherId,
          kelasId,
        });
      }
    }

    return db("subjects").where({ id }).first();
  });
};

// 🔹 Hapus subject (termasuk relasi di teacher_subjects)
export const deleteSubject = async (id) => {
  await db("teacher_subjects").where({ subjectId: id }).del();
  return db("subjects").where({ id }).del();
};
