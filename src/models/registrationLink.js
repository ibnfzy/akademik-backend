import db from "../config/db.js";

// 🔹 Ambil semua link registrasi
export const getAllLinks = () => {
  return db("registration_links").select(
    "id",
    "nama",
    "link",
    "status",
    "deskripsi",
    "createdAt",
    "updatedAt"
  );
};

// 🔹 Tambah link registrasi baru
export const createLink = (data) => {
  return db("registration_links")
    .insert({
      nama: data.nama,
      link: data.link,
      status: "Aktif", // default saat dibuat
      deskripsi: data.deskripsi,
      createdAt: db.fn.now(),
      updatedAt: db.fn.now(),
    })
    .returning([
      "id",
      "nama",
      "link",
      "status",
      "deskripsi",
      "createdAt",
      "updatedAt",
    ]);
};

// 🔹 Update link registrasi
export const updateLink = (id, data) => {
  return db("registration_links")
    .where({ id })
    .update({
      nama: data.nama,
      link: data.link,
      status: data.status,
      deskripsi: data.deskripsi,
      updatedAt: db.fn.now(),
    })
    .returning([
      "id",
      "nama",
      "link",
      "status",
      "deskripsi",
      "createdAt",
      "updatedAt",
    ]);
};

// 🔹 Hapus link registrasi
export const deleteLink = (id) => {
  return db("registration_links").where({ id }).del();
};
