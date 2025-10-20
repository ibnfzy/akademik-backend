import db from "../config/db.js";

// 🔹 Ambil semua prestasi
export const getAllAchievements = () => {
  return db("achievements").select(
    "id",
    "nama",
    "kategori",
    "tingkat",
    "tahun",
    "deskripsi",
    "createdAt",
    "updatedAt"
  );
};

// 🔹 Tambah prestasi baru
export const createAchievement = (data) => {
  return db("achievements")
    .insert({
      nama: data.nama,
      kategori: data.kategori,
      tingkat: data.tingkat,
      tahun: data.tahun,
      deskripsi: data.deskripsi,
      createdAt: db.fn.now(),
      updatedAt: db.fn.now(),
    })
    .returning([
      "id",
      "nama",
      "kategori",
      "tingkat",
      "tahun",
      "deskripsi",
      "createdAt",
      "updatedAt",
    ]);
};

// 🔹 Update prestasi
export const updateAchievement = (id, data) => {
  return db("achievements")
    .where({ id })
    .update({
      nama: data.nama,
      kategori: data.kategori,
      tingkat: data.tingkat,
      tahun: data.tahun,
      deskripsi: data.deskripsi,
      updatedAt: db.fn.now(),
    })
    .returning([
      "id",
      "nama",
      "kategori",
      "tingkat",
      "tahun",
      "deskripsi",
      "createdAt",
      "updatedAt",
    ]);
};

// 🔹 Hapus prestasi
export const deleteAchievement = (id) => {
  return db("achievements").where({ id }).del();
};
