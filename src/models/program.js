import db from "../config/db.js";

// 🔹 Ambil semua program studi
export const getAllPrograms = () => {
  return db("programs").select(
    "id",
    "nama",
    "deskripsi",
    "kepalaProgram",
    "createdAt",
    "updatedAt"
  );
};

// 🔹 Tambah program studi baru
export const createProgram = (data) => {
  return db("programs")
    .insert({
      nama: data.nama,
      deskripsi: data.deskripsi,
      kepalaProgram: data.kepalaProgram,
      createdAt: db.fn.now(),
      updatedAt: db.fn.now(),
    })
    .returning([
      "id",
      "nama",
      "deskripsi",
      "kepalaProgram",
      "createdAt",
      "updatedAt",
    ]);
};

// 🔹 Update program studi
export const updateProgram = (id, data) => {
  return db("programs")
    .where({ id })
    .update({
      nama: data.nama,
      deskripsi: data.deskripsi,
      kepalaProgram: data.kepalaProgram,
      updatedAt: db.fn.now(),
    })
    .returning([
      "id",
      "nama",
      "deskripsi",
      "kepalaProgram",
      "createdAt",
      "updatedAt",
    ]);
};

// 🔹 Hapus program studi
export const deleteProgram = (id) => {
  return db("programs").where({ id }).del();
};
