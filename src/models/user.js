import db from "../config/db.js";

// 🔹 Ambil semua user dengan detail role (siswa/guru/walikelas)
export const getAllUsers = async () => {
  return db("users as u")
    .leftJoin("students as st", "u.id", "st.userId")
    .leftJoin("teachers as t", "u.id", "t.userId")
    .select(
      "u.id",
      "u.username",
      db.raw(
        `CASE 
          WHEN u.role = 'siswa' THEN st.nama
          WHEN u.role IN ('guru','walikelas') THEN t.nama
          ELSE '-' END as nama`
      ),
      "u.role",
      "u.email",
      db.raw(
        `CASE 
          WHEN u.role = 'siswa' THEN st.kelasId
          ELSE NULL END as "kelasId"`
      ),
      "st.nisn",
      "t.nip",
      "u.createdAt",
      "u.password"
    )
    .orderBy("u.createdAt", "desc");
};

export const getAllUsersStats = async () => {
  return db("users as u").select("u.id", "u.role");
};

// 🔹 Ambil 1 user berdasarkan ID
export const getUserById = async (id) => {
  return db("users as u")
    .leftJoin("students as st", "u.id", "st.userId")
    .leftJoin("teachers as t", "u.id", "t.userId")
    .select(
      "u.id",
      "u.username",
      db.raw(
        `CASE 
          WHEN u.role = 'siswa' THEN st.nama
          WHEN u.role IN ('guru','walikelas') THEN t.nama
          ELSE '-' END as nama`
      ),
      "u.role",
      "u.email",
      db.raw(
        `CASE 
          WHEN u.role = 'siswa' THEN st.kelasId
          ELSE NULL END as "kelasId"`
      ),
      "st.nisn",
      "t.nip",
      "u.createdAt"
    )
    .where("u.id", id)
    .first();
};

// 🔹 Tambah user baru
export const createUser = async (data) => {
  const payload = { ...data };

  if (
    Object.prototype.hasOwnProperty.call(payload, "password") &&
    typeof payload.password === "string" &&
    payload.password.trim() === ""
  ) {
    delete payload.password;
  }

  const result = await db("users").insert(payload);
  const id = result.insertId || result[0]; // cover mysql & knex behavior
  return db("users").where({ id }).first();
};

// 🔹 Update user
export const updateUser = async (id, data) => {
  const payload = { ...data };

  if (
    Object.prototype.hasOwnProperty.call(payload, "password") &&
    typeof payload.password === "string" &&
    payload.password.trim() === ""
  ) {
    delete payload.password;
  }

  await db("users").where({ id }).update(payload);
  return db("users").where({ id }).first();
};

// 🔹 Hapus user
export const deleteUser = async (id) => {
  return db("users").where({ id }).del();
};
